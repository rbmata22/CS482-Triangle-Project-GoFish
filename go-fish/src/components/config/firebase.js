// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Import Firebase Auth and Google provider if needed
import { getFirestore } from "firebase/firestore"; // Optionally include Firestore if you use it

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB46N4Kl3URAID2WJPMLnFHpZAVSxXjaKk",
  authDomain: "go-fish-b5da8.firebaseapp.com",
  projectId: "go-fish-b5da8",
  storageBucket: "go-fish-b5da8.appspot.com",
  messagingSenderId: "778081614040",
  appId: "1:778081614040:web:84fe9bb7215ea008db3fad",
  measurementId: "G-DBGHQRETSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // For Google Sign-In
const db = getFirestore(app);

export { auth, provider, db, }; 
