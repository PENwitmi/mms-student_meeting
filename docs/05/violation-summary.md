# Context API違反まとめ

## 検出日: 2025-09-05

## 違反ファイル一覧（合計5箇所）

| ファイルパス | 違反タイプ | 重要度 | 修正優先度 |
|------------|---------|-------|----------|
| src/features/profile/components/NameEditSection.tsx | Firestore直接操作 | 高 | 中 |
| src/features/profile/components/EmailChangeSection.tsx | Auth + Firestore直接操作 | 高 | 中 |
| src/features/profile/components/PasswordChangeSection.tsx | Auth直接操作 | 高 | 中 |
| src/pages/Register.tsx | Auth + Firestore直接操作 | 最高 | 高 |
| src/pages/TestFirebase.tsx | Firestore直接操作 | 低 | 低 |

## 修正方針

### 1. AuthContext拡張（最優先）
以下のメソッドを追加:
- `updateUserName(name: string): Promise<void>`
- `changeEmail(currentPassword: string, newEmail: string): Promise<void>`
- `changePassword(currentPassword: string, newPassword: string): Promise<void>`
- `registerStudent(data: RegisterData): Promise<void>`

### 2. コンポーネント修正
各コンポーネントから Firebase インポートを削除し、Context メソッドを使用

### 3. TestFirebase.tsx の扱い
選択肢:
- A: 開発環境限定化（推奨）
- B: DataContext に testConnection メソッド追加
- C: 完全削除

## 関連ドキュメント
- `/docs/05/context-api-violations.md` - 違反詳細レポート
- `/docs/05/context-api-refactoring-plan.md` - リファクタリング実装計画

## 次のステップ
1. AuthContext拡張の実装
2. 各コンポーネントの段階的修正
3. テスト実施
4. CLAUDE.md更新