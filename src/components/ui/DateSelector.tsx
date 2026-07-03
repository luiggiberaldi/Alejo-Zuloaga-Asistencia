import { StyleSheet, View } from 'react-native';

import { IconButton, Text } from 'react-native-paper';

import { colors } from '@/theme';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateStr: string): string {
  const today = getTodayString();
  if (dateStr === today) return 'Hoy';

  const yesterday = addDays(today, -1);
  if (dateStr === yesterday) return 'Ayer';

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const weekday = weekdays[date.getDay()];
  const monthLabel = months[date.getMonth()];

  return `${weekday}, ${day} de ${monthLabel}`;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = getTodayString();
  const isTodaySelected = selectedDate === today;

  function handlePrevDay() {
    onDateChange(addDays(selectedDate, -1));
  }

  function handleNextDay() {
    if (isTodaySelected) return;
    onDateChange(addDays(selectedDate, 1));
  }

  return (
    <View style={styles.container}>
      <IconButton
        icon="chevron-left"
        size={24}
        onPress={handlePrevDay}
        accessibilityLabel="Día anterior"
      />
      <Text variant="titleMedium" style={styles.dateLabel}>
        {formatDateLabel(selectedDate)}
      </Text>
      <IconButton
        icon="chevron-right"
        size={24}
        onPress={handleNextDay}
        disabled={isTodaySelected}
        accessibilityLabel="Día siguiente"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    height: 48,
  },
  dateLabel: {
    fontWeight: 'bold',
    color: colors.text,
  },
});
