import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Modal, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { colors } from '@/theme';

import type { BehaviorSeverity } from '@/modules/behavior/types';

interface BehaviorReportModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (description: string, severity: BehaviorSeverity) => Promise<void>;
}

const SEVERITY_OPTIONS: { value: BehaviorSeverity; label: string }[] = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'grave', label: 'Grave' },
];

export function BehaviorReportModal({ visible, onDismiss, onSubmit }: BehaviorReportModalProps) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<BehaviorSeverity>('leve');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setDescription('');
    setSeverity('leve');
  }

  async function handleSubmit() {
    if (description.trim().length < 5) return;
    setSubmitting(true);
    try {
      await onSubmit(description.trim(), severity);
      reset();
      onDismiss();
    } catch {
      // El error se maneja en el store con Alert
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = description.trim().length >= 5;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Reportar comportamiento
        </Text>

        <TextInput
          label="Descripción de la conducta"
          mode="outlined"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          placeholder="Escribe los detalles aquí..."
        />

        <Text variant="bodyMedium" style={styles.label}>
          Nivel de gravedad
        </Text>
        <SegmentedButtons
          value={severity}
          onValueChange={(val) => setSeverity(val as BehaviorSeverity)}
          buttons={SEVERITY_OPTIONS}
          style={styles.input}
        />

        <View style={styles.actions}>
          <Button mode="outlined" onPress={onDismiss} disabled={submitting} style={styles.button}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !isValid}
            style={styles.button}
            buttonColor={colors.primary}
          >
            Guardar
          </Button>
        </View>
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
    marginBottom: 16,
    color: colors.text,
  },
  label: {
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 100,
  },
});
