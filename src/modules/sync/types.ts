export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'partial';

export interface OutboxEvent {
  id: string;
  entity: 'section' | 'student' | 'attendance' | 'behavior';
  entityId: string;
  op: 'upsert' | 'delete';
  payload: string; // JSON serializado
  idempotencyKey: string;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export interface SyncResult {
  pushed: number;
  failed: number;
  pulled: number;
  errors: string[];
}
