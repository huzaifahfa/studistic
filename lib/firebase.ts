import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqIYKyEXA8bHin3bJCcimk64SQld2fAKI",
  authDomain: "hackathon-sp26.firebaseapp.com",
  projectId: "hackathon-sp26",
  storageBucket: "hackathon-sp26.firebasestorage.app",
  messagingSenderId: "480124049602",
  appId: "1:480124049602:web:567201c7d78354c157035b",
  measurementId: "G-LDEQMNFH7M"
};

// Prevent re-initialization in Next.js hot reload / SSR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Analytics only runs in the browser
if (typeof window !== "undefined") {
  isSupported().then((yes) => { if (yes) getAnalytics(app); });
}

export const db = getFirestore(app);
export default app;