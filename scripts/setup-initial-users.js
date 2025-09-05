/**
 * 初期ユーザー（管理者と生徒）を作成するスクリプト
 * 
 * 使用方法:
 * 1. Firebaseコンソールで手動でユーザーを作成
 * 2. このスクリプトでusersコレクションにrole情報を追加
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase設定（.env.localから手動で設定してください）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 管理者ユーザー作成
async function createAdminUser(uid, email, name) {
  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      name,
      role: 'admin',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
    console.log('✅ 管理者ユーザーを作成しました:', email);
  } catch (error) {
    console.error('❌ 管理者ユーザー作成エラー:', error);
  }
}

// 生徒ユーザー作成
async function createStudentUser(uid, email, name) {
  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      name,
      role: 'student',
      studentInfo: {},
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
    console.log('✅ 生徒ユーザーを作成しました:', email);
  } catch (error) {
    console.error('❌ 生徒ユーザー作成エラー:', error);
  }
}

// 実行
async function setup() {
  console.log('🚀 初期ユーザーセットアップを開始します...');
  
  // Firebase Consoleで作成したユーザーのUIDをここに入力
  // 例:
  // await createAdminUser('ADMIN_UID_HERE', 'admin@test.com', '管理者');
  // await createStudentUser('STUDENT_UID_HERE', 'student@test.com', 'テスト生徒');
  
  console.log('✨ セットアップ完了');
  process.exit(0);
}

// 使用方法を表示
console.log(`
========================================
初期ユーザーセットアップスクリプト
========================================

1. Firebase Consoleで以下のユーザーを作成:
   - admin@test.com (パスワード: 任意)
   - student@test.com (パスワード: 任意)

2. 作成したユーザーのUIDをコピー

3. このファイルの setup() 関数内のコメントを解除して
   UIDを入力

4. node scripts/setup-initial-users.js で実行

========================================
`);

// setup();