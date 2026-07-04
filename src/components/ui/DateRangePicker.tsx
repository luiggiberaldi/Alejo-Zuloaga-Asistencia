import { StyleSheet, View } from 'react-native';

import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Button, Text, TouchableRipple } from 'react-native-paper';

import {
  addDays,
  dateToString,
  formatDateLabel,
  getTodayString,
  stringToDate,
} from '@/components/ui/DateSelector';
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

  function openStartPicker() {
    DateTimePickerAndroid.open({
      value: stringToDate(value.startDate),
      mode: 'date',
      minimumDate: stringToDate(minDate),
      maximumDate: stringToDate(value.endDate),
      onChange: (_event, date) => {
        if (date) onChange({ ...value, startDate: dateToString(date) });
      },
    });
  }

  function openEndPicker() {
    DateTimePickerAndroid.open({
      value: stringToDate(value.endDate),
      mode: 'date',
      minimumDate: stringToDate(value.startDate),
      maximumDate: stringToDate(today),
      onChange: (_event, date) => {
        if (date) onChange({ ...value, endDate: dateToString(date) });
      },
    });
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

      <View style={styles.fieldsRow}>
        <TouchableRipple
          style={styles.dateField}
          onPress={openStartPicker}
          accessibilityLabel="Elegir fecha desde"
        >
          <View>
            <Text style={styles.fieldLabel}>Desde</Text>
            <Text style={styles.fieldValue}>{formatDateLabel(value.startDate)}</Text>
          </View>
        </TouchableRipple>

        <TouchableRipple
          style={styles.dateField}
          onPress={openEndPicker}
          accessibilityLabel="Elegir fecha hasta"
        >
          <View>
            <Text style={styles.fieldLabel}>Hasta</Text>
            <Text style={styles.fieldValue}>{formatDateLabel(value.endDate)}</Text>
          </View>
        </TouchableRipple>
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
  fieldsRow: {
    flexDirection: 'row',
  },
  dateField: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#555',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
});
