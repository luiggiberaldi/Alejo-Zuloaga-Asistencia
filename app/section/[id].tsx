import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, IconButton, Snackbar, Text } from 'react-native-paper';

import { AddStudentModal } from '@/components/ui/AddStudentModal';
import { AttendanceCompletionModal } from '@/components/ui/AttendanceCompletionModal';
import { BehaviorReportModal } from '@/components/ui/BehaviorReportModal';
import { DateSelector, getTodayString } from '@/components/ui/DateSelector';
import { EditStudentModal } from '@/components/ui/EditStudentModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImportXLSButton } from '@/components/ui/ImportXLSButton';
import { StudentCard } from '@/components/ui/StudentCard';
import { StudentContextMenu } from '@/components/ui/StudentContextMenu';
import { SyncButton } from '@/components/ui/SyncButton';
import { getSectionDailySummary } from '@/modules/reports/repository';
import { getSectionById } from '@/modules/sections/repository';
import { savePDFToDevice, sharePDFDirectly } from '@/services/pdf/generator';
import { generateDailySummaryHTML } from '@/services/pdf/templates';
import { useAttendanceStore } from '@/store/attendance-store';
import { useAuthStore } from '@/store/auth-store';
import { useBehaviorStore } from '@/store/behavior-store';
import { useSectionsStore } from '@/store/sections-store';
import { useStudentsStore } from '@/store/students-store';
import { useSyncStore } from '@/store/sync-store';
import { colors } from '@/theme';

import type { ViewToken } from 'react-native';

import type { AttendanceStatus } from '@/modules/attendance/types';
import type { BehaviorSeverity } from '@/modules/behavior/types';
import type { Section } from '@/modules/sections/types';
import type { Student } from '@/modules/students/types';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

export default function SectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const students = useStudentsStore((state) => state.students);
  const loadingStudents = useStudentsStore((state) => state.loading);
  const studentError = useStudentsStore((state) => state.error);
  const loadStudents = useStudentsStore((state) => state.loadStudents);
  const addStudent = useStudentsStore((state) => state.addStudent);
  const removeStudent = useStudentsStore((state) => state.removeStudent);
  const updateStudent = useStudentsStore((state) => state.updateStudent);
  const clearStudentError = useStudentsStore((state) => state.clearError);

  const attendanceByDate = useAttendanceStore((state) => state.attendanceByDate);
  const loadingAttendance = useAttendanceStore((state) => state.loading);
  const attendanceError = useAttendanceStore((state) => state.error);
  const loadAttendance = useAttendanceStore((state) => state.loadAttendanceForSection);
  const markAttendance = useAttendanceStore((state) => state.markAttendance);
  const clearAttendanceError = useAttendanceStore((state) => state.clearError);

  const addBehaviorReport = useBehaviorStore((state) => state.addReport);
  const behaviorError = useBehaviorStore((state) => state.error);
  const clearBehaviorError = useBehaviorStore((state) => state.clearError);

  const removeSection = useSectionsStore((state) => state.removeSection);

  const role = useAuthStore((state) => state.role);

  const [section, setSection] = useState<Section | null>(null);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [behaviorModalVisible, setBehaviorModalVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [completionCounts, setCompletionCounts] = useState<{ presentes: number; ausentes: number }>({
    presentes: 0,
    ausentes: 0,
  });

  const flatListRef = useRef<FlatList<Student>>(null);
  const viewableIndicesRef = useRef<number[]>([]);
  const wasCompleteRef = useRef(false);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    viewableIndicesRef.current = viewableItems
      .map((item) => item.index)
      .filter((index): index is number => index !== null);
  }, []);

  useEffect(() => {
    if (!id) return;

    getSectionById(id)
      .then(setSection)
      .finally(() => setSectionLoading(false));

    loadStudents(id);
  }, [id, loadStudents]);

  // Reinicia la bandera de "asistencia completa" al cambiar de sección, fecha
  // o cuando cambia el tamaño del alumnado (ej. se añade un estudiante nuevo).
  useEffect(() => {
    wasCompleteRef.current = false;
  }, [id, selectedDate, students.length]);

  useEffect(() => {
    if (!id) return;
    loadAttendance(id, selectedDate);
  }, [id, selectedDate, loadAttendance]);

  const handleAddStudent = useCallback(
    async (cedula: string, nombres: string, apellidos: string) => {
      if (!id) return;
      await addStudent({ sectionId: id, cedula, nombres, apellidos });
    },
    [addStudent, id],
  );

  const handleEditStudent = useCallback(
    async (cedula: string, nombres: string, apellidos: string) => {
      if (!activeStudent) return;
      await updateStudent(activeStudent.id, { cedula, nombres, apellidos });
    },
    [updateStudent, activeStudent],
  );

  const handleAttendanceChange = useCallback(
    async (studentId: string, status: AttendanceStatus) => {
      try {
        await markAttendance(studentId, selectedDate, status);

        const index = students.findIndex((s) => s.id === studentId);
        const isLastVisible =
          index !== -1 && viewableIndicesRef.current.length > 0 &&
          index === Math.max(...viewableIndicesRef.current);

        if (isLastVisible && index + 1 < students.length) {
          flatListRef.current?.scrollToIndex({
            index: index + 1,
            viewPosition: 0.7,
            viewOffset: 48,
            animated: true,
          });
        }

        // Detectar finalización: todos los estudiantes ya tienen asistencia
        // marcada para esta fecha (se lee el store directamente para tomar el
        // valor más reciente, sin esperar al siguiente render).
        const freshMap = useAttendanceStore.getState().attendanceByDate;
        const isComplete = students.length > 0 && students.every((s) => freshMap[s.id] !== undefined);

        if (isComplete && !wasCompleteRef.current) {
          wasCompleteRef.current = true;
          const presentes = students.filter((s) => freshMap[s.id] === 'presente').length;
          const ausentes = students.length - presentes;
          setCompletionCounts({ presentes, ausentes });
          setCompletionVisible(true);
        } else if (!isComplete) {
          wasCompleteRef.current = false;
        }
      } catch {
        // Rollback y alert ya son manejados por el store
      }
    },
    [markAttendance, selectedDate, students],
  );

  const buildDailySummaryHtml = useCallback(async () => {
    if (!id || !section) return null;
    const summary = await getSectionDailySummary(id, section.name, section.yearLevel, selectedDate);
    return generateDailySummaryHTML(user?.email ?? 'Docente', selectedDate, [summary]);
  }, [id, section, selectedDate, user]);

  const handleUploadToCloud = useCallback(() => {
    useSyncStore.getState().sync().catch(() => {
      // Error ya se maneja y reporta dentro del store de sync
    });
  }, []);

  const handleDownloadSummary = useCallback(async () => {
    if (!section) return;
    try {
      const html = await buildDailySummaryHtml();
      if (!html) return;
      await savePDFToDevice(html, `Resumen_${section.name}_${selectedDate}`);
    } catch {
      // Error ya se maneja y reporta dentro de savePDFToDevice
    }
  }, [buildDailySummaryHtml, section, selectedDate]);

  const handleShareSummary = useCallback(async () => {
    if (!section) return;
    try {
      const html = await buildDailySummaryHtml();
      if (!html) return;
      await sharePDFDirectly(html, `Resumen_${section.name}_${selectedDate}`);
    } catch {
      // Error ya se maneja y reporta dentro de sharePDFDirectly
    }
  }, [buildDailySummaryHtml, section, selectedDate]);

  const handleReportBehavior = useCallback(
    async (description: string, severity: BehaviorSeverity) => {
      if (!activeStudent) return;
      try {
        await addBehaviorReport(activeStudent.id, description, severity, selectedDate);
        Alert.alert('Éxito', 'Reporte de comportamiento guardado correctamente.');
      } catch {
        // Rollback y alert ya son manejados por el store
      }
    },
    [activeStudent, addBehaviorReport, selectedDate],
  );

  const handleDeleteStudent = useCallback(
    (student: Student) => {
      Alert.alert(
        'Eliminar estudiante',
        `¿Seguro que deseas eliminar a ${student.nombres} ${student.apellidos}? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeStudent(student.id);
              } catch {
                Alert.alert('Error', 'No se pudo eliminar al estudiante de la base de datos local.');
              }
            },
          },
        ],
      );
    },
    [removeStudent],
  );

  const handleDeleteSection = useCallback(() => {
    if (!id || !section) return;
    Alert.alert(
      'Eliminar sección',
      `¿Seguro que deseas eliminar la sección "${section.name}"? Se perderán todos los datos de estudiantes y asistencias asociados de forma local.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSection(id);
              router.replace('/(tabs)');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la sección.');
            }
          },
        },
      ],
    );
  }, [id, section, removeSection]);

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!id) return null;

  const isPastDate = selectedDate !== getTodayString();
  const isLoading = loadingStudents || loadingAttendance;
  const activeError = studentError || attendanceError || behaviorError;

  const handleClearError = () => {
    if (studentError) clearStudentError();
    if (attendanceError) clearAttendanceError();
    if (behaviorError) clearBehaviorError();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: section?.name ?? 'Sección',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerActions}>
              {role === 'profesor' && (
                <>
                  <IconButton
                    icon="trash-can-outline"
                    size={24}
                    style={styles.headerButton}
                    iconColor="#FF8A80"
                    onPress={handleDeleteSection}
                    accessibilityLabel="Eliminar sección"
                  />
                  <IconButton
                    icon="account-plus"
                    size={24}
                    style={styles.headerButton}
                    iconColor="#FFFFFF"
                    onPress={() => setAddModalVisible(true)}
                    accessibilityLabel="Añadir estudiante"
                  />
                  <ImportXLSButton sectionId={id} />
                </>
              )}
              <SyncButton />
            </View>
          ),
        }}
      />

      {sectionLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} size="large" color={colors.primary} />
      ) : (
        <>
          <View style={styles.sectionHeader}>
            {section && (
              <Text variant="titleMedium" style={styles.yearLevel}>
                {section.yearLevel} año
              </Text>
            )}
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </View>

          {isPastDate && (
            <View style={styles.pastDateBanner}>
              <Text style={styles.pastDateText}>
                ⚠️ Editando asistencia de fecha pasada
              </Text>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StudentCard
                student={item}
                attendanceStatus={attendanceByDate[item.id]}
                onAttendanceChange={(status) => handleAttendanceChange(item.id, status)}
                onLongPress={() => {
                  setActiveStudent(item);
                  setContextMenuVisible(true);
                }}
                disabled={role === 'coordinador'}
              />
            )}
            viewabilityConfig={VIEWABILITY_CONFIG}
            onViewableItemsChanged={onViewableItemsChanged}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            }}
            contentContainerStyle={students.length === 0 ? styles.emptyContent : styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => {
                  loadStudents(id);
                  loadAttendance(id, selectedDate);
                }}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="account-group-outline"
                title="No hay estudiantes"
                subtitle={role === 'profesor' ? 'Añádelos manualmente o importa un archivo .XLS' : 'No hay estudiantes registrados.'}
              />
            }
          />
        </>
      )}

      <AddStudentModal
        visible={addModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        onSubmit={handleAddStudent}
      />

      {activeStudent && (
        <StudentContextMenu
          visible={contextMenuVisible}
          onDismiss={() => setContextMenuVisible(false)}
          studentName={`${activeStudent.nombres} ${activeStudent.apellidos}`}
          onReportBehavior={() => setBehaviorModalVisible(true)}
          onEditStudent={() => setEditModalVisible(true)}
          onDeleteStudent={() => handleDeleteStudent(activeStudent)}
        />
      )}

      {activeStudent && (
        <EditStudentModal
          key={activeStudent.id}
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          student={activeStudent}
          onSubmit={handleEditStudent}
        />
      )}

      {activeStudent && (
        <BehaviorReportModal
          visible={behaviorModalVisible}
          onDismiss={() => setBehaviorModalVisible(false)}
          onSubmit={handleReportBehavior}
        />
      )}

      <Snackbar visible={!!activeError} onDismiss={handleClearError} duration={4000}>
        {activeError ?? ''}
      </Snackbar>

      <AttendanceCompletionModal
        visible={completionVisible}
        onDismiss={() => setCompletionVisible(false)}
        presentCount={completionCounts.presentes}
        absentCount={completionCounts.ausentes}
        onUploadToCloud={handleUploadToCloud}
        onDownloadSummary={handleDownloadSummary}
        onShareSummary={handleShareSummary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    minWidth: 48,
    minHeight: 48,
    margin: 0,
  },
  loadingIndicator: {
    marginTop: 32,
  },
  sectionHeader: {
    paddingTop: 12,
  },
  yearLevel: {
    paddingHorizontal: 16,
    color: colors.text,
    opacity: 0.7,
  },
  pastDateBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  pastDateText: {
    color: '#EF6C00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
