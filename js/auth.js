// ============================================
// OMNIBITES — Autenticación + Avatar Navbar
// ============================================
import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  renderNavAuth(user);
  renderMobileAuth(user);
});

function renderNavAuth(user) {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  if (user) {
    const name    = user.displayName || user.email || 'Jugador';
    const initial = name.charAt(0).toUpperCase();
    const photo   = user.photoURL;

    navAuth.innerHTML = `
      <div class="nav-user-btn" id="userMenuBtn">
        ${photo
          ? `<img class="nav-avatar" src="${photo}" alt="${name}" referrerpolicy="no-referrer"/>`
          : `<div class="nav-avatar-fallback">${initial}</div>`
        }
        <span>${name.split(' ')[0]}</span>
        <span style="font-size:0.65rem;color:var(--text-dim)">▾</span>
        <div class="user-dropdown" id="userDropdown">
          <a href="/pages/perfil.html">👾 Mi perfil</a>
          <a href="/pages/subir.html">✂️ Crear Soundbite</a>
          <hr/>
          <button id="logoutBtn">🚪 Cerrar sesión</button>
        </div>
      </div>
    `;

    // Toggle dropdown
    document.getElementById('userMenuBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('open');
    });
    document.addEventListener('click', () => {
      document.getElementById('userDropdown')?.classList.remove('open');
    });

    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
      e.stopPropagation();
      await signOut(auth);
      window.location.href = '/index.html';
    });

  } else {
    navAuth.innerHTML = `
      <a href="/pages/login.html" class="nav-auth-guest">
        <span class="avatar-placeholder">👾</span>
        <span class="nav-auth-label">Iniciar sesión</span>
      </a>
      <a href="/pages/registro.html" class="btn-primary btn-sm-nav">Regístrate gratis</a>
    `;
  }
}

function renderMobileAuth(user) {
  const mobileAuth = document.getElementById('mobile-auth');
  if (!mobileAuth) return;

  if (user) {
    const name = user.displayName || user.email || 'Jugador';
    mobileAuth.innerHTML = `
      <span style="color:var(--neon);font-size:0.85rem;padding:0.4rem 0">👾 ${name}</span>
      <a href="/pages/perfil.html">Mi perfil</a>
      <button id="mobileLogout" style="background:none;border:none;color:var(--text-dim);font-size:0.9rem;text-align:left;padding:0.4rem 0;cursor:pointer;font-family:var(--font-body)">Cerrar sesión</button>
    `;
    document.getElementById('mobileLogout')?.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = '/index.html';
    });
  } else {
    mobileAuth.innerHTML = `
      <a href="/pages/login.html">Iniciar sesión</a>
      <a href="/pages/registro.html">Registrarse gratis</a>
    `;
  }
}

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
