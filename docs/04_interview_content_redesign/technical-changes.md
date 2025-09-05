# 面談記録再設計 - 技術的変更詳細

## 変更前後の比較

### Before（現在の実装）
```typescript
// 必須項目が多すぎる
- 生徒（必須）
- 日付（必須）
- トピック（必須、最低1つ）
- 面談内容（必須、50-5000文字）
- フォローアップ（任意、最大1000文字）
```

### After（新実装）
```typescript
// 必須は2つだけ
- 生徒（必須）
- 日付（必須）
- Good Point（任意）
- More Point（任意）
- 授業計画（任意）
- 家庭学習計画（任意）
- その他（任意）
```

## 具体的な変更内容

### 1. 型定義の変更
`src/contexts/types/interview.ts`

```typescript
// 削除
export interface InterviewRecord {
  topics: string[]       // 削除
  notes: string         // 削除
  followUp?: string     // 削除
}

// 追加
export interface InterviewRecord {
  id: string
  studentId: string                // 必須
  studentName: string         
  date: Date                       // 必須
  
  // 週次振り返り（任意）
  weeklyGoodPoints?: string        // Good Point
  weeklyMorePoints?: string        // More Point
  
  // 今後の計画（任意）
  lessonPlan?: string              // 授業計画
  homeworkPlan?: string            // 家庭学習計画
  
  // その他（任意）
  otherNotes?: string              // その他の話し合い
  
  // メタデータ
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface InterviewInput {
  studentId: string                // 必須
  studentName: string         
  date: Date                       // 必須
  weeklyGoodPoints?: string        // 任意
  weeklyMorePoints?: string        // 任意
  lessonPlan?: string              // 任意
  homeworkPlan?: string            // 任意
  otherNotes?: string              // 任意
}
```

### 2. バリデーション変更
`src/features/interviews/utils/validation.ts`

```typescript
export const validateInterviewForm = (
  values: InterviewInput
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // 必須項目のチェック（2つのみ）
  if (!values.studentId) {
    errors.studentId = '生徒を選択してください';
  }

  if (!values.date) {
    errors.date = '面談日を入力してください';
  } else if (values.date > new Date()) {
    errors.date = '未来の日付は選択できません';
  }

  // 削除：トピック、文字数制限、その他すべての検証

  return errors;
};
```

### 3. フォームコンポーネントの簡素化
`src/features/interviews/components/InterviewForm.tsx`

主な変更点：
- TopicsInputコンポーネントの削除
- 文字数カウンターの削除
- 5つの独立したテキストエリアに変更
- バリデーションメッセージの簡略化

```typescript
export const InterviewForm: React.FC<InterviewFormProps> = ({
  interview,
  onSuccess,
  onCancel
}) => {
  // ... 

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 必須項目セクション */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          基本情報（必須）
        </h3>
        
        {/* 学生選択 */}
        <StudentSelect ... />
        
        {/* 面談日 */}
        <DateInput ... />
      </div>

      {/* 週次振り返りセクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          直近1週間の振り返り
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Good Point（良かった点）
          </label>
          <textarea
            value={values.weeklyGoodPoints || ''}
            onChange={(e) => handleChange('weeklyGoodPoints', e.target.value)}
            rows={4}
            placeholder="生徒の成長、努力、改善が見られた点を記録"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            More Point（改善点）
          </label>
          <textarea
            value={values.weeklyMorePoints || ''}
            onChange={(e) => handleChange('weeklyMorePoints', e.target.value)}
            rows={4}
            placeholder="今後改善が必要な点、課題となっている点を記録"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* 今後の計画セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          今後の計画
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            授業計画
          </label>
          <textarea
            value={values.lessonPlan || ''}
            onChange={(e) => handleChange('lessonPlan', e.target.value)}
            rows={4}
            placeholder="次週以降の授業方針、カリキュラムの調整内容を記録"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            家庭学習計画
          </label>
          <textarea
            value={values.homeworkPlan || ''}
            onChange={(e) => handleChange('homeworkPlan', e.target.value)}
            rows={4}
            placeholder="宿題の内容、自主学習の指導内容を記録"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* その他セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          その他
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            その他の話し合い内容
          </label>
          <textarea
            value={values.otherNotes || ''}
            onChange={(e) => handleChange('otherNotes', e.target.value)}
            rows={4}
            placeholder="保護者への連絡事項、その他重要事項を記録"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* ボタン（文字数制限なし、常に有効） */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel}>キャンセル</button>
        <button 
          type="submit" 
          disabled={isSubmitting || !values.studentId || !values.date}
        >
          保存
        </button>
      </div>
    </form>
  );
};
```

### 4. カード表示の変更
`src/features/interviews/components/InterviewCard.tsx`

```typescript
export const InterviewCard: React.FC<InterviewCardProps> = ({ 
  interview, 
  onEdit, 
  onDelete,
  canEdit 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {interview.studentName}
          </h3>
          <p className="text-sm text-gray-500">
            {interview.date.toLocaleDateString('ja-JP')}
          </p>
        </div>
        {/* 編集・削除ボタン */}
      </div>

      {/* コンテンツ（空の項目は表示しない） */}
      <div className="space-y-4">
        {interview.weeklyGoodPoints && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Good Point</h4>
            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
              {interview.weeklyGoodPoints}
            </p>
          </div>
        )}

        {interview.weeklyMorePoints && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">More Point</h4>
            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
              {interview.weeklyMorePoints}
            </p>
          </div>
        )}

        {interview.lessonPlan && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">授業計画</h4>
            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
              {interview.lessonPlan}
            </p>
          </div>
        )}

        {interview.homeworkPlan && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">家庭学習計画</h4>
            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
              {interview.homeworkPlan}
            </p>
          </div>
        )}

        {interview.otherNotes && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">その他</h4>
            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
              {interview.otherNotes}
            </p>
          </div>
        )}

        {/* すべての項目が空の場合 */}
        {!interview.weeklyGoodPoints && 
         !interview.weeklyMorePoints && 
         !interview.lessonPlan && 
         !interview.homeworkPlan && 
         !interview.otherNotes && (
          <p className="text-gray-400 text-sm">記録内容なし</p>
        )}
      </div>
    </div>
  );
};
```

### 5. フック更新
`src/features/interviews/hooks/useInterviewForm.ts`

```typescript
const useInterviewForm = ({ initialData, onSubmit, onSuccess, onError }) => {
  // isDirtyの判定を簡素化
  const isDirty = initialData 
    ? // 編集時：何か変更があれば
      JSON.stringify(state.values) !== JSON.stringify(initialValues)
    : // 新規作成時：必須項目（生徒と日付）が入力されていれば
      Boolean(state.values.studentId && state.values.date);

  // isValidの判定も簡素化
  const isValid = Boolean(state.values.studentId && state.values.date);
  
  // ...
};
```

## 削除するファイル
- `src/features/interviews/components/TopicsInput.tsx` - 不要になるため削除

## 実装の優先順位

1. **型定義とバリデーション変更**（最優先）
   - データモデルの基盤となるため

2. **フォーム実装**
   - ユーザーが直接触れる部分

3. **表示系の更新**
   - データが保存されてから確認

4. **クリーンアップ**
   - 不要なコンポーネントの削除
   - コードの整理