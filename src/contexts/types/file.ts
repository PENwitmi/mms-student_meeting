/**
 * ファイル管理に関する型定義
 */

import { Timestamp } from 'firebase/firestore';

/**
 * ファイルレコードの型定義
 */
export interface FileRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  
  // Relations
  studentId: string;
  studentName: string;
  
  // Metadata
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: Date | Timestamp;
}

/**
 * ファイルアップロード時のパラメータ
 */
export interface FileUploadParams {
  file: File;
  studentId: string;
  studentName: string;
}