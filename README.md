# 🎮 Omnibites

> Encuentra, recorta y descarga audios de ROMs de videojuegos. Comparte con la comunidad retro.

**Demo en vivo:** `https://TU_USUARIO.github.io/omnibites`

---

## 🚀 Cómo poner esto en línea (paso a paso)

### Paso 1 — Crear tu cuenta de GitHub
1. Ve a [github.com](https://github.com) y crea una cuenta gratuita
2. Haz clic en **"New repository"**
3. Nómbralo `omnibites`
4. Ponlo en **Public**
5. Clic en **"Create repository"**

### Paso 2 — Subir los archivos
**Opción fácil (sin instalar nada):**
1. En tu repositorio vacío, haz clic en **"uploading an existing file"**
2. Arrastra todos los archivos de esta carpeta
3. Clic en **"Commit changes"**

**Opción con Git (más rápido a largo plazo):**
```bash
git init
git add .
git commit -m "Primer commit - Omnibites"
git remote add origin https://github.com/TU_USUARIO/omnibites.git
git push -u origin main
```

### Paso 3 — Activar GitHub Pages
1. En tu repositorio → **Settings** → **Pages**
2. En "Source" selecciona **"GitHub Actions"**
3. ¡Listo! En 1-2 minutos tu web estará en `https://TU_USUARIO.github.io/omnibites`

### Paso 4 — Configurar Firebase (15 minutos)
1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **"Agregar proyecto"** → nombre: `omnibites` → Continuar
3. En el panel, clic en **⚙️ Configuración del proyecto**
4. Baja a **"Tus apps"** → clic en **</>** (Web)
5. Regístrala como `omnibites-web`
6. Copia el objeto `firebaseConfig` que te dan
7. Pégalo en el archivo `js/firebase-config.js` (reemplaza los valores)

**Activa estos servicios en Firebase:**
- **Authentication** → Sign-in method → activa **Email/Password** y **Google**
- **Firestore Database** → Crear base de datos → modo **prueba**
- **Storage** → Comenzar → modo **prueba**

### Paso 5 — Agregar dominio de GitHub Pages a Firebase
1. En Firebase → Authentication → **Authorized domains**
2. Agrega: `TU_USUARIO.github.io`

---

## 📁 Estructura del proyecto

```
omnibites/
├── index.html              ← Página principal
├── css/
│   └── style.css           ← Estilos (tema retro/pixel)
├── js/
│   ├── firebase-config.js  ← 🔧 CONFIGURA AQUÍ TUS DATOS
│   ├── auth.js             ← Login/logout automático
│   ├── home.js             ← Lógica de la página principal
│   └── ui.js               ← Menú móvil y notificaciones
├── pages/
│   ├── explorar.html       ← Buscar y filtrar audios
│   ├── subir.html          ← Subir y recortar audios
│   ├── login.html          ← Página de login
│   └── registro.html       ← Registro de usuario
└── .github/
    └── workflows/
        └── deploy.yml      ← Auto-deploy a GitHub Pages
```

---

## 🛠 Tecnologías

| Tecnología | Para qué sirve |
|---|---|
| HTML5 + CSS | Interfaz visual |
| Web Audio API | Recorte de audios en el navegador |
| Firebase Auth | Login con correo y Google |
| Firestore | Base de datos de audios y usuarios |
| Firebase Storage | Almacenamiento de archivos MP3/WAV |
| GitHub Pages | Hosting gratuito |
| GitHub Actions | Deploy automático |

---

## 🆓 Costos

Todo esto es **100% gratuito** con los planes gratuitos:
- **GitHub:** gratis para repositorios públicos
- **Firebase Spark (gratis):** 1GB Storage, 50k lecturas/día, autenticación ilimitada

---

## 📝 Próximas funciones

- [ ] Reproductor con visualizador de onda en tiempo real
- [ ] Sistema de reseñas y estrellas
- [ ] Perfil de usuario con historial
- [ ] Descarga directa del recorte en MP3
- [ ] Búsqueda por categoría (música, efectos, voces)

---

*Hecho con 🎮 para la comunidad retro*
