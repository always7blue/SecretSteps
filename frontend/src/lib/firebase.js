import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAf0-ui4bHWccgqFcDLcNQO3_-aMgj-2Q",
  authDomain: "secretsteps.firebaseapp.com",
  projectId: "secretsteps",
  storageBucket: "secretsteps.firebasestorage.app",
  messagingSenderId: "1063111530732",
  appId: "1:1063111530732:web:d63058abda4472759b6dc9",
  measurementId: "G-ZR55YXTSC9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
