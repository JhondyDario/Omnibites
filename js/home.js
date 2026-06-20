// ============================================
// OMNIBITES — Página Principal
// ============================================
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── DEMO WAVEFORM ────────────────────────────
const canvas = document.getElementById('demoWave');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let frame = 0;
  function drawWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const t = x / canvas.width;
      const y = canvas.height / 2
        + Math.sin(t * 20 + frame * 0.05) * 14
        + Math.sin(t * 8  + frame * 0.03) * 8
        + Math.sin(t * 35 + frame * 0.08) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    frame++;
    requestAnimationFrame(drawWave);
  }
  drawWave();
}

// ── STATS ─────────────────────────────────────
function animateCount(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 50));
  const iv = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current >= 1000 ? (current/1000).toFixed(1)+'k' : current;
    if (current >= target) clearInterval(iv);
  }, 30);
}

async function loadStats() {
  try {
    const [audiosSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'audios')),
      getDocs(collection(db, 'usuarios'))
    ]);
    const juegos = new Set(audiosSnap.docs.map(d => d.data().juego)).size;
    animateCount(document.getElementById('stat-audios'),   audiosSnap.size || 0);
    animateCount(document.getElementById('stat-juegos'),   juegos || 0);
    animateCount(document.getElementById('stat-usuarios'), usersSnap.size || 0);
  } catch {
    ['stat-audios','stat-juegos','stat-usuarios'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0';
    });
  }
}

// ── FEATURED AUDIOS CON PLAYER REAL ──────────
let audioCtx = null;
let activeSource = null;
let activeGain   = null;
let activeIdx    = null;
let progressIv   = null;
const CLIP = 15, FADE = 2;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function stopAll() {
  if (activeSource) {
    try {
      activeGain.gain.cancelScheduledValues(audioCtx.currentTime);
      activeGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      activeSource.stop(audioCtx.currentTime + 0.3);
    } catch {}
    activeSource = activeGain = null;
  }
  clearInterval(progressIv);
  if (activeIdx !== null) resetCard(activeIdx);
  activeIdx = null;
}

function resetCard(i) {
  const btn  = document.getElementById(`fplay-${i}`);
  const prog = document.getElementById(`fprog-${i}`);
  if (btn)  { btn.textContent = '▶'; btn.style.background = 'var(--neon)'; btn.disabled = false; }
  if (prog) prog.style.width = '0%';
}

window.featuredPlay = async function(i, url) {
  if (activeIdx === i) { stopAll(); return; }
  stopAll();

  const btn = document.getElementById(`fplay-${i}`);
  if (!btn) return;
  btn.textContent = '⏳';
  btn.disabled = true;

  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());

    const startAt = buf.duration > 30
      ? Math.min(buf.duration * 0.15, buf.duration - CLIP - 2)
      : 0;

    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
    gain.gain.setValueAtTime(1, ctx.currentTime + CLIP - FADE);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + CLIP);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0, startAt, CLIP);
    source.onended = () => { if (activeIdx === i) stopAll(); };

    activeSource = source; activeGain = gain; activeIdx = i;
    btn.textContent = '⏸'; btn.style.background = 'var(--purple)'; btn.disabled = false;

    const t0 = ctx.currentTime;
    progressIv = setInterval(() => {
      const elapsed = Math.min(ctx.currentTime - t0, CLIP);
      const prog = document.getElementById(`fprog-${i}`);
      if (prog) prog.style.width = (elapsed / CLIP * 100) + '%';
      if (elapsed >= CLIP) clearInterval(progressIv);
    }, 100);

  } catch {
    const btn = document.getElementById(`fplay-${i}`);
    if (btn) { btn.textContent = '❌'; btn.style.background = 'var(--danger)'; btn.disabled = false; }
    setTimeout(() => resetCard(i), 3000);
  }
};

async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  let items = [];
  try {
    const q = query(collection(db, 'audios'), orderBy('likes','desc'), limit(3));
    const snap = await getDocs(q);
    items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {}

  if (items.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;grid-column:1/-1;padding:2rem 0">Aún no hay soundbites. ¡Sé el primero en subir uno!</p>';
    return;
  }

  grid.innerHTML = items.slice(0,3).map((a, i) => `
    <div class="audio-card">
      <div class="card-game">${a.consola || '—'}</div>
      <div class="card-title">${a.titulo || 'Sin título'}</div>
      <div class="card-console">🎮 ${a.juego || '—'} · por ${a.autorNombre || 'Anónimo'}</div>
      <div class="card-wave" style="background:var(--bg3);height:36px;border-radius:4px;overflow:hidden;margin-bottom:0.75rem;position:relative">
        <div id="fprog-${i}" style="position:absolute;top:0;left:0;height:100%;background:rgba(57,255,20,0.25);width:0%;transition:width 0.1s"></div>
      </div>
      <div class="card-footer">
        <div>
          <div class="card-stars">${'★'.repeat(Math.round(a.rating||0))}${'☆'.repeat(5-Math.round(a.rating||0))}</div>
          <div class="card-duration">${a.duracion || '0:15'}</div>
        </div>
        <button class="card-play-btn" id="fplay-${i}"
          onclick="featuredPlay(${i}, '${a.url}')">▶</button>
      </div>
    </div>
  `).join('');
}

// CSS para danger en card
document.head.insertAdjacentHTML('beforeend', '<style>.card-play-btn{transition:background 0.2s}</style>');

loadStats();
loadFeatured();
