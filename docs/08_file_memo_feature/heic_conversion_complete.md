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
2. Sharp ライブラリでJPEGに変換（品質90%）
3. 変換済みファイルをStorageに保存
4. FirestoreのFileRecordを更新
   - convertedFileName
   - convertedFileUrl
   - convertedAt

### クライアント側の対応
- HEICファイルクリック時、変換済みJPEGがあればそちらを表示
- ステータス表示
  - ✅ 変換済み: 変換完了
  - ⏳ 変換中: 変換処理待ち

## 必要な権限（解決済み）
`813418893820-compute@developer.gserviceaccount.com` に以下の権限を付与：
- roles/artifactregistry.writer
- roles/logging.logWriter
- roles/storage.objectAdmin

## テスト方法
1. 管理者アカウントでログイン
2. 生徒のファイル管理画面でHEICファイルをアップロード
3. 数秒待つと「⏳ 変換中」→「✅ 変換済み」に変化
4. ファイルをクリックすると変換済みJPEGが表示

## パッケージ
- sharp: ^0.34.3
- @types/sharp: ^0.31.1

## 注意事項
- 月100件まで無料枠内で運用可能
- HEICファイルは元ファイルも保持（削除しない）
- 変換済みファイル名: `{元ファイル名}_converted.jpg`