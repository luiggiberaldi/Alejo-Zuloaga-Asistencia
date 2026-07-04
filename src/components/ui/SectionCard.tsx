import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Card, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { Section } from '@/modules/sections/types';

interface SectionCardProps {
  section: Section;
  onPress: () => void;
}

export function SectionCard({ section, onPress }: SectionCardProps) {
  const isAttendanceCompleted =
    section.studentCount > 0 && section.attendanceCountForToday === section.studentCount;

  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text variant="titleMedium">{section.name}</Text>
          <Text variant="bodyMedium" style={styles.meta}>
            {section.yearLevel} año · {section.studentCount}{' '}
            {section.studentCount === 1 ? 'estudiante' : 'estudiantes'}
          </Text>
        </View>
        {isAttendanceCompleted && (
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#2E7D32"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.badgeText}>Asistencia Tomada</Text>
            </View>
          </View>
        )}
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  meta: {
    marginTop: 4,
    color: colors.text,
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
