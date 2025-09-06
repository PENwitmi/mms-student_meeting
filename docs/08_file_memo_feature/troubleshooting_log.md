# HEIC→JPEG変換機能 トラブルシューティングログ

## 実装期間
2025-09-06 13:00 - 19:15 JST

## 問題の概要
HEICファイルをFirebase Functionsで自動的にJPEGに変換する機能の実装で、複数の問題が連鎖的に発生した。

## 発生した問題と解決策（時系列）

### 問題1: Sharp ライブラリがHEICをサポートしていない（13:30）
**症状**: 
```
Error: heif: Error while loading plugin: Support for this compression format has not been built in
```

**原因**: 
- SharpライブラリはFirebase Functions環境でHEIC/HEIFフォーマットをネイティブサポートしていない

**解決策**:
- `heic-convert`パッケージを追加インストール
- HEICをバッファに変換してからSharpで最適化する2段階処理に変更

```javascript
const heicConvert = require('heic-convert');
const inputBuffer = await fs.promises.readFile(tempFilePath);
const outputBuffer = await heicConvert({
  buffer: inputBuffer,
  format: 'JPEG',
  quality: 0.9
});
await sharp(outputBuffer).jpeg({quality: 90}).toFile(tempJpegPath);
```

---

### 問題2: ファイル名の不一致（14:00）
**症状**: 
- Firebase Functionsログ: `Firestore query result: empty`
- Firestoreでファイルドキュメントが見つからない

**原因**:
- **Storage**: `1757139286030_IMG_9930.HEIC`（タイムスタンプ付き）
- **Firestore**: `IMG_9930.HEIC`（タイムスタンプなし）
- DataContext.tsxでFirestoreに保存する際、`file.name`（元のファイル名）を使用していた

**解決策**:
```javascript
// src/contexts/DataContext.tsx
// 修正前
await addDoc(collection(db, 'files'), {
  fileName: file.name,  // これが問題
  
// 修正後
await addDoc(collection(db, 'files'), {
  fileName,  // タイムスタンプ付きのファイル名を使用
```

---

### 問題3: Firestore権限エラー（14:30）
**症状**:
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**原因**:
- デフォルトサービスアカウント`mms-student-meeting@appspot.gserviceaccount.com`にFirestoreアクセス権限がない

**解決策**:
```bash
gcloud projects add-iam-policy-binding mms-student-meeting \
  --member="serviceAccount:mms-student-meeting@appspot.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

### 問題4: 署名付きURL生成エラー（15:00）
**症状**:
```
Error: Permission 'iam.serviceAccounts.signBlob' denied on resource
```

**原因**:
- getSignedUrl()メソッドがサービスアカウントの署名権限を必要とする

**初回対策（失敗）**:
- `roles/iam.serviceAccountTokenCreator`権限を付与
- しかし権限エラーが解決しない

**暫定対策**:
- パブリックURLに切り替え（`makePublic()`使用）

---

### 問題5: バケット名がundefined（16:00）
**症状**:
- 生成されたURL: `https://storage.googleapis.com/undefined/students/...`

**原因**:
```javascript
const bucket = admin.storage().bucket();
// bucket.name が undefined を返す
```

**解決策**:
```javascript
const bucketName = 'mms-student-meeting.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);
```

---

### 問題6: 統一バケットレベルアクセス（最終問題）（18:30）
**症状**:
```xml
<Error>
  <Code>AccessDenied</Code>
  <Message>Access denied.</Message>
  <Details>Anonymous caller does not have storage.objects.get access</Details>
</Error>
```

**ログメッセージ**:
```
Cannot update access control for an object when uniform bucket-level access is enabled
```

**原因**:
- Firebase Storageで「統一バケットレベルアクセス」が有効
- 個別ファイルのACL設定（makePublic()）が不可能
- パブリックURLではアクセス不可

**最終解決策**:
Firebase標準のダウンロードトークンベースのURLを生成

```javascript
// 変換済みファイルのメタデータを取得してURLを構築
const convertedFile = bucket.file(jpegFilePath);
const [metadata] = await convertedFile.getMetadata();
const token = metadata.metadata?.firebaseStorageDownloadTokens || 
             require('crypto').randomUUID();

// トークンがない場合は設定
if (!metadata.metadata?.firebaseStorageDownloadTokens) {
  await convertedFile.setMetadata({
    metadata: {
      firebaseStorageDownloadTokens: token
    }
  });
}

// Firebase Storage形式のダウンロードURLを生成
const convertedFileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(jpegFilePath)}?alt=media&token=${token}`;
```

---

## 教訓と今後の注意点

### 1. Firebase Storageのアクセス制御を理解する
- **統一バケットレベルアクセス**が有効な場合、個別ファイルのACL設定は不可
- ダウンロードトークンベースのURLを使用する必要がある
- `makePublic()`は使用できない

### 2. ファイル名の一貫性を保つ
- Storageに保存するファイル名とFirestoreに記録するファイル名は必ず一致させる
- タイムスタンプ付きファイル名を使用する場合は、全ての場所で統一する

### 3. 権限設定の包括的な確認
Firebase Functionsに必要な権限：
- `roles/storage.admin` - Storage操作
- `roles/datastore.user` - Firestore操作
- `roles/logging.logWriter` - ログ書き込み

### 4. ライブラリの制限事項を事前調査
- SharpはFirebase Functions環境でHEICをネイティブサポートしない
- 代替ライブラリ（heic-convert）との組み合わせが必要

### 5. エラーログの詳細確認
- 単に「権限エラー」で片付けず、具体的なエラーメッセージを確認
- 「uniform bucket-level access」のような重要な情報を見逃さない

### 6. 段階的なデバッグ
1. まずローカルでの動作確認
2. Firebase Functionsのログで各ステップの成功/失敗を確認
3. 権限、設定、コードの順で問題を切り分ける

## 最終的な成功構成

### パッケージ
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^6.1.0",
    "heic-convert": "^2.1.0",
    "sharp": "^0.34.3"
  }
}
```

### 処理フロー
1. HEICファイルアップロード検知
2. heic-convertでJPEGバッファに変換
3. SharpでJPEG最適化
4. ダウンロードトークン付きでStorage保存
5. FirestoreにトークンベースのURLを記録

### 処理時間
- 通常: 10-15秒
- 大きなファイル: 20-30秒

## 所要時間
- 総作業時間: 約6時間15分
- 問題解決に要した時間の内訳:
  - Sharp/HEIC問題: 30分
  - ファイル名不一致: 1時間
  - 権限関連: 2時間
  - URL生成問題: 2時間45分