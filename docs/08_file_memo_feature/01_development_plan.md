# ファイルメモ機能 開発計画書

## 概要
アップロード済みファイルに対して説明メモを追加・編集できる機能を実装する。
Context API原則を厳密に遵守し、MVS Finance パターンに準拠した実装を行う。

## 背景と目的
- **課題**: ファイル名だけでは内容を後から把握しづらい
- **解決策**: 各ファイルに説明メモを付与可能にする
- **効果**: 「定期テスト答案（85点）」「進路相談資料」等の補足情報で管理性向上

## Context API 実装原則（厳守事項）

### 1. レイヤー分離の絶対原則
```
Firebase操作: src/contexts/ のみ
UI層: src/features/, src/pages/ はFirebase直接参照禁止
```

### 2. データフロー
```
UI Component → Context Hook → Firebase Operation → State Update → UI Re-render
```

### 3. 実装場所の明確化
- **Firebase操作**: `DataContext.tsx` 内の `updateFile` 関数
- **型定義**: `contexts/types/file.ts`
- **UI実装**: `features/files/` 配下のコンポーネント

## 実装計画

### Phase 1: 型定義の拡張
**ファイル**: `src/contexts/types/file.ts`

```typescript
export interface FileRecord {
  // 既存フィールド...
  
  // 追加フィールド
  description?: string;  // ファイル説明メモ（最大200文字）
  updatedAt?: Date | Timestamp;  // 最終更新日時
}

export interface FileUpdateParams {
  fileId: string;
  description: string;
}
```

### Phase 2: DataContext に updateFile 実装
**ファイル**: `src/contexts/DataContext.tsx`

```typescript
// ファイル情報更新機能（管理者のみ）
const updateFile = useCallback(async (params: FileUpdateParams) => {
  // 1. 認証チェック
  // 2. 権限チェック（admin only）
  // 3. Firestore更新
  //    - description フィールド更新
  //    - updatedAt を serverTimestamp() で更新
  // 4. エラーハンドリング
}, [currentUser, userProfile]);
```

### Phase 3: UI コンポーネント実装

#### 3-1. メモ編集ダイアログ
**新規ファイル**: `src/features/files/FileMemoEdit.tsx`
- メモ入力フォーム（textarea）
- 文字数カウンター（最大200文字）
- 保存/キャンセルボタン

#### 3-2. FileList コンポーネント改修
**既存ファイル**: `src/features/files/FileList.tsx`
- メモ表示エリア追加
- 編集ボタン追加（管理者のみ）
- メモ有無のインジケーター表示

## 実装順序とタスク

1. **型定義拡張** (15分)
   - FileRecord インターフェース更新
   - FileUpdateParams 追加

2. **DataContext 更新** (30分)
   - updateFile 関数実装
   - actions へ追加

3. **メモ編集UI作成** (45分)
   - FileMemoEdit コンポーネント
   - 入力フォームとバリデーション

4. **FileList 統合** (30分)
   - メモ表示エリア追加
   - 編集トリガー実装

5. **テスト・検証** (30分)
   - 動作確認
   - エラーケース確認

**総見積時間**: 約2.5時間

## 技術的考慮事項

### セキュリティ
- 管理者のみ編集可能
- XSS対策（React自動エスケープ）
- 文字数制限によるDB負荷軽減

### パフォーマンス
- onSnapshot による自動反映
- 編集時のみFirestore更新
- 楽観的更新は不要（リアルタイム同期）

### UI/UX
- インライン表示で一覧性維持
- モーダル編集で集中作業
- 保存前確認なし（即座に反映）

## リスクと対策

| リスク | 対策 |
|-------|------|
| 長文メモによるレイアウト崩れ | 200文字制限、省略表示 |
| 同時編集の競合 | 最終更新者優先（Firestore標準） |
| 誤編集・削除 | 編集履歴なし（MVP仕様） |

## 成功基準
- ✅ Context API原則100%準拠
- ✅ 管理者がメモを追加・編集可能
- ✅ 学生はメモ閲覧のみ可能
- ✅ リアルタイム反映
- ✅ 既存機能への影響なし

## 将来の拡張可能性
- 編集履歴の保存
- タグ機能の追加
- 全文検索対応
- ファイルカテゴリ分類

## 関連ドキュメント
- `/docs/07_file_storage_feature/` - 既存ファイル機能
- `/src/contexts/DataContext.tsx` - 実装場所
- `/src/features/files/` - UI実装場所