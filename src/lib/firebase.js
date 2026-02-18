// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
 authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
 appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
 measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebaseのインスタンスを作成
let app;
if (!getApps().length) {
 app = initializeApp(firebaseConfig);
} else {
 app = getApps()[0];
}

// Firestore のインスタンスを取得する
export const db = getFirestore(app);

export const auth = getAuth(app);
// Storage を初期化 - バケット名を明示的に指定しない
export const storage = getStorage(app, "gs://jsbb-kurume.firebasestorage.app");

// URL書き換え用のヘルパー関数を追加
export function fixStorageUrl(url) {
 if (!url) return '';
 return url.replace('jsbb-kurume.appspot.com', 'jsbb-kurume.firebasestorage.app');
}

// Firebase SDKのXHRリクエストを書き換えるモンキーパッチ
if (typeof window !== 'undefined') {
 // XMLHttpRequestのオーバーライド
 const originalOpen = XMLHttpRequest.prototype.open;
 XMLHttpRequest.prototype.open = function() {
   if (arguments[1] && typeof arguments[1] === 'string') {
     arguments[1] = arguments[1].replace('jsbb-kurume.appspot.com', 'jsbb-kurume.firebasestorage.app');
   }
   return originalOpen.apply(this, arguments);
 };
 
 // fetchのオーバーライド（モダンブラウザ対応）
 const originalFetch = window.fetch;
 window.fetch = function(url, options) {
   if (url && typeof url === 'string') {
     url = url.replace('jsbb-kurume.appspot.com', 'jsbb-kurume.firebasestorage.app');
   }
   return originalFetch.call(this, url, options);
 };
}