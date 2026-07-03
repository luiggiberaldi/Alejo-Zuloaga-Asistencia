import { openDatabaseAsync } from 'expo-sqlite';

import { logger } from '@/services/logger';

import type { SQLiteDatabase } from 'expo-sqlite';

// Mismo nombre de base de datos que usa <SQLiteProvider> en app/_layout.tsx.
// SQLite (con WAL, ver schema.ts) admite varias conexiones al mismo archivo,
// asi que esto no interfiere con la conexion del provider ni con initSchema.
const DATABASE_NAME = 'alejo_zuloaga.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

// Repositorios y stores (funciones planas, sin React) usan esto para obtener
// la conexion, ya que useSQLiteContext() solo funciona dentro de componentes.
export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).catch((error) => {
      dbPromise = null;
      logger.error('Error abriendo la conexion SQLite', error);
      throw error;
    });
  }
  return dbPromise;
}
