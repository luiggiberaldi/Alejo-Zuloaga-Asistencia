import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { colors } from '@/theme';

import type { Student } from '@/modules/students/types';

interface EditStudentModalProps {
  visible: boolean;
  onDismiss: () => void;
  student: Student;
  onSubmit: (cedula: string, nombres: string, apellidos: string) => Promise<void>;
}

export function EditStudentModal({ visible, onDismiss, student, onSubmit }: EditStudentModalProps) {
  const [cedula, setCedula] = useState(student.cedula);
  const [nombres, setNombres] = useState(student.nombres);
  const [apellidos, setApellidos] = useState(student.apellidos);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(cedula.trim(), nombres.trim(), apellidos.trim());
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
          Editar estudiante
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
          Guardar cambios
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
