/**
 * 学生情報関連の型定義
 */

export interface Student {
  id: string;
  uid: string;
  name: string;
  email: string;
  studentId: string;
  grade: number;
  class: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentInput {
  uid: string;
  name: string;
  email: string;
  studentId: string;
  grade: number;
  class: string;
}

export interface StudentUpdateInput {
  name?: string;
  studentId?: string;
  grade?: number;
  class?: string;
}