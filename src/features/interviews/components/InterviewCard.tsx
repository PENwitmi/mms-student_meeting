import React, { useState } from 'react';
import type { InterviewRecord } from '@/contexts/types';

interface InterviewCardProps {
  interview: InterviewRecord;
  onEdit?: (interview: InterviewRecord) => void;
  onDelete?: (id: string) => void;
  canEdit: boolean;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({ 
  interview, 
  onEdit, 
  onDelete,
  canEdit 
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const toggleExpand = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const renderTextSection = (
    title: string,
    content: string | undefined,
    sectionKey: string,
    colorClass: string = 'bg-gray-50'
  ) => {
    if (!content) return null;
    
    const shouldTruncate = content.length > 150;
    const isExpanded = expandedSections[sectionKey];
    const displayContent = isExpanded || !shouldTruncate
      ? content
      : content.substring(0, 150) + '...';

    return (
      <div className={`${colorClass} rounded-md p-3 mb-3`}>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => toggleExpand(sectionKey)}
            className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium focus:outline-none focus:underline"
          >
            {isExpanded ? '閉じる' : '続きを読む'}
          </button>
        )}
      </div>
    );
  };

  // データが存在するかチェック（旧フィールドと新フィールドの両方をチェック）
  const hasAnyContent = 
    interview.weeklyGoodPoints ||
    interview.weeklyMorePoints ||
    interview.lessonPlan ||
    interview.homeworkPlan ||
    interview.otherNotes ||
    interview.notes ||  // 旧フィールドも確認（互換性のため）
    interview.followUp; // 旧フィールドも確認（互換性のため）

  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200">
      {/* ヘッダー部分 */}
      <header className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {interview.studentName}
          </h3>
          <time className="text-sm text-gray-500" dateTime={interview.date.toISOString()}>
            {formatDate(interview.date)}
          </time>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit?.(interview)}
              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
              title="編集"
              aria-label={`${interview.studentName}の面談記録を編集`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete?.(interview.id)}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
              title="削除"
              aria-label={`${interview.studentName}の面談記録を削除`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* コンテンツセクション */}
      <div className="space-y-3">
        {/* 週次振り返り */}
        {(interview.weeklyGoodPoints || interview.weeklyMorePoints) && (
          <div className="border-l-4 border-blue-500 pl-3">
            <h3 className="text-sm font-bold text-gray-800 mb-2">週次振り返り</h3>
            {renderTextSection('Good Point', interview.weeklyGoodPoints, 'goodPoints', 'bg-green-50')}
            {renderTextSection('More Point', interview.weeklyMorePoints, 'morePoints', 'bg-yellow-50')}
          </div>
        )}

        {/* 今後の計画 */}
        {(interview.lessonPlan || interview.homeworkPlan) && (
          <div className="border-l-4 border-indigo-500 pl-3">
            <h3 className="text-sm font-bold text-gray-800 mb-2">今後の計画</h3>
            {renderTextSection('授業計画', interview.lessonPlan, 'lessonPlan', 'bg-indigo-50')}
            {renderTextSection('家庭学習計画', interview.homeworkPlan, 'homeworkPlan', 'bg-purple-50')}
          </div>
        )}

        {/* その他 */}
        {interview.otherNotes && (
          <div className="border-l-4 border-gray-500 pl-3">
            <h3 className="text-sm font-bold text-gray-800 mb-2">その他</h3>
            {renderTextSection('話し合い内容', interview.otherNotes, 'otherNotes', 'bg-gray-50')}
          </div>
        )}

        {/* 旧フィールドの表示（互換性のため） */}
        {interview.notes && !interview.otherNotes && (
          <div className="border-l-4 border-orange-500 pl-3">
            {renderTextSection('面談内容（旧形式）', interview.notes, 'notes', 'bg-orange-50')}
          </div>
        )}
        
        {interview.followUp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              フォローアップ事項（旧形式）
            </h4>
            <p className="text-sm text-yellow-700 whitespace-pre-wrap">
              {interview.followUp}
            </p>
          </div>
        )}

        {/* 内容が何もない場合 */}
        {!hasAnyContent && (
          <p className="text-gray-400 text-sm text-center py-4">
            記録内容なし
          </p>
        )}
      </div>

      {/* フッター（作成日時） */}
      <footer className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          作成日時: {interview.createdAt.toLocaleDateString('ja-JP')} {interview.createdAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          {interview.updatedAt.getTime() !== interview.createdAt.getTime() && (
            <span className="ml-2">
              (更新: {interview.updatedAt.toLocaleDateString('ja-JP')} {interview.updatedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </p>
      </footer>
    </article>
  );
};