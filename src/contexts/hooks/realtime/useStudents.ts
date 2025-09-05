/**
 * 学生データのリアルタイム監視とCRUD操作を提供するフック
 * 注：MVPでは簡略実装（将来の拡張用）
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { dev } from '@/shared/utils/devLogger';
import type { Student, StudentInput, StudentUpdateInput } from '@/contexts/types';

export function useStudents() {
  const { user, userRole } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 管理者のみ学生データにアクセス可能
    if (!user || userRole !== 'admin') {
      dev.log('useStudents', '非管理者または未認証のため学生データをクリア');
      setStudents([]);
      setLoading(false);
      return;
    }

    dev.log('useStudents', '学生データの監視開始');

    // usersコレクションから学生ロールのユーザーを取得
    const q = query(
      collection(db, 'users'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .filter(doc => doc.data().role === 'student')
          .map(doc => {
            const docData = doc.data();
            return {
              id: doc.id,
              uid: doc.id,
              name: docData.name || '',
              email: docData.email || '',
              studentId: docData.studentId || '',
              grade: docData.grade || 1,
              class: docData.class || '',
              createdAt: docData.createdAt?.toDate() || new Date(),
              updatedAt: docData.updatedAt?.toDate() || new Date()
            } as Student;
          });
        
        setStudents(data);
        setLoading(false);
        setError(null);
        
        dev.log('useStudents', '学生データ更新', { count: data.length });
      },
      (err) => {
        dev.error('useStudents', '学生データの取得エラー', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      dev.log('useStudents', '学生データの監視終了');
      unsubscribe();
    };
  }, [user, userRole]);

  // 学生追加（将来実装用のスタブ）
  const addStudent = async (data: StudentInput) => {
    if (!user || userRole !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      dev.log('useStudents', '学生追加（MVPでは未実装）', data);
      // MVPでは実装しない
      throw new Error('学生の追加はMVPでは実装されていません');
    } catch (err) {
      dev.error('useStudents', '学生追加エラー', err);
      throw err;
    }
  };

  // 学生更新（将来実装用のスタブ）
  const updateStudent = async (id: string, data: StudentUpdateInput) => {
    if (!user || userRole !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      dev.log('useStudents', '学生更新（MVPでは未実装）', { id, data });
      // MVPでは実装しない
      throw new Error('学生の更新はMVPでは実装されていません');
    } catch (err) {
      dev.error('useStudents', '学生更新エラー', err);
      throw err;
    }
  };

  // 学生削除（将来実装用のスタブ）
  const deleteStudent = async (id: string) => {
    if (!user || userRole !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      dev.log('useStudents', '学生削除（MVPでは未実装）', { id });
      // MVPでは実装しない
      throw new Error('学生の削除はMVPでは実装されていません');
    } catch (err) {
      dev.error('useStudents', '学生削除エラー', err);
      throw err;
    }
  };

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent
  };
}