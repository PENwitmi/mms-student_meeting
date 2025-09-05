/**
 * Firebase Storage設定ファイル
 * ファイルのアップロード・ダウンロード機能を提供
 */

import { getStorage } from 'firebase/storage';
import { app } from './config';

export const storage = getStorage(app);

export const STORAGE_PATHS = {
  studentFiles: (studentId: string) => `students/${studentId}/files`,
} as const;

export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export function isFileSizeValid(file: File): boolean {
  return file.size <= FILE_SIZE_LIMIT;
}

export function isFileTypeSupported(file: File): boolean {
  return SUPPORTED_FILE_TYPES.includes(file.type as any) || 
         file.name.toLowerCase().endsWith('.heic') ||
         file.name.toLowerCase().endsWith('.heif');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}