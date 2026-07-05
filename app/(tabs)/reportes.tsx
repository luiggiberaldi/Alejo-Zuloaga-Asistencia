import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ActivityIndicator } from 'react-native-paper';

import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { addDays, getTodayString } from '@/components/ui/DateSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { PdfShareModal } from '@/components/ui/PdfShareModal';
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
import { savePDFToDevice, sharePDFDirectly } from '@/services/pdf/generator';
import { generateSectionReportHTML, generateStudentReportHTML } from '@/services/pdf/templates';
import { useSectionsStore } from '@/store/sections-store';
import { colors } from '@/theme';

import type { DateRange } from '@/modules/reports/types';
import type { Section } from '@/modules/sections/types';
import type { Student } from '@/modules/students/types';

function formatDateForFileName(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

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
  const [pdfAction, setPdfAction] = useState<{ html: string; fileName: string } | null>(null);

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
    let active = true;

    async function fetchPreview() {
      if (!selectedSection) {
        if (active) {
          setPreviewData({
            totalPresente: 0,
            totalAusente: 0,
            porcentajeAsistencia: null,
            hasData: false,
            title: '',
            subtitle: '',
          });
        }
        return;
      }

      if (reportType === 'individual') {
        if (!selectedStudent) {
          if (active) {
            setPreviewData({
              totalPresente: 0,
              totalAusente: 0,
              porcentajeAsistencia: null,
              hasData: false,
              title: '',
              subtitle: '',
            });
          }
          return;
        }

        setLoadingPreview(true);
        try {
          const data = await getStudentReportData(selectedStudent.id, dateRange);
          if (active) {
            setPreviewData({
              totalPresente: data.totalPresente,
              totalAusente: data.totalAusente,
              porcentajeAsistencia: data.porcentajeAsistencia,
              hasData: true,
              title: `${data.student.apellidos}, ${data.student.nombres}`,
              subtitle: `Cédula: ${data.student.cedula} | Sección: ${selectedSection.yearLevel} Año "${selectedSection.name}"`,
            });
          }
        } catch {
          if (active) {
            setPreviewData((prev) => ({ ...prev, hasData: false }));
          }
        } finally {
          if (active) setLoadingPreview(false);
        }
      } else {
        setLoadingPreview(true);
        try {
          const rows = await getSectionReportRows(selectedSection.id, dateRange);
          let pres = 0;
          let abs = 0;
          rows.forEach((r) => {
            pres += r.totalPresente;
            abs += r.totalAusente;
          });

          const total = pres + abs;
          const pct = total > 0 ? Math.round((pres / total) * 100) : null;

          if (active) {
            setPreviewData({
              totalPresente: pres,
              totalAusente: abs,
              porcentajeAsistencia: pct,
              hasData: true,
              title: `Sección ${selectedSection.yearLevel} Año "${selectedSection.name}"`,
              subtitle: `Total Estudiantes: ${rows.length}`,
            });
          }
        } catch {
          if (active) {
            setPreviewData((prev) => ({ ...prev, hasData: false }));
          }
        } finally {
          if (active) setLoadingPreview(false);
        }
      }
    }

    fetchPreview();

    return () => {
      active = false;
    };
  }, [reportType, selectedSection, selectedStudent, dateRange]);

  // Manejador de exportación a PDF
  async function handleExportPDF() {
    if (!selectedSection) return;

    if (reportType === 'individual' && !selectedStudent) {
      Alert.alert('Atención', 'Por favor, selecciona un estudiante.');
      return;
    }

    if (dateRange.startDate > dateRange.endDate) {
      Alert.alert('Rango Inválido', 'La fecha "Desde" no puede ser mayor que la fecha "Hasta".');
      return;
    }

    setLoadingExport(true);
    try {
      const startFmt = formatDateForFileName(dateRange.startDate);
      const endFmt = formatDateForFileName(dateRange.endDate);

      if (reportType === 'individual' && selectedStudent) {
        const data = await getStudentReportData(selectedStudent.id, dateRange);
        const secFullName = `${selectedSection.yearLevel} Año "${selectedSection.name}"`;
        const html = generateStudentReportHTML(data, secFullName, dateRange);

        const fileName = `${selectedSection.yearLevel}-seccion-${selectedSection.name}-${data.student.apellidos}-${data.student.nombres}-${startFmt}-al-${endFmt}`;
        setPdfAction({ html, fileName });
      } else {
        const rows = await getSectionReportRows(selectedSection.id, dateRange);
        if (rows.length === 0) {
          Alert.alert('Sección Vacía', 'No hay estudiantes registrados en esta sección para generar reporte.');
          setLoadingExport(false);
          return;
        }

        const secFullName = `${selectedSection.yearLevel} Año "${selectedSection.name}"`;
        const html = generateSectionReportHTML(rows, secFullName, dateRange);

        const fileName = `${selectedSection.yearLevel}-seccion-${selectedSection.name}-${startFmt}-al-${endFmt}`;
        setPdfAction({ html, fileName });
      }
    } catch {
      // Error ya se maneja y reporta internamente en getStudentReportData/getSectionReportRows
    } finally {
      setLoadingExport(false);
    }
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

      <PdfShareModal
        visible={!!pdfAction}
        onDismiss={() => setPdfAction(null)}
        onSave={() => pdfAction && savePDFToDevice(pdfAction.html, pdfAction.fileName)}
        onShare={() => pdfAction && sharePDFDirectly(pdfAction.html, pdfAction.fileName)}
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
