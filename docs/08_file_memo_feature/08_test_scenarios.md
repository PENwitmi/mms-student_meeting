# Firebase Functions HEIC変換機能 テストシナリオ詳細

*作成日時: 2025-09-06 00:43*  
*テスト実施者向けガイド*

## 目次
1. [テスト環境準備](#テスト環境準備)
2. [単体テスト](#単体テスト)
3. [結合テスト](#結合テスト)
4. [E2Eテスト](#e2eテスト)
5. [負荷テスト](#負荷テスト)
6. [セキュリティテスト](#セキュリティテスト)
7. [回帰テスト](#回帰テスト)
8. [受け入れテスト](#受け入れテスト)

---

## テスト環境準備

### テストデータ準備

#### 1. テスト用HEICファイル作成
```bash
# テストファイル一覧
test-files/
├── normal/
│   ├── sample_1mb.heic    # 通常サイズ
│   ├── sample_5mb.heic    # 中サイズ
│   └── sample_10mb.heic   # 大サイズ
├── edge-cases/
│   ├── sample_50mb.heic   # 最大サイズ
│   ├── sample_100kb.heic  # 最小サイズ
│   ├── sample_0byte.heic  # 空ファイル
│   └── sample_portrait.heic # 縦長画像
├── corrupted/
│   ├── broken_header.heic # ヘッダー破損
│   ├── incomplete.heic    # 不完全ファイル
│   └── fake_heic.jpg      # 拡張子偽装
└── special/
    ├── japanese_名前.heic  # 日本語ファイル名
    ├── with spaces.heic    # スペース含む
    └── special!@#$.heic    # 特殊文字
```

#### 2. テスト用アカウント準備
```javascript
// テストユーザー
const testUsers = [
  {
    email: 'test-admin@test.com',
    password: 'Test123!',
    role: 'admin',
    name: 'テスト管理者'
  },
  {
    email: 'test-student1@test.com',
    password: 'Test123!',
    role: 'student',
    name: 'テスト生徒1'
  },
  {
    email: 'test-student2@test.com',
    password: 'Test123!',
    role: 'student',
    name: 'テスト生徒2'
  }
];
```

### エミュレータ設定

#### firebase.json設定
```json
{
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "auth": {
      "port": 9099
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### エミュレータ起動
```bash
# エミュレータ起動
firebase emulators:start --import=./emulator-data --export-on-exit

# デバッグモードで起動
firebase emulators:start --inspect-functions
```

---

## 単体テスト

### テストスイート構成
```typescript
// functions/test/unit/conversion.test.ts
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as admin from 'firebase-admin';
import { convertHeicToJpeg } from '../src/index';

describe('HEIC Conversion Unit Tests', () => {
  let sandbox: sinon.SinonSandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('File Validation', () => {
    it('should accept valid HEIC files', async () => {
      const validFile = {
        name: 'test.heic',
        contentType: 'image/heic',
        size: 1024 * 1024 // 1MB
      };
      
      const result = await validateFile(validFile);
      expect(result).to.be.true;
    });
    
    it('should reject non-HEIC files', async () => {
      const invalidFile = {
        name: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024 * 1024
      };
      
      expect(() => validateFile(invalidFile)).to.throw('Invalid file type');
    });
    
    it('should reject oversized files', async () => {
      const largeFile = {
        name: 'test.heic',
        contentType: 'image/heic',
        size: 100 * 1024 * 1024 // 100MB
      };
      
      expect(() => validateFile(largeFile)).to.throw('File size exceeds limit');
    });
  });
  
  describe('Conversion Process', () => {
    it('should convert HEIC to JPEG successfully', async () => {
      const mockSharp = {
        jpeg: sinon.stub().returnsThis(),
        toFile: sinon.stub().resolves()
      };
      
      sandbox.stub(sharp, 'default').returns(mockSharp);
      
      const result = await convertImage('input.heic', 'output.jpg');
      
      expect(mockSharp.jpeg.calledOnce).to.be.true;
      expect(mockSharp.jpeg.calledWith({
        quality: 90,
        progressive: true,
        mozjpeg: true
      })).to.be.true;
    });
    
    it('should handle conversion errors gracefully', async () => {
      sandbox.stub(sharp, 'default').throws(new Error('Conversion failed'));
      
      try {
        await convertImage('input.heic', 'output.jpg');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Conversion failed');
      }
    });
  });
  
  describe('Storage Operations', () => {
    it('should upload converted file to correct path', async () => {
      const mockBucket = {
        upload: sinon.stub().resolves()
      };
      
      sandbox.stub(admin.storage(), 'bucket').returns(mockBucket);
      
      await uploadToStorage('local/path.jpg', 'storage/path.jpg');
      
      expect(mockBucket.upload.calledWith('local/path.jpg', {
        destination: 'storage/path.jpg',
        metadata: {
          contentType: 'image/jpeg'
        }
      })).to.be.true;
    });
  });
  
  describe('Firestore Updates', () => {
    it('should update file document with JPEG URL', async () => {
      const mockDoc = {
        update: sinon.stub().resolves()
      };
      
      sandbox.stub(admin.firestore().collection('files'), 'doc').returns(mockDoc);
      
      await updateFileDocument('fileId123', 'https://example.com/file.jpg');
      
      expect(mockDoc.update.calledWith({
        jpegUrl: 'https://example.com/file.jpg',
        hasJpegVersion: true,
        convertedAt: sinon.match.any
      })).to.be.true;
    });
  });
});
```

### カバレッジ目標
```bash
# カバレッジ実行
cd functions
npm run test:coverage

# 目標カバレッジ
# - Statements: 90%以上
# - Branches: 85%以上
# - Functions: 95%以上
# - Lines: 90%以上
```

---

## 結合テスト

### テストシナリオ

#### シナリオ1: 正常系フロー
```typescript
// functions/test/integration/normal-flow.test.ts
describe('Normal Flow Integration Test', () => {
  it('should complete full conversion flow', async () => {
    // 1. HEICファイルアップロード
    const file = await uploadTestFile('sample_5mb.heic');
    
    // 2. Function起動確認
    await waitForFunctionExecution();
    
    // 3. JPEG生成確認
    const jpegExists = await checkFileExists(`${file.path}_converted.jpg`);
    expect(jpegExists).to.be.true;
    
    // 4. Firestore更新確認
    const doc = await admin.firestore()
      .collection('files')
      .doc(file.id)
      .get();
    
    expect(doc.data().hasJpegVersion).to.be.true;
    expect(doc.data().jpegUrl).to.match(/^https:\/\//);
    
    // 5. 元ファイル保持確認
    const originalExists = await checkFileExists(file.path);
    expect(originalExists).to.be.true;
  });
});
```

#### シナリオ2: 同時アップロード
```typescript
describe('Concurrent Upload Test', () => {
  it('should handle multiple uploads', async () => {
    const files = [
      'sample_1mb.heic',
      'sample_2mb.heic',
      'sample_3mb.heic'
    ];
    
    // 同時アップロード
    const uploads = files.map(f => uploadTestFile(f));
    const results = await Promise.all(uploads);
    
    // 全ファイル変換確認
    for (const result of results) {
      const converted = await checkConversion(result.id);
      expect(converted).to.be.true;
    }
  });
});
```

#### シナリオ3: エラーリカバリー
```typescript
describe('Error Recovery Test', () => {
  it('should recover from temporary failures', async () => {
    // 1. ネットワークエラーシミュレート
    await simulateNetworkError();
    
    // 2. ファイルアップロード
    const file = await uploadTestFile('sample_5mb.heic');
    
    // 3. 初回失敗確認
    await wait(5000);
    let doc = await getFileDoc(file.id);
    expect(doc.conversionError).to.be.true;
    
    // 4. ネットワーク復旧
    await restoreNetwork();
    
    // 5. リトライ実行
    await triggerRetry(file.id);
    
    // 6. 成功確認
    await wait(10000);
    doc = await getFileDoc(file.id);
    expect(doc.hasJpegVersion).to.be.true;
  });
});
```

---

## E2Eテスト

### Cypressテストシナリオ

#### セットアップ
```javascript
// cypress/e2e/heic-conversion.cy.js
describe('HEIC Conversion E2E Tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });
  
  it('should convert HEIC and display JPEG', () => {
    // 1. 生徒選択
    cy.get('[data-cy=student-select]').select('テスト生徒1');
    
    // 2. ファイルセクション開く
    cy.get('[data-cy=files-section]').click();
    
    // 3. アップロードボタンクリック
    cy.get('[data-cy=upload-button]').click();
    
    // 4. HEICファイル選択
    cy.get('input[type=file]').selectFile('test-files/sample.heic');
    
    // 5. アップロード実行
    cy.get('[data-cy=confirm-upload]').click();
    
    // 6. 処理待機（最大30秒）
    cy.get('[data-cy=conversion-status]', { timeout: 30000 })
      .should('contain', '変換完了');
    
    // 7. プレビュー確認
    cy.get('[data-cy=file-preview]').should('be.visible');
    cy.get('[data-cy=file-preview] img').should('have.attr', 'src')
      .and('include', '.jpg');
    
    // 8. 別ブラウザでも確認（Chrome/Firefox/Edge）
    cy.task('testInOtherBrowsers', {
      url: cy.url(),
      selector: '[data-cy=file-preview]'
    });
  });
  
  it('should show conversion progress', () => {
    cy.uploadFile('large-file.heic');
    
    // 進捗表示確認
    cy.get('[data-cy=conversion-indicator]').should('be.visible');
    cy.get('[data-cy=conversion-indicator]').should('contain', '変換中');
    
    // アニメーション確認
    cy.get('[data-cy=conversion-spinner]').should('have.class', 'animate-spin');
  });
  
  it('should handle conversion errors gracefully', () => {
    cy.uploadFile('corrupted.heic');
    
    // エラー表示確認
    cy.get('[data-cy=conversion-error]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', '変換に失敗しました');
    
    // リトライボタン確認
    cy.get('[data-cy=retry-conversion]').should('be.visible');
    
    // リトライ実行
    cy.get('[data-cy=retry-conversion]').click();
    cy.get('[data-cy=conversion-indicator]').should('be.visible');
  });
});
```

### Playwrightテストシナリオ
```typescript
// tests/heic-conversion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('HEIC Conversion Cross-Browser Tests', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work in ${browserName}`, async ({ page }) => {
      await page.goto('/dashboard');
      await page.fill('[data-cy=email]', 'admin@test.com');
      await page.fill('[data-cy=password]', 'admin123');
      await page.click('[data-cy=login]');
      
      // ファイルアップロード
      const fileInput = await page.$('input[type=file]');
      await fileInput?.setInputFiles('test-files/sample.heic');
      
      // 変換完了待機
      await page.waitForSelector('[data-cy=jpeg-preview]', {
        timeout: 30000
      });
      
      // スクリーンショット取得
      await page.screenshot({
        path: `screenshots/heic-conversion-${browserName}.png`
      });
      
      // 画像表示確認
      const img = await page.$('[data-cy=jpeg-preview] img');
      const src = await img?.getAttribute('src');
      expect(src).toContain('.jpg');
    });
  });
});
```

---

## 負荷テスト

### Artillery設定
```yaml
# load-test.yml
config:
  target: 'https://asia-northeast2-mms-student-meeting.cloudfunctions.net'
  phases:
    - duration: 60
      arrivalRate: 1
      name: "Warm up"
    - duration: 120
      arrivalRate: 5
      name: "Ramp up"
    - duration: 300
      arrivalRate: 10
      name: "Sustained load"
  processor: './load-test-processor.js'

scenarios:
  - name: "HEIC Upload and Conversion"
    flow:
      - post:
          url: "/uploadFile"
          beforeRequest: "generateHEICFile"
          capture:
            - json: "$.fileId"
              as: "fileId"
      - think: 5
      - get:
          url: "/checkConversion/{{ fileId }}"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: "status"
      - loop:
        - get:
            url: "/getFile/{{ fileId }}"
        count: 3
        think: 2
```

### JMeter設定
```xml
<!-- jmeter-test-plan.jmx -->
<ThreadGroup>
  <stringProp name="ThreadGroup.num_threads">50</stringProp>
  <stringProp name="ThreadGroup.ramp_time">60</stringProp>
  <stringProp name="ThreadGroup.duration">300</stringProp>
  
  <HTTPSamplerProxy>
    <stringProp name="HTTPSampler.domain">asia-northeast2-mms-student-meeting.cloudfunctions.net</stringProp>
    <stringProp name="HTTPSampler.path">/convertHeicToJpeg</stringProp>
    <stringProp name="HTTPSampler.method">POST</stringProp>
    
    <HTTPFileArg>
      <stringProp name="File.path">test-files/sample_5mb.heic</stringProp>
      <stringProp name="File.paramname">file</stringProp>
      <stringProp name="File.mimetype">image/heic</stringProp>
    </HTTPFileArg>
  </HTTPSamplerProxy>
  
  <ResponseAssertion>
    <collectionProp name="Asserion.test_strings">
      <stringProp>success</stringProp>
    </collectionProp>
  </ResponseAssertion>
  
  <ConstantTimer>
    <stringProp name="ConstantTimer.delay">1000</stringProp>
  </ConstantTimer>
</ThreadGroup>
```

### 負荷テスト成功基準
```javascript
// load-test-criteria.js
const criteria = {
  responseTime: {
    p50: 2000,   // 50パーセンタイル: 2秒以内
    p95: 5000,   // 95パーセンタイル: 5秒以内
    p99: 10000   // 99パーセンタイル: 10秒以内
  },
  errorRate: {
    threshold: 0.01  // エラー率: 1%以下
  },
  throughput: {
    minimum: 100  // スループット: 100req/min以上
  }
};
```

---

## セキュリティテスト

### OWASP ZAPスキャン
```bash
# ZAPスキャン実行
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://asia-northeast2-mms-student-meeting.cloudfunctions.net \
  -r security-report.html
```

### ペネトレーションテスト
```python
# security-test.py
import requests
import base64

class SecurityTests:
    def test_path_traversal(self):
        """パストラバーサル攻撃テスト"""
        malicious_paths = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
        ]
        
        for path in malicious_paths:
            response = self.upload_file(f"{path}.heic")
            assert response.status_code == 400
            assert 'Invalid file path' in response.text
    
    def test_file_size_bomb(self):
        """ファイルサイズ爆弾テスト"""
        # 1GBの偽HEICファイル作成
        giant_file = self.create_fake_heic(size_gb=1)
        response = self.upload_file(giant_file)
        assert response.status_code == 413
        assert 'File too large' in response.text
    
    def test_mime_type_confusion(self):
        """MIMEタイプ偽装テスト"""
        # JPEGファイルに.heic拡張子
        fake_heic = self.create_fake_file('image/jpeg', '.heic')
        response = self.upload_file(fake_heic)
        assert response.status_code == 400
        assert 'Invalid HEIC file' in response.text
    
    def test_dos_attack(self):
        """DoS攻撃耐性テスト"""
        import concurrent.futures
        
        def upload_concurrently():
            return self.upload_file('test.heic')
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
            futures = [executor.submit(upload_concurrently) for _ in range(100)]
            results = [f.result() for f in futures]
        
        # レート制限確認
        blocked_count = sum(1 for r in results if r.status_code == 429)
        assert blocked_count > 0, "Rate limiting not working"
```

### SQLインジェクションテスト
```javascript
// sql-injection-test.js
const maliciousInputs = [
  "'; DROP TABLE files; --",
  "1' OR '1'='1",
  "admin'--",
  "1' UNION SELECT * FROM users--"
];

for (const input of maliciousInputs) {
  const result = await uploadWithMetadata({
    fileName: input,
    studentId: input
  });
  
  expect(result.status).toBe(400);
  expect(result.error).toContain('Invalid input');
}
```

---

## 回帰テスト

### テストスイート
```javascript
// regression-test-suite.js
const regressionTests = [
  {
    name: "既存JPEGアップロード正常動作",
    test: async () => {
      const result = await uploadFile('normal.jpg');
      expect(result.status).toBe('success');
      expect(result.converted).toBe(false);
    }
  },
  {
    name: "PDF変換は実行されない",
    test: async () => {
      const result = await uploadFile('document.pdf');
      expect(result.status).toBe('success');
      expect(result.converted).toBe(false);
    }
  },
  {
    name: "既存の面談記録機能は影響なし",
    test: async () => {
      const interview = await createInterview({
        studentId: 'test123',
        date: new Date(),
        notes: 'テスト面談'
      });
      expect(interview.id).toBeDefined();
    }
  },
  {
    name: "ユーザー認証は正常動作",
    test: async () => {
      const auth = await signIn('admin@test.com', 'admin123');
      expect(auth.user).toBeDefined();
    }
  }
];

// 実行
for (const test of regressionTests) {
  console.log(`Running: ${test.name}`);
  await test.test();
  console.log(`✅ Passed`);
}
```

### スナップショットテスト
```javascript
// snapshot-test.js
describe('UI Snapshot Tests', () => {
  it('should match file list snapshot', async () => {
    const component = render(<FileList />);
    expect(component).toMatchSnapshot();
  });
  
  it('should match conversion indicator snapshot', async () => {
    const component = render(<ConversionIndicator status="processing" />);
    expect(component).toMatchSnapshot();
  });
});
```

---

## 受け入れテスト

### ユーザーストーリー検証

#### ストーリー1: 管理者のHEICアップロード
```gherkin
Feature: HEIC画像のアップロードと自動変換
  管理者として
  生徒のiPhoneで撮影したHEIC画像をアップロードしたとき
  全てのブラウザで表示できるように自動的にJPEGに変換してほしい

  Scenario: 正常なHEICファイルのアップロード
    Given 管理者としてログインしている
    And 生徒「山田太郎」のページを開いている
    When HEICファイル「homework.heic」をアップロードする
    Then アップロードが成功する
    And 30秒以内に「変換完了」と表示される
    And 画像プレビューが表示される
    And Chrome、Firefox、Edgeで画像が表示できる

  Scenario: 大きなHEICファイルのアップロード
    Given 管理者としてログインしている
    When 30MBのHEICファイルをアップロードする
    Then アップロードが成功する
    And 60秒以内に変換が完了する
    And ファイルサイズが50%以上削減されている
```

#### ストーリー2: 生徒の閲覧
```gherkin
Feature: 変換済み画像の閲覧
  生徒として
  自分のファイル一覧を見たとき
  アップロードされたHEIC画像をJPEGとして閲覧できる

  Scenario: 変換済み画像の表示
    Given 生徒としてログインしている
    And 自分のファイルにHEIC画像がアップロードされている
    When ファイル一覧を開く
    Then JPEG形式で画像が表示される
    And ダウンロードボタンが機能する
```

### UAT チェックリスト
```markdown
## User Acceptance Test Checklist

### 基本機能
- [ ] HEICファイルをアップロードできる
- [ ] 変換処理が自動的に開始される
- [ ] 変換中の状態が表示される
- [ ] 変換完了後、画像が表示される
- [ ] 元のHEICファイルも保持される

### ブラウザ互換性
- [ ] Chrome で画像表示可能
- [ ] Firefox で画像表示可能
- [ ] Edge で画像表示可能
- [ ] Safari で画像表示可能
- [ ] モバイルChrome で表示可能
- [ ] モバイルSafari で表示可能

### パフォーマンス
- [ ] 5MB以下: 10秒以内に変換完了
- [ ] 10MB以下: 30秒以内に変換完了
- [ ] 30MB以下: 60秒以内に変換完了

### エラーハンドリング
- [ ] 破損ファイル: エラーメッセージ表示
- [ ] 非HEICファイル: 警告表示
- [ ] ネットワークエラー: リトライ可能
- [ ] タイムアウト: 適切なメッセージ

### ユーザビリティ
- [ ] 直感的な操作
- [ ] わかりやすい進捗表示
- [ ] エラー時の対処法明示
- [ ] ヘルプ文書の提供
```

### ユーザーフィードバック収集
```javascript
// feedback-collection.js
const feedbackQuestions = [
  {
    question: "HEIC変換機能の使いやすさを評価してください",
    type: "rating",
    scale: 5
  },
  {
    question: "変換速度は満足できるものでしたか？",
    type: "rating",
    scale: 5
  },
  {
    question: "画質は期待通りでしたか？",
    type: "rating",
    scale: 5
  },
  {
    question: "改善してほしい点があれば教えてください",
    type: "text"
  }
];

// フィードバック分析
function analyzeFeedback(responses) {
  const avgRating = responses
    .filter(r => r.type === 'rating')
    .reduce((sum, r) => sum + r.value, 0) / responses.length;
  
  const issues = responses
    .filter(r => r.type === 'text' && r.value)
    .map(r => r.value);
  
  return {
    satisfactionScore: avgRating,
    commonIssues: extractCommonThemes(issues),
    recommendedImprovements: generateImprovements(issues)
  };
}
```

---

## テスト結果レポートテンプレート

```markdown
# HEIC変換機能テスト結果レポート

## テスト概要
- **テスト期間**: 2025-09-06 〜 2025-09-07
- **テスト環境**: Development / Staging / Production
- **テスト実施者**: [名前]
- **テストバージョン**: v1.0.0

## テスト結果サマリー
| テスト種別 | 総数 | 成功 | 失敗 | スキップ | 成功率 |
|-----------|------|------|------|----------|--------|
| 単体テスト | 45 | 43 | 2 | 0 | 95.6% |
| 結合テスト | 12 | 11 | 1 | 0 | 91.7% |
| E2Eテスト | 8 | 8 | 0 | 0 | 100% |
| 負荷テスト | 5 | 4 | 1 | 0 | 80% |
| セキュリティ | 10 | 10 | 0 | 0 | 100% |

## 不具合一覧
| ID | 重要度 | 概要 | ステータス |
|----|--------|------|------------|
| BUG-001 | High | 50MB超のファイルでメモリエラー | 修正済み |
| BUG-002 | Low | 特殊文字ファイル名の表示崩れ | 対応中 |

## パフォーマンステスト結果
- **平均変換時間**: 3.2秒（5MBファイル）
- **最大同時処理数**: 50件
- **エラー率**: 0.8%
- **CPU使用率**: 平均45%、最大78%
- **メモリ使用量**: 平均320MB、最大480MB

## 推奨事項
1. メモリ設定を512MB→1GBに増加
2. エラーメッセージの日本語化
3. 変換進捗のリアルタイム表示

## 承認
- **テストリード**: ___________
- **プロジェクトマネージャー**: ___________
- **承認日**: 2025-09-__
```

---

*最終更新: 2025-09-06 00:43*  
*作成者: Claude Code Assistant*