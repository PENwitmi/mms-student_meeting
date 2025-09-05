import React from 'react';
import { useInterviews } from '@/contexts/hooks/realtime/useInterviews';
import { useInterviewForm } from '../hooks/useInterviewForm';
import { StudentSelect } from './StudentSelect';
import { TopicsInput } from './TopicsInput';
import type { InterviewRecord } from '@/contexts/types';

interface InterviewFormProps {
  interview?: InterviewRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InterviewForm: React.FC<InterviewFormProps> = ({
  interview,
  onSuccess,
  onCancel
}) => {
  const { addInterview, updateInterview } = useInterviews();
  const isEditMode = Boolean(interview);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleStudentChange,
    handleBlur,
    handleSubmit
  } = useInterviewForm({
    initialData: interview,
    onSubmit: async (data) => {
      if (isEditMode && interview) {
        await updateInterview(interview.id, data);
      } else {
        await addInterview(data);
      }
    },
    onSuccess
  });

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    handleChange('date', date);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 学生選択 */}
      <StudentSelect
        value={values.studentId}
        onChange={handleStudentChange}
        error={touched.studentId ? errors.studentId : undefined}
        disabled={isSubmitting}
      />

      {/* 面談日 */}
      <div>
        <label htmlFor="interviewDate" className="block text-sm font-medium text-gray-700 mb-2">
          面談日 <span className="text-red-500">*</span>
        </label>
        <input
          id="interviewDate"
          type="date"
          value={formatDateForInput(values.date)}
          onChange={handleDateChange}
          onBlur={() => handleBlur('date')}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
            touched.date && errors.date 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
          }`}
        />
        {touched.date && errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date}</p>
        )}
      </div>

      {/* トピック入力 */}
      <TopicsInput
        value={values.topics}
        onChange={(topics) => handleChange('topics', topics)}
        error={touched.topics ? errors.topics : undefined}
        disabled={isSubmitting}
      />

      {/* 面談内容 */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          面談内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          onBlur={() => handleBlur('notes')}
          disabled={isSubmitting}
          rows={8}
          placeholder="面談で話し合った内容を詳しく記録してください（最低50文字）"
          className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical ${
            touched.notes && errors.notes 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {touched.notes && errors.notes && (
            <p className="text-sm text-red-600">{errors.notes}</p>
          )}
          <p className={`text-sm ${
            values.notes.length < 50 
              ? 'text-red-500' 
              : values.notes.length > 5000 
                ? 'text-red-500' 
                : 'text-gray-500'
          } ml-auto`}>
            {values.notes.length}/5000文字 {values.notes.length < 50 ? `(あと${50 - values.notes.length}文字必要)` : ''}
          </p>
        </div>
      </div>

      {/* フォローアップ事項 */}
      <div>
        <label htmlFor="followUp" className="block text-sm font-medium text-gray-700 mb-2">
          フォローアップ事項 <span className="text-gray-400">(オプション)</span>
        </label>
        <textarea
          id="followUp"
          value={values.followUp || ''}
          onChange={(e) => handleChange('followUp', e.target.value)}
          onBlur={() => handleBlur('followUp')}
          disabled={isSubmitting}
          rows={4}
          placeholder="今後の対応が必要な事項があれば記録してください"
          className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical ${
            touched.followUp && errors.followUp 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {touched.followUp && errors.followUp && (
            <p className="text-sm text-red-600">{errors.followUp}</p>
          )}
          <p className={`text-sm ${
            (values.followUp?.length || 0) > 1000 
              ? 'text-red-500' 
              : 'text-gray-500'
          } ml-auto`}>
            {values.followUp?.length || 0}/1000文字
          </p>
        </div>
      </div>

      {/* フォームボタン */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !isValid || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? '保存中...' 
            : isEditMode 
              ? '更新' 
              : '作成'
          }
        </button>
      </div>

      {/* ヘルプテキスト */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-700">
          <strong>記録のポイント:</strong>
        </p>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>学生の状況や相談内容を具体的に記録してください</li>
          <li>今後のサポートに必要な情報を漏らさず記載してください</li>
          <li>フォローアップが必要な事項は別途記録してください</li>
        </ul>
      </div>
    </form>
  );
};