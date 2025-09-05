# 学生アカウント管理機能 クイック実装ガイド

## 実装時間見積もり
**合計: 10-13時間（1.5-2日）**

## 優先度別実装内容

### 🔴 優先度1: 必須機能（5-6時間）

#### A. 学生アカウント作成
- 管理者が学生のメール/パスワードを入力
- Firebaseに学生アカウント作成
- `firstLogin: true`フラグ設定

#### B. 初回ログイン検知
- AuthContextでfirstLoginチェック
- パスワード変更画面への強制リダイレクト

#### C. パスワード変更
- 現在のパスワード確認
- 新パスワード設定
- firstLoginフラグをfalseに更新

### 🟡 優先度2: 基本管理機能（3-4時間）

#### D. 学生一覧表示
- 学生リストの表示
- 基本的な検索機能
- 学生情報の確認

#### E. 学生情報編集
- 名前、学年、クラスの編集
- メールアドレスは変更不可

### 🟢 優先度3: 便利機能（2-3時間）

#### F. パスワードリセット
- 管理者による強制リセット
- 新しい一時パスワード生成

#### G. 高度な検索・フィルタ
- 学年/クラスでのフィルタ
- 複数条件での絞り込み

## 技術的な注意点

### ⚠️ Firebase認証の制約
```typescript
// 問題: 学生作成後、管理者がログアウトされる
createUserWithEmailAndPassword(auth, email, password);
// → 新しいユーザーで自動ログイン

// 解決策: セカンダリAuthインスタンス使用
const secondaryApp = initializeApp(config, 'secondary');
const secondaryAuth = getAuth(secondaryApp);
await createUserWithEmailAndPassword(secondaryAuth, email, password);
```

### 📝 必要なデータ構造変更
```typescript
// Firestoreユーザードキュメントに追加
{
  firstLogin: boolean,      // 初回ログインフラグ
  passwordChangedAt?: Date,  // パスワード変更日時
  studentId: string,        // 学籍番号
  grade: number,           // 学年
  class?: string          // クラス
}
```

## 段階的実装プラン

### Step 1: データ構造の準備（30分）
1. UserProfile型の拡張
2. Firestoreドキュメント構造の更新

### Step 2: 学生作成機能（2-3時間）
1. CreateStudentFormコンポーネント
2. セカンダリAuth実装
3. Firestore保存処理

### Step 3: 初回ログイン処理（2時間）
1. AuthContextの拡張
2. ProtectedRouteの修正
3. リダイレクトロジック

### Step 4: パスワード変更画面（1-2時間）
1. PasswordChangeページ作成
2. バリデーション実装
3. 更新処理

### Step 5: 管理画面（2-3時間）
1. StudentManagementSection作成
2. 学生リスト表示
3. 検索・フィルタ機能

### Step 6: テスト（1時間）
1. アカウント作成フロー
2. 初回ログインフロー
3. エラーケース確認

## 実装チェックリスト

### 必須要件 ✅
- [ ] 管理者が学生アカウントを作成できる
- [ ] 作成時に初期パスワードを設定できる
- [ ] 学生の初回ログイン時にパスワード変更が強制される
- [ ] パスワード変更後は通常のダッシュボードにアクセス可能
- [ ] 管理者のセッションが維持される

### 推奨要件 📋
- [ ] 学生一覧が表示できる
- [ ] 学生情報を編集できる
- [ ] パスワードをリセットできる
- [ ] 学生を検索できる

### セキュリティ要件 🔒
- [ ] 初期パスワードは十分に強力
- [ ] パスワード表示/非表示の切り替え可能
- [ ] エラーメッセージから情報漏洩しない
- [ ] 管理者のみがアクセス可能

## トラブルシューティング

### よくある問題

1. **管理者がログアウトされる**
   - 原因: createUserWithEmailAndPasswordは自動ログイン
   - 解決: セカンダリAuthインスタンス使用

2. **firstLoginフラグが更新されない**
   - 原因: Firestore更新権限
   - 解決: 自分のUIDでのみ更新可能に

3. **パスワード変更でエラー**
   - 原因: 再認証が必要
   - 解決: reauthenticateWithCredential使用

## 次のステップ

### 将来の改善案
1. **Firebase Functions実装**
   - Admin SDK使用で完全なサーバーサイド処理
   - メール通知機能

2. **バルク操作**
   - CSV一括インポート
   - 複数学生の一括作成

3. **監査ログ**
   - 誰がいつ作成/編集したか記録
   - セキュリティ監査対応