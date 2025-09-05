# MVPアーキテクチャ原則

**作成日**: 2025-09-05  
**基準**: MMS Finance Phase 10 簡潔アーキテクチャ  
**バージョン**: MVP 1.0.0

## 🎯 絶対原則（破ってはならない）

### 1. onSnapshotはすべてDataContext経由
- リアルタイム更新はDataContext内で一元管理
- コンポーネントから直接onSnapshotを呼ばない
- Firebase読み取り回数を最小化

### 2. Firebaseアクセスはcontexts/層のみ
- contexts/hooks/内のフックのみがFirebaseにアクセス可能
- 他の層からのFirebase直接アクセスは完全禁止

### 3. features/層はFirebase直接アクセス禁止
- features/内のコードはDataContext経由でのみデータ取得
- ビジネスロジックとFirebaseアクセスの完全分離

## 📂 ディレクトリ構造と責務

```
src/
├── contexts/               # Firebase接続層（唯一の接続点）
│   ├── DataContext.tsx    # 中核：すべてのデータを管理
│   └── hooks/
│       ├── realtime/      # onSnapshot使用フック
│       └── query/         # getDocs使用フック
│
├── features/              # ビジネスロジック層（Firebase禁止）
│   └── */hooks/          # UIロジック、データ加工のみ
│
└── lib/firebase/         # Firebase初期化と認証
    ├── config.ts         # Firebase設定
    └── AuthContext.tsx   # 認証状態管理
```

## 🔍 Hooksの分類と配置

### 分類基準：「Firebaseアクセス権の有無」

| 分類 | Firebase Access | 配置場所 | 使用可能な関数 |
|------|----------------|----------|---------------|
| **リアルタイム系** | ✅ あり | contexts/hooks/realtime/ | onSnapshot, addDoc, updateDoc, deleteDoc |
| **クエリ系** | ✅ あり | contexts/hooks/query/ | getDocs, getDoc |
| **ビジネスロジック系** | ❌ なし | features/*/hooks/ | useData()のみ |
| **UI制御系** | ❌ なし | features/*/hooks/ | useData()のみ |

## 💡 実装例

### ✅ 正しい実装（リアルタイム系）
```typescript
// src/contexts/hooks/realtime/useInterviews.ts
import { onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useInterviews() {
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'interviews'),
      (snapshot) => {
        // データ更新処理
      }
    );
    return () => unsubscribe();
  }, []);
}
```

### ✅ 正しい実装（クエリ系）
```typescript
// src/contexts/hooks/query/useInterviewQuery.ts
import { getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useInterviewQuery() {
  const searchByMonth = async (year: number, month: number) => {
    const snapshot = await getDocs(query);
    return snapshot.docs.map(/* ... */);
  };
  return { searchByMonth };
}
```

### ✅ 正しい実装（ビジネスロジック系）
```typescript
// src/features/interviews/hooks/useInterviewStatistics.ts
import { useData } from '@/contexts/DataContext';

export function useInterviewStatistics() {
  const { interviews } = useData(); // DataContext経由のみ
  
  // Firebaseアクセスなし、データ加工のみ
  const statistics = useMemo(() => {
    return calculateStats(interviews);
  }, [interviews]);
  
  return statistics;
}
```

### ❌ 間違った実装（features/でFirebase使用）
```typescript
// src/features/interviews/hooks/useWrongImplementation.ts
import { getDocs } from 'firebase/firestore'; // ❌ 絶対禁止！

export function useWrongImplementation() {
  const data = await getDocs(query); // ❌ features/層でFirebase禁止！
}
```

## 📊 DataContextの役割

### DataContext内の処理フロー
```
1. useInterviews()等のリアルタイム系フックを呼び出し
2. データとアクションを統合
3. 全コンポーネントに提供

DataContext
  ├─ useInterviews()      → interviews, addInterview, updateInterview
  ├─ useUserData()        → userData, updateUser
  └─ 統合 → value = { 
       interviews, 
       userData,
       actions: { ... },
       loading: { ... }
     }
```

### 使用側コンポーネント
```typescript
// どこからでも同じデータにアクセス
const { interviews, actions, loading } = useData();
```

## 🚀 実装手順

### Step 1: contexts/層の実装
1. DataContext.tsxを作成
2. contexts/hooks/realtime/にonSnapshot系フックを配置
3. contexts/hooks/query/にgetDocs系フックを配置

### Step 2: features/層の実装
1. features/*/hooks/にビジネスロジックフックを配置
2. useData()経由でのみデータアクセス
3. Firebase関数の直接importは禁止

### Step 3: 統合
1. App.tsxでProvider階層を構築
2. DataProviderで全データを管理
3. 各コンポーネントはuseData()でアクセス

## ⚠️ よくある間違いと対処法

### 間違い1: features/でgetDocs使用
**原因**: 「一時的な取得だから」という理由
**対処**: contexts/hooks/query/に移動

### 間違い2: コンポーネント内でonSnapshot
**原因**: 「このコンポーネント専用だから」という理由
**対処**: DataContextに統合

### 間違い3: 複数箇所で同じデータ取得
**原因**: 「独立性を保ちたい」という理由
**対処**: DataContext内で1回だけ取得

## 📈 パフォーマンスメリット

### Firebase読み取り回数削減
- **Before**: 各コンポーネントで個別取得 → N回読み取り
- **After**: DataContext内で1回のみ → 1回読み取り
- **結果**: MMS Financeでは92%削減（48回→4回）

### メモリ効率
- 同じデータの重複保持を防止
- unsubscribeの一元管理でメモリリーク防止

## 🔐 セキュリティメリット

### アクセス制御の一元化
- Firebaseアクセスポイントが限定される
- セキュリティ監査が容易
- 権限管理の一元化

## 📝 チェックリスト

実装時の確認項目：

- [ ] onSnapshotはcontexts/hooks/realtime/のみ？
- [ ] getDocsはcontexts/hooks/query/のみ？
- [ ] features/層にFirebase importがない？
- [ ] DataContext内で全データを管理している？
- [ ] コンポーネントはuseData()経由でアクセス？
- [ ] 同じデータを複数回取得していない？
- [ ] unsubscribeを適切に処理している？

## 🎓 まとめ

**「Firebaseアクセス権があるか」という単純な基準で分類する**

- **あり** → contexts/hooks/ に配置
- **なし** → features/*/hooks/ に配置

この原則を守ることで、保守性・パフォーマンス・セキュリティすべてが向上します。

---

**参考**: MMS Finance `/docs/09_context-api-implementation/12_phase10-simplified-architecture-plan.md`