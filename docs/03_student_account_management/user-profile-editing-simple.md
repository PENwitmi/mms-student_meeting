# ユーザープロフィール編集機能（簡略版）実装計画書

## 概要
管理者と学生の両方が、必要最小限の情報（氏名・メールアドレス・パスワード）を自分で変更できる機能を実装します。

## 編集可能項目

### 全ユーザー共通
1. **氏名** - 表示名の変更
2. **メールアドレス** - ログイン用メールアドレスの変更（確認プロセス必須）
3. **パスワード** - ログインパスワードの変更

### 学生のみ追加項目
4. **学年** - 進級時の更新
5. **クラス** - クラス変更時の更新

### 編集不可項目
- UID
- ロール（role）
- 学籍番号（studentId）
- 作成日時

## 技術実装

### シンプルなデータ構造
```typescript
interface UserProfile {
  // コアフィールド
  uid: string;
  email: string;
  name: string;              // 氏名（編集可能）
  role: 'admin' | 'student';
  
  // 学生用フィールド
  studentId?: string;        // 学籍番号（編集不可）
  grade?: number;            // 学年（学生のみ編集可）
  class?: string;            // クラス（学生のみ編集可）
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
}
```

### UIコンポーネント設計（シンプル版）

#### プロフィール編集セクション
```typescript
// components/SimpleProfileEdit.tsx
export function SimpleProfileEdit() {
  const { user, userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [grade, setGrade] = useState(userProfile?.grade || 1);
  const [classValue, setClassValue] = useState(userProfile?.class || '');
  
  const handleSave = async () => {
    const updates: any = { name, updatedAt: serverTimestamp() };
    
    // 学生の場合は学年・クラスも更新可能
    if (userProfile?.role === 'student') {
      updates.grade = grade;
      updates.class = classValue;
    }
    
    await updateDoc(doc(db, 'users', user!.uid), updates);
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-3">基本情報</h3>
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">氏名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>
          
          {userProfile?.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">学年</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300"
                >
                  <option value={1}>1年</option>
                  <option value={2}>2年</option>
                  <option value={3}>3年</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">クラス</label>
                <input
                  type="text"
                  value={classValue}
                  onChange={(e) => setClassValue(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300"
                />
              </div>
            </>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p><strong>氏名:</strong> {userProfile?.name}</p>
          <p><strong>メールアドレス:</strong> {userProfile?.email}</p>
          {userProfile?.role === 'student' && (
            <>
              <p><strong>学籍番号:</strong> {userProfile?.studentId}</p>
              <p><strong>学年:</strong> {userProfile?.grade}年</p>
              <p><strong>クラス:</strong> {userProfile?.class || '未設定'}</p>
            </>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 text-indigo-600 hover:text-indigo-800"
          >
            編集
          </button>
        </div>
      )}
    </div>
  );
}
```

#### メールアドレス変更（別セクション）
```typescript
// components/EmailChangeSection.tsx
export function EmailChangeSection() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleEmailChange = async () => {
    // 再認証（必須）
    const credential = EmailAuthProvider.credential(
      user!.email!,
      password
    );
    await reauthenticateWithCredential(user!, credential);
    
    // メールアドレス変更
    await updateEmail(user!, newEmail);
    
    // Firestoreも更新
    await updateDoc(doc(db, 'users', user!.uid), {
      email: newEmail,
      updatedAt: serverTimestamp()
    });
    
    alert('メールアドレスを変更しました。次回から新しいメールアドレスでログインしてください。');
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="font-semibold mb-3">メールアドレス変更</h3>
      <div className="space-y-3">
        <input
          type="email"
          placeholder="新しいメールアドレス"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="block w-full rounded-md border-gray-300"
        />
        <input
          type="password"
          placeholder="現在のパスワード（確認用）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-md border-gray-300"
        />
        <button
          onClick={handleEmailChange}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          メールアドレスを変更
        </button>
      </div>
    </div>
  );
}
```

#### パスワード変更セクション
```typescript
// components/PasswordChangeSection.tsx
export function PasswordChangeSection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('新しいパスワードが一致しません');
      return;
    }
    
    if (newPassword.length < 8) {
      alert('パスワードは8文字以上必要です');
      return;
    }
    
    // 再認証
    const credential = EmailAuthProvider.credential(
      user!.email!,
      currentPassword
    );
    await reauthenticateWithCredential(user!, credential);
    
    // パスワード更新
    await updatePassword(user!, newPassword);
    
    alert('パスワードを変更しました');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="font-semibold mb-3">パスワード変更</h3>
      <div className="space-y-3">
        <input
          type="password"
          placeholder="現在のパスワード"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="block w-full rounded-md border-gray-300"
        />
        <input
          type="password"
          placeholder="新しいパスワード（8文字以上）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="block w-full rounded-md border-gray-300"
        />
        <input
          type="password"
          placeholder="新しいパスワード（確認）"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="block w-full rounded-md border-gray-300"
        />
        <button
          onClick={handlePasswordChange}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          パスワードを変更
        </button>
      </div>
    </div>
  );
}
```

## ダッシュボードへの統合

```typescript
// pages/Dashboard.tsx に追加
import { SimpleProfileEdit } from '@/features/profile/components/SimpleProfileEdit';
import { EmailChangeSection } from '@/features/profile/components/EmailChangeSection';
import { PasswordChangeSection } from '@/features/profile/components/PasswordChangeSection';

export function Dashboard() {
  const { userProfile } = useAuth();
  
  return (
    <div className="container mx-auto p-4">
      {/* 既存のダッシュボードコンテンツ */}
      
      {/* プロフィール編集セクション追加 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">アカウント設定</h2>
        <SimpleProfileEdit />
        <EmailChangeSection />
        <PasswordChangeSection />
      </div>
    </div>
  );
}
```

## 実装スケジュール（簡略版）

### Phase 1: 基本編集機能（1時間）
- [ ] SimpleProfileEditコンポーネント作成
- [ ] 氏名、学年、クラスの編集機能

### Phase 2: メールアドレス変更（1時間）
- [ ] EmailChangeSectionコンポーネント作成
- [ ] 再認証フロー
- [ ] Firestore連携

### Phase 3: パスワード変更（30分）
- [ ] PasswordChangeSectionコンポーネント作成
- [ ] パスワード強度チェック

### Phase 4: 統合・テスト（30分）
- [ ] ダッシュボードへの統合
- [ ] エラーハンドリング
- [ ] 動作確認

## セキュリティ考慮事項

### メールアドレス変更時の注意
```typescript
// 重要: メールアドレス変更には必ず再認証が必要
await reauthenticateWithCredential(user, credential);
await updateEmail(user, newEmail);
```

### Firestore Rules
```javascript
match /users/{userId} {
  // 自分のプロフィールのみ編集可能
  allow update: if request.auth.uid == userId &&
    // ロール、UID、学籍番号は変更不可
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['role', 'uid', 'studentId']);
}
```

## エラーメッセージ

```typescript
const ERROR_MESSAGES = {
  'auth/requires-recent-login': '再度ログインが必要です',
  'auth/wrong-password': 'パスワードが正しくありません',
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/weak-password': 'パスワードが弱すぎます（8文字以上必要）'
};
```

## 実装時間見積もり
**合計: 3時間**

最小限の機能に絞ることで、実装時間を大幅に短縮し、UIもシンプルで使いやすくなります。