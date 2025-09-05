# DataContext実装ドキュメント

## 概要
MMS Student Meeting SystemにおけるDataContext実装に関する設計・実装ドキュメント群です。
MMS Financeで実証済みのパターンを適用し、Firebase読み取り回数を最小限に抑える実装を行います。

## ドキュメント一覧

### 1. [datacontext-implementation-plan.md](./datacontext-implementation-plan.md)
**実装計画書** - 全体的な設計と実装方針
- アーキテクチャ設計
- 型定義
- 実装ステップ
- コード例

### 2. [implementation-checklist.md](./implementation-checklist.md) 
**実装チェックリスト** - 実装時の具体的な作業項目
- フェーズごとのタスク
- 時間目安
- トラブルシューティング
- 完了基準

### 3. [firebase-best-practices.md](./firebase-best-practices.md)
**Firebaseベストプラクティス** - 注意点とアンチパターン
- MMS Financeの教訓
- パフォーマンス最適化
- セキュリティ考慮事項
- デバッグ方法

## 読む順番

1. **初めて実装する場合**
   1. `datacontext-implementation-plan.md` - 全体像を理解
   2. `firebase-best-practices.md` - 落とし穴を事前に把握
   3. `implementation-checklist.md` - 実装開始

2. **実装中**
   - `implementation-checklist.md` を見ながら作業
   - 詰まったら `firebase-best-practices.md` のトラブルシューティング参照

3. **レビュー時**
   - `firebase-best-practices.md` のチェックリストで確認
   - `implementation-checklist.md` の完了基準を確認

## 重要ポイント

### 🚫 絶対にやってはいけないこと
- onSnapshot内でのデータ更新（無限ループ）
- features/層からの直接Firebase import
- limitなしの全件取得クエリ

### ✅ 必ず守ること
- Firebase操作はcontexts/層のみ
- serverTimestamp()の使用
- 適切なエラーハンドリング
- ロールベースアクセス制御

### 📊 目標数値
- Firebase読み取り: 画面遷移ごとに1-2回
- リアルタイム更新遅延: 100ms以内
- 初期読み込み: 500ms以内

## 実装状況

- [ ] Phase 1: 基本構造の構築
- [ ] Phase 2: Firebaseフックの実装
- [ ] Phase 3: DataContext統合
- [ ] Phase 4: テストと検証
- [ ] 本番環境デプロイ

## 関連ファイル

### 実装予定のファイル
```
src/contexts/
├── DataContext.tsx           # メインContext
├── types/
│   ├── index.ts              # 型定義エクスポート
│   ├── interview.ts          # InterviewRecord型
│   └── student.ts            # Student型
└── hooks/
    ├── realtime/
    │   ├── useInterviews.ts  # 面談記録監視
    │   └── useStudents.ts    # 学生データ監視
    └── query/
        └── useInterviewsByStudent.ts
```

### 参考実装
- MMS Finance: `/Users/nishimototakashi/claude code/mms-finance/src/contexts/DataContext.tsx`

## サポート

実装で不明点がある場合は、以下を参照：
1. Firebase公式ドキュメント
2. MMS Finance実装（成功例）
3. このドキュメント群のトラブルシューティング

---
*最終更新: 2025-09-05*