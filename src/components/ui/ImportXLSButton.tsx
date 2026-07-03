import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import { Button, DataTable, Dialog, IconButton, Portal, Text } from 'react-native-paper';

import { StudentPreviewModal } from '@/components/ui/StudentPreviewModal';
import { logger } from '@/services/logger';
import { parseXLS } from '@/services/xlsx-import';
import { useStudentsStore } from '@/store/students-store';
import { colors } from '@/theme';

import type { ParsedStudent } from '@/services/xlsx-import';

interface ImportXLSButtonProps {
  sectionId: string;
}

const TEMPLATE_EXAMPLE_ROWS: ParsedStudent[] = [
  { cedula: '28012345', nombres: 'María José', apellidos: 'González Pérez' },
  { cedula: '28012346', nombres: 'Carlos Eduardo', apellidos: 'Rodríguez Silva' },
];

// Botón compacto (apto para el header): al presionarlo primero se muestra la
// plantilla/reglas ("accesible desde el botón de importar") y desde ahí se
// procede a elegir el archivo.
export function ImportXLSButton({ sectionId }: ImportXLSButtonProps) {
  const [templateVisible, setTemplateVisible] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<ParsedStudent[] | null>(null);
  const [importing, setImporting] = useState(false);
  const addStudentsBatch = useStudentsStore((state) => state.addStudentsBatch);

  async function handlePickFile() {
    setTemplateVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const students = await parseXLS(result.assets[0].uri);
      setPreviewStudents(students);
    } catch (error) {
      logger.warn('Fallo al importar archivo .XLS', error);
      const message = error instanceof Error ? error.message : 'No se pudo leer el archivo.';
      Alert.alert('Error al importar', message);
    }
  }

  async function handleConfirmImport() {
    if (!previewStudents) return;

    setImporting(true);
    try {
      await addStudentsBatch(
        previewStudents.map((student) => ({
          sectionId,
          cedula: student.cedula,
          nombres: student.nombres,
          apellidos: student.apellidos,
        })),
      );
      const count = previewStudents.length;
      setPreviewStudents(null);
      Alert.alert('Importación exitosa', `${count} estudiantes importados correctamente.`);
    } catch {
      Alert.alert('Error', 'No se pudieron importar los estudiantes. Intenta de nuevo.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <IconButton
        icon="file-upload-outline"
        size={24}
        style={styles.headerButton}
        iconColor="#FFFFFF"
        onPress={() => setTemplateVisible(true)}
        accessibilityLabel="Importar .XLS"
      />

      <Portal>
        <Dialog visible={templateVisible} onDismiss={() => setTemplateVisible(false)}>
          <Dialog.Title>Importar estudiantes desde .XLS</Dialog.Title>
          <Dialog.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>cedula</DataTable.Title>
                <DataTable.Title>nombres</DataTable.Title>
                <DataTable.Title>apellidos</DataTable.Title>
              </DataTable.Header>
              {TEMPLATE_EXAMPLE_ROWS.map((row) => (
                <DataTable.Row key={row.cedula}>
                  <DataTable.Cell>{row.cedula}</DataTable.Cell>
                  <DataTable.Cell>{row.nombres}</DataTable.Cell>
                  <DataTable.Cell>{row.apellidos}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
            <Text variant="bodySmall" style={styles.rules}>
              • Fila 1: encabezados obligatorios (cedula, nombres, apellidos){'\n'}
              • Sin filas vacías intermedias{'\n'}
              • Cédula sin puntos ni guiones{'\n'}
              • Máximo 100 estudiantes por importación
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTemplateVisible(false)}>Cancelar</Button>
            <Button onPress={handlePickFile}>Seleccionar archivo</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <StudentPreviewModal
        visible={!!previewStudents}
        students={previewStudents ?? []}
        submitting={importing}
        onCancel={() => setPreviewStudents(null)}
        onConfirm={handleConfirmImport}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    minWidth: 48,
    minHeight: 48,
    margin: 0,
  },
  rules: {
    marginTop: 12,
    color: colors.text,
  },
});
