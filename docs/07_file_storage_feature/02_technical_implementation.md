# ファイル保存機能 - 技術実装詳細

## 🔧 Firebase Storage セットアップ

### 1. Firebase Console設定
```bash
# Firebase Consoleで:
# 1. Storage タブを開く
# 2. "Get started" をクリック
# 3. セキュリティルールを設定（開発中はテストモード）
# 4. ロケーションを選択（asia-northeast1推奨）
```

### 2. 環境変数追加
```env
# .env.local に追加（既存のFirebase設定に含まれている場合は不要）
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### 3. Firebase設定更新
```typescript
// src/lib/firebase/config.ts
import { getStorage } from 'firebase/storage';

export const storage = getStorage(app);
```

## 📁 実装コード例

### ファイルアップロード処理
```typescript
// src/contexts/DataContext.tsx に追加
const uploadFile = async (
  file: File,
  studentId: string,
  category: FileCategory,
  description?: string
): Promise<void> => {
  try {
    // 1. ファイル名の一意性を確保
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `students/${studentId}/files/${fileName}`;
    
    // 2. Storage にアップロード
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // 3. アップロード進捗の監視
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload progress:', progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        throw error;
      }
    );
    
    // 4. アップロード完了を待つ
    await uploadTask;
    
    // 5. ダウンロードURLを取得
    const downloadUrl = await getDownloadURL(storageRef);
    
    // 6. Firestoreにメタデータを保存
    await addDoc(collection(db, 'files'), {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: downloadUrl,
      category,
      description,
      studentId,
      uploadedBy: currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};
```

### ファイルリスト取得フック
```typescript
// src/contexts/hooks/realtime/useFiles.ts
export const useFiles = (studentId?: string) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const q = studentId
      ? query(
          collection(db, 'files'),
          where('studentId', '==', studentId),
          orderBy('createdAt', 'desc')
        )
      : query(collection(db, 'files'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fileData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FileRecord));
      
      setFiles(fileData);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [studentId]);
  
  return { files, loading };
};
```

### ファイルアップロードコンポーネント
```typescript
// src/features/files/components/FileUploadModal.tsx
const FileUploadModal: React.FC<Props> = ({ studentId, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory>('other');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      
      // ファイルサイズチェック
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください');
        return;
      }
      
      // ファイルタイプチェック
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('PDF、JPG、PNG形式のファイルのみアップロード可能です');
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadFile(file, studentId, category, description);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="modal">
      {/* UI実装 */}
    </div>
  );
};
```

## 🔒 セキュリティルール

### Firebase Storage Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 認証ユーザーのみアクセス可能
    match /students/{studentId}/files/{fileName} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.uid == studentId);
      
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin' &&
        request.resource.size < 10 * 1024 * 1024; // 10MB制限
      
      allow delete: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

### Firestore Security Rules追加
```javascript
// firestore.rules に追加
match /files/{fileId} {
  allow read: if request.auth != null && 
    (request.auth.token.role == 'admin' || 
     request.auth.uid == resource.data.studentId);
  
  allow create: if request.auth != null && 
    request.auth.token.role == 'admin';
  
  allow update: if request.auth != null && 
    request.auth.token.role == 'admin';
  
  allow delete: if request.auth != null && 
    request.auth.token.role == 'admin';
}
```

## 🎨 UI/UXデザイン

### ファイルリストコンポーネント
```tsx
// src/features/files/components/FileList.tsx
const FileList: React.FC<{ studentId?: string }> = ({ studentId }) => {
  const { files, loading } = useFiles(studentId);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">アップロードファイル</h3>
      </div>
      
      <div className="divide-y">
        {files.map(file => (
          <div key={file.id} className="p-4 hover:bg-gray-50 cursor-pointer"
               onClick={() => setSelectedFile(file)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileIcon type={file.fileType} />
                <div>
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.fileSize)} • 
                    {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>
              <CategoryBadge category={file.category} />
            </div>
          </div>
        ))}
      </div>
      
      {selectedFile && (
        <FilePreview 
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};
```

## 📊 パフォーマンス最適化

### 1. 遅延読み込み
```typescript
// PDFビューアーを遅延読み込み
const PDFViewer = lazy(() => import('./components/PDFViewer'));
```

### 2. ファイルキャッシュ
```typescript
// Service Workerでファイルをキャッシュ
self.addEventListener('fetch', event => {
  if (event.request.url.includes('firebasestorage.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          return caches.open('file-cache-v1').then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

### 3. サムネイル生成
```typescript
// Cloud Functionsでサムネイル自動生成（オプション）
export const generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    // PDFや画像のサムネイル生成処理
  });
```

## ⚡ エラーハンドリング

### アップロードエラー処理
```typescript
const handleUploadError = (error: any) => {
  if (error.code === 'storage/unauthorized') {
    return 'アップロード権限がありません';
  }
  if (error.code === 'storage/quota-exceeded') {
    return 'ストレージ容量を超過しました';
  }
  if (error.code === 'storage/invalid-checksum') {
    return 'ファイルが破損しています';
  }
  return 'アップロードに失敗しました';
};
```

## 📝 テスト計画

### 単体テスト項目
- [ ] ファイルタイプ検証
- [ ] ファイルサイズ制限
- [ ] アップロード成功/失敗
- [ ] メタデータ保存

### 統合テスト項目
- [ ] ファイルアップロード→リスト表示
- [ ] 権限による表示制御
- [ ] プレビュー機能
- [ ] 削除機能

### E2Eテスト項目
- [ ] 完全なアップロードフロー
- [ ] エラー時のリトライ
- [ ] 複数ファイル同時アップロード