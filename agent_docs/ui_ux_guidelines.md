# Guía UI/UX — Alejo Zuloaga Asistencia

## Principio fundamental

**Máxima simplicidad: 3 taps o menos para cualquier acción.** La app la usan docentes de todas las
edades, muchos con poca familiaridad tecnológica. Cada pantalla muestra solo lo esencial; nada de
menús extra ni configuraciones avanzadas.

## Paleta de colores

| Rol                     | Color      | Uso                                             |
|-------------------------|------------|-------------------------------------------------|
| Primario                | `#1B5E20`  | Verde institucional (headers, botones primarios)|
| Primario claro          | `#4C8C4A`  | Estados hover/activos, acentos suaves           |
| Secundario              | `#FFD54F`  | Amarillo del logo del liceo (detalles, badges)  |
| Fondo                   | `#F5F5F5`  | Gris claro de fondo de pantallas                |
| Texto                   | `#212121`  | Casi negro, texto principal                     |
| Éxito / Presente        | `#2E7D32`  | Botón "presente", confirmaciones                |
| Peligro / Ausente       | `#C62828`  | Botón "ausente", acciones destructivas          |
| Advertencia             | `#EF6C00`  | Estado de sync parcial, alertas                 |
| Información             | `#1565C0`  | Mensajes informativos                           |

## Tipografía

- Tamaño mínimo de texto: **16sp**.
- Títulos: **20sp – 24sp**.
- Botones: **16sp, bold**.
- Fuentes del sistema (Roboto en Android). No cargar fuentes personalizadas para no aumentar el peso
  del APK ni complicar la lectura.

## Componentes clave

| Componente        | Descripción                                                                    |
|-------------------|--------------------------------------------------------------------------------|
| `StudentCard`     | Card con nombre del estudiante + dos botones (presente/ausente); long press abre menú contextual |
| `AttendanceToggle`| Dos botones grandes: verde (presente) y rojo (ausente); solo uno activo a la vez |
| `SyncButton`      | Botón en el header, ícono cloud-upload, badge con pendientes, cambia de color según estado |
| `SectionList`     | Lista de secciones con nombre, año y número de estudiantes                     |
| `StudentList`     | Lista de estudiantes de una sección, con scroll                                |
| `BehaviorModal`   | Modal con textarea de descripción + selector de severidad (leve/moderado/grave) + botón guardar |
| `ImportXLSButton` | Abre el document picker, muestra el preview y confirma la importación          |

## Navegación

- **Profesor:** tabs inferiores → **Inicio** (secciones y asistencia) y **Reportes**.
- **Coordinador:** tabs inferiores → **Inicio** (profesores/secciones de su año) y **Reportes**
  (con vistas y exportaciones distintas).
- **Sin menús hamburguesa** ni drawers.
- Navegación hacia atrás con el botón estándar del sistema / header.

## Acciones destructivas

Siempre con confirmación mediante `Alert.alert`, con título, mensaje y botones **Cancelar** /
**Confirmar**. Ejemplos: eliminar estudiante, eliminar sección.

```ts
Alert.alert(
  'Eliminar estudiante',
  '¿Seguro que deseas eliminar a este estudiante? Esta acción no se puede deshacer.',
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: onConfirmDelete },
  ],
);
```

## Estados vacíos

Ilustración simple + texto guía con la acción a seguir. Ejemplos:
- Sin secciones: "No hay secciones. Crea la primera con el botón +".
- Sin estudiantes: "Esta sección no tiene estudiantes. Agrégalos manualmente o importa un .XLS".

## Feedback

Snackbar o toast después de cada acción importante (crear sección, registrar estudiante, importar,
sincronizar). El feedback debe ser inmediato y en español claro.

## Accesibilidad

- Contraste mínimo **AA**.
- Área táctil de botones: mínimo **48dp**.
- Texto: mínimo **16sp**.
- Los dos botones de asistencia deben distinguirse por color **y** etiqueta (no solo color), para
  usuarios con dificultades de percepción cromática.

Estas guías son de cumplimiento obligatorio; ver la regla
[.claude/rules/ui-minimalism.md](../.claude/rules/ui-minimalism.md).
