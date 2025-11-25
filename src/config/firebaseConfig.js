// src/config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 👈 basic web-style auth

// ✅ Your real config from Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCgQMC8aEuJfoNqgG7Ewp6Y2bw43h_FpXg",
  authDomain: "todo-app-c29cf.firebaseapp.com",
  projectId: "todo-app-c29cf",
  storageBucket: "todo-app-c29cf.firebasestorage.app",
  messagingSenderId: "994996073038",
  appId: "1:994996073038:web:c1952cc8ab8f9656f2891f",
  measurementId: "G-LGJDQ0DPEN",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// ✅ Simple Auth init – this works in Expo
export const auth = getAuth(app);
