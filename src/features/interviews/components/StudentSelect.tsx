import React from 'react';
import { useStudents } from '@/contexts/hooks/realtime/useStudents';

interface StudentSelectProps {
  value: string;
  onChange: (studentId: string, studentName: string) => void;
  error?: string;
  disabled?: boolean;
}

export const StudentSelect: React.FC<StudentSelectProps> = ({ 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  const { students, loading } = useStudents();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const student = students.find(s => s.id === selectedId);
    if (student) {
      onChange(student.id, student.name);
    } else {
      onChange('', '');
    }
  };

  return (
    <div>
      <label htmlFor="studentSelect" className="block text-sm font-medium text-gray-700 mb-2">
        学生を選択 <span className="text-red-500">*</span>
      </label>
      <select
        id="studentSelect"
        value={value}
        onChange={handleChange}
        disabled={loading || disabled}
        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
          error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
        }`}
      >
        <option value="">学生を選択してください</option>
        {students.map(student => (
          <option key={student.id} value={student.id}>
            {student.name} ({student.studentId})
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {loading && (
        <p className="mt-1 text-sm text-gray-500">学生データを読み込み中...</p>
      )}
    </div>
  );
};