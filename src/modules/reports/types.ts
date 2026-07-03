import type { AttendanceRecord } from '@/modules/attendance/types';
import type { BehaviorReport } from '@/modules/behavior/types';
import type { Student } from '@/modules/students/types';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface StudentReportData {
  student: Student;
  attendanceRecords: AttendanceRecord[];
  behaviorReports: BehaviorReport[];
  totalPresente: number;
  totalAusente: number;
  porcentajeAsistencia: number | null; // null si no hay registros (evita división por cero)
}

export interface SectionReportRow {
  student: Student;
  totalPresente: number;
  totalAusente: number;
  porcentajeAsistencia: number | null; // null si no hay registros
}
