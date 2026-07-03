import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';

import type { OutboxEvent } from './types';

interface OutboxRow {
  id: string;
  entity: 'section' | 'student' | 'attendance' | 'behavior';
  entity_id: string;
  op: 'upsert' | 'delete';
  payload: string;
  idempotency_key: string;
  created_at: number;
  attempts: number;
  last_error: string | null;
}

function mapRowToEvent(row: OutboxRow): OutboxEvent {
  return {
    id: row.id,
    entity: row.entity,
    entityId: row.entity_id,
    op: row.op,
    payload: row.payload,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    attempts: row.attempts,
    lastError: row.last_error,
  };
}

export async function getPendingEvents(): Promise<OutboxEvent[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<OutboxRow>(
      'SELECT * FROM outbox WHERE attempts < 5 ORDER BY created_at ASC',
    );
    return rows.map(mapRowToEvent);
  } catch (error) {
    logger.error('Error obteniendo eventos pendientes de outbox', error);
    throw error;
  }
}

export async function removeEvent(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM outbox WHERE id = ?', id);
  } catch (error) {
    logger.error('Error eliminando evento de outbox', error);
    throw error;
  }
}

export async function incrementAttempts(id: string, errorMessage: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      errorMessage,
      id,
    );
  } catch (error) {
    logger.error('Error incrementando intentos de evento outbox', error);
    throw error;
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM outbox');
    return row ? row.count : 0;
  } catch (error) {
    logger.error('Error contando pendientes en outbox', error);
    throw error;
  }
}

const TABLE_MAP: Record<string, string> = {
  section: 'sections',
  student: 'students',
  attendance: 'attendance_records',
  behavior: 'behavior_reports',
};

export async function markEntitySynced(entity: string, entityId: string): Promise<void> {
  const table = TABLE_MAP[entity];
  if (!table) {
    logger.error(`Entidad no reconocida en markEntitySynced: ${entity}`);
    return;
  }

  try {
    const db = await getDb();
    await db.runAsync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, entityId);
  } catch (error) {
    logger.error(`Error marcando entidad como sincronizada en tabla ${table}`, error);
    throw error;
  }
}
