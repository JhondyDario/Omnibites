// ============================================
// OMNIBITES MOBILE — Copia el sitio web (raíz del repo)
// hacia mobile/www antes de que Capacitor lo empaquete.
// Se corre con: node copy-www.js
// ============================================
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEST = path.join(__dirname, 'www');

// Carpetas/archivos de la raíz que NO deben terminar dentro del APK
const EXCLUDE = new Set([
  'mobile', '.github', '.git', 'node_modules',
  'README.md', 'LICENSE', '.gitignore'
]);

if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

for (const item of fs.readdirSync(ROOT)) {
  if (EXCLUDE.has(item)) continue;
  const src  = path.join(ROOT, item);
  const dest = path.join(DEST, item);
  fs.cpSync(src, dest, { recursive: true });
}

console.log('✓ Sitio copiado a mobile/www — listo para "npx cap sync android"');
