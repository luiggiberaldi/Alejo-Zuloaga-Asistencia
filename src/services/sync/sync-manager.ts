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
  // (Stubbed temporalmente en este commit para mantener disciplina de tamaño)

  return { pushed, failed, pulled, errors };
}
