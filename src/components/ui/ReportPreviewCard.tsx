import { StyleSheet, View } from 'react-native';

import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { DateRange } from '@/modules/reports/types';

interface ReportPreviewCardProps {
  loading: boolean;
  type: 'individual' | 'section';
  title: string;
  subtitle: string;
  dateRange: DateRange;
  totalPresente: number;
  totalAusente: number;
  porcentajeAsistencia: number | null;
  hasData: boolean;
  onExport: () => void;
}

export function ReportPreviewCard({
  loading,
  type,
  title,
  subtitle,
  dateRange,
  totalPresente,
  totalAusente,
  porcentajeAsistencia,
  hasData,
  onExport,
}: ReportPreviewCardProps) {
  const total = totalPresente + totalAusente;
  const showNoHistorical = !loading && hasData && total === 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Vista previa del Reporte
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando datos del reporte...</Text>
          </View>
        ) : !hasData ? (
          <Text style={styles.emptyText}>
            {type === 'individual'
              ? 'Selecciona una sección y un estudiante para visualizar la vista previa.'
              : 'Selecciona una sección para visualizar la vista previa.'}
          </Text>
        ) : (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailTitle}>{title}</Text>
            {subtitle ? <Text style={styles.detailSubtitle}>{subtitle}</Text> : null}
            <Text style={styles.dateRangeText}>
              Periodo: {dateRange.startDate} al {dateRange.endDate}
            </Text>

            {showNoHistorical ? (
              <View style={styles.noHistoricalBox}>
                <Text style={styles.noHistoricalText}>Sin registros históricos en este periodo</Text>
              </View>
            ) : (
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Días Presente:</Text>
                  <Text style={[styles.statValue, styles.presentValue]}>{totalPresente}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Días Ausente:</Text>
                  <Text style={[styles.statValue, styles.absentValue]}>{totalAusente}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>
                    {type === 'individual' ? 'Porcentaje de Asistencia:' : 'Promedio de Asistencia:'}
                  </Text>
                  <Text style={[styles.statValue, styles.pctValue]}>
                    {porcentajeAsistencia !== null ? `${porcentajeAsistencia}%` : 'Sin datos'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </Card.Content>

      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={onExport}
          disabled={loading || !hasData}
          icon="file-pdf-box"
          style={styles.exportButton}
          contentStyle={styles.exportButtonContent}
          labelStyle={styles.exportButtonLabel}
        >
          Exportar PDF
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    borderRadius: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  detailsContainer: {
    paddingVertical: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateRangeText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    marginBottom: 12,
  },
  noHistoricalBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noHistoricalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.danger,
  },
  statsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  presentValue: {
    color: colors.success,
  },
  absentValue: {
    color: colors.danger,
  },
  pctValue: {
    color: colors.primary,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exportButton: {
    flex: 1,
    borderRadius: 8,
  },
  exportButtonContent: {
    height: 48,
  },
  exportButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
