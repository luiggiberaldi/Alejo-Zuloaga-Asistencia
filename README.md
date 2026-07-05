# Alejo Zuloaga Asistencia

Aplicación móvil Android para la toma de asistencia y registro de comportamiento estudiantil del **Complejo Educativo Alejo Zuloaga** (liceo público, Valencia, Carabobo, Venezuela). Diseñada **offline-first**: funciona completamente sin conexión durante la jornada escolar y sincroniza con la nube solo cuando el docente lo decide.

> Consulta [PROPUESTA.md](PROPUESTA.md) para la propuesta de piloto institucional y [BITACORA.md](BITACORA.md) para el historial de desarrollo.

---

## Índice

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Testing](#testing)
- [Arquitectura](#arquitectura)
- [Base de datos](#base-de-datos)
- [Build y despliegue](#build-y-despliegue)
- [Flujo de trabajo de desarrollo](#flujo-de-trabajo-de-desarrollo)
- [Documentación adicional](#documentación-adicional)

---

## Características

- **Gestión de secciones y estudiantes** — creación de secciones por año/sección, importación masiva de estudiantes desde Excel (`.xls`/`.xlsx`) o registro manual.
- **Toma de asistencia diaria** — marcar Presente/Ausente por estudiante, con navegación entre fechas (incluye edición de días pasados) y auto-scroll al siguiente estudiante al completar la tarjeta visible.
- **Registro de comportamiento** — observaciones por estudiante con nivel de severidad (leve/moderado/grave), asociadas a una fecha.
- **Modal de finalización** — al completar la asistencia de una sección, resumen de presentes/ausentes con acciones directas: subir a la nube, descargar resumen en PDF, o compartir.
- **Reportes en PDF** — reporte individual por estudiante, por sección o resumen diario, con membrete institucional, generados localmente y listos para guardar o compartir.
- **100% offline-first** — SQLite local como fuente de verdad; ninguna pantalla espera respuesta de red. Sincronización manual mediante un botón dedicado (push del outbox + pull de cambios remotos), evitando consumo de datos o fallos a mitad de clase.
- **Roles diferenciados** — vistas distintas para `profesor` y `coordinador` (ver [roles_and_permissions.md](agent_docs/roles_and_permissions.md)).
- **Auto-pull en dispositivo nuevo** — si un docente instala la app en un dispositivo nuevo y su cuenta ya tiene datos en la nube, se descargan automáticamente al iniciar sesión.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Expo (SDK 57) + React Native 0.86 + TypeScript |
| Navegación | expo-router (file-based routing) |
| Backend remoto | Supabase (Auth + PostgreSQL + Row Level Security) |
| Persistencia local | expo-sqlite (offline-first, fuente de verdad) |
| Estado global | Zustand |
| UI | React Native Paper |
| Importación de datos | SheetJS (`xlsx`) + expo-document-picker |
| Generación de PDF | expo-print + expo-sharing |
| Testing | Jest + jest-expo |
| Build / distribución | EAS Build |

Plataforma soportada: **Android únicamente** (requisito explícito del cliente).

---

## Estructura del proyecto

```
app/                    Rutas (expo-router) — pantallas y navegación
src/modules/            Lógica de dominio: auth, sections, students, attendance, behavior, reports, sync
src/services/           Integraciones: supabase, database (sqlite), sync, pdf, logger
src/store/              Stores de Zustand
src/components/ui/      Componentes UI reutilizables
src/types/              Tipos TypeScript compartidos (incluye tipos generados de Supabase)
supabase/migrations/    Migraciones SQL numeradas (nunca editar una ya aplicada)
supabase/seed.sql       Datos de prueba para el entorno remoto
scripts/                Scripts de utilidad (seed de usuarios de prueba, generación de datos de prueba)
assets/                 Íconos, splash, logo institucional
agent_docs/             Documentación arquitectónica profunda (ver índice abajo)
```

---

## Requisitos previos

- Node.js LTS y npm
- Un dispositivo Android físico o emulador (la app es Android-only)
- Cuenta de [Supabase](https://supabase.com) con un proyecto creado
- Para builds nativos: [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`) o Android Studio/SDK si se compila localmente con `expo run:android`

---

## Instalación

```bash
git clone <url-del-repositorio>
cd "demo app liceo"
npm install
```

Configura las variables de entorno (ver sección siguiente) y aplica las migraciones de Supabase:

```bash
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

Luego inicia el servidor de desarrollo:

```bash
npx expo start
```

> Nota: por limitaciones de Expo Go con módulos nativos (ver [Lecciones Aprendidas en BITACORA.md](BITACORA.md)), se recomienda usar un **development build** (`npx expo run:android` o un build de EAS con perfil `development`) para pruebas confiables, en vez de Expo Go.

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```
EXPO_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

Estas son las únicas credenciales que debe conocer el cliente móvil. **Nunca** exponer la `service_role key` en el proyecto ni en el cliente — solo se usa puntualmente en scripts de servidor (ver `scripts/seed-test-users.ts`, que la solicita por variable de entorno en tiempo de ejecución).

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run android` | Compila e instala un build nativo en un dispositivo/emulador Android conectado |
| `npm run lint` | Corre ESLint sobre todo el proyecto |
| `npm run typecheck` | Verifica tipos con `tsc --noEmit` |
| `npm test` | Corre la suite de tests con Jest |

---

## Testing

El proyecto usa **Jest** con el preset `jest-expo`. La suite actual cubre la lógica más crítica del proyecto: `src/services/sync/sync-manager.ts` (push del outbox, manejo de errores 401/403, y pull con cursor incremental).

```bash
npm test
```

Los tests mockean las dependencias externas (Supabase, SQLite, NetInfo) para ser deterministas y no requerir un dispositivo o base de datos real.

---

## Arquitectura

Patrón **offline-first con cola de sincronización (outbox)**:

1. Toda escritura de dominio (sección, estudiante, asistencia, comportamiento) se guarda primero en SQLite local y genera un evento en la tabla `outbox` dentro de la misma transacción.
2. Al presionar el botón "Sincronizar", el `SyncManager` procesa el outbox (push a Supabase) y luego descarga cambios remotos (pull), actualizando el cursor de sincronización.
3. Resolución de conflictos: *last-write-wins* comparando `updated_at`.
4. Errores 401 (sesión expirada) cierran la sesión; errores 403 (RLS) se registran como fallo individual sin abortar el resto de la cola.

Detalle completo del algoritmo en [agent_docs/offline_sync.md](agent_docs/offline_sync.md) y de la arquitectura general en [agent_docs/architecture.md](agent_docs/architecture.md).

---

## Base de datos

Esquema espejado entre SQLite (local) y PostgreSQL/Supabase (remoto): `sections`, `students`, `attendance_records`, `behavior_reports`, más `outbox` y `sync_meta` (solo locales) y `user_roles` (solo remoto). Todas las tablas remotas tienen Row Level Security habilitada con políticas por rol.

Ver el esquema completo en [agent_docs/database_schema.md](agent_docs/database_schema.md).

---

## Build y despliegue

Builds nativos gestionados con **EAS Build** (perfiles `preview` y `production` en `eas.json`), evitando configurar el toolchain de Android Studio localmente:

```bash
eas build --platform android --profile preview      # build de prueba / distribución interna
eas build --platform android --profile production   # build de producción
```

Pasos completos de despliegue (incluyendo generación de assets de marca y seed de usuarios) en [agent_docs/deployment.md](agent_docs/deployment.md).

---

## Flujo de trabajo de desarrollo

Este proyecto sigue un flujo de trabajo estricto documentado en [CLAUDE.md](CLAUDE.md), entre otras:

- **Un commit = un objetivo**, máximo 200 líneas cambiadas por commit, formato `[Fase X] tipo: descripción`.
- Ningún archivo de código puede superar 600 líneas.
- TypeScript estricto, sin `any` sin justificación; named exports; sin imports circulares.
- Prohibido `console.log` en producción y datos mock fuera de `__DEV__`.
- Antes de tocar arquitectura, sincronización, roles o plantillas: consultar `agent_docs/`.

---

## Documentación adicional

| Documento | Contenido |
|---|---|
| [agent_docs/architecture.md](agent_docs/architecture.md) | Arquitectura completa |
| [agent_docs/database_schema.md](agent_docs/database_schema.md) | Esquema de base de datos |
| [agent_docs/offline_sync.md](agent_docs/offline_sync.md) | Algoritmo de sincronización offline |
| [agent_docs/roles_and_permissions.md](agent_docs/roles_and_permissions.md) | Roles y permisos |
| [agent_docs/excel_template.md](agent_docs/excel_template.md) | Plantilla de importación Excel |
| [agent_docs/pdf_templates.md](agent_docs/pdf_templates.md) | Plantillas de PDF |
| [agent_docs/ui_ux_guidelines.md](agent_docs/ui_ux_guidelines.md) | Guía de UI/UX institucional |
| [agent_docs/deployment.md](agent_docs/deployment.md) | Despliegue con EAS Build |
| [agent_docs/anti_patterns.md](agent_docs/anti_patterns.md) | Anti-patrones a evitar |
| [agent_docs/review_checklist.md](agent_docs/review_checklist.md) | Checklist de revisión |
| [BITACORA.md](BITACORA.md) | Historial de desarrollo, decisiones técnicas y lecciones aprendidas |
| [PROPUESTA.md](PROPUESTA.md) | Propuesta de piloto institucional |

---

## Licencia

Proyecto privado, desarrollado para el Complejo Educativo Alejo Zuloaga. Todos los derechos reservados.
