# Firestore データモデル設計

**作成日**: 2025-09-05  
**バージョン**: 1.0.0

## 1. 設計原則

### 1.1 基本方針
- **非正規化**: 読み取りパフォーマンス優先
- **階層構造**: 論理的な親子関係の表現
- **冗長性許容**: 頻繁にアクセスされるデータは複製
- **集計データ**: リアルタイム集計を避け、事前計算

### 1.2 命名規則
- コレクション: 複数形小文字（users, interviews, grades）
- ドキュメントID: 自動生成またはUID
- フィールド: キャメルケース（createdAt, studentId）

## 2. コレクション設計

### 2.1 users コレクション
```javascript
/users/{userId}
{
  // 基本情報
  uid: string,                    // Firebase Auth UID
  email: string,
  displayName: string,
  role: 'student' | 'teacher' | 'parent' | 'admin',
  isActive: boolean,
  
  // プロフィール
  profile: {
    firstName: string,
    lastName: string,
    phoneNumber: string,
    profileImageUrl: string,
    grade: number,              // 学年（生徒のみ）
    school: string,              // 学校名（生徒のみ）
    subjects: string[],          // 担当科目（講師のみ）
  },
  
  // 関連付け
  relationships: {
    studentIds: string[],        // 講師・保護者が関連する生徒ID
    teacherIds: string[],        // 生徒が関連する講師ID
    parentIds: string[],         // 生徒が関連する保護者ID
  },
  
  // システム情報
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp,
  
  // 集計データ（生徒のみ）
  stats: {
    totalStudyTime: number,      // 総学習時間（分）
    currentStreak: number,        // 連続学習日数
    averageGrade: number,         // 平均成績
    completedTasks: number,       // 完了タスク数
  }
}
```

### 2.2 interviews コレクション
```javascript
/interviews/{interviewId}
{
  // 基本情報
  studentId: string,
  teacherId: string,
  date: timestamp,
  status: 'scheduled' | 'completed' | 'cancelled',
  
  // 面談内容
  content: {
    // 1. 直近1週間の振り返り
    weeklyReview: {
      studyStatus: string,        // 学習状況
      progressNotes: string,      // 進捗メモ
      achievements: string[],     // 達成事項
      challenges: string[],       // 課題点
    },
    
    // 2. 今後の授業計画
    classPlan: {
      nextWeekSchedule: string,   // 次週予定
      focusAreas: string[],       // 重点項目
      goals: string[],            // 目標
    },
    
    // 3. 家庭学習計画
    homeworkPlan: {
      assignments: [{
        subject: string,
        content: string,
        dueDate: timestamp,
        estimatedTime: number,    // 予想時間（分）
      }],
      studyGuidelines: string,    // 学習指針
      targetHours: number,        // 目標時間
    },
    
    // 4. その他
    additionalNotes: {
      category: string,
      content: string,
    }[],
  },
  
  // メタデータ
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,             // 作成者ID
  
  // 共有設定
  visibility: {
    student: boolean,
    parents: boolean,
    otherTeachers: boolean,
  }
}
```

### 2.3 schedules コレクション
```javascript
/schedules/{scheduleId}
{
  // 基本情報
  title: string,
  type: 'class' | 'event' | 'exam' | 'deadline',
  startTime: timestamp,
  endTime: timestamp,
  isAllDay: boolean,
  
  // 詳細情報
  details: {
    description: string,
    location: string,
    subject: string,              // 科目（授業の場合）
    examType: string,             // 試験種別（試験の場合）
  },
  
  // 参加者
  participants: {
    studentIds: string[],
    teacherIds: string[],
    required: boolean,            // 必須参加か
  },
  
  // 繰り返し設定
  recurrence: {
    enabled: boolean,
    pattern: 'daily' | 'weekly' | 'monthly',
    interval: number,
    endDate: timestamp,
    exceptions: timestamp[],      // 除外日
  },
  
  // 通知設定
  reminders: [{
    type: 'email' | 'push',
    minutesBefore: number,
  }],
  
  // システム情報
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
}
```

### 2.4 grades コレクション
```javascript
/grades/{gradeId}
{
  // 基本情報
  studentId: string,
  type: 'regular' | 'mock' | 'quiz' | 'assignment',
  examName: string,
  examDate: timestamp,
  
  // 成績データ
  subjects: [{
    name: string,                 // 科目名
    score: number,                // 得点
    maxScore: number,             // 満点
    average: number,              // 平均点
    rank: number,                 // 順位
    totalStudents: number,        // 受験者数
    deviation: number,            // 偏差値
  }],
  
  // 総合成績
  overall: {
    totalScore: number,
    totalMaxScore: number,
    average: number,
    rank: number,
    deviation: number,
    gradeLevel: string,           // 評定（A, B, C等）
  },
  
  // 分析データ
  analysis: {
    strengths: string[],          // 強み
    weaknesses: string[],         // 弱点
    improvements: string[],       // 改善点
    teacherComment: string,       // 講師コメント
  },
  
  // メタデータ
  createdAt: timestamp,
  updatedAt: timestamp,
  recordedBy: string,            // 記録者ID
}
```

### 2.5 dailyReports コレクション
```javascript
/dailyReports/{reportId}
{
  // 基本情報
  studentId: string,
  date: timestamp,
  status: 'draft' | 'submitted' | 'reviewed',
  
  // 学習セッション
  sessions: [{
    subject: string,
    content: string,              // 学習内容
    startTime: timestamp,
    endTime: timestamp,
    duration: number,             // 時間（分）
    understanding: 1-5,          // 理解度
    concentration: 1-5,          // 集中度
  }],
  
  // 日次サマリー
  summary: {
    totalTime: number,            // 合計時間（分）
    subjectBreakdown: {          // 科目別時間
      [subject: string]: number,
    },
    achievements: string[],       // 達成事項
    challenges: string[],         // 困った点
    questions: string[],          // 質問事項
    tomorrowPlan: string,        // 明日の予定
  },
  
  // フィードバック
  feedback: {
    teacherId: string,
    comment: string,
    rating: number,
    isImportant: boolean,
    respondedAt: timestamp,
  },
  
  // システム情報
  createdAt: timestamp,
  updatedAt: timestamp,
  submittedAt: timestamp,
}
```

### 2.6 studyTime コレクション
```javascript
/studyTime/{sessionId}
{
  // 基本情報
  studentId: string,
  date: timestamp,
  subject: string,
  
  // タイマーデータ
  timer: {
    startTime: timestamp,
    endTime: timestamp,
    pausedDuration: number,       // 一時停止時間（分）
    actualDuration: number,       // 実質学習時間（分）
    breaks: [{
      startTime: timestamp,
      endTime: timestamp,
      reason: string,
    }],
  },
  
  // 学習内容
  content: {
    topic: string,                // トピック
    materials: string[],          // 使用教材
    pages: {
      start: number,
      end: number,
    },
    exercises: {
      attempted: number,
      completed: number,
      correct: number,
    },
  },
  
  // 目標との比較
  goals: {
    targetTime: number,           // 目標時間（分）
    achievement: number,          // 達成率（%）
  },
  
  // リンク
  linkedReportId: string,         // 関連する日報ID
  
  // システム情報
  createdAt: timestamp,
  device: string,                 // 記録デバイス
}
```

## 3. サブコレクション設計

### 3.1 ユーザーごとの通知
```javascript
/users/{userId}/notifications/{notificationId}
{
  type: 'reminder' | 'feedback' | 'announcement',
  title: string,
  body: string,
  isRead: boolean,
  actionUrl: string,
  createdAt: timestamp,
}
```

### 3.2 面談の添付ファイル
```javascript
/interviews/{interviewId}/attachments/{attachmentId}
{
  fileName: string,
  fileUrl: string,
  fileType: string,
  fileSize: number,
  uploadedBy: string,
  uploadedAt: timestamp,
}
```

## 4. インデックス設計

### 4.1 複合インデックス
```
1. interviews: studentId + date (DESC)
2. grades: studentId + examDate (DESC)
3. dailyReports: studentId + date (DESC)
4. studyTime: studentId + date (DESC)
5. schedules: participants.studentIds + startTime
```

### 4.2 コレクショングループ
```
1. notifications - 全ユーザーの通知を横断検索
2. attachments - 全添付ファイルの管理
```

## 5. セキュリティルール概要

### 5.1 基本ルール
```javascript
// 認証必須
allow read, write: if request.auth != null;

// 自分のデータのみアクセス（生徒）
allow read: if resource.data.studentId == request.auth.uid;

// 関連する生徒のデータのみ（講師・保護者）
allow read: if request.auth.uid in resource.data.participants.teacherIds;

// 作成者のみ編集可能
allow update: if request.auth.uid == resource.data.createdBy;
```

### 5.2 ロール別アクセス
- **生徒**: 自分のデータの読み取り、日報・学習時間の作成
- **講師**: 担当生徒のデータの読み書き
- **保護者**: 子供のデータの読み取り
- **管理者**: 全データへのアクセス

## 6. データ移行・バックアップ

### 6.1 バックアップ戦略
- 日次自動バックアップ
- 重要データの冗長化
- 削除データの30日間保持

### 6.2 データ移行
- 既存システムからのインポート機能
- CSVエクスポート対応
- APIによるデータ連携

## 7. パフォーマンス最適化

### 7.1 キャッシング戦略
- 頻繁にアクセスされるデータのメモリキャッシュ
- 集計データの事前計算
- クライアントサイドキャッシング

### 7.2 クエリ最適化
- ページネーション実装
- 必要なフィールドのみ取得
- リアルタイムリスナーの適切な管理

---

**更新履歴**
- 2025-09-05: 初版作成 - 全機能対応のデータモデル設計