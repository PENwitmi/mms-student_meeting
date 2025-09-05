/**
 * Firebase初期ユーザーセットアップスクリプト
 * 
 * 使用方法:
 * 1. Firebase ConsoleでAuthenticationにユーザーを作成
 *    - admin@test.com / admin123
 *    - student@test.com / student123
 * 2. このスクリプトを実行: node scripts/setupUsers.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.localを読み込み
config({ path: join(__dirname, '..', '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    profile: {
      role: 'admin',
      name: '管理者テスト',
      email: 'admin@test.com'
    }
  },
  {
    email: 'student@test.com',
    password: 'student123',
    profile: {
      role: 'student',
      name: '学生テスト',
      email: 'student@test.com',
      studentId: 'STU001',
      grade: 1,
      class: 'A'
    }
  }
];

async function setupUser(userData) {
  try {
    console.log(`\n🔧 ${userData.email} のセットアップ中...`);
    
    // ユーザーにログイン
    const userCredential = await signInWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const uid = userCredential.user.uid;
    console.log(`✅ ログイン成功: ${userData.email} (UID: ${uid})`);
    
    // Firestoreにプロフィールを作成
    await setDoc(doc(db, 'users', uid), {
      ...userData.profile,
      uid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ プロフィール作成成功: ${userData.profile.name} (ロール: ${userData.profile.role})`);
    
  } catch (error) {
    console.error(`❌ エラー (${userData.email}):`, error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log(`⚠️  ${userData.email} がFirebase Authenticationに存在しません。`);
      console.log(`   Firebase Consoleでユーザーを作成してください。`);
    }
  }
}

async function main() {
  console.log('===============================================');
  console.log('🚀 Firebase初期ユーザーセットアップ');
  console.log('===============================================');
  console.log(`プロジェクトID: ${firebaseConfig.projectId}`);
  
  for (const user of users) {
    await setupUser(user);
  }
  
  console.log('\n===============================================');
  console.log('✅ セットアップ完了');
  console.log('===============================================');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ セットアップ失敗:', error);
  process.exit(1);
});