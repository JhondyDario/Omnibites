// ============================================
// OMNIBITES — Autenticación
// ============================================
import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Actualiza la navbar según si hay sesión o no
onAuthStateChanged(auth, (user) => {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  if (user) {
    navAuth.innerHTML = `
      <span style="font-size:0.8rem;color:var(--text-dim)">👾 ${user.displayName || user.email}</span>
      <button class="btn-outline" id="logoutBtn">Salir</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = '/index.html';
    });
  } else {
    navAuth.innerHTML = `
      <a href="/pages/login.html" class="btn-outline">Entrar</a>
      <a href="/pages/registro.html" class="btn-primary">Registrarse</a>
    `;
  }
});

// Utilidad: redirige si no hay sesión
export function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) resolve(user);
      else {
        window.location.href = '/pages/login.html';
        reject('No autenticado');
      }
    });
  });
}
