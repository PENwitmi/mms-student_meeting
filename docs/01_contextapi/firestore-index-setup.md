# Firestoreインデックス設定ガイド

## 現在のエラー
複合クエリ（where + orderBy）にはFirestoreインデックスが必要です。

## インデックス作成方法

### 方法1: ブラウザコンソールから作成（推奨）
1. Chrome DevToolsを開く（F12）
2. Consoleタブを確認
3. エラーメッセージに含まれるURLをクリック
   ```
   The query requires an index. You can create it here:
   https://console.firebase.google.com/v1/r/project/mms-student-meeting/firestore/indexes?create_composite=...
   ```
4. Firebase Consoleが開いたら「インデックスを作成」をクリック
5. 作成完了まで数分待つ

### 方法2: Firebase Consoleから手動作成
1. [Firebase Console](https://console.firebase.google.com/project/mms-student-meeting/firestore/indexes)にアクセス
2. 「インデックスを作成」をクリック
3. 以下の設定を入力：

**インデックス1（学生用）**
- コレクションID: `interviews`
- フィールド1: `studentId` (昇順)
- フィールド2: `date` (降順)
- クエリスコープ: コレクション

**インデックス2（管理者用）**
- コレクションID: `interviews`
- フィールド1: `date` (降順)
- クエリスコープ: コレクション

### 方法3: Firebase CLIでデプロイ（要認証）
```bash
# ログイン
firebase login

# インデックスのみデプロイ
firebase deploy --only firestore:indexes
```

## 一時的な回避策（インデックス作成前）

useInterviews.tsのクエリを一時的に修正してソートを無効化：

```typescript
// 管理者用（orderByを削除）
q = query(
  collection(db, 'interviews')
);

// 学生用（orderByを削除）
q = query(
  collection(db, 'interviews'),
  where('studentId', '==', user.uid)
);
```

※データ取得後にクライアント側でソート：
```typescript
data.sort((a, b) => b.date.getTime() - a.date.getTime());
```

## インデックス作成の確認
- Firebase Console > Firestore > インデックス
- ステータスが「有効」になれば完了
- 作成には通常1-5分かかります

## トラブルシューティング

### エラーが続く場合
1. インデックスのビルドが完了しているか確認
2. フィールド名が一致しているか確認（`date` vs `interviewDate`）
3. ブラウザをリロード

### 権限エラーの場合
Firebase Consoleで以下を確認：
- プロジェクトへのアクセス権限
- Firestore Admin権限