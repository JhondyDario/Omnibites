// ============================================
// OMNIBITES — Página Principal
// ============================================
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── WAVEFORM ──
const canvas = document.getElementById('demoWave');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let frame = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 2;
    ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 4;
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
  try {
    const [aSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'audios')),
      getDocs(collection(db, 'usuarios'))
    ]);
    const juegos = new Set(aSnap.docs.map(d => d.data().juego)).size;
    animCount('stat-audios',   aSnap.size);
    animCount('stat-juegos',   juegos);
    animCount('stat-usuarios', uSnap.size);
  } catch {
    ['stat-audios','stat-juegos','stat-usuarios'].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = '0';
    });
  }
}

// ── ÚLTIMOS SOUNDBITES ──
let audioCtx = null, activeSource = null, activeGain = null, activeIdx = null, progIv = null;
const CLIP = 15, FADE = 2;
function getCtx() { if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }

function stopAll() {
  if (activeSource) { try { activeGain.gain.cancelScheduledValues(audioCtx.currentTime); activeGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime+.3); activeSource.stop(audioCtx.currentTime+.3); } catch {} activeSource=activeGain=null; }
  clearInterval(progIv);
  if (activeIdx !== null) resetBtn(activeIdx);
  activeIdx = null;
}
function resetBtn(i) {
  const b = document.getElementById(`hp-${i}`);
  if (b) { b.textContent='▶'; b.style.background='var(--neon)'; b.disabled=false; }
}

window.homePlay = async function(i, url) {
  if (activeIdx === i) { stopAll(); return; }
  stopAll();
  const btn = document.getElementById(`hp-${i}`);
  if (!btn) return;
  btn.textContent = '⏳'; btn.disabled = true;
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    const start = buf.duration > 30 ? Math.min(buf.duration * 0.15, buf.duration - CLIP - 2) : 0;
    const source = ctx.createBufferSource(); source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
    gain.gain.setValueAtTime(1, ctx.currentTime + CLIP - FADE);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + CLIP);
    source.connect(gain); gain.connect(ctx.destination);
    source.start(0, start, CLIP);
    source.onended = () => { if (activeIdx === i) stopAll(); };
    activeSource = source; activeGain = gain; activeIdx = i;
    btn.textContent = '⏸'; btn.style.background = 'var(--purple)'; btn.disabled = false;
    const t0 = ctx.currentTime;
    progIv = setInterval(() => {
      const el = ctx.currentTime - t0;
      const p = document.getElementById(`hprog-${i}`);
      if (p) p.style.width = (Math.min(el, CLIP) / CLIP * 100) + '%';
      if (el >= CLIP) clearInterval(progIv);
    }, 100);
  } catch {
    btn.textContent = '❌'; btn.style.background = 'var(--danger)'; btn.disabled = false;
    setTimeout(() => resetBtn(i), 3000);
  }
};

async function loadLatest() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const q = query(collection(db, 'audios'), orderBy('creadoEn', 'desc'), limit(3));
    const snap = await getDocs(q);
    if (snap.empty) {
      grid.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem;grid-column:1/-1;padding:2rem 0">Aún no hay soundbites. ¡Sé el primero en subir uno!</p>';
      return;
    }
    grid.innerHTML = snap.docs.map((d, i) => {
      const a = d.data();
      return `
        <div class="sb-card">
          <div class="sb-tag">${a.consola||'—'} · ${a.categoria||'soundbite'}</div>
          <div class="sb-title">${a.titulo||'Sin título'}</div>
          <div class="sb-meta">subido por <span>${a.autorNombre||'Anónimo'}</span></div>
          <div class="sb-player">
            <button class="sb-play" id="hp-${i}" onclick="homePlay(${i},'${a.url}')">▶</button>
            <div class="sb-prog-wrap">
              <div class="sb-prog-bar"><div class="sb-prog-fill" id="hprog-${i}"></div></div>
              <div class="sb-time"><span>preview 15s</span><span>${a.duracion||'0:15'}</span></div>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem;grid-column:1/-1">Error al cargar. Recarga la página.</p>';
  }
}

loadStats();
loadLatest();
