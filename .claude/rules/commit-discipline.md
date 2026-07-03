---
description: "Disciplina de commits pequeños y descriptivos"
paths: "**/*"
---

# Disciplina de commits

- **Un commit = un objetivo** (un feature, un fix, o un refactor). Nunca mezclar varios objetivos en un mismo commit.
- Antes de cada commit: ejecutar `npx tsc --noEmit` y corregir todos los errores de tipos.
- Formato del mensaje: `[Fase X] tipo: descripción concisa`.
  - Ejemplo válido: `[Fase 2] feat: crear formulario de registro de estudiante`
  - Ejemplo válido: `[Fase 4] fix: evitar duplicados en outbox con idempotency_key`
- Prohibidos mensajes vagos: `cambios`, `update`, `fix varios`, `wip`.
- Máximo **200 líneas cambiadas por commit**. Si un cambio supera ese límite, dividirlo en commits más pequeños e independientes.
- Cada commit debe dejar el proyecto en estado compilable (`tsc` sin errores).
