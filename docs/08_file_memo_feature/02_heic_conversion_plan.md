# HEIC→JPEG自動変換機能 開発計画書

## 概要
iPhoneで撮影されたHEIC/HEIF形式の画像をアップロード時に自動的にJPEGに変換し、
全ブラウザでプレビュー可能にする機能を実装する。

## 問題背景

### 現状の課題
- **ブラウザサポート状況**（2025年1月時点）
  - Safari 17.5+: サポート ✅
  - Chrome: 未サポート ❌
  - Firefox: 未サポート ❌
  - Edge: 未サポート ❌
- **結果**: HEIC ファイルがダウンロードになり、プレビュー不可

### ユーザー影響
- iPhone ユーザーの写真が直接プレビューできない
- ファイル内容確認に都度ダウンロードが必要
- 特に学生の作品写真等で不便

## 解決方針
**アップロード前のクライアント側変換**を採用

### 選定理由
1. **即座にプレビュー可能**（変換後は通常のJPEG）
2. **サーバー側処理不要**（Firebase Functions追加コスト回避）
3. **Storage容量削減**（JPEG圧縮により約50%削減）

## 技術選定

### ライブラリ比較

| ライブラリ | バージョン | サイズ | 特徴 |
|-----------|----------|--------|------|
| heic2any | 0.0.4 | 2.7MB | シンプル、更新停止 |
| heic-to | 1.2.2 | ~3MB | 最新libheif使用、活発 |

**選定**: `heic-to` （最新のlibheif 1.20.2使用、継続的更新）

## 実装設計

### アーキテクチャ
```
User selects HEIC file
    ↓
FileUpload component detects HEIC
    ↓
Convert to JPEG (heic-to library)
    ↓
Upload JPEG to Firebase Storage
    ↓
Display as normal image
```

### Context API 準拠設計
- **変換処理**: `src/shared/utils/imageUtils.ts`（純粋関数）
- **Firebase操作**: `DataContext` 内の `uploadFile` のまま
- **UI処理**: `FileUpload.tsx` で変換実行

## 実装計画

### Phase 1: 依存関係追加
```bash
npm install heic-to
```

### Phase 2: 変換ユーティリティ作成
**新規ファイル**: `src/shared/utils/imageUtils.ts`

```typescript
import { isHeic, heicTo } from 'heic-to';

export async function convertHeicToJpeg(file: File): Promise<File> {
  // 1. HEIC判定
  if (!await isHeic(file)) {
    return file;  // HEICでなければそのまま返す
  }
  
  // 2. JPEG変換
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.9  // 品質90%
  });
  
  // 3. File オブジェクト作成
  const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([jpegBlob], fileName, { 
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}
```

### Phase 3: FileUpload コンポーネント改修
**既存ファイル**: `src/features/files/FileUpload.tsx`

```typescript
// handleFileSelect 改修
const handleFileSelect = async (selectedFile: File) => {
  setError(null);
  setConverting(true);  // 変換中フラグ
  
  try {
    // HEIC→JPEG変換（必要な場合のみ）
    const processedFile = await convertHeicToJpeg(selectedFile);
    
    // サイズチェック
    if (processedFile.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }
    
    setFile(processedFile);
  } catch (error) {
    setError('画像の処理に失敗しました');
  } finally {
    setConverting(false);
  }
};
```

### Phase 4: UI フィードバック追加
- 変換中インジケーター表示
- 「HEIC→JPEG変換中...」メッセージ
- 変換完了通知

## 実装タスクリスト

1. **環境準備** (10分)
   - heic-to パッケージインストール
   - TypeScript型定義確認

2. **変換ユーティリティ** (20分)
   - imageUtils.ts 作成
   - エラーハンドリング実装

3. **FileUpload改修** (30分)
   - 変換処理統合
   - 進捗表示追加

4. **UI調整** (20分)
   - 変換中表示
   - エラーメッセージ

5. **テスト** (20分)
   - HEIC ファイルアップロード
   - 通常画像の動作確認
   - エラーケース確認

**総見積時間**: 約1.5時間

## パフォーマンス考慮

### 変換処理の特性
- **処理時間**: 5MB画像で約2-3秒
- **メモリ使用**: 一時的に元サイズの2-3倍
- **CPU負荷**: 中程度（Web Worker利用）

### 最適化方針
1. **非同期処理**で UI ブロッキング回避
2. **進捗表示**でユーザー体験向上
3. **エラー時**は元ファイルを維持

## セキュリティ考慮
- クライアント側処理のため、悪意あるファイルのリスク最小
- 変換後も通常の画像検証実施
- メタデータは削除される（プライバシー向上）

## 制限事項と対策

| 制限 | 対策 |
|------|------|
| 古いブラウザで動作しない | 事前にブラウザ互換性チェック |
| 大きいファイルで遅延 | 進捗表示とキャンセル可能に |
| 変換失敗の可能性 | 元ファイルアップロードへフォールバック |

## 成功基準
- ✅ HEIC ファイルが全ブラウザでプレビュー可能
- ✅ 変換処理中の適切なフィードバック
- ✅ 通常画像の動作に影響なし
- ✅ エラー時の適切な処理

## 将来の改善案
1. **バックグラウンド変換**: Service Worker活用
2. **バッチ変換**: 複数ファイル同時処理
3. **形式選択**: PNG/WebP への変換オプション
4. **品質設定**: ユーザーが圧縮率選択

## 参考資料
- [heic-to GitHub](https://github.com/hoppergee/heic-to)
- [Can I Use: HEIF](https://caniuse.com/heif)
- [libheif Project](https://github.com/strukturag/libheif)