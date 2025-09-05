# Context API原則違反レポート

## 作成日: 2025-09-05

## 概要
学生アカウント管理機能の実装において、MMS Financeパターンで確立されたContext API原則に違反する実装が5箇所で確認されました。

## Context API原則（CLAUDE.mdより）

```
1. Firebase operations ONLY in `src/contexts/` directory
2. `src/features/` components MUST NOT import Firebase directly  
3. All data access through Context API hooks only
4. Realtime updates (onSnapshot) separate from one-time queries (getDocs)
```

## 違反箇所の詳細

### 1. src/features/profile/components/NameEditSection.tsx

**違反内容:**
```typescript
// ❌ 違反: Firestoreを直接インポート
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ❌ 違反: コンポーネントから直接Firestore操作
await updateDoc(doc(db, 'users', user!.uid), {
  name: updatedName,
  updatedAt: serverTimestamp()
});
```

**正しい実装:**
```typescript
// ✅ AuthContextのメソッドを使用すべき
const { updateUserName } = useAuth();
await updateUserName(updatedName);
```

### 2. src/features/profile/components/EmailChangeSection.tsx

**違反内容:**
```typescript
// ❌ 違反: Firebase AuthとFirestoreを直接インポート
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ❌ 違反: 認証とDB操作を直接実行
await reauthenticateWithCredential(user!, credential);
await updateEmail(user!, newEmail);
await updateDoc(doc(db, 'users', user!.uid), {
  email: newEmail,
  updatedAt: serverTimestamp()
});
```

**正しい実装:**
```typescript
// ✅ AuthContextのメソッドを使用すべき
const { changeEmail } = useAuth();
await changeEmail(currentPassword, newEmail);
```

### 3. src/features/profile/components/PasswordChangeSection.tsx

**違反内容:**
```typescript
// ❌ 違反: Firebase Authを直接インポート
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

// ❌ 違反: 認証操作を直接実行
const credential = EmailAuthProvider.credential(user!.email!, currentPassword);
await reauthenticateWithCredential(user!, credential);
await updatePassword(user!, newPassword);
```

**正しい実装:**
```typescript
// ✅ AuthContextのメソッドを使用すべき
const { changePassword } = useAuth();
await changePassword(currentPassword, newPassword);
```

### 4. src/pages/Register.tsx

**違反内容:**
```typescript
// ❌ 違反: Firebase AuthとFirestoreを直接インポート
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

// ❌ 違反: ユーザー作成とDB操作を直接実行
const userCredential = await createUserWithEmailAndPassword(
  auth,
  formData.email,
  formData.password
);

await setDoc(doc(db, 'users', userCredential.user.uid), {
  uid: userCredential.user.uid,
  email: formData.email,
  name: formData.name,
  role: 'student',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

**正しい実装:**
```typescript
// ✅ AuthContextのメソッドを使用すべき
const { registerStudent } = useAuth();
await registerStudent({
  email: formData.email,
  password: formData.password,
  name: formData.name
});
```

### 5. src/pages/TestFirebase.tsx（開発テスト用）

**違反内容:**
```typescript
// ❌ 違反: Firebase Firestoreを直接インポート
import { auth, db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// ❌ 違反: Firestore操作を直接実行
await getDocs(collection(db, 'users'));
```

**正しい実装:**
```typescript
// ✅ DataContextのメソッドを使用すべき
const { testConnection } = useData();
const status = await testConnection();

// または、このテストページ自体を削除し、
// Context層でのテストメソッドに統合
```

**注記:** このファイルは開発/テスト用ですが、本番環境にデプロイされる可能性があるため、
Context API原則に従うべきです。または、開発環境でのみ利用可能にする必要があります。

## 影響範囲

### セキュリティリスク
- Firebase設定が複数箇所に分散
- 認証ロジックの重複実装

### 保守性の問題
- Firebase SDK更新時に複数ファイルの修正が必要
- エラーハンドリングの一貫性欠如
- ビジネスロジックの分散

### パフォーマンス
- 現状では大きな影響なし
- 将来的にキャッシュ戦略の実装が困難

## 修正提案

### 短期対応（推奨）
1. AuthContextに以下のメソッドを追加:
   - `updateUserName(name: string): Promise<void>`
   - `changeEmail(currentPassword: string, newEmail: string): Promise<void>`
   - `changePassword(currentPassword: string, newPassword: string): Promise<void>`
   - `registerStudent(data: RegisterData): Promise<void>`

2. features/pagesのコンポーネントを修正:
   - Firebase関連のインポートを削除
   - AuthContextのメソッドを使用するよう変更

### 長期対応
1. UserContext（または拡張したAuthContext）の作成
2. 全てのユーザー関連操作の集約
3. エラーハンドリングの統一

## 現在の実装の評価

### 良い点
- updateUserProfile関数でローカル状態更新は実装済み
- AuthContextの基本構造は適切
- TypeScriptの型定義は適切

### 改善が必要な点
- Firebase操作の分散（最優先）
- エラーハンドリングの統一
- 再認証ロジックの共通化

## 参考: MMS Financeの実装パターン

MMS Financeでは以下の構造で92%のFirebase読み取り削減を達成:

```
src/contexts/
├── AuthContext.tsx      # 認証関連の全操作
├── DataContext.tsx      # データ関連の全操作
└── hooks/
    ├── realtime/        # onSnapshot系
    └── query/           # getDocs系

src/features/
└── [feature]/
    └── components/      # Firebaseインポート禁止
                        # Context hooksのみ使用
```

## アクションアイテム

- [ ] AuthContextの拡張（Firebase操作メソッド追加）
- [ ] 各コンポーネントの修正（Firebase直接操作の削除）
  - [ ] NameEditSection.tsx
  - [ ] EmailChangeSection.tsx
  - [ ] PasswordChangeSection.tsx
  - [ ] Register.tsx
  - [ ] TestFirebase.tsx（または削除/開発環境限定化）
- [ ] テストの実施
- [ ] CLAUDE.mdの更新（学習事項の追記）

## まとめ

現在の実装は機能的には動作しますが、アーキテクチャ原則から逸脱しています。
早期の修正により、保守性とスケーラビリティを向上させることができます。