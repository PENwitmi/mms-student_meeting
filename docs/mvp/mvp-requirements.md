# MVP要件定義 - 面談記録システム

**作成日**: 2025-09-05  
**バージョン**: MVP 1.0.0  
**原則**: YAGNI - 今必要なものだけを実装

## 1. MVP スコープ定義

### 1.1 含まれる機能（必須）
✅ **実装する機能**
- 管理者ログイン
- 生徒ログイン
- 面談記録の作成（管理者のみ）
- 面談記録の閲覧（権限に応じて）
- ログアウト

### 1.2 含まれない機能（将来実装）
❌ **実装しない機能**
- 講師アカウント
- 保護者アカウント
- スケジュール管理
- 成績管理
- 日報システム
- 学習時間トラッキング
- 通知機能
- データエクスポート

## 2. ユーザーストーリー

### 2.1 管理者として
```
AS A 管理者
I WANT TO 面談記録を作成・管理する
SO THAT 生徒の学習指導を体系的に記録できる

受け入れ基準:
- ログインできる
- 面談記録を新規作成できる
- 全ての面談記録を閲覧できる
- 面談記録を編集できる
```

### 2.2 生徒として
```
AS A 生徒
I WANT TO 自分の面談記録を閲覧する
SO THAT 学習計画や目標を確認できる

受け入れ基準:
- ログインできる
- 自分の面談記録のみ閲覧できる
- 他の生徒の記録は見えない
```

## 3. 機能詳細

### 3.1 認証機能

#### ログイン画面
```
入力項目:
- メールアドレス
- パスワード

動作:
- Firebase Authenticationで認証
- ユーザータイプ（admin/student）を判定
- 適切なダッシュボードへリダイレクト
```

#### アクセス制御
```
管理者:
- 全ての面談記録へのCRUD権限

生徒:
- 自分の面談記録への読み取り権限のみ
```

### 3.2 面談記録機能

#### データ構造（最小限）
```javascript
InterviewRecord {
  id: string
  studentId: string        // 対象生徒
  studentName: string      // 表示用（非正規化）
  createdBy: string        // 作成者（管理者）ID
  createdAt: timestamp
  updatedAt: timestamp
  
  // 面談内容
  content: {
    date: Date             // 面談日
    
    // 1. 今週の振り返り
    weeklyReview: {
      summary: string      // テキストエリア
    }
    
    // 2. 来週の計画
    nextWeekPlan: {
      summary: string      // テキストエリア
    }
    
    // 3. 宿題・課題
    homework: {
      summary: string      // テキストエリア
    }
    
    // 4. その他
    notes: string          // テキストエリア（任意）
  }
}
```

### 3.3 画面構成

#### 3.3.1 管理者画面
```
/admin/login          - ログイン画面
/admin/dashboard      - ダッシュボード（面談記録一覧）
/admin/interview/new  - 新規面談記録作成
/admin/interview/:id  - 面談記録詳細・編集
```

#### 3.3.2 生徒画面
```
/student/login        - ログイン画面
/student/dashboard    - 自分の面談記録一覧
/student/interview/:id - 面談記録詳細（読み取り専用）
```

## 4. 技術仕様（MVP版）

### 4.1 Context API ベースのアーキテクチャ（MMS Finance参考）
```
src/
├── lib/
│   └── firebase/
│       ├── config.ts        # Firebase初期化
│       └── AuthContext.tsx  # 認証Context
├── contexts/
│   ├── DataContext.tsx     # データ管理Context
│   ├── types.ts           # Context型定義
│   └── hooks/
│       └── useInterviews.ts # 面談データフック
├── shared/
│   ├── components/
│   │   └── guards/
│   │       └── PrivateRoute.tsx
│   └── types/
│       ├── interview.ts
│       └── user.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── AdminDashboard.tsx
│   └── StudentDashboard.tsx
├── features/
│   └── interviews/
│       └── components/
│           ├── InterviewForm.tsx
│           └── InterviewList.tsx
├── App.tsx
├── AdminApp.tsx
└── StudentApp.tsx
```

### 状態管理
- **AuthContext**: Firebase認証状態を管理
- **DataContext**: 面談データを一元管理
- Firebase読み取り回数を最小化（Context内で1回のみ）

### 4.2 最小限のFirestore構造
```
コレクション:
- users (認証後のユーザー情報)
  - uid
  - email
  - role: 'admin' | 'student'
  - name

- interviews (面談記録)
  - 上記のInterviewRecord構造
```

### 4.3 セキュリティルール（シンプル版）
```javascript
// users コレクション
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // 管理画面から手動設定
}

// interviews コレクション
match /interviews/{interviewId} {
  // 管理者は全て可能
  allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // 生徒は自分の記録のみ読み取り
  allow read: if request.auth.uid == resource.data.studentId;
}
```

## 5. 実装優先順位

### Phase 1: 基盤（Day 1-2）
1. プロジェクトセットアップ（Vite + React + TypeScript）
2. Firebase設定
3. 基本的なルーティング
4. 認証フロー実装

### Phase 2: コア機能（Day 3-5）
1. 管理者ダッシュボード
2. 面談記録作成フォーム
3. 面談記録表示

### Phase 3: 生徒機能（Day 6-7）
1. 生徒ログイン
2. 生徒ダッシュボード
3. 面談記録閲覧（読み取り専用）

### Phase 4: 検証（Day 8）
1. エラーハンドリング
2. バリデーション
3. 基本的なテスト

## 6. 将来の拡張性考慮（コードは書かない）

### 6.1 拡張可能な設計
- ユーザーのroleフィールド（将来: teacher, parent追加）
- 面談記録の基本構造（将来: フィールド追加）
- サービス層の分離（将来: 機能追加しやすく）

### 6.2 やらないこと
- 未使用のroleの定義
- 空のプレースホルダーコンポーネント
- 将来用のルート定義
- 使わないデータフィールド

## 7. 成功基準

### 7.1 機能要件
- [x] 管理者がログインできる
- [x] 管理者が面談記録を作成できる
- [x] 管理者が全面談記録を閲覧できる
- [x] 生徒がログインできる
- [x] 生徒が自分の面談記録を閲覧できる

### 7.2 非機能要件
- ページ読み込み: 3秒以内
- エラー時: 適切なメッセージ表示
- セキュリティ: 権限外のデータにアクセス不可

## 8. 制約事項

### 8.1 技術的制約
- Firebase無料プラン内で動作
- モバイル対応は必須ではない（デスクトップ優先）
- IEサポート不要

### 8.2 時間的制約
- 1週間での実装完了
- テストは最小限（E2Eテストは省略）

## 9. リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| Firebase無料枠超過 | 高 | 開発環境はエミュレータ使用 |
| 認証の複雑化 | 中 | Firebase Authの基本機能のみ使用 |
| UI/UXの作り込み | 低 | 基本的なCSSのみ（Tailwind利用） |

## 10. 開発の指針

### KISS - Keep It Simple
```
❌ 避ける:
- 複雑な状態管理ライブラリ
- 過度なコンポーネント分割
- 早すぎる最適化

✅ 採用:
- Context APIでの簡単な状態管理
- 明確な責任を持つコンポーネント
- 動作優先、最適化は後
```

### YAGNI - You Aren't Gonna Need It
```
❌ 実装しない:
- 多言語対応の準備
- ダークモード切り替え
- オフライン対応
- リアルタイム同期

✅ 集中する:
- 基本的なCRUD操作
- シンプルな認証
- 最小限のバリデーション
```

---

**チェックリスト**
- [ ] 不要な機能を含んでいないか？
- [ ] 1週間で実装可能か？
- [ ] 将来の拡張を妨げない設計か？
- [ ] YAGNIとKISSに従っているか？

**更新履歴**
- 2025-09-05: MVP要件定義作成