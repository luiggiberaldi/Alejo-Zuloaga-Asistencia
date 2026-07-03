import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Menu, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { Student } from '@/modules/students/types';

interface StudentPickerProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelect: (student: Student) => void;
}

export function StudentPicker({ students, selectedStudent, onSelect }: StudentPickerProps) {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (student: Student) => {
    onSelect(student);
    closeMenu();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Estudiante:</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        style={styles.menu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            icon="chevron-down"
            disabled={students.length === 0}
          >
            {selectedStudent
              ? `${selectedStudent.apellidos}, ${selectedStudent.nombres}`
              : students.length === 0
                ? 'No hay estudiantes registrados'
                : 'Seleccionar estudiante'}
          </Button>
        }
      >
        {students.map((student) => (
          <Menu.Item
            key={student.id}
            onPress={() => handleSelect(student)}
            title={`${student.apellidos}, ${student.nombres}`}
            titleStyle={styles.menuItemText}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.text,
  },
  button: {
    width: '100%',
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: colors.text,
  },
  menu: {
    width: '90%',
  },
  menuItemText: {
    fontSize: 16,
  },
});
