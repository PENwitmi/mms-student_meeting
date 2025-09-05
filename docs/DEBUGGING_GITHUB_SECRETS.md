# GitHub Secrets デバッグガイド

## 現在の問題
GitHub Pagesにデプロイされたアプリケーションで`Firebase: Error (auth/invalid-api-key)`エラーが発生しています。
これはGitHub ActionsビルドプロセスでFirebase設定の環境変数が正しく渡されていないことが原因です。

## デバッグステップを追加しました

### 1. GitHub Actionsのログを確認
1. https://github.com/PENwitmi/mms-student_meeting/actions にアクセス
2. 最新の「Deploy to GitHub Pages」ワークフローをクリック
3. 「build」ジョブをクリック
4. 「Debug Secrets」ステップを展開して出力を確認

### 2. 確認すべき内容

**期待される出力例:**
```
Checking if secrets are available...
API_KEY length: 39
AUTH_DOMAIN length: 35
PROJECT_ID: mms-student-meeting
First 5 chars of API_KEY: AIzaS...
```

**問題がある場合の出力例:**
```
Checking if secrets are available...
API_KEY length: 0
AUTH_DOMAIN length: 0
PROJECT_ID: 
First 5 chars of API_KEY: ...
```

## トラブルシューティング

### ケース1: Secretsが空の場合（長さが0）
**原因**: GitHub Secretsが正しく設定されていない

**解決方法**:
1. リポジトリのSettings → Secrets and variables → Actions
2. 各Secretの「Update」をクリック
3. 値を再入力（前後のスペースに注意）
4. 「Update secret」で保存

### ケース2: Secretsは存在するがビルドに反映されない
**原因**: キャッシュの問題、またはワークフローの権限

**解決方法**:
1. Actions → Deploy to GitHub Pages → 右上の「...」→「Re-run all jobs」
2. それでもダメな場合は、Settings → Actions → General → Workflow permissions
   - 「Read and write permissions」が選択されていることを確認

### ケース3: 特定のSecretだけが空
**原因**: Secret名のタイポ

**解決方法**:
Secretの名前が正確に以下と一致することを確認：
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 次のステップ

1. GitHub Actionsのログで「Debug Secrets」の出力を確認
2. 上記のトラブルシューティングに従って問題を特定
3. 必要に応じてSecretsを再設定
4. 修正後、任意のコミットをプッシュして再デプロイをトリガー

## 確認用コマンド

ローカルでビルドが正しく動作することを確認：
```bash
# .env.localの値を使用してビルド
npm run build

# distフォルダのJSファイルでAPIキーが含まれているか確認
grep -o "apiKey:\"[^\"]*\"" dist/assets/index-*.js | head -1
```

期待される出力: `apiKey:"AIzaSy..."`（実際のAPIキー）
問題がある場合: `apiKey:""`（空）

## デバッグ後の対応

問題が解決したら、デバッグステップは削除してください：
1. `.github/workflows/deploy.yml`を編集
2. 「Debug Secrets」ステップ全体を削除
3. コミット＆プッシュ

これによりセキュリティを保ちながら正常な運用に戻せます。