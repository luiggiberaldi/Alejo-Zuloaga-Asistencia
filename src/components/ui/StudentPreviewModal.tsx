import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, DataTable, Modal, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { ParsedStudent } from '@/services/xlsx-import';

interface StudentPreviewModalProps {
  visible: boolean;
  students: ParsedStudent[];
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StudentPreviewModal({
  visible,
  students,
  submitting,
  onCancel,
  onConfirm,
}: StudentPreviewModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Confirmar importación
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Se detectaron {students.length} {students.length === 1 ? 'estudiante' : 'estudiantes'}.
        </Text>

        <ScrollView style={styles.table}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Cédula</DataTable.Title>
              <DataTable.Title>Nombres</DataTable.Title>
              <DataTable.Title>Apellidos</DataTable.Title>
            </DataTable.Header>
            {students.map((student) => (
              <DataTable.Row key={student.cedula}>
                <DataTable.Cell>{student.cedula}</DataTable.Cell>
                <DataTable.Cell>{student.nombres}</DataTable.Cell>
                <DataTable.Cell>{student.apellidos}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={onCancel} disabled={submitting} style={styles.actionButton}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={submitting}
            disabled={submitting}
            style={styles.actionButton}
          >
            Confirmar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: '80%',
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: colors.text,
  },
  table: {
    maxHeight: 320,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
  },
});
