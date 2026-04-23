import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBvs6ZiK4x5kWeoMx7JvehPN7Ph6TaUQzc",
  authDomain: "habia-una-vez-virtual.firebaseapp.com",
  projectId: "habia-una-vez-virtual",
  storageBucket: "habia-una-vez-virtual.firebasestorage.app",
  messagingSenderId: "991101699334",
  appId: "1:991101699334:web:b47f7c37d10442e8780a87",
  measurementId: "G-8TYMX6BYN7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
