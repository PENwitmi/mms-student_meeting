/**
 * Context関連の型定義
 */

import type { InterviewRecord, InterviewInput, InterviewUpdateInput } from './interview';
import type { Student, StudentInput, StudentUpdateInput } from './student';
import type { FileRecord, FileUploadParams } from './file';

export * from './interview';
export * from './student';
export * from './file';

/**
 * DataContextの値の型定義
 */
export interface DataContextValue {
  // データ
  interviews: InterviewRecord[];
  students: Student[];
  files: FileRecord[];
  
  // ローディング状態
  loading: {
    interviews: boolean;
    students: boolean;
    files: boolean;
  };
  
  // エラー状態
  errors: {
    interviews: Error | null;
    students: Error | null;
    files: Error | null;
  };
  
  // アクション
  actions: {
    // 面談記録操作
    addInterview: (data: InterviewInput) => Promise<void>;
    updateInterview: (id: string, data: InterviewUpdateInput) => Promise<void>;
    deleteInterview: (id: string) => Promise<void>;
    
    // 学生情報操作（管理者のみ）
    addStudent: (data: StudentInput) => Promise<void>;
    updateStudent: (id: string, data: StudentUpdateInput) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    
    // ファイル操作（管理者のみ）
    uploadFile: (params: FileUploadParams) => Promise<void>;
    deleteFile: (fileId: string) => Promise<void>;
  };
}