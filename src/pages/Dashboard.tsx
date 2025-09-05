/**
 * ダッシュボード画面
 * ユーザー情報とログアウト機能を提供
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewSection } from '@/features/interviews';
import { dev } from '@/shared/utils/devLogger';

export function Dashboard() {
  const { user, userProfile, logout, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      dev.log('Dashboard', 'ログアウト成功');
      navigate('/login');
    } catch (error) {
      dev.error('Dashboard', 'ログアウトエラー', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              MMS生徒面談管理システム
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ユーザー情報 */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">ユーザー情報</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ロール</dt>
                <dd className="mt-1 text-sm text-gray-900">{userProfile?.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">氏名</dt>
                <dd className="mt-1 text-sm text-gray-900">{userProfile?.name}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 面談記録セクション */}
        <InterviewSection />
      </main>
    </div>
  );
}