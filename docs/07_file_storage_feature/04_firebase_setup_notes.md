# Firebase Storage 設定メモ

## 📝 Firebase Console での設定手順

### 1. Firebase Storage を有効化
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Storage」をクリック
4. 「始める」ボタンをクリック
5. セキュリティルールの初期設定を選択：
   - **テストモード**（開発中）: 30日間すべてのユーザーが読み書き可能
   - **本番モード**: 認証されたユーザーのみアクセス可能

### 2. ロケーション選択
- **推奨**: `asia-northeast1`（東京）
- 一度設定したら変更不可なので注意

### 3. セキュリティルールの設定

#### 開発用（テストモード）
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.time < timestamp.date(2025, 10, 5);
    }
  }
}
```

#### 本番用（推奨設定）
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 生徒ファイルへのアクセス制御
    match /students/{studentId}/files/{fileName} {
      // 読み取り：認証ユーザー全員（管理者と該当生徒）
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.uid == studentId);
      
      // 書き込み：管理者のみ、10MB制限
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin' &&
        request.resource.size < 10 * 1024 * 1024;
      
      // 削除：管理者のみ
      allow delete: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

### 4. Firestore セキュリティルールも更新

Firestore Rules タブで以下を追加：

```javascript
// files コレクションのルール
match /files/{fileId} {
  allow read: if request.auth != null && 
    (request.auth.token.role == 'admin' || 
     request.auth.uid == resource.data.studentId);
  
  allow create, update: if request.auth != null && 
    request.auth.token.role == 'admin';
  
  allow delete: if request.auth != null && 
    request.auth.token.role == 'admin';
}
```

## ⚠️ 注意事項

### 1. Storage バケット名の確認
`.env.local` ファイルの `VITE_FIREBASE_STORAGE_BUCKET` が正しく設定されているか確認：
```
VITE_FIREBASE_STORAGE_BUCKET=your-project-name.appspot.com
```

### 2. CORS設定（必要な場合）
異なるドメインからアクセスする場合は、CORS設定が必要：
```json
[
  {
    "origin": ["http://localhost:5175", "https://your-domain.com"],
    "method": ["GET", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

### 3. 使用量の監視
- Firebase Console > Storage > Usage でストレージ使用量を確認
- 無料枠: 5GB ストレージ、1GB/日 ダウンロード、20K/日 アップロード

### 4. ファイルの自動削除設定（オプション）
古いファイルを自動削除したい場合は、ライフサイクルルールを設定：
- Firebase Console > Storage > ルール > ライフサイクル
- 例：90日経過したファイルを自動削除

## 🔍 トラブルシューティング

### エラー: storage/unauthorized
- セキュリティルールを確認
- ユーザーが認証されているか確認
- カスタムクレームが正しく設定されているか確認

### エラー: storage/quota-exceeded
- 無料枠を超過している可能性
- Firebase Console で使用量を確認
- 必要に応じて Blaze プランにアップグレード

### エラー: storage/object-not-found
- ファイルが削除されている
- パスが間違っている
- Storage と Firestore の同期が取れていない

## 📚 参考リンク
- [Firebase Storage ドキュメント](https://firebase.google.com/docs/storage)
- [Security Rules ガイド](https://firebase.google.com/docs/storage/security)
- [料金計算ツール](https://firebase.google.com/pricing)