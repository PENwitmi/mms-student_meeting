# HEIC変換機能 実装完了

## 実装内容
Firebase FunctionsでHEIC→JPEG自動変換機能を実装しました。

## セットアップ手順

### 1. Firebaseにログイン（ターミナルで実行）
```bash
firebase login
# mms-student-meetingプロジェクトにアクセス可能なGoogleアカウントでログイン
```

### 2. 依存関係インストール
```bash
cd functions
npm install
```

### 3. デプロイ
```bash
firebase deploy --only functions
```

## 仕様
- HEICファイルアップロード時に自動でJPEG変換
- 変換ファイル名: `{元ファイル名}_converted.jpg`
- 品質: 90%のプログレッシブJPEG
- リージョン: asia-northeast2（大阪）

## クライアント側対応
- FileList.tsxでHEICファイルの場合は自動的に変換済みJPEGを表示
- ユーザーは意識することなくプレビュー可能

## コスト
月100枚まで完全無料

## 実装ファイル
- `/functions/src/index.ts` - メイン変換関数
- `/src/features/files/FileList.tsx` - URL切り替えロジック