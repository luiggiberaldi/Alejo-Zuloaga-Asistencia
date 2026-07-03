import type { Role } from '@/types/supabase_types';

export type { Role };

export interface AuthUser {
  id: string;
  email: string | null;
}
