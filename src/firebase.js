import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your app's specific Firebase project configuration
// For MVP, user should replace these placeholders.
const firebaseConfig = {
    apiKey: "AIzaSyDz3vsbqrhPE4lBtcn2uYxkhPL5HkY7L5g",
    authDomain: "portfolio-migration-sim-12345.firebaseapp.com",
    projectId: "portfolio-migration-sim-12345",
    storageBucket: "portfolio-migration-sim-12345.firebasestorage.app",
    messagingSenderId: "17043064316",
    appId: "1:17043064316:web:743f01331a943f58f0de79",
    measurementId: "G-WJCM13NSQP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
