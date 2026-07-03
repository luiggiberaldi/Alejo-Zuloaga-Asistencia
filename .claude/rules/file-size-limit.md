---
description: "Límite de 600 líneas por archivo de código"
paths: "**/*.{ts,tsx,js,jsx,sql}"
---

# Límite de tamaño de archivo (600 líneas)

- **NINGÚN** archivo de código puede superar **600 líneas**.
- Si un archivo alcanza **500 líneas**, añadir en la parte superior el comentario:
  `// ⚠️ Este archivo se acerca al límite de 600 líneas. Considerar refactorización.`
- Si un archivo supera **600 líneas**, es **OBLIGATORIO refactorizar antes de continuar** con cualquier otra tarea.
- Estrategias de refactorización recomendadas:
  - Extraer funciones auxiliares a un archivo `utils.ts` hermano.
  - Extraer subcomponentes a archivos propios.
  - Mover tipos e interfaces a `types.ts`.
  - Dividir hooks grandes en hooks más pequeños y componibles.
- Excepciones al límite:
  - Migraciones SQL (DDL puro) en `supabase/migrations/`.
  - Tipos generados automáticamente (`src/types/supabase_types.ts`).
- Principio: **un archivo = una responsabilidad principal**.
- Los comentarios no cuentan para el límite; solo cuenta el código ejecutable y las declaraciones.
