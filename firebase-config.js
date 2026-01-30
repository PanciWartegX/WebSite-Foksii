// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaEkKJzyohsq6GK5GWygai0q3V0O_MkLY",
    authDomain: "web-foksi-9acb9.firebaseapp.com",
    projectId: "web-foksi-9acb9",
    storageBucket: "web-foksi-9acb9.firebasestorage.app",
    messagingSenderId: "811305636316",
    appId: "1:811305636316:web:d3c5b72980180dcc203f19",
    measurementId: "G-18FYWPGBJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export Firebase services
export { app, auth, db, analytics };

// Also make available globally for legacy scripts
window.firebaseApp = app;
window.auth = auth;
window.db = db;