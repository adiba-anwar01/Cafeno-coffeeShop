import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAxNt53C0t3ghd9llxK1h9KYjnr084iL-I",
  authDomain: "coffee-shop-e9d40.firebaseapp.com",
  projectId: "coffee-shop-e9d40",
  storageBucket: "coffee-shop-e9d40.appspot.com",
  messagingSenderId: "414881623578",
  appId: "1:414881623578:web:59b29583cd58c0d4182ba3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
