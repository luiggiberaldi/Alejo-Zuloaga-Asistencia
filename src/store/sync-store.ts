import { create } from 'zustand';

import { getPendingCount } from '@/modules/sync/outbox-repository';
import { syncNow } from '@/services/sync/sync-manager';

import type { SyncResult, SyncStatus } from '@/modules/sync/types';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: number | null;
  lastResult: SyncResult | null;
  refreshPendingCount: () => Promise<void>;
  sync: () => Promise<SyncResult | null>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  pendingCount: 0,
  lastSyncAt: null,
  lastResult: null,

  refreshPendingCount: async () => {
    try {
      const count = await getPendingCount();
      set({ pendingCount: count });
    } catch {
      // Ignorar errores en refresh silencioso
    }
  },

  sync: async () => {
    // Evitar llamadas duplicadas concurrentes
    if (get().status === 'syncing') return null;

    set({ status: 'syncing', lastResult: null });

    try {
      const result = await syncNow();

      let nextStatus: SyncStatus = 'success';
      if (result.failed > 0) {
        nextStatus = 'partial';
      }

      set({
        status: nextStatus,
        lastResult: result,
        lastSyncAt: Date.now(),
      });

      // Refrescar contador tras completar sincronización
      await get().refreshPendingCount();

      // Regresar al estado idle después de 3 segundos de éxito
      if (nextStatus === 'success') {
        setTimeout(() => {
          if (get().status === 'success') {
            set({ status: 'idle' });
          }
        }, 3000);
      }

      return result;
    } catch (error) {
      set({ status: 'error' });
      await get().refreshPendingCount();
      throw error;
    }
  },
}));
