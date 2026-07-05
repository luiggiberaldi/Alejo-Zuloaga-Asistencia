import * as Crypto from 'expo-crypto';

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
  attendance_count?: number;
}

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
    attendanceCountForToday: row.attendance_count ?? 0,
  };
}

export async function getSections(todayDate?: string): Promise<Section[]> {
  try {
    const db = await getDb();
    if (todayDate) {
      const rows = await db.getAllAsync<SectionRow>(
        `SELECT s.*, 
                (SELECT COUNT(*) FROM students st WHERE st.section_id = s.id) AS student_count,
                (SELECT COUNT(*) FROM attendance_records ar 
                 JOIN students st ON ar.student_id = st.id 
                 WHERE st.section_id = s.id AND ar.date = ?) AS attendance_count
         FROM sections s
         ORDER BY s.created_at DESC`,
        todayDate
      );
      return rows.map(mapRowToSection);
    } else {
      const rows = await db.getAllAsync<SectionRow>(
        `SELECT s.*, 
                (SELECT COUNT(*) FROM students st WHERE st.section_id = s.id) AS student_count
         FROM sections s
         ORDER BY s.created_at DESC`
      );
      return rows.map(mapRowToSection);
    }
  } catch (error) {
    logger.error('Error obteniendo secciones', error);
    throw error;
  }
}

export async function hasSections(): Promise<boolean> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sections');
    return (row?.count ?? 0) > 0;
  } catch (error) {
    logger.error('Error verificando si existen secciones locales', error);
    return false; // en caso de error, no bloquear el intento de pull
  }
}

export async function getSectionById(id: string): Promise<Section | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<SectionRow>(
      `SELECT s.*, (SELECT COUNT(*) FROM students st WHERE st.section_id = s.id) AS student_count
       FROM sections s WHERE s.id = ?`,
      id,
    );
    return row ? mapRowToSection(row) : null;
  } catch (error) {
    logger.error('Error obteniendo la sección', error);
    throw error;
  }
}

export async function createSection(input: CreateSectionInput): Promise<Section> {
  const { name, yearLevel, teacherId } = input;
  const now = Date.now();
  const id = Crypto.randomUUID();

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
        Crypto.randomUUID(),
        domainRow.id,
        JSON.stringify(domainRow),
        `${Crypto.randomUUID()}:section:upsert`,
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
        // Limpiar eventos pendientes de asistencia/comportamiento/estudiante
        // para no dejar 'upsert' viejos que referencien una fila que nunca
        // se sincronizo (fallarian RLS al no encontrar el padre en remoto).
        const attendanceIds = await db.getAllAsync<{ id: string }>(
          'SELECT id FROM attendance_records WHERE student_id = ?',
          student.id,
        );
        for (const record of attendanceIds) {
          await db.runAsync('DELETE FROM outbox WHERE entity = ? AND entity_id = ?', 'attendance', record.id);
        }

        const behaviorIds = await db.getAllAsync<{ id: string }>(
          'SELECT id FROM behavior_reports WHERE student_id = ?',
          student.id,
        );
        for (const report of behaviorIds) {
          await db.runAsync('DELETE FROM outbox WHERE entity = ? AND entity_id = ?', 'behavior', report.id);
        }

        await db.runAsync('DELETE FROM outbox WHERE entity = ? AND entity_id = ?', 'student', student.id);

        // Eliminar registros locales en SQLite para evitar huérfanos dado que foreign_keys = OFF
        await db.runAsync('DELETE FROM attendance_records WHERE student_id = ?', student.id);
        await db.runAsync('DELETE FROM behavior_reports WHERE student_id = ?', student.id);
        await db.runAsync('DELETE FROM students WHERE id = ?', student.id);
        await db.runAsync(
          `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
           VALUES (?, 'student', ?, 'delete', ?, ?, ?, 0)`,
          Crypto.randomUUID(),
          student.id,
          JSON.stringify({ id: student.id }),
          `${Crypto.randomUUID()}:student:delete`,
          now,
        );
      }

      await db.runAsync('DELETE FROM outbox WHERE entity = ? AND entity_id = ?', 'section', id);

      await db.runAsync('DELETE FROM sections WHERE id = ?', id);

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'section', ?, 'delete', ?, ?, ?, 0)`,
        Crypto.randomUUID(),
        id,
        JSON.stringify({ id }),
        `${Crypto.randomUUID()}:section:delete`,
        now,
      );
    });
  } catch (error) {
    logger.error('Error eliminando la sección', error);
    throw error;
  }
}
