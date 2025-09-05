import React, { useState, useMemo } from 'react';
import { useInterviews } from '@/contexts/hooks/realtime/useInterviews';
import { InterviewCard } from './InterviewCard';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { InterviewRecord, InterviewFilters } from '@/contexts/types';

interface InterviewListProps {
  filters?: InterviewFilters;
  onEdit?: (interview: InterviewRecord) => void;
  canEdit: boolean;
}

export const InterviewList: React.FC<InterviewListProps> = ({ 
  filters = {},
  onEdit,
  canEdit 
}) => {
  const { interviews, loading, error, deleteInterview } = useInterviews();
  const [deleteTarget, setDeleteTarget] = useState<InterviewRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // フィルタリング処理
  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      // 学生IDでフィルタ
      if (filters.studentId && interview.studentId !== filters.studentId) {
        return false;
      }

      // 日付範囲でフィルタ
      if (filters.dateFrom && interview.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999); // 当日の終わりまで含める
        if (interview.date > endDate) {
          return false;
        }
      }

      // 検索キーワードでフィルタ
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          interview.studentName,
          interview.otherNotes || '',
          interview.weeklyGoodPoints || '',
          interview.weeklyMorePoints || '',
          interview.lessonPlan || '',
          interview.homeworkPlan || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [interviews, filters]);

  const handleDelete = async (id: string) => {
    const interview = interviews.find(i => i.id === id);
    if (!interview) return;
    
    setDeleteTarget(interview);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await deleteInterview(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('削除エラー:', error);
      // エラーハンドリングは必要に応じて追加
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // ローディング状態
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>面談記録を読み込み中...</span>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 inline-block">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                面談記録の読み込みでエラーが発生しました
              </h3>
              <p className="mt-2 text-sm text-red-700">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 面談記録がない場合
  if (filteredInterviews.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">面談記録がありません</h3>
        <p className="mt-1 text-sm text-gray-500">
          {Object.keys(filters).some(key => filters[key as keyof InterviewFilters])
            ? 'フィルタ条件に一致する面談記録が見つかりません'
            : canEdit 
              ? '新しい面談記録を作成してください'
              : 'まだ面談記録がありません'
          }
        </p>
      </div>
    );
  }

  // 面談記録リスト表示
  return (
    <>
      <div className="space-y-4">
        {/* 件数表示 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {interviews.length !== filteredInterviews.length && (
              <span>{interviews.length}件中 </span>
            )}
            <span className="font-medium">{filteredInterviews.length}件</span>の面談記録
          </p>
        </div>

        {/* 面談記録カード一覧 */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {filteredInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onEdit={onEdit}
              onDelete={handleDelete}
              canEdit={canEdit}
            />
          ))}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        studentName={deleteTarget?.studentName || ''}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};