import { StyleSheet } from 'react-native';

import { Card, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { Section } from '@/modules/sections/types';

interface SectionCardProps {
  section: Section;
  onPress: () => void;
}

export function SectionCard({ section, onPress }: SectionCardProps) {
  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium">{section.name}</Text>
        <Text variant="bodyMedium" style={styles.meta}>
          {section.yearLevel} año · {section.studentCount}{' '}
          {section.studentCount === 1 ? 'estudiante' : 'estudiantes'}
        </Text>
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
  meta: {
    marginTop: 4,
    color: colors.text,
  },
});
