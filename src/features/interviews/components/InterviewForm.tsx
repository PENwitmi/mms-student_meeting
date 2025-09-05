import React from 'react';
import { useInterviews } from '@/contexts/hooks/realtime/useInterviews';
import { useInterviewForm } from '../hooks/useInterviewForm';
import { StudentSelect } from './StudentSelect';
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
      {/* 基本情報セクション（必須項目） */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          基本情報（必須）
        </h3>
        
        {/* 学生選択 */}
        <div className="mb-4">
          <StudentSelect
            value={values.studentId}
            onChange={handleStudentChange}
            error={touched.studentId ? errors.studentId : undefined}
            disabled={isSubmitting}
          />
        </div>

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
      </div>

      {/* 週次振り返りセクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          直近1週間の振り返り
        </h3>
        
        {/* Good Point */}
        <div>
          <label htmlFor="weeklyGoodPoints" className="block text-sm font-medium text-gray-700 mb-2">
            Good Point（良かった点）
            <span className="text-gray-400 text-xs ml-2">任意</span>
          </label>
          <textarea
            id="weeklyGoodPoints"
            value={values.weeklyGoodPoints || ''}
            onChange={(e) => handleChange('weeklyGoodPoints', e.target.value)}
            onBlur={() => handleBlur('weeklyGoodPoints')}
            disabled={isSubmitting}
            rows={4}
            placeholder="生徒の成長、努力、改善が見られた点を記録"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
          />
        </div>

        {/* More Point */}
        <div>
          <label htmlFor="weeklyMorePoints" className="block text-sm font-medium text-gray-700 mb-2">
            More Point（改善点）
            <span className="text-gray-400 text-xs ml-2">任意</span>
          </label>
          <textarea
            id="weeklyMorePoints"
            value={values.weeklyMorePoints || ''}
            onChange={(e) => handleChange('weeklyMorePoints', e.target.value)}
            onBlur={() => handleBlur('weeklyMorePoints')}
            disabled={isSubmitting}
            rows={4}
            placeholder="今後改善が必要な点、課題となっている点を記録"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
          />
        </div>
      </div>

      {/* 今後の計画セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          今後の計画
        </h3>
        
        {/* 授業計画 */}
        <div>
          <label htmlFor="lessonPlan" className="block text-sm font-medium text-gray-700 mb-2">
            授業計画
            <span className="text-gray-400 text-xs ml-2">任意</span>
          </label>
          <textarea
            id="lessonPlan"
            value={values.lessonPlan || ''}
            onChange={(e) => handleChange('lessonPlan', e.target.value)}
            onBlur={() => handleBlur('lessonPlan')}
            disabled={isSubmitting}
            rows={4}
            placeholder="次週以降の授業方針、カリキュラムの調整内容を記録"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
          />
        </div>

        {/* 家庭学習計画 */}
        <div>
          <label htmlFor="homeworkPlan" className="block text-sm font-medium text-gray-700 mb-2">
            家庭学習計画
            <span className="text-gray-400 text-xs ml-2">任意</span>
          </label>
          <textarea
            id="homeworkPlan"
            value={values.homeworkPlan || ''}
            onChange={(e) => handleChange('homeworkPlan', e.target.value)}
            onBlur={() => handleBlur('homeworkPlan')}
            disabled={isSubmitting}
            rows={4}
            placeholder="宿題の内容、自主学習の指導内容を記録"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
          />
        </div>
      </div>

      {/* その他セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          その他
        </h3>
        
        <div>
          <label htmlFor="otherNotes" className="block text-sm font-medium text-gray-700 mb-2">
            その他の話し合い内容
            <span className="text-gray-400 text-xs ml-2">任意</span>
          </label>
          <textarea
            id="otherNotes"
            value={values.otherNotes || ''}
            onChange={(e) => handleChange('otherNotes', e.target.value)}
            onBlur={() => handleBlur('otherNotes')}
            disabled={isSubmitting}
            rows={4}
            placeholder="保護者への連絡事項、その他重要事項を記録"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
          />
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
          disabled={isSubmitting || !isValid}
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
          <li>必須項目は生徒と面談日のみです</li>
          <li>記録項目はすべて任意ですので、必要な項目のみ入力してください</li>
          <li>文字数制限はありませんので、自由に記録してください</li>
        </ul>
      </div>
    </form>
  );
};