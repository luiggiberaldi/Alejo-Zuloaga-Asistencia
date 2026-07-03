import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

import { logger } from '@/services/logger';

export interface ParsedStudent {
  cedula: string;
  nombres: string;
  apellidos: string;
}

const REQUIRED_COLUMNS = ['cedula', 'nombres', 'apellidos'] as const;
const MAX_ROWS = 100;

function assertValidExtension(fileUri: string): void {
  const lower = fileUri.toLowerCase();
  if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
    throw new Error('El archivo debe ser de formato .XLS o .XLSX');
  }
}

function assertRequiredColumns(headerRow: unknown[]): void {
  const headers = headerRow.map((cell) => String(cell ?? '').trim().toLowerCase());
  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      throw new Error(`Falta la columna '${column}' en el archivo`);
    }
  }
}

function isBlankRow(row: unknown[] | undefined): boolean {
  return !row || row.length === 0 || row.every((cell) => String(cell ?? '').trim() === '');
}

export async function parseXLS(fileUri: string): Promise<ParsedStudent[]> {
  assertValidExtension(fileUri);

  let base64Data: string;
  try {
    base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    logger.error('Error leyendo el archivo .XLS', error);
    throw new Error('No se pudo leer el archivo seleccionado.');
  }

  let rawRows: unknown[][];
  try {
    const workbook = XLSX.read(base64Data, { type: 'base64' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('El archivo no tiene hojas con datos.');
    }
    const sheet = workbook.Sheets[sheetName];
    rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  } catch (error) {
    logger.error('Error parseando el archivo .XLS', error);
    throw error instanceof Error ? error : new Error('No se pudo leer el archivo .XLS.');
  }

  if (rawRows.length === 0) {
    throw new Error('El archivo no tiene datos.');
  }

  const [headerRow, ...allDataRows] = rawRows;
  assertRequiredColumns(headerRow);

  const headers = headerRow.map((cell) => String(cell ?? '').trim().toLowerCase());
  const cedulaIndex = headers.indexOf('cedula');
  const nombresIndex = headers.indexOf('nombres');
  const apellidosIndex = headers.indexOf('apellidos');

  // Una fila vacía marca el fin de los datos (agent_docs/excel_template.md).
  const blankIndex = allDataRows.findIndex(isBlankRow);
  const dataRows = blankIndex === -1 ? allDataRows : allDataRows.slice(0, blankIndex);

  if (dataRows.length > MAX_ROWS) {
    throw new Error(
      `El archivo tiene ${dataRows.length} estudiantes. El máximo por importación es ${MAX_ROWS}.`,
    );
  }

  const students: ParsedStudent[] = [];
  const seenCedulas = new Set<string>();

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // fila 1 = encabezados
    const cedula = String(row[cedulaIndex] ?? '').trim();
    const nombres = String(row[nombresIndex] ?? '').trim();
    const apellidos = String(row[apellidosIndex] ?? '').trim();

    if (!cedula || !nombres || !apellidos) {
      throw new Error(
        `Hay celdas vacías en la fila ${rowNumber}. Todos los campos son obligatorios.`,
      );
    }

    if (seenCedulas.has(cedula)) {
      throw new Error(`La cédula ${cedula} está duplicada en el archivo`);
    }
    seenCedulas.add(cedula);

    students.push({ cedula, nombres, apellidos });
  });

  if (students.length === 0) {
    throw new Error('El archivo no tiene estudiantes para importar.');
  }

  return students;
}
