import { create } from 'zustand';

import {
  createStudent,
  createStudentsBatch,
  deleteStudent,
  getStudentsBySection,
} from '@/modules/students/repository';
import { logger } from '@/services/logger';
import { useSyncStore } from '@/store/sync-store';

import type { CreateStudentInput, Student } from '@/modules/students/types';

interface StudentsState {
  students: Student[];
  loading: boolean;
  error: string | null;
  loadStudents: (sectionId: string) => Promise<void>;
  addStudent: (input: CreateStudentInput) => Promise<void>;
  addStudentsBatch: (inputs: CreateStudentInput[]) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  clearError: () => void;
}

function sortStudents(students: Student[]): Student[] {
  return [...students].sort(
    (a, b) => a.apellidos.localeCompare(b.apellidos) || a.nombres.localeCompare(b.nombres),
  );
}

export const useStudentsStore = create<StudentsState>((set) => ({
  students: [],
  loading: false,
  error: null,

  loadStudents: async (sectionId) => {
    set({ loading: true, error: null });
    try {
      const students = await getStudentsBySection(sectionId);
      set({ students, loading: false });
    } catch (error) {
      logger.error('Error cargando estudiantes', error);
      set({ loading: false, error: 'No se pudieron cargar los estudiantes.' });
    }
  },

  addStudent: async (input) => {
    set({ error: null });
    try {
      const student = await createStudent(input);
      set((state) => ({ students: sortStudents([...state.students, student]) }));
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Error registrando estudiante', error);
      set({ error: 'No se pudo registrar el estudiante.' });
      throw error;
    }
  },

  addStudentsBatch: async (inputs) => {
    set({ error: null });
    try {
      const students = await createStudentsBatch(inputs);
      set((state) => ({ students: sortStudents([...state.students, ...students]) }));
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Error importando estudiantes', error);
      set({ error: 'No se pudieron importar los estudiantes.' });
      throw error;
    }
  },

  removeStudent: async (id) => {
    set({ error: null });
    try {
      await deleteStudent(id);
      set((state) => ({ students: state.students.filter((student) => student.id !== id) }));
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Error eliminando estudiante', error);
      set({ error: 'No se pudo eliminar el estudiante.' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
