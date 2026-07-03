import { Alert } from 'react-native';

import { create } from 'zustand';

import { getAttendanceByDate, setAttendance } from '@/modules/attendance/repository';
import { logger } from '@/services/logger';

import type { AttendanceStatus } from '@/modules/attendance/types';

interface AttendanceState {
  attendanceByDate: Record<string, AttendanceStatus>;
  loading: boolean;
  error: string | null;
  loadAttendanceForSection: (sectionId: string, date: string) => Promise<void>;
  markAttendance: (studentId: string, date: string, status: AttendanceStatus) => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendanceByDate: {},
  loading: false,
  error: null,

  loadAttendanceForSection: async (sectionId, date) => {
    set({ loading: true, error: null });
    try {
      const records = await getAttendanceByDate(sectionId, date);
      const map: Record<string, AttendanceStatus> = {};
      records.forEach((r) => {
        map[r.studentId] = r.status;
      });
      set({ attendanceByDate: map, loading: false });
    } catch (error) {
      logger.error('Error cargando asistencias', error);
      set({ error: 'No se pudo cargar la asistencia.', loading: false });
    }
  },

  markAttendance: async (studentId, date, status) => {
    const previousMap = get().attendanceByDate;

    // Optimistic update
    set((state) => ({
      attendanceByDate: { ...state.attendanceByDate, [studentId]: status },
      error: null,
    }));

    try {
      await setAttendance(studentId, date, status);
    } catch (error) {
      logger.error('Fallo al guardar asistencia, ejecutando rollback', error);
      // Rollback
      set(() => ({
        attendanceByDate: previousMap,
      }));
      Alert.alert(
        'Error al guardar asistencia',
        'No se pudo registrar la asistencia en la base de datos local.',
      );
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
