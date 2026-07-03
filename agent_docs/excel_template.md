# Plantilla Excel de importación — Alejo Zuloaga Asistencia

La app permite registrar estudiantes en lote importando un archivo `.XLS`/`.XLSX` con una estructura
exacta. Este documento define esa plantilla y el flujo de importación. La app muestra la plantilla
visual dentro de la pantalla de importación y permite descargarla.

## Plantilla exacta

| cedula   | nombres          | apellidos          |
|----------|------------------|--------------------|
| 28012345 | María José       | González Pérez     |
| 28012346 | Carlos Eduardo   | Rodríguez Silva    |
| 28012347 | Andrea           | Martínez López     |

## Reglas de la plantilla

- **Fila 1:** encabezados obligatorios exactos, en minúsculas: `cedula`, `nombres`, `apellidos`.
- **A partir de la fila 2:** un estudiante por fila.
- **Sin filas vacías intermedias** (una fila vacía marca el fin de los datos).
- **Columna A — `cedula`:** texto, sin puntos ni guiones (ej: `28012345`, no `28.012.345`).
- **Columna B — `nombres`:** primer y segundo nombre.
- **Columna C — `apellidos`:** primer y segundo apellido.
- **Máximo 100 filas por importación.**

## Flujo de importación (paso a paso)

1. El usuario presiona el botón **"Importar .XLS"** en la pantalla de la sección.
2. `expo-document-picker` abre el selector de archivos del dispositivo.
3. `expo-file-system.readAsStringAsync(uri, { encoding: 'base64' })` lee el archivo.
4. `XLSX.read(data, { type: 'base64' })` parsea el workbook (SheetJS).
5. `XLSX.utils.sheet_to_json(sheet)` convierte la primera hoja a un array de objetos.
6. **Validaciones:**
   - Existen exactamente las 3 columnas esperadas (`cedula`, `nombres`, `apellidos`).
   - No hay celdas vacías en ninguna fila de datos.
   - `cedula` es texto válido (solo dígitos, sin puntos ni guiones).
   - No hay cédulas duplicadas dentro del archivo.
   - No se superan las 100 filas.
7. Se muestra un **preview** con la lista de estudiantes detectados para revisión.
8. El usuario confirma → **batch insert** en SQLite + inserción de eventos en `outbox`, todo dentro
   de una **transacción**.
9. Feedback: "X estudiantes importados correctamente".

## Manejo de errores

| Error                          | Mensaje / acción                                             |
|--------------------------------|-------------------------------------------------------------|
| El archivo no es .XLS/.XLSX    | "Archivo no válido. Usa la plantilla .XLS."                 |
| Falta una columna              | "Falta la columna: `<nombre>`. Revisa los encabezados."     |
| Celda vacía                    | "Fila N: falta `<campo>`. Completa todos los datos."        |
| Cédula con formato inválido    | "Fila N: la cédula debe ser solo números, sin puntos."      |
| Cédula duplicada en el archivo | "Cédula `<valor>` repetida en las filas N y M."             |
| Más de 100 filas               | "Máximo 100 estudiantes por importación."                   |

En todos los casos de error, **no se inserta nada** en SQLite: la importación es atómica (todo o nada).

Ver la regla [.claude/rules/sqlite-offline.md](../.claude/rules/sqlite-offline.md) para el patrón de
escritura + outbox y [ui_ux_guidelines.md](ui_ux_guidelines.md) para el componente `ImportXLSButton`.
