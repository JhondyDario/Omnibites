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
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2;
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 4;
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

// ── PLAYER ──
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
  btn.textContent = '...'; btn.disabled = true;
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
    btn.textContent = '||'; btn.style.background = 'var(--purple)'; btn.disabled = false;
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

// ── REACTIONS (home) ──
window.homeReact = async function(audioId, type) {
  if (!homeUser) { window.location.href = ROOT + '/pages/login.html'; return; }
  try {
    const userRef  = doc(db, 'usuarios', homeUser.uid);
    const snap     = await getDoc(userRef);
    const reacts   = snap.exists() ? (snap.data().reacciones || {}) : {};
    const prev     = reacts[audioId];
    const audioRef = doc(db, 'audios', audioId);
    if (prev) {
      await updateDoc(audioRef, { [`reactions.${prev}`]: increment(-1) });
      document.getElementById(`hr-${prev}-${audioId}`)?.classList.remove(`active-${prev}`);
      const cnt = document.querySelector(`#hr-${prev}-${audioId} .reaction-count`);
      if (cnt) cnt.textContent = Math.max(0, parseInt(cnt.textContent||0)-1);
    }
    if (prev !== type) {
      reacts[audioId] = type;
      await updateDoc(userRef, { reacciones: reacts });
      await updateDoc(audioRef, { [`reactions.${type}`]: increment(1) });
      document.getElementById(`hr-${type}-${audioId}`)?.classList.add(`active-${type}`);
      const cnt2 = document.querySelector(`#hr-${type}-${audioId} .reaction-count`);
      if (cnt2) cnt2.textContent = parseInt(cnt2.textContent||0)+1;
    } else {
      delete reacts[audioId];
      await updateDoc(userRef, { reacciones: reacts });
    }
  } catch(e) { console.error('homeReact:', e); }
};

// ── FAVORITES (home) ──
window.homeFav = async function(audioId) {
  if (!homeUser) { window.location.href = ROOT + '/pages/login.html'; return; }
  const btn = document.getElementById(`hfav-${audioId}`);
  const isActive = btn?.classList.contains('active');
  try {
    const ref = doc(db, 'usuarios', homeUser.uid);
    if (isActive) {
      await updateDoc(ref, { favoritos: arrayRemove(audioId) });
      btn.textContent = '☆'; btn.classList.remove('active');
    } else {
      await updateDoc(ref, { favoritos: arrayUnion(audioId) });
      btn.textContent = '★'; btn.classList.add('active');
    }
  } catch(e) { console.error('homeFav:', e); }
};

// ── DOWNLOAD (home) ──
window.homeDl = async function(url, titulo) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    const dur = Math.min(15, buf.duration);
    const offCtx = new OfflineAudioContext(1, Math.floor(dur*44100), 44100);
    const src = offCtx.createBufferSource(); src.buffer = buf;
    const gain = offCtx.createGain();
    gain.gain.setValueAtTime(0,0); gain.gain.linearRampToValueAtTime(1,2);
    gain.gain.setValueAtTime(1,dur-2); gain.gain.linearRampToValueAtTime(0,dur);
    src.connect(gain); gain.connect(offCtx.destination); src.start(0,0,dur);
    const rendered = await offCtx.startRendering();
    const samples = rendered.getChannelData(0);
    const int16 = new Int16Array(samples.length);
    for(let i=0;i<samples.length;i++) int16[i]=Math.max(-32768,Math.min(32767,samples[i]*32767));
    const enc = new lamejs.Mp3Encoder(1,44100,128);
    const mp3=[]; const bs=1152;
    for(let i=0;i<int16.length;i+=bs){const d=enc.encodeBuffer(int16.subarray(i,i+bs));if(d.length>0)mp3.push(new Uint8Array(d));}
    const end=enc.flush(); if(end.length>0)mp3.push(new Uint8Array(end));
    const blob=new Blob(mp3,{type:'audio/mpeg'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`${titulo.slice(0,50)} [Omnibites].mp3`.replace(/[<>:"/\\|?*]/g,'');
    a.click(); URL.revokeObjectURL(a.href);
  } catch(e) { console.error('homeDl:', e); }
};

// ── ÚLTIMOS SOUNDBITES ──
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
      const r = a.reactions || { love:0, mid:0, bad:0 };
      return `
        <div class="sb-card" id="hcard-${d.id}">
          <div class="sb-title">${a.titulo||'Sin título'} <span class="sb-dot">·</span> <span class="sb-tag-inline">${a.consola||'—'} · ${a.categoria||'soundbite'}</span></div>
          <div class="sb-meta">${a.juego||'—'} · <span class="sb-author">${a.autorNombre||'Anónimo'}</span></div>
          <div class="sb-player">
            <button class="sb-play" id="hp-${i}" onclick="homePlay(${i},'${a.url}')">▶</button>
            <div class="sb-prog-wrap">
              <div class="sb-prog-bar"><div class="sb-prog-fill" id="hprog-${i}"></div></div>
              <div class="sb-time"><span>preview 15s</span><span>${a.duracion||'0:15'}</span></div>
            </div>
          </div>
          <div class="sb-footer">
            <div class="sb-reactions">
              <button class="reaction-btn" onclick="homeReact('${d.id}','love')" id="hr-love-${d.id}" title="Me encanta">✨ <span class="reaction-count">${r.love||0}</span></button>
              <button class="reaction-btn" onclick="homeReact('${d.id}','mid')"  id="hr-mid-${d.id}"  title="Regular">😐 <span class="reaction-count">${r.mid||0}</span></button>
              <button class="reaction-btn" onclick="homeReact('${d.id}','bad')"  id="hr-bad-${d.id}"  title="No sirve">👎 <span class="reaction-count">${r.bad||0}</span></button>
            </div>
            <div class="sb-actions">
              <button class="fav-btn" id="hfav-${d.id}" onclick="homeFav('${d.id}')" title="Favorito">☆</button>
              <button class="btn-sm btn-sm-download" onclick="homeDl('${a.url}','${(a.titulo||'soundbite').replace(/'/g,'')}')">↓</button>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    grid.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem;grid-column:1/-1">Error al cargar.</p>';
  }
}

loadStats();
loadLatest();
