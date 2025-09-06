/**
 * ファイルメモ編集コンポーネント
 */

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useFilesData } from '@/contexts/DataContext';
import type { FileRecord } from '@/contexts/types';

interface FileMemoEditProps {
  file: FileRecord;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FileMemoEdit({ file, onClose, onSuccess }: FileMemoEditProps) {
  const [description, setDescription] = useState(file.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { updateFile } = useFilesData();

  // 文字数制限
  const maxLength = 200;
  const remainingChars = maxLength - description.length;

  const handleSave = async () => {
    if (description.length > maxLength) {
      setError(`説明文は${maxLength}文字以内にしてください`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateFile({
        fileId: file.id,
        description: description.trim()
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      setError(error instanceof Error ? error.message : 'メモの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg max-w-lg w-full p-6"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ファイルメモ編集</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            ファイル: <span className="font-medium">{file.fileName}</span>
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            説明メモ
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="ファイルの内容や用途などを記入..."
            maxLength={maxLength}
            disabled={saving}
            autoFocus
          />
          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>ファイルの内容や用途を記入してください</span>
            <span className={remainingChars < 20 ? 'text-orange-500' : ''}>
              残り {remainingChars} 文字
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || description.length > maxLength}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}