import React, { useState } from 'react';

interface TopicsInputProps {
  value: string[];
  onChange: (topics: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export const TopicsInput: React.FC<TopicsInputProps> = ({ 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTopic = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onChange(value.filter(topic => topic !== topicToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  return (
    <div>
      <label htmlFor="topicsInput" className="block text-sm font-medium text-gray-700 mb-2">
        面談トピック <span className="text-red-500">*</span>
      </label>
      
      {/* 既存のトピック表示 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((topic, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {topic}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="ml-2 text-blue-600 hover:text-blue-800 font-semibold"
                  aria-label={`${topic}を削除`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* 新しいトピック追加 */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            id="topicsInput"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="トピックを入力してEnterキーを押すか「追加」をクリック"
            className={`flex-1 px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={handleAddTopic}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      <p className="mt-1 text-sm text-gray-500">
        面談で話し合ったトピックを追加してください（例：進路相談、履修相談、研究相談など）
      </p>
    </div>
  );
};