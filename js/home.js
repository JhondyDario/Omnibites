// ============================================
// OMNIBITES — Página Principal
// ============================================
import { db, auth } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ROOT = location.hostname === 'jhondydario.github.io' ? '/Omnibites' : '';
let homeUser = null;
onAuthStateChanged(auth, u => { homeUser = u; });

// ── WAVEFORM ──
const canvas = document.getElementById('demoWave');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let frame = 0;

  // El color de la onda sigue al tema (--neon cambia claro/oscuro).
  // Se cachea y solo se recalcula cuando cambia data-theme, para no
  // pagar un getComputedStyle en cada frame de la animación.
  let waveColor = getComputedStyle(document.documentElement).getPropertyValue('--neon').trim() || '#4ade80';
  new MutationObserver(() => {
    waveColor = getComputedStyle(document.documentElement).getPropertyValue('--neon').trim() || '#4ade80';
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = waveColor; ctx.lineWidth = 2;
    ctx.shadowColor = waveColor; ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const t = x / canvas.width;
      const y = canvas.height / 2
        + Math.sin(t * 20 + frame * 0.05) * 13
        + Math.sin(t * 8  + frame * 0.03) * 8
        + Math.sin(t * 35 + frame * 0.08) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); frame++;
    requestAnimationFrame(draw);
  })();
}

// ── STATS ──
function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  if (target === 0) { el.textContent = '0'; return; }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 50));
  const iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur >= 1000 ? (cur/1000).toFixed(1)+'k' : cur;
    if (cur >= target) clearInterval(iv);
  }, 30);
}

async function loadStats() {
  ['stat-audios','stat-juegos','stat-usuarios'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '0';
  });
  try {
    const [aSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'audios')),
      getDocs(collection(db, 'usuarios'))
    ]);
    const juegos = new Set(aSnap.docs.map(d => d.data().juego).filter(Boolean)).size;
    animCount('stat-audios',   aSnap.size);
    animCount('stat-juegos',   juegos);
    animCount('stat-usuarios', uSnap.size);
  } catch(e) {
    console.error('Stats error:', e);
  }
}

loadStats();
