import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { logger } from '@/services/logger';

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

async function getLogoBase64(): Promise<string> {
  try {
    const asset = Asset.fromModule(require('../../../assets/images/logo.png'));
    await asset.downloadAsync();
    
    let localUri = asset.localUri;
    
    if (!localUri && asset.uri) {
      if (asset.uri.startsWith('http://') || asset.uri.startsWith('https://')) {
        const cachePath = `${FileSystem.cacheDirectory}logo_temp.png`;
        const downloadResult = await FileSystem.downloadAsync(asset.uri, cachePath);
        localUri = downloadResult.uri;
      } else {
        localUri = asset.uri;
      }
    }

    if (!localUri) {
      logger.warn('No se pudo determinar una URI local para el logo');
      return '';
    }

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    logger.error('Error al cargar el logo para PDF', error);
    return '';
  }
}

export async function generateAndSharePDF(html: string, fileName: string): Promise<void> {
  try {
    const sanitized = sanitizeFileName(fileName);
    const targetFileName = `${sanitized}.pdf`;

    // 1. Cargar e inyectar el logo
    const logoBase64 = await getLogoBase64();
    const finalHtml = html.replace(/\{\{LOGO_BASE64\}\}/g, logoBase64);

    // 2. Generar PDF temporal en caché
    const { uri } = await Print.printToFileAsync({ html: finalHtml });

    if (Platform.OS === 'ios') {
      // En iOS podemos copiar el archivo para renombrarlo sin problemas
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
        logger.warn('No se pudo renombrar el archivo PDF en iOS', fsError);
      }

      // 3. Verificar si se puede compartir y proceder
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
        dialogTitle: 'Compartir reporte de asistencia',
      });
    } else {
      // En Android, se pregunta al usuario si desea guardar en el dispositivo o compartir
      Alert.alert(
        'Reporte Generado',
        '¿Qué deseas hacer con el reporte de asistencia?',
        [
          {
            text: 'Descargar / Guardar',
            onPress: async () => {
              try {
                const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                  const newFileUri = await StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    targetFileName,
                    'application/pdf'
                  );
                  
                  const base64Data = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
                  });
                  
                  await FileSystem.writeAsStringAsync(newFileUri, base64Data, {
                    encoding: 'base64',
                  });
                  
                  Alert.alert(
                    'Guardado',
                    'El reporte se ha guardado exitosamente en tu dispositivo.'
                  );
                  
                  // Limpiar el archivo temporal
                  await FileSystem.deleteAsync(uri, { idempotent: true });
                }
              } catch (saveError) {
                logger.error('Error al guardar PDF en dispositivo Android', saveError);
                Alert.alert(
                  'Error',
                  'No se pudo guardar el archivo. Por favor, intenta de nuevo.'
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
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Compartir reporte de asistencia',
                });
              } catch (shareError) {
                logger.error('Error al compartir PDF en Android', shareError);
                Alert.alert(
                  'Error',
                  'Ocurrió un error al intentar compartir el reporte.'
                );
              }
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: async () => {
              // Limpiar el archivo temporal
              await FileSystem.deleteAsync(uri, { idempotent: true });
            },
          },
        ],
        { cancelable: true }
      );
    }
  } catch (error) {
    logger.error('Error generando o procesando PDF', error);
    Alert.alert(
      'Error',
      'No se pudo generar el reporte PDF. Por favor, intenta de nuevo.',
    );
    throw error;
  }
}
