import * as Crypto from 'expo-crypto';

import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';

import type { BehaviorReport, BehaviorSeverity } from './types';

interface BehaviorReportRow {
  id: string;
  student_id: string;
  description: string;
  severity: BehaviorSeverity;
  date: string;
  synced: number;
  created_at: number;
  updated_at: number;
}

function mapRowToReport(row: BehaviorReportRow): BehaviorReport {
  return {
    id: row.id,
    studentId: row.student_id,
    description: row.description,
    severity: row.severity,
    date: row.date,
    synced: row.synced === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createBehaviorReport(
  studentId: string,
  description: string,
  severity: BehaviorSeverity,
  date: string,
): Promise<BehaviorReport> {
  const db = await getDb();
  const now = Date.now();
  const id = Crypto.randomUUID();

  const row: BehaviorReportRow = {
    id,
    student_id: studentId,
    description,
    severity,
    date,
    synced: 0,
    created_at: now,
    updated_at: now,
  };

  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO behavior_reports (id, student_id, description, severity, date, synced, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        row.id,
        row.student_id,
        row.description,
        row.severity,
        row.date,
        row.created_at,
        row.updated_at,
      );

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'behavior', ?, 'upsert', ?, ?, ?, 0)`,
        Crypto.randomUUID(),
        row.id,
        JSON.stringify(row),
        `${Crypto.randomUUID()}:behavior:upsert`,
        now,
      );
    });

    return mapRowToReport(row);
  } catch (error) {
    logger.error('Error registrando reporte de comportamiento', error);
    throw error;
  }
}

export async function getBehaviorReportsByStudent(studentId: string): Promise<BehaviorReport[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<BehaviorReportRow>(
      `SELECT * FROM behavior_reports
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      studentId,
    );
    return rows.map(mapRowToReport);
  } catch (error) {
    logger.error('Error al obtener reportes de comportamiento del estudiante', error);
    throw error;
  }
}

export async function deleteBehaviorReport(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM behavior_reports WHERE id = ?', id);

      await db.runAsync(
        `INSERT INTO outbox (id, entity, entity_id, op, payload, idempotency_key, created_at, attempts)
         VALUES (?, 'behavior', ?, 'delete', ?, ?, ?, 0)`,
        Crypto.randomUUID(),
        id,
        JSON.stringify({ id }),
        `${Crypto.randomUUID()}:behavior:delete`,
        Date.now(),
      );
    });
  } catch (error) {
    logger.error('Error eliminando reporte de comportamiento', error);
    throw error;
  }
}
