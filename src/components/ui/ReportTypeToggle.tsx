import { StyleSheet, View } from 'react-native';

import { Button } from 'react-native-paper';

interface ReportTypeToggleProps {
  value: 'individual' | 'section';
  onChange: (value: 'individual' | 'section') => void;
}

export function ReportTypeToggle({ value, onChange }: ReportTypeToggleProps) {
  return (
    <View style={styles.container}>
      <Button
        mode={value === 'individual' ? 'contained' : 'outlined'}
        onPress={() => onChange('individual')}
        style={[styles.button, styles.leftButton]}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonText}
      >
        Individual
      </Button>
      <Button
        mode={value === 'section' ? 'contained' : 'outlined'}
        onPress={() => onChange('section')}
        style={[styles.button, styles.rightButton]}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonText}
      >
        Por Sección
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 1,
  },
  leftButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  rightButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
