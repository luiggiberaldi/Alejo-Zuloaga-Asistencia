import { StyleSheet, View } from 'react-native';

import { Icon, Text } from 'react-native-paper';

import { colors } from '@/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon source={icon} size={64} color={colors.primaryLight} />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.text,
  },
});
