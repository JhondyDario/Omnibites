# Cómo descomprimir esto sobre tu repo

1. Descomprime este .zip **directamente sobre la carpeta raíz de tu repo Omnibites** (donde está tu `index.html`). Las carpetas `.github/`, `mobile/` y `js/` se van a mezclar solas con las que ya tienes — no reemplaza nada existente, solo agrega archivos nuevos.

2. El único archivo que NO se copia solo es el parche de `pages/soundbite.html` — ese lo tienes que aplicar a mano con los 3 find-and-replace que te di en el chat (busca el mensaje donde digo "Ahora sí, el parche exacto").

3. Dentro de `mobile/`, abre `SETUP.md` y sigue esos pasos en orden: `npm install` → `npm run prepare-www` → `npx cap add android`.

4. El archivo `mobile/native-plugin-example/IiSUExportPlugin.kt` es el ÚLTIMO que se mueve, y se mueve DESPUÉS de que exista la carpeta `mobile/android/` (o sea, después del paso 3). Su destino final está explicado en `mobile/native-plugin-example/IISU-INTEGRATION.md`.

5. `PLAY-STORE-READINESS.md` no hay que hacerle nada ahora — es solo para leer cuando decidas publicar en Play Store en el futuro.

Cualquier duda, el cuadro completo con cada archivo y su ruta está en el chat.
