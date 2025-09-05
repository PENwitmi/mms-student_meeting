# MVP技術アーキテクチャ設計

**作成日**: 2025-09-05  
**バージョン**: MVP 1.0.0  
**参考**: MMS Financeプロジェクトアーキテクチャ

## 1. Context API アーキテクチャ

### 1.1 全体構成
```typescript
// App.tsx - Provider階層
<BrowserRouter>
  <AuthProvider>      {/* 認証状態管理 */}
    <DataProvider>    {/* データ管理 */}
      <Routes>
        {/* アプリケーションルート */}
      </Routes>
    </DataProvider>
  </AuthProvider>
</BrowserRouter>
```

### 1.2 AuthContext実装（MMS Finance参考）
```typescript
// src/lib/firebase/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 1.3 DataContext実装（簡略版）
```typescript
// src/contexts/DataContext.tsx
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useInterviews } from './hooks/useInterviews';
import { useUserData } from './hooks/useUserData';
import type { DataContextValue } from './types';

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // 各種データフックを1回だけ呼び出し
  const {
    interviews,
    addInterview,
    updateInterview,
    deleteInterview,
    loading: interviewsLoading,
    error: interviewsError
  } = useInterviews();

  const {
    userData,
    loading: userLoading,
    error: userError
  } = useUserData();

  // Context値をメモ化（re-render最小化）
  const value = useMemo<DataContextValue>(() => ({
    // データ
    interviews,
    userData,
    
    // ローディング状態
    loading: {
      interviews: interviewsLoading,
      user: userLoading
    },
    
    // エラー状態
    errors: {
      interviews: interviewsError,
      user: userError
    },
    
    // アクション
    actions: {
      addInterview,
      updateInterview,
      deleteInterview
    }
  }), [interviews, userData, interviewsLoading, userLoading]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
```

## 2. カスタムフック設計（MMS Finance厳格アーキテクチャ）

### 2.1 Hooksの分類原則

**🎯 絶対原則**
1. **onSnapshotはすべてDataContext経由**
2. **Firebaseアクセスはcontexts/層のみ**
3. **features/層はFirebase直接アクセス禁止**

### 2.2 Hooksの配置ルール

| Hook種別 | 配置場所 | Firebase Access | 例 |
|----------|----------|-----------------|-----|
| リアルタイム系（onSnapshot） | contexts/hooks/realtime/ | ✅ あり | useInterviews |
| クエリ系（getDocs） | contexts/hooks/query/ | ✅ あり | useInterviewQuery |
| ビジネスロジック系 | features/*/hooks/ | ❌ なし | useInterviewForm |
| UI制御系 | features/*/hooks/ | ❌ なし | useFormValidation |

### 2.3 リアルタイム系フック（contexts/hooks/realtime/）
```typescript
// src/contexts/hooks/realtime/useInterviews.ts
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Interview } from '@/shared/types/interview';

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'interviews'),
      orderBy('interviewDate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Interview));
        setInterviews(data);
        setLoading(false);
      },
      (err) => {
        console.error('Interview fetch error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addInterview = async (data: Omit<Interview, 'id'>) => {
    try {
      await addDoc(collection(db, 'interviews'), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Add interview error:', err);
      throw err;
    }
  };

  const updateInterview = async (id: string, data: Partial<Interview>) => {
    try {
      await updateDoc(doc(db, 'interviews', id), {
        ...data,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Update interview error:', err);
      throw err;
    }
  };

  const deleteInterview = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'interviews', id));
    } catch (err) {
      console.error('Delete interview error:', err);
      throw err;
    }
  };

  return {
    interviews,
    loading,
    error,
    addInterview,
    updateInterview,
    deleteInterview
  };
}

// src/contexts/hooks/realtime/useUserData.ts  
export function useUserData() {
  // onSnapshotでユーザーデータをリアルタイム取得
}
```

### 2.4 クエリ系フック（contexts/hooks/query/）
```typescript
// src/contexts/hooks/query/useInterviewQuery.ts
import { getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useInterviewQuery() {
  const queryByStudent = async (studentId: string, yearMonth?: string) => {
    const q = query(
      collection(db, 'interviews'),
      where('studentId', '==', studentId),
      orderBy('interviewDate', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const queryByDateRange = async (startDate: Date, endDate: Date) => {
    const q = query(
      collection(db, 'interviews'),
      where('interviewDate', '>=', startDate),
      where('interviewDate', '<=', endDate),
      orderBy('interviewDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  return {
    queryByStudent,
    queryByDateRange
  };
}
```

### 2.5 ビジネスロジック系フック（features/*/hooks/）
```typescript
// src/features/interviews/hooks/useInterviewStatistics.ts
import { useData } from '@/contexts/DataContext';
import { useMemo } from 'react';

export function useInterviewStatistics(studentId?: string) {
  const { interviews } = useData(); // DataContext経由でデータ取得
  
  const statistics = useMemo(() => {
    const filtered = studentId 
      ? interviews.filter(i => i.studentId === studentId)
      : interviews;
    
    return {
      total: filtered.length,
      thisMonth: filtered.filter(i => {
        const date = new Date(i.interviewDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
      }).length,
      // 他の統計計算
    };
  }, [interviews, studentId]);

  return statistics;
}
```

## 3. ルート保護

### 3.1 PrivateRoute実装
```typescript
// src/shared/components/guards/PrivateRoute.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRole?: 'admin' | 'student';
}

export function PrivateRoute({ children, allowedRole }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ロールチェック（MVP簡略版）
  if (allowedRole) {
    // Firebase Custom Claimsまたはusersコレクションからロール取得
    // MVP版では簡略化
  }
  
  return <>{children}</>;
}
```

## 4. アプリケーション構造

### 4.1 App.tsx
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/firebase/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { LoginPage } from '@/pages/LoginPage';
import { AdminApp } from './AdminApp';
import { StudentApp } from './StudentApp';
import { PrivateRoute } from '@/shared/components/guards/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* ログイン */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 管理者ルート */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute allowedRole="admin">
                  <AdminApp />
                </PrivateRoute>
              }
            />
            
            {/* 生徒ルート */}
            <Route
              path="/student/*"
              element={
                <PrivateRoute allowedRole="student">
                  <StudentApp />
                </PrivateRoute>
              }
            />
            
            {/* デフォルトリダイレクト */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 4.2 AdminApp.tsx
```typescript
// src/AdminApp.tsx
import { Routes, Route } from 'react-router-dom';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { InterviewForm } from '@/features/interviews/components/InterviewForm';
import { InterviewDetail } from '@/features/interviews/components/InterviewDetail';

export function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/interview/new" element={<InterviewForm />} />
      <Route path="/interview/:id" element={<InterviewDetail />} />
    </Routes>
  );
}
```

## 5. パフォーマンス最適化

### 5.1 Context最適化
```typescript
// 不要なre-renderを防ぐためのメモ化
const value = useMemo(() => ({
  // データとアクション
}), [/* 必要な依存配列のみ */]);
```

### 5.2 Firebase読み取り最適化
- **onSnapshot使用**: リアルタイムリスナーで自動更新
- **1回のみ接続**: DataContext内で一度だけFirebase接続
- **unsubscribe管理**: クリーンアップ処理を確実に実行

## 6. 型定義

### 6.1 Interview型
```typescript
// src/shared/types/interview.ts
export interface Interview {
  id: string;
  studentId: string;
  studentName: string;
  createdBy: string;
  createdByName: string;
  interviewDate: Date;
  content: {
    weeklyReview: string;
    nextWeekPlan: string;
    homework: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 User型
```typescript
// src/shared/types/user.ts
export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  createdAt: Date;
  lastLoginAt: Date;
}
```

### 6.3 Context型
```typescript
// src/contexts/types.ts
export interface DataContextValue {
  // データ
  interviews: Interview[];
  userData: UserData | null;
  
  // 状態
  loading: {
    interviews: boolean;
    user: boolean;
  };
  
  errors: {
    interviews: Error | null;
    user: Error | null;
  };
  
  // アクション
  actions: {
    addInterview: (data: Omit<Interview, 'id'>) => Promise<void>;
    updateInterview: (id: string, data: Partial<Interview>) => Promise<void>;
    deleteInterview: (id: string) => Promise<void>;
  };
}
```

## 7. エラーハンドリング

### 7.1 Context内エラー処理
```typescript
const handleError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  setError(error);
  // 必要に応じてエラー通知
};
```

### 7.2 コンポーネント内エラー処理
```typescript
const { actions, errors } = useData();

const handleSubmit = async (data: InterviewData) => {
  try {
    await actions.addInterview(data);
    // 成功処理
  } catch (error) {
    // エラー表示
    setLocalError('保存に失敗しました');
  }
};
```

## 8. 開発フロー

### 8.1 実装順序
1. **Firebase設定**: プロジェクト作成、認証有効化
2. **Context基盤**: AuthContext → DataContext
3. **カスタムフック**: useInterviews, useUserData
4. **ページコンポーネント**: Login → Dashboard
5. **機能コンポーネント**: InterviewForm → InterviewList

### 8.2 テスト方針（MVP簡略版）
- 手動テストを中心に
- Firebase Emulatorで開発
- Console.logでデバッグ

## 9. セキュリティ考慮

### 9.1 認証チェック
- すべての保護ルートでPrivateRoute使用
- Context内でも認証状態確認

### 9.2 データアクセス制御
- Firestoreルールで権限管理
- クライアント側でも二重チェック

## 10. MVP後の拡張性

### 10.1 拡張可能な設計
- Context分割（UserContext, InterviewContext等）
- 新機能はfeatures/ディレクトリに追加
- 新しいデータはDataContextに統合

### 10.2 将来の最適化
- React.lazyによるコード分割
- React Queryの導入検討
- エラーバウンダリの追加

---

**チェックリスト**
- [ ] Context APIが正しく実装されている
- [ ] Firebase読み取り回数が最小化されている
- [ ] メモリリークが発生していない（unsubscribe確認）
- [ ] 型安全性が保たれている
- [ ] エラーハンドリングが適切

**更新履歴**
- 2025-09-05: MVP版Context APIアーキテクチャ作成（MMS Finance参考）