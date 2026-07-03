import NetInfo from '@react-native-community/netinfo';

import {
  getPendingEvents,
  incrementAttempts,
  markEntitySynced,
  removeEvent,
} from '@/modules/sync/outbox-repository';
import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/auth-store';

import type { SyncResult } from '@/modules/sync/types';

// Mapeo de entidades a tablas de Supabase
const TABLE_MAP: Record<string, string> = {
  section: 'sections',
  student: 'students',
  attendance: 'attendance_records',
  behavior: 'behavior_reports',
};

// Conversión de timestamps numéricos locales a ISO Strings para Supabase TIMESTAMPTZ
function preparePayloadForRemote(payloadStr: string): any {
  const data = JSON.parse(payloadStr);
  delete data.synced;

  if (typeof data.created_at === 'number') {
    data.created_at = new Date(data.created_at).toISOString();
  }
  if (typeof data.updated_at === 'number') {
    data.updated_at = new Date(data.updated_at).toISOString();
  }

  return data;
}

export async function syncNow(): Promise<SyncResult> {
  const errors: string[] = [];
  let pushed = 0;
  let failed = 0;
  let pulled = 0;

  // 1. Verificar conexión de red
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    throw new Error('Sin conexión a internet');
  }

  // 2. Obtener eventos pendientes (excluye aquellos con attempts >= 5)
  const pendingEvents = await getPendingEvents();

  // 3. Procesar en chunks de 20 eventos
  const chunkSize = 20;
  for (let i = 0; i < pendingEvents.length; i += chunkSize) {
    const chunk = pendingEvents.slice(i, i + chunkSize);

    // Procesamiento estrictamente SECUENCIAL (for...of + await) dentro del chunk
    // para evitar saturar conexiones móviles limitadas en el liceo.
    for (const event of chunk) {
      const table = TABLE_MAP[event.entity];
      if (!table) {
        logger.warn(`Entidad desconocida omitida en outbox: ${event.entity}`);
        continue;
      }

      try {
        if (event.op === 'upsert') {
          const remoteData = preparePayloadForRemote(event.payload);
          const { error } = await supabase.from(table).upsert(remoteData, { onConflict: 'id' });

          if (error) {
            throw error;
          }
        } else if (event.op === 'delete') {
          const { error } = await supabase.from(table).delete().eq('id', event.entityId);

          if (error) {
            throw error;
          }
        }

        // Éxito: remover de la cola outbox y marcar estado synced localmente
        await removeEvent(event.id);
        await markEntitySynced(event.entity, event.entityId);
        pushed++;
      } catch (error: any) {
        logger.error(`Error sincronizando evento ${event.id} en Supabase`, error);

        // Si es error 401 (JWT Expirado / Sesión inválida), abortar todo y desloguear
        if (error.status === 401) {
          useAuthStore.getState().signOut();
          throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
        }

        // Si es error 403 (RLS denegado en Supabase), tratarlo como fallo individual
        // sin interrumpir la cola (se incrementan los intentos y se avanza al siguiente)
        await incrementAttempts(event.id, error.message || 'Error desconocido de Supabase');
        errors.push(`${event.entity} (${event.entityId}): ${error.message || '403 Forbidden (RLS)'}`);
        failed++;
      }
    }
  }

  // 4. Proceso de PULL desde el servidor
  // El orden de pull (sections → students → attendance_records → behavior_reports)
  // es OBLIGATORIO por integridad referencial (Foreign Keys en la base de datos local SQLite).
  try {
    const db = await getDb();

    // Obtener último cursor de pull de sync_meta
    const metaRow = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM sync_meta WHERE key = 'last_pull_cursor'",
    );
    // Si no existe, inicializar con epoch ISO string (Trae todo el historial del profesor)
    const lastPullCursor = metaRow ? metaRow.value : '1970-01-01T00:00:00.000Z';

    // 4.1 PULL Sections
    const { data: remoteSections, error: secError } = await supabase
      .from('sections')
      .select('*')
      .gt('updated_at', lastPullCursor);

    if (secError) throw secError;

    if (remoteSections && remoteSections.length > 0) {
      await db.withTransactionAsync(async () => {
        for (const sec of remoteSections) {
          await db.runAsync(
            `INSERT OR REPLACE INTO sections (id, name, year_level, teacher_id, synced, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?)`,
            sec.id,
            sec.name,
            sec.year_level,
            sec.teacher_id,
            Date.parse(sec.created_at),
            Date.parse(sec.updated_at),
          );
          pulled++;
        }
      });
    }

    // 4.2 PULL Students
    const { data: remoteStudents, error: studError } = await supabase
      .from('students')
      .select('*')
      .gt('updated_at', lastPullCursor);

    if (studError) throw studError;

    if (remoteStudents && remoteStudents.length > 0) {
      await db.withTransactionAsync(async () => {
        for (const stud of remoteStudents) {
          await db.runAsync(
            `INSERT OR REPLACE INTO students (id, section_id, cedula, nombres, apellidos, synced, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
            stud.id,
            stud.section_id,
            stud.cedula,
            stud.nombres,
            stud.apellidos,
            Date.parse(stud.created_at),
            Date.parse(stud.updated_at),
          );
          pulled++;
        }
      });
    }

    // 4.3 PULL Attendance Records
    const { data: remoteAttendance, error: attError } = await supabase
      .from('attendance_records')
      .select('*')
      .gt('updated_at', lastPullCursor);

    if (attError) throw attError;

    if (remoteAttendance && remoteAttendance.length > 0) {
      await db.withTransactionAsync(async () => {
        for (const att of remoteAttendance) {
          await db.runAsync(
            `INSERT OR REPLACE INTO attendance_records (id, student_id, date, status, synced, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?)`,
            att.id,
            att.student_id,
            att.date,
            att.status,
            Date.parse(att.created_at),
            Date.parse(att.updated_at),
          );
          pulled++;
        }
      });
    }

    // 4.4 PULL Behavior Reports
    const { data: remoteBehavior, error: behError } = await supabase
      .from('behavior_reports')
      .select('*')
      .gt('updated_at', lastPullCursor);

    if (behError) throw behError;

    if (remoteBehavior && remoteBehavior.length > 0) {
      await db.withTransactionAsync(async () => {
        for (const beh of remoteBehavior) {
          await db.runAsync(
            `INSERT OR REPLACE INTO behavior_reports (id, student_id, description, severity, date, synced, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
            beh.id,
            beh.student_id,
            beh.description,
            beh.severity,
            beh.date,
            Date.parse(beh.created_at),
            Date.parse(beh.updated_at),
          );
          pulled++;
        }
      });
    }

    // Actualizar el cursor en sync_meta con el timestamp actual del dispositivo local
    const newCursor = new Date().toISOString();
    await db.runAsync(
      "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_pull_cursor', ?)",
      newCursor,
    );
  } catch (pullError: any) {
    logger.error('Error durante el Pull de cambios desde Supabase', pullError);
    if (pullError.status === 401) {
      useAuthStore.getState().signOut();
      throw new Error('Sesión expirada durante la descarga de datos.');
    }
    errors.push(`Descarga (Pull) fallida: ${pullError.message || 'Error desconocido'}`);
  }

  return { pushed, failed, pulled, errors };
}
