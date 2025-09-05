/**
 * 面談記録のリアルタイム監視とCRUD操作を提供するフック
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Query
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { dev } from '@/shared/utils/devLogger';
import type { InterviewRecord, InterviewInput, InterviewUpdateInput } from '@/contexts/types';

export function useInterviews() {
  const { user, userRole } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      dev.log('useInterviews', 'ユーザー未認証のため面談記録をクリア');
      setInterviews([]);
      setLoading(false);
      return;
    }

    dev.log('useInterviews', '面談記録の監視開始', { 
      userId: user.uid, 
      role: userRole 
    });

    // クエリの構築（ロールに基づく）
    let q: Query;
    
    if (userRole === 'admin') {
      // 管理者：すべての面談記録
      q = query(
        collection(db, 'interviews'),
        orderBy('date', 'desc')
      );
      dev.log('useInterviews', '管理者モード：全面談記録を監視');
    } else {
      // 学生：自分の面談記録のみ
      q = query(
        collection(db, 'interviews'),
        where('studentId', '==', user.uid),
        orderBy('date', 'desc')
      );
      dev.log('useInterviews', '学生モード：自分の面談記録のみ監視');
    }

    // リアルタイム監視
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            studentId: docData.studentId,
            studentName: docData.studentName,
            date: docData.date?.toDate() || new Date(),
            
            // 新フィールド（任意）
            weeklyGoodPoints: docData.weeklyGoodPoints || '',
            weeklyMorePoints: docData.weeklyMorePoints || '',
            lessonPlan: docData.lessonPlan || '',
            homeworkPlan: docData.homeworkPlan || '',
            otherNotes: docData.otherNotes || '',
            
            // 旧フィールド（互換性のため残す）
            topics: docData.topics || [],
            notes: docData.notes || '',
            followUp: docData.followUp,
            attachments: docData.attachments || [],
            
            // メタデータ
            createdBy: docData.createdBy,
            createdAt: docData.createdAt?.toDate() || new Date(),
            updatedAt: docData.updatedAt?.toDate() || new Date()
          } as InterviewRecord;
        });
        
        // クライアント側でソート（インデックスが作成されるまでの一時対応）
        data.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        setInterviews(data);
        setLoading(false);
        setError(null);
        
        dev.log('useInterviews', '面談記録更新', { 
          count: data.length,
          fromCache: snapshot.metadata.fromCache 
        });
      },
      (err) => {
        dev.error('useInterviews', '面談記録の取得エラー', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // クリーンアップ
    return () => {
      dev.log('useInterviews', '面談記録の監視終了');
      unsubscribe();
    };
  }, [user, userRole]);

  // 面談記録追加（管理者のみ）
  const addInterview = async (data: InterviewInput) => {
    if (!user) {
      throw new Error('認証が必要です');
    }
    
    if (userRole !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      dev.log('useInterviews', '面談記録追加開始', data);
      
      const docRef = await addDoc(collection(db, 'interviews'), {
        ...data,
        date: data.date,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      dev.log('useInterviews', '面談記録追加成功', { id: docRef.id });
    } catch (err) {
      dev.error('useInterviews', '面談記録追加エラー', err);
      throw err;
    }
  };

  // 面談記録更新（管理者のみ）
  const updateInterview = async (id: string, data: InterviewUpdateInput) => {
    if (!user) {
      throw new Error('認証が必要です');
    }
    
    if (userRole !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      dev.log('useInterviews', '面談記録更新開始', { id, data });
      
      await updateDoc(doc(db, 'interviews', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      dev.log('useInterviews', '面談記録更新成功', { id });
    } catch (err) {
      dev.error('useInterviews', '面談記録更新エラー', err);
      throw err;
    }
  };

  // 面談記録削除（管理者のみ）
  const deleteInterview = async (id: string) => {
    if (!user) {
      throw new Error('認証が必要です');
    }
    
    if (userRole !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      dev.log('useInterviews', '面談記録削除開始', { id });
      
      await deleteDoc(doc(db, 'interviews', id));
      
      dev.log('useInterviews', '面談記録削除成功', { id });
    } catch (err) {
      dev.error('useInterviews', '面談記録削除エラー', err);
      throw err;
    }
  };

  return {
    interviews,
    loading,
    error,
    addInterview,
    updateInterview,
    deleteInterview
  };
}