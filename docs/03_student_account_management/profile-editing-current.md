# プロフィール編集機能 実装計画書（現在の実装ベース）

## 現在のデータ構造

現在のUserProfileには以下のフィールドのみが存在します：

```typescript
interface UserProfile {
  uid: string;        // 編集不可
  email: string;      // Firestoreでは編集不可（Firebase Auth経由で変更）
  role: UserRole;     // 編集不可（'admin' | 'student'）
  name: string;       // ✅ 編集可能
  createdAt: Date;    // 編集不可
  updatedAt: Date;    // 自動更新
}
```

## 編集可能な項目

### 1. 氏名（name）
- Firestoreで直接編集可能
- 全ユーザー（管理者・学生）が自分の名前を変更可能

### 2. メールアドレス
- Firebase Auth経由で変更（Firestoreは連動更新が必要）
- 再認証が必要

### 3. パスワード
- Firebase Auth経由で変更
- 再認証が必要

## 実装計画

### Phase 1: 氏名編集機能（1時間）

```typescript
// components/NameEditSection.tsx
export function NameEditSection() {
  const { user, userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSave = async () => {
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        name: name.trim(),
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
    } catch (err) {
      setError('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-3">プロフィール情報</h3>
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              氏名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setName(userProfile?.name || '');
                setError('');
              }}
              disabled={loading}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            <p><strong>氏名:</strong> {userProfile?.name}</p>
            <p><strong>メールアドレス:</strong> {userProfile?.email}</p>
            <p><strong>ロール:</strong> {userProfile?.role === 'admin' ? '管理者' : '学生'}</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 text-indigo-600 hover:text-indigo-800"
          >
            氏名を編集
          </button>
        </div>
      )}
    </div>
  );
}
```

### Phase 2: メールアドレス変更（1時間）

```typescript
// components/EmailChangeSection.tsx
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export function EmailChangeSection() {
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleEmailChange = async () => {
    if (!newEmail || !currentPassword) {
      setError('全ての項目を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 再認証
      const credential = EmailAuthProvider.credential(
        user!.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user!, credential);
      
      // メールアドレス変更
      await updateEmail(user!, newEmail);
      
      // Firestoreも更新
      await updateDoc(doc(db, 'users', user!.uid), {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
      
      setSuccess('メールアドレスを変更しました');
      setIsChanging(false);
      setNewEmail('');
      setCurrentPassword('');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (err.code === 'auth/wrong-password') {
        setError('パスワードが正しくありません');
      } else if (err.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else {
        setError('変更に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="font-semibold mb-3">メールアドレス変更</h3>
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-3">
          {success}
        </div>
      )}
      
      {isChanging ? (
        <div className="space-y-3">
          <input
            type="email"
            placeholder="新しいメールアドレス"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="現在のパスワード（確認用）"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleEmailChange}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '変更中...' : '変更する'}
            </button>
            <button
              onClick={() => {
                setIsChanging(false);
                setNewEmail('');
                setCurrentPassword('');
                setError('');
              }}
              disabled={loading}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsChanging(true)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          メールアドレスを変更
        </button>
      )}
    </div>
  );
}
```

### Phase 3: パスワード変更（30分）

```typescript
// components/PasswordChangeSection.tsx
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export function PasswordChangeSection() {
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handlePasswordChange = async () => {
    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('全ての項目を入力してください');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('パスワードは8文字以上必要です');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 再認証
      const credential = EmailAuthProvider.credential(
        user!.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user!, credential);
      
      // パスワード更新
      await updatePassword(user!, newPassword);
      
      setSuccess('パスワードを変更しました');
      setIsChanging(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setError('現在のパスワードが正しくありません');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます');
      } else {
        setError('変更に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="font-semibold mb-3">パスワード変更</h3>
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-3">
          {success}
        </div>
      )}
      
      {isChanging ? (
        <div className="space-y-3">
          <input
            type="password"
            placeholder="現在のパスワード"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="新しいパスワード（8文字以上）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="新しいパスワード（確認）"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handlePasswordChange}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '変更中...' : '変更する'}
            </button>
            <button
              onClick={() => {
                setIsChanging(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              disabled={loading}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsChanging(true)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          パスワードを変更
        </button>
      )}
    </div>
  );
}
```

## ダッシュボードへの統合

```typescript
// pages/Dashboard.tsx に追加
import { NameEditSection } from '@/features/profile/components/NameEditSection';
import { EmailChangeSection } from '@/features/profile/components/EmailChangeSection';
import { PasswordChangeSection } from '@/features/profile/components/PasswordChangeSection';

// ダッシュボードのどこかに以下を追加
<div className="mt-8 space-y-4">
  <h2 className="text-xl font-bold">アカウント設定</h2>
  <NameEditSection />
  <EmailChangeSection />
  <PasswordChangeSection />
</div>
```

## 今後の拡張案

現在のUserProfileに追加したい場合は、以下のフィールドを検討できます：

### 学生用追加フィールド（将来）
```typescript
interface UserProfile {
  // 既存フィールド
  ...
  
  // 学生用追加フィールド（将来）
  studentId?: string;  // 学籍番号
  grade?: number;      // 学年
  class?: string;      // クラス
}
```

これらのフィールドを追加する場合は：
1. 型定義の更新（src/shared/types/auth.ts）
2. 新規登録時の初期値設定
3. 編集UIの追加

## セキュリティ考慮事項

### Firestore Rules
```javascript
match /users/{userId} {
  // 自分のプロフィールのみ編集可能
  allow update: if request.auth.uid == userId &&
    // role, uid, createdAtは変更不可
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['role', 'uid', 'createdAt']);
}
```

## 実装時間見積もり
**合計: 2.5時間**
- Phase 1: 氏名編集（1時間）
- Phase 2: メールアドレス変更（1時間）
- Phase 3: パスワード変更（30分）

現在の実装に基づいた最小限の編集機能として、実装が簡単で実用的です。