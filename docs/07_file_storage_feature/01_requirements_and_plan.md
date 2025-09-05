# ファイル保存機能 - 要件定義と開発計画

## 📋 概要
MMS Student Meeting Systemにファイル管理機能を追加し、PDFや画像などのファイルをユーザーアカウントに紐づけて保存・閲覧できるようにする。

## 🎯 目的
- 生徒の成績表、テスト結果、学習資料をシステム内で管理
- 面談時に必要な資料へのすばやいアクセス
- 学習履歴の一元管理

## 📝 機能要件

### 1. ファイルアップロード機能
- **対応ファイル形式**: PDF, JPG, PNG, DOCX
- **ファイルサイズ制限**: 10MB/ファイル
- **複数ファイル選択**: 可能（最大5ファイル同時）
- **ドラッグ&ドロップ**: 対応

### 2. ファイル管理
- **メタデータ管理**:
  - ファイル名
  - ファイルタイプ
  - サイズ
  - アップロード日時
  - アップロード者
  - 関連生徒ID
  - カテゴリー（成績表、テスト、宿題、その他）
  - 説明（任意）

### 3. 表示機能
- **リスト表示**:
  - 管理者: 全ファイル閲覧可能
  - 生徒: 自分に関連するファイルのみ
  - ソート機能（日付、名前、サイズ）
  - フィルター機能（カテゴリー、日付範囲）

### 4. プレビュー機能
- **PDF**: ブラウザ内表示（react-pdf使用）
- **画像**: モーダルで拡大表示
- **その他**: ダウンロードオプション提供

### 5. セキュリティ要件
- **アクセス制御**:
  - 認証必須
  - ロールベースアクセス（管理者/生徒）
  - Firebase Storage セキュリティルール設定
- **ファイル検証**:
  - ウイルススキャン（検討）
  - ファイルタイプ検証
  - サイズ制限チェック

## 🏗️ 技術設計

### データモデル
```typescript
interface FileRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;           // Firebase Storage URL
  category: FileCategory;
  description?: string;
  
  // Relations
  studentId: string;          // 関連する生徒
  uploadedBy: string;         // アップロードしたユーザーID
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

type FileCategory = 
  | 'grade_report'    // 成績表
  | 'test'           // テスト
  | 'homework'       // 宿題
  | 'other';         // その他
```

### ディレクトリ構造
```
src/
├── contexts/
│   └── hooks/
│       └── realtime/
│           └── useFiles.ts        # ファイル情報のリアルタイム取得
├── features/
│   └── files/
│       ├── components/
│       │   ├── FileUploadModal.tsx
│       │   ├── FileList.tsx
│       │   ├── FilePreview.tsx
│       │   └── FileListItem.tsx
│       ├── hooks/
│       │   └── useFileUpload.ts
│       └── types/
│           └── index.ts
└── lib/
    └── firebase/
        └── storage.ts             # Firebase Storage設定
```

### Firebase設定
1. **Firebase Storage有効化**
2. **Firestore Collections**:
   - `files`: ファイルメタデータ
3. **Storage Structure**:
   - `/students/{studentId}/files/{fileId}`

## 📅 開発計画

### Phase 1: 基盤構築（2-3時間）
- [ ] Firebase Storage設定
- [ ] Firestore `files` コレクション作成
- [ ] セキュリティルール設定
- [ ] DataContextにファイル関連機能追加

### Phase 2: アップロード機能（3-4時間）
- [ ] FileUploadModal コンポーネント作成
- [ ] ファイルアップロードフック実装
- [ ] メタデータ保存処理
- [ ] プログレス表示

### Phase 3: 表示機能（2-3時間）
- [ ] FileList コンポーネント作成
- [ ] useFiles フック実装
- [ ] ソート・フィルター機能
- [ ] ダッシュボード統合

### Phase 4: プレビュー機能（2-3時間）
- [ ] react-pdf導入
- [ ] FilePreview コンポーネント作成
- [ ] モーダル/ダイアログ実装
- [ ] ダウンロード機能

### Phase 5: テストと改善（1-2時間）
- [ ] エラーハンドリング
- [ ] ローディング状態
- [ ] ユーザーフィードバック
- [ ] パフォーマンス最適化

## 🚀 実装優先順位
1. **MVP実装**:
   - PDFアップロード
   - リスト表示
   - 簡易プレビュー（新規タブ）
   
2. **拡張機能**:
   - 高度なプレビュー
   - カテゴリー分類
   - 検索機能

## ⚠️ 考慮事項
- **ストレージコスト**: Firebase Storage使用量の監視
- **パフォーマンス**: 大量ファイル時のページネーション
- **GDPR/プライバシー**: 個人情報を含むファイルの取り扱い

## 📊 成功指標
- ファイルアップロード成功率 > 95%
- プレビュー表示時間 < 2秒
- ユーザー満足度向上

## 🔗 参考資料
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [react-pdf Library](https://github.com/wojtekmaj/react-pdf)
- [Firebase Security Rules](https://firebase.google.com/docs/storage/security)