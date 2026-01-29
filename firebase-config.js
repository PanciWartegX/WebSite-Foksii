// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCd0sX2V0c5PJDyYIzHfKe3kDG5PF555Eo",
    authDomain: "web-foksi.firebaseapp.com",
    projectId: "web-foksi",
    storageBucket: "web-foksi.firebasestorage.app",
    messagingSenderId: "292184437429",
    appId: "1:292184437429:web:2883877cbc61993b9a44fc",
    measurementId: "G-49XD722EFY"
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