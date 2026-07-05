import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import { logger } from '@/services/logger';

import type { Database } from '@/types/supabase_types';

const rawSupabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const rawSupabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

if (!rawSupabaseUrl || !rawSupabaseAnonKey) {
  logger.error('Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.local');
}

// Evitamos que createClient tire una excepción fatal durante el arranque en frío (primer render)
// al usar valores por defecto temporales (placeholder) si no se compilaron las variables.
const supabaseUrl = rawSupabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawSupabaseAnonKey || 'placeholder';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
