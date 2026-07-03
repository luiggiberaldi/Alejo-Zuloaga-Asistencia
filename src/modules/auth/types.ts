export type Role = 'profesor' | 'coordinador';

export interface AuthUser {
  id: string;
  email: string | null;
}
