# DataContext実装チェックリスト

## 前提条件
- [x] Firebase設定完了
- [x] AuthContext実装済み
- [x] ユーザープロフィール設定済み

## Phase 1: 基本構造の構築 ✅

### 1.1 ディレクトリ作成
```bash
src/contexts/
├── types/
│   ├── index.ts
│   ├── interview.ts
│   └── student.ts
└── hooks/
    ├── realtime/
    │   └── useInterviews.ts
    └── query/
```

### 1.2 型定義
- [ ] `src/contexts/types/interview.ts` - InterviewRecord型
- [ ] `src/contexts/types/student.ts` - Student型
- [ ] `src/contexts/types/index.ts` - DataContextValue型とエクスポート

## Phase 2: Firebaseフック実装

### 2.1 useInterviews フック
- [ ] 基本構造の実装
- [ ] ロールベースのクエリ分岐
- [ ] リアルタイム監視の設定
- [ ] CRUD操作（add, update, delete）
- [ ] エラーハンドリング

### 2.2 useStudents フック（管理者のみ）
- [ ] 基本構造の実装
- [ ] 管理者権限チェック
- [ ] CRUD操作
- [ ] エラーハンドリング

## Phase 3: DataContext統合

### 3.1 DataContext本体
- [ ] `src/contexts/DataContext.tsx` 作成
- [ ] 各フックの統合
- [ ] useMemoによる最適化
- [ ] Provider実装

### 3.2 選択的フック
- [ ] useInterviewsData
- [ ] useStudentsData
- [ ] useData（メインフック）

### 3.3 App.tsxへの統合
- [ ] DataProviderの追加
- [ ] 既存のAuthProviderとの連携

## Phase 4: 機能実装

### 4.1 管理者機能
- [ ] 面談記録作成フォーム
- [ ] 面談記録一覧表示
- [ ] 面談記録編集機能
- [ ] 面談記録削除機能

### 4.2 学生機能
- [ ] 自分の面談記録一覧
- [ ] 面談記録詳細表示（読み取り専用）

## Phase 5: テストと検証

### 5.1 動作確認
- [ ] 管理者ログインでの全機能テスト
- [ ] 学生ログインでの閲覧制限確認
- [ ] リアルタイム更新の確認

### 5.2 パフォーマンス
- [ ] Firebase読み取り回数の計測
- [ ] 開発者ツールでのメモリリーク確認
- [ ] ネットワークタブでのリクエスト確認

### 5.3 エラーケース
- [ ] ネットワーク切断時の動作
- [ ] 権限不足エラーの表示
- [ ] 不正なデータ入力の処理

## 実装順序と時間目安

1. **型定義** (15分)
   - すべての型を先に定義
   - エクスポートの設定

2. **useInterviews** (30分)
   - 最も重要なフック
   - 完全に動作確認してから次へ

3. **DataContext** (20分)
   - 基本的な統合のみ
   - 徐々に機能追加

4. **UI接続** (30分)
   - ダッシュボードへの表示
   - 簡単な作成フォーム

5. **テスト** (20分)
   - 実データでの動作確認
   - エラーケースの確認

## コード例

### 型定義のサンプル
```typescript
// src/contexts/types/interview.ts
import type { Timestamp } from 'firebase/firestore';

export interface InterviewRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: Date;
  topics: string[];
  notes: string;
  followUp?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewInput {
  studentId: string;
  studentName: string;
  date: Date;
  topics: string[];
  notes: string;
  followUp?: string;
  attachments?: string[];
}
```

### フック使用例
```typescript
// コンポーネントでの使用
import { useInterviewsData } from '@/contexts/DataContext';

export function InterviewList() {
  const { interviews, loading, error, deleteInterview } = useInterviewsData();
  
  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  
  return (
    <ul>
      {interviews.map(interview => (
        <li key={interview.id}>
          {interview.studentName} - {interview.date}
          <button onClick={() => deleteInterview(interview.id)}>
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## トラブルシューティング

### よくあるエラーと対処法

1. **「useData must be used within DataProvider」エラー**
   - App.tsxでDataProviderでラップしているか確認
   - AuthProviderの内側にDataProviderを配置

2. **データが表示されない**
   - Firebase Consoleでデータが存在するか確認
   - Firestore Rulesが正しく設定されているか確認
   - ユーザーロールが正しく設定されているか確認

3. **無限ループエラー**
   - useEffectの依存配列を確認
   - onSnapshot内でsetStateを呼んでいないか確認

4. **権限エラー**
   - Firestore Rulesを確認
   - ユーザープロフィールのroleフィールドを確認

## 完了基準

- [ ] すべてのチェック項目が完了
- [ ] エラーなく動作することを確認
- [ ] Firebase読み取り回数が想定通り
- [ ] コードレビュー実施
- [ ] ドキュメント更新