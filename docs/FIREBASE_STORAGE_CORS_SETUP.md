# Firebase Storage CORS設定ガイド

## 問題
GitHub Pages (https://penwitmi.github.io) からFirebase Storageへのアップロードが、CORSポリシーによってブロックされています。

## エラー内容
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://penwitmi.github.io' has been blocked by CORS policy
```

## 解決方法

### 方法1: Google Cloud SDK (gsutil) を使用した設定（推奨）

#### 1. Google Cloud SDKのインストール

**macOS:**
```bash
# Homebrewを使用
brew install --cask google-cloud-sdk

# または公式インストーラーを使用
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### 2. 初期化と認証
```bash
gcloud init
gcloud auth login
```

#### 3. プロジェクト設定
```bash
gcloud config set project mms-student-meeting
```

#### 4. CORS設定の適用
プロジェクトディレクトリで以下のコマンドを実行：
```bash
gsutil cors set cors.json gs://mms-student-meeting.appspot.com
```

#### 5. 設定確認
```bash
gsutil cors get gs://mms-student-meeting.appspot.com
```

### 方法2: Firebase Console経由での一時的な解決策

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. プロジェクト「mms-student-meeting」を選択
3. Storage → Rules
4. 以下のルールを適用（一時的に全アクセス許可）：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
      allow read: if true; // 読み取りは全許可（一時的）
    }
  }
}
```

**注意**: これはセキュリティリスクがあるため、一時的な解決策です。

### 作成済みのCORS設定ファイル (cors.json)

```json
[
  {
    "origin": [
      "http://localhost:5173",
      "http://localhost:5174", 
      "http://localhost:5175",
      "https://penwitmi.github.io",
      "https://mms-student-meeting.firebaseapp.com",
      "https://mms-student-meeting.web.app"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Content-Disposition", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

## 簡易的な一時対応

gsutilがインストールできない場合の一時的な対応として、`cors.json`を以下のように変更：

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Content-Disposition", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

**注意**: `"origin": ["*"]` は全てのオリジンを許可するため、セキュリティリスクがあります。本番環境では推奨されません。

## トラブルシューティング

### gsutilコマンドが見つからない場合
```bash
# PATHに追加されているか確認
echo $PATH | grep google-cloud-sdk

# 手動でPATHに追加
export PATH=$PATH:$HOME/google-cloud-sdk/bin
```

### 認証エラーの場合
```bash
# 再認証
gcloud auth application-default login
```

### プロジェクトIDエラーの場合
```bash
# プロジェクト一覧を確認
gcloud projects list

# 正しいプロジェクトを設定
gcloud config set project mms-student-meeting
```

## 実行手順（ユーザー向け）

1. **Google Cloud SDKをインストール**
   ```bash
   brew install --cask google-cloud-sdk
   ```

2. **認証とプロジェクト設定**
   ```bash
   gcloud auth login
   gcloud config set project mms-student-meeting
   ```

3. **CORS設定を適用**
   ```bash
   cd /Users/nishimototakashi/claude\ code/mms-student_meeting
   gsutil cors set cors.json gs://mms-student-meeting.appspot.com
   ```

4. **ブラウザでアップロード機能をテスト**
   - https://penwitmi.github.io/mms-student_meeting/ にアクセス
   - ファイルアップロードを試す

## 設定後の確認方法

1. ブラウザの開発者ツールでネットワークタブを開く
2. ファイルをアップロード
3. CORSエラーが消えていることを確認

## 注意事項

- CORS設定の変更は即座に反映されます
- 本番環境では具体的なオリジンを指定することを推奨
- `"origin": ["*"]`は開発時のみ使用してください