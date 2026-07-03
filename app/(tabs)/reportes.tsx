import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ActivityIndicator } from 'react-native-paper';

import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { addDays, getTodayString } from '@/components/ui/DateSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportPreviewCard } from '@/components/ui/ReportPreviewCard';
import { ReportTypeToggle } from '@/components/ui/ReportTypeToggle';
import { SectionPicker } from '@/components/ui/SectionPicker';
import { StudentPicker } from '@/components/ui/StudentPicker';
import {
  getMinAttendanceDate,
  getSectionReportRows,
  getStudentReportData,
} from '@/modules/reports/repository';
import { getStudentsBySection } from '@/modules/students/repository';
import { generateAndSharePDF } from '@/services/pdf/generator';
import { generateSectionReportHTML, generateStudentReportHTML } from '@/services/pdf/templates';
import { useSectionsStore } from '@/store/sections-store';
import { colors } from '@/theme';

import type { DateRange } from '@/modules/reports/types';
import type { Section } from '@/modules/sections/types';
import type { Student } from '@/modules/students/types';

export default function ReportesScreen() {
  const sections = useSectionsStore((state) => state.sections);
  const loadSections = useSectionsStore((state) => state.loadSections);
  const loadingSections = useSectionsStore((state) => state.loading);

  const today = getTodayString();

  // Estados locales
  const [reportType, setReportType] = useState<'individual' | 'section'>('individual');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: addDays(today, -29),
    endDate: today,
  });
  const [minDate, setMinDate] = useState<string>(today);

  // Datos para la vista previa
  const [previewData, setPreviewData] = useState<{
    totalPresente: number;
    totalAusente: number;
    porcentajeAsistencia: number | null;
    hasData: boolean;
    title: string;
    subtitle: string;
  }>({
    totalPresente: 0,
    totalAusente: 0,
    porcentajeAsistencia: null,
    hasData: false,
    title: '',
    subtitle: '',
  });

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  // Cargar secciones al montar
  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Al cambiar el tipo de reporte, resetear estudiante seleccionado
  function handleReportTypeChange(type: 'individual' | 'section') {
    setReportType(type);
    setSelectedStudent(null);
  }

  // Al cambiar sección, obtener estudiantes y fecha mínima
  async function handleSectionSelect(section: Section) {
    setSelectedSection(section);
    setSelectedStudent(null);
    setStudents([]);

    try {
      const secStudents = await getStudentsBySection(section.id);
      setStudents(secStudents);

      const mDate = await getMinAttendanceDate(section.id);
      setMinDate(mDate);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los estudiantes de esta sección.');
    }
  }

  // Actualizar vista previa cuando cambian los filtros (asíncrono con bandera active)
  useEffect(() => {
    // Stubbed temporalmente en este commit para mantener disciplina de tamaño de commit
  }, [reportType, selectedSection, selectedStudent, dateRange]);

  // Manejador de exportación a PDF
  async function handleExportPDF() {
    // Stubbed temporalmente en este commit para mantener disciplina de tamaño de commit
  }

  if (loadingSections) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="folder-alert"
          title="No hay secciones creadas"
          subtitle="Crea una sección en la pestaña Inicio para poder generar reportes."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ReportTypeToggle value={reportType} onChange={handleReportTypeChange} />

      <SectionPicker
        sections={sections}
        selectedSection={selectedSection}
        onSelect={handleSectionSelect}
      />

      {reportType === 'individual' && selectedSection && (
        <StudentPicker
          students={students}
          selectedStudent={selectedStudent}
          onSelect={setSelectedStudent}
        />
      )}

      {selectedSection && (
        <DateRangePicker value={dateRange} onChange={setDateRange} minDate={minDate} />
      )}

      <ReportPreviewCard
        loading={loadingPreview || loadingExport}
        type={reportType}
        title={previewData.title}
        subtitle={previewData.subtitle}
        dateRange={dateRange}
        totalPresente={previewData.totalPresente}
        totalAusente={previewData.totalAusente}
        porcentajeAsistencia={previewData.porcentajeAsistencia}
        hasData={previewData.hasData}
        onExport={handleExportPDF}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
