/// <reference types="jest" />

import NetInfo from '@react-native-community/netinfo';

import {
  getPendingEvents,
  incrementAttempts,
  markEntitySynced,
  removeEvent,
} from '@/modules/sync/outbox-repository';
import { getDb } from '@/services/database/client';
import { supabase } from '@/services/supabase/client';
import { syncNow } from '@/services/sync/sync-manager';

import type { OutboxEvent } from '@/modules/sync/types';

jest.mock('@react-native-community/netinfo');
jest.mock('@/modules/sync/outbox-repository');
jest.mock('@/services/database/client');
jest.mock('@/services/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: { getState: jest.fn(() => ({ signOut: jest.fn() })) },
}));

const mockNetInfoFetch = NetInfo.fetch as jest.MockedFunction<typeof NetInfo.fetch>;
const mockGetPendingEvents = getPendingEvents as jest.MockedFunction<typeof getPendingEvents>;
const mockRemoveEvent = removeEvent as jest.MockedFunction<typeof removeEvent>;
const mockMarkEntitySynced = markEntitySynced as jest.MockedFunction<typeof markEntitySynced>;
const mockIncrementAttempts = incrementAttempts as jest.MockedFunction<typeof incrementAttempts>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockSupabaseFrom = supabase.from as jest.Mock;

function createMockDb() {
  return {
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => {
      await callback();
    }),
  };
}

// Simula supabase.from(table): cubre upsert, delete().eq() y select().gt(),
// usados por syncNow() tanto en el push como en el pull de las 4 tablas.
function createSupabaseFromMock(overrides: Record<string, { data?: unknown[]; error?: unknown }> = {}) {
  return jest.fn((table: string) => {
    const tableOverride = overrides[table] ?? {};
    return {
      upsert: jest.fn().mockResolvedValue({ error: tableOverride.error ?? null }),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: tableOverride.error ?? null }),
      })),
      select: jest.fn(() => ({
        gt: jest.fn().mockResolvedValue({ data: tableOverride.data ?? [], error: null }),
      })),
    };
  });
}

function buildEvent(overrides: Partial<OutboxEvent> = {}): OutboxEvent {
  return {
    id: 'event-1',
    entity: 'section',
    entityId: 'section-1',
    op: 'upsert',
    payload: JSON.stringify({ id: 'section-1', name: 'Sección A' }),
    idempotencyKey: 'key-1',
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
    ...overrides,
  };
}

describe('syncNow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockResolvedValue(createMockDb() as any);
    mockGetPendingEvents.mockResolvedValue([]);
    mockSupabaseFrom.mockImplementation(createSupabaseFromMock());
  });

  it('rechaza sin llamar al outbox ni a Supabase cuando no hay conexión', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: false } as any);

    await expect(syncNow()).rejects.toThrow('Sin conexión a internet');

    expect(mockGetPendingEvents).not.toHaveBeenCalled();
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  it('sube un evento pendiente y lo remueve del outbox al tener éxito', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: true } as any);
    mockGetPendingEvents.mockResolvedValue([buildEvent()]);

    const result = await syncNow();

    expect(mockSupabaseFrom).toHaveBeenCalledWith('sections');
    expect(mockRemoveEvent).toHaveBeenCalledWith('event-1');
    expect(mockMarkEntitySynced).toHaveBeenCalledWith('section', 'section-1');
    expect(result.pushed).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('no aborta la cola ante un error 403 (RLS): incrementa intentos y sigue', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: true } as any);
    mockGetPendingEvents.mockResolvedValue([buildEvent()]);
    mockSupabaseFrom.mockImplementation(
      createSupabaseFromMock({
        sections: { error: { status: 403, message: 'RLS denegado' } },
      }),
    );

    const result = await syncNow();

    expect(mockIncrementAttempts).toHaveBeenCalledWith('event-1', 'RLS denegado');
    expect(mockRemoveEvent).not.toHaveBeenCalled();
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
  });

  it('usa el cursor época cuando sync_meta no tiene fila previa e inserta las filas remotas', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: true } as any);
    mockGetPendingEvents.mockResolvedValue([]);

    const remoteSection = {
      id: 'section-1',
      name: 'Sección A',
      year_level: '1ro',
      teacher_id: 'teacher-1',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    mockSupabaseFrom.mockImplementation(
      createSupabaseFromMock({ sections: { data: [remoteSection] } }),
    );

    const result = await syncNow();

    const sectionsCall = mockSupabaseFrom.mock.results.find(
      (_, index) => mockSupabaseFrom.mock.calls[index][0] === 'sections',
    );
    const selectMock = sectionsCall!.value.select as jest.Mock;
    const gtMock = selectMock.mock.results[0].value.gt as jest.Mock;
    expect(gtMock).toHaveBeenCalledWith('updated_at', '1970-01-01T00:00:00.000Z');
    expect(result.pulled).toBe(1);
  });
});
