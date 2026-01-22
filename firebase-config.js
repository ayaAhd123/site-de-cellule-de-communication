// firebase-config.js - Version avec Storage
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQkZnz1CLEjB283onYPFIMzPq3gxIMXr8",
    authDomain: "bdd-cellule.firebaseapp.com",
    databaseURL: "https://bdd-cellule-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bdd-cellule",
    storageBucket: "bdd-cellule.firebasestorage.app",
    messagingSenderId: "589101184376",
    appId: "1:589101184376:web:d208ac40c07fc6e7a5c48d",
    measurementId: "G-ZEN6KF9SZG"
};

// Initialiser Firebase UNE SEULE FOIS
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const storage = getStorage(firebaseApp);

console.log('✅ Firebase initialisé avec succès (Database + Storage)');

// Exporter l'application, la base de données ET le storage
export { firebaseApp, database, storage };