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
  
  // Content
  description?: string;  // ファイル説明メモ（最大200文字）
  
  // HEIC Conversion
  convertedFileName?: string;  // 変換済みファイル名（HEIC→JPEG）
  convertedFileUrl?: string;   // 変換済みファイルURL
  convertedAt?: Date | Timestamp; // 変換日時
  
  // Metadata
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;  // 最終更新日時
}

/**
 * ファイルアップロード時のパラメータ
 */
export interface FileUploadParams {
  file: File;
  studentId: string;
  studentName: string;
}

/**
 * ファイル情報更新時のパラメータ
 */
export interface FileUpdateParams {
  fileId: string;
  description: string;
}