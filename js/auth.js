// ============================================
// OMNIBITES — Auth + Navbar
// ============================================
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ROOT = location.hostname === 'jhondydario.github.io' ? '/Omnibites' : '';
function goto(path) { window.location.href = ROOT + path; }

onAuthStateChanged(auth, async user => {
  // Cargar nombre y avatar desde Firestore si hay sesión
  let firestoreNombre = null;
  let firestoreAvatar = null;
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'usuarios', user.uid));
      if (snap.exists()) {
        firestoreNombre = snap.data().nombre || null;
        firestoreAvatar = snap.data().avatar || null;
      }
    } catch {}
  }
  renderNav(user, firestoreNombre, firestoreAvatar);
  renderMobile(user, firestoreNombre);
});

function renderNav(user, nombre, avatar) {
  const el = document.getElementById('nav-auth');
  if (!el) return;
  if (user) {
    const name    = nombre || user.displayName || user.email || 'Jugador';
    const initial = name.charAt(0).toUpperCase();
    // Avatar: prioridad al de Firestore (PNG), si no hay usa inicial
    const avatarHTML = avatar
      ? `<img class="nav-avatar" src="${ROOT}/assets/avatars/${avatar}.png" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"  /><div class="nav-avatar-fallback" style="display:none">${initial}</div>`
      : `<div class="nav-avatar-fallback">${initial}</div>`;

    el.innerHTML = `
      <div class="nav-user-btn" id="userMenuBtn">
        ${avatarHTML}
        <span class="nav-user-name">${name.split(' ')[0]}</span>
        <span class="nav-caret">▾</span>
        <div class="user-dropdown" id="userDropdown">
          <a href="${ROOT}/pages/perfil.html">Mi perfil</a>
          <hr/>
          <button id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>`;

    document.getElementById('userMenuBtn').addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('open');
    });
    document.addEventListener('click', () =>
      document.getElementById('userDropdown')?.classList.remove('open'));
    document.getElementById('logoutBtn').addEventListener('click', async e => {
      e.stopPropagation();
      await signOut(auth);
      goto('/index.html');
    });
  } else {
    el.innerHTML = `<a href="${ROOT}/pages/login.html" class="nav-login-btn">Entrar</a>`;
  }
}

function renderMobile(user, nombre) {
  const el = document.getElementById('mobile-auth');
  if (!el) return;
  if (user) {
    const name = nombre || user.displayName || user.email || 'Jugador';
    el.innerHTML = `
      <span class="mobile-username">${name}</span>
      <a href="${ROOT}/pages/perfil.html">Mi perfil</a>
      <button id="mobileLogout" class="mobile-logout-btn">Cerrar sesión</button>`;
    document.getElementById('mobileLogout')?.addEventListener('click', async () => {
      await signOut(auth);
      goto('/index.html');
    });
  } else {
    el.innerHTML = `<a href="${ROOT}/pages/login.html">Entrar</a>`;
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
