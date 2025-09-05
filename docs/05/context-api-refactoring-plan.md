# Context API準拠リファクタリング実装計画

## 作成日: 2025-09-05
## 目的: Firebase操作をContextsレイヤーに集約し、アーキテクチャ原則を遵守する

## 1. 実装概要

### 現状の問題
- 4つのコンポーネントがFirebaseを直接インポート・操作
- ビジネスロジックがfeatures/pagesレイヤーに分散
- Context API原則（MMS Financeパターン）違反

### 目標
- すべてのFirebase操作をAuthContextに集約
- features/pagesレイヤーからFirebase依存を完全除去
- エラーハンドリングとロジックの一元化

## 2. 段階的実装計画

### フェーズ1: AuthContext拡張（優先度: 最高）

#### 1.1 新規メソッドの追加
```typescript
// src/contexts/AuthContext.tsx に追加

interface AuthContextType {
  // 既存のメソッド...
  
  // 新規追加メソッド
  updateUserName: (name: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  registerStudent: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}
```

#### 1.2 実装詳細

**updateUserName実装:**
```typescript
const updateUserName = async (name: string) => {
  if (!user) throw new Error('ユーザーが認証されていません');
  
  dev.log('AuthContext', 'ユーザー名更新開始', { name });
  
  try {
    const trimmedName = name.trim();
    
    // Firestoreの更新
    await updateDoc(doc(db, 'users', user.uid), {
      name: trimmedName,
      updatedAt: serverTimestamp()
    });
    
    // ローカル状態の更新
    setUserProfile(prevProfile => {
      if (prevProfile) {
        return { ...prevProfile, name: trimmedName };
      }
      return prevProfile;
    });
    
    dev.log('AuthContext', 'ユーザー名更新成功');
  } catch (error) {
    dev.error('AuthContext', 'ユーザー名更新エラー', error);
    throw error;
  }
};
```

**changeEmail実装:**
```typescript
const changeEmail = async (currentPassword: string, newEmail: string) => {
  if (!user) throw new Error('ユーザーが認証されていません');
  
  dev.log('AuthContext', 'メールアドレス変更開始', { newEmail });
  
  try {
    // 再認証
    const credential = EmailAuthProvider.credential(
      user.email!,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
    
    // メールアドレス変更
    await updateEmail(user, newEmail);
    
    // Firestore更新
    await updateDoc(doc(db, 'users', user.uid), {
      email: newEmail,
      updatedAt: serverTimestamp()
    });
    
    // ローカル状態更新
    setUserProfile(prevProfile => {
      if (prevProfile) {
        return { ...prevProfile, email: newEmail };
      }
      return prevProfile;
    });
    
    dev.log('AuthContext', 'メールアドレス変更成功');
  } catch (error) {
    dev.error('AuthContext', 'メールアドレス変更エラー', error);
    
    // エラーコードに応じた処理
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      
      if (errorCode === 'auth/email-already-in-use') {
        throw new Error('このメールアドレスは既に使用されています');
      } else if (errorCode === 'auth/wrong-password') {
        throw new Error('パスワードが正しくありません');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('メールアドレスの形式が正しくありません');
      } else if (errorCode === 'auth/requires-recent-login') {
        throw new Error('セキュリティのため、再度ログインが必要です');
      }
    }
    throw new Error('変更に失敗しました');
  }
};
```

**changePassword実装:**
```typescript
const changePassword = async (currentPassword: string, newPassword: string) => {
  if (!user) throw new Error('ユーザーが認証されていません');
  
  dev.log('AuthContext', 'パスワード変更開始');
  
  try {
    // 再認証
    const credential = EmailAuthProvider.credential(
      user.email!,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
    
    // パスワード更新
    await updatePassword(user, newPassword);
    
    dev.log('AuthContext', 'パスワード変更成功');
  } catch (error) {
    dev.error('AuthContext', 'パスワード変更エラー', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      
      if (errorCode === 'auth/wrong-password') {
        throw new Error('現在のパスワードが正しくありません');
      } else if (errorCode === 'auth/weak-password') {
        throw new Error('パスワードが弱すぎます');
      } else if (errorCode === 'auth/requires-recent-login') {
        throw new Error('セキュリティのため、再度ログインが必要です');
      }
    }
    throw new Error('変更に失敗しました');
  }
};
```

**registerStudent実装:**
```typescript
const registerStudent = async (data: RegisterData) => {
  dev.log('AuthContext', '生徒登録開始', { email: data.email });
  
  try {
    // ユーザー作成
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    
    // Firestore にユーザープロフィール作成
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: data.email,
      name: data.name,
      role: 'student' as UserRole,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    dev.log('AuthContext', '生徒登録成功', { 
      email: data.email,
      uid: userCredential.user.uid 
    });
  } catch (error) {
    dev.error('AuthContext', '生徒登録エラー', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      
      if (errorCode === 'auth/email-already-in-use') {
        throw new Error('このメールアドレスは既に使用されています');
      } else if (errorCode === 'auth/weak-password') {
        throw new Error('パスワードは8文字以上必要です');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('メールアドレスの形式が正しくありません');
      }
    }
    throw new Error('登録に失敗しました');
  }
};
```

### フェーズ2: コンポーネントのリファクタリング

#### 2.1 NameEditSection.tsx の修正
```typescript
// Before: Firebase直接操作
// import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';

// After: Context API使用
import { useAuth } from '@/contexts/AuthContext';

export function NameEditSection() {
  const { userProfile, updateUserName } = useAuth();
  // ...
  
  const handleSave = async () => {
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await updateUserName(name.trim());
      setSuccess('名前を更新しました');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  // ...
}
```

#### 2.2 EmailChangeSection.tsx の修正
```typescript
// Before: Firebase直接操作
// import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
// import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';

// After: Context API使用
import { useAuth } from '@/contexts/AuthContext';

export function EmailChangeSection() {
  const { changeEmail } = useAuth();
  // ...
  
  const handleEmailChange = async () => {
    // バリデーション...
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await changeEmail(currentPassword, newEmail);
      setSuccess('メールアドレスを変更しました');
      setIsChanging(false);
      setNewEmail('');
      setCurrentPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('変更に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  // ...
}
```

#### 2.3 PasswordChangeSection.tsx の修正
```typescript
// Before: Firebase直接操作
// import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

// After: Context API使用
import { useAuth } from '@/contexts/AuthContext';

export function PasswordChangeSection() {
  const { changePassword } = useAuth();
  // ...
  
  const handlePasswordChange = async () => {
    // バリデーション...
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('パスワードを変更しました');
      setIsChanging(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('変更に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  // ...
}
```

#### 2.4 Register.tsx の修正
```typescript
// Before: Firebase直接操作
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase/config';

// After: Context API使用
import { useAuth } from '@/contexts/AuthContext';

export function Register() {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();
  // ...
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション...
    
    setLoading(true);
    setError('');
    
    try {
      await registerStudent({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('登録に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  // ...
}
```

## 3. テスト計画

### 3.1 単体テスト項目
- [ ] updateUserName: 名前更新と状態同期
- [ ] changeEmail: メール変更と再認証フロー
- [ ] changePassword: パスワード変更と再認証フロー
- [ ] registerStudent: 新規登録フロー

### 3.2 統合テスト項目
- [ ] プロフィール編集画面の全機能
- [ ] 登録画面からダッシュボードへの遷移
- [ ] エラーハンドリングの動作確認
- [ ] リアルタイム更新の確認

### 3.3 エラーケーステスト
- [ ] 無効な認証情報での再認証
- [ ] 既存メールアドレスでの変更試行
- [ ] 弱いパスワードでの変更試行
- [ ] ネットワークエラー時の動作

## 4. 実装スケジュール

### Day 1: AuthContext拡張
- [ ] AuthContextType interface更新
- [ ] 4つの新メソッド実装
- [ ] エラーハンドリング統一
- [ ] ローカルテスト

### Day 2: コンポーネントリファクタリング
- [ ] NameEditSection.tsx修正
- [ ] EmailChangeSection.tsx修正
- [ ] PasswordChangeSection.tsx修正
- [ ] Register.tsx修正
- [ ] Firebase importの完全削除確認

### Day 3: テストと仕上げ
- [ ] 全機能の動作確認
- [ ] エラーケーステスト
- [ ] CLAUDE.md更新
- [ ] ドキュメント整理

## 5. チェックリスト

### 実装前確認
- [ ] 現在の動作を完全に理解
- [ ] バックアップ作成
- [ ] 開発サーバー起動確認

### 実装中確認
- [ ] TypeScriptエラーなし
- [ ] ESLintエラーなし
- [ ] コンソールエラーなし
- [ ] Firebase import削除確認

### 実装後確認
- [ ] 全機能動作確認
- [ ] リアルタイム更新確認
- [ ] エラーメッセージ表示確認
- [ ] ユーザー体験の維持

## 6. リスク管理

### 潜在的リスク
1. **認証状態の不整合**
   - 対策: 徹底的なテスト実施
   
2. **既存機能への影響**
   - 対策: 段階的なリファクタリング
   
3. **エラーハンドリングの漏れ**
   - 対策: 統一的なエラー処理実装

### ロールバック計画
- Git commitで各段階を記録
- 問題発生時は即座に前のコミットへ戻す
- バックアップファイルの保持

## 7. 期待される成果

### アーキテクチャ改善
- ✅ Context API原則の完全遵守
- ✅ Firebase操作の一元管理
- ✅ コードの保守性向上

### 開発効率向上
- ✅ Firebase SDK更新時の影響範囲最小化
- ✅ エラーハンドリングの一貫性
- ✅ ビジネスロジックの集約

### パフォーマンス最適化準備
- ✅ 将来的なキャッシュ戦略実装が容易
- ✅ Firebase読み取り最適化の基盤構築

## 8. 参考資料

- `/Users/nishimototakashi/claude code/mms-student_meeting/CLAUDE.md`
- `/Users/nishimototakashi/claude code/mms-student_meeting/docs/05/context-api-violations.md`
- MMS Finance実装パターン（92% Firebase読み取り削減達成）

## 9. 実装優先順位

1. **最優先**: AuthContext拡張（全ての基盤）
2. **高優先**: Register.tsx修正（新規ユーザー登録の重要性）
3. **中優先**: プロフィール編集コンポーネント修正
4. **低優先**: ドキュメント更新

## 10. 完了条件

- [ ] src/features/以下からFirebase importが0件
- [ ] src/pages/以下からFirebase importが0件（App.tsx除く）
- [ ] 全機能が正常動作
- [ ] エラーハンドリングが統一的
- [ ] CLAUDE.md更新完了