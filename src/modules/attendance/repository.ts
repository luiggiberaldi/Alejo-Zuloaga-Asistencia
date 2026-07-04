import * as Crypto from 'expo-crypto';

import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';

import type { AttendanceRecord, AttendanceStatus } from './types';

interface AttendanceRow {
  id: string;
  student_id: string;
  date: string;
  status: string;
  synced: number;
  created_at: number;
  updated_at: number;
}

function mapRowToAttendance(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    status: row.status as AttendanceStatus,
    synced: row.synced === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function setAttendance(
  studentId: string,
  date: string,
  status: AttendanceStatus,
): Promise<AttendanceRecord> {
  const db = await getDb();
  let record: AttendanceRecord;

  try {
    await db.withTransactionAsync(async () => {
      const existing = await db.getFirstAsync<{ id: string; created_at: number }>(
        'SELECT id, created_at FROM attendance_records WHERE student_id = ? AND date = ?',
        studentId,
        date,
      );

      const now = Date.now();
      const id = existing ? existing.id : Crypto.randomUUID();
      const createdAt = existing ? existing.created_at : now;
      const updatedAt = now;

      const row: AttendanceRow = {
        id,
        student_id: studentId,
        date,
        status,
        synced: 0,
        created_at: createdAt,
        updated_at: updatedAt,
      };

      if (existing) {
        await db.runAsync(
          `UPDATE attendance_records
           SET status = ?, synced = 0, updated_at = ?
           WHERE id = ?`,
          row.status,
          row.updated_at,
          row.id,
        );
      } else {
        await db.runAsync(
          `INSERT INTO attendance_records (id, student_id, date, status, synced, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, ?, ?)`,
          row.id,
          row.student_id,
          row.date,
          row.status,
          row.created_at,
          row.updated_at,
        );
      }

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'attendance', ?, 'upsert', ?, ?, ?, 0)`,
        Crypto.randomUUID(),
        row.id,
        JSON.stringify(row),
        `${Crypto.randomUUID()}:attendance:upsert`,
        now,
      );

      record = mapRowToAttendance(row);
    });

    // @ts-expect-error record is set in the transaction block synchronously
    return record;
  } catch (error) {
    logger.error('Error guardando la asistencia', error);
    throw error;
  }
}

export async function getAttendanceByDate(
  sectionId: string,
  date: string,
): Promise<AttendanceRecord[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<AttendanceRow>(
      `SELECT ar.* FROM attendance_records ar
       JOIN students s ON ar.student_id = s.id
       WHERE s.section_id = ? AND ar.date = ?`,
      sectionId,
      date,
    );
    return rows.map(mapRowToAttendance);
  } catch (error) {
    logger.error('Error al obtener asistencias por fecha', error);
    throw error;
  }
}

export async function getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<AttendanceRow>(
      `SELECT * FROM attendance_records
       WHERE student_id = ?
       ORDER BY date DESC`,
      studentId,
    );
    return rows.map(mapRowToAttendance);
  } catch (error) {
    logger.error('Error al obtener historial de asistencia del estudiante', error);
    throw error;
  }
}
