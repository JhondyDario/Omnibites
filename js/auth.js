// ============================================
// OMNIBITES — Auth + Navbar user section
// ============================================
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ROOT = location.hostname === 'jhondydario.github.io' ? '/Omnibites' : '';
const BASE = location.pathname.includes('/pages/') ? '..' : '.';

function goto(path) { window.location.href = ROOT + path; }

onAuthStateChanged(auth, async user => {
  let nombre = null, avatar = null;

  if (user) {
    const isGoogle  = user.providerData.some(p => p.providerId === 'google.com');
    const onVerify  = location.pathname.includes('verificar.html');
    const onLogin   = location.pathname.includes('login.html');
    const onRegistro= location.pathname.includes('registro.html');

    // Email verification: show verificar.html only on first login
    // but don't block access - users can still use the app

    try {
      const ref  = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        nombre = snap.data().nombre || null;
        avatar = snap.data().avatar || null;
      } else {
        const n = user.displayName || user.email?.split('@')[0] || 'Player';
        await setDoc(ref, { nombre: n, email: user.email||'', avatar:'avatar1', creadoEn: serverTimestamp(), audiosSubidos:0 });
        nombre = n; avatar = 'avatar1';
      }
    } catch(e) { console.warn('auth.js Firestore:', e.message); }
  }
  renderNav(user, nombre, avatar);
  renderMobile(user, nombre);
});

function renderNav(user, nombre, avatar) {
  const el = document.getElementById('nav-auth');
  if (!el) return;
  const onPerfil = location.pathname.includes('/perfil.html');
  if (user && onPerfil) { el.innerHTML = ''; return; }
  if (user) {
    const name = nombre || user.email?.split('@')[0] || 'Player';
    const initial = name.charAt(0).toUpperCase();
    const avatarHTML = avatar
      ? `<img class="nav-avatar" src="${ROOT}/assets/avatars/${avatar}.png" alt=""
            onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
         <div class="nav-avatar-fallback" style="display:none">${initial}</div>`
      : `<div class="nav-avatar-fallback">${initial}</div>`;
    el.innerHTML = `
      <a href="${ROOT}/pages/perfil.html" class="nav-user-btn" style="text-decoration:none">
        ${avatarHTML}
        <span class="nav-user-name">${name.split(' ')[0]}</span>
      </a>`;
  } else {
    el.innerHTML = `<a href="${ROOT}/pages/login.html" class="nav-login-btn">Sign in</a>`;
  }
}

function renderMobile(user, nombre) {
  const el = document.getElementById('mobile-auth');
  if (!el) return;
  if (user) {
    const name = nombre || user.email?.split('@')[0] || 'Player';
    // Solo el nombre como link al perfil — sin botón de cerrar sesión (está en perfil.html)
    el.innerHTML = `<a href="${ROOT}/pages/perfil.html" class="mobile-perfil-link">${name}</a>`;
  } else {
    el.innerHTML = `<a href="${ROOT}/pages/login.html">Sign in</a>`;
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
