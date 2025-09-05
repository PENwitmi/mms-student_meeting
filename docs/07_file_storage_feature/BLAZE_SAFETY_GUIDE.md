# Blazeプラン安全運用ガイド

## 1. 初期設定（必須）

### 予算アラートの設定
1. [Firebase Console](https://console.firebase.google.com) → プロジェクト選択
2. 左下の歯車 → 「使用量と請求」
3. 「予算とアラートを作成」
4. 月額予算を設定（推奨: $5）
5. アラート閾値: 50%, 90%, 100%

### Google Cloud Consoleでの上限設定
1. [Google Cloud Console](https://console.cloud.google.com)
2. 「お支払い」→「予算とアラート」
3. アクションとして「プロジェクトの無効化」も設定可能

## 2. セキュリティルール（必須）

```javascript
// Storage セキュリティルール
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /students/{studentId}/files/{fileName} {
      // サイズ制限: 10MB
      allow write: if request.auth != null 
        && request.auth.token.role == 'admin'
        && request.resource.size < 10 * 1024 * 1024;
      
      // 読み取りは認証ユーザーのみ
      allow read: if request.auth != null;
    }
  }
}
```

## 3. 料金監視スクリプト

```javascript
// 日次使用量チェック（Cloud Functions）
exports.checkDailyUsage = functions.pubsub
  .schedule('every day 09:00')
  .onRun(async (context) => {
    // Firestoreの読み取り回数をチェック
    // Storageの使用量をチェック
    // 閾値超えたらアラート
  });
```

## 4. 開発時の注意事項

### ❌ やってはいけないこと
- onSnapshot内でのデータ更新（無限ループ）
- 大量ファイルの一括アップロード
- セキュリティルールなしでの公開

### ✅ 安全な開発方法
- ローカルエミュレータを活用
- stagingプロジェクトで先にテスト
- 使用量を日次で確認

## 5. 緊急時の対応

### もし使用量が急増したら
1. **即座に**: Firebase Console → Storage → 一時的に無効化
2. **調査**: ログで原因特定
3. **修正**: バグ修正またはセキュリティルール強化

## 6. 実際の料金例

### 小規模利用（このプロジェクト想定）
```
月間使用量:
- Storage: 1GB（無料枠: 5GB）
- ダウンロード: 500MB/日（無料枠: 1GB/日）  
- Firestore読み取り: 10,000回（無料枠: 50,000回）

料金: $0
```

### 中規模利用
```
月間使用量:
- Storage: 10GB（5GB超過分: $0.026/GB）
- ダウンロード: 2GB/日（1GB超過分: $0.12/GB）

料金: 約$4
```

## 7. 安心ポイント

- **Google/Firebaseは良心的**: AWSと違い、初心者への罠が少ない
- **無料枠が豊富**: 普通の使い方なら無料
- **予算アラート**: 設定すれば安心
- **いつでもダウングレード可能**: Sparkプランに戻せる

## まとめ

**予算アラートを$5で設定すれば、最悪でも$5以上請求されることはありません。**
通常使用なら完全無料枠内で収まります。