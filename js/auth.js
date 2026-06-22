// ============================================
// OMNIBITES — Auth + Navbar
// ============================================
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ROOT = location.hostname === 'jhondydario.github.io' ? '/Omnibites' : '';
function goto(path) { window.location.href = ROOT + path; }

onAuthStateChanged(auth, async user => {
  let nombre = null;
  let avatar = null;

  if (user) {
    try {
      const ref  = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        nombre = snap.data().nombre || null;
        avatar = snap.data().avatar || null;
      } else {
        // Documento no existe (cuenta recreada o nuevo usuario de Google)
        // Crearlo automáticamente
        const newData = {
          nombre:        user.displayName || user.email?.split('@')[0] || 'Jugador',
          email:         user.email || '',
          avatar:        'avatar1',
          creadoEn:      serverTimestamp(),
          audiosSubidos: 0
        };
        await setDoc(ref, newData);
        nombre = newData.nombre;
        avatar = 'avatar1';
      }
    } catch (e) {
      console.warn('Firestore read error:', e.message);
    }
  }

  renderNav(user, nombre, avatar);
  renderMobile(user, nombre);
});

function renderNav(user, nombre, avatar) {
  const el = document.getElementById('nav-auth');
  if (!el) return;

  if (user) {
    const name    = nombre || user.displayName || user.email || 'Jugador';
    const initial = name.charAt(0).toUpperCase();
    const avatarHTML = avatar
      ? `<img class="nav-avatar" src="${ROOT}/assets/avatars/${avatar}.png" alt=""
            onerror="this.style.display='none';document.getElementById('nav-av-fb').style.display='flex'"/>
         <div class="nav-avatar-fallback" id="nav-av-fb" style="display:none">${initial}</div>`
      : `<div class="nav-avatar-fallback">${initial}</div>`;

    // Click en nombre/avatar → ir a perfil directamente (sin dropdown)
    el.innerHTML = `
      <a href="${ROOT}/pages/perfil.html" class="nav-user-btn" style="text-decoration:none">
        ${avatarHTML}
        <span class="nav-user-name">${name.split(' ')[0]}</span>
      </a>`;
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
