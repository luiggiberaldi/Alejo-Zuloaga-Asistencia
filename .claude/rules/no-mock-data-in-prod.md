---
description: "Prohibir datos hardcodeados en producción"
paths: "src/**/*.ts, src/**/*.tsx"
---

# Prohibición de datos mock en producción

- Prohibido hardcodear datos de estudiantes, secciones, asistencias o reportes dentro de componentes o módulos.
- Todo dato mostrado en la app debe provenir de:
  - **SQLite local** (fuente de verdad offline), o
  - **Supabase** (cuando se consulta en línea, siempre vía Repository).
- Los datos de prueba para la base de datos remota van únicamente en `supabase/seed.sql`.
- Si se necesitan datos mock para desarrollo local, colocarlos en `src/services/mock.ts` y protegerlos siempre con el flag `__DEV__`, de modo que nunca lleguen a un build de producción.
- Ningún componente de UI debe contener arreglos literales de datos de dominio como fallback visible al usuario final.
