import { Alert } from 'react-native';

import { create } from 'zustand';

import {
  createBehaviorReport,
  deleteBehaviorReport,
  getBehaviorReportsByStudent,
} from '@/modules/behavior/repository';
import { logger } from '@/services/logger';
import { useSyncStore } from '@/store/sync-store';

import type { BehaviorReport, BehaviorSeverity } from '@/modules/behavior/types';

interface BehaviorState {
  reports: BehaviorReport[];
  loading: boolean;
  error: string | null;
  loadReports: (studentId: string) => Promise<void>;
  addReport: (
    studentId: string,
    description: string,
    severity: BehaviorSeverity,
    date: string,
  ) => Promise<void>;
  removeReport: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBehaviorStore = create<BehaviorState>((set, get) => ({
  reports: [],
  loading: false,
  error: null,

  loadReports: async (studentId) => {
    set({ loading: true, error: null });
    try {
      const reports = await getBehaviorReportsByStudent(studentId);
      set({ reports, loading: false });
    } catch (error) {
      logger.error('Error cargando reportes de comportamiento', error);
      set({ error: 'No se pudieron cargar los reportes de comportamiento.', loading: false });
    }
  },

  addReport: async (studentId, description, severity, date) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempReport: BehaviorReport = {
      id: tempId,
      studentId,
      description,
      severity,
      date,
      synced: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const previousReports = get().reports;

    // Optimistic update
    set((state) => ({
      reports: [tempReport, ...state.reports],
      error: null,
    }));

    try {
      const realReport = await createBehaviorReport(studentId, description, severity, date);
      // Reemplazar el reporte temporal por el definitivo retornado de SQLite
      set((state) => ({
        reports: state.reports.map((r) => (r.id === tempId ? realReport : r)),
      }));
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Fallo registrando reporte, ejecutando rollback', error);
      set(() => ({ reports: previousReports }));
      Alert.alert(
        'Error de Registro',
        'No se pudo registrar el reporte de comportamiento localmente.',
      );
      throw error;
    }
  },

  removeReport: async (id) => {
    const previousReports = get().reports;

    // Optimistic delete
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
      error: null,
    }));

    try {
      await deleteBehaviorReport(id);
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Fallo eliminando reporte, ejecutando rollback', error);
      set(() => ({ reports: previousReports }));
      Alert.alert(
        'Error de Eliminación',
        'No se pudo eliminar el reporte de comportamiento localmente.',
      );
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
