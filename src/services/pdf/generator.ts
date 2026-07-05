import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import { logger } from '@/services/logger';

import { LOGO_BASE64 } from './logo-base64';

const { StorageAccessFramework } = FileSystem;

export function sanitizeFileName(name: string): string {
  if (!name) return 'reporte';
  return name
    .normalize('NFD') // Quitar acentos y diacríticos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // Cambiar no alfanuméricos por guiones bajos
    .replace(/_+/g, '_') // Colapsar guiones múltiples
    .substring(0, 50); // Truncar a 50 caracteres
}

interface PdfFile {
  uri: string;
  targetFileName: string;
}

async function buildPdfFile(html: string, fileName: string): Promise<PdfFile> {
  const sanitized = sanitizeFileName(fileName);
  const targetFileName = `${sanitized}.pdf`;

  // 1. Cargar e inyectar el logo
  const finalHtml = html.replace(/\{\{LOGO_BASE64\}\}/g, LOGO_BASE64);

  // 2. Generar PDF temporal en caché
  const { uri } = await Print.printToFileAsync({ html: finalHtml });

  // 3. Renombrar el archivo temporal con el nombre estructurado en la caché
  let resultUri = uri;
  try {
    const targetUri = `${FileSystem.cacheDirectory}${targetFileName}`;
    await FileSystem.deleteAsync(targetUri, { idempotent: true });
    await FileSystem.copyAsync({
      from: uri,
      to: targetUri,
    });
    resultUri = targetUri;
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (fsError) {
    logger.warn('No se pudo renombrar el archivo PDF en caché', fsError);
  }

  return { uri: resultUri, targetFileName };
}

export async function savePDFToDevice(html: string, fileName: string): Promise<void> {
  try {
    const { uri, targetFileName } = await buildPdfFile(html, fileName);
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return;

    const newFileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      targetFileName,
      'application/pdf',
    );

    const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    await FileSystem.writeAsStringAsync(newFileUri, base64Data, { encoding: 'base64' });

    Alert.alert('Archivo Guardado', 'El reporte se ha almacenado correctamente en la ubicación seleccionada.');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    logger.error('Error al guardar PDF en dispositivo', error);
    Alert.alert('Error de Guardado', 'No se pudo guardar el archivo en el dispositivo. Por favor, intente de nuevo.');
    throw error;
  }
}

export async function sharePDFDirectly(html: string, fileName: string): Promise<void> {
  try {
    const { uri } = await buildPdfFile(html, fileName);
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert('Compartir no disponible', 'La opción de compartir no está disponible en este dispositivo.');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir Reporte de Asistencia',
    });
  } catch (error) {
    logger.error('Error al compartir PDF', error);
    Alert.alert('Error al Compartir', 'No se pudo abrir el menú de compartición. Por favor, intente de nuevo.');
    throw error;
  }
}

