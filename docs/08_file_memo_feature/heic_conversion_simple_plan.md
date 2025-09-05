# Firebase Functions HEIC変換 実装計画（YAGNI準拠）

## 実装内容
HEICファイルをFirebase Functionsで自動的にJPEGに変換する最小限の機能

## 実装手順（約2時間）

### 1. Firebase Functions初期化（15分）
```bash
firebase init functions
cd functions
npm install sharp
```

### 2. 変換関数作成（30分）
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as sharp from 'sharp';

export const convertHeicToJpeg = functions
  .region('asia-northeast2')
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    
    // HEICファイル以外はスキップ
    if (!filePath?.match(/\.heic$/i)) return null;
    
    // ダウンロード→変換→アップロード
    const bucket = admin.storage().bucket();
    const tempFile = `/tmp/${Date.now()}.heic`;
    const jpegPath = filePath.replace(/\.heic$/i, '.jpg');
    
    await bucket.file(filePath).download({ destination: tempFile });
    await sharp(tempFile).jpeg({ quality: 90 }).toFile(tempFile + '.jpg');
    await bucket.upload(tempFile + '.jpg', { destination: jpegPath });
    
    return { success: true };
  });
```

### 3. クライアント側修正（15分）
```typescript
// FileList.tsx - 表示URLの選択
const getDisplayUrl = (file: FileRecord) => {
  // .heicファイルの場合は.jpgを探す
  if (file.fileName.match(/\.heic$/i)) {
    return file.fileUrl.replace(/\.heic$/i, '.jpg');
  }
  return file.fileUrl;
};
```

### 4. デプロイ（10分）
```bash
firebase deploy --only functions
```

## コスト
- 月100枚まで完全無料（実使用量は月10枚程度の想定）

## 実装しないこと
- エラーハンドリングの詳細設計（基本的なtry-catchのみ）
- 変換ステータス管理（不要）
- サムネイル生成（将来の要件）
- 詳細なログ記録（標準のconsole.logのみ）
- テストシナリオ文書（手動確認のみ）

## 完了基準
- HEICファイルアップロード後、JPEGが自動生成される
- ブラウザでプレビュー可能になる

以上