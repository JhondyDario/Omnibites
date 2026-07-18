# Camino hacia Play Store (si algún día se usa)

Esto NO es una tarea pendiente ahora mismo — es solo pa' que cuando llegue el momento sepas exactamente qué falta, sin tener que reestructurar nada de lo ya hecho.

## Ya resuelto desde hoy (cero trabajo extra en el futuro)
- `appId` fijo (`com.omnibites.app`) — no se toca jamás una vez publicado, ya está bien elegido.
- Ícono fuente de 1024x1024 — sirve tanto para el ícono de la app como para la ficha de Play Store.
- `.gitignore` ya bloquea cualquier archivo de firma (`*.jks`, `*.keystore`, `keystore.properties`) para que nunca se suba a git por accidente, aunque hoy no exista ninguno todavía.

## Lo que se hace SOLO el día que decidas publicar (no antes)

1. **Generar el keystore de release** (una vez, con `keytool`, viene con el JDK). Se guarda en tu máquina y en un lugar seguro aparte (si lo pierdes, no puedes actualizar la app nunca más con esa identidad).
2. **Crear `mobile/android/keystore.properties`** (local, gitignored) con la ruta y contraseñas del keystore — el `build.gradle` lo lee de ahí en vez de tener las contraseñas escritas directo en el código.
3. **Firmar en GitHub Actions sin exponer el keystore:** el keystore se sube como *secret* de GitHub (Settings → Secrets), no como archivo del repo. El workflow lo reconstruye en memoria durante el build. Cuando llegue el momento, agrego un `build-release.yml` aparte que haga esto — el `build-apk.yml` actual se queda tal cual para tus pruebas de debug.
4. **Revisar `targetSdkVersion`** en `android/variables.gradle` — Play Store exige apuntar a una versión de Android relativamente reciente (esto cambia cada año, así que se revisa en el momento, no ahora).
5. **Política de privacidad** — obligatoria en Play Store porque usas Firebase Auth (login con correo/Google) y guardas datos de usuario. Un documento simple basta, pero hay que tenerlo publicado en una URL antes de poder subir la app.
6. **`versionCode` / `versionName`** en `android/app/build.gradle` — Play Store exige subir el `versionCode` (un entero) en cada actualización. Para uso manual entre tú y tus panas esto no importa tanto, pero si publicas hay que llevarle control.

Ninguno de estos puntos bloquea lo que estás haciendo ahora — son pasos que se agregan encima cuando decidas dar el salto, sin tocar la estructura actual del proyecto.
