---
description: "Patrones de Supabase: cliente, tipos, RLS"
paths: "src/services/supabase/**/*.ts, supabase/migrations/**/*.sql"
---

# Patrones de Supabase

- Toda tabla de Supabase debe tener **Row Level Security (RLS)** habilitada con policies explícitas por rol (`profesor` / `coordinador`). Ninguna tabla queda abierta sin policy.
- Tipos de la base de datos generados con:
  ```
  supabase gen types typescript --project-id <id> > src/types/supabase_types.ts
  ```
  Este archivo es generado automáticamente; no editarlo a mano.
- Cliente Supabase como **singleton** en `src/services/supabase/client.ts`. Ningún otro archivo debe crear una instancia propia de `createClient`.
- **NUNCA** exponer la `service_role key` en el cliente móvil. Solo se usa `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Variables de entorno: `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, leídas desde `.env` (desarrollo) o EAS secrets (producción).
- Auth configurado con `AsyncStorage` como storage adapter para persistir la sesión entre reinicios de la app.
- Migraciones numeradas secuencialmente en `supabase/migrations/`: `001_`, `002_`, `003_`, etc. Nunca reordenar ni renombrar migraciones ya aplicadas; los cambios de esquema van en una migración nueva.
- Toda query desde la app pasa por el Repository correspondiente (`src/modules/*/repository.ts`), nunca se llama a `supabase.from(...)` directamente desde un componente.
