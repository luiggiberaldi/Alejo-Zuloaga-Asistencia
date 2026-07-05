import { getStudentById } from '@/modules/students/repository';
import { getDb } from '@/services/database/client';
import { logger } from '@/services/logger';

import type { DateRange, SectionReportRow, StudentReportData } from './types';
import type { AttendanceRecord, AttendanceStatus } from '@/modules/attendance/types';
import type { BehaviorReport, BehaviorSeverity } from '@/modules/behavior/types';
import type { Student } from '@/modules/students/types';

// Helper local para obtener fecha de hoy
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getMinAttendanceDate(
  sectionId: string,
  studentId?: string,
): Promise<string> {
  try {
    const db = await getDb();
    let row: { min_date: string | null } | null;

    if (studentId) {
      row = await db.getFirstAsync<{ min_date: string | null }>(
        'SELECT MIN(date) as min_date FROM attendance_records WHERE student_id = ?',
        studentId,
      );
    } else {
      row = await db.getFirstAsync<{ min_date: string | null }>(
        `SELECT MIN(ar.date) as min_date FROM attendance_records ar
         JOIN students s ON ar.student_id = s.id
         WHERE s.section_id = ?`,
        sectionId,
      );
    }

    return row?.min_date || getTodayString();
  } catch (error) {
    logger.error('Error al obtener fecha mínima de asistencia', error);
    return getTodayString();
  }
}

export async function getStudentReportData(
  studentId: string,
  dateRange: DateRange,
): Promise<StudentReportData> {
  try {
    const student = await getStudentById(studentId);
    if (!student) {
      throw new Error(`Estudiante con ID ${studentId} no encontrado`);
    }

    const db = await getDb();

    // 1. Obtener registros de asistencia
    const attRows = await db.getAllAsync<{
      id: string;
      student_id: string;
      date: string;
      status: string;
      synced: number;
      created_at: number;
      updated_at: number;
    }>(
      `SELECT * FROM attendance_records
       WHERE student_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      studentId,
      dateRange.startDate,
      dateRange.endDate,
    );

    const attendanceRecords: AttendanceRecord[] = attRows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      date: row.date,
      status: row.status as AttendanceStatus,
      synced: row.synced === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // 2. Obtener reportes de comportamiento
    const behRows = await db.getAllAsync<{
      id: string;
      student_id: string;
      description: string;
      severity: string;
      date: string;
      synced: number;
      created_at: number;
      updated_at: number;
    }>(
      `SELECT * FROM behavior_reports
       WHERE student_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      studentId,
      dateRange.startDate,
      dateRange.endDate,
    );

    const behaviorReports: BehaviorReport[] = behRows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      description: row.description,
      severity: row.severity as BehaviorSeverity,
      synced: row.synced === 1,
      date: row.date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // 3. Calcular totales y porcentaje
    let totalPresente = 0;
    let totalAusente = 0;

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'presente') {
        totalPresente++;
      } else if (rec.status === 'ausente') {
        totalAusente++;
      }
    });

    const total = totalPresente + totalAusente;
    const porcentajeAsistencia = total > 0 ? Math.round((totalPresente / total) * 100) : null;

    return {
      student,
      attendanceRecords,
      behaviorReports,
      totalPresente,
      totalAusente,
      porcentajeAsistencia,
    };
  } catch (error) {
    logger.error('Error al generar StudentReportData', error);
    throw error;
  }
}

export async function getSectionReportRows(
  sectionId: string,
  dateRange: DateRange,
): Promise<SectionReportRow[]> {
  try {
    const db = await getDb();

    // Query agrupada optimizada para evitar N+1 queries
    const rows = await db.getAllAsync<{
      student_id: string;
      cedula: string;
      nombres: string;
      apellidos: string;
      total_presente: number;
      total_ausente: number;
    }>(
      `SELECT
        s.id as student_id,
        s.cedula,
        s.nombres,
        s.apellidos,
        COUNT(CASE WHEN ar.status = 'presente' THEN 1 END) AS total_presente,
        COUNT(CASE WHEN ar.status = 'ausente' THEN 1 END) AS total_ausente
       FROM students s
       LEFT JOIN attendance_records ar
         ON ar.student_id = s.id AND ar.date >= ? AND ar.date <= ?
       WHERE s.section_id = ?
       GROUP BY s.id
       ORDER BY s.apellidos, s.nombres`,
      dateRange.startDate,
      dateRange.endDate,
      sectionId,
    );

    return rows.map((row) => {
      const student: Student = {
        id: row.student_id,
        sectionId,
        cedula: row.cedula,
        nombres: row.nombres,
        apellidos: row.apellidos,
        synced: true,
        createdAt: 0,
        updatedAt: 0,
      };

      const total = row.total_presente + row.total_ausente;
      const porcentajeAsistencia = total > 0 ? Math.round((row.total_presente / total) * 100) : null;

      return {
        student,
        totalPresente: row.total_presente,
        totalAusente: row.total_ausente,
        porcentajeAsistencia,
      };
    });
  } catch (error) {
    logger.error('Error al generar SectionReportRows', error);
    throw error;
  }
}

export interface DailySectionSummary {
  sectionName: string;
  yearLevel: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  absentStudents: { nombres: string; apellidos: string; cedula: string }[];
}

export async function getSectionDailySummary(
  sectionId: string,
  sectionName: string,
  yearLevel: string,
  date: string,
): Promise<DailySectionSummary> {
  try {
    return await computeSectionDailySummary(sectionId, sectionName, yearLevel, date);
  } catch (error) {
    logger.error('Error al obtener el resumen diario de la sección', error);
    throw error;
  }
}

async function computeSectionDailySummary(
  sectionId: string,
  sectionName: string,
  yearLevel: string,
  date: string,
): Promise<DailySectionSummary> {
  const db = await getDb();

  // 1. Obtener matrícula (matrícula total de la sección)
  const countRes = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM students WHERE section_id = ?',
    sectionId,
  );
  const totalStudents = countRes?.count || 0;

  // 2. Obtener conteo de presentes hoy
  const presentRes = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM attendance_records ar
     JOIN students s ON ar.student_id = s.id
     WHERE s.section_id = ? AND ar.date = ? AND ar.status = 'presente'`,
    sectionId,
    date,
  );
  const presentCount = presentRes?.count || 0;

  // 3. Obtener conteo de ausentes hoy
  const absentRes = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM attendance_records ar
     JOIN students s ON ar.student_id = s.id
     WHERE s.section_id = ? AND ar.date = ? AND ar.status = 'ausente'`,
    sectionId,
    date,
  );
  const absentCount = absentRes?.count || 0;

  // 4. Obtener lista de alumnos ausentes hoy
  const absentStudents = await db.getAllAsync<{ nombres: string; apellidos: string; cedula: string }>(
    `SELECT s.nombres, s.apellidos, s.cedula FROM attendance_records ar
     JOIN students s ON ar.student_id = s.id
     WHERE s.section_id = ? AND ar.date = ? AND ar.status = 'ausente'
     ORDER BY s.apellidos, s.nombres`,
    sectionId,
    date,
  );

  return {
    sectionName,
    yearLevel,
    totalStudents,
    presentCount,
    absentCount,
    absentStudents: absentStudents || [],
  };
}

export async function getDailySummaryData(
  teacherId: string,
  date: string,
): Promise<DailySectionSummary[]> {
  try {
    const db = await getDb();

    // Obtener las secciones del profesor
    const sections = await db.getAllAsync<{ id: string; name: string; year_level: string }>(
      'SELECT id, name, year_level FROM sections WHERE teacher_id = ? ORDER BY year_level, name',
      teacherId,
    );

    const summaries: DailySectionSummary[] = [];
    for (const sec of sections) {
      summaries.push(await computeSectionDailySummary(sec.id, sec.name, sec.year_level, date));
    }

    return summaries;
  } catch (error) {
    logger.error('Error al obtener datos de resumen diario', error);
    throw error;
  }
}
