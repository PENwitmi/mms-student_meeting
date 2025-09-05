# Firestore代替案（無料プランでのファイル管理）

## 概要
Firebase Storageが使用できない場合、FirestoreにBase64エンコードしたファイルを保存する代替案。

## 制限事項
- **ファイルサイズ上限: 1MB**（Firestoreドキュメントサイズ制限）
- 画像は圧縮が必要
- PDFは小さいものに限定

## 実装概要

### 1. ファイルをBase64に変換
```typescript
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
```

### 2. Firestoreに保存
```typescript
// filesコレクションに保存
await addDoc(collection(db, 'files'), {
  fileName: file.name,
  fileData: base64String, // Base64エンコードされたデータ
  fileType: file.type,
  fileSize: file.size,
  studentId,
  studentName,
  uploadedBy: currentUser.uid,
  createdAt: serverTimestamp()
});
```

### 3. 画像圧縮（必須）
```typescript
const compressImage = async (file: File): Promise<File> => {
  // Canvas APIを使用して画像を圧縮
  // 最大幅/高さを800pxに制限
  // JPEG品質を0.7に設定
};
```

## メリット
- 追加料金なし
- 実装がシンプル
- Firestoreの既存セキュリティルールを活用

## デメリット
- ファイルサイズが1MBに制限
- パフォーマンスが低下（Base64は33%サイズ増加）
- 大きなPDFは扱えない

## 推奨
小規模なMVPなら実用的だが、本番環境ではBlazeプラン＋Storage推奨。