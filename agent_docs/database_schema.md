# Esquema de base de datos — Alejo Zuloaga Asistencia

Este documento describe el esquema **SQLite** (local, fuente de verdad) y el esquema **Supabase**
(remoto, PostgreSQL con RLS). Ambos comparten estructura; las diferencias clave son el tipo de ID
(TEXT en SQLite, UUID en Supabase) y la presencia de RLS en Supabase.

Convenciones comunes a toda tabla de dominio:
- `id TEXT PRIMARY KEY` (UUID v4 generado en cliente con `crypto.randomUUID()` / expo-crypto)
- `synced INTEGER DEFAULT 0` (0 = pendiente de sincronizar, 1 = sincronizado) — solo en SQLite
- `created_at INTEGER` y `updated_at INTEGER` (epoch en milisegundos)

---

## Esquema SQLite (local)

### sections
```sql
CREATE TABLE sections (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  year_level  TEXT NOT NULL,          -- '1ro' | '2do' | '3ro' | '4to' | '5to'
  teacher_id  TEXT NOT NULL,          -- user_id del profesor dueño
  synced      INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
```

### students
```sql
CREATE TABLE students (
  id          TEXT PRIMARY KEY,
  section_id  TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  cedula      TEXT NOT NULL,          -- sin puntos ni guiones
  nombres     TEXT NOT NULL,          -- primer y segundo nombre
  apellidos   TEXT NOT NULL,          -- primer y segundo apellido
  synced      INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX idx_students_section ON students(section_id);
```

### attendance_records
```sql
CREATE TABLE attendance_records (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,          -- 'YYYY-MM-DD'
  status      TEXT NOT NULL CHECK (status IN ('presente', 'ausente')),
  synced      INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE(student_id, date)            -- una marca por estudiante por día
);
CREATE INDEX idx_attendance_student_date ON attendance_records(student_id, date);
```

### behavior_reports
```sql
CREATE TABLE behavior_reports (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  severity     TEXT DEFAULT 'leve' CHECK (severity IN ('leve', 'moderado', 'grave')),
  date         TEXT NOT NULL,         -- 'YYYY-MM-DD'
  synced       INTEGER DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
```

### outbox
```sql
CREATE TABLE outbox (
  id               TEXT PRIMARY KEY,
  entity           TEXT NOT NULL,     -- 'section' | 'student' | 'attendance' | 'behavior'
  entity_id        TEXT NOT NULL,
  op               TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
  payload          TEXT NOT NULL,     -- JSON serializado del registro
  idempotency_key  TEXT NOT NULL UNIQUE,
  created_at       INTEGER NOT NULL,
  attempts         INTEGER DEFAULT 0,
  last_error       TEXT
);
CREATE INDEX idx_outbox_created ON outbox(created_at);
```

### sync_meta
```sql
CREATE TABLE sync_meta (
  key    TEXT PRIMARY KEY,           -- ej: 'last_pull_cursor'
  value  TEXT NOT NULL
);
```

---

## Esquema Supabase (remoto, PostgreSQL)

Mismas tablas con `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ` y
`updated_at TIMESTAMPTZ`. No existe la columna `synced` (concepto exclusivamente local). Todas las
tablas tienen **RLS habilitada** (ver [roles_and_permissions.md](roles_and_permissions.md)).

### user_roles
```sql
CREATE TABLE user_roles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('profesor', 'coordinador')),
  year_level  TEXT NOT NULL,         -- '1ro'..'5to' o 'todos'
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

Las tablas `sections`, `students`, `attendance_records` y `behavior_reports` replican la estructura
de SQLite con tipos PostgreSQL (`UUID`, `TIMESTAMPTZ`, `TEXT`), manteniendo las mismas restricciones
`CHECK` y `UNIQUE(student_id, date)`.

---

## Migraciones (supabase/migrations/)

Numeradas secuencialmente; nunca editar una ya aplicada.

| Archivo                             | Contenido                                            |
|-------------------------------------|------------------------------------------------------|
| `001_create_user_roles.sql`         | Tabla `user_roles`                                   |
| `002_create_sections.sql`           | Tabla `sections`                                     |
| `003_create_students.sql`           | Tabla `students` + índice por sección                |
| `004_create_attendance_records.sql` | Tabla `attendance_records` + índice + UNIQUE         |
| `005_create_behavior_reports.sql`   | Tabla `behavior_reports`                             |
| `006_create_rls_policies.sql`       | RLS policies para profesor y coordinador             |

## Índices y constraints clave

- `attendance_records(student_id, date)` — acelera consultas de asistencia y aplica `UNIQUE`.
- `students(section_id)` — acelera el listado de estudiantes por sección.
- `outbox(created_at)` — procesamiento del outbox en orden FIFO.
- `UNIQUE(student_id, date)` en `attendance_records` — evita marcas duplicadas el mismo día.
- `UNIQUE(idempotency_key)` en `outbox` — refuerza la idempotencia de la sincronización.
