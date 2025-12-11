import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Uses environment variables if available, falls back to default project config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDb-SgqKpoHFBjnFMcfcCIwEAOIvxFzquo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "foodieapp-df66c.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "foodieapp-df66c",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "foodieapp-df66c.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "980920121166",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:980920121166:web:a93177b3f65abe636c101f",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-CH9T095N4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
