import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from 'react-native-paper';

import { AttendanceToggle } from '@/components/ui/AttendanceToggle';
import { colors } from '@/theme';

import type { AttendanceStatus } from '@/modules/attendance/types';
import type { Student } from '@/modules/students/types';

interface StudentCardProps {
  student: Student;
  attendanceStatus: AttendanceStatus | undefined;
  onAttendanceChange: (status: AttendanceStatus) => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

export function StudentCard({
  student,
  attendanceStatus,
  onAttendanceChange,
  onLongPress,
  disabled = false,
}: StudentCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => !disabled && setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onLongPress={!disabled ? onLongPress : undefined}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: (pressed || isPressed) && !disabled ? 0.85 : 1,
          transform: [{ scale: (pressed || isPressed) && !disabled ? 0.98 : 1 }],
        },
      ]}
      disabled={disabled}
    >
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {student.nombres} {student.apellidos}
            </Text>
            <Text variant="bodyMedium" style={styles.meta}>
              Cédula: {student.cedula}
            </Text>
          </View>

          <AttendanceToggle
            status={attendanceStatus}
            onStatusChange={onAttendanceChange}
            disabled={disabled}
          />
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
  info: {
    marginBottom: 8,
  },
  name: {
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    color: colors.text,
    opacity: 0.7,
  },
});
