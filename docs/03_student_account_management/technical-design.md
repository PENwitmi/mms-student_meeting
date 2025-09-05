# 学生アカウント管理機能 技術設計書

## アーキテクチャ概要

### クライアントサイド実装の制約と対策

Firebase Admin SDKはサーバーサイドでのみ動作するため、クライアントサイドで以下の代替手法を採用：

```typescript
// ❌ 使えない（Admin SDKはブラウザで動作しない）
import { getAuth } from 'firebase-admin/auth';
await getAuth().createUser({ email, password });

// ✅ 代替案（クライアントSDK使用）
import { createUserWithEmailAndPassword } from 'firebase/auth';
await createUserWithEmailAndPassword(auth, email, password);
```

## 実装詳細

### 1. 学生アカウント作成フロー

```typescript
// useStudentManagement.ts
async function createStudent(data: StudentInput) {
  // Step 1: 現在のユーザー情報を保存
  const currentUser = auth.currentUser;
  
  // Step 2: 新しいアカウントを作成
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  
  // Step 3: Firestoreにプロフィール作成
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    email: data.email,
    name: data.name,
    role: 'student',
    studentId: data.studentId,
    grade: data.grade,
    class: data.class,
    firstLogin: true,  // 初回ログインフラグ
    createdBy: currentUser?.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // Step 4: 管理者のセッションを復元
  if (currentUser) {
    await signInWithEmailAndPassword(
      auth,
      currentUser.email!,
      adminPassword // 管理者のパスワードを一時保存が必要
    );
  }
}
```

### 課題: セッション復元問題

上記のStep 4で管理者パスワードが必要になる問題があります。

#### 解決策1: カスタムトークン（Firebase Functions必要）
```typescript
// Firebase Functions側
exports.createStudentAccount = functions.https.onCall(async (data) => {
  const userRecord = await admin.auth().createUser({
    email: data.email,
    password: data.password
  });
  // Firestoreにも保存
  return { uid: userRecord.uid };
});
```

#### 解決策2: 別ウィンドウ/タブ方式（MVP向け）
```typescript
async function createStudentWithPopup(data: StudentInput) {
  // 新しいAuthインスタンスを作成
  const secondaryAuth = initializeApp(firebaseConfig, 'secondary');
  const auth2 = getAuth(secondaryAuth);
  
  // 第二認証で学生作成
  const userCredential = await createUserWithEmailAndPassword(
    auth2,
    data.email,
    data.password
  );
  
  // Firestore更新（メイン認証のまま）
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    // ... プロフィールデータ
  });
  
  // 第二認証をクリーンアップ
  await auth2.signOut();
  await deleteApp(secondaryAuth);
}
```

## 2. 初回ログイン検知システム

### AuthContext拡張

```typescript
// AuthContext.tsx
interface AuthContextValue {
  // 既存
  user: User | null;
  userProfile: UserProfile | null;
  // 追加
  requiresPasswordChange: boolean;
  isFirstLogin: boolean;
}

// ログイン時のチェック
useEffect(() => {
  if (userProfile) {
    if (userProfile.firstLogin) {
      // パスワード変更画面へリダイレクト
      navigate('/change-password');
    }
  }
}, [userProfile, navigate]);
```

### ルート保護

```typescript
// ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 初回ログインチェック
  if (userProfile?.firstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  
  return <>{children}</>;
}
```

## 3. パスワード変更実装

### PasswordChangeコンポーネント

```typescript
// pages/PasswordChange.tsx
import { updatePassword } from 'firebase/auth';

export function PasswordChange() {
  const { user, userProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handlePasswordChange = async () => {
    // バリデーション
    if (newPassword !== confirmPassword) {
      throw new Error('パスワードが一致しません');
    }
    
    if (newPassword.length < 8) {
      throw new Error('パスワードは8文字以上必要です');
    }
    
    // 再認証（必須）
    const credential = EmailAuthProvider.credential(
      user!.email!,
      currentPassword
    );
    await reauthenticateWithCredential(user!, credential);
    
    // パスワード更新
    await updatePassword(user!, newPassword);
    
    // firstLoginフラグを更新
    await updateDoc(doc(db, 'users', user!.uid), {
      firstLogin: false,
      passwordChangedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // ダッシュボードへリダイレクト
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            パスワードの変更
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            初回ログインのため、パスワードの変更が必要です
          </p>
        </div>
        {/* フォーム実装 */}
      </div>
    </div>
  );
}
```

## 4. パスワード生成ユーティリティ

```typescript
// utils/passwordGenerator.ts
export function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  
  return Array.from(values)
    .map(x => charset[x % charset.length])
    .join('');
}

export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (password.length < 8) {
    feedback.push('8文字以上にしてください');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('小文字を含めてください');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('大文字を含めてください');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('数字を含めてください');
  }
  
  return { score: Math.min(score / 6 * 100, 100), feedback };
}
```

## 5. 学生データ管理

### データ取得の最適化

```typescript
// hooks/useStudentManagement.ts
export function useStudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({});
  
  useEffect(() => {
    let q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );
    
    // フィルタ適用
    if (filters.grade) {
      q = query(q, where('grade', '==', filters.grade));
    }
    if (filters.class) {
      q = query(q, where('class', '==', filters.class));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Student));
      
      // クライアント側検索
      if (searchTerm) {
        data = data.filter(student => 
          student.name.includes(searchTerm) ||
          student.email.includes(searchTerm) ||
          student.studentId?.includes(searchTerm)
        );
      }
      
      setStudents(data);
    });
    
    return () => unsubscribe();
  }, [filters, searchTerm]);
  
  return { students, setSearchTerm, setFilters };
}
```

## エラーハンドリング

### 想定されるエラーと対処

```typescript
const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/weak-password': 'パスワードが弱すぎます（8文字以上必要）',
  'auth/wrong-password': '現在のパスワードが正しくありません',
  'auth/too-many-requests': 'リクエストが多すぎます。しばらくしてから再試行してください',
} as const;

function getErrorMessage(error: FirebaseError): string {
  return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] 
    || 'エラーが発生しました';
}
```

## セキュリティベストプラクティス

### 1. パスワード管理
- 初期パスワードは十分に強力に
- 画面表示時は必ずマスク化オプション
- コピー機能を提供（クリップボード）
- 作成後すぐに学生に通知

### 2. データアクセス制御
```typescript
// Firestore Rules（将来実装）
match /users/{userId} {
  allow read: if request.auth != null && 
    (request.auth.uid == userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### 3. 監査ログ
```typescript
interface AuditLog {
  action: 'student_created' | 'password_reset' | 'student_deleted';
  performedBy: string;
  targetUser: string;
  timestamp: Date;
  details?: Record<string, any>;
}
```

## パフォーマンス最適化

### 1. 学生リストのページネーション
```typescript
const PAGE_SIZE = 20;

const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

const loadMore = async () => {
  let q = query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
};
```

### 2. デバウンス検索
```typescript
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setSearchTerm(value);
  }, 300),
  []
);
```

## テスト戦略

### 統合テストシナリオ
1. 管理者による学生作成
2. 学生の初回ログイン
3. パスワード変更強制
4. 変更後の通常ログイン
5. 管理者セッション維持確認

### エッジケース
- 重複メールアドレス
- 重複学籍番号
- 弱いパスワード
- ネットワークエラー時の処理