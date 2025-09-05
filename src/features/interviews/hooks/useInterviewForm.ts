import { useState, useCallback } from 'react';
import type { InterviewInput, InterviewRecord, ValidationErrors } from '@/contexts/types';
import { validateInterviewForm, hasValidationErrors } from '../utils/validation';

interface FormState {
  values: InterviewInput;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

interface UseInterviewFormOptions {
  initialData?: InterviewRecord | null;
  onSubmit: (data: InterviewInput) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useInterviewForm = ({
  initialData,
  onSubmit,
  onSuccess,
  onError
}: UseInterviewFormOptions) => {
  const [state, setState] = useState<FormState>({
    values: {
      studentId: initialData?.studentId || '',
      studentName: initialData?.studentName || '',
      date: initialData?.date || new Date(),
      topics: initialData?.topics || [],
      notes: initialData?.notes || '',
      followUp: initialData?.followUp || ''
    },
    errors: {},
    touched: {},
    isSubmitting: false
  });

  // フィールドの値を更新
  const handleChange = useCallback((field: keyof InterviewInput, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: { ...prev.errors, [field]: undefined } // エラーをクリア
    }));
  }, []);

  // 学生選択の特殊ハンドラー
  const handleStudentChange = useCallback((studentId: string, studentName: string) => {
    setState(prev => ({
      ...prev,
      values: { 
        ...prev.values, 
        studentId, 
        studentName 
      },
      errors: { ...prev.errors, studentId: undefined }
    }));
  }, []);

  // フィールドのフォーカス離脱時の処理
  const handleBlur = useCallback((field: keyof InterviewInput) => {
    setState(prev => {
      const newTouched = { ...prev.touched, [field]: true };
      const errors = validateInterviewForm(prev.values);
      
      return {
        ...prev,
        touched: newTouched,
        errors: {
          ...prev.errors,
          ...(newTouched[field] ? { [field]: errors[field] } : {})
        }
      };
    });
  }, []);

  // フォーム送信
  const handleSubmit = useCallback(async () => {
    // すべてのフィールドをタッチ済みにマーク
    const allTouched = Object.keys(state.values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

    // バリデーション実行
    const errors = validateInterviewForm(state.values);

    setState(prev => ({
      ...prev,
      touched: allTouched,
      errors,
      isSubmitting: !hasValidationErrors(errors)
    }));

    // エラーがある場合は送信しない
    if (hasValidationErrors(errors)) {
      return;
    }

    try {
      await onSubmit(state.values);
      onSuccess?.();
      
      // 成功後はフォームをリセット（新規作成の場合）
      if (!initialData) {
        setState({
          values: {
            studentId: '',
            studentName: '',
            date: new Date(),
            topics: [],
            notes: '',
            followUp: ''
          },
          errors: {},
          touched: {},
          isSubmitting: false
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      onError?.(error as Error);
    }
  }, [state.values, onSubmit, onSuccess, onError, initialData]);

  // フォームの状態チェック
  // 常に現在の値でバリデーションを実行
  const currentErrors = validateInterviewForm(state.values);
  const isValid = !hasValidationErrors(currentErrors);
  
  const isDirty = initialData 
    ? JSON.stringify(state.values) !== JSON.stringify({
        studentId: initialData.studentId,
        studentName: initialData.studentName,
        date: initialData.date,
        topics: initialData.topics,
        notes: initialData.notes,
        followUp: initialData.followUp
      })
    : // 新規作成時は必須項目が入力されているかチェック
      Boolean(state.values.studentId && 
              state.values.topics.length > 0 && 
              state.values.notes);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleStudentChange,
    handleBlur,
    handleSubmit
  };
};