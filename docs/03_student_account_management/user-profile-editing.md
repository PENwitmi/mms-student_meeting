# ユーザープロフィール編集機能 実装計画書

## 概要
管理者と学生の両方が、自分のプロフィール情報をダッシュボードから編集できる機能を実装します。
これにより、ユーザーが自分の情報を最新に保つことができ、管理者の作業負荷も軽減されます。

## 機能要件

### 共通編集可能項目（管理者・学生共通）
- 名前（表示名）
- プロフィール画像（将来実装）
- 連絡先情報（任意）

### 学生限定編集項目
- 学年（進級時の更新）
- クラス
- 学籍番号（初回登録後は読み取り専用）

### 管理者限定編集項目
- 管理者名
- 部署・役職（任意）

### 編集不可項目（全ユーザー）
- メールアドレス（セキュリティ上の理由）
- UID
- ロール（role）
- 作成日時
- パスワード（別画面で変更）

## 技術実装

### データ構造の拡張
```typescript
interface UserProfile {
  // 既存フィールド
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  
  // 学生用フィールド
  studentId?: string;        // 学籍番号（編集不可）
  grade?: number;            // 学年（学生のみ編集可）
  class?: string;            // クラス（学生のみ編集可）
  
  // 追加フィールド
  displayName?: string;      // 表示名（name とは別に）
  phoneNumber?: string;      // 電話番号（任意）
  profileImageUrl?: string;  // プロフィール画像URL（将来実装）
  department?: string;       // 部署（管理者用）
  position?: string;         // 役職（管理者用）
  bio?: string;             // 自己紹介（任意）
  
  // メタデータ
  lastEditedAt?: Date;      // 最終編集日時
  editHistory?: EditRecord[]; // 編集履歴（オプション）
  createdAt: Date;
  updatedAt: Date;
}

interface EditRecord {
  editedAt: Date;
  editedBy: string;
  changedFields: string[];
}
```

### UIコンポーネント設計

#### 1. プロフィール編集セクション
```typescript
// components/ProfileEditSection.tsx
export function ProfileEditSection() {
  const { userProfile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  
  const editableFields = useMemo(() => {
    if (userProfile?.role === 'admin') {
      return ['name', 'displayName', 'phoneNumber', 'department', 'position', 'bio'];
    } else {
      return ['name', 'displayName', 'phoneNumber', 'grade', 'class', 'bio'];
    }
  }, [userProfile?.role]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">プロフィール情報</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          {isEditing ? 'キャンセル' : '編集'}
        </button>
      </div>
      
      {isEditing ? (
        <ProfileEditForm 
          userProfile={userProfile}
          editableFields={editableFields}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <ProfileDisplay userProfile={userProfile} />
      )}
    </div>
  );
}
```

#### 2. パスワード変更セクション（独立）
```typescript
// components/PasswordChangeSection.tsx
export function PasswordChangeSection() {
  const [isChanging, setIsChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handlePasswordChange = async () => {
    // 再認証
    const credential = EmailAuthProvider.credential(
      user.email!,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
    
    // パスワード更新
    await updatePassword(user, newPassword);
    
    // UIリセット
    setIsChanging(false);
    resetForm();
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow mt-4">
      <h3 className="text-lg font-semibold mb-4">パスワード設定</h3>
      {/* パスワード変更フォーム */}
    </div>
  );
}
```

### Context層の拡張

```typescript
// contexts/AuthContext.tsx に追加
export interface AuthContextValue {
  // 既存のフィールド
  user: User | null;
  userProfile: UserProfile | null;
  
  // 追加メソッド
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<string>; // 将来実装
}

// プロフィール更新関数
const updateProfile = async (updates: Partial<UserProfile>) => {
  if (!user || !userProfile) return;
  
  // 編集可能フィールドのフィルタリング
  const allowedFields = getAllowedFields(userProfile.role);
  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => ({
      ...obj,
      [key]: updates[key as keyof UserProfile]
    }), {});
  
  // Firestore更新
  await updateDoc(doc(db, 'users', user.uid), {
    ...filteredUpdates,
    lastEditedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // ローカル状態更新
  setUserProfile(prev => prev ? { ...prev, ...filteredUpdates } : null);
};
```

### バリデーションルール

```typescript
// utils/profileValidation.ts
export const validateProfileUpdate = (
  updates: Partial<UserProfile>,
  role: UserRole
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // 名前の検証
  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      errors.name = '名前は必須です';
    } else if (updates.name.length > 50) {
      errors.name = '名前は50文字以内で入力してください';
    }
  }
  
  // 電話番号の検証
  if (updates.phoneNumber !== undefined && updates.phoneNumber) {
    if (!updates.phoneNumber.match(/^[\d-+()]+$/)) {
      errors.phoneNumber = '電話番号の形式が正しくありません';
    }
  }
  
  // 学年の検証（学生のみ）
  if (role === 'student' && updates.grade !== undefined) {
    if (updates.grade < 1 || updates.grade > 3) {
      errors.grade = '学年は1〜3の値を入力してください';
    }
  }
  
  // 自己紹介の検証
  if (updates.bio !== undefined && updates.bio.length > 500) {
    errors.bio = '自己紹介は500文字以内で入力してください';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## UI/UXデザイン

### ダッシュボードレイアウト
```
Dashboard
├── ヘッダー
├── サイドバー
└── メインコンテンツ
    ├── プロフィール編集セクション ← 新規追加
    │   ├── 基本情報表示/編集
    │   ├── ロール別追加情報
    │   └── 保存/キャンセルボタン
    ├── パスワード変更セクション ← 新規追加
    └── 既存のコンテンツ（面談記録等）
```

### 編集フロー
1. **表示モード（デフォルト）**
   - 現在の情報を読み取り専用で表示
   - 「編集」ボタンを配置

2. **編集モード**
   - 編集可能フィールドが入力可能に
   - リアルタイムバリデーション
   - 「保存」「キャンセル」ボタン表示

3. **保存処理**
   - 楽観的UI更新（即座に反映）
   - バックグラウンドでFirestore更新
   - エラー時はロールバック

## 実装スケジュール

### Phase 1: 基本編集機能（2-3時間）
- [ ] ProfileEditSectionコンポーネント作成
- [ ] AuthContextへの updateProfile メソッド追加
- [ ] 基本的なフィールド編集機能
- [ ] バリデーション実装

### Phase 2: パスワード変更（1-2時間）
- [ ] PasswordChangeSectionコンポーネント作成
- [ ] 再認証フロー実装
- [ ] パスワード強度チェック
- [ ] エラーハンドリング

### Phase 3: UI/UX改善（1時間）
- [ ] 編集モードの切り替えアニメーション
- [ ] 成功/エラー通知
- [ ] 確認ダイアログ
- [ ] ローディング状態

### Phase 4: テスト（1時間）
- [ ] 各ロールでの編集権限確認
- [ ] バリデーション動作確認
- [ ] エラーケーステスト

## セキュリティ考慮事項

### 1. 編集権限の制御
```typescript
// Firestore Rules
match /users/{userId} {
  allow read: if request.auth != null && 
    (request.auth.uid == userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  // 自分のプロフィールのみ編集可能
  allow update: if request.auth != null && 
    request.auth.uid == userId &&
    // ロールとメールアドレスは変更不可
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'email', 'uid']);
}
```

### 2. 入力サニタイゼーション
- XSS対策（HTMLエスケープ）
- SQLインジェクション対策（Firestoreは自動対応）
- 文字数制限

### 3. 監査ログ（オプション）
```typescript
interface AuditLog {
  userId: string;
  action: 'profile_updated';
  timestamp: Date;
  changedFields: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}
```

## 実装の優先順位

1. **必須機能（MVP）**
   - 基本情報（名前）の編集
   - 学生：学年・クラスの編集
   - パスワード変更

2. **推奨機能**
   - 電話番号・自己紹介の編集
   - 編集履歴の記録
   - 入力バリデーション強化

3. **将来実装**
   - プロフィール画像アップロード
   - メールアドレス変更（確認メール必須）
   - 編集履歴の表示
   - 他ユーザーのプロフィール編集（管理者権限）

## 成功指標

### 必須要件 ✅
- [ ] ユーザーが自分のプロフィールを編集できる
- [ ] ロールに応じた編集可能フィールドの制御
- [ ] パスワード変更機能が動作する
- [ ] 編集内容がFirestoreに正しく保存される

### 品質指標 📊
- [ ] 編集操作が3クリック以内で完了
- [ ] 保存処理が2秒以内に完了
- [ ] エラー時に適切なメッセージ表示
- [ ] UIが直感的で説明不要

## エラーハンドリング

```typescript
const ERROR_MESSAGES = {
  'permission-denied': '編集権限がありません',
  'invalid-data': '入力データが正しくありません',
  'network-error': 'ネットワークエラーが発生しました',
  'auth/requires-recent-login': '再度ログインが必要です',
  'auth/wrong-password': '現在のパスワードが正しくありません',
  'profile-update-failed': 'プロフィールの更新に失敗しました'
};
```

## 実装時間見積もり
**合計: 5-7時間**

この機能により、ユーザーの自己管理能力が向上し、システム全体の運用効率が改善されます。