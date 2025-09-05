# Firebase Functions HEIC変換 実装詳細仕様書

*作成日時: 2025-09-06 00:42*  
*最終更新: 2025-09-06 00:42*

## 目次
1. [前提条件と事前準備](#前提条件と事前準備)
2. [詳細なセットアップ手順](#詳細なセットアップ手順)
3. [エラーハンドリング詳細](#エラーハンドリング詳細)
4. [セキュリティ考慮事項](#セキュリティ考慮事項)
5. [パフォーマンスチューニング](#パフォーマンスチューニング)
6. [監視とログ](#監視とログ)
7. [トラブルシューティング](#トラブルシューティング)
8. [実装チェックリスト](#実装チェックリスト)

---

## 前提条件と事前準備

### 必須要件
- [ ] Node.js v18以上（v20推奨）
- [ ] Firebase CLIインストール済み（v13.0以上）
- [ ] Blazeプラン有効化済み
- [ ] クレジットカード登録済み
- [ ] Firebase Admin SDK権限

### 環境確認コマンド
```bash
# Node.jsバージョン確認
node --version  # v20.x.x以上

# Firebase CLIバージョン確認
firebase --version  # 13.x.x以上

# ログイン状態確認
firebase login:list

# プロジェクト確認
firebase projects:list
```

### 権限設定確認
```bash
# サービスアカウント確認
gcloud iam service-accounts list

# Storage権限確認
gsutil iam get gs://mms-student-meeting.appspot.com
```

---

## 詳細なセットアップ手順

### Step 1: Functions初期化（詳細版）

#### 1.1 プロジェクトディレクトリ準備
```bash
# プロジェクトルートで実行
cd /Users/nishimototakashi/claude\ code/mms-student_meeting

# 既存のfunctionsディレクトリ確認
ls -la functions/  # 存在しない場合のみ初期化

# バックアップ（既存の場合）
cp -r functions functions_backup_$(date +%Y%m%d_%H%M)
```

#### 1.2 Firebase Functions初期化
```bash
firebase init functions

# 対話型設定の回答
# ? What language would you like to use to write Cloud Functions? 
# → TypeScript（矢印キーで選択）

# ? Do you want to use ESLint to catch probable bugs and enforce style?
# → Yes

# ? Do you want to install dependencies with npm now?
# → Yes

# ? Would you like to initialize a new codebase, or overwrite an existing one?
# → Initialize（新規の場合）/ Overwrite（既存の場合）
```

#### 1.3 TypeScript設定の最適化
```json
// functions/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ],
  "exclude": [
    "node_modules",
    "lib"
  ]
}
```

### Step 2: 依存関係の詳細管理

#### 2.1 必須パッケージインストール
```bash
cd functions

# 本番依存関係
npm install sharp@^0.33.0
npm install @google-cloud/storage@^7.7.0

# 開発依存関係
npm install --save-dev @types/sharp@^0.32.0
npm install --save-dev @types/node@^20.10.0
npm install --save-dev typescript@^5.3.0
```

#### 2.2 package.jsonの最適化
```json
// functions/package.json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "test": "jest",
    "lint": "eslint --ext .js,.ts ."
  },
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0",
    "sharp": "^0.33.0",
    "@google-cloud/storage": "^7.7.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.29.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/sharp": "^0.32.0"
  },
  "private": true
}
```

### Step 3: Sharp ライブラリの特殊設定

#### 3.1 ビルド前処理（重要）
```bash
# Sharpのバイナリ再ビルド（Linux環境用）
cd functions
npm rebuild sharp --platform=linux --arch=x64

# または package.jsonに追加
"scripts": {
  "predeploy": "npm rebuild sharp --platform=linux --arch=x64"
}
```

#### 3.2 .npmrcファイル作成
```bash
# functions/.npmrc
cat > functions/.npmrc << 'EOF'
sharp_binary_host=https://github.com/lovell/sharp/releases/download
sharp_libvips_binary_host=https://github.com/lovell/sharp-libvips/releases/download
EOF
```

---

## エラーハンドリング詳細

### 包括的エラー処理実装

```typescript
// functions/src/errors.ts
export enum ConversionErrorCode {
  INVALID_FILE = 'INVALID_FILE',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FIRESTORE_UPDATE_FAILED = 'FIRESTORE_UPDATE_FAILED',
  TIMEOUT = 'TIMEOUT',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  UNKNOWN = 'UNKNOWN'
}

export class ConversionError extends Error {
  constructor(
    public code: ConversionErrorCode,
    public message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ConversionError';
  }
}

// エラーハンドラー
export async function handleConversionError(
  error: any,
  fileId?: string,
  filePath?: string
): Promise<void> {
  const errorData = {
    code: error.code || ConversionErrorCode.UNKNOWN,
    message: error.message || 'Unknown error occurred',
    timestamp: new Date().toISOString(),
    filePath,
    stack: error.stack
  };

  // エラーログ
  console.error('Conversion error:', errorData);

  // Firestoreにエラー記録
  if (fileId) {
    try {
      await admin.firestore().collection('files').doc(fileId).update({
        conversionStatus: 'error',
        conversionError: errorData,
        lastAttempt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
  }

  // エラー通知（オプション）
  await sendErrorNotification(errorData);
}
```

### リトライ機構

```typescript
// functions/src/retry.ts
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}
```

---

## セキュリティ考慮事項

### 1. ファイル検証

```typescript
// functions/src/validators.ts
import * as crypto from 'crypto';
import * as magic from 'stream-mmmagic';

export async function validateFile(
  filePath: string,
  buffer: Buffer
): Promise<boolean> {
  // 1. ファイルサイズチェック
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (buffer.length > MAX_FILE_SIZE) {
    throw new ConversionError(
      ConversionErrorCode.INVALID_FILE,
      `File size exceeds limit: ${buffer.length} bytes`
    );
  }

  // 2. MIMEタイプ検証
  const fileType = await detectFileType(buffer);
  const validTypes = ['image/heic', 'image/heif', 'image/heic-sequence'];
  
  if (!validTypes.includes(fileType)) {
    throw new ConversionError(
      ConversionErrorCode.INVALID_FILE,
      `Invalid file type: ${fileType}`
    );
  }

  // 3. ファイル名検証
  const validExtensions = ['.heic', '.heif', '.HEIC', '.HEIF'];
  const hasValidExtension = validExtensions.some(ext => 
    filePath.toLowerCase().endsWith(ext.toLowerCase())
  );
  
  if (!hasValidExtension) {
    throw new ConversionError(
      ConversionErrorCode.INVALID_FILE,
      `Invalid file extension: ${filePath}`
    );
  }

  // 4. マジックナンバー検証
  const heicMagicBytes = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
  if (!buffer.slice(4, 12).equals(heicMagicBytes)) {
    throw new ConversionError(
      ConversionErrorCode.INVALID_FILE,
      'Invalid HEIC file signature'
    );
  }

  return true;
}
```

### 2. パス・トラバーサル対策

```typescript
// functions/src/security.ts
export function sanitizePath(filePath: string): string {
  // パストラバーサル文字を除去
  const sanitized = filePath
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  // 許可されたプレフィックスチェック
  const allowedPrefixes = ['students/', 'uploads/'];
  const hasValidPrefix = allowedPrefixes.some(prefix => 
    sanitized.startsWith(prefix)
  );

  if (!hasValidPrefix) {
    throw new Error(`Invalid file path: ${filePath}`);
  }

  return sanitized;
}
```

### 3. レート制限

```typescript
// functions/src/rateLimit.ts
const processedFiles = new Map<string, number>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userHistory = processedFiles.get(userId) || 0;
  
  // 1分間に10ファイルまで
  const RATE_LIMIT = 10;
  const TIME_WINDOW = 60 * 1000; // 1 minute

  if (now - userHistory < TIME_WINDOW) {
    return false;
  }

  processedFiles.set(userId, now);
  
  // メモリクリーンアップ
  if (processedFiles.size > 1000) {
    const oldestAllowed = now - TIME_WINDOW;
    for (const [key, time] of processedFiles.entries()) {
      if (time < oldestAllowed) {
        processedFiles.delete(key);
      }
    }
  }

  return true;
}
```

---

## パフォーマンスチューニング

### 1. メモリ最適化

```typescript
// functions/src/performance.ts
export const PERFORMANCE_CONFIG = {
  // メモリ設定
  memory: {
    small: '256MB',   // < 2MB files
    medium: '512MB',  // 2-10MB files
    large: '1GB',     // 10-30MB files
    xlarge: '2GB'     // 30MB+ files
  },
  
  // タイムアウト設定
  timeout: {
    small: 30,        // seconds
    medium: 60,
    large: 120,
    xlarge: 300
  },

  // 同時実行数
  maxInstances: {
    development: 2,
    staging: 5,
    production: 10
  }
};

// 動的メモリ割り当て
export function getOptimalConfig(fileSize: number) {
  const sizeMB = fileSize / (1024 * 1024);
  
  if (sizeMB < 2) {
    return {
      memory: PERFORMANCE_CONFIG.memory.small,
      timeoutSeconds: PERFORMANCE_CONFIG.timeout.small
    };
  } else if (sizeMB < 10) {
    return {
      memory: PERFORMANCE_CONFIG.memory.medium,
      timeoutSeconds: PERFORMANCE_CONFIG.timeout.medium
    };
  } else if (sizeMB < 30) {
    return {
      memory: PERFORMANCE_CONFIG.memory.large,
      timeoutSeconds: PERFORMANCE_CONFIG.timeout.large
    };
  } else {
    return {
      memory: PERFORMANCE_CONFIG.memory.xlarge,
      timeoutSeconds: PERFORMANCE_CONFIG.timeout.xlarge
    };
  }
}
```

### 2. Sharp最適化設定

```typescript
// functions/src/sharpConfig.ts
import * as sharp from 'sharp';

// グローバル設定
sharp.cache(false); // メモリリーク防止
sharp.concurrency(1); // CPU使用率制限
sharp.simd(true); // SIMD有効化

export const CONVERSION_CONFIG = {
  jpeg: {
    quality: 90,
    progressive: true,
    chromaSubsampling: '4:2:0',
    trellisQuantisation: true,
    overshootDeringing: true,
    optimiseScans: true,
    optimizeCoding: true,
    mozjpeg: true
  },
  
  resize: {
    width: 2048,  // 最大幅
    height: 2048, // 最大高さ
    fit: sharp.fit.inside,
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3
  },
  
  // メタデータ設定
  metadata: {
    stripAll: true,  // プライバシー保護
    density: 72      // Web用DPI
  }
};
```

---

## 監視とログ

### 1. カスタムメトリクス

```typescript
// functions/src/monitoring.ts
export class ConversionMetrics {
  private static startTime: number;
  
  static start() {
    this.startTime = Date.now();
  }
  
  static log(stage: string, metadata?: any) {
    const elapsed = Date.now() - this.startTime;
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      stage,
      elapsed,
      ...metadata
    }));
  }
  
  static async recordConversion(result: any) {
    const metrics = {
      fileId: result.fileId,
      originalSize: result.originalSize,
      convertedSize: result.convertedSize,
      compressionRatio: result.convertedSize / result.originalSize,
      processingTime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
    
    // Firestoreに記録
    await admin.firestore()
      .collection('conversion_metrics')
      .add(metrics);
      
    return metrics;
  }
}
```

### 2. ログ設定

```typescript
// functions/src/logger.ts
import { logger } from 'firebase-functions';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

export class FunctionLogger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  log(level: LogLevel, message: string, data?: any) {
    const logData = {
      context: this.context,
      timestamp: new Date().toISOString(),
      message,
      ...data
    };
    
    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(logData);
        break;
      case LogLevel.INFO:
        logger.info(logData);
        break;
      case LogLevel.WARNING:
        logger.warn(logData);
        break;
      case LogLevel.ERROR:
        logger.error(logData);
        break;
    }
  }
}
```

### 3. アラート設定

```bash
# Cloud Monitoringアラート設定
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="HEIC Conversion Errors" \
  --condition="resource.type=\"cloud_function\" 
    AND resource.labels.function_name=\"convertHeicToJpeg\"
    AND metric.type=\"cloudfunctions.googleapis.com/function/execution_count\"
    AND metric.labels.status!=\"ok\"" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

---

## トラブルシューティング

### よくある問題と解決策

#### 問題1: Sharp installation failed
```bash
# 解決策
cd functions
rm -rf node_modules package-lock.json
npm install --platform=linux --arch=x64 sharp
npm install
```

#### 問題2: Memory exceeded error
```javascript
// 解決策: メモリ増加
.runWith({
  memory: '2GB',  // 512MB → 2GB
  timeoutSeconds: 300
})
```

#### 問題3: Permission denied
```bash
# 解決策: IAM権限付与
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

#### 問題4: Cold start が遅い
```javascript
// 解決策: 最小インスタンス設定
.runWith({
  minInstances: 1,  // 常時1インスタンス起動
})
```

#### 問題5: CORS エラー
```javascript
// 解決策: CORS設定追加
const cors = require('cors')({
  origin: true
});

exports.healthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).send({ status: 'ok' });
  });
});
```

### デバッグコマンド集

```bash
# ログ確認
firebase functions:log --only convertHeicToJpeg -n 50

# エミュレータ起動
firebase emulators:start --only functions,storage,firestore

# 単体テスト実行
cd functions && npm test

# ローカルシェル実行
firebase functions:shell

# メトリクス確認
gcloud functions describe convertHeicToJpeg --region=asia-northeast2

# エラーレート確認
gcloud logging read "resource.type=cloud_function 
  AND resource.labels.function_name=convertHeicToJpeg 
  AND severity>=ERROR" --limit 50
```

---

## 実装チェックリスト

### 事前準備
- [ ] Firebase Blazeプラン有効
- [ ] Node.js v20インストール
- [ ] Firebase CLI最新版
- [ ] プロジェクト選択確認
- [ ] サービスアカウント権限確認

### Functions設定
- [ ] TypeScript環境構築
- [ ] Sharp依存関係インストール
- [ ] Linux向けビルド設定
- [ ] tsconfig.json最適化
- [ ] ESLint設定

### 実装
- [ ] メイン変換関数実装
- [ ] エラーハンドリング実装
- [ ] ファイル検証実装
- [ ] メトリクス記録実装
- [ ] ログ設定

### クライアント連携
- [ ] FileRecord型定義更新
- [ ] アップロード時メタデータ追加
- [ ] 表示ロジック更新
- [ ] 変換ステータス表示
- [ ] エラー表示

### テスト
- [ ] ユニットテスト作成
- [ ] エミュレータテスト
- [ ] 実環境テスト（開発）
- [ ] 負荷テスト
- [ ] エラーケーステスト

### デプロイ
- [ ] ステージング環境デプロイ
- [ ] 動作確認
- [ ] 本番環境デプロイ
- [ ] ログ監視設定
- [ ] アラート設定

### ドキュメント
- [ ] README更新
- [ ] API仕様書作成
- [ ] 運用手順書作成
- [ ] トラブルシューティングガイド更新
- [ ] コスト試算更新

---

*最終更新: 2025-09-06 00:42*  
*作成者: Claude Code Assistant*