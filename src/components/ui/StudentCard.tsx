import { StyleSheet, View } from 'react-native';

import { Card, IconButton, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { Student } from '@/modules/students/types';

interface StudentCardProps {
  student: Student;
  onDelete: () => void;
}

// Fase 2: solo botón de eliminar visible. El long press (reportar
// comportamiento / eliminar) se agrega en la Fase 3.
export function StudentCard({ student, onDelete }: StudentCardProps) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <View style={styles.info}>
          <Text variant="titleMedium">
            {student.nombres} {student.apellidos}
          </Text>
          <Text variant="bodyMedium" style={styles.meta}>
            Cédula: {student.cedula}
          </Text>
        </View>
        <IconButton
          icon="delete"
          iconColor={colors.danger}
          size={24}
          style={styles.deleteButton}
          onPress={onDelete}
          accessibilityLabel="Eliminar estudiante"
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  meta: {
    marginTop: 4,
    color: colors.text,
  },
  deleteButton: {
    minWidth: 48,
    minHeight: 48,
    margin: 0,
  },
});
