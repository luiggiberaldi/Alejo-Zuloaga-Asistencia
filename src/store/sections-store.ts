import { create } from 'zustand';

import { getTodayString } from '@/components/ui/DateSelector';
import { createSection, deleteSection, getSections } from '@/modules/sections/repository';
import { logger } from '@/services/logger';
import { useAuthStore } from '@/store/auth-store';
import { useSyncStore } from '@/store/sync-store';

import type { Section, YearLevel } from '@/modules/sections/types';

interface SectionsState {
  sections: Section[];
  loading: boolean;
  error: string | null;
  loadSections: () => Promise<void>;
  addSection: (name: string, yearLevel: YearLevel) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSectionsStore = create<SectionsState>((set) => ({
  sections: [],
  loading: false,
  error: null,

  loadSections: async () => {
    set({ loading: true, error: null });
    try {
      const today = getTodayString();
      const sections = await getSections(today);
      set({ sections, loading: false });
    } catch (error) {
      logger.error('Error cargando secciones', error);
      set({ loading: false, error: 'No se pudieron cargar las secciones.' });
    }
  },

  addSection: async (name, yearLevel) => {
    const teacherId = useAuthStore.getState().user?.id;
    if (!teacherId) {
      set({ error: 'No hay una sesión activa.' });
      return;
    }

    set({ error: null });
    try {
      const section = await createSection({ name, yearLevel, teacherId });
      set((state) => ({ sections: [section, ...state.sections] }));
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Error creando sección', error);
      set({ error: 'No se pudo crear la sección.' });
      throw error;
    }
  },

  removeSection: async (id) => {
    set({ error: null });
    try {
      await deleteSection(id);
      set((state) => ({ sections: state.sections.filter((section) => section.id !== id) }));
      useSyncStore.getState().refreshPendingCount();
    } catch (error) {
      logger.error('Error eliminando sección', error);
      set({ error: 'No se pudo eliminar la sección.' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
