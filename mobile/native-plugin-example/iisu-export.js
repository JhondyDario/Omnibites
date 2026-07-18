// ============================================
// OMNIBITES — Wrapper del plugin nativo IiSUExport
// No usa import de "@capacitor/core" porque el sitio no tiene
// bundler. Capacitor inyecta window.Capacitor automáticamente
// dentro del WebView SOLO cuando corre como app empaquetada —
// en la web normal (GitHub Pages) ese objeto no existe.
// ============================================

export function isNativeApp() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

function getPlugin() {
  if (!isNativeApp()) return null;
  return (window.Capacitor.Plugins && window.Capacitor.Plugins.IiSUExport) || null;
}

export async function iisuFolderConfigured() {
  const plugin = getPlugin();
  if (!plugin) return false;
  const { configured } = await plugin.hasFolderConfigured();
  return configured;
}

export async function iisuPickFolder() {
  const plugin = getPlugin();
  if (!plugin) throw new Error('Esto solo funciona dentro de la app');
  return plugin.pickConsolesFolder();
}

export async function iisuSaveSoundbite(consola, juego, blob) {
  const plugin = getPlugin();
  if (!plugin) throw new Error('Esto solo funciona dentro de la app');
  const base64Mp3 = await blobToBase64(blob);
  return plugin.saveSoundbite({ consola, juego, base64Mp3 });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
