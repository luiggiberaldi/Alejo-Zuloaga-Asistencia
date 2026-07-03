# ARQUITECTURA — Alejo Zuloaga Asistencia

Versión ejecutiva. Para el detalle profundo ver [agent_docs/](agent_docs/).

## Resumen del proyecto

Alejo Zuloaga Asistencia es una app Android (Expo + React Native) para el Complejo Educativo Alejo
Zuloaga, liceo público de Valencia, Carabobo. Permite a los docentes registrar asistencia diaria,
reportar comportamiento y generar reportes en PDF, con una interfaz minimalista pensada para docentes
de cualquier edad (objetivo: 3 taps o menos por acción).

Es **offline-first**: dado que la conectividad en los liceos públicos es inestable, SQLite es la
fuente de verdad y la app funciona al 100% sin internet durante la jornada. La sincronización con
Supabase (PostgreSQL + Auth + RLS) es **manual**: el docente presiona "Sincronizar" al final del día.
Se usa un patrón **Outbox** con `idempotency_key` para sincronizar sin duplicados ante reintentos.

Hay dos roles: **profesor** (opera secciones, estudiantes y asistencia) y **coordinador** (supervisa
y exporta reportes de todos los profesores de su año). Row Level Security en Supabase impone estos
permisos a nivel de base de datos.

## Stack tecnológico y justificación

| Tecnología                       | Justificación                                                        |
|----------------------------------|----------------------------------------------------------------------|
| Expo (SDK 52+) + React Native    | Build Android nativo con EAS sin toolchain local de Android Studio   |
| TypeScript (strict)              | Seguridad de tipos; menos bugs en un equipo pequeño                  |
| expo-router                      | Navegación file-based, simple y sin configuración manual de rutas    |
| Supabase                         | Backend gestionado: Auth + PostgreSQL + RLS, sin servidor propio     |
| expo-sqlite                      | Persistencia local: fuente de verdad offline-first                   |
| Zustand                          | Estado global con mínimo boilerplate                                 |
| React Native Paper               | Componentes UI accesibles y consistentes                            |
| SheetJS (xlsx)                   | Importación de estudiantes desde .XLS                                |
| expo-print + expo-sharing        | Generación y envío de reportes PDF                                   |
| @react-native-community/netinfo  | Detección de conexión antes de sincronizar                          |

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

## Estructura de directorios

```
alejo-zuloaga-asistencia/
├── CLAUDE.md
├── ARQUITECTURA.md
├── BITACORA.md
├── .env.example
├── .claudeignore
├── .claude/
│   ├── settings.json
│   └── rules/
├── agent_docs/
├── app/                    Rutas (expo-router)
├── src/
│   ├── modules/            auth, sections, students, attendance, reports, sync
│   ├── services/           supabase, database, sync, pdf
│   ├── store/              Zustand stores
│   ├── components/ui/      Componentes reutilizables
│   └── types/              Tipos compartidos
├── supabase/
│   └── migrations/         001..006 SQL
└── assets/
    ├── images/             icon, splash
    └── templates/          plantillas Excel y PDF
```

## Decisiones clave

| Decisión                     | Alternativa            | Justificación                                           |
|------------------------------|------------------------|---------------------------------------------------------|
| SQLite como fuente de verdad | Fetch directo a API    | Conectividad inestable; la app debe operar 100% offline |
| Sincronización manual        | Sync automática        | El docente controla el consumo de datos móviles         |
| Patrón Outbox + idempotency  | Escritura directa      | Sincronización confiable sin duplicados en reintentos   |
| Repository pattern           | Queries en componentes | Aísla dominio de la fuente de datos; testeable          |
| Zustand                      | Redux                  | Menos boilerplate para un alcance minimalista           |
| Supabase                     | Backend propio         | Auth + Postgres + RLS gestionados, sin mantener servidor|
| Solo Android                 | Multiplataforma        | Requisito explícito del cliente                         |

## Para profundizar

Ver [agent_docs/architecture.md](agent_docs/architecture.md),
[agent_docs/database_schema.md](agent_docs/database_schema.md),
[agent_docs/offline_sync.md](agent_docs/offline_sync.md) y
[agent_docs/roles_and_permissions.md](agent_docs/roles_and_permissions.md).
