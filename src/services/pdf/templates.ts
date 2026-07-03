import type { DateRange, SectionReportRow, StudentReportData } from '@/modules/reports/types';

export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const monthLabel = months[monthIndex] || parts[1];
  return `${day} de ${monthLabel} de ${year}`;
}

export function generateStudentReportHTML(
  data: StudentReportData,
  sectionName: string,
  dateRange: DateRange,
): string {
  const escNombres = escapeHtml(data.student.nombres);
  const escApellidos = escapeHtml(data.student.apellidos);
  const escCedula = escapeHtml(data.student.cedula);
  const escSectionName = escapeHtml(sectionName);

  const pctLabel =
    data.porcentajeAsistencia !== null ? `${data.porcentajeAsistencia}%` : 'Sin datos';

  const generatedAt = formatDateSpanish(new Date().toISOString().split('T')[0]);
  const rangeStartLabel = formatDateSpanish(dateRange.startDate);
  const rangeEndLabel = formatDateSpanish(dateRange.endDate);

  // Renderizar filas de asistencia
  let attendanceRowsHTML = '';
  if (data.attendanceRecords.length === 0) {
    attendanceRowsHTML = `
      <tr>
        <td colspan="2" style="padding: 12px; text-align: center; color: #666; font-style: italic;">
          Sin registros en este periodo
        </td>
      </tr>`;
  } else {
    attendanceRowsHTML = data.attendanceRecords
      .map((r) => {
        const isPresent = r.status === 'presente';
        const color = isPresent ? '#2E7D32' : '#C62828';
        const bgColor = isPresent ? '#E8F5E9' : '#FFEBEE';
        const statusLabel = isPresent ? 'Presente' : 'Ausente';
        return `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 10px; border-bottom: 1px solid #E0E0E0; font-size: 14px;">
            ${formatDateSpanish(r.date)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E0E0E0; font-size: 14px; font-weight: bold; color: ${color}; background-color: ${bgColor}; text-align: center; border-radius: 4px;">
            ${statusLabel}
          </td>
        </tr>`;
      })
      .join('');
  }

  // Renderizar filas de comportamiento
  let behaviorRowsHTML = '';
  if (data.behaviorReports.length === 0) {
    behaviorRowsHTML = `
      <tr>
        <td colspan="3" style="padding: 12px; text-align: center; color: #666; font-style: italic;">
          Sin reportes de comportamiento en este periodo
        </td>
      </tr>`;
  } else {
    behaviorRowsHTML = data.behaviorReports
      .map((r) => {
        let sevColor = '#B7950B';
        let sevBg = '#FFF9C4';
        let sevLabel = 'Leve';

        if (r.severity === 'moderado') {
          sevColor = '#E65100';
          sevBg = '#FFE0B2';
          sevLabel = 'Moderado';
        } else if (r.severity === 'grave') {
          sevColor = '#C62828';
          sevBg = '#FFCDD2';
          sevLabel = 'Grave';
        }

        return `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 10px; border-bottom: 1px solid #E0E0E0; font-size: 14px; white-space: nowrap;">
            ${formatDateSpanish(r.date)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E0E0E0; font-size: 14px;">
            ${escapeHtml(r.description)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E0E0E0; font-size: 14px; font-weight: bold; color: ${sevColor}; background-color: ${sevBg}; text-align: center; border-radius: 4px;">
            ${sevLabel}
          </td>
        </tr>`;
      })
      .join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #212121; line-height: 1.5; padding: 30px; margin: 0; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1B5E20; padding-bottom: 15px; }
        .header h1 { color: #1B5E20; margin: 0; font-size: 22px; font-weight: bold; }
        .header p { margin: 5px 0 0 0; color: #555; font-size: 14px; }
        .info-card { background-color: #F5F5F5; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #1B5E20; }
        .info-card table { width: 100%; }
        .info-card td { padding: 4px 8px; font-size: 14px; }
        .info-card td.label { font-weight: bold; color: #555; width: 120px; }
        .section-title { color: #1B5E20; font-size: 16px; border-bottom: 2px solid #1B5E20; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; font-weight: bold; }
        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.data-table th { background-color: #1B5E20; color: white; padding: 10px; font-size: 14px; font-weight: bold; text-align: left; }
        table.data-table td { padding: 8px 10px; border-bottom: 1px solid #E0E0E0; font-size: 14px; }
        .summary-box { display: flex; justify-content: space-around; background-color: #E8F5E9; border: 1px solid #C8E6C9; padding: 15px; border-radius: 8px; margin-top: 15px; }
        .summary-item { text-align: center; }
        .summary-val { font-size: 18px; font-weight: bold; color: #1B5E20; }
        .summary-lbl { font-size: 12px; color: #555; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 50px; border-top: 1px solid #E0E0E0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Complejo Educativo Alejo Zuloaga</h1>
        <p>Alejo Zuloaga Asistencia — Reporte Individual de Asistencia</p>
      </div>

      <div class="info-card">
        <table>
          <tr>
            <td class="label">Estudiante:</td>
            <td><b>${escApellidos}, ${escNombres}</b></td>
          </tr>
          <tr>
            <td class="label">Cédula:</td>
            <td>${escCedula}</td>
          </tr>
          <tr>
            <td class="label">Sección:</td>
            <td>${escSectionName}</td>
          </tr>
          <tr>
            <td class="label">Rango:</td>
            <td>Desde el ${rangeStartLabel} hasta el ${rangeEndLabel}</td>
          </tr>
        </table>
      </div>

      <div class="section-title">Historial de Asistencia</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th style="width: 150px; text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceRowsHTML}
        </tbody>
      </table>

      ${
        data.attendanceRecords.length > 0
          ? `
      <div class="summary-box">
        <div class="summary-item">
          <div class="summary-val">${data.totalPresente}</div>
          <div class="summary-lbl">Días Presente</div>
        </div>
        <div class="summary-item">
          <div class="summary-val">${data.totalAusente}</div>
          <div class="summary-lbl">Días Ausente</div>
        </div>
        <div class="summary-item">
          <div class="summary-val">${pctLabel}</div>
          <div class="summary-lbl">Porcentaje de Asistencia</div>
        </div>
      </div>
      `
          : ''
      }

      <div class="section-title">Reportes de Comportamiento</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 150px;">Fecha</th>
            <th>Descripción</th>
            <th style="width: 120px; text-align: center;">Severidad</th>
          </tr>
        </thead>
        <tbody>
          ${behaviorRowsHTML}
        </tbody>
      </table>

      <div class="footer">
        Reporte oficial generado por Alejo Zuloaga Asistencia el ${generatedAt}.<br/>
        Rango de análisis: ${rangeStartLabel} - ${rangeEndLabel}.
      </div>
    </body>
    </html>`;
}

export function generateSectionReportHTML(
  rows: SectionReportRow[],
  sectionName: string,
  dateRange: DateRange,
): string {
  const escSectionName = escapeHtml(sectionName);
  const generatedAt = formatDateSpanish(new Date().toISOString().split('T')[0]);
  const rangeStartLabel = formatDateSpanish(dateRange.startDate);
  const rangeEndLabel = formatDateSpanish(dateRange.endDate);

  // Calcular promedios globales de la sección
  let totalPresentesSeccion = 0;
  let totalAusentesSeccion = 0;

  rows.forEach((r) => {
    totalPresentesSeccion += r.totalPresente;
    totalAusentesSeccion += r.totalAusente;
  });

  const totalGlobal = totalPresentesSeccion + totalAusentesSeccion;
  const promAsistenciaVal =
    totalGlobal > 0 ? Math.round((totalPresentesSeccion / totalGlobal) * 100) : null;
  const promAsistenciaLabel = promAsistenciaVal !== null ? `${promAsistenciaVal}%` : 'Sin datos';

  let tableRowsHTML = '';
  if (rows.length === 0) {
    tableRowsHTML = `
      <tr>
        <td colspan="5" style="padding: 12px; text-align: center; color: #666; font-style: italic;">
          Sección sin estudiantes registrados
        </td>
      </tr>`;
  } else {
    tableRowsHTML = rows
      .map((r, index) => {
        const escNombres = escapeHtml(r.student.nombres);
        const escApellidos = escapeHtml(r.student.apellidos);
        const escCedula = escapeHtml(r.student.cedula);
        const pct = r.porcentajeAsistencia !== null ? `${r.porcentajeAsistencia}%` : 'Sin datos';

        return `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 8px 10px; border-bottom: 1px solid #E0E0E0; text-align: center;">
            ${index + 1}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E0E0E0;">
            ${escApellidos}, ${escNombres}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E0E0E0; text-align: center;">
            ${escCedula}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E0E0E0; text-align: center;">
            ${r.totalPresente}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E0E0E0; text-align: center;">
            ${r.totalAusente}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #E0E0E0; text-align: center; font-weight: bold; color: #1B5E20;">
            ${pct}
          </td>
        </tr>`;
      })
      .join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #212121; line-height: 1.5; padding: 30px; margin: 0; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1B5E20; padding-bottom: 15px; }
        .header h1 { color: #1B5E20; margin: 0; font-size: 22px; font-weight: bold; }
        .header p { margin: 5px 0 0 0; color: #555; font-size: 14px; }
        .info-card { background-color: #F5F5F5; padding: 12px 15px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #1B5E20; }
        .info-card table { width: 100%; }
        .info-card td { padding: 4px 8px; font-size: 14px; }
        .info-card td.label { font-weight: bold; color: #555; width: 120px; }
        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.data-table th { background-color: #1B5E20; color: white; padding: 10px; font-size: 12px; font-weight: bold; text-align: center; text-transform: uppercase; }
        table.data-table th.left { text-align: left; }
        table.data-table td { font-size: 13px; }
        .totals-row { background-color: #E8F5E9; font-weight: bold; }
        .totals-row td { padding: 10px; border-top: 2px solid #1B5E20; border-bottom: 2px solid #1B5E20; text-align: center; font-size: 14px; }
        .footer { text-align: center; font-size: 11px; color: #888; margin-top: 50px; border-top: 1px solid #E0E0E0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Complejo Educativo Alejo Zuloaga</h1>
        <p>Alejo Zuloaga Asistencia — Reporte de Sección</p>
      </div>

      <div class="info-card">
        <table>
          <tr>
            <td class="label">Sección:</td>
            <td><b>${escSectionName}</b></td>
          </tr>
          <tr>
            <td class="label">Rango de análisis:</td>
            <td>Desde el ${rangeStartLabel} hasta el ${rangeEndLabel}</td>
          </tr>
        </table>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">N°</th>
            <th class="left">Estudiante</th>
            <th style="width: 100px;">Cédula</th>
            <th style="width: 80px;">Asistencias</th>
            <th style="width: 80px;">Inasistencias</th>
            <th style="width: 90px;">% Asistencia</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
          
          ${
            rows.length > 0
              ? `
          <tr class="totals-row" style="page-break-inside: avoid;">
            <td></td>
            <td style="text-align: left; padding: 10px;">RESUMEN DE SECCIÓN</td>
            <td></td>
            <td>${totalPresentesSeccion}</td>
            <td>${totalAusentesSeccion}</td>
            <td style="color: #1B5E20; font-size: 14px;">${promAsistenciaLabel}</td>
          </tr>
          `
              : ''
          }
        </tbody>
      </table>

      <div class="footer">
        Reporte consolidado de sección generado por Alejo Zuloaga Asistencia el ${generatedAt}.<br/>
        Rango de análisis: ${rangeStartLabel} - ${rangeEndLabel}.
      </div>
    </body>
    </html>`;
}
