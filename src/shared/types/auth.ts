/**
 * 認証関連の型定義
 */

export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  profile: UserProfile | null;
}