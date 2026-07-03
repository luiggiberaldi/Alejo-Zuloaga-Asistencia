---
description: "Imports ordenados y sin ciclos"
paths: "**/*.{ts,tsx}"
---

# Higiene de imports

- Prohibido importar con `* as` (namespace import), **excepto** en librerías que lo requieran explícitamente (ej: `import * as XLSX from 'xlsx'`).
- Imports agrupados siempre en este orden, con **una línea en blanco entre cada grupo**:
  1. React y React Native (`react`, `react-native`)
  2. Librerías externas (expo-*, supabase, zustand, react-native-paper, etc.)
  3. Módulos internos del proyecto (`src/...`)
  4. Tipos (`import type { ... }`)
- Prohibidos los **imports circulares** entre módulos de dominio. Si dos módulos se necesitan mutuamente, extraer la parte compartida a un tercer módulo o a `src/types`.
- Si un archivo importa de **más de 5 módulos distintos**, evaluar si tiene demasiadas responsabilidades y considerar dividirlo.
- Preferir imports nombrados sobre default imports, en línea con la convención de named exports del proyecto.
