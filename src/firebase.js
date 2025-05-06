
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCFS06F0cK3kFxToa8P1R8T3epS8qTCHXI",
    authDomain: "roster-app-version-2.firebaseapp.com",
    projectId: "roster-app-version-2",
    storageBucket: "roster-app-version-2.firebasestorage.app",
    messagingSenderId: "248744965008",
    appId: "1:248744965008:web:0580972830908a28ddf915",
    measurementId: "G-HSH28ZM753"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app)