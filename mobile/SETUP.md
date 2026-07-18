# Omnibites Mobile — Setup inicial

## Lo que necesitas instalado (una sola vez)
1. **Node.js** v18+ → https://nodejs.org
2. **Android Studio** → https://developer.android.com/studio (te instala el SDK, el emulador y Gradle)
3. Nada de cuentas de Capacitor. No existen.

## Pasos para dejarlo funcionando por primera vez

Estos pasos se corren **UNA sola vez**, en tu máquina, no en GitHub Actions:

```bash
cd mobile
npm install
npm run prepare-www          # copia index.html, pages/, css/, js/, assets/ hacia mobile/www
npx cap add android          # esto genera la carpeta mobile/android — el proyecto nativo real
```

Después de correr `npx cap add android`, se crea `mobile/android/`. **Esa carpeta SÍ se sube a git** (a diferencia de `node_modules` o `www`, que se regeneran solos). Súbela con un commit normal.

## Configurar orientación vertical Y horizontal

Abre `mobile/android/app/src/main/AndroidManifest.xml` y busca el `<activity>` de `MainActivity`. Agrégale estos dos atributos:

```xml
<activity
    android:name=".MainActivity"
    android:screenOrientation="unspecified"
    android:configChanges="orientation|screenSize|keyboardHidden|navigation">
```

- `screenOrientation="unspecified"` → deja que el usuario rote el teléfono libremente en ambos sentidos.
- `configChanges="..."` → evita que Android reinicie la Activity al rotar. Esto es importante para ustedes porque si no lo pones, **cada vez que alguien rote el teléfono el audio que está sonando se corta** (la WebView se recrea desde cero).

## Mandos (Gamepad)

No requiere plugin ni configuración especial — la Gamepad API de JavaScript funciona directo dentro del WebView de Android. Lo único es que **hay que probarlo en un dispositivo físico**, porque el soporte varía según el fabricante del teléfono/tablet. Si el mando no responde en algún dispositivo específico, ahí sí habría que mirar un plugin nativo puntual — pero no antes de probar.

## Generar el APK

**Localmente** (para probar en tu teléfono ya):
```bash
npm run build:apk
```
El archivo queda en `mobile/android/app/build/outputs/apk/debug/app-debug.apk` — lo pasas a tu teléfono y lo instalas (activa "orígenes desconocidos" en Android).

**Automático por GitHub Actions:**
Ya quedó el workflow en `.github/workflows/build-apk.yml`. Cada vez que subas cambios a `main` que toquen `mobile/`, `index.html`, `pages/`, `css/`, `js/` o `assets/`, se compila solo y te deja el APK descargable en la pestaña **Actions → (el run más reciente) → Artifacts**.

## Sobre el `appId`

Quedó como `com.jhondydario.omnibites`. **Ojo con esto**: una vez que publiques la primera versión (aunque sea solo para probar), ese ID no se puede cambiar más sin que sea técnicamente una app distinta. Si quieres otro, cámbialo ahora en `capacitor.config.json` antes de correr `cap add android`.

## Lo que falta (pendiente, no incluido en este esqueleto)

- El plugin de FTP hacia la Vita para el auto-guardado en la carpeta de iiSU — eso es un plugin nativo de Capacitor en Kotlin, se hace aparte una vez confirmes la estructura de carpeta exacta que espera iiSU.
- Icono y splash screen de la app (`npx cap` tiene comandos para generar estos assets a partir de una imagen tuya, cuando la tengas lista).
