# MVPデータモデル設計

**作成日**: 2025-09-05  
**バージョン**: MVP 1.0.0  
**原則**: 最小限の実装で価値を提供

## 1. データモデル概要

### 1.1 設計方針
- **シンプル優先**: 2つのコレクションのみ
- **非正規化OK**: パフォーマンスとシンプルさ優先
- **拡張性確保**: フィールド追加で対応可能な構造

### 1.2 コレクション構成
```
Firestore Database
├── users/      # ユーザー情報（認証後の追加情報）
└── interviews/ # 面談記録
```

## 2. 詳細スキーマ定義

### 2.1 users コレクション

```typescript
interface User {
  // ドキュメントID: Firebase Auth UID を使用
  
  // 基本情報
  email: string;           // メールアドレス
  name: string;            // 表示名
  role: 'admin' | 'student'; // ユーザー種別
  
  // システム情報
  createdAt: Timestamp;    // 作成日時
  lastLoginAt: Timestamp;  // 最終ログイン日時
  
  // 生徒の場合のみ（optional）
  studentInfo?: {
    grade?: number;        // 学年（将来用、今は使わない）
    school?: string;       // 学校名（将来用、今は使わない）
  };
}

// Firestoreパス: /users/{uid}
```

**サンプルデータ**:
```json
{
  "email": "admin@example.com",
  "name": "山田太郎",
  "role": "admin",
  "createdAt": "2025-09-05T10:00:00Z",
  "lastLoginAt": "2025-09-05T14:30:00Z"
}

{
  "email": "student1@example.com", 
  "name": "佐藤花子",
  "role": "student",
  "createdAt": "2025-09-05T10:00:00Z",
  "lastLoginAt": "2025-09-05T15:00:00Z",
  "studentInfo": {}
}
```

### 2.2 interviews コレクション

```typescript
interface Interview {
  // ドキュメントID: Firestore自動生成
  
  // 関連情報
  studentId: string;       // 対象生徒のUID
  studentName: string;     // 生徒名（表示用に非正規化）
  createdBy: string;       // 作成者（管理者）のUID
  createdByName: string;   // 作成者名（表示用に非正規化）
  
  // 面談情報
  interviewDate: Timestamp; // 面談実施日
  
  // 面談内容（シンプルなテキストフィールド）
  content: {
    weeklyReview: string;   // 今週の振り返り
    nextWeekPlan: string;   // 来週の計画
    homework: string;       // 宿題・課題
    notes?: string;         // その他メモ（オプション）
  };
  
  // システム情報
  createdAt: Timestamp;    // 作成日時
  updatedAt: Timestamp;    // 更新日時
}

// Firestoreパス: /interviews/{interviewId}
```

**サンプルデータ**:
```json
{
  "studentId": "student_uid_123",
  "studentName": "佐藤花子",
  "createdBy": "admin_uid_456",
  "createdByName": "山田太郎",
  "interviewDate": "2025-09-05T13:00:00Z",
  "content": {
    "weeklyReview": "今週は数学の二次関数を重点的に学習。理解度は良好。",
    "nextWeekPlan": "来週は二次関数の応用問題と、英語の文法を中心に進める。",
    "homework": "数学：問題集p.45-50、英語：単語帳Unit5",
    "notes": "定期テストが2週間後にあるため、対策を強化"
  },
  "createdAt": "2025-09-05T14:00:00Z",
  "updatedAt": "2025-09-05T14:00:00Z"
}
```

## 3. Firestore セキュリティルール

### 3.1 MVPセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: ユーザーが管理者かチェック
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper: 認証済みかチェック
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // users コレクション
    match /users/{userId} {
      // 自分の情報のみ読み取り可能
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // ユーザー作成は認証時のCloud Functions経由（直接書き込み禁止）
      allow create: if false;
      
      // 更新は自分の lastLoginAt のみ
      allow update: if isAuthenticated() && 
                      request.auth.uid == userId &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastLoginAt']);
      
      // 削除禁止
      allow delete: if false;
    }
    
    // interviews コレクション
    match /interviews/{interviewId} {
      // 読み取り: 管理者は全て、生徒は自分のもののみ
      allow read: if isAdmin() || 
                    (isAuthenticated() && resource.data.studentId == request.auth.uid);
      
      // 作成: 管理者のみ
      allow create: if isAdmin() &&
                      request.resource.data.createdBy == request.auth.uid;
      
      // 更新: 管理者のみ
      allow update: if isAdmin();
      
      // 削除: 管理者のみ
      allow delete: if isAdmin();
    }
  }
}
```

## 4. インデックス設定

### 4.1 必要なインデックス

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "interviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "interviewDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "interviews",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "interviewDate", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 5. クエリパターン

### 5.1 よく使うクエリ

```typescript
// 1. 特定生徒の面談記録を取得（新しい順）
const getStudentInterviews = (studentId: string) => {
  return firestore
    .collection('interviews')
    .where('studentId', '==', studentId)
    .orderBy('interviewDate', 'desc')
    .limit(20);
};

// 2. 全面談記録を取得（管理者用、新しい順）
const getAllInterviews = () => {
  return firestore
    .collection('interviews')
    .orderBy('interviewDate', 'desc')
    .limit(50);
};

// 3. ユーザー情報取得
const getUser = (uid: string) => {
  return firestore
    .collection('users')
    .doc(uid)
    .get();
};
```

## 6. データ初期化

### 6.1 初期データ投入スクリプト

```typescript
// scripts/initializeData.ts

// 管理者アカウント作成
const createAdminUser = async () => {
  const adminData = {
    email: 'admin@school.com',
    name: '管理者',
    role: 'admin' as const,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  };
  await firestore.collection('users').doc('ADMIN_UID').set(adminData);
};

// テスト用生徒アカウント作成
const createTestStudent = async () => {
  const studentData = {
    email: 'student@school.com',
    name: 'テスト生徒',
    role: 'student' as const,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    studentInfo: {}
  };
  await firestore.collection('users').doc('STUDENT_UID').set(studentData);
};
```

## 7. 将来の拡張性

### 7.1 フィールド追加で対応可能な拡張

```typescript
// 将来追加される可能性があるフィールド（今は実装しない）
interface FutureUserExtensions {
  // 講師の場合
  teacherInfo?: {
    subjects?: string[];
    assignedStudents?: string[];
  };
  
  // 保護者の場合
  parentInfo?: {
    children?: string[];
  };
}

interface FutureInterviewExtensions {
  // 詳細な構造化データ
  detailedContent?: {
    achievements?: string[];
    challenges?: string[];
    nextGoals?: string[];
  };
  
  // 共有設定
  visibility?: {
    parentCanView?: boolean;
    studentCanView?: boolean;
  };
}
```

### 7.2 新規コレクション追加で対応する機能
- `schedules/` - スケジュール管理
- `grades/` - 成績管理
- `reports/` - 日報機能
- `studyTime/` - 学習時間記録

## 8. パフォーマンス考慮事項

### 8.1 非正規化の理由
```
studentName, createdByName を interviews に含める理由:
- JOINクエリを避けてシンプルに
- 表示時の追加フェッチ不要
- 名前変更は頻繁でないため問題なし
```

### 8.2 制限事項
```
- ドキュメントサイズ: 最大1MB（十分な余裕）
- クエリ結果: 最大20-50件に制限（ページネーション）
- リアルタイム同期: MVPでは使用しない
```

## 9. エラーケース

### 9.1 想定されるエラー

| エラー | 原因 | 対処 |
|--------|------|------|
| permission-denied | 権限不足 | ログイン状態確認 |
| not-found | ドキュメント不存在 | 404表示 |
| network-error | ネットワーク切断 | リトライボタン表示 |

## 10. チェックリスト

- [x] 2つのコレクションのみで実現
- [x] セキュリティルールが最小限
- [x] インデックスが最小限
- [x] 将来の拡張を妨げない
- [x] YAGNIの原則に従っている

---

**更新履歴**
- 2025-09-05: MVP用データモデル作成