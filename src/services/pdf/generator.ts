import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

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

export async function generateAndSharePDF(html: string, fileName: string): Promise<void> {
  try {
    const sanitized = sanitizeFileName(fileName);
    const targetFileName = `${sanitized}.pdf`;

    // 1. Cargar e inyectar el logo
    const finalHtml = html.replace(/\{\{LOGO_BASE64\}\}/g, LOGO_BASE64);

    // 2. Generar PDF temporal en caché
    const { uri } = await Print.printToFileAsync({ html: finalHtml });

    // 3. Renombrar el archivo temporal con el nombre estructurado en la caché
    let shareUri = uri;
    try {
      const targetUri = `${FileSystem.cacheDirectory}${targetFileName}`;
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
      await FileSystem.copyAsync({
        from: uri,
        to: targetUri,
      });
      shareUri = targetUri;
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (fsError) {
      logger.warn('No se pudo renombrar el archivo PDF en caché', fsError);
    }

    if (Platform.OS === 'ios') {
      // Verificar si se puede compartir y proceder
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          'Compartir no disponible',
          'La opción de compartir no está disponible en este dispositivo.',
        );
        return;
      }

      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Reporte de Asistencia',
      });
    } else {
      // En Android, se pregunta al usuario si desea guardar en el dispositivo o compartir
      Alert.alert(
        'Reporte de Asistencia',
        'El documento PDF ha sido generado correctamente. Seleccione una opción para proceder:',
        [
          {
            text: 'Guardar en Dispositivo',
            onPress: async () => {
              try {
                const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                  const newFileUri = await StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    targetFileName,
                    'application/pdf'
                  );
                  
                  const base64Data = await FileSystem.readAsStringAsync(shareUri, {
                    encoding: 'base64',
                  });
                  
                  await FileSystem.writeAsStringAsync(newFileUri, base64Data, {
                    encoding: 'base64',
                  });
                  
                  Alert.alert(
                    'Archivo Guardado',
                    'El reporte se ha almacenado correctamente en la ubicación seleccionada.'
                  );
                  
                  // Limpiar el archivo temporal
                  await FileSystem.deleteAsync(shareUri, { idempotent: true });
                }
              } catch (saveError) {
                logger.error('Error al guardar PDF en dispositivo Android', saveError);
                Alert.alert(
                  'Error de Guardado',
                  'No se pudo guardar el archivo en el dispositivo. Por favor, intente de nuevo.'
                );
              }
            },
          },
          {
            text: 'Compartir',
            onPress: async () => {
              try {
                const isSharingAvailable = await Sharing.isAvailableAsync();
                if (!isSharingAvailable) {
                  Alert.alert(
                    'Compartir no disponible',
                    'La opción de compartir no está disponible en este dispositivo.',
                  );
                  return;
                }
                await Sharing.shareAsync(shareUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Compartir Reporte de Asistencia',
                });
              } catch (shareError) {
                logger.error('Error al compartir PDF en Android', shareError);
                Alert.alert(
                  'Error al Compartir',
                  'No se pudo abrir el menú de compartición. Por favor, intente de nuevo.'
                );
              }
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: async () => {
              // Limpiar el archivo temporal
              await FileSystem.deleteAsync(shareUri, { idempotent: true });
            },
          },
        ],
        { cancelable: true }
      );
    }
  } catch (error) {
    logger.error('Error generando o procesando PDF', error);
    Alert.alert(
      'Error de Exportación',
      'Ocurrió un problema al generar el documento PDF. Por favor, intente de nuevo.',
    );
    throw error;
  }
}
