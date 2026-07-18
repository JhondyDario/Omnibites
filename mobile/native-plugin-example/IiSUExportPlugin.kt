package com.omnibites.app.plugins

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Base64
import androidx.activity.result.ActivityResult
import androidx.documentfile.provider.DocumentFile
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

// ============================================
// OMNIBITES — Plugin de exportación automática a iiSU
// Escribe el soundbite recortado como music.mp3 dentro
// de la carpeta del ROM correspondiente.
//
// OJO: Los nombres de carpeta de consola (ps2, gc, etc.)
// dentro de CONSOLE_FOLDER_MAP son mi mejor estimación —
// Jhondy debe confirmarlos mirando su propia carpeta de
// iiSU antes de confiar en esto al 100%.
// ============================================
@CapacitorPlugin(name = "IiSUExport")
class IiSUExportPlugin : Plugin() {

    private val PREFS = "omnibites_iisu"
    private val KEY_URI = "consoles_uri"

    // Mapeo consola de Omnibites -> nombre de carpeta esperado por iiSU.
    // SIN CONFIRMAR — revisar contra la carpeta real del usuario.
    private val CONSOLE_FOLDER_MAP = mapOf(
        "PS1" to "psx", "PS2" to "ps2", "PS3" to "ps3", "PS4" to "ps4", "PSP" to "psp",
        "NES" to "nes", "SNES" to "snes", "N64" to "n64", "GBA" to "gba",
        "GameCube" to "gc", "Wii" to "wii", "WiiU" to "wiiu", "3DS" to "3ds", "Switch" to "switch",
        "MasterSystem" to "sms", "Genesis" to "genesis", "Saturn" to "saturn", "Dreamcast" to "dreamcast",
        "Xbox" to "xbox", "Xbox360" to "xbox360", "Arcade" to "arcade", "PC" to "pc"
    )

    @PluginMethod
    fun pickConsolesFolder(call: PluginCall) {
        saveCall(call)
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        startActivityForResult(call, intent, "folderPickerResult")
    }

    @ActivityCallback
    private fun folderPickerResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        if (result.resultCode != Activity.RESULT_OK) {
            call.reject("El usuario canceló la selección de carpeta")
            return
        }
        val uri: Uri = result.data?.data ?: run { call.reject("No se recibió la carpeta"); return }

        context.contentResolver.takePersistableUriPermission(
            uri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        )
        context.getSharedPreferences(PREFS, 0).edit().putString(KEY_URI, uri.toString()).apply()

        val ret = JSObject()
        ret.put("uri", uri.toString())
        call.resolve(ret)
    }

    @PluginMethod
    fun hasFolderConfigured(call: PluginCall) {
        val saved = context.getSharedPreferences(PREFS, 0).getString(KEY_URI, null)
        val ret = JSObject()
        ret.put("configured", saved != null)
        call.resolve(ret)
    }

    // consola: código de Omnibites (ej. "PS2")
    // juego: nombre del juego guardado en Firestore (ej. "SSX 3")
    // base64Mp3: el MP3 ya recortado, codificado en base64
    @PluginMethod
    fun saveSoundbite(call: PluginCall) {
        val consola     = call.getString("consola") ?: return call.reject("Falta 'consola'")
        val juego       = call.getString("juego")   ?: return call.reject("Falta 'juego'")
        val base64Mp3   = call.getString("base64Mp3") ?: return call.reject("Falta 'base64Mp3'")

        val consolaFolder = CONSOLE_FOLDER_MAP[consola]
            ?: return call.reject("Consola '$consola' sin mapeo de carpeta configurado")

        val savedUriStr = context.getSharedPreferences(PREFS, 0).getString(KEY_URI, null)
            ?: return call.reject("No hay carpeta de iiSU configurada. Llama a pickConsolesFolder primero.")

        val rootDoc = DocumentFile.fromTreeUri(context, Uri.parse(savedUriStr))
            ?: return call.reject("No se pudo abrir la carpeta guardada")

        val consoleDir = rootDoc.findFile(consolaFolder)
            ?: return call.reject("No existe la carpeta '$consolaFolder' dentro de lo que seleccionaste")

        val candidatos = consoleDir.listFiles().filter { it.isDirectory }
        val objetivo = normalizar(juego)

        // 1) match exacto normalizado, 2) match parcial en cualquier dirección
        val match = candidatos.firstOrNull { normalizar(it.name ?: "") == objetivo }
            ?: candidatos.firstOrNull {
                val n = normalizar(it.name ?: "")
                n.contains(objetivo) || objetivo.contains(n)
            }

        if (match == null) {
            val ret = JSObject()
            ret.put("matched", false)
            ret.put("candidatos", candidatos.mapNotNull { it.name })
            call.resolve(ret)
            return
        }

        match.findFile("music.mp3")?.delete()
        val nuevo = match.createFile("audio/mpeg", "music.mp3")
            ?: return call.reject("No se pudo crear music.mp3 dentro de '${match.name}'")

        val bytes = Base64.decode(base64Mp3, Base64.DEFAULT)
        context.contentResolver.openOutputStream(nuevo.uri)?.use { it.write(bytes) }

        val ret = JSObject()
        ret.put("matched", true)
        ret.put("carpeta", match.name)
        call.resolve(ret)
    }

    private fun normalizar(s: String): String =
        s.lowercase()
            .replace(Regex("\\(.*?\\)"), "")  // quita (USA), (Europe)...
            .replace(Regex("\\[.*?\\]"), "")  // quita [!], [T-Es]...
            .replace(Regex("[^a-z0-9]"), "")
}
