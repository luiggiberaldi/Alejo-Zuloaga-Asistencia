# CLAUDE.md — Alejo Zuloaga Asistencia

## WHAT (Qué es)

**Proyecto:** Alejo Zuloaga Asistencia
**Cliente:** Complejo Educativo Alejo Zuloaga (liceo público, Valencia, Carabobo, Venezuela)
**Plataforma:** Android únicamente

**Stack:**
- Expo (SDK 52+) + React Native + TypeScript
- expo-router (navegación file-based)
- Supabase (Auth + PostgreSQL + RLS)
- expo-sqlite (persistencia local offline-first)
- Zustand (estado global)
- React Native Paper (componentes UI)
- SheetJS / xlsx (importación de estudiantes)
- expo-document-picker, expo-file-system (selección y lectura de archivos)
- expo-print, expo-sharing (generación y envío de PDF)
- react-native-gesture-handler (long press en estudiantes)
- @react-native-community/netinfo (detección de conexión)

**Estructura de directorios:**
```
app/                    Rutas (expo-router)
src/modules/            Lógica de dominio: auth, sections, students, attendance, reports, sync
src/services/           Integraciones: supabase, database (sqlite), sync, pdf
src/store/              Zustand stores
src/components/ui/      Componentes UI reutilizables
src/types/              Tipos TypeScript compartidos
supabase/migrations/    Migraciones SQL numeradas
agent_docs/             Documentación arquitectónica profunda
assets/templates/       Plantillas de PDF y Excel
```

## WHY (Por qué)

- **Offline-first:** los liceos públicos tienen conectividad inestable. SQLite es la fuente de verdad; la app debe funcionar 100% sin internet durante la jornada escolar.
- **Botón "Sincronizar" manual:** el docente decide cuándo subir datos (fin del día), evitando sincronizaciones automáticas que consuman datos móviles o fallen a mitad de clase.
- **Solo Android:** requisito explícito del cliente; los docentes usan dispositivos Android de gama baja/media.
- **Supabase:** backend gestionado con Auth + PostgreSQL + Row Level Security, evita mantener servidor propio con recursos limitados del liceo.
- **Expo + EAS Build:** permite generar APK/AAB nativos sin configurar toolchain de Android Studio localmente.

## HOW (Cómo trabajar)

**Comandos:**
```
npx expo start
npx expo run:android
npx tsc --noEmit
npx eslint --fix .
npx eas build --platform android --profile preview
```

**Convenciones:**
- TypeScript estricto (`strict: true`), sin `any` sin justificación
- Named exports (no default exports en módulos de lógica)
- Módulos de dominio aislados en `src/modules/*`, sin imports cruzados directos
- snake_case en SQL (SQLite y Supabase), camelCase en TypeScript
- Documentación profunda en [agent_docs/](agent_docs/) — consultar antes de tocar arquitectura, sync, roles o plantillas

## WORKFLOW OBLIGATORIO

Antes de escribir código en cualquier tarea:

1. **PLAN:** Presentar un plan paso a paso con archivos a crear/editar y archivos a NO tocar
2. **WAIT:** Esperar aprobación del desarrollador antes de implementar
3. **IMPLEMENT:** Escribir código en pequeños incrementos
4. **VERIFY:** Ejecutar typecheck (`npx tsc --noEmit`) y linter (`npx eslint --fix .`)
5. **SUMMARY:** Resumen de cambios + archivos modificados + próximos pasos

## GESTIÓN DE CONTEXTO

- Una tarea = una sesión de Claude Code
- Si el contexto supera 60% de capacidad, iniciar sesión nueva con resumen de la anterior
- Al cerrar una sesión, generar un resumen en [BITACORA.md](BITACORA.md) con: qué se hizo, qué falta, qué problemas surgieron

## ÁREAS PROHIBIDAS (Do-Not-Touch)

Sin autorización explícita, NO modificar:

- `CLAUDE.md` y archivos en `.claude/`
- `supabase/migrations/` ya aplicadas (crear nuevas, no editar existentes)
- `agent_docs/` (documentación arquitectónica)
- `BITACORA.md` (solo el desarrollador actualiza el registro)
- Esquema SQLite existente (cambios requieren migration nueva)
- Archivos en `assets/templates/` (plantillas de PDF)

## REGLAS DE CALIDAD

- Ningún archivo de código puede superar 600 líneas
- Si un archivo alcanza 500 líneas, añadir comentario: `// ⚠️ Este archivo se acerca al límite de 600 líneas. Considerar refactorización.`
- Si supera 600 líneas, es OBLIGATORIO refactorizar antes de continuar
- Un commit = un objetivo. Máximo 200 líneas cambiadas por commit
- Mensaje de commit: `[Fase X] tipo: descripción concisa`
- Prohibido: `console.log` en producción, datos mock en componentes, imports circulares

## REFERENCIAS

- Arquitectura completa: [agent_docs/architecture.md](agent_docs/architecture.md)
- Esquema de base de datos: [agent_docs/database_schema.md](agent_docs/database_schema.md)
- Sincronización offline: [agent_docs/offline_sync.md](agent_docs/offline_sync.md)
- Roles y permisos: [agent_docs/roles_and_permissions.md](agent_docs/roles_and_permissions.md)
- Plantilla Excel: [agent_docs/excel_template.md](agent_docs/excel_template.md)
- Plantillas PDF: [agent_docs/pdf_templates.md](agent_docs/pdf_templates.md)
- Guía UI/UX: [agent_docs/ui_ux_guidelines.md](agent_docs/ui_ux_guidelines.md)
- Despliegue: [agent_docs/deployment.md](agent_docs/deployment.md)
- Checklist de revisión: [agent_docs/review_checklist.md](agent_docs/review_checklist.md)
- Anti-patrones: [agent_docs/anti_patterns.md](agent_docs/anti_patterns.md)
- Reglas específicas por ruta: [.claude/rules/](.claude/rules/)

Nota: reglas de estilo de código (formato, orden de imports fino, etc.) las gestionan ESLint + Prettier, no este archivo. Instrucciones específicas de una tarea puntual van en `.claude/rules/`, no aquí.
