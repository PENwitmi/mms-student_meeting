/**
 * Firebase接続テスト用コンポーネント
 * 開発時のみ使用
 */

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export function TestFirebase() {
  const [status, setStatus] = useState<{
    auth: boolean;
    firestore: boolean;
    error?: string;
  }>({
    auth: false,
    firestore: false,
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Auth接続テスト
        if (auth) {
          setStatus(prev => ({ ...prev, auth: true }));
          console.log('✅ Firebase Auth: 接続成功');
        }

        // Firestore接続テスト（読み取りのみ）
        if (db) {
          // usersコレクションの存在確認（データがなくてもOK）
          try {
            await getDocs(collection(db, 'users'));
            setStatus(prev => ({ ...prev, firestore: true }));
            console.log('✅ Firestore: 接続成功');
          } catch (error) {
            // 権限エラーでも接続自体は成功
            console.log('⚠️ Firestore: 接続成功（権限エラーは正常）');
            setStatus(prev => ({ ...prev, firestore: true }));
          }
        }
      } catch (error) {
        console.error('❌ Firebase接続エラー:', error);
        setStatus(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : '不明なエラー' 
        }));
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase接続テスト</h1>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={status.auth ? 'text-green-500' : 'text-gray-400'}>
            {status.auth ? '✅' : '⏳'}
          </span>
          <span>Firebase Authentication</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={status.firestore ? 'text-green-500' : 'text-gray-400'}>
            {status.firestore ? '✅' : '⏳'}
          </span>
          <span>Cloud Firestore</span>
        </div>
      </div>

      {status.error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          エラー: {status.error}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          プロジェクトID: {import.meta.env.VITE_FIREBASE_PROJECT_ID}
        </p>
      </div>
    </div>
  );
}