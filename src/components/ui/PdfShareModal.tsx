import { StyleSheet } from 'react-native';

import { Button, List, Modal, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';

interface PdfShareModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: () => void;
  onShare: () => void;
  title?: string;
}

export function PdfShareModal({
  visible,
  onDismiss,
  onSave,
  onShare,
  title = 'Reporte generado',
}: PdfShareModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Selecciona una opción para continuar
        </Text>

        <List.Section style={styles.list}>
          <List.Item
            title="Guardar en dispositivo"
            left={(props) => <List.Icon {...props} icon="download-outline" color={colors.primary} />}
            onPress={() => {
              onDismiss();
              onSave();
            }}
            titleStyle={styles.itemText}
            style={styles.item}
          />
          <List.Item
            title="Compartir"
            left={(props) => <List.Icon {...props} icon="share-variant-outline" color={colors.primary} />}
            onPress={() => {
              onDismiss();
              onShare();
            }}
            titleStyle={styles.itemText}
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
    fontWeight: 'bold',
  },
  subtitle: {
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
  cancelButton: {
    marginTop: 8,
  },
});
