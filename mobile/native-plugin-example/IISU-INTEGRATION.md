# Integración del plugin iiSU

## 1. Dónde va el archivo Kotlin
Después de correr `npx cap add android`, copia `IiSUExportPlugin.kt` hacia:
```
mobile/android/app/src/main/java/com/omnibites/app/plugins/IiSUExportPlugin.kt
```
(Esa ruta de carpetas ya coincide con el `appId` actual `com.omnibites.app`. Si el día de mañana vuelves a cambiar el appId, esta ruta y el `package` en la primera línea del `.kt` tienen que cambiar juntos otra vez.)

## 2. Registrar el plugin en MainActivity
Capacitor genera `MainActivity.java` (o `.kt`) en:
```
mobile/android/app/src/main/java/.../MainActivity.java
```
Ábrelo y agrégale, ANTES del `super.onCreate()`:

```java
import com.omnibites.app.plugins.IiSUExportPlugin;
// ...
@Override
public void onCreate(Bundle savedInstanceState) {
    registerPlugin(IiSUExportPlugin.class);
    super.onCreate(savedInstanceState);
}
```

## 3. Lo que TIENES que confirmar antes de confiar en esto
Yo no tengo forma de verificar contra un dispositivo real con iiSU instalado, así que estas dos cosas son suposiciones mías que hay que revisar:

- **El mapa `CONSOLE_FOLDER_MAP` dentro del `.kt`** — puse mis mejores estimaciones (`ps2`, `gc`, `psx`, etc.) pero necesito que abras esa carpeta de `consoles/` en tu teléfono y me confirmes los nombres reales, uno por uno si puedes. Un nombre mal puesto ahí simplemente hace que no encuentre la consola — no rompe nada, pero tampoco funciona.
- **El comportamiento del selector de carpetas en tu versión de Android** — a partir de Android 11 el permiso persistente por carpeta (`ACTION_OPEN_DOCUMENT_TREE`) es el único camino confiable; en teoría funciona igual en todas las versiones 11+, pero nunca lo he probado contra iiSU específicamente.

## 4. Cómo se conecta con lo que ya existe en soundbite.html
`iisu-export.js` va en `js/iisu-export.js` en la **raíz del repo** (junto a `auth.js`, `ui.js`, `id3-cover.js`) — NO dentro de `mobile/`. Así sí queda incluido cuando `copy-www.js` copia el sitio hacia `mobile/www` para empaquetarlo en el APK.

Ahora mismo `downloadSB()` en `pages/soundbite.html` arma el blob del MP3 con `buildMp3Blob()` y lo baja al navegador. Ver el patch completo para agregar el botón "Guardar en iiSU" que solo aparece dentro de la app.

## 5. Detectar si estamos corriendo dentro del APK o en la web normal
Para que el botón de "Guardar en iiSU" solo aparezca en la app (no en la web de GitHub Pages), usa:
```js
import { Capacitor } from '@capacitor/core';
if (Capacitor.isNativePlatform()) {
  // mostrar botón de iiSU
}
```
