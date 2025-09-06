# HEIC→JPEG 自動変換機能 実装完了

## 実装日時
2025-09-06 14:10 JST

## 実装内容

### Firebase Functions
- **関数名**: `convertHeicToJpeg`
- **リージョン**: asia-northeast2（大阪）
- **メモリ**: 512MB
- **タイムアウト**: 120秒
- **トリガー**: Storage onFinalize

### 処理フロー
1. HEICファイルがアップロードされると自動トリガー
2. heic-convert + Sharp ライブラリでJPEGに変換（品質90%）
3. 変換済みファイルをStorageに保存
4. FirestoreのFileRecordを更新（リトライ機能付き）
   - convertedFileName
   - convertedFileUrl
   - convertedAt

### クライアント側の対応
- HEICファイルクリック時、変換済みJPEGがあればそちらを表示
- ステータス表示
  - ✅ JPEG変換済み: 変換完了
  - ⏳ JPEG変換中...: 変換処理待ち

## 修正した問題
### ファイル名不一致問題（2025-09-06 解決）
- **原因**: StorageとFirestoreでファイル名形式が異なっていた
  - Storage: `1757139068749_IMG_9919.HEIC`（タイムスタンプ付き）
  - Firestore: `IMG_9919.HEIC`（タイムスタンプなし）
- **修正**: DataContext.tsxでFirestoreにタイムスタンプ付きファイル名を保存するよう修正

### 必要な権限（解決済み）
`mms-student-meeting@appspot.gserviceaccount.com` に以下の権限を付与：
- roles/storage.admin
- roles/datastore.user

## テスト方法
1. 管理者アカウントでログイン
2. 生徒のファイル管理画面でHEICファイルをアップロード
3. 約10-20秒待つと「⏳ JPEG変換中...」→「✅ JPEG変換済み」に変化
4. ファイルをクリックすると変換済みJPEGが表示

## パッケージ
- heic-convert: ^2.1.0
- sharp: ^0.34.3
- @types/sharp: ^0.31.1

## 処理時間
- 通常: 10-15秒
- 大きなファイル（10MB近く）: 20-30秒

## 注意事項
- 月100件まで無料枠内で運用可能
- HEICファイルは元ファイルも保持（削除しない）
- 変換済みファイル名: `{元ファイル名}_converted.jpg`
- Firestoreリトライ: 最大3回、2秒間隔で再試行