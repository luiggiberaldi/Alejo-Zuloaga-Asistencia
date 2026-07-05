# Bitácora del Proyecto: Alejo Zuloaga Asistencia

- **Developer:** Luigi Berardi
- **Fecha de inicio:** 2026-07-02
- **Método:** AP (Agentic Programming, step-by-step)

> Solo el desarrollador actualiza este registro. Al cerrar cada sesión de Claude Code, añadir un
> resumen en la sección "Resumen de Sesiones".

---

## Fases

| Fase | Descripción                                    | Estado       | Fecha inicio | Fecha fin |
|------|------------------------------------------------|--------------|--------------|-----------|
| 1    | Proyecto base + auth + SQLite                  | Completado   | 2026-07-02   | 2026-07-02 |
| 2    | CRUD secciones y estudiantes                   | Completado   | 2026-07-03   | 2026-07-03 |
| 3    | Asistencia + long press + comportamiento       | Completado   | 2026-07-03   | 2026-07-03 |
| 4    | Offline + sincronización                       | Completado   | 2026-07-03   | 2026-07-03 |
| 5    | Reportes PDF                                    | Completado   | 2026-07-03   | 2026-07-03 |
| 6    | Rol coordinador                                | Completado   | 2026-07-03   | 2026-07-04 |
| 7    | Demo pulida + EAS Build                        | En progreso  | 2026-07-04   |           |

---

## Registro de Cambios

| Fecha | Fase | Cambio | Motivo |
|-------|------|--------|--------|
| 2026-07-04 | 7 | Fix: lectura de XLS con `expo-file-system` en vez de `fetch`/`Blob` | `fetch().blob()` no soporta crear Blob desde ArrayBuffer en Android (RN), rompía la importación de estudiantes |
| 2026-07-04 | 7 | Fix: compartir PDF en Android sin `getContentUriAsync` manual | La conversión manual a `content://` no era reconocida por el `FileProvider` propio de `expo-sharing`, causaba "Not allowed to read file" |
| 2026-07-04 | 7 | Fix: pin de versiones `react-native-gesture-handler@2.32.0`, `react-native-reanimated@4.5.0`, `react-native-worklets@0.10.0` | Versiones instaladas (3.0.2 / 4.5.1 / 0.10.1) no coincidían con las precompiladas en el binario de Expo Go del SDK 57, causaba crash nativo (SIGSEGV) al abrir la app |
| 2026-07-04 | 7 | Redimensionado `assets/images/logo.png` de 1414×1500px/2.4MB a 377×400px/188KB | El logo no se renderizaba en los PDF (ícono roto): la imagen era demasiado grande para el data-URI embebido en el WebView de impresión de Android en gama baja/media |
| 2026-07-04 | 7 | Selector de rango de fechas en Reportes: reemplazado por `@react-native-community/datetimepicker` (nativo Android) | Primer intento con `react-native-paper-dates` (calendario custom) no gustó por complejidad visual; se simplificó al date picker nativo del sistema |
| 2026-07-04 | 7 | Auto-scroll en toma de asistencia al marcar el último estudiante visible + modal de finalización (`AttendanceCompletionModal`) con opciones Subir a la nube / Descargar resumen / Compartir | Mejorar UX de toma de asistencia y dar cierre visual claro al terminar una sección |
| 2026-07-04 | 7 | Auto-pull silencioso al login si no hay secciones locales (`hasSections()` + `AuthBootstrap`) | Instalar la app en un dispositivo nuevo con una cuenta que ya tenía datos en Supabase mostraba "No hay secciones" sin indicar que hacía falta sincronizar |
| 2026-07-04 | 7 | Refactor `generator.ts`: `buildPdfFile` + `savePDFToDevice`/`sharePDFDirectly`; nuevo `PdfShareModal.tsx` reemplaza el `Alert.alert` nativo de "Guardar/Compartir" | Unificar estética de diálogos de exportación de PDF (Reportes y resumen diario) con el mismo estilo del modal de finalización |

---

## Decisiones Técnicas

| Fecha | Decisión | Alternativas consideradas | Justificación |
|-------|----------|---------------------------|---------------|
| 2026-07-04 | Fijar versiones exactas de `reanimated`/`worklets`/`gesture-handler` según `bundledNativeModules.json` del SDK instalado, en vez de dejar que npm resuelva versiones transitivas | Dejar versiones sueltas (`^`) confiando en `expo-router` | En Expo Go, el código nativo viene precompilado y fijo por versión de SDK; un desajuste de incluso una versión de parche en librerías con puente nativo (workets) causa corrupción de memoria, no un error de JS |
| 2026-07-04 | Selector de fecha con `@react-native-community/datetimepicker` (diálogo nativo Android) en vez de un calendario custom (`react-native-paper-dates`) | Calendario custom con `DatePickerModal` de `react-native-paper-dates` | Más simple de mantener, cero dependencias de localización/tema propias, UX ya conocida por cualquier usuario de Android |
| 2026-07-04 | Logo del PDF embebido como base64 estático importado (`logo-base64.ts`) en vez de leído en runtime vía `expo-asset`/`FileSystem` | Cargar el logo dinámicamente con `Asset.fromModule().downloadAsync()` en cada generación de PDF | Evita fallos de lectura de archivos en Android (mismo patrón de bug que afectó XLS y PDF), y es más rápido al no depender de I/O en cada exportación |
| 2026-07-04 | Auto-pull de datos solo se dispara una vez al login si la tabla local `sections` está vacía (no periódico, no en cada refresco de sesión) | Sync automático en cada apertura de app / sync periódico en segundo plano | Respeta el principio explícito del proyecto de "solo sincronización manual" (evitar consumo de datos móviles o fallos a mitad de clase), resolviendo únicamente el caso de instalación en dispositivo nuevo |

---

## Lecciones Aprendidas

| Fecha | Problema | Solución | Prevención |
|-------|----------|----------|------------|
| 2026-07-04 | App crasheaba al abrir en Expo Go ("Something went wrong", SIGSEGV en `libworklets.so`/Hermes) | Diagnóstico por stack trace nativo + comparación de versiones instaladas vs. `bundledNativeModules.json` del SDK; se corrigió con `npx expo install --fix` + pin manual de `reanimated`/`worklets` | Antes de instalar librerías con código nativo (reanimated, gesture-handler, etc.), usar siempre `npx expo install <lib>` en vez de `npm install`, y correr `npx expo install --check` periódicamente |
| 2026-07-04 | Lectura de archivos locales (XLS importado, PDF generado) fallaba de forma intermitente en Android con "isn't readable" / errores de Blob | Usar siempre `expo-file-system` (`readAsStringAsync` con `EncodingType.Base64`) para leer archivos locales; nunca `fetch()` + `Blob` para URIs `file://` | Los mismos síntomas (bug de Expo Go vs. bug real) pueden parecer idénticos — siempre probar en un dev build/APK real antes de concluir que un fix funcionó, ya que Expo Go tiene limitaciones de sandboxing propias que no existen en un build nativo |
| 2026-07-04 | Compartir tokens/secretos (Supabase Personal Access Token) pegados directamente en el chat | Se usó una sola vez para una consulta puntual de solo lectura y se instruyó revocarlo de inmediato | Nunca pegar `service_role key` ni tokens de acceso personal en un chat; si se necesita acceso puntual, revocar el token inmediatamente después de usarlo |

---

## Resumen de Sesiones

| Fecha | Sesión | Qué se hizo | Qué falta | Problemas |
|-------|--------|-------------|-----------|-----------|
| 2026-07-04 | Fix de bugs de Android (PDF/XLS) + crash nativo + UX de asistencia + Bitácora | Corregidos: importación XLS (fetch/Blob), compartir PDF en Android, logo roto en PDF (resize), crash nativo de Expo Go (versiones de reanimated/gesture-handler/worklets); agregado auto-scroll y modal de finalización en toma de asistencia, auto-pull al login, selector de fecha nativo en Reportes, modal estilizado para guardar/compartir PDF (reemplaza Alert nativo) | Commitear los cambios de esta sesión (5 archivos modificados + 2 componentes nuevos sin commit); confirmar en dispositivo que el crash de Expo Go no reaparece; probar con un profesor real y una sección completa (hoy solo hay datos de prueba: 1 sección, 30 estudiantes); limpiar archivos sueltos en la raíz del repo (PDF de prueba, `logo.png` duplicado) | El crash de Expo Go tomó varias iteraciones diagnosticar correctamente (se confundió inicialmente con el trabajo de `react-native-paper-dates`, que ya se había revertido); Bitácora no se había actualizado desde el inicio del proyecto |
