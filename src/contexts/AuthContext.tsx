/**
 * Firebase認証コンテキスト
 * アプリ全体で認証状態とユーザーロールを管理
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { dev } from '@/shared/utils/devLogger';
import type { UserProfile, UserRole } from '@/shared/types/auth';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  isAdmin: boolean;
  isStudent: boolean;
  // 新規追加メソッド
  updateUserName: (name: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  registerStudent: (data: RegisterData) => Promise<void>;
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
      dev.error('AuthContext', 'パスワードリセットエラー', error);
      throw error;
    }
  };

  // ユーザー名更新
  const updateUserName = async (name: string) => {
    if (!user) throw new Error('ユーザーが認証されていません');
    
    dev.log('AuthContext', 'ユーザー名更新開始', { name });
    
    try {
      const trimmedName = name.trim();
      
      // Firestoreの更新
      await updateDoc(doc(db, 'users', user.uid), {
        name: trimmedName,
        updatedAt: serverTimestamp()
      });
      
      // ローカル状態の更新
      updateUserProfile({ name: trimmedName });
      
      dev.log('AuthContext', 'ユーザー名更新成功');
    } catch (error) {
      dev.error('AuthContext', 'ユーザー名更新エラー', error);
      throw error;
    }
  };

  // メールアドレス変更
  const changeEmail = async (currentPassword: string, newEmail: string) => {
    if (!user) throw new Error('ユーザーが認証されていません');
    
    dev.log('AuthContext', 'メールアドレス変更開始', { newEmail });
    
    try {
      // 再認証
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // メールアドレス変更
      await updateEmail(user, newEmail);
      
      // Firestore更新
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
      
      // ローカル状態更新
      updateUserProfile({ email: newEmail });
      
      dev.log('AuthContext', 'メールアドレス変更成功');
    } catch (error) {
      dev.error('AuthContext', 'メールアドレス変更エラー', error);
      
      // エラーコードに応じた処理
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        
        if (errorCode === 'auth/email-already-in-use') {
          throw new Error('このメールアドレスは既に使用されています');
        } else if (errorCode === 'auth/wrong-password') {
          throw new Error('パスワードが正しくありません');
        } else if (errorCode === 'auth/invalid-email') {
          throw new Error('メールアドレスの形式が正しくありません');
        } else if (errorCode === 'auth/requires-recent-login') {
          throw new Error('セキュリティのため、再度ログインが必要です');
        }
      }
      throw new Error('変更に失敗しました');
    }
  };

  // パスワード変更
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('ユーザーが認証されていません');
    
    dev.log('AuthContext', 'パスワード変更開始');
    
    try {
      // 再認証
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // パスワード更新
      await updatePassword(user, newPassword);
      
      dev.log('AuthContext', 'パスワード変更成功');
    } catch (error) {
      dev.error('AuthContext', 'パスワード変更エラー', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        
        if (errorCode === 'auth/wrong-password') {
          throw new Error('現在のパスワードが正しくありません');
        } else if (errorCode === 'auth/weak-password') {
          throw new Error('パスワードが弱すぎます');
        } else if (errorCode === 'auth/requires-recent-login') {
          throw new Error('セキュリティのため、再度ログインが必要です');
        }
      }
      throw new Error('変更に失敗しました');
    }
  };

  // 生徒登録
  const registerStudent = async (data: RegisterData) => {
    dev.log('AuthContext', '生徒登録開始', { email: data.email });
    
    try {
      // ユーザー作成
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // Firestore にユーザープロフィール作成
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        role: 'student' as UserRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      dev.log('AuthContext', '生徒登録成功', { 
        email: data.email,
        uid: userCredential.user.uid 
      });
    } catch (error) {
      dev.error('AuthContext', '生徒登録エラー', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        
        if (errorCode === 'auth/email-already-in-use') {
          throw new Error('このメールアドレスは既に使用されています');
        } else if (errorCode === 'auth/weak-password') {
          throw new Error('パスワードは8文字以上必要です');
        } else if (errorCode === 'auth/invalid-email') {
          throw new Error('メールアドレスの形式が正しくありません');
        }
      }
      throw new Error('登録に失敗しました');
    }
  };

  // プロフィールをローカルで更新（Firestore更新後に呼ぶ）
  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prevProfile => {
      if (prevProfile) {
        const updatedProfile = { ...prevProfile, ...updates };
        dev.log('AuthContext', 'ユーザープロフィール更新', updates);
        return updatedProfile;
      }
      return prevProfile;
    });
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    userProfile,
    userRole: userProfile?.role || null,
    loading,
    signIn,
    logout,
    resetPassword,
    updateUserProfile,
    isAdmin: userProfile?.role === 'admin',
    isStudent: userProfile?.role === 'student',
    updateUserName,
    changeEmail,
    changePassword,
    registerStudent
  }), [user, userProfile, loading, updateUserProfile, signIn, updateUserName, changeEmail, changePassword]);

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