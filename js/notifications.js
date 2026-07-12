// ============================================
// OMNIBITES — Sistema de Notificaciones
// ============================================
import { db } from './firebase-config.js';
import {
  collection, addDoc, doc, updateDoc, getDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ROOT = location.hostname === 'jhondydario.github.io' ? '/Omnibites' : '';
let unsubscribeSnap = null;

function esc(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

// ── Crear notificación para OTRO usuario (nunca para uno mismo) ──
export async function crearNotificacion(paraUid, data) {
  try {
    if (!paraUid || !data.deUid || paraUid === data.deUid) return;
    await addDoc(collection(db, 'usuarios', paraUid, 'notificaciones'), {
      ...data, leido: false, creadoEn: serverTimestamp()
    });
  } catch (e) { console.warn('No se pudo crear la notificación:', e.message); }
}

export async function getMiPerfil(uid) {
  try {
    const snap = await getDoc(doc(db, 'usuarios', uid));
    if (snap.exists()) return { nombre: snap.data().nombre || 'Player' };
  } catch {}
  return { nombre: 'Player' };
}

// ── Notificaciones "virtuales" de trivia — se calculan, no se guardan ──
function hoyStr(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dismissKey(uid, key) { return `omnibites_notif_dismiss_${uid}_${key}`; }

async function checkTriviaAyer(uid) {
  const fecha = hoyStr(-1);
  const key = `ayer_${fecha}`;
  if (localStorage.getItem(dismissKey(uid, key))) return null;
  try {
    const snap = await getDoc(doc(db, 'triviaResultados', `${fecha}_${uid}`));
    if (!snap.exists()) return null;
    return { id: `v-${key}`, virtual: true, dismissKey: key, tipo: 'trivia-ayer',
      texto: `Yesterday you scored ${snap.data().puntos} pts on Daily Trivia` };
  } catch { return null; }
}

const SVG_BELL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const ICONS = {
  reaction: `<svg viewBox="0 0 24 24" fill="var(--danger)"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2 4.5 5.6 4.5c2 0 3.4 1 4.4 2.5 1-1.5 2.4-2.5 4.4-2.5 3.6 0 5.2 3.6 3.6 7.2C19.5 16.4 12 21 12 21z"/></svg>`,
  comment:  `<svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9 9 0 0 1-3.6-.7L3 21l1.8-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>`,
  favorite: `<svg viewBox="0 0 24 24" fill="var(--gold)"><path d="M12 17.3l-6.2 3.7 1.6-7-5.4-4.7 7.1-.6L12 2l2.9 6.7 7.1.6-5.4 4.7 1.6 7z"/></svg>`,
  follow:   `<svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M17 8h5M19.5 5.5v5"/></svg>`,
  'trivia-ayer':   `<svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
};

function fmtTime(ts) {
  if (!ts?.toDate) return '';
  const mins = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function textFor(n) {
  switch (n.tipo) {
    case 'reaction': return `<strong>${esc(n.deNombre)}</strong> reacted ${n.reactionType === 'love' ? 'love it' : 'meh'} to "${esc(n.audioTitulo)}"`;
    case 'comment':  return `<strong>${esc(n.deNombre)}</strong> commented on "${esc(n.audioTitulo)}"`;
    case 'favorite': return `<strong>${esc(n.deNombre)}</strong> favorited "${esc(n.audioTitulo)}"`;
    case 'follow':   return `<strong>${esc(n.deNombre)}</strong> started following you`;
    default: return esc(n.texto || '');
  }
}

export function teardownNotifications() {
  if (unsubscribeSnap) { unsubscribeSnap(); unsubscribeSnap = null; }
  document.getElementById('notifWrap')?.remove();
}

export async function initNotifications(user) {
  const anchor = document.getElementById('nav-auth');
  if (!anchor || document.getElementById('notifWrap')) return;

  let realNotifs = [], virtuales = [];

  const wrap = document.createElement('div');
  wrap.className = 'notif-wrap';
  wrap.id = 'notifWrap';
  wrap.innerHTML = `
    <button class="notif-bell" id="notifBellBtn" aria-label="Notifications">
      ${SVG_BELL}<span class="notif-badge" id="notifBadge" style="display:none">0</span>
    </button>
<div class="notif-panel" id="notifPanel" style="display:none">
      <div class="notif-panel-head">
        <span>Notifications</span>
        <button class="notif-mark-all" id="notifMarkAll">Mark all read</button>
      </div>
      <div class="notif-panel-list" id="notifList"><div class="notif-empty">Loading...</div></div>
    </div>`;
  anchor.parentNode.insertBefore(wrap, anchor);

  const btn = wrap.querySelector('#notifBellBtn');
  const panel = wrap.querySelector('#notifPanel');
  const badge = wrap.querySelector('#notifBadge');
  const list = wrap.querySelector('#notifList');

  function updateBadge() {
    const total = realNotifs.filter(n => !n.leido).length + virtuales.length;
    badge.style.display = total > 0 ? 'flex' : 'none';
    badge.textContent = total > 9 ? '9+' : String(total);
  }

  function render() {
    const combined = [...virtuales, ...realNotifs];
    if (!combined.length) { list.innerHTML = '<div class="notif-empty">No notifications yet.</div>'; return; }
    list.innerHTML = combined.map(n => `
      <div class="notif-item${n.leido === false ? ' unread' : ''}" data-id="${n.id}" data-virtual="${!!n.virtual}">
        <span class="notif-icon">${ICONS[n.tipo] || ''}</span>
        <div class="notif-body">
          <div class="notif-text">${textFor(n)}</div>
          <div class="notif-time">${n.virtual ? '' : fmtTime(n.creadoEn)}</div>
        </div>
      </div>`).join('');

    list.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.dataset.id;
        if (el.dataset.virtual === 'true') {
          const n = virtuales.find(v => v.id === id);
          if (n) { localStorage.setItem(dismissKey(user.uid, n.dismissKey), '1'); virtuales = virtuales.filter(v => v.id !== id); }
          updateBadge(); render();
          window.location.href = `${ROOT}/pages/trivia.html`;
          return;
        }
        const n = realNotifs.find(r => r.id === id);
        if (!n) return;
        if (!n.leido) updateDoc(doc(db, 'usuarios', user.uid, 'notificaciones', n.id), { leido: true }).catch(() => {});
        window.location.href = n.tipo === 'follow'
          ? `${ROOT}/pages/jugador.html?uid=${n.deUid}`
          : `${ROOT}/pages/soundbite.html?id=${n.audioId}`;
      });
    });
  }

btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });

  wrap.querySelector('#notifMarkAll').addEventListener('click', async e => {
    e.stopPropagation();
    const noLeidas = realNotifs.filter(n => !n.leido);
    if (!noLeidas.length) return;
    try {
      await Promise.all(noLeidas.map(n =>
        updateDoc(doc(db, 'usuarios', user.uid, 'notificaciones', n.id), { leido: true })
      ));
    } catch (e2) { console.warn('No se pudo marcar todo como leído:', e2.message); }
  });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) panel.style.display = 'none'; });

const q = query(collection(db, 'usuarios', user.uid, 'notificaciones'), orderBy('creadoEn', 'desc'), limit(25));
  unsubscribeSnap = onSnapshot(q, snap => {
    realNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateBadge(); render();
  }, () => {});

const ayer = await checkTriviaAyer(user.uid);
  virtuales = ayer ? [ayer] : [];
  updateBadge(); render();
}
