// ============================================
// OMNIBITES — Trivia Engine
// Genera la trivia diaria (misma para todos, seed por fecha)
// y maneja el guardado/lectura en Firestore.
// ============================================
import { db } from './firebase-config.js';
import {
  doc, getDoc, runTransaction, setDoc, serverTimestamp,
  collection, query, where, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const RAWG_KEY = '3207549bccd14954b04fa8e64840ec00';

// ── Lista evergreen de franquicias. Edítala cada cierto tiempo,
// no pasa nada si repites algunas de una edición a otra. ──
const FRANCHISES = [
  'Mario','Zelda','Pokemon','Sonic the Hedgehog','Minecraft','Fortnite',
  'Call of Duty','Grand Theft Auto','Halo','God of War','The Last of Us',
  'Assassin\'s Creed','Metal Gear','Resident Evil','Final Fantasy',
  'Street Fighter','Mortal Kombat','Tekken','Pac-Man','Donkey Kong',
  'Kirby','Metroid','Mega Man','Castlevania','Chrono Trigger',
  'Crash Bandicoot','Spyro','Tomb Raider','Doom','Duke Nukem',
  'Star Fox','Contra','Double Dragon','Streets of Rage','Golden Axe',
  'EarthBound','Banjo-Kazooie','Diddy Kong Racing','F-Zero',
  'Kid Icarus','Punch-Out','Bomberman','Silent Hill', 'Overwatch','Valorant',
  'League of Legends','Dota 2','World of Warcraft','Diablo','StarCraft',
  'Elder Scrolls','Fallout','Destiny', 'Battlefield','Far Cry','Need for Speed',
  'Forza Horizon','Gran Turismo','Mass Effect','Dragon Age','Bioshock','Borderlands','Portal',
  'Half-Life','Counter-Strike','Dead Space','Monster Hunter','Persona',
  'Yakuza','Like a Dragon','Kingdom Hearts','Dark Souls','Elden Ring',
  'Bloodborne','Sekiro','Devil May Cry','Bayonetta','Ratchet & Clank',
  'Jak and Daxter','Sly Cooper','Animal Crossing','Splatoon','Fire Emblem',
  'Dragon Quest','King of Fighters','Guilty Gear','Apex Legends',
  'Rainbow Six','Warcraft','Gears of War','Left 4 Dead','Among Us',
];

// ── RNG determinístico con semilla (mulberry32) ──
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hoyStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function seedFromDate(fecha) {
  let h = 0;
  for (let i = 0; i < fecha.length; i++) h = (h * 31 + fecha.charCodeAt(i)) | 0;
  return h;
}

function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── RAWG: 1 juego representativo por franquicia ──
async function fetchGameForFranchise(nombre) {
  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(nombre)}&page_size=1&ordering=-added`);
    const data = await res.json();
    const g = (data.results || [])[0];
    if (!g) return null;
    return { nombre: g.name, imagen: g.background_image || '' };
  } catch { return null; }
}

// ── Archive.org: tracks reales (misma técnica que explorar.html) ──
const STOPWORDS = new Set(['the','de','la','el','los','las','un','una','and','of','for','en','a','con','por','del']);

function enrichQuery(raw) {
  const words = raw.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));
  const ostTerms = 'title:(ost OR soundtrack OR "original soundtrack" OR "game music" OR music OR audio)';
  const subjectTerms = 'subject:(videogame OR "video game" OR gaming OR nintendo OR sega OR playstation OR "game music" OR ost OR soundtrack OR arcade)';
  const titleQuery = words.map(w => `title:${w}`).join(' AND ');
  return {
    primary: `(${titleQuery}) AND (${ostTerms} OR ${subjectTerms}) AND mediatype:audio`,
    fallback: `(${words.join(' ')}) AND (${subjectTerms}) AND mediatype:audio`,
    words
  };
}

async function runSearch(q, rows = 8) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,subject&rows=${rows}&output=json&sort[]=downloads+desc`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.response?.docs || [];
}

async function fetchTracksForGame(nombreJuego, cantidad = 2) {
  const { primary, fallback, words } = enrichQuery(nombreJuego);
  let docs = await runSearch(primary, 6);
  if (!docs.length) docs = await runSearch(fallback, 6);
  if (!docs.length) return [];

  const tracks = [];
  const nombresVistos = new Set(); // evita tracks con el mismo nombre aunque vengan de items distintos
  for (const doc of docs) {
    if (tracks.length >= cantidad) break;
    try {
      const res = await fetch(`https://archive.org/metadata/${doc.identifier}/files`);
      const data = await res.json();
      const files = (data?.result || [])
        .filter(f => /\.(mp3|ogg)$/i.test(f.name))
        .filter(f => { const s = parseFloat(f.length) || 0; return s === 0 || (s >= 15 && s <= 300); })
        .filter(f => !/\b(sfx|effect|jingle|voice|vo_|fx_|podcast|interview)\b/i.test(f.name));
      for (const f of files) {
        if (tracks.length >= cantidad) break;
        const nombreTrack = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/^\d+\s*/, '');
        const clave = nombreTrack.trim().toLowerCase();
        if (nombresVistos.has(clave)) continue; // mismo nombre ya agregado, se descarta
        nombresVistos.add(clave);
        tracks.push({
          nombreTrack,
          url: `https://archive.org/download/${doc.identifier}/${encodeURIComponent(f.name)}`
        });
      }
    } catch { /* sigue con el próximo doc */ }
  }
  return tracks;
}

// ── Arma la trivia del día completa ──
async function buildDailyQuiz(fecha) {
  const rng = mulberry32(seedFromDate(fecha));
  const franquiciasHoy = shuffleSeeded(FRANCHISES, rng).slice(0, 9);

  const juegos = [];
  for (const f of franquiciasHoy) {
    const g = await fetchGameForFranchise(f);
    if (!g) continue;
    const tracks = await fetchTracksForGame(g.nombre, 2);
    if (tracks.length) juegos.push({ ...g, tracks });
    if (juegos.length >= 8) break;
  }

  if (juegos.length < 6) throw new Error('No se pudo armar suficiente contenido para la trivia de hoy.');

  const usados = new Set(); // para no repetir el mismo audio en el mismo día
  function trackLibreDe(juego) {
    for (const t of juego.tracks) {
      if (!usados.has(t.url)) { usados.add(t.url); return t; }
    }
    return null;
  }

  const preguntas = [];

  // Tipo A x2 — "¿de qué juego es este soundbite?"
  for (let i = 0; i < 2 && i < juegos.length; i++) {
    const juego = juegos[i];
    const track = trackLibreDe(juego);
    if (!track) continue;
    const otros = shuffleSeeded(juegos.filter(j => j !== juego), rng).slice(0, 3).map(j => j.nombre);
    const opciones = shuffleSeeded([juego.nombre, ...otros], rng);
    preguntas.push({
      tipo: 'juego', audioUrl: track.url,
      pregunta: 'Which game does this soundbite belong to?',
      opciones, correcta: opciones.indexOf(juego.nombre)
    });
  }

  // Tipo B x2 — "¿cuál soundtrack es, dentro de este juego?"
  const conDosTracks = juegos.filter(j => j.tracks.length >= 3 || (j.tracks.length >= 2));
  for (let i = 0; i < 2 && i < conDosTracks.length; i++) {
    const juego = conDosTracks[(i + 2) % conDosTracks.length];
    const opcionesTracks = shuffleSeeded(juego.tracks, rng).slice(0, 3);
    if (opcionesTracks.length < 2) continue;
    const correctoObj = opcionesTracks[0];
    if (usados.has(correctoObj.url)) continue;
    usados.add(correctoObj.url);
    const nombres = opcionesTracks.map(t => t.nombreTrack || 'Untitled track');
    preguntas.push({
      tipo: 'soundtrack', audioUrl: correctoObj.url,
      pregunta: `This soundbite is from ${juego.nombre}. Which track is it?`,
      opciones: nombres, correcta: 0 // ya viene shuffled abajo si hace falta
    });
  }

  // Tipo C x2 — sí/no (1 caso sí, 1 caso no)
  for (let i = 0; i < 2 && i < juegos.length; i++) {
    const juegoReal = juegos[(i + 4) % juegos.length];
    const track = trackLibreDe(juegoReal);
    if (!track) continue;
    const esSi = i === 0;
    const juegoMostrado = esSi
      ? juegoReal
      : shuffleSeeded(juegos.filter(j => j !== juegoReal), rng)[0];
    preguntas.push({
      tipo: 'sino', audioUrl: track.url,
      pregunta: `Does this soundbite belong to "${juegoMostrado.nombre}"?`,
      opciones: ['Yes', 'No'],
      correcta: esSi ? 0 : 1
    });
  }

  return { fecha, preguntas: shuffleSeeded(preguntas, rng).slice(0, 6), creadoEn: serverTimestamp() };
}

// ── Obtiene la trivia de hoy, generándola si nadie lo ha hecho aún ──
export async function getDailyQuiz() {
  const fecha = hoyStr();
  const ref = doc(db, 'triviaDiario', fecha);

  const existente = await getDoc(ref);
  if (existente.exists()) return existente.data();

  // Nadie la ha generado — la armamos y la guardamos en transacción
  // para evitar que dos usuarios la generen a la vez.
  const quiz = await buildDailyQuiz(fecha);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return; // alguien se adelantó
      tx.set(ref, quiz);
    });
  } catch (e) {
    console.warn('No se pudo guardar la trivia (probablemente ya existía):', e.message);
  }
  const final = await getDoc(ref);
  return final.exists() ? final.data() : quiz;
}

export async function guardarResultadoDelDia(uid, nombre, avatar, puntos) {
  const fecha = hoyStr();
  await setDoc(doc(db, 'triviaResultados', `${fecha}_${uid}`), {
    uid, nombre, avatar: avatar || 'avatar1', puntos, fecha, creadoEn: serverTimestamp()
  });
}

export async function getRankingDeHoy() {
  const fecha = hoyStr();
  const q = query(
    collection(db, 'triviaResultados'),
    where('fecha', '==', fecha),
    orderBy('puntos', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function getRankingDeHoyCompleto() {
  const fecha = hoyStr();
  const q = query(
    collection(db, 'triviaResultados'),
    where('fecha', '==', fecha),
    orderBy('puntos', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export function fechaDeHoy() { return hoyStr(); }
