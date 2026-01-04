import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz8hsAFxB3-WoW8hBlsS9vuyIN30T7zvw",
  authDomain: "lently-saas.firebaseapp.com",
  projectId: "lently-saas",
  storageBucket: "lently-saas.firebasestorage.app",
  messagingSenderId: "606587699348",
  appId: "1:606587699348:web:3a6a31c7aa2e444b733481",
  measurementId: "G-G5MWKQ8LMD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const firestore = getFirestore(app);

export default app;
