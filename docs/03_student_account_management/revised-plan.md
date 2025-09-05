# 学生アカウント管理機能 改訂版実装計画

## 方針変更：学生自己登録方式

### 変更理由
- 管理者画面からの作成はFirebase Authの制約で複雑
- 学生が自分でパスワードを設定できる（セキュア）
- 一般的なWebサービスと同じUXで理解しやすい
- 実装がシンプル（5-6時間 → 3-4時間）

## 新しい実装方針

### 1. 学生登録フロー
```
1. ログイン画面に「新規登録」リンク
2. 学生登録フォーム表示
3. 必要情報入力（メール、パスワード、名前、学籍番号等）
4. アカウント作成
5. 自動的に学生ロールで登録
6. ログイン画面へリダイレクト
```

### 2. 管理者の役割
- 学生一覧の確認
- 学生情報の編集
- アカウントの無効化
- パスワードリセット支援

## 実装内容

### Phase 1: 学生自己登録（2-3時間）

#### A. 登録画面の作成
```typescript
// pages/Register.tsx
export function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: '',
    grade: 1,
    class: ''
  });

  const handleRegister = async () => {
    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      throw new Error('パスワードが一致しません');
    }

    // アカウント作成
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );

    // プロフィール作成
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: formData.email,
      name: formData.name,
      role: 'student',  // 自動的に学生ロール
      studentId: formData.studentId,
      grade: formData.grade,
      class: formData.class,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // ログイン画面へ
    navigate('/login');
  };
}
```

#### B. ログイン画面の修正
```typescript
// pages/Login.tsx
<div className="text-center mt-4">
  <span className="text-gray-600">アカウントをお持ちでない方は</span>
  <Link to="/register" className="text-indigo-600 hover:text-indigo-500 ml-1">
    新規登録
  </Link>
</div>
```

### Phase 2: 管理者向け学生管理（2時間）

#### A. 学生一覧画面
- 登録済み学生の確認
- 検索・フィルタ機能
- 学生情報の詳細表示

#### B. 学生情報編集
- 名前、学年、クラスの編集
- アカウントの有効/無効切り替え

### Phase 3: 初回ログイン処理（オプション、1時間）
必要に応じて実装：
- パスワード強度チェック
- プロフィール補完要求
- 利用規約同意

## メリット

### 1. 実装がシンプル
- Firebase Authの制約を回避
- セカンダリAuthインスタンス不要
- 管理者のセッション管理不要

### 2. セキュリティ向上
- 学生が自分でパスワード設定
- 初期パスワードの受け渡し不要
- パスワード漏洩リスク低減

### 3. UX改善
- 一般的なサービスと同じフロー
- 学生の自主性を尊重
- 管理者の作業負荷軽減

## 実装スケジュール

### Day 1（3-4時間）
1. **学生登録機能**
   - Register.tsxコンポーネント作成
   - バリデーション実装
   - Firestore保存処理

2. **ログイン画面更新**
   - 新規登録リンク追加
   - ルーティング設定

### Day 2（2-3時間）※オプション
3. **管理者向け機能**
   - 学生一覧表示
   - 学生情報編集
   - 検索・フィルタ

## コンポーネント構成

```
src/pages/
├── Login.tsx          # 既存（修正）
├── Register.tsx       # 新規：学生登録画面
└── Dashboard.tsx      # 既存

src/features/students/
├── components/
│   ├── StudentList.tsx        # 学生一覧（管理者用）
│   ├── StudentCard.tsx        # 学生カード
│   └── EditStudentModal.tsx   # 編集モーダル
└── hooks/
    └── useStudentList.ts      # 学生リスト管理
```

## バリデーションルール

### 登録時の検証
```typescript
const validateRegistration = (data: RegistrationData) => {
  const errors: ValidationErrors = {};

  // メール
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.email = '正しいメールアドレスを入力してください';
  }

  // パスワード
  if (data.password.length < 8) {
    errors.password = 'パスワードは8文字以上必要です';
  }

  // パスワード確認
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'パスワードが一致しません';
  }

  // 名前
  if (!data.name.trim()) {
    errors.name = '名前を入力してください';
  }

  // 学籍番号
  if (!data.studentId.match(/^\d{6,}$/)) {
    errors.studentId = '学籍番号は6桁以上の数字で入力してください';
  }

  return errors;
};
```

## セキュリティ考慮事項

### 1. スパム登録対策
- reCAPTCHA実装（将来）
- レート制限
- メールアドレス検証

### 2. なりすまし防止
- 学籍番号の一意性チェック
- 管理者による承認フロー（オプション）
- メールドメイン制限（学校のメールのみ）

### 3. データ保護
- パスワードはFirebase Authで暗号化
- 個人情報の最小限収集
- GDPR/個人情報保護法対応

## エラーハンドリング

```typescript
const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'このメールアドレスは既に登録されています',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/weak-password': 'パスワードが弱すぎます',
  'student-id-exists': 'この学籍番号は既に登録されています'
};
```

## 成功指標

### 必須要件 ✅
- [ ] 学生が自分でアカウントを作成できる
- [ ] 登録後すぐにログインできる
- [ ] 管理者が学生一覧を確認できる

### 推奨要件 📋
- [ ] 学籍番号の重複チェック
- [ ] パスワード強度表示
- [ ] 登録確認メール（将来）

## 実装時間
**合計: 3-4時間（必須機能のみ）**

大幅に簡略化され、実用的な実装が可能になりました！