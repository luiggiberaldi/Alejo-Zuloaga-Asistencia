import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { colors } from '@/theme';

interface AddStudentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (cedula: string, nombres: string, apellidos: string) => Promise<void>;
}

export function AddStudentModal({ visible, onDismiss, onSubmit }: AddStudentModalProps) {
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCedula('');
    setNombres('');
    setApellidos('');
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(cedula.trim(), nombres.trim(), apellidos.trim());
      reset();
      onDismiss();
    } catch {
      // El error se refleja en students-store.error y se muestra en la pantalla.
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = cedula.trim() && nombres.trim() && apellidos.trim();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Nuevo estudiante
        </Text>

        <TextInput
          label="Cédula"
          mode="outlined"
          keyboardType="number-pad"
          value={cedula}
          onChangeText={setCedula}
          style={styles.input}
        />
        <TextInput
          label="Nombres"
          mode="outlined"
          value={nombres}
          onChangeText={setNombres}
          style={styles.input}
        />
        <TextInput
          label="Apellidos"
          mode="outlined"
          value={apellidos}
          onChangeText={setApellidos}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || !isValid}
          contentStyle={styles.buttonContent}
        >
          Registrar estudiante
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
  input: {
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
});
