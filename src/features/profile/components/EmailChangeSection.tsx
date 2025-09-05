import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dev } from '@/shared/utils/devLogger';

export function EmailChangeSection() {
  const { changeEmail } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleEmailChange = async () => {
    if (!newEmail || !currentPassword) {
      setError('すべての項目を入力してください');
      return;
    }
    
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('正しいメールアドレスを入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await changeEmail(currentPassword, newEmail);
      
      dev.log('EmailChangeSection', 'メールアドレス変更成功', { newEmail });
      setSuccess('メールアドレスを変更しました');
      setIsChanging(false);
      setNewEmail('');
      setCurrentPassword('');
      
      // 3秒後にメッセージを消す
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      dev.error('EmailChangeSection', 'メールアドレス変更エラー', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('変更に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setIsChanging(false);
    setNewEmail('');
    setCurrentPassword('');
    setError('');
  };
  
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">メールアドレス変更</h4>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}
      
      {isChanging ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
              新しいメールアドレス
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              現在のパスワード（確認用）
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="パスワードを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleEmailChange}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '変更中...' : '変更する'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            ログインに使用するメールアドレスを変更できます
          </p>
          <button
            onClick={() => setIsChanging(true)}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            変更する
          </button>
        </div>
      )}
    </div>
  );
}