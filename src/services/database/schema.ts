import { logger } from '@/services/logger';

import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS sections (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  year_level  TEXT NOT NULL,
  teacher_id  TEXT NOT NULL,
  synced      INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id          TEXT PRIMARY KEY,
  section_id  TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  cedula      TEXT NOT NULL,
  nombres     TEXT NOT NULL,
  apellidos   TEXT NOT NULL,
  synced      INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section_id);

CREATE TABLE IF NOT EXISTS attendance_records (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('presente', 'ausente')),
  synced      INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE(student_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);

CREATE TABLE IF NOT EXISTS behavior_reports (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  severity     TEXT DEFAULT 'leve' CHECK (severity IN ('leve', 'moderado', 'grave')),
  date         TEXT NOT NULL,
  synced       INTEGER DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id               TEXT PRIMARY KEY,
  entity           TEXT NOT NULL,
  entity_id        TEXT NOT NULL,
  op               TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
  payload          TEXT NOT NULL,
  idempotency_key  TEXT NOT NULL UNIQUE,
  created_at       INTEGER NOT NULL,
  attempts         INTEGER DEFAULT 0,
  last_error       TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at);

CREATE TABLE IF NOT EXISTS sync_meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
`;

// Se pasa como onInit a <SQLiteProvider>: se ejecuta una vez que el provider
// abre la conexión. Ver agent_docs/database_schema.md para el esquema completo.
export async function initSchema(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(SCHEMA_SQL);
  } catch (error) {
    logger.error('Error inicializando el esquema SQLite', error);
    throw error;
  }
}
