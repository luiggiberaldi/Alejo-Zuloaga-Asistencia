import { StyleSheet } from 'react-native';

import { Button, List, Modal, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';

interface StudentContextMenuProps {
  visible: boolean;
  onDismiss: () => void;
  studentName: string;
  onReportBehavior: () => void;
  onDeleteStudent: () => void;
}

export function StudentContextMenu({
  visible,
  onDismiss,
  studentName,
  onReportBehavior,
  onDeleteStudent,
}: StudentContextMenuProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>
          Opciones de estudiante:
        </Text>
        <Text variant="bodyLarge" style={styles.studentName}>
          {studentName}
        </Text>

        <List.Section style={styles.list}>
          <List.Item
            title="Reportar comportamiento"
            left={(props) => <List.Icon {...props} icon="alert-circle-outline" />}
            onPress={() => {
              onDismiss();
              onReportBehavior();
            }}
            titleStyle={styles.itemText}
            style={styles.item}
          />
          <List.Item
            title="Eliminar estudiante"
            left={(props) => <List.Icon {...props} icon="delete-outline" color={colors.danger} />}
            onPress={() => {
              onDismiss();
              onDeleteStudent();
            }}
            titleStyle={[styles.itemText, { color: colors.danger }]}
            style={styles.item}
          />
        </List.Section>

        <Button mode="outlined" onPress={onDismiss} style={styles.cancelButton}>
          Cancelar
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  studentName: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  list: {
    marginVertical: 8,
  },
  item: {
    paddingVertical: 8,
  },
  itemText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
});
