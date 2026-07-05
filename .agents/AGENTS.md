# Memoria de Desarrollo y Contexto — Alejo Zuloaga Asistencia

Este archivo contiene el estado actual del proyecto, las decisiones clave de diseño, el historial de cambios realizados y los próximos pasos planificados para que cualquier sesión de IA mantenga un contexto continuo y coherente.

## 📌 Contexto del Proyecto
* **Nombre:** Alejo Zuloaga Asistencia
* **Cliente:** Complejo Educativo Alejo Zuloaga (Liceo Público en Valencia, Carabobo, Venezuela)
* **Objetivo:** Aplicación móvil offline-first (Android) para que los docentes pasen asistencia y registren conductas sin dependencia directa de internet, con sincronización manual a la nube (Supabase).
* **Usuario de Prueba (Docente):** `profesor@prueba.com` / `123456789` (ID de Supabase: `3d327841-7b14-4ee7-b3c2-fca0ce44a5db`).
* **Costo Acordado:** 150$ pago único por MVP.

## ⚙️ Decisiones Clave de Arquitectura e Infraestructura
1. **Offline-First:** SQLite local es la fuente de verdad. El outbox encola las operaciones locales para sincronizar cuando el docente use el botón de "Sincronizar".
2. **Postgres RLS + Cascade Delete:** Las tablas en Supabase tienen políticas RLS restrictivas para el rol `profesor` y poseen `ON DELETE CASCADE` para eliminar datos relacionados automáticamente cuando se borra un estudiante o sección.
3. **Limpieza en SQLite Local:** Dado que `expo-sqlite` no activa la integridad referencial (`foreign_keys = OFF`) por defecto, el borrado en cascada se realiza programáticamente en los repositorios locales.
4. **Seguridad contra cuelgues de inicialización (Splash Screen):**
   * El cliente de Supabase no debe lanzar excepciones de inicialización de nivel superior si faltan las variables de entorno. Se agregaron valores fallback (`placeholder`) en `src/services/supabase/client.ts`.
   * El archivo `app.config.js` lee directamente `.env.local` al compilar la APK de producción para asegurar que las credenciales queden embebidas en el bundle de JavaScript incluso si la terminal del build no tiene las variables de entorno definidas.
5. **Limpieza de Datos al Cerrar Sesión (Seguridad & Consistencia):**
   * Al cerrar sesión, la base de datos SQLite local se vacía completamente (`DELETE FROM` en todas las tablas). Esto evita fugas de información entre diferentes docentes que usen el mismo dispositivo.
   * Si existen cambios pendientes en el `outbox` al cerrar sesión, se advierte al usuario con opciones para sincronizar primero o continuar perdiendo los cambios locales. Esto previene que se queden cambios "huérfanos" en el dispositivo que luego se intenten sincronizar bajo otra cuenta de usuario.

## 🛠️ Historial de Tareas y Cambios Recientes
* **Descarga de PDFs en Android (SAF):** Integración nativa de Storage Access Framework para descargar PDFs permanentemente y envío estructurado a la caché temporal para compartir por WhatsApp.
* **Edición de Estudiantes:** Modal y flujo de edición completo local y outbox.
* **Resumen Diario y Nombres de Reportes:** Estructura de nombres limpia con guiones y fechas en formato `DD-MM-YYYY`.
* **Escudo e Inlining del Logo:** El logotipo escolar oficial está embebido como una cadena Base64 en `src/services/pdf/logo-base64.ts` y se muestra centrado con Flexbox en todas las cabeceras de PDF.
* **Indicador de Asistencia y Barra de Chips:** Chips interactivos para filtrado rápido por grado en la pantalla de inicio y distintivo "Asistencia Tomada".
* **Sincronización en Lote (Bulk Push):** El `sync-manager` procesa eventos del outbox agrupándolos por entidad y operación, reduciendo las llamadas de red. Tiene fallback uno-a-uno automático si falla un lote (por ejemplo, por RLS).
* **Consistencia de Borrados:** Al borrar una sección o estudiante, se eliminan localmente sus hijos (asistencia/conducta), se limpian eventos `upsert` pendientes en el `outbox` y se encola un evento `delete` ordenado.
* **Resolución de Error Splash Screen APK:** Se añadieron las protecciones contra errores de inicialización en `src/services/supabase/client.ts` y la lectura manual de `.env.local` en `app.config.js` durante el empaquetado.
* **Control y Limpieza en Cierre de Sesión:** Implementación de `clearAllLocalData` para vaciar las tablas de SQLite en el logout y advertencias interactivas de cambios pendientes en [ajustes.tsx](file:///c:/Users/luigg/Desktop/demo%20app liceo/app/%28tabs%29/ajustes.tsx).

## 🚀 Próximos Pasos Recomendados
1. **Prueba de la Nueva APK:** Instalar la nueva compilación APK en dispositivos de prueba y verificar que ya no se queda congelada en la pantalla de carga inicial.
2. **Simulación de Sincronización Manual:** Iniciar sesión, borrar una sección o estudiante localmente, y pulsar el botón de nube en la barra de sincronización para validar que se eliminen completamente de Supabase.
3. **Evaluación de Cierre de Sesión:** Probar cerrar sesión con cambios pendientes para verificar la alerta y la correcta limpieza del almacenamiento local.
