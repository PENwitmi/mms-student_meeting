/**
 * データ管理用Context
 * Firebase読み取りを一元化し、全コンポーネントでデータを共有
 * MMS Financeパターンを適用
 */

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useInterviews } from './hooks/realtime/useInterviews';
import { useStudents } from './hooks/realtime/useStudents';
import { dev } from '@/shared/utils/devLogger';
import type { DataContextValue } from './types';

// Context作成
const DataContext = createContext<DataContextValue | undefined>(undefined);

/**
 * DataProvider - アプリケーション全体のデータを管理
 */
export function DataProvider({ children }: { children: ReactNode }) {
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

  // Context値をメモ化（re-render最小化）
  const value = useMemo<DataContextValue>(() => {
    dev.log('DataContext', 'Context値更新', {
      interviewsCount: interviews.length,
      studentsCount: students.length,
      loading: { interviews: interviewsLoading, students: studentsLoading }
    });

    return {
      // データ
      interviews,
      students,
      
      // ローディング状態
      loading: {
        interviews: interviewsLoading,
        students: studentsLoading
      },
      
      // エラー状態
      errors: {
        interviews: interviewsError,
        students: studentsError
      },
      
      // アクション
      actions: {
        addInterview,
        updateInterview,
        deleteInterview,
        addStudent,
        updateStudent,
        deleteStudent
      }
    };
  }, [
    interviews,
    students,
    interviewsLoading,
    studentsLoading,
    interviewsError,
    studentsError,
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