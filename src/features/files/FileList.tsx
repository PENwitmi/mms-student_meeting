/**
 * ファイルリストコンポーネント
 */

import { useState } from 'react';
import { FileText, Image, Trash2, ExternalLink, Upload, Edit3 } from 'lucide-react';
import { useFilesData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/shared/utils/fileUtils';
import type { FileRecord } from '@/contexts/types';
import { FileUpload } from './FileUpload';
import { FileMemoEdit } from './FileMemoEdit';

interface FileListProps {
  studentId: string;
  studentName: string;
}

export function FileList({ studentId, studentName }: FileListProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<FileRecord | null>(null);
  
  const { userProfile } = useAuth();
  const { files, loading, error, deleteFile } = useFilesData();
  
  const isAdmin = userProfile?.role === 'admin';
  
  // 該当生徒のファイルのみフィルタリング
  const studentFiles = files.filter(f => f.studentId === studentId);

  const handleDelete = async (file: FileRecord) => {
    if (!window.confirm(`「${file.fileName}」を削除しますか？`)) {
      return;
    }
    
    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
    } catch (error) {
      console.error('Delete error:', error);
      alert('ファイルの削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileClick = (file: FileRecord) => {
    window.open(file.fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          ファイルの読み込みに失敗しました
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            アップロードファイル
            {studentFiles.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({studentFiles.length}件)
              </span>
            )}
          </h3>
          
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4" />
              <span>アップロード</span>
            </button>
          )}
        </div>

        {studentFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>ファイルがありません</p>
            {isAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                最初のファイルをアップロード
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {studentFiles.map((file) => (
              <div
                key={file.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                        {file.uploadedByName && ` • ${file.uploadedByName}`}
                      </p>
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          📝 {file.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFileClick(file)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded"
                      title="ファイルを開く"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => setEditingFile(file)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="メモを編集"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingId === file.id}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <FileUpload
          studentId={studentId}
          studentName={studentName}
          onClose={() => setShowUpload(false)}
          onSuccess={() => setShowUpload(false)}
        />
      )}

      {editingFile && (
        <FileMemoEdit
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSuccess={() => setEditingFile(null)}
        />
      )}
    </>
  );
}