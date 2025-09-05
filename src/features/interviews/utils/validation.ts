import type { InterviewInput, ValidationErrors } from '@/contexts/types';

/**
 * 面談記録フォームのバリデーションルール
 */
export const validateInterviewForm = (data: InterviewInput): ValidationErrors => {
  const errors: ValidationErrors = {};

  // 学生選択
  if (!data.studentId || !data.studentName) {
    errors.studentId = '学生を選択してください';
  }

  // 日付
  if (!data.date) {
    errors.date = '日付を入力してください';
  } else {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今日の終わりまでOK
    if (data.date > today) {
      errors.date = '未来の日付は選択できません';
    }
    
    // 過去すぎる日付のチェック（1年前まで）
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (data.date < oneYearAgo) {
      errors.date = '1年以上前の日付は選択できません';
    }
  }

  // トピック
  if (!data.topics || data.topics.length === 0) {
    errors.topics = 'トピックを最低1つ入力してください';
  } else if (data.topics.length > 10) {
    errors.topics = 'トピックは10個以下にしてください';
  }

  // 面談内容
  if (!data.notes || data.notes.trim().length === 0) {
    errors.notes = '面談内容を入力してください';
  } else if (data.notes.trim().length < 50) {
    errors.notes = '面談内容は50文字以上入力してください';
  } else if (data.notes.length > 5000) {
    errors.notes = '面談内容は5000文字以内で入力してください';
  }

  // フォローアップ（オプション）
  if (data.followUp && data.followUp.length > 1000) {
    errors.followUp = 'フォローアップ事項は1000文字以内で入力してください';
  }

  return errors;
};

/**
 * バリデーションエラーがあるかチェック
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * 個別フィールドのバリデーション
 */
export const validateField = (field: keyof InterviewInput, value: any, formData: InterviewInput): string | undefined => {
  const fullValidation = validateInterviewForm({ ...formData, [field]: value });
  return fullValidation[field];
};