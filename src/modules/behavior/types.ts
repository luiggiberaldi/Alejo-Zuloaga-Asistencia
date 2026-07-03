export type BehaviorSeverity = 'leve' | 'moderado' | 'grave';

export interface BehaviorReport {
  id: string;
  studentId: string;
  description: string;
  severity: BehaviorSeverity;
  date: string; // Formato 'YYYY-MM-DD'
  synced: boolean;
  createdAt: number;
  updatedAt: number;
}
