# ファイル保存機能 MVP実装計画

## 📋 MVP スコープ

### 実装する機能
✅ 管理者によるファイルアップロード（PDF、画像）
✅ 生徒ごとのファイル管理
✅ ファイル一覧表示
✅ ファイル削除（管理者のみ）
✅ シンプルなプレビュー（新規タブで開く）

### 実装しない機能（後回し）
❌ 生徒からのアップロード
❌ 生徒間共有
❌ バージョン管理
❌ 通知機能
❌ 高度なプレビュー（ブラウザ内表示）
❌ ファイルカテゴリー分類

## 🎯 シンプルなデータモデル

```typescript
interface FileRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  
  // Relations
  studentId: string;
  studentName: string;
  
  // Metadata
  uploadedBy: string;  // 管理者のUID
  createdAt: Date;
}
```

## 📁 最小限のファイル構造

```
src/
├── lib/firebase/
│   └── storage.ts         # 追加
├── contexts/
│   └── DataContext.tsx    # ファイル機能追加
└── features/
    └── files/             # 新規作成
        ├── FileUpload.tsx
        └── FileList.tsx
```

## 🚀 実装手順

### Step 1: Firebase Storage 有効化
1. Firebase Console → Storage
2. 「始める」をクリック
3. テストモードで開始
4. asia-northeast1 を選択

### Step 2: 基本的なアップロード機能
- 管理者ダッシュボードにアップロードボタン追加
- ファイル選択ダイアログ
- Firebase Storage へアップロード
- Firestore にメタデータ保存

### Step 3: ファイルリスト表示
- 生徒ごとのファイル一覧
- ファイル名、サイズ、日付表示
- クリックで新規タブで開く

### Step 4: 削除機能
- 管理者のみ削除ボタン表示
- Storage とFirestore から削除

## 📱 iPhone写真対応

```typescript
// ファイル選択時の設定
<input 
  type="file"
  accept="image/*,application/pdf"  // HEIC/HEIFも含む
  multiple
/>

// ファイルタイプ確認
const supportedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp'
];
```

## ⏱️ 実装時間見積もり
- Firebase Storage設定: 30分
- アップロード機能: 1時間
- リスト表示: 1時間
- 削除機能: 30分
- **合計: 約3時間**

## 🔒 シンプルなセキュリティルール

```javascript
// Storage Rules (MVP版)
match /students/{studentId}/files/{fileName} {
  // 読み取り：認証ユーザー全員
  allow read: if request.auth != null;
  
  // 書き込み・削除：管理者のみ
  allow write, delete: if request.auth != null && 
    request.auth.token.role == 'admin';
}
```

## ✅ 成功基準
1. 管理者がファイルをアップロードできる
2. アップロードしたファイルが一覧に表示される
3. ファイルをクリックすると新規タブで開く
4. 管理者がファイルを削除できる
5. iPhoneで撮影した写真もアップロードできる