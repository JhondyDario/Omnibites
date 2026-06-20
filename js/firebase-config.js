// ============================================
// OMNIBITES — Configuración de Firebase
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAA76gMzq2BWFBW5aI5tMkRi3MeO2t5OfQ",
  authDomain:        "omnibites-web.firebaseapp.com",
  projectId:         "omnibites-web",
  storageBucket:     "omnibites-web.firebasestorage.app",
  messagingSenderId: "100006502320",
  appId:             "1:100006502320:web:e9d52abc0b2200e3108075"
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
