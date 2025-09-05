import type { InterviewInput, ValidationErrors } from '@/contexts/types';

/**
 * 面談記録フォームのバリデーションルール
 * 2025-09-05: 簡素化 - 必須項目は学生と日付のみ
 */
export const validateInterviewForm = (data: InterviewInput): ValidationErrors => {
  const errors: ValidationErrors = {};

  // ===== 必須項目（2つのみ） =====
  
  // 学生選択（必須）
  if (!data.studentId || !data.studentName) {
    errors.studentId = '学生を選択してください';
  }

  // 日付（必須）
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

  // ===== 任意項目（文字数制限なし） =====
  // 新フィールドはすべて任意で、文字数制限もなし
  // weeklyGoodPoints, weeklyMorePoints, lessonPlan, homeworkPlan, otherNotes

  // ===== 旧フィールド（互換性のため残す、実際には使用しない） =====
  // topics, notes, followUp の検証は削除

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