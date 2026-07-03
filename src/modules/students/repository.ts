import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';

import type { CreateStudentInput, Student } from './types';

interface StudentRow {
  id: string;
  section_id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  synced: number;
  created_at: number;
  updated_at: number;
}

function mapRowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    sectionId: row.section_id,
    cedula: row.cedula,
    nombres: row.nombres,
    apellidos: row.apellidos,
    synced: row.synced === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildStudentRow(input: CreateStudentInput, now: number): StudentRow {
  return {
    id: crypto.randomUUID(),
    section_id: input.sectionId,
    cedula: input.cedula,
    nombres: input.nombres,
    apellidos: input.apellidos,
    synced: 0,
    created_at: now,
    updated_at: now,
  };
}

async function insertStudentRow(
  db: Awaited<ReturnType<typeof getDb>>,
  row: StudentRow,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO students (id, section_id, cedula, nombres, apellidos, synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.section_id,
    row.cedula,
    row.nombres,
    row.apellidos,
    row.synced,
    row.created_at,
    row.updated_at,
  );

  await db.runAsync(
    `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
     VALUES (?, 'student', ?, 'upsert', ?, ?, ?, 0)`,
    crypto.randomUUID(),
    row.id,
    JSON.stringify(row),
    `${crypto.randomUUID()}:student:upsert`,
    row.created_at,
  );
}

export async function getStudentsBySection(sectionId: string): Promise<Student[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<StudentRow>(
      'SELECT * FROM students WHERE section_id = ? ORDER BY apellidos, nombres',
      sectionId,
    );
    return rows.map(mapRowToStudent);
  } catch (error) {
    logger.error('Error obteniendo estudiantes de la sección', error);
    throw error;
  }
}

export async function getStudentById(id: string): Promise<Student | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<StudentRow>('SELECT * FROM students WHERE id = ?', id);
    return row ? mapRowToStudent(row) : null;
  } catch (error) {
    logger.error('Error obteniendo el estudiante', error);
    throw error;
  }
}

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  try {
    const db = await getDb();
    const row = buildStudentRow(input, Date.now());

    await db.withTransactionAsync(async () => {
      await insertStudentRow(db, row);
    });

    return mapRowToStudent(row);
  } catch (error) {
    logger.error('Error registrando el estudiante', error);
    throw error;
  }
}

export async function createStudentsBatch(inputs: CreateStudentInput[]): Promise<Student[]> {
  try {
    const db = await getDb();
    const now = Date.now();
    const rows = inputs.map((input) => buildStudentRow(input, now));

    await db.withTransactionAsync(async () => {
      for (const row of rows) {
        await insertStudentRow(db, row);
      }
    });

    return rows.map(mapRowToStudent);
  } catch (error) {
    logger.error('Error importando estudiantes en lote', error);
    throw error;
  }
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM students WHERE id = ?', id);

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'student', ?, 'delete', ?, ?, ?, 0)`,
        crypto.randomUUID(),
        id,
        JSON.stringify({ id }),
        `${crypto.randomUUID()}:student:delete`,
        Date.now(),
      );
    });
  } catch (error) {
    logger.error('Error eliminando el estudiante', error);
    throw error;
  }
}
