# GitHub Secrets設定ガイド

## エラーの原因
本番環境（GitHub Pages）で`auth/invalid-api-key`エラーが発生しています。
これはGitHub ActionsでビルドするときにFirebase設定が環境変数として渡されていないためです。

## 解決方法: GitHub Secretsの設定

### 手順

1. **GitHubリポジトリにアクセス**
   - https://github.com/PENwitmi/mms-student_meeting

2. **Settings → Secrets and variables → Actions**
   - リポジトリのSettingsタブをクリック
   - 左メニューから「Secrets and variables」→「Actions」を選択

3. **以下の6つのSecretを追加**
   「New repository secret」ボタンをクリックして、以下を1つずつ追加：

   | Name | Value |
   |------|-------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyBRXD7GsrboISdLeMJidlA0Sn1oRepZ1U8` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `mms-student-meeting.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `mms-student-meeting` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `mms-student-meeting.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `813418893820` |
   | `VITE_FIREBASE_APP_ID` | `1:813418893820:web:0281b6b836d7df3ae06279` |

4. **再デプロイをトリガー**
   - mainブランチに何か変更をプッシュ、または
   - Actions → Deploy to GitHub Pages → Run workflow でmanual実行

## 確認方法

1. GitHub Actions の実行ログを確認
   - Actions タブで最新のワークフローを確認
   - Build ステップで環境変数が正しく設定されているか確認

2. 本番環境でアプリケーションが正常に動作することを確認
   - https://penwitmi.github.io/mms-student_meeting/

## セキュリティ上の注意

- これらのAPIキーはパブリック（クライアント側）で使用されるものです
- Firebase側でドメイン制限などのセキュリティルールを適切に設定してください
- Firestore/Storage のセキュリティルールで適切なアクセス制御を行ってください

## トラブルシューティング

エラーが解消しない場合：
1. Secretの名前が正確に一致しているか確認（大文字小文字も含めて）
2. 値の前後に余計なスペースが含まれていないか確認
3. GitHub Actionsのログでビルドエラーがないか確認