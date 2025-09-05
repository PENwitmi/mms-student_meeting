/**
 * データ管理用Context
 * Firebase読み取りを一元化し、全コンポーネントでデータを共有
 * MMS Financeパターンを適用
 */

import { createContext, useContext, useMemo, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useInterviews } from './hooks/realtime/useInterviews';
import { useStudents } from './hooks/realtime/useStudents';
import { useFiles } from './hooks/realtime/useFiles';
import { dev } from '@/shared/utils/devLogger';
import type { DataContextValue, FileUploadParams } from './types';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { isFileSizeValid, isFileTypeSupported, STORAGE_PATHS } from '@/shared/utils/fileUtils';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, app } from '@/lib/firebase/config';
import { useAuth } from './AuthContext';

// Context作成
const DataContext = createContext<DataContextValue | undefined>(undefined);

/**
 * DataProvider - アプリケーション全体のデータを管理
 */
export function DataProvider({ children }: { children: ReactNode }) {
  // Firebase Storageインスタンスを作成
  const storage = useMemo(() => getStorage(app), []);
  
  // 面談記録フック
  const {
    interviews,
    loading: interviewsLoading,
    error: interviewsError,
    addInterview,
    updateInterview,
    deleteInterview
  } = useInterviews();

  // 学生データフック（管理者のみ）
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    addStudent,
    updateStudent,
    deleteStudent
  } = useStudents();

  // ファイルデータフック
  const {
    files,
    loading: filesLoading,
    error: filesError
  } = useFiles();

  // 認証情報取得
  const { user: currentUser, userProfile } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);

  // ファイルアップロード機能（管理者のみ）
  const uploadFile = useCallback(async (params: FileUploadParams) => {
    if (!currentUser) {
      throw new Error('ログインが必要です');
    }
    
    if (!userProfile) {
      throw new Error('ユーザー情報を読み込み中です。もう一度お試しください');
    }
    
    if (userProfile.role !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    const { file, studentId, studentName } = params;

    // ファイルサイズチェック
    if (!isFileSizeValid(file)) {
      throw new Error('ファイルサイズは10MB以下にしてください');
    }

    // ファイルタイプチェック
    if (!isFileTypeSupported(file)) {
      throw new Error('サポートされていないファイル形式です');
    }

    try {
      // ファイル名の一意性を確保
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${STORAGE_PATHS.studentFiles(studentId)}/${fileName}`;
      
      // Storage にアップロード
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // アップロード進捗の監視
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          dev.log('アップロード進捗', `${progress}%`);
        }
      );
      
      // アップロード完了を待つ
      await uploadTask;
      
      // ダウンロードURLを取得
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Firestoreにメタデータを保存
      await addDoc(collection(db, 'files'), {
        fileName: file.name,
        fileUrl: downloadUrl,
        fileSize: file.size,
        fileType: file.type,
        studentId,
        studentName,
        uploadedBy: currentUser.uid,
        uploadedByName: userProfile.name,
        createdAt: serverTimestamp()
      });
      
      setUploadProgress(0);
      dev.log('ファイルアップロード完了', fileName);
    } catch (error) {
      setUploadProgress(0);
      dev.error('ファイルアップロードエラー', error);
      throw error;
    }
  }, [currentUser, userProfile, storage]);

  // ファイル削除機能（管理者のみ）
  const deleteFile = useCallback(async (fileId: string) => {
    if (!currentUser) {
      throw new Error('ログインが必要です');
    }
    
    if (!userProfile) {
      throw new Error('ユーザー情報を読み込み中です。もう一度お試しください');
    }
    
    if (userProfile.role !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    try {
      // Firestoreからファイル情報を取得
      const fileDoc = await getDoc(doc(db, 'files', fileId));
      if (!fileDoc.exists()) {
        throw new Error('ファイルが見つかりません');
      }
      
      const fileData = fileDoc.data();
      const fileUrl = fileData.fileUrl;
      
      // Storageからファイルを削除
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
      
      // Firestoreからメタデータを削除
      await deleteDoc(doc(db, 'files', fileId));
      
      dev.log('ファイル削除完了', fileId);
    } catch (error) {
      dev.error('ファイル削除エラー', error);
      throw error;
    }
  }, [currentUser, userProfile, storage]);

  // Context値をメモ化（re-render最小化）
  const value = useMemo<DataContextValue>(() => {
    dev.log('DataContext', 'Context値更新', {
      interviewsCount: interviews.length,
      studentsCount: students.length,
      filesCount: files.length,
      loading: { interviews: interviewsLoading, students: studentsLoading, files: filesLoading }
    });

    return {
      // データ
      interviews,
      students,
      files,
      
      // ローディング状態
      loading: {
        interviews: interviewsLoading,
        students: studentsLoading,
        files: filesLoading
      },
      
      // エラー状態
      errors: {
        interviews: interviewsError,
        students: studentsError,
        files: filesError
      },
      
      // アクション
      actions: {
        addInterview,
        updateInterview,
        deleteInterview,
        addStudent,
        updateStudent,
        deleteStudent,
        uploadFile,
        deleteFile
      }
    };
  }, [
    interviews,
    students,
    files,
    interviewsLoading,
    studentsLoading,
    filesLoading,
    interviewsError,
    studentsError,
    filesError,
    uploadFile,
    deleteFile,
    // アクション関数は依存配列から除外（安定しているため）
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * useData - DataContextを使用するためのカスタムフック
 */
export function useData(): DataContextValue {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  
  return context;
}

/**
 * 選択的データ取得用のカスタムフック
 */

// 面談記録データのみ取得
export function useInterviewsData() {
  const { interviews, loading, errors, actions } = useData();
  return {
    interviews,
    loading: loading.interviews,
    error: errors.interviews,
    addInterview: actions.addInterview,
    updateInterview: actions.updateInterview,
    deleteInterview: actions.deleteInterview
  };
}

// 学生データのみ取得（管理者用）
export function useStudentsData() {
  const { students, loading, errors, actions } = useData();
  return {
    students,
    loading: loading.students,
    error: errors.students,
    addStudent: actions.addStudent,
    updateStudent: actions.updateStudent,
    deleteStudent: actions.deleteStudent
  };
}

// ファイルデータのみ取得
export function useFilesData() {
  const { files, loading, errors, actions } = useData();
  return {
    files,
    loading: loading.files,
    error: errors.files,
    uploadFile: actions.uploadFile,
    deleteFile: actions.deleteFile
  };
}