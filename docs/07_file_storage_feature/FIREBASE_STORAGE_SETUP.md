# Firebase Storage設定手順

## 重要: Firebase Storageが有効化されていない可能性

現在のエラー（CORSエラー）は、Firebase Storageが有効化されていない場合にも発生します。

## 1. Firebase Consoleでの確認手順

1. [Firebase Console](https://console.firebase.google.com)にアクセス
2. 正しいGoogleアカウントでログイン
3. `mms-student-meeting`プロジェクトを選択
4. 左メニューから「Storage」を選択

## 2. Firebase Storageの初期化

もし「開始」ボタンが表示されている場合：
1. 「開始」をクリック
2. セキュリティルールモードを選択（本番モード推奨）
3. ロケーションを選択（asia-northeast1 推奨）

## 3. Storage セキュリティルールの設定

Firebase Console > Storage > Rules タブで以下を設定：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /students/{studentId}/files/{fileName} {
      // 認証済みユーザーのみアクセス可能
      allow read: if request.auth != null;
      
      // 管理者のみアップロード・削除可能
      allow write: if request.auth != null 
        && request.auth.token.role == 'admin';
      
      // または、Firestoreのユーザー情報を確認する場合
      allow write: if request.auth != null
        && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 4. CORS設定の適用（必要な場合）

もしCORSエラーが続く場合、Google Cloud Shellを使用：

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. プロジェクトを選択
3. Cloud Shellを起動（右上のターミナルアイコン）
4. 以下のコマンドを実行：

```bash
# cors.jsonファイルを作成
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
EOF

# CORSを適用
gsutil cors set cors.json gs://mms-student-meeting.appspot.com
```

## 5. バケット名の確認

Firebase Console > Storage で表示される実際のバケット名を確認し、
`.env.local`の`VITE_FIREBASE_STORAGE_BUCKET`と一致していることを確認。

通常は `プロジェクトID.appspot.com` の形式。

## トラブルシューティング

### もしStorage bucketが異なる場合
Firebase ConsoleのStorage画面で表示されるバケット名（例: gs://xxx.appspot.com）を確認し、
`xxx.appspot.com`の部分を`.env.local`に設定。

### 権限エラーの場合
Firebase Console > Project Settings > Service accounts で、
正しいサービスアカウントが設定されているか確認。