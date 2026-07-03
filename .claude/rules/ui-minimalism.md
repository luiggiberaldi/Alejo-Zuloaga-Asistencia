---
description: "Reglas de UI minimalista para docentes"
paths: "src/components/**/*.tsx, app/**/*.tsx"
---

# UI minimalista para docentes

- Máximo **3 acciones** visibles por pantalla. Si se necesitan más, agrupar en un menú contextual (long press) en vez de agregar botones.
- Botones con altura mínima de **48dp** (área táctil accesible para docentes de todas las edades).
- Texto legible: tamaño mínimo **16sp** en toda la app.
- Navegación principal por **tabs inferiores** (Inicio, Reportes). Prohibido usar menú hamburguesa o drawer.
- Toda acción destructiva (eliminar estudiante, eliminar sección) requiere confirmación explícita con `Alert.alert` (título + mensaje + botones cancelar/confirmar).
- Estados vacíos (sin secciones, sin estudiantes) deben mostrar una ilustración simple + texto guía con la acción a seguir (ej: "No hay secciones. Crea la primera con el botón +").
- Usar la paleta de colores institucional del liceo definida en [agent_docs/ui_ux_guidelines.md](../../agent_docs/ui_ux_guidelines.md); no introducir colores ad-hoc.
- Toda interacción relevante (crear, guardar, sincronizar, eliminar) debe dar feedback visual inmediato: snackbar, toast o indicador de carga.
- Objetivo de diseño: cualquier acción del docente debe completarse en **3 taps o menos**.
