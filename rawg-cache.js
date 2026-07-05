// ============================================
// OMNIBITES — Caché local de búsquedas RAWG
// Evita repetir la misma búsqueda en RAWG dentro de
// la ventana de expiración: ahorra cuota de API y
// hace el autocomplete instantáneo en repeticiones.
// ============================================

const CACHE_PREFIX  = 'omnibites_rawg_';
const CACHE_TTL_MS  = 7 * 24 * 60 * 60 * 1000; // 7 días — la metadata de juegos casi no cambia

function cacheKey(query, pageSize) {
  return `${CACHE_PREFIX}${query.trim().toLowerCase()}_${pageSize}`;
}

export function getCachedRawgResults(query, pageSize) {
  try {
    const raw = localStorage.getItem(cacheKey(query, pageSize));
    if (!raw) return null;
    const { timestamp, results } = JSON.parse(raw);
    if (!timestamp || Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(query, pageSize));
      return null;
    }
    return results;
  } catch {
    // localStorage bloqueado (modo privado) o dato corrupto — seguimos sin caché
    return null;
  }
}

export function setCachedRawgResults(query, pageSize, results) {
  try {
    localStorage.setItem(
      cacheKey(query, pageSize),
      JSON.stringify({ timestamp: Date.now(), results })
    );
  } catch {
    // Cuota de localStorage llena o no disponible — no es crítico, simplemente no cacheamos
  }
}
