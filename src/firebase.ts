import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyBrYaxwn436xax9LlYTR7O0BH8emSNiGfw",
  authDomain:        "veyra-885cc.firebaseapp.com",
  projectId:         "veyra-885cc",
  storageBucket:     "veyra-885cc.firebasestorage.app",
  messagingSenderId: "312041519962",
  appId:             "1:312041519962:web:477eaf9806d366df8bd163",
};

const app    = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
