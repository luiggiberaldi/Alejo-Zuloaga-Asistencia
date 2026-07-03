export type AttendanceStatus = 'presente' | 'ausente';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // Formato 'YYYY-MM-DD'
  status: AttendanceStatus;
  synced: boolean;
  createdAt: number;
  updatedAt: number;
}
