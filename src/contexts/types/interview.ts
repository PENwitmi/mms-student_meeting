/**
 * 面談記録関連の型定義
 */

export interface InterviewRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: Date;
  topics: string[];
  notes: string;
  followUp?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewInput {
  studentId: string;
  studentName: string;
  date: Date;
  topics: string[];
  notes: string;
  followUp?: string;
  attachments?: string[];
}

export interface InterviewUpdateInput {
  date?: Date;
  topics?: string[];
  notes?: string;
  followUp?: string;
  attachments?: string[];
}

// フォームバリデーション用
export interface ValidationErrors {
  studentId?: string;
  date?: string;
  topics?: string;
  notes?: string;
  followUp?: string;
}

// フィルター用
export interface InterviewFilters {
  studentId?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  topics?: string[];
  search?: string;
}