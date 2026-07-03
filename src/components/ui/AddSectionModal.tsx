import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Modal, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { colors } from '@/theme';

import type { YearLevel } from '@/modules/sections/types';

interface AddSectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (name: string, yearLevel: YearLevel) => Promise<void>;
}

const YEAR_OPTIONS: { value: YearLevel; label: string }[] = [
  { value: '1ro', label: '1ro' },
  { value: '2do', label: '2do' },
  { value: '3ro', label: '3ro' },
  { value: '4to', label: '4to' },
  { value: '5to', label: '5to' },
];

export function AddSectionModal({ visible, onDismiss, onSubmit }: AddSectionModalProps) {
  const [name, setName] = useState('');
  const [yearLevel, setYearLevel] = useState<YearLevel>('1ro');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName('');
    setYearLevel('1ro');
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), yearLevel);
      reset();
      onDismiss();
    } catch {
      // El error se refleja en sections-store.error y se muestra en la pantalla.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Nueva sección
        </Text>

        <TextInput
          label="Nombre de la sección"
          mode="outlined"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text variant="bodyMedium" style={styles.label}>
          Año
        </Text>
        <SegmentedButtons
          value={yearLevel}
          onValueChange={(value) => setYearLevel(value as YearLevel)}
          buttons={YEAR_OPTIONS}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || !name.trim()}
          contentStyle={styles.buttonContent}
        >
          Crear sección
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    margin: 24,
    padding: 24,
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
  buttonContent: {
    height: 48,
  },
});
