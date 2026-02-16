import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCs19P4TuVAu5-bln_-kWsWv2GltoJMcRY",
  authDomain: "finsense-9858d.firebaseapp.com",
  projectId: "finsense-9858d",
  storageBucket: "finsense-9858d.firebasestorage.app",
  messagingSenderId: "381630980678",
  appId: "1:381630980678:web:c6c615c5b64e166f962047",
  measurementId: "G-VP2KV995HM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THESE TWO EXPORTS ARE REQUIRED
export const auth = getAuth(app);
export const db = getFirestore(app);
