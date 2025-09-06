/**
 * ファイルアップロードコンポーネント
 */

import { useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { useFilesData } from '@/contexts/DataContext';
import { formatFileSize } from '@/shared/utils/fileUtils';

interface FileUploadProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FileUpload({ studentId, studentName, onClose, onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { uploadFile } = useFilesData();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    
    // ファイルサイズチェック（10MB）
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      await uploadFile({
        file,
        studentId,
        studentName
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type === 'application/pdf') {
      return <FileText className="h-12 w-12 text-red-500" />;
    }
    if (file.type.startsWith('image/')) {
      return <Image className="h-12 w-12 text-blue-500" />;
    }
    return <FileText className="h-12 w-12 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ファイルアップロード</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={uploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            生徒: <span className="font-medium">{studentName}</span>
          </p>
        </div>

        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              クリックまたはドラッグ&ドロップでファイルを選択
            </p>
            <p className="text-xs text-gray-500">
              PDF、画像ファイル（最大10MB）
            </p>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start space-x-3">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>
        </div>
      </div>
    </div>
  );
}