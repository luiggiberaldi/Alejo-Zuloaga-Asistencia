import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import { logger } from '@/services/logger';

export function sanitizeFileName(name: string): string {
  if (!name) return 'reporte';
  return name
    .normalize('NFD') // Quitar acentos y diacríticos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // Cambiar no alfanuméricos por guiones bajos
    .replace(/_+/g, '_') // Colapsar guiones múltiples
    .substring(0, 50); // Truncar a 50 caracteres
}

export async function generateAndSharePDF(html: string, fileName: string): Promise<void> {
  try {
    const sanitized = sanitizeFileName(fileName);
    const targetFileName = `${sanitized}.pdf`;

    // 1. Generar PDF temporal en caché
    const { uri } = await Print.printToFileAsync({ html });

    // 2. Renombrar archivo usando FileSystem para mantener el nombre exacto al compartir
    const targetUri = `${FileSystem.cacheDirectory}${targetFileName}`;
    await FileSystem.moveAsync({
      from: uri,
      to: targetUri,
    });

    // 3. Verificar si se puede compartir y proceder
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert(
        'Compartir no disponible',
        'La opción de compartir no está disponible en este dispositivo.',
      );
      return;
    }

    await Sharing.shareAsync(targetUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir reporte de asistencia',
    });
  } catch (error) {
    logger.error('Error generando o compartiendo PDF', error);
    Alert.alert(
      'Error',
      'No se pudo generar o compartir el reporte PDF. Por favor, intenta de nuevo.',
    );
    throw error;
  }
}
