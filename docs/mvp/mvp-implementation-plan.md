# MVP実装計画

**作成日**: 2025-09-05  
**実装期間**: 1週間（8日間）  
**方針**: 動作優先、段階的実装

## Day 1: プロジェクト基盤構築

### 1.1 プロジェクトセットアップ
```bash
# プロジェクト作成
npm create vite@latest mms-interview-system -- --template react-ts
cd mms-interview-system
npm install

# 必要なパッケージインストール（最小限）
npm install firebase react-router-dom
npm install -D @types/node
```

### 1.2 ディレクトリ構成（MMS Finance厳格アーキテクチャ）
```bash
src/
├── lib/
│   └── firebase/
│       ├── config.ts        # Firebase初期化
│       └── AuthContext.tsx  # 認証コンテキスト
├── contexts/
│   ├── DataContext.tsx     # データ管理コンテキスト（中核）
│   ├── types.ts           # Context用型定義
│   └── hooks/
│       ├── realtime/      # 🔥 Firebaseリアルタイム系（onSnapshot）
│       │   ├── useInterviews.ts    # 面談データリアルタイム
│       │   └── useUserData.ts      # ユーザーデータリアルタイム
│       └── query/         # 📊 Firebaseクエリ系（getDocs）
│           └── useInterviewQuery.ts # 面談データ一時取得
├── shared/
│   ├── components/
│   │   ├── Layout.tsx      # 共通レイアウト
│   │   └── guards/
│   │       └── PrivateRoute.tsx # 認証ガード
│   ├── types/
│   │   ├── interview.ts    # 面談型定義
│   │   └── user.ts        # ユーザー型定義
│   └── utils/
│       └── devLogger.ts    # デバッグユーティリティ
├── pages/
│   ├── LoginPage.tsx       # ログイン画面
│   ├── AdminDashboard.tsx  # 管理者ダッシュボード
│   └── StudentDashboard.tsx # 生徒ダッシュボード
├── features/              # ❌ Firebase直接アクセス禁止
│   ├── interviews/
│   │   ├── components/
│   │   │   ├── InterviewForm.tsx
│   │   │   ├── InterviewList.tsx
│   │   │   └── InterviewDetail.tsx
│   │   └── hooks/        # ビジネスロジック（Firebaseなし）
│   │       ├── useInterviewForm.ts
│   │       └── useInterviewStatistics.ts
│   └── auth/
│       └── hooks/
│           └── useLoginForm.ts
├── App.tsx
├── AdminApp.tsx            # 管理者用アプリ
├── StudentApp.tsx          # 生徒用アプリ
├── main.tsx
└── index.css
```

### 📍 重要：Hooksの配置ルール
- **contexts/hooks/realtime/**: onSnapshot使用（Firebaseアクセスあり）
- **contexts/hooks/query/**: getDocs使用（Firebaseアクセスあり）
- **features/*/hooks/**: ビジネスロジック（Firebaseアクセスなし、DataContext経由）

### 1.3 Firebase設定
```typescript
// .env.local
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

// src/lib/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## Day 2: 認証システム & Context API実装

### 2.1 実装タスク
- [ ] AuthContext作成（MMS Finance参考）
- [ ] DataContext基盤作成
- [ ] ログイン画面作成
- [ ] PrivateRoute実装
- [ ] ロール別リダイレクト

### 2.2 コンポーネント実装順序
1. `shared/types/user.ts` - ユーザー型定義
2. `lib/firebase/AuthContext.tsx` - 認証状態管理
3. `contexts/DataContext.tsx` - データ管理Context
4. `contexts/types.ts` - Context型定義
5. `shared/components/guards/PrivateRoute.tsx` - ルート保護
6. `pages/LoginPage.tsx` - ログイン画面
7. `App.tsx` - ルーティング設定（Provider配置）

### 2.3 テストアカウント作成
```javascript
// Firebase Console で手動作成
管理者: admin@test.com / password123
生徒: student@test.com / password123

// Firestore に users ドキュメント作成
/users/[admin-uid] → role: "admin"
/users/[student-uid] → role: "student"
```

## Day 3: 管理者ダッシュボード & DataContext統合

### 3.1 実装タスク
- [ ] DataContextに面談データ管理追加
- [ ] useInterviewsフック作成
- [ ] 管理者ダッシュボード実装
- [ ] 面談記録一覧表示（Context経由）
- [ ] 基本的なスタイリング

### 3.2 Context層実装（厳格な分離）
```typescript
// src/contexts/hooks/realtime/useInterviews.ts（リアルタイム系）
export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'interviews'),
      orderBy('interviewDate', 'desc')
    );
    
    // onSnapshot = realtimeディレクトリ配置
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Interview));
      setInterviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { interviews, loading };
};

// src/contexts/hooks/query/useInterviewQuery.ts（一時取得系）
export const useInterviewQuery = () => {
  const searchByMonth = async (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const q = query(
      collection(db, 'interviews'),
      where('interviewDate', '>=', startDate),
      where('interviewDate', '<=', endDate)
    );
    
    // getDocs = queryディレクトリ配置
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  };

  return { searchByMonth };
};
```

## Day 4: 面談記録作成機能

### 4.1 実装タスク
- [ ] フォームコンポーネント作成
- [ ] バリデーション（基本のみ）
- [ ] Firestore保存処理
- [ ] 成功/エラーメッセージ

### 4.2 フォーム実装
```typescript
// シンプルな controlled components
const [formData, setFormData] = useState({
  weeklyReview: '',
  nextWeekPlan: '',
  homework: '',
  notes: ''
});

// バリデーション（最小限）
const validate = () => {
  return formData.weeklyReview && 
         formData.nextWeekPlan && 
         formData.homework;
};
```

## Day 5: 面談記録編集機能

### 5.1 実装タスク
- [ ] 編集画面作成（作成フォーム流用）
- [ ] データ読み込み
- [ ] 更新処理
- [ ] 削除機能（確認付き）

### 5.2 再利用設計
```typescript
// InterviewForm を作成・編集両方で使用
<InterviewForm 
  mode={isEdit ? 'edit' : 'create'}
  initialData={existingData}
  onSubmit={handleSubmit}
/>
```

## Day 6: 生徒機能実装

### 6.1 実装タスク
- [ ] 生徒ダッシュボード
- [ ] 自分の面談記録のみ表示
- [ ] 読み取り専用ビュー
- [ ] アクセス制御確認

### 6.2 クエリ実装
```typescript
// 生徒用: 自分の記録のみ
const getMyInterviews = async (studentId: string) => {
  const q = query(
    collection(db, 'interviews'),
    where('studentId', '==', studentId),
    orderBy('interviewDate', 'desc')
  );
  return getDocs(q);
};
```

## Day 7: エラーハンドリング・UI改善

### 7.1 実装タスク
- [ ] エラーバウンダリ実装
- [ ] ローディング状態
- [ ] 404ページ
- [ ] 基本的なレスポンシブ対応

### 7.2 エラー処理
```typescript
// グローバルエラーハンドリング
const handleFirebaseError = (error: FirebaseError) => {
  switch (error.code) {
    case 'permission-denied':
      return 'アクセス権限がありません';
    case 'not-found':
      return 'データが見つかりません';
    default:
      return 'エラーが発生しました';
  }
};
```

## Day 8: テスト・デプロイ

### 8.1 テストタスク
- [ ] 認証フローテスト
- [ ] CRUD操作確認
- [ ] セキュリティルール検証
- [ ] 異常系テスト

### 8.2 デプロイ
```bash
# ビルド
npm run build

# Firebase Hosting デプロイ
firebase init hosting
firebase deploy --only hosting
```

## 実装チェックポイント

### 各日の終了時確認
```
✅ コードは動作するか
✅ エラーは適切に処理されているか
✅ 次の開発者が理解できるコードか
✅ 不要な機能を追加していないか（YAGNI）
✅ Context APIが適切に実装されているか
✅ Firebase読み取り回数が最適化されているか
```

### コミットメッセージ規約
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
test: テスト追加・修正
```

## リスク管理と対処

### 想定リスク
| リスク | 対処法 |
|--------|--------|
| Firebase設定ミス | エミュレータで開発 |
| 認証実装の遅延 | Day2に集中、必要なら Day3を調整 |
| スタイリングに時間がかかる | 最小限のCSSのみ、見た目より機能 |
| セキュリティルールのデバッグ | Firebase Consoleのルールシミュレータ使用 |

## コード品質基準

### 最小限の品質保証
```typescript
// 1. 型安全性
interface Interview {
  // 明示的な型定義
}

// 2. エラーハンドリング
try {
  await saveInterview(data);
} catch (error) {
  console.error(error);
  setError('保存に失敗しました');
}

// 3. シンプルな実装
// 複雑な抽象化より、わかりやすい直接的なコード
```

## 完了の定義

### MVP完了条件
- [x] 管理者がログインして面談記録を作成できる
- [x] 管理者が全ての面談記録を閲覧・編集できる
- [x] 生徒がログインして自分の記録を閲覧できる
- [x] 基本的なエラーハンドリングが実装されている
- [x] Firebaseにデプロイされている

### やらないこと（スコープ外）
- 複雑なアニメーション
- 高度なバリデーション
- オフライン対応
- PWA化
- 国際化対応
- ダークモード

## 開発開始コマンド

```bash
# Day 1 開始時
cd ~/claude\ code/mms-student_meeting/
npm create vite@latest mms-interview-system -- --template react-ts
cd mms-interview-system
npm install
npm install firebase react-router-dom
npm install -D @types/node

# 開発サーバー起動
npm run dev

# Firebaseエミュレータ（推奨）
firebase emulators:start
```

---

**この計画書に従って段階的に実装を進める**

更新履歴:
- 2025-09-05: MVP実装計画作成