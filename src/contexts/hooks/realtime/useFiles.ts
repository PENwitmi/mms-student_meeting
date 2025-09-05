/**
 * ファイル情報のリアルタイム取得フック
 */

import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FileRecord } from '@/contexts/types';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ファイル情報をリアルタイムで取得するフック
 * @param studentId - 特定の学生のファイルのみ取得する場合のID（オプション）
 * @returns ファイル情報配列、ローディング状態、エラー
 */
export function useFiles(studentId?: string) {
  const { userProfile } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    // クエリ条件の構築
    const constraints: QueryConstraint[] = [];
    
    // 学生の場合は自分のファイルのみ
    if (userProfile.role === 'student') {
      constraints.push(where('studentId', '==', userProfile.uid));
    } else if (studentId) {
      // 管理者で特定の学生を指定した場合
      constraints.push(where('studentId', '==', studentId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, 'files'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fileData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : data.createdAt,
          } as FileRecord;
        });
        
        setFiles(fileData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching files:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile, studentId]);

  return { files, loading, error };
}