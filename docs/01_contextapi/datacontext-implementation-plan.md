# DataContext実装計画書

## 概要
MMS Financeで実証済みのDataContextパターンを適用し、Firebase読み取り回数を最小限に抑えながら、アプリケーション全体でデータを一元管理する仕組みを実装します。

## 実装方針

### 基本原則
1. **Firebase操作はContextレイヤーのみ**
   - `src/contexts/`配下でのみFirebase SDKを使用
   - `src/features/`からは`useData()`フックのみを使用

2. **リアルタイム更新と一回限りの読み取りを分離**
   - `contexts/hooks/realtime/` - onSnapshot系（リアルタイム更新）
   - `contexts/hooks/query/` - getDocs系（一回限りの読み取り）

3. **単一の真実の源（Single Source of Truth）**
   - DataContextがすべてのデータの中央管理場所
   - 各コンポーネントは選択的なフックを使用

## 実装ステップ

### Phase 1: 基本構造の構築（30分）
1. ディレクトリ構造の作成
2. 型定義ファイルの作成
3. DataContextの基本骨格実装

### Phase 2: Firebaseフックの実装（1時間）
1. `useInterviews` - 面談記録のリアルタイム更新
2. `useStudents` - 学生情報の管理（管理者のみ）
3. Firebase操作のヘルパー関数

### Phase 3: DataContext統合（30分）
1. すべてのフックをDataContextに統合
2. 選択的フック（useInterviewsData等）の実装
3. エラー処理とローディング状態の管理

### Phase 4: テストと検証（30分）
1. 開発環境での動作確認
2. Firebase読み取り回数の確認
3. ロールベースアクセス制御の検証

## ディレクトリ構造

```
src/contexts/
├── DataContext.tsx           # メインのContext
├── types/
│   ├── index.ts              # 型定義のエクスポート
│   ├── interview.ts          # 面談記録の型
│   └── student.ts            # 学生情報の型
└── hooks/
    ├── realtime/
    │   ├── useInterviews.ts  # 面談記録のリアルタイム監視
    │   └── useStudents.ts    # 学生データのリアルタイム監視
    └── query/
        └── useInterviewsByStudent.ts # 特定学生の面談記録取得

```

## 型定義

### InterviewRecord
```typescript
interface InterviewRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: Date;
  topics: string[];
  notes: string;
  followUp?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Student
```typescript
interface Student {
  id: string;
  uid: string;
  name: string;
  email: string;
  studentId: string;
  grade: number;
  class: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### DataContextValue
```typescript
interface DataContextValue {
  // データ
  interviews: InterviewRecord[];
  students: Student[];
  
  // ローディング状態
  loading: {
    interviews: boolean;
    students: boolean;
  };
  
  // エラー状態
  errors: {
    interviews: Error | null;
    students: Error | null;
  };
  
  // アクション
  actions: {
    addInterview: (data: InterviewInput) => Promise<void>;
    updateInterview: (id: string, data: Partial<InterviewInput>) => Promise<void>;
    deleteInterview: (id: string) => Promise<void>;
    addStudent: (data: StudentInput) => Promise<void>;
    updateStudent: (id: string, data: Partial<StudentInput>) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
  };
}
```

## 実装の詳細

### 1. useInterviews フック
```typescript
export function useInterviews() {
  const { user, userRole } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      setLoading(false);
      return;
    }

    // クエリの構築（ロールに基づく）
    let q: Query;
    if (userRole === 'admin') {
      // 管理者：すべての面談記録
      q = query(collection(db, 'interviews'), orderBy('date', 'desc'));
    } else {
      // 学生：自分の面談記録のみ
      q = query(
        collection(db, 'interviews'),
        where('studentId', '==', user.uid),
        orderBy('date', 'desc')
      );
    }

    // リアルタイム監視
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as InterviewRecord));
        setInterviews(data);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userRole]);

  // CRUD操作
  const addInterview = async (data: InterviewInput) => {
    await addDoc(collection(db, 'interviews'), {
      ...data,
      createdBy: user!.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateInterview = async (id: string, data: Partial<InterviewInput>) => {
    await updateDoc(doc(db, 'interviews', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteInterview = async (id: string) => {
    await deleteDoc(doc(db, 'interviews', id));
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
```

### 2. DataContext統合
```typescript
export function DataProvider({ children }: { children: ReactNode }) {
  const {
    interviews,
    loading: interviewsLoading,
    error: interviewsError,
    addInterview,
    updateInterview,
    deleteInterview
  } = useInterviews();

  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    addStudent,
    updateStudent,
    deleteStudent
  } = useStudents();

  const value = useMemo<DataContextValue>(() => ({
    interviews,
    students,
    loading: {
      interviews: interviewsLoading,
      students: studentsLoading
    },
    errors: {
      interviews: interviewsError,
      students: studentsError
    },
    actions: {
      addInterview,
      updateInterview,
      deleteInterview,
      addStudent,
      updateStudent,
      deleteStudent
    }
  }), [
    interviews,
    students,
    interviewsLoading,
    studentsLoading,
    interviewsError,
    studentsError
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
```

### 3. 選択的フック
```typescript
// 面談記録のみを取得
export function useInterviewsData() {
  const { interviews, loading, errors, actions } = useData();
  return {
    interviews,
    loading: loading.interviews,
    error: errors.interviews,
    addInterview: actions.addInterview,
    updateInterview: actions.updateInterview,
    deleteInterview: actions.deleteInterview
  };
}

// 学生データのみを取得（管理者用）
export function useStudentsData() {
  const { students, loading, errors, actions } = useData();
  return {
    students,
    loading: loading.students,
    error: errors.students,
    addStudent: actions.addStudent,
    updateStudent: actions.updateStudent,
    deleteStudent: actions.deleteStudent
  };
}
```

## セキュリティ考慮事項

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザープロフィール
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // スクリプトのみで更新
    }
    
    // 面談記録
    match /interviews/{document=**} {
      // 読み取り：管理者は全て、学生は自分のみ
      allow read: if request.auth != null && (
        resource.data.studentId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      // 書き込み：管理者のみ
      allow create, update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 学生マスター（将来実装）
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## パフォーマンス最適化

### 1. 不要な再レンダリング防止
- useMemoによる値のメモ化
- 依存配列の最小化
- アクション関数の安定化

### 2. Firebase読み取り最適化
- 複合インデックスの設定
- limitによるクエリ制限（必要に応じて）
- キャッシュの活用

### 3. エラーハンドリング
- グローバルエラー境界の設置
- ユーザーフレンドリーなエラーメッセージ
- 開発環境でのデバッグログ

## テスト計画

### 1. 単体テスト
- 各フックの独立テスト
- CRUD操作の確認
- エラーケースのテスト

### 2. 統合テスト
- DataContext全体の動作確認
- ロールベースアクセスの検証
- Firebase接続テスト

### 3. パフォーマンステスト
- Firebase読み取り回数の計測
- 大量データでの動作確認
- リアルタイム更新の遅延測定

## 実装スケジュール

1. **Day 1（今日）**: 基本構造とuseInterviewsフック
2. **Day 2**: DataContext統合と選択的フック
3. **Day 3**: テストとバグ修正
4. **Day 4**: パフォーマンス最適化

## 成功指標

- [ ] Firebase読み取り回数が画面遷移ごとに1-2回以内
- [ ] リアルタイム更新の遅延が100ms以内
- [ ] すべてのCRUD操作が正常に動作
- [ ] ロールベースアクセス制御が機能
- [ ] エラー処理が適切に実装

## 参考資料

- MMS Finance DataContext実装: `/Users/nishimototakashi/claude code/mms-finance/src/contexts/DataContext.tsx`
- Firebase公式ドキュメント: https://firebase.google.com/docs/firestore
- React Context API: https://react.dev/reference/react/createContext