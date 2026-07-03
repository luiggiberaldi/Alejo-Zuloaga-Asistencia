import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';

import type { CreateSectionInput, Section, YearLevel } from './types';

interface SectionRow {
  id: string;
  name: string;
  year_level: YearLevel;
  teacher_id: string;
  synced: number;
  created_at: number;
  updated_at: number;
  student_count: number;
}

// Subquery de conteo: SectionCard debe mostrar el número de estudiantes sin
// que el store tenga que hacer una consulta extra por cada sección.
const SELECT_SECTIONS = `
  SELECT s.*, (SELECT COUNT(*) FROM students st WHERE st.section_id = s.id) AS student_count
  FROM sections s
`;

function mapRowToSection(row: SectionRow): Section {
  return {
    id: row.id,
    name: row.name,
    yearLevel: row.year_level,
    teacherId: row.teacher_id,
    synced: row.synced === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studentCount: row.student_count,
  };
}

export async function getSections(): Promise<Section[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<SectionRow>(`${SELECT_SECTIONS} ORDER BY s.created_at DESC`);
    return rows.map(mapRowToSection);
  } catch (error) {
    logger.error('Error obteniendo secciones', error);
    throw error;
  }
}

export async function getSectionById(id: string): Promise<Section | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<SectionRow>(`${SELECT_SECTIONS} WHERE s.id = ?`, id);
    return row ? mapRowToSection(row) : null;
  } catch (error) {
    logger.error('Error obteniendo la sección', error);
    throw error;
  }
}

export async function createSection(input: CreateSectionInput): Promise<Section> {
  const { name, yearLevel, teacherId } = input;
  const now = Date.now();
  const id = crypto.randomUUID();

  const row: SectionRow = {
    id,
    name,
    year_level: yearLevel,
    teacher_id: teacherId,
    synced: 0,
    created_at: now,
    updated_at: now,
    student_count: 0,
  };

  // student_count es una columna virtual (subquery), no existe en la tabla
  // sections: se excluye del INSERT y del payload que viaja al outbox.
  const { student_count: _studentCount, ...domainRow } = row;

  try {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO sections (id, name, year_level, teacher_id, synced, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        domainRow.id,
        domainRow.name,
        domainRow.year_level,
        domainRow.teacher_id,
        domainRow.synced,
        domainRow.created_at,
        domainRow.updated_at,
      );

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'section', ?, 'upsert', ?, ?, ?, 0)`,
        crypto.randomUUID(),
        domainRow.id,
        JSON.stringify(domainRow),
        `${crypto.randomUUID()}:section:upsert`,
        now,
      );
    });

    return mapRowToSection(row);
  } catch (error) {
    logger.error('Error creando la sección', error);
    throw error;
  }
}

// SQLite no aplica ON DELETE CASCADE salvo que PRAGMA foreign_keys = ON este
// activo (no lo esta en schema.ts). Para no dejar estudiantes huerfanos, se
// eliminan aqui explicitamente, cada uno con su propio evento de outbox.
export async function deleteSection(id: string): Promise<void> {
  try {
    const db = await getDb();
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      const studentIds = await db.getAllAsync<{ id: string }>(
        'SELECT id FROM students WHERE section_id = ?',
        id,
      );

      for (const student of studentIds) {
        await db.runAsync('DELETE FROM students WHERE id = ?', student.id);
        await db.runAsync(
          `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
           VALUES (?, 'student', ?, 'delete', ?, ?, ?, 0)`,
          crypto.randomUUID(),
          student.id,
          JSON.stringify({ id: student.id }),
          `${crypto.randomUUID()}:student:delete`,
          now,
        );
      }

      await db.runAsync('DELETE FROM sections WHERE id = ?', id);

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'section', ?, 'delete', ?, ?, ?, 0)`,
        crypto.randomUUID(),
        id,
        JSON.stringify({ id }),
        `${crypto.randomUUID()}:section:delete`,
        now,
      );
    });
  } catch (error) {
    logger.error('Error eliminando la sección', error);
    throw error;
  }
}
