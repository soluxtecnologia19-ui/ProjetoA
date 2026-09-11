// =========================================
// CONFIGURAÇÃO DO FIREBASE
// =========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// Configuração do aplicativo Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDig6uJv6oArsKXmzdrnkTBOcXzmuxlbdE",
  authDomain: "projeto-a-bc547.firebaseapp.com",
  projectId: "projeto-a-bc547",
  storageBucket: "projeto-a-bc547.firebasestorage.app",
  messagingSenderId: "758747575581",
  appId: "1:758747575581:web:7293ddcc26283cf8f5ddf4"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);


// Firebase Authentication
const auth = getAuth(app);


// Cloud Firestore
const db = getFirestore(app);


// Exporta para os outros arquivos JavaScript
export {
    app,
    auth,
    db
};