import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewList } from './InterviewList';
import { InterviewFormModal } from './InterviewFormModal';
import type { InterviewRecord, InterviewFilters } from '@/contexts/types';

interface InterviewSectionProps {
  filters?: InterviewFilters;
}

export const InterviewSection: React.FC<InterviewSectionProps> = ({ filters = {} }) => {
  const { userRole } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewRecord | null>(null);
  
  const canEdit = userRole === 'admin';

  const handleCreateClick = () => {
    setEditingInterview(null);
    setIsFormOpen(true);
  };

  const handleEdit = (interview: InterviewRecord) => {
    setEditingInterview(interview);
    setIsFormOpen(true);
  };

  const handleModalClose = () => {
    setIsFormOpen(false);
    setEditingInterview(null);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingInterview(null);
  };

  return (
    <section className="space-y-6" aria-labelledby="interviews-heading">
      {/* ヘッダー */}
      <header className="flex justify-between items-center">
        <div>
          <h2 id="interviews-heading" className="text-2xl font-bold text-gray-900">
            面談記録
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {canEdit ? '学生との面談記録を管理できます' : 'あなたの面談記録を確認できます'}
          </p>
        </div>
        
        {canEdit && (
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </button>
        )}
      </header>

      {/* 面談記録リスト */}
      <InterviewList
        filters={filters}
        onEdit={handleEdit}
        canEdit={canEdit}
      />

      {/* フォームモーダル */}
      <InterviewFormModal
        isOpen={isFormOpen}
        interview={editingInterview}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </section>
  );
};