# 技術アーキテクチャ設計書

**作成日**: 2025-09-05  
**バージョン**: 1.0.0

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ React SPA │  │   PWA      │  │  Mobile    │   │
│  │  (Web)    │  │ (Offline)  │  │  (Future)  │   │
│  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────┐
│                  Firebase Services                   │
│  ┌────────────────────────────────────────────────┐│
│  │            Authentication & Security            ││
│  └────────────────────────────────────────────────┘│
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Firestore  │  │Cloud Functions│  │ Storage  │ │
│  │  Database   │  │   (Logic)     │  │  (Files) │ │
│  └─────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
```

### 1.2 技術スタック
- **Frontend**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3 + CSS Modules
- **State Management**: Context API + useReducer
- **Routing**: React Router 6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Date/Time**: date-fns
- **Backend**: Firebase 10
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## 2. フロントエンドアーキテクチャ

### 2.1 ディレクトリ構造
```
src/
├── app/                      # アプリケーション設定
│   ├── App.tsx
│   ├── Router.tsx
│   └── providers/
├── features/                 # 機能別モジュール
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── types/
│   ├── interviews/
│   ├── dashboard/
│   ├── schedules/
│   ├── grades/
│   ├── reports/
│   └── time-tracker/
├── shared/                   # 共通モジュール
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── constants/
├── styles/                   # グローバルスタイル
└── assets/                   # 静的アセット
```

### 2.2 状態管理アーキテクチャ

#### 2.2.1 Context構成
```typescript
// グローバル状態
<AuthContext>           // 認証状態
  <UserContext>         // ユーザー情報
    <ThemeContext>      // テーマ設定
      <AppRoutes />     // アプリケーション
    </ThemeContext>
  </UserContext>
</AuthContext>

// 機能別状態（各機能内でローカル管理）
<InterviewProvider>     // 面談機能内のみ
<GradeProvider>        // 成績機能内のみ
```

#### 2.2.2 状態管理パターン
```typescript
// Context + useReducer パターン
interface State {
  data: any[];
  loading: boolean;
  error: Error | null;
}

type Action = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: any[] }
  | { type: 'FETCH_ERROR'; payload: Error };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
```

### 2.3 コンポーネント設計

#### 2.3.1 コンポーネント階層
```
1. Pages          - ルーティング対象のページコンポーネント
2. Containers     - ビジネスロジックを持つコンテナ
3. Components     - 表示専用のプレゼンテーション
4. Elements       - 最小単位のUI要素
```

#### 2.3.2 命名規則
```typescript
// ファイル名
InterviewForm.tsx         // コンポーネント
useInterview.ts          // カスタムフック
interviewService.ts      // サービス層
Interview.types.ts       // 型定義

// コンポーネント例
export const InterviewForm: React.FC<InterviewFormProps> = ({
  onSubmit,
  initialData,
}) => {
  // 実装
};
```

## 3. Firebase統合設計

### 3.1 認証フロー
```typescript
// 認証サービス
class AuthService {
  // メール/パスワード認証
  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUser(credential.user);
  }
  
  // ロール別リダイレクト
  async handleAuthRedirect(user: User): Promise<void> {
    const userData = await getUserData(user.uid);
    switch (userData.role) {
      case 'student':
        navigate('/dashboard/student');
        break;
      case 'teacher':
        navigate('/dashboard/teacher');
        break;
      // ...
    }
  }
}
```

### 3.2 Firestoreアクセス層
```typescript
// 基底サービスクラス
abstract class BaseService<T> {
  protected collection: string;
  
  async getAll(): Promise<T[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
  
  async getById(id: string): Promise<T | null> {
    const doc = await getDoc(doc(db, this.collection, id));
    return doc.exists() ? { id: doc.id, ...doc.data() } as T : null;
  }
  
  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
  
  async update(id: string, data: Partial<T>): Promise<void> {
    await updateDoc(doc(db, this.collection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}

// 実装例
class InterviewService extends BaseService<Interview> {
  protected collection = 'interviews';
  
  async getStudentInterviews(studentId: string): Promise<Interview[]> {
    const q = query(
      collection(db, this.collection),
      where('studentId', '==', studentId),
      orderBy('date', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
  }
}
```

### 3.3 リアルタイム同期
```typescript
// リアルタイムリスナー管理
class RealtimeManager {
  private listeners: Map<string, Unsubscribe> = new Map();
  
  subscribe(key: string, query: Query, callback: (data: any[]) => void): void {
    // 既存リスナーをクリーンアップ
    this.unsubscribe(key);
    
    // 新規リスナー登録
    const unsubscribe = onSnapshot(query, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
    
    this.listeners.set(key, unsubscribe);
  }
  
  unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }
  
  unsubscribeAll(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
```

## 4. パフォーマンス最適化

### 4.1 コード分割
```typescript
// ルートレベルでの遅延読み込み
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const InterviewPage = lazy(() => import('./features/interviews/pages/InterviewPage'));

// Suspenseでラップ
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/interviews" element={<InterviewPage />} />
  </Routes>
</Suspense>
```

### 4.2 データキャッシング
```typescript
// React Queryパターン（オプション）
const useInterviews = (studentId: string) => {
  return useQuery({
    queryKey: ['interviews', studentId],
    queryFn: () => interviewService.getStudentInterviews(studentId),
    staleTime: 5 * 60 * 1000,  // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間保持
  });
};
```

### 4.3 メモ化戦略
```typescript
// 重い計算のメモ化
const GradeChart: React.FC<{ grades: Grade[] }> = ({ grades }) => {
  const chartData = useMemo(() => {
    return grades.map(grade => ({
      date: format(grade.examDate, 'MM/dd'),
      score: grade.overall.totalScore,
      average: grade.overall.average,
    }));
  }, [grades]);
  
  return <LineChart data={chartData} />;
};
```

## 5. セキュリティ実装

### 5.1 認証ガード
```typescript
// ProtectedRoute コンポーネント
const ProtectedRoute: React.FC<{ 
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

### 5.2 入力検証
```typescript
// Zodスキーマによる検証
const InterviewSchema = z.object({
  weeklyReview: z.object({
    studyStatus: z.string().min(1).max(1000),
    progressNotes: z.string().max(2000),
    achievements: z.array(z.string()).max(10),
    challenges: z.array(z.string()).max(10),
  }),
  classPlan: z.object({
    nextWeekSchedule: z.string().max(1000),
    focusAreas: z.array(z.string()).max(5),
    goals: z.array(z.string()).max(5),
  }),
  // ...
});

// React Hook Form統合
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(InterviewSchema),
});
```

## 6. エラーハンドリング

### 6.1 グローバルエラーバウンダリ
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログ送信
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

### 6.2 API エラーハンドリング
```typescript
// 統一エラーハンドラー
const handleFirebaseError = (error: FirebaseError): AppError => {
  switch (error.code) {
    case 'permission-denied':
      return new AppError('アクセス権限がありません', 403);
    case 'not-found':
      return new AppError('データが見つかりません', 404);
    default:
      return new AppError('エラーが発生しました', 500);
  }
};
```

## 7. 開発環境設定

### 7.1 Vite設定
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@features': '/src/features',
      '@shared': '/src/shared',
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
```

### 7.2 環境変数管理
```env
# .env.development
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# .env.production
# 本番環境の値
```

## 8. デプロイメント戦略

### 8.1 CI/CD パイプライン
```yaml
# GitHub Actions例
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
```

### 8.2 段階的リリース
```
1. Development  → Firebase Emulator
2. Staging     → Firebase Preview Channel
3. Production  → Firebase Hosting
```

## 9. モニタリング・分析

### 9.1 パフォーマンス監視
- Firebase Performance Monitoring
- Web Vitals測定
- カスタムトレース

### 9.2 エラー追跡
- Sentry統合
- Firebase Crashlytics (将来のモバイル対応)

### 9.3 利用状況分析
- Firebase Analytics
- カスタムイベント追跡

---

**更新履歴**
- 2025-09-05: 初版作成 - 包括的な技術アーキテクチャ設計