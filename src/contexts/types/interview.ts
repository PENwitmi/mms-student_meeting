/**
 * 面談記録関連の型定義
 * 2025-09-05: 教育現場のニーズに合わせた新モデルへ移行中
 */

// 新しいモデル（主に使用）
export interface InterviewRecord {
  id: string;
  studentId: string;           // 必須
  studentName: string;
  date: Date;                  // 必須
  
  // 週次振り返り（すべて任意）
  weeklyGoodPoints?: string;   // 直近1週間のGood Point
  weeklyMorePoints?: string;   // 直近1週間のMore Point
  
  // 今後の計画（すべて任意）
  lessonPlan?: string;         // 授業計画
  homeworkPlan?: string;       // 家庭学習計画
  
  // その他（任意）
  otherNotes?: string;         // その他の話し合い内容
  
  // 旧フィールド（廃止予定、互換性のため一時的に残す）
  topics?: string[];           // @deprecated 削除予定
  notes?: string;              // @deprecated otherNotesに移行
  followUp?: string;           // @deprecated 削除予定
  attachments?: string[];      // 将来実装検討
  
  // メタデータ
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewInput {
  studentId: string;           // 必須
  studentName: string;
  date: Date;                  // 必須
  
  // 新フィールド（すべて任意）
  weeklyGoodPoints?: string;
  weeklyMorePoints?: string;
  lessonPlan?: string;
  homeworkPlan?: string;
  otherNotes?: string;
  
  // 旧フィールド（廃止予定）
  topics?: string[];
  notes?: string;
  followUp?: string;
  attachments?: string[];
}

export interface InterviewUpdateInput {
  date?: Date;
  
  // 新フィールド
  weeklyGoodPoints?: string;
  weeklyMorePoints?: string;
  lessonPlan?: string;
  homeworkPlan?: string;
  otherNotes?: string;
  
  // 旧フィールド（廃止予定）
  topics?: string[];
  notes?: string;
  followUp?: string;
  attachments?: string[];
}

// フォームバリデーション用
export interface ValidationErrors {
  studentId?: string;
  date?: string;
  
  // 新フィールドのバリデーション（すべて任意のためエラーは基本的に発生しない）
  weeklyGoodPoints?: string;
  weeklyMorePoints?: string;
  lessonPlan?: string;
  homeworkPlan?: string;
  otherNotes?: string;
  
  // 旧フィールド（廃止予定）
  topics?: string;
  notes?: string;
  followUp?: string;
}

// フィルター用
export interface InterviewFilters {
  studentId?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  search?: string;  // 全テキストフィールドを検索対象に
  
  // 旧フィールド（廃止予定）
  topics?: string[];
}