# 面談記録CRUD機能 実装計画書

## 概要
管理者が面談記録を作成・編集・削除できる機能を実装します。
MVPでは管理者のみがCRUD操作を行い、学生は閲覧のみとします。

## 実装スコープ

### Phase 1: 作成機能（Create）
- 面談記録作成フォーム
- 学生選択（ドロップダウン）
- 日付選択
- トピック入力（複数可）
- 面談内容記入
- フォローアップ事項（オプション）

### Phase 2: 表示機能（Read）
- 面談記録リスト表示
- 詳細表示モーダル/ページ
- 検索・フィルタリング機能

### Phase 3: 編集機能（Update）
- 既存記録の編集フォーム
- 変更履歴の記録

### Phase 4: 削除機能（Delete）
- 削除確認ダイアログ
- ソフトデリート（オプション）

## 技術設計

### コンポーネント構造
```
src/features/interviews/
├── components/
│   ├── InterviewForm.tsx         # 作成・編集フォーム
│   ├── InterviewList.tsx         # 一覧表示
│   ├── InterviewDetail.tsx       # 詳細表示
│   ├── InterviewCard.tsx         # カード表示
│   └── DeleteConfirmDialog.tsx   # 削除確認
├── hooks/
│   ├── useInterviewForm.ts       # フォーム管理
│   └── useInterviewFilters.ts    # フィルタリング
└── types/
    └── index.ts                   # 型定義
```

### データフロー
1. **作成フロー**
   ```
   InterviewForm → useInterviewsData().addInterview → Firebase → onSnapshot → 自動更新
   ```

2. **更新フロー**
   ```
   InterviewForm → useInterviewsData().updateInterview → Firebase → onSnapshot → 自動更新
   ```

3. **削除フロー**
   ```
   DeleteDialog → useInterviewsData().deleteInterview → Firebase → onSnapshot → 自動更新
   ```

## UI設計

### 作成フォーム
```jsx
<InterviewForm>
  <StudentSelect />      // 学生選択
  <DatePicker />        // 日付選択
  <TopicsInput />       // トピック入力（タグ形式）
  <NotesTextarea />     // 面談内容
  <FollowUpInput />     // フォローアップ（オプション）
  <SubmitButton />      // 保存ボタン
</InterviewForm>
```

### 一覧表示
```jsx
<InterviewList>
  <FilterBar />         // 検索・フィルター
  <InterviewCard />     // カード形式で表示
  <Pagination />        // ページネーション
</InterviewList>
```

## 実装詳細

### 1. InterviewForm実装
```typescript
interface InterviewFormProps {
  mode: 'create' | 'edit';
  initialData?: InterviewRecord;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  mode,
  initialData,
  onSuccess,
  onCancel
}) => {
  const { students } = useStudentsData();
  const { addInterview, updateInterview } = useInterviewsData();
  const [formData, setFormData] = useState<InterviewInput>({
    studentId: initialData?.studentId || '',
    studentName: initialData?.studentName || '',
    date: initialData?.date || new Date(),
    topics: initialData?.topics || [],
    notes: initialData?.notes || '',
    followUp: initialData?.followUp || ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        await addInterview(formData);
      } else {
        await updateInterview(initialData!.id, formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム要素 */}
    </form>
  );
};
```

### 2. 学生選択コンポーネント
```typescript
const StudentSelect: React.FC<{
  value: string;
  onChange: (studentId: string, studentName: string) => void;
}> = ({ value, onChange }) => {
  const { students, loading } = useStudentsData();

  return (
    <select
      value={value}
      onChange={(e) => {
        const student = students.find(s => s.id === e.target.value);
        if (student) {
          onChange(student.id, student.name);
        }
      }}
      disabled={loading}
    >
      <option value="">学生を選択</option>
      {students.map(student => (
        <option key={student.id} value={student.id}>
          {student.name} ({student.studentId})
        </option>
      ))}
    </select>
  );
};
```

### 3. トピック入力（タグ形式）
```typescript
const TopicsInput: React.FC<{
  value: string[];
  onChange: (topics: string[]) => void;
}> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTopic = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    onChange(value.filter(t => t !== topic));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(topic => (
          <span
            key={topic}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {topic}
            <button
              type="button"
              onClick={() => handleRemoveTopic(topic)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
          placeholder="トピックを入力"
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          type="button"
          onClick={handleAddTopic}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          追加
        </button>
      </div>
    </div>
  );
};
```

## バリデーション

### フォーム検証ルール
- 学生選択: 必須
- 日付: 必須、未来日付不可
- トピック: 最低1つ必須
- 面談内容: 必須、最低50文字
- フォローアップ: オプション、最大500文字

### エラーハンドリング
```typescript
const validateForm = (data: InterviewInput): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.studentId) {
    errors.studentId = '学生を選択してください';
  }

  if (!data.date) {
    errors.date = '日付を入力してください';
  } else if (data.date > new Date()) {
    errors.date = '未来の日付は選択できません';
  }

  if (data.topics.length === 0) {
    errors.topics = 'トピックを最低1つ入力してください';
  }

  if (!data.notes) {
    errors.notes = '面談内容を入力してください';
  } else if (data.notes.length < 50) {
    errors.notes = '面談内容は50文字以上入力してください';
  }

  if (data.followUp && data.followUp.length > 500) {
    errors.followUp = 'フォローアップは500文字以内で入力してください';
  }

  return errors;
};
```

## スタイリング

### Tailwind CSSクラス設計
```css
/* フォームコンテナ */
.interview-form-container {
  @apply max-w-2xl mx-auto p-6 bg-white rounded-lg shadow;
}

/* フォームグループ */
.form-group {
  @apply mb-4;
}

/* ラベル */
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

/* 入力フィールド */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500;
}

/* エラーメッセージ */
.error-message {
  @apply mt-1 text-sm text-red-600;
}

/* ボタン */
.btn-primary {
  @apply px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
```

## テスト項目

### 単体テスト
- [ ] フォーム入力値の検証
- [ ] バリデーションロジック
- [ ] 日付フォーマット変換
- [ ] トピック追加・削除

### 統合テスト
- [ ] 面談記録の作成フロー
- [ ] 編集・更新フロー
- [ ] 削除フロー
- [ ] リアルタイム更新

### E2Eテスト
- [ ] 管理者による全CRUD操作
- [ ] 学生による閲覧のみ確認
- [ ] エラーケースの処理

## 実装スケジュール

### Day 1（今日）: 基本フォーム実装
- InterviewFormコンポーネント
- 学生選択機能
- 基本的なバリデーション

### Day 2: UI改善と一覧表示
- InterviewListコンポーネント
- フィルタリング機能
- ページネーション

### Day 3: 編集・削除機能
- 編集フォーム
- 削除確認ダイアログ
- 完了通知

### Day 4: テストとリファクタリング
- バグ修正
- パフォーマンス最適化
- ドキュメント更新

## 成功指標

- [ ] 管理者が面談記録を作成できる
- [ ] 作成後、即座にリストに反映される
- [ ] 学生が自分の面談記録を確認できる
- [ ] エラー時に適切なメッセージが表示される
- [ ] レスポンシブデザインが適用されている

## 注意事項

### セキュリティ
- XSS対策（HTMLのサニタイズ）
- SQLインジェクション対策（Firestoreは自動対応）
- 権限チェックの徹底

### パフォーマンス
- 大量データ時のページネーション
- 画像アップロード時の圧縮（将来実装）
- デバウンスによる過剰なAPI呼び出し防止

### アクセシビリティ
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切なARIA属性の設定