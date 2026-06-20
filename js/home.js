// ============================================
// OMNIBITES — Página Principal
// ============================================
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- Demo waveform animado ----
const canvas = document.getElementById('demoWave');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let frame = 0;
  function drawWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const t = x / canvas.width;
      const y = canvas.height / 2
        + Math.sin(t * 20 + frame * 0.05) * 15
        + Math.sin(t * 8 + frame * 0.03) * 10
        + Math.sin(t * 35 + frame * 0.08) * 5;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    frame++;
    requestAnimationFrame(drawWave);
  }
  drawWave();
}

// ---- Contadores animados ----
function animateCount(el, target, suffix = '') {
  let current = 0;
  const step = Math.ceil(target / 60);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString() + suffix;
    if (current >= target) clearInterval(interval);
  }, 30);
}

// Cargar stats reales de Firebase
async function loadStats() {
  try {
    const audiosSnap = await getDocs(collection(db, 'audios'));
    const usersSnap  = await getDocs(collection(db, 'usuarios'));

    const totalAudios = audiosSnap.size;
    const juegos = new Set(audiosSnap.docs.map(d => d.data().juego)).size;
    const totalUsuarios = usersSnap.size;

    animateCount(document.getElementById('stat-audios'), totalAudios || 128);
    animateCount(document.getElementById('stat-juegos'), juegos || 47);
    animateCount(document.getElementById('stat-usuarios'), totalUsuarios || 312);
  } catch {
    // Fallback con números demo si Firebase no está configurado aún
    animateCount(document.getElementById('stat-audios'), 128);
    animateCount(document.getElementById('stat-juegos'), 47);
    animateCount(document.getElementById('stat-usuarios'), 312);
  }
}

// ---- Audios destacados ----
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const q = query(collection(db, 'audios'), orderBy('likes', 'desc'), limit(4));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = demoCards();
      return;
    }

    grid.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      grid.innerHTML += audioCardHTML(doc.id, d);
    });
  } catch {
    grid.innerHTML = demoCards();
  }
}

function audioCardHTML(id, d) {
  const stars = '★'.repeat(Math.round(d.rating || 4)) + '☆'.repeat(5 - Math.round(d.rating || 4));
  return `
    <div class="audio-card" onclick="window.location.href='/pages/reproductor.html?id=${id}'">
      <div class="card-game">${d.consola || 'SNES'}</div>
      <div class="card-title">${d.titulo || 'Audio sin título'}</div>
      <div class="card-console">🎮 ${d.juego || 'Juego desconocido'}</div>
      <div class="card-wave">
        <canvas width="220" height="40" style="width:100%;height:40px;"></canvas>
      </div>
      <div class="card-footer">
        <div>
          <div class="card-stars">${stars}</div>
          <div class="card-duration">${d.duracion || '0:30'}</div>
        </div>
        <button class="card-play-btn" onclick="event.stopPropagation()">▶</button>
      </div>
    </div>
  `;
}

function demoCards() {
  const demos = [
    { consola: 'SNES', juego: 'Super Mario World', titulo: 'Overworld Theme', duracion: '1:24' },
    { consola: 'NES',  juego: 'The Legend of Zelda', titulo: 'Dungeon Music', duracion: '0:45' },
    { consola: 'PS1',  juego: 'Final Fantasy VII', titulo: 'One-Winged Angel', duracion: '2:10' },
    { consola: 'N64',  juego: 'Ocarina of Time', titulo: 'Gerudo Valley', duracion: '1:38' },
  ];
  return demos.map(d => audioCardHTML('demo', { ...d, rating: 4 })).join('');
}

// Iniciar
loadStats();
loadFeatured();
