/**
 * 生徒別ファイル管理セクション
 * 生徒を選択してファイルを管理
 */

import { useState } from 'react';
import { useStudentsData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { FileList } from './FileList';
import { FolderOpen, ChevronRight } from 'lucide-react';

export function StudentFileSection() {
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const { students, loading } = useStudentsData();
  const { userProfile } = useAuth();
  
  const isStudent = userProfile?.role === 'student';
  
  // 学生ユーザーの場合は自分の情報を設定
  if (isStudent && userProfile) {
    const studentInfo = {
      id: userProfile.uid,
      name: userProfile.name
    };
    
    return (
      <section className="space-y-6">
        <header>
          <h2 className="text-2xl font-bold text-gray-900">
            ファイル管理
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            アップロードされたファイルを確認できます
          </p>
        </header>
        
        <FileList
          studentId={studentInfo.id}
          studentName={studentInfo.name}
        />
      </section>
    );
  }
  
  // 管理者の場合
  if (loading) {
    return (
      <section className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg shadow h-64"></div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">
          ファイル管理
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          生徒を選択してファイルを管理できます
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 生徒リスト */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-700">生徒一覧</h3>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {students.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  生徒が登録されていません
                </div>
              ) : (
                students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent({ id: student.id, name: student.name })}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors
                      ${selectedStudent?.id === student.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        selectedStudent?.id === student.id ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {student.name}
                      </p>
                      {student.grade && (
                        <p className="text-xs text-gray-500">
                          {student.grade}年 {student.class}
                        </p>
                      )}
                    </div>
                    {selectedStudent?.id === student.id && (
                      <ChevronRight className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* ファイルリスト */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <FileList
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                生徒を選択してファイルを表示
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}