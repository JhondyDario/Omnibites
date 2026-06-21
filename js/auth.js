// ============================================
// OMNIBITES — Auth + Navbar
// ============================================
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Detectar base path según ubicación
const isPages = location.pathname.includes('/Omnibites/pages/') || location.pathname.includes('/pages/');
const BASE = isPages ? '..' : '.';
// GitHub Pages base
const ROOT = location.hostname === 'jhondydario.github.io' ? '/Omnibites' : '';

function goto(path) { window.location.href = ROOT + path; }

onAuthStateChanged(auth, user => {
  renderNav(user);
  renderMobile(user);
});

function renderNav(user) {
  const el = document.getElementById('nav-auth');
  if (!el) return;
  if (user) {
    const name    = user.displayName || user.email || 'Jugador';
    const initial = name.charAt(0).toUpperCase();
    const photo   = user.photoURL;
    el.innerHTML = `
      <div class="nav-user-btn" id="userMenuBtn">
        ${photo
          ? `<img class="nav-avatar" src="${photo}" alt="${name}" referrerpolicy="no-referrer"/>`
          : `<div class="nav-avatar-fallback">${initial}</div>`}
        <span class="nav-user-name">${name.split(' ')[0]}</span>
        <span class="nav-caret">▾</span>
        <div class="user-dropdown" id="userDropdown">
          <a href="${ROOT}/pages/perfil.html">Mi perfil</a>
          <a href="${ROOT}/pages/ajustes.html">Ajustes</a>
          <a href="${ROOT}/pages/subir.html">Crear Soundbite</a>
          <hr/>
          <button id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>`;
    const menuBtn = document.getElementById('userMenuBtn');
    menuBtn.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('open');
    });
    document.addEventListener('click', () =>
      document.getElementById('userDropdown')?.classList.remove('open'));
    document.getElementById('logoutBtn').addEventListener('click', async e => {
      e.stopPropagation();
      await signOut(auth);
      goto('/index.html');          // ← siempre va al index raíz
    });
  } else {
    el.innerHTML = `<a href="${ROOT}/pages/login.html" class="nav-login-btn">Entrar</a>`;
  }
}

function renderMobile(user) {
  const el = document.getElementById('mobile-auth');
  if (!el) return;
  if (user) {
    const name = user.displayName || user.email || 'Jugador';
    el.innerHTML = `
      <span class="mobile-username">${name}</span>
      <a href="${ROOT}/pages/perfil.html">Mi perfil</a>
      <a href="${ROOT}/pages/ajustes.html">Ajustes</a>
      <button id="mobileLogout" class="mobile-logout-btn">Cerrar sesión</button>`;
    document.getElementById('mobileLogout')?.addEventListener('click', async () => {
      await signOut(auth);
      goto('/index.html');
    });
  } else {
    el.innerHTML = `
      <a href="${ROOT}/pages/login.html">Entrar</a>
      <a href="${ROOT}/pages/registro.html">¿No tienes cuenta? Regístrate</a>`;
  }
}

export function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) resolve(user);
      else { goto('/pages/login.html'); reject(); }
    });
  });
}
