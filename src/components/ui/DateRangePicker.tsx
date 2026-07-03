import { StyleSheet, View } from 'react-native';

import { Button, IconButton, Text } from 'react-native-paper';

import { addDays, formatDateLabel, getTodayString } from '@/components/ui/DateSelector';
import { colors } from '@/theme';

import type { DateRange } from '@/modules/reports/types';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  minDate: string;
}

export function DateRangePicker({ value, onChange, minDate }: DateRangePickerProps) {
  const today = getTodayString();

  function handlePreset(preset: 'week' | 'month' | 'all') {
    let start = today;
    if (preset === 'week') {
      start = addDays(today, -6); // 7 días incluyendo hoy
    } else if (preset === 'month') {
      start = addDays(today, -29); // 30 días incluyendo hoy
    } else if (preset === 'all') {
      start = minDate;
    }
    onChange({ startDate: start, endDate: today });
  }

  function adjustStart(days: number) {
    const nextStart = addDays(value.startDate, days);
    if (nextStart > value.endDate) return;
    onChange({ ...value, startDate: nextStart });
  }

  function adjustEnd(days: number) {
    const nextEnd = addDays(value.endDate, days);
    if (nextEnd < value.startDate || nextEnd > today) return;
    onChange({ ...value, endDate: nextEnd });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rango de Fechas:</Text>
      <View style={styles.presetsRow}>
        <Button
          mode="outlined"
          compact
          style={styles.presetButton}
          contentStyle={styles.presetButtonContent}
          labelStyle={styles.presetLabel}
          onPress={() => handlePreset('week')}
        >
          Semana
        </Button>
        <Button
          mode="outlined"
          compact
          style={styles.presetButton}
          contentStyle={styles.presetButtonContent}
          labelStyle={styles.presetLabel}
          onPress={() => handlePreset('month')}
        >
          Mes
        </Button>
        <Button
          mode="outlined"
          compact
          style={styles.presetButton}
          contentStyle={styles.presetButtonContent}
          labelStyle={styles.presetLabel}
          onPress={() => handlePreset('all')}
        >
          Todo el periodo
        </Button>
      </View>

      <View style={styles.pickersColumn}>
        <View style={styles.dateSelectorContainer}>
          <Text style={styles.selectorSublabel}>Desde:</Text>
          <View style={styles.selectorBorder}>
            <IconButton
              icon="chevron-left"
              size={24}
              style={styles.chevron}
              onPress={() => adjustStart(-1)}
              accessibilityLabel="Un día antes desde"
            />
            <Text style={styles.dateText}>{formatDateLabel(value.startDate)}</Text>
            <IconButton
              icon="chevron-right"
              size={24}
              style={styles.chevron}
              onPress={() => adjustStart(1)}
              disabled={value.startDate >= value.endDate}
              accessibilityLabel="Un día después desde"
            />
          </View>
        </View>

        <View style={styles.dateSelectorContainer}>
          <Text style={styles.selectorSublabel}>Hasta:</Text>
          <View style={styles.selectorBorder}>
            <IconButton
              icon="chevron-left"
              size={24}
              style={styles.chevron}
              onPress={() => adjustEnd(-1)}
              disabled={value.endDate <= value.startDate}
              accessibilityLabel="Un día antes hasta"
            />
            <Text style={styles.dateText}>{formatDateLabel(value.endDate)}</Text>
            <IconButton
              icon="chevron-right"
              size={24}
              style={styles.chevron}
              onPress={() => adjustEnd(1)}
              disabled={value.endDate >= today}
              accessibilityLabel="Un día después hasta"
            />
          </View>
        </View>
      </View>
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
    marginBottom: 8,
    color: colors.text,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  presetButtonContent: {
    height: 40,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickersColumn: {
    flexDirection: 'column',
  },
  dateSelectorContainer: {
    marginBottom: 8,
  },
  selectorSublabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  selectorBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  chevron: {
    margin: 0,
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
});
