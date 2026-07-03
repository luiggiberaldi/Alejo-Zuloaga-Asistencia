import { StyleSheet, View } from 'react-native';

import { Button } from 'react-native-paper';

import type { AttendanceStatus } from '@/modules/attendance/types';

interface AttendanceToggleProps {
  status: AttendanceStatus | undefined;
  onStatusChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}

export function AttendanceToggle({ status, onStatusChange, disabled }: AttendanceToggleProps) {
  return (
    <View style={styles.container}>
      <Button
        mode={status === 'presente' ? 'contained' : 'outlined'}
        onPress={() => onStatusChange('presente')}
        style={[
          styles.button,
          status === 'presente' ? styles.presenteActive : styles.presenteInactive,
        ]}
        contentStyle={styles.buttonContent}
        labelStyle={[
          styles.label,
          status === 'presente' ? styles.textActive : styles.textInactive,
        ]}
        disabled={disabled}
      >
        Presente
      </Button>
      <Button
        mode={status === 'ausente' ? 'contained' : 'outlined'}
        onPress={() => onStatusChange('ausente')}
        style={[
          styles.button,
          status === 'ausente' ? styles.ausenteActive : styles.ausenteInactive,
        ]}
        contentStyle={styles.buttonContent}
        labelStyle={[
          styles.label,
          status === 'ausente' ? styles.textActive : styles.textInactive,
        ]}
        disabled={disabled}
      >
        Ausente
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  presenteActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  presenteInactive: {
    borderColor: '#CCCCCC',
  },
  ausenteActive: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  ausenteInactive: {
    borderColor: '#CCCCCC',
  },
  textActive: {
    color: '#FFFFFF',
  },
  textInactive: {
    color: '#777777',
  },
});
