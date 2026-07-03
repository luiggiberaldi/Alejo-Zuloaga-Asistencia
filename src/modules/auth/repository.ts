import { logger } from '@/services/logger';
import { supabase } from '@/services/supabase/client';

import type { AuthUser, Role } from './types';

export interface SignInResult {
  user: AuthUser | null;
  error: string | null;
}

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logger.warn('Fallo al iniciar sesión', error.message);
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: 'No se pudo iniciar sesión.' };
  }

  return { user: { id: data.user.id, email: data.user.email ?? null }, error: null };
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.warn('Fallo al cerrar sesión', error.message);
  }
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    logger.warn('Fallo al obtener la sesión', error.message);
    return null;
  }

  const user = data.session?.user;
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export async function fetchUserRole(userId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('Fallo al obtener el rol del usuario', error.message);
    return null;
  }

  return data?.role ?? null;
}
