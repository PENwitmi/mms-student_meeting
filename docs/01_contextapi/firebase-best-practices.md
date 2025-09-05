# Firebase操作のベストプラクティス

## ⚠️ 重要な注意事項（MMS Financeの教訓）

### 1. onSnapshot内でのデータ更新は絶対禁止
```typescript
// ❌ 絶対にやってはいけない例
onSnapshot(query, (snapshot) => {
  snapshot.docs.forEach(doc => {
    // これは無限ループを引き起こす！
    updateDoc(doc.ref, { viewed: true });
  });
});
```

**理由**: onSnapshot内でデータを更新すると、その更新がまたonSnapshotをトリガーし、無限ループが発生します。MMS Financeで無料枠を超過した原因。

### 2. 正しいタイムスタンプの使用
```typescript
// ✅ 正しい: serverTimestamp()を使用
import { serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'interviews'), {
  ...data,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

// ❌ 避けるべき: ローカル時刻
await addDoc(collection(db, 'interviews'), {
  ...data,
  createdAt: new Date(), // サーバー時刻とズレる可能性
});
```

### 3. 適切なクエリ制限
```typescript
// ✅ 良い例: 必要な分だけ取得
const q = query(
  collection(db, 'interviews'),
  where('studentId', '==', studentId),
  orderBy('date', 'desc'),
  limit(20)  // 最新20件のみ
);

// ❌ 悪い例: 全データを取得
const q = query(
  collection(db, 'interviews'),
  orderBy('date', 'desc')
  // limitなしで全件取得してしまう
);
```

## データ構造の最適化

### 1. 非正規化の活用
```typescript
// ✅ 良い例: 必要な情報を含める
interface InterviewRecord {
  studentId: string;
  studentName: string;  // 名前も保存（参照を減らす）
  // ...
}

// ❌ 悪い例: 過度な正規化
interface InterviewRecord {
  studentId: string;  // 毎回usersコレクションを参照する必要
  // ...
}
```

### 2. 配列フィールドの扱い
```typescript
// ✅ 配列の更新はarrayUnion/arrayRemoveを使用
import { arrayUnion, arrayRemove } from 'firebase/firestore';

await updateDoc(doc(db, 'interviews', id), {
  topics: arrayUnion('新しいトピック')
});

// ❌ 配列全体を置き換え（同時編集で問題発生）
await updateDoc(doc(db, 'interviews', id), {
  topics: [...oldTopics, '新しいトピック']
});
```

## エラーハンドリング

### 1. 適切なエラーキャッチ
```typescript
const addInterview = async (data: InterviewInput) => {
  try {
    await addDoc(collection(db, 'interviews'), {
      ...data,
      createdAt: serverTimestamp()
    });
    dev.log('Interview', '面談記録作成成功');
  } catch (error) {
    dev.error('Interview', '面談記録作成失敗', error);
    
    // ユーザーフレンドリーなエラー処理
    if (error.code === 'permission-denied') {
      throw new Error('権限がありません');
    }
    throw error;
  }
};
```

### 2. オフライン対応
```typescript
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// オフライン検知
window.addEventListener('offline', () => {
  disableNetwork(db);
});

window.addEventListener('online', () => {
  enableNetwork(db);
});
```

## パフォーマンス最適化

### 1. 複合インデックスの設定
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "interviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 2. キャッシュの活用
```typescript
// 初回読み込み時はキャッシュを優先
const q = query(collection(db, 'interviews'));
const snapshot = await getDocs(q);

// キャッシュからの読み取りかチェック
snapshot.docs.forEach((doc) => {
  const fromCache = doc.metadata.fromCache;
  dev.log('Cache', `Document ${doc.id} from cache: ${fromCache}`);
});
```

### 3. バッチ処理の活用
```typescript
// ✅ 複数の更新はバッチで実行
const batch = writeBatch(db);

interviews.forEach(interview => {
  const ref = doc(db, 'interviews', interview.id);
  batch.update(ref, { reviewed: true });
});

await batch.commit();

// ❌ 個別に更新（遅い＆読み取り回数増加）
for (const interview of interviews) {
  await updateDoc(doc(db, 'interviews', interview.id), {
    reviewed: true
  });
}
```

## セキュリティルール

### 1. 必須フィールドの検証
```javascript
match /interviews/{document} {
  allow create: if request.auth != null 
    && request.resource.data.keys().hasAll(['studentId', 'date', 'notes'])
    && request.resource.data.studentId is string
    && request.resource.data.date is timestamp;
}
```

### 2. データサイズ制限
```javascript
match /interviews/{document} {
  allow create: if request.auth != null
    && request.resource.data.notes.size() < 10000; // 10KB制限
}
```

## 開発時の確認ポイント

### Firebase Console確認項目
1. **使用量モニタリング**
   - Firestore > 使用量タブ
   - 読み取り/書き込み/削除の回数確認
   - 1日の無料枠: 読み取り50,000回

2. **ルールのテスト**
   - Firestore > ルール > ルールプレイグラウンド
   - 各ロールでのアクセス確認

3. **インデックスエラー**
   - ブラウザコンソールにリンクが表示される
   - クリックして自動作成

### デバッグツール
```typescript
// 開発環境でFirebase操作をログ出力
if (import.meta.env.DEV) {
  import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
    // ローカルエミュレータに接続（オプション）
    // connectFirestoreEmulator(db, 'localhost', 8080);
  });
}

// Firebase操作のタイミングを可視化
const measureFirebaseOperation = async (
  operation: () => Promise<any>,
  operationName: string
) => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  dev.log('Performance', `${operationName}: ${end - start}ms`);
  return result;
};
```

## チェックリスト

### 実装前
- [ ] データ構造は適切に非正規化されているか
- [ ] 必要なインデックスは定義されているか
- [ ] セキュリティルールは適切か

### 実装時
- [ ] serverTimestamp()を使用しているか
- [ ] エラーハンドリングは適切か
- [ ] クエリにlimitが設定されているか
- [ ] onSnapshot内でデータ更新していないか

### 実装後
- [ ] Firebase Consoleで使用量を確認
- [ ] 異なるロールでテスト実施
- [ ] オフライン時の動作確認
- [ ] パフォーマンス測定

## トラブル時の対処法

### 1. 読み取り回数が異常に多い
- onSnapshotの設定箇所を確認
- useEffectのクリーンアップ確認
- 依存配列の見直し

### 2. データが更新されない
- Firestore Rulesの確認
- ネットワーク状態の確認
- キャッシュのクリア

### 3. パフォーマンスが遅い
- インデックスの確認
- クエリの最適化
- バッチ処理の検討