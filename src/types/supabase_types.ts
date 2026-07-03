// ⚠️ Placeholder escrito a mano. Reemplazar ejecutando:
//   supabase gen types typescript --project-id <id> > src/types/supabase_types.ts
// una vez que el proyecto Supabase esté creado y las migraciones aplicadas
// (ver agent_docs/deployment.md → "Setup de Supabase"). No editar a mano
// después de generarlo.

export type Role = 'profesor' | 'coordinador';
export type AttendanceStatus = 'presente' | 'ausente';
export type BehaviorSeverity = 'leve' | 'moderado' | 'grave';

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          user_id: string;
          role: Role;
          year_level: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: Role;
          year_level: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          name: string;
          year_level: string;
          teacher_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          year_level: string;
          teacher_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sections']['Insert']>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          section_id: string;
          cedula: string;
          nombres: string;
          apellidos: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          cedula: string;
          nombres: string;
          apellidos: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
        Relationships: [];
      };
      behavior_reports: {
        Row: {
          id: string;
          student_id: string;
          description: string;
          severity: BehaviorSeverity;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          description: string;
          severity?: BehaviorSeverity;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['behavior_reports']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
