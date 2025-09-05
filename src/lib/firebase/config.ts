/**
 * Firebase設定ファイル
 * 環境変数から設定を読み込み、Firebase SDKを初期化
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase設定オブジェクト（環境変数から読み込み）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebaseアプリの初期化
export const app = initializeApp(firebaseConfig);

// Firebase Authenticationインスタンス
export const auth = getAuth(app);

// Cloud Firestoreインスタンス
export const db = getFirestore(app);

// 開発環境でのデバッグ用
if (import.meta.env.DEV) {
  console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);
}