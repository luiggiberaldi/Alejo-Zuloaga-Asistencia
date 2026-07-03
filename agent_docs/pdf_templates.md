# Plantillas PDF — Alejo Zuloaga Asistencia

La app genera reportes en PDF con `expo-print` y los comparte con `expo-sharing`. Las plantillas se
implementan como **funciones puras** en `src/services/pdf/templates.ts` que reciben datos y retornan
un `string` de HTML. `expo-print` **no soporta CSS externo**, por lo que todos los estilos van inline.

Los colores institucionales usados aquí están definidos en [ui_ux_guidelines.md](ui_ux_guidelines.md)
(primario `#1B5E20`, texto `#212121`, etc.).

## 1. PDF individual por estudiante

Estructura del HTML:
- **Header:** nombre del liceo ("Complejo Educativo Alejo Zuloaga") y logo si está disponible.
- **Datos del estudiante:** nombre completo, cédula, sección.
- **Tabla de asistencias del período:** columnas `fecha` y `estado` (presente/ausente).
- **Conteo:** total de presentes, total de ausentes y **% de asistencia**.
- **Reportes de comportamiento:** lista con `fecha`, `descripción` y `severidad` (leve/moderado/grave).
- **Footer:** fecha de generación del reporte.

```ts
export function studentReportHtml(data: StudentReportData): string {
  return `
    <html><body style="font-family: sans-serif; color: #212121; padding: 24px;">
      <h1 style="color: #1B5E20;">Complejo Educativo Alejo Zuloaga</h1>
      <h2>Reporte individual</h2>
      <p><b>Estudiante:</b> ${data.nombres} ${data.apellidos}<br/>
         <b>Cédula:</b> ${data.cedula}<br/>
         <b>Sección:</b> ${data.sectionName} (${data.yearLevel})</p>
      <table style="width:100%; border-collapse: collapse;">
        <tr style="background:#1B5E20; color:#fff;">
          <th style="padding:8px; text-align:left;">Fecha</th>
          <th style="padding:8px; text-align:left;">Estado</th>
        </tr>
        ${data.records.map(r => `
          <tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${r.date}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd; color:${
              r.status === 'presente' ? '#2E7D32' : '#C62828'
            };">${r.status}</td>
          </tr>`).join('')}
      </table>
      <p><b>Presentes:</b> ${data.totalPresent} &nbsp;
         <b>Ausentes:</b> ${data.totalAbsent} &nbsp;
         <b>% Asistencia:</b> ${data.attendancePct}%</p>
      <footer style="margin-top:32px; font-size:12px; color:#888;">
        Generado el ${data.generatedAt}
      </footer>
    </body></html>`;
}
```

## 2. PDF general de sección

- **Header:** nombre del liceo.
- **Tabla resumen:** una fila por estudiante con columnas `estudiante`, `total presentes`,
  `total ausentes`, `% asistencia`.
- **Footer:** fecha de generación.

## 3. PDF consolidado (coordinador)

- **Header:** nombre del liceo.
- **Resumen por profesor:** `nombre`, `sección`, `total estudiantes`, `% asistencia promedio`.
- **Resumen por sección:** `sección`, `total estudiantes`, `% asistencia`.
- **Footer:** fecha de generación.

## Generación y compartición

```ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 }); // A4 en puntos
await Sharing.shareAsync(uri, {
  mimeType: 'application/pdf',
  dialogTitle: 'Compartir reporte',
});
```

## Notas de implementación

- Tamaño A4: `width: 595, height: 842` puntos.
- Todo el CSS va **inline** en los elementos; no usar `<link>` ni `<style>` externos.
- Escapar/limpiar los datos de texto libre (descripciones de comportamiento) antes de interpolarlos
  en el HTML para evitar romper el marcado.
- Las funciones de plantilla viven en `src/services/pdf/templates.ts`; la lógica de recolección de
  datos va en el módulo `reports`, respetando el Repository pattern.
