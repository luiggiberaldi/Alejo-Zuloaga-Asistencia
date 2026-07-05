import { StyleSheet } from 'react-native';

import { Button, List, Modal, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';

interface AttendanceCompletionModalProps {
  visible: boolean;
  onDismiss: () => void;
  presentCount: number;
  absentCount: number;
  onUploadToCloud: () => void;
  onDownloadSummary: () => void;
  onShareSummary: () => void;
}

export function AttendanceCompletionModal({
  visible,
  onDismiss,
  presentCount,
  absentCount,
  onUploadToCloud,
  onDownloadSummary,
  onShareSummary,
}: AttendanceCompletionModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>
          ¡Asistencia registrada!
        </Text>
        <Text variant="bodyLarge" style={styles.summary}>
          {presentCount} presentes, {absentCount} ausentes
        </Text>

        <List.Section style={styles.list}>
          <List.Item
            title="Subir a la nube"
            left={(props) => <List.Icon {...props} icon="cloud-upload-outline" color={colors.primary} />}
            onPress={() => {
              onDismiss();
              onUploadToCloud();
            }}
            titleStyle={styles.itemText}
            style={styles.item}
          />
          <List.Item
            title="Descargar resumen"
            left={(props) => <List.Icon {...props} icon="download-outline" color={colors.primary} />}
            onPress={() => {
              onDismiss();
              onDownloadSummary();
            }}
            titleStyle={styles.itemText}
            style={styles.item}
          />
          <List.Item
            title="Compartir"
            left={(props) => <List.Icon {...props} icon="share-variant-outline" color={colors.primary} />}
            onPress={() => {
              onDismiss();
              onShareSummary();
            }}
            titleStyle={styles.itemText}
            style={styles.item}
          />
        </List.Section>

        <Button mode="outlined" onPress={onDismiss} style={styles.closeButton}>
          Cerrar
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
    fontWeight: 'bold',
  },
  summary: {
    color: colors.text,
    textAlign: 'center',
    opacity: 0.7,
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
  closeButton: {
    marginTop: 8,
  },
});
