// ============================================
// OMNIBITES — Configuración de Firebase
// ============================================
// INSTRUCCIONES (solo 5 minutos):
//
// 1. Ve a https://console.firebase.google.com
// 2. Clic en "Agregar proyecto" → ponle nombre "omnibites"
// 3. En el panel, ve a "Configuración del proyecto" (⚙️)
// 4. Baja hasta "Tus apps" → clic en </> (Web)
// 5. Copia los valores y pégalos abajo
// 6. En Firebase: activa Authentication → Email/Password y Google
// 7. En Firebase: activa Firestore Database (modo prueba)
// 8. En Firebase: activa Storage (modo prueba)
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔧 PEGA AQUÍ TUS DATOS DE FIREBASE:
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

// Inicializar
const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
