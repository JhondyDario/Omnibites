// ============================================
// OMNIBITES — UI Utilities
// ============================================

// Menú hamburguesa — UN SOLO listener, sin animación de max-height
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    mobileMenu.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

// Toast
window.showToast = function(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3000);
};

// ============================================
// OMNIBITES — Modo Día/Noche
// ============================================
const THEME_KEY = 'omnibites_theme_mode'; // 'auto' | 'day' | 'night'

function computeAutoTheme() {
  const h = new Date().getHours();
  return (h >= 6 && h < 19) ? 'light' : 'dark';
}

function applyTheme() {
  const mode  = localStorage.getItem(THEME_KEY) || 'auto';
  const theme = mode === 'auto' ? computeAutoTheme() : (mode === 'day' ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
}

window.setThemeMode = function(mode) {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme();
};

window.getThemeMode = function() {
  return localStorage.getItem(THEME_KEY) || 'auto';
};

applyTheme();
setInterval(applyTheme, 5 * 60 * 1000); // revisa cada 5 min por si el modo auto cruza el horario

// Botones de tema (solo existen en ajustes.html)
document.querySelectorAll('.theme-btn[data-mode]').forEach(btn => {
  if (btn.dataset.mode === window.getThemeMode()) btn.classList.add('active');
  btn.addEventListener('click', () => {
    window.setThemeMode(btn.dataset.mode);
    document.querySelectorAll('.theme-btn[data-mode]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
