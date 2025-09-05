# 面談記録システム（LMS - Learning Management System）

**プロジェクト開始日**: 2025-09-05  
**現在フェーズ**: 開発環境セットアップ完了

## 📝 プロジェクト概要

週次面談の記録・管理を行う学習管理システムのMVP開発プロジェクト。  
MMS Financeプロジェクトの実証済みアーキテクチャを基盤として、高品質なシステムを構築します。

## 🎯 MVP スコープ

### 実装する機能
- ✅ 管理者による面談記録の作成・編集・削除
- ✅ 生徒による自分の面談記録閲覧
- ✅ Firebase Authentication による認証
- ✅ Context APIによるデータ管理

### 実装しない機能（将来拡張）
- ❌ 講師・保護者アカウント
- ❌ 成績管理・日報システム
- ❌ 学習時間トラッキング

## 📂 ドキュメント構成

### docs/mvp/
MVP実装に必要な現在の設計ドキュメント：

| ドキュメント | 内容 | 優先度 |
|-------------|------|--------|
| [mvp-requirements.md](docs/mvp/mvp-requirements.md) | MVP要件定義 | 🔥 必須 |
| [mvp-implementation-plan.md](docs/mvp/mvp-implementation-plan.md) | 8日間の実装計画 | 🔥 必須 |
| [mvp-technical-architecture.md](docs/mvp/mvp-technical-architecture.md) | 技術アーキテクチャ詳細 | 🔥 必須 |
| [mvp-data-model.md](docs/mvp/mvp-data-model.md) | Firestoreデータモデル | 🔥 必須 |
| [mvp-architecture-principles.md](docs/mvp/mvp-architecture-principles.md) | アーキテクチャ原則 | 🔥 必須 |

### docs/initial_design/
初期構想と開発原則：
- `interview-recording-system-concept.md` - 最初のコンセプト
- `system-complete-design.md` - 拡張機能を含む完全設計
- `development-principles.md` - SOLID, KISS, YAGNI, DRY原則

### docs/archive/
将来の拡張用詳細設計：
- `data-model-design.md` - 全機能対応のデータモデル
- `technical-architecture.md` - 包括的な技術設計

## 🏗️ アーキテクチャ原則

### 🎯 絶対原則（MMS Finance準拠）
1. **onSnapshotはすべてDataContext経由**
2. **Firebaseアクセスはcontexts/層のみ**
3. **features/層はFirebase直接アクセス禁止**

### 📁 ディレクトリ構造
```
src/
├── contexts/           # Firebase接続層（唯一の接続点）
│   └── hooks/
│       ├── realtime/  # onSnapshot使用
│       └── query/     # getDocs使用
├── features/          # ビジネスロジック（Firebase禁止）
└── lib/firebase/      # 初期化と認証
```

## 🚀 開発コマンド

### 開発サーバー起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

### リント
```bash
npm run lint
```

## 🔧 技術スタック

- **Frontend**: React 18 + TypeScript 5 + Vite 5
- **Backend**: Firebase (Firestore, Authentication)
- **State**: Context API (MMS Financeパターン)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

## 📊 パフォーマンス目標

- Firebase読み取り回数: 最小化（Context内で1回のみ）
- ページロード時間: 3秒以内
- エラー率: 1%未満

## 📝 開発ガイドライン

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
```

### レビューチェックリスト
- [ ] Firebase アクセスはcontexts/層のみか？
- [ ] 不要な機能を追加していないか？（YAGNI）
- [ ] コードはシンプルか？（KISS）
- [ ] 重複コードはないか？（DRY）

## 📞 お問い合わせ

プロジェクトに関する質問は、まず以下のドキュメントを確認してください：
1. [mvp-requirements.md](docs/mvp/mvp-requirements.md) - 要件について
2. [mvp-technical-architecture.md](docs/mvp/mvp-technical-architecture.md) - 技術的な質問
3. [mvp-architecture-principles.md](docs/mvp/mvp-architecture-principles.md) - アーキテクチャの原則

---

**最終更新**: 2025-09-05  
**ステータス**: 開発環境セットアップ完了