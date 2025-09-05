/**
 * ダッシュボード画面
 * ユーザー情報とログアウト機能を提供
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewSection } from '@/features/interviews';
import { NameEditSection } from '@/features/profile/components/NameEditSection';
import { EmailChangeSection } from '@/features/profile/components/EmailChangeSection';
import { PasswordChangeSection } from '@/features/profile/components/PasswordChangeSection';
import { dev } from '@/shared/utils/devLogger';

export function Dashboard() {
  const { logout } = useAuth();
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
        {/* アカウント設定セクション - グリッドレイアウト */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">アカウント設定</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：プロフィール情報 */}
            <NameEditSection />
            
            {/* 右側：ログイン設定（メールアドレス・パスワード） */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">ログイン設定</h3>
              <div className="space-y-6">
                <EmailChangeSection />
                <div className="border-t pt-6">
                  <PasswordChangeSection />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 面談記録セクション */}
        <InterviewSection />
      </main>
    </div>
  );
}