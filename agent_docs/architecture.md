# Arquitectura — Alejo Zuloaga Asistencia

## Resumen del proyecto

Alejo Zuloaga Asistencia es una aplicación Android construida con Expo + React Native para el
Complejo Educativo Alejo Zuloaga, un liceo público de Valencia, Carabobo (Venezuela). Su objetivo
es permitir que los docentes registren la asistencia diaria de sus estudiantes, reporten
incidencias de comportamiento y generen reportes en PDF, todo con una interfaz minimalista pensada
para docentes de cualquier edad y nivel de familiaridad con la tecnología.

El principio rector es **offline-first**: dado que los liceos públicos tienen conectividad
inestable, la app funciona al 100% sin internet durante toda la jornada escolar. SQLite (expo-sqlite)
es la fuente de verdad local; los datos se sincronizan con Supabase (PostgreSQL + Auth + RLS) solo
cuando el docente presiona manualmente el botón "Sincronizar", típicamente al final del día. La
sincronización usa un patrón Outbox con `idempotency_key` para garantizar que los reintentos nunca
dupliquen registros.

## Diagrama de arquitectura

```
┌─────────────────────────────────────────────┐
│         App (Expo + React Native)            │
│  ┌─────────┐   ┌──────────┐   ┌─────────┐    │
│  │   UI    │   │ Zustand  │   │ Modules │    │
│  │  Layer  │──▶│  Store   │──▶│ (auth,  │    │
│  │         │   │          │   │  sect,  │    │
│  │         │   │          │   │  att,   │    │
│  │         │   │          │   │  sync)  │    │
│  └─────────┘   └──────────┘   └────┬────┘    │
│                                    │         │
│         ┌──────────────────────────▼──────┐  │
│         │       Repository Layer          │  │
│         │   (abstrae SQLite / Supabase)   │  │
│         └───────┬─────────────────┬───────┘  │
│                 │                 │          │
│         ┌───────▼────┐    ┌───────▼──────┐   │
│         │   SQLite   │    │ SyncManager  │   │
│         │  (local)   │    │  (outbox)    │   │
│         │  source of │    │  push / pull │   │
│         │   truth    │    │              │   │
│         └────────────┘    └───────┬──────┘   │
└───────────────────────────────────┼──────────┘
                                     │
                             ┌───────▼──────┐
                             │   Supabase   │
                             │   (remoto)   │
                             │  PostgreSQL  │
                             │    + RLS     │
                             └──────────────┘
```

## Flujo de datos offline (escritura durante la jornada)

1. El docente ejecuta una acción (marcar asistencia, crear estudiante, reportar comportamiento).
2. El módulo de dominio correspondiente escribe en SQLite **e inserta un evento en `outbox`** dentro
   de la **misma transacción**.
3. La UI se actualiza leyendo de SQLite, respondiendo en **menos de 100 ms**. No hay espera de red.
4. El registro queda con `synced = 0` hasta que se sincronice.

## Flujo de datos online (botón "Sincronizar")

1. El `SyncManager` verifica conexión con NetInfo.
2. **Push:** procesa la tabla `outbox` en orden de `created_at`, haciendo upsert/delete en Supabase.
3. Al confirmar cada evento, lo elimina del outbox y marca el registro local como `synced = 1`.
4. **Pull:** descarga cambios del servidor desde el último cursor guardado en `sync_meta`.
5. Actualiza el cursor en `sync_meta` y el estado de sincronización en la UI.

## Patrones arquitectónicos

- **Repository pattern:** cada módulo expone un repositorio que abstrae si el dato viene de SQLite o
  de Supabase. Los componentes nunca llaman directamente a `db` ni a `supabase.from(...)`.
- **Singleton DB client:** una única instancia de la conexión SQLite y una única del cliente Supabase.
- **Outbox pattern:** toda mutación sincronizable genera un evento idempotente encolado.
- **Store centralizado (Zustand):** estado de sesión, estado de sincronización y datos derivados de UI.

## Estructura de módulos

| Módulo       | Responsabilidad                                                        |
|--------------|------------------------------------------------------------------------|
| `auth`       | Login, sesión, rol del usuario (profesor / coordinador)                |
| `sections`   | CRUD de secciones (nombre + año)                                       |
| `students`   | CRUD de estudiantes, importación desde .XLS                            |
| `attendance` | Marcado diario de asistencia, reportes de comportamiento               |
| `reports`    | Generación de datos y PDF (individual, sección, consolidado)           |
| `sync`       | SyncManager, procesamiento de outbox, pull de cambios                  |

## Decisiones arquitectónicas y su justificación

| Decisión                            | Justificación                                                            |
|-------------------------------------|--------------------------------------------------------------------------|
| SQLite como fuente de verdad        | Conectividad inestable en liceos públicos; la app debe funcionar offline |
| Sincronización manual               | El docente controla cuándo gastar datos móviles; evita fallos a media clase |
| Patrón Outbox + idempotency_key     | Garantiza sincronización confiable sin duplicados ante reintentos        |
| Repository pattern                  | Aísla la lógica de dominio de la fuente de datos; facilita pruebas       |
| Zustand en vez de Redux             | Menor boilerplate, suficiente para el alcance minimalista de la app      |
| Solo Android                        | Requisito explícito del cliente; dispositivos de gama baja/media         |

Para más detalle, consultar [database_schema.md](database_schema.md), [offline_sync.md](offline_sync.md)
y [roles_and_permissions.md](roles_and_permissions.md).
