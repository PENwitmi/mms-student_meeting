# GitHub Pages デプロイ設定ガイド

## 作成日: 2025-09-05

## 概要
MMS Student Meeting System を GitHub Pages でホスティングするための設定を完了しました。

## 実装内容

### 1. Vite設定の更新
```javascript
// vite.config.ts
base: '/mms-student_meeting/', // リポジトリ名をbaseパスに設定
```

### 2. デプロイメントスクリプト
```json
// package.json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### 3. GitHub Actions ワークフロー
`.github/workflows/deploy.yml` を作成し、mainブランチへのプッシュ時に自動デプロイ。

## セットアップ手順

### 初回設定

1. **GitHub リポジトリの設定**
   - Settings → Pages
   - Source: "GitHub Actions" を選択

2. **GitHub Secrets の設定**
   Repository Settings → Secrets and variables → Actions で以下を追加:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

3. **手動デプロイ（必要な場合）**
   ```bash
   npm run deploy
   ```

### 自動デプロイ
mainブランチへのプッシュ時に自動的にGitHub Actionsが実行され、デプロイされます。

## アクセスURL
https://PENwitmi.github.io/mms-student_meeting/

## 注意事項

### SPAルーティング対応
- GitHub PagesはSPAのクライアントサイドルーティングをネイティブサポートしていない
- 直接URLアクセスやページリロード時に404エラーが発生する可能性あり
- 必要に応じて404.htmlのリダイレクト処理を実装することを検討

### ビルドサイズ
- 現在のビルドサイズ: 743KB（警告レベル）
- 今後の最適化案:
  - Dynamic imports によるコード分割
  - Firebase SDKの選択的インポート
  - Tree shaking の最適化

### セキュリティ
- Firebase設定値はGitHub Secretsで管理
- 本番環境のセキュリティルールを適切に設定すること

## トラブルシューティング

### デプロイが失敗する場合
1. GitHub Secretsが正しく設定されているか確認
2. GitHub Actions の実行ログを確認
3. ビルドエラーがないかローカルで確認: `npm run build`

### ページが表示されない場合
1. GitHub Pages が有効になっているか確認
2. baseパスが正しく設定されているか確認
3. ビルド成果物が正しく生成されているか確認

## 関連ファイル
- `/vite.config.ts` - Vite設定
- `/package.json` - デプロイスクリプト
- `/.github/workflows/deploy.yml` - GitHub Actions設定