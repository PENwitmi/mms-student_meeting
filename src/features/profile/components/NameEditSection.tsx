import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dev } from '@/shared/utils/devLogger';

export function NameEditSection() {
  const { userProfile, updateUserName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSave = async () => {
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await updateUserName(name.trim());
      
      dev.log('NameEditSection', '名前更新成功', { name: name.trim() });
      setSuccess('名前を更新しました');
      setIsEditing(false);
      
      // 3秒後にメッセージを消す
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      dev.error('NameEditSection', '名前更新エラー', err);
      setError('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setName(userProfile?.name || '');
    setError('');
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">プロフィール情報</h3>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              氏名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
              placeholder="山田 太郎"
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '保存'}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">氏名:</span>
                <span className="text-sm text-gray-900">{userProfile?.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">メール:</span>
                <span className="text-sm text-gray-900">{userProfile?.email}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">ロール:</span>
                <span className="text-sm text-gray-900">
                  {userProfile?.role === 'admin' ? '管理者' : '学生'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              編集
            </button>
          </div>
        </div>
      )}
    </div>
  );
}