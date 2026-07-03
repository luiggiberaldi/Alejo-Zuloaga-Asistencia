import { StyleSheet, View } from 'react-native';

import { Text } from 'react-native-paper';

import { colors } from '@/theme';

export default function ReportesScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Reportes</Text>
      <Text variant="bodyMedium" style={styles.info}>
        Los reportes en PDF se implementan en la Fase 5.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  info: {
    marginTop: 8,
    color: colors.text,
  },
});
