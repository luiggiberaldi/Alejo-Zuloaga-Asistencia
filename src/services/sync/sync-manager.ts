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
import { extractHttpStatus } from '@/services/sync/error-utils';

import type { SyncResult } from '@/modules/sync/types';



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

  if (pendingEvents.length > 0) {
    // Definición del orden de dependencias para evitar violaciones de claves foráneas
    const upsertOrder: ('section' | 'student' | 'attendance' | 'behavior')[] = [
      'section',
      'student',
      'attendance',
      'behavior',
    ];
    const deleteOrder: ('section' | 'student' | 'attendance' | 'behavior')[] = [
      'behavior',
      'attendance',
      'student',
      'section',
    ];

    // Agrupar eventos por tipo de entidad y operación
    const upsertsByEntity: Record<string, typeof pendingEvents> = {
      section: [],
      student: [],
      attendance: [],
      behavior: [],
    };
    const deletesByEntity: Record<string, typeof pendingEvents> = {
      section: [],
      student: [],
      attendance: [],
      behavior: [],
    };

    for (const event of pendingEvents) {
      if (event.op === 'upsert') {
        upsertsByEntity[event.entity]?.push(event);
      } else if (event.op === 'delete') {
        deletesByEntity[event.entity]?.push(event);
      }
    }

    // 3.1 PROCESAR UPSERTS EN LOTE (Siguiendo el orden de dependencias)
    for (const entityType of upsertOrder) {
      const events = upsertsByEntity[entityType];
      if (events.length === 0) continue;

      // Deduplicar: Si hay múltiples upserts del mismo ID, solo subir el último estado.
      // Pero debemos recordar TODOS los IDs de eventos asociados para borrarlos al finalizar con éxito.
      const latestEventsMap = new Map<string, typeof pendingEvents[0]>();
      const allEventIdsByEntityId = new Map<string, string[]>();

      for (const event of events) {
        latestEventsMap.set(event.entityId, event);
        if (!allEventIdsByEntityId.has(event.entityId)) {
          allEventIdsByEntityId.set(event.entityId, []);
        }
        allEventIdsByEntityId.get(event.entityId)!.push(event.id);
      }

      const uniqueEvents = Array.from(latestEventsMap.values());
      const payloads = uniqueEvents.map((event) => preparePayloadForRemote(event.payload));

      let error: any = null;

      try {
        switch (entityType) {
          case 'section':
            const resSec = await supabase.from('sections').upsert(payloads, { onConflict: 'id' });
            error = resSec.error;
            break;
          case 'student':
            const resStud = await supabase.from('students').upsert(payloads, { onConflict: 'id' });
            error = resStud.error;
            break;
          case 'attendance':
            const resAtt = await supabase.from('attendance_records').upsert(payloads, { onConflict: 'id' });
            error = resAtt.error;
            break;
          case 'behavior':
            const resBeh = await supabase.from('behavior_reports').upsert(payloads, { onConflict: 'id' });
            error = resBeh.error;
            break;
        }

        if (error) throw error;

        // Éxito del lote: limpiar todos los eventos (incluyendo duplicados intermedios) de la cola
        const eventIdsToRemove: string[] = [];
        for (const event of uniqueEvents) {
          const ids = allEventIdsByEntityId.get(event.entityId) || [event.id];
          eventIdsToRemove.push(...ids);
          await markEntitySynced(event.entity, event.entityId);
          pushed += ids.length;
        }

        for (const eventId of eventIdsToRemove) {
          await removeEvent(eventId);
        }
      } catch (batchError) {
        logger.warn(
          `Fallo el batch upsert para la entidad "${entityType}". Aplicando fallback secuencial.`,
          batchError
        );

        // FALLBACK SECUENCIAL: Procesar uno por uno los registros únicos de este lote para aislar el error
        for (const event of uniqueEvents) {
          try {
            const remoteData = preparePayloadForRemote(event.payload);
            let singleError: any = null;

            switch (entityType) {
              case 'section':
                const resSec = await supabase.from('sections').upsert(remoteData, { onConflict: 'id' });
                singleError = resSec.error;
                break;
              case 'student':
                const resStud = await supabase.from('students').upsert(remoteData, { onConflict: 'id' });
                singleError = resStud.error;
                break;
              case 'attendance':
                const resAtt = await supabase.from('attendance_records').upsert(remoteData, { onConflict: 'id' });
                singleError = resAtt.error;
                break;
              case 'behavior':
                const resBeh = await supabase.from('behavior_reports').upsert(remoteData, { onConflict: 'id' });
                singleError = resBeh.error;
                break;
            }

            if (singleError) throw singleError;

            // Éxito individual: eliminar eventos del outbox
            const ids = allEventIdsByEntityId.get(event.entityId) || [event.id];
            for (const eventId of ids) {
              await removeEvent(eventId);
            }
            await markEntitySynced(event.entity, event.entityId);
            pushed += ids.length;
          } catch (singleErr: any) {
            logger.error(`Error en fallback secuencial al subir ${event.entity} con ID ${event.entityId}:`, singleErr);
            const httpStatus = extractHttpStatus(singleErr);

            if (httpStatus === 401) {
              useAuthStore.getState().signOut();
              throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
            }

            if (httpStatus === 403) {
              // Error 403 RLS (Seguridad en Supabase): se incrementan intentos y se continúa
              const ids = allEventIdsByEntityId.get(event.entityId) || [event.id];
              for (const eventId of ids) {
                await incrementAttempts(eventId, singleErr.message || 'Error de RLS en Supabase');
              }
              errors.push(`${event.entity} (${event.entityId}): ${singleErr.message || '403 Forbidden (RLS)'}`);
              failed += ids.length;
            } else {
              // Error de conexión o servidor general: aborta la sincronización completa
              throw singleErr;
            }
          }
        }
      }
    }

    // 3.2 PROCESAR DELETES EN LOTE (Siguiendo orden de dependencia inverso)
    for (const entityType of deleteOrder) {
      const events = deletesByEntity[entityType];
      if (events.length === 0) continue;

      // Agrupar IDs de eventos por ID de la entidad a eliminar
      const allEventIdsByEntityId = new Map<string, string[]>();
      for (const event of events) {
        if (!allEventIdsByEntityId.has(event.entityId)) {
          allEventIdsByEntityId.set(event.entityId, []);
        }
        allEventIdsByEntityId.get(event.entityId)!.push(event.id);
      }

      const uniqueEntityIds = Array.from(allEventIdsByEntityId.keys());
      let error: any = null;

      try {
        switch (entityType) {
          case 'section':
            const resSec = await supabase.from('sections').delete().in('id', uniqueEntityIds);
            error = resSec.error;
            break;
          case 'student':
            const resStud = await supabase.from('students').delete().in('id', uniqueEntityIds);
            error = resStud.error;
            break;
          case 'attendance':
            const resAtt = await supabase.from('attendance_records').delete().in('id', uniqueEntityIds);
            error = resAtt.error;
            break;
          case 'behavior':
            const resBeh = await supabase.from('behavior_reports').delete().in('id', uniqueEntityIds);
            error = resBeh.error;
            break;
        }

        if (error) throw error;

        // Éxito del lote de eliminación: remover todos los eventos de la cola
        for (const entityId of uniqueEntityIds) {
          const ids = allEventIdsByEntityId.get(entityId) || [];
          for (const eventId of ids) {
            await removeEvent(eventId);
          }
          pushed += ids.length;
        }
      } catch (batchError) {
        logger.warn(
          `Fallo el batch delete para la entidad "${entityType}". Aplicando fallback secuencial.`,
          batchError
        );

        // FALLBACK SECUENCIAL: eliminar uno a uno para aislar fallos
        for (const entityId of uniqueEntityIds) {
          try {
            let singleError: any = null;

            switch (entityType) {
              case 'section':
                const resSec = await supabase.from('sections').delete().eq('id', entityId);
                singleError = resSec.error;
                break;
              case 'student':
                const resStud = await supabase.from('students').delete().eq('id', entityId);
                singleError = resStud.error;
                break;
              case 'attendance':
                const resAtt = await supabase.from('attendance_records').delete().eq('id', entityId);
                singleError = resAtt.error;
                break;
              case 'behavior':
                const resBeh = await supabase.from('behavior_reports').delete().eq('id', entityId);
                singleError = resBeh.error;
                break;
            }

            if (singleError) throw singleError;

            // Éxito individual: eliminar de outbox
            const ids = allEventIdsByEntityId.get(entityId) || [];
            for (const eventId of ids) {
              await removeEvent(eventId);
            }
            pushed += ids.length;
          } catch (singleErr: any) {
            logger.error(`Error en fallback secuencial al eliminar ${entityType} con ID ${entityId}:`, singleErr);
            const httpStatus = extractHttpStatus(singleErr);

            if (httpStatus === 401) {
              useAuthStore.getState().signOut();
              throw new Error('Sesión expirada durante la eliminación de datos.');
            }

            if (httpStatus === 403) {
              const ids = allEventIdsByEntityId.get(entityId) || [];
              for (const eventId of ids) {
                await incrementAttempts(eventId, singleErr.message || 'Error de RLS en Supabase');
              }
              errors.push(`delete ${entityType} (${entityId}): ${singleErr.message || '403 Forbidden (RLS)'}`);
              failed += ids.length;
            } else {
              throw singleErr;
            }
          }
        }
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
    // Diagnóstico temporal para inspeccionar la estructura real de errores
    try {
      logger.warn('Detalle completo del error del Pull:', JSON.stringify(pullError));
    } catch {
      // Ignorar fallos de serialización de errores circulares
    }

    const httpStatus = extractHttpStatus(pullError);
    if (httpStatus === 401) {
      useAuthStore.getState().signOut();
      throw new Error('Sesión expirada durante la descarga de datos.');
    }
    errors.push(`Descarga (Pull) fallida: ${pullError.message || 'Error desconocido'}`);
  }

  return { pushed, failed, pulled, errors };
}
