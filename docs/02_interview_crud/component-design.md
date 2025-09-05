# 面談記録CRUD コンポーネント設計書

## コンポーネント階層

```
Dashboard
├── InterviewSection          # 面談記録セクション全体
│   ├── InterviewHeader       # ヘッダー（タイトル + 新規作成ボタン）
│   ├── InterviewFilters      # フィルター（学生、期間、トピック）
│   ├── InterviewList         # 面談記録リスト
│   │   └── InterviewCard     # 個別の面談記録カード
│   └── InterviewFormModal    # 作成・編集用モーダル
│       └── InterviewForm     # フォーム本体
```

## 詳細設計

### 1. InterviewSection（メインコンテナ）

**責務**: 面談記録機能全体の管理

```typescript
interface InterviewSectionProps {
  userRole: 'admin' | 'student';
}

const InterviewSection: React.FC<InterviewSectionProps> = ({ userRole }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewRecord | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    studentId: '',
    dateFrom: null,
    dateTo: null,
    topics: []
  });

  return (
    <div className="space-y-4">
      <InterviewHeader 
        onCreateClick={() => setIsFormOpen(true)}
        canCreate={userRole === 'admin'}
      />
      
      <InterviewFilters 
        filters={filters}
        onChange={setFilters}
        showStudentFilter={userRole === 'admin'}
      />
      
      <InterviewList 
        filters={filters}
        onEdit={(interview) => {
          setEditingInterview(interview);
          setIsFormOpen(true);
        }}
        canEdit={userRole === 'admin'}
      />
      
      {isFormOpen && (
        <InterviewFormModal
          interview={editingInterview}
          onClose={() => {
            setIsFormOpen(false);
            setEditingInterview(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingInterview(null);
          }}
        />
      )}
    </div>
  );
};
```

### 2. InterviewHeader

**責務**: セクションのタイトルと新規作成ボタン表示

```typescript
interface InterviewHeaderProps {
  onCreateClick: () => void;
  canCreate: boolean;
}

const InterviewHeader: React.FC<InterviewHeaderProps> = ({ 
  onCreateClick, 
  canCreate 
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">
        面談記録
      </h2>
      {canCreate && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="w-5 h-5 mr-2" /* Plus icon */ />
          新規作成
        </button>
      )}
    </div>
  );
};
```

### 3. InterviewCard

**責務**: 個別の面談記録表示

```typescript
interface InterviewCardProps {
  interview: InterviewRecord;
  onEdit?: (interview: InterviewRecord) => void;
  onDelete?: (id: string) => void;
  canEdit: boolean;
}

const InterviewCard: React.FC<InterviewCardProps> = ({ 
  interview, 
  onEdit, 
  onDelete,
  canEdit 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {interview.studentName}
          </h3>
          <p className="text-sm text-gray-500">
            {interview.date.toLocaleDateString('ja-JP')}
          </p>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(interview)}
              className="text-indigo-600 hover:text-indigo-900"
              title="編集"
            >
              <svg className="w-5 h-5" /* Edit icon */ />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-900"
              title="削除"
            >
              <svg className="w-5 h-5" /* Trash icon */ />
            </button>
          </div>
        )}
      </div>

      {/* トピックタグ */}
      <div className="flex flex-wrap gap-1 mb-3">
        {interview.topics.map((topic, index) => (
          <span
            key={index}
            className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* 面談内容 */}
      <div className="text-gray-700">
        <p className={expanded ? '' : 'line-clamp-3'}>
          {interview.notes}
        </p>
        {interview.notes.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
          >
            {expanded ? '閉じる' : '続きを読む'}
          </button>
        )}
      </div>

      {/* フォローアップ */}
      {interview.followUp && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm font-medium text-yellow-800 mb-1">
            フォローアップ事項
          </p>
          <p className="text-sm text-yellow-700">
            {interview.followUp}
          </p>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          onConfirm={() => {
            onDelete?.(interview.id);
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};
```

### 4. InterviewFormModal

**責務**: フォームのモーダル表示

```typescript
interface InterviewFormModalProps {
  interview?: InterviewRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const InterviewFormModal: React.FC<InterviewFormModalProps> = ({ 
  interview, 
  onClose, 
  onSuccess 
}) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {interview ? '面談記録を編集' : '新しい面談記録'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" /* X icon */ />
            </button>
          </div>
          
          <InterviewForm
            interview={interview}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
```

## 状態管理パターン

### フォーム状態管理（useInterviewForm）

```typescript
interface FormState {
  values: InterviewInput;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

const useInterviewForm = (initialValues?: InterviewRecord) => {
  const [state, setState] = useState<FormState>({
    values: {
      studentId: initialValues?.studentId || '',
      studentName: initialValues?.studentName || '',
      date: initialValues?.date || new Date(),
      topics: initialValues?.topics || [],
      notes: initialValues?.notes || '',
      followUp: initialValues?.followUp || ''
    },
    errors: {},
    touched: {},
    isSubmitting: false
  });

  const handleChange = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  const handleBlur = (field: string) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true }
    }));
    validateField(field);
  };

  const validateField = (field: string) => {
    // バリデーションロジック
  };

  const handleSubmit = async () => {
    // 送信処理
  };

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  };
};
```

## レスポンシブデザイン

### ブレークポイント別の表示

```css
/* モバイル（〜640px） */
@media (max-width: 639px) {
  .interview-card {
    @apply p-3;
  }
  
  .interview-form {
    @apply px-4;
  }
  
  .form-group {
    @apply space-y-3;
  }
}

/* タブレット（640px〜1024px） */
@media (min-width: 640px) and (max-width: 1023px) {
  .interview-list {
    @apply grid grid-cols-1 gap-4;
  }
}

/* デスクトップ（1024px〜） */
@media (min-width: 1024px) {
  .interview-list {
    @apply grid grid-cols-2 gap-6;
  }
  
  .interview-form-modal {
    @apply max-w-3xl;
  }
}
```

## アニメーション

### トランジション定義

```css
/* カードホバー */
.interview-card {
  transition: all 0.2s ease-in-out;
}

.interview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* モーダル表示 */
@keyframes modal-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-container {
  animation: modal-fade-in 0.2s ease-out;
}

/* 削除アニメーション */
@keyframes slide-out {
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

.deleting {
  animation: slide-out 0.3s ease-out forwards;
}
```

## エラー処理

### エラー境界コンポーネント

```typescript
class InterviewErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Interview component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-medium">
            エラーが発生しました
          </h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-red-600 underline text-sm"
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## パフォーマンス最適化

### メモ化戦略

```typescript
// カードコンポーネントのメモ化
const InterviewCard = React.memo<InterviewCardProps>(
  ({ interview, onEdit, onDelete, canEdit }) => {
    // コンポーネント実装
  },
  (prevProps, nextProps) => {
    // カスタム比較ロジック
    return (
      prevProps.interview.id === nextProps.interview.id &&
      prevProps.interview.updatedAt === nextProps.interview.updatedAt &&
      prevProps.canEdit === nextProps.canEdit
    );
  }
);

// フィルター処理のメモ化
const filteredInterviews = useMemo(() => {
  return interviews.filter(interview => {
    if (filters.studentId && interview.studentId !== filters.studentId) {
      return false;
    }
    if (filters.dateFrom && interview.date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && interview.date > filters.dateTo) {
      return false;
    }
    if (filters.topics.length > 0) {
      const hasMatchingTopic = filters.topics.some(topic => 
        interview.topics.includes(topic)
      );
      if (!hasMatchingTopic) return false;
    }
    return true;
  });
}, [interviews, filters]);

// デバウンス処理
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 300),
  []
);
```

## アクセシビリティ

### ARIA属性とキーボードナビゲーション

```typescript
<div
  role="region"
  aria-label="面談記録一覧"
  tabIndex={0}
>
  <div
    role="list"
    aria-label="面談記録"
  >
    {interviews.map(interview => (
      <article
        key={interview.id}
        role="listitem"
        aria-label={`${interview.studentName}との面談記録`}
      >
        {/* カード内容 */}
      </article>
    ))}
  </div>
</div>

// キーボードショートカット
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl/Cmd + N: 新規作成
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      setIsFormOpen(true);
    }
    // Escape: モーダルを閉じる
    if (e.key === 'Escape' && isFormOpen) {
      setIsFormOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isFormOpen]);
```