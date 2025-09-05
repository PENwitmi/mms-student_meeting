/**
 * Firebase認証コンテキスト
 * アプリ全体で認証状態とユーザーロールを管理
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { dev } from '@/shared/utils/devLogger';
import type { UserProfile, UserRole } from '@/shared/types/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ユーザープロフィール取得
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return {
          uid: profileDoc.id,
          email: data.email,
          role: data.role as UserRole,
          name: data.name,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }
      dev.warn('AuthContext', 'ユーザープロフィールが存在しません', { uid });
      return null;
    } catch (error) {
      dev.error('AuthContext', 'ユーザープロフィール取得エラー', error);
      return null;
    }
  };

  useEffect(() => {
    dev.log('AuthContext', '🔐 AuthProviderマウント - 認証状態監視開始');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      dev.log('AuthContext', `🔐 認証状態変更検出:`, {
        user: firebaseUser ? `${firebaseUser.email} (${firebaseUser.uid})` : 'null',
      });

      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        dev.log('AuthContext', 'ユーザーロール確認', { 
          email: firebaseUser.email,
          role: profile?.role || 'プロフィールなし' 
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      dev.log('AuthContext', '🔴 AuthProviderアンマウント');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    dev.log('AuthContext', 'ログイン試行', { email });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchUserProfile(userCredential.user.uid);
      setUserProfile(profile);
      dev.log('AuthContext', 'ログイン成功', { 
        email,
        role: profile?.role || 'プロフィールなし'
      });
    } catch (error) {
      dev.error('AuthContext', 'ログインエラー', error);
      throw error;
    }
  };

  const logout = async () => {
    dev.log('AuthContext', 'ログアウト実行');
    try {
      await signOut(auth);
      setUserProfile(null);
      dev.log('AuthContext', 'ログアウト成功');
    } catch (error) {
      dev.error('AuthContext', 'ログアウトエラー', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    dev.log('AuthContext', 'パスワードリセットメール送信', { email });
    try {
      await sendPasswordResetEmail(auth, email);
      dev.log('AuthContext', 'パスワードリセットメール送信成功');
    } catch (error) {
      dev.error('AuthContext', 'パスワードリセットヨラー', error);
      throw error;
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    userProfile,
    userRole: userProfile?.role || null,
    loading,
    signIn,
    logout,
    resetPassword,
    isAdmin: userProfile?.role === 'admin',
    isStudent: userProfile?.role === 'student'
  }), [user, userProfile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * ロール別アクセス制御用フック
 */
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, userRole, loading } = useAuth();
  
  const hasAccess = useMemo(() => {
    if (loading || !user) return false;
    if (!requiredRole) return true;
    return userRole === requiredRole;
  }, [user, userRole, loading, requiredRole]);
  
  return { 
    hasAccess, 
    loading,
    user,
    userRole
  };
}