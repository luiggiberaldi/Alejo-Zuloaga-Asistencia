import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, IconButton, Snackbar, Text } from 'react-native-paper';

import { AddStudentModal } from '@/components/ui/AddStudentModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImportXLSButton } from '@/components/ui/ImportXLSButton';
import { StudentCard } from '@/components/ui/StudentCard';
import { getSectionById } from '@/modules/sections/repository';
import { useAuthStore } from '@/store/auth-store';
import { useStudentsStore } from '@/store/students-store';
import { colors } from '@/theme';

import type { Section } from '@/modules/sections/types';
import type { Student } from '@/modules/students/types';

export default function SectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const students = useStudentsStore((state) => state.students);
  const loading = useStudentsStore((state) => state.loading);
  const error = useStudentsStore((state) => state.error);
  const loadStudents = useStudentsStore((state) => state.loadStudents);
  const addStudent = useStudentsStore((state) => state.addStudent);
  const removeStudent = useStudentsStore((state) => state.removeStudent);
  const clearError = useStudentsStore((state) => state.clearError);

  const [section, setSection] = useState<Section | null>(null);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;

    getSectionById(id)
      .then(setSection)
      .finally(() => setSectionLoading(false));

    loadStudents(id);
  }, [id, loadStudents]);

  const handleAddStudent = useCallback(
    async (cedula: string, nombres: string, apellidos: string) => {
      if (!id) return;
      await addStudent({ sectionId: id, cedula, nombres, apellidos });
    },
    [addStudent, id],
  );

  function handleDeleteStudent(student: Student) {
    Alert.alert(
      'Eliminar estudiante',
      `¿Seguro que deseas eliminar a ${student.nombres} ${student.apellidos}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeStudent(student.id) },
      ],
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!id) return null;

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
              <IconButton
                icon="account-plus"
                size={24}
                style={styles.headerButton}
                iconColor="#FFFFFF"
                onPress={() => setAddModalVisible(true)}
                accessibilityLabel="Añadir estudiante"
              />
              <ImportXLSButton sectionId={id} />
            </View>
          ),
        }}
      />

      {sectionLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} size="large" color={colors.primary} />
      ) : (
        <>
          {section && (
            <Text variant="bodyMedium" style={styles.yearLevel}>
              {section.yearLevel} año
            </Text>
          )}

          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StudentCard student={item} onDelete={() => handleDeleteStudent(item)} />
            )}
            contentContainerStyle={students.length === 0 ? styles.emptyContent : styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => loadStudents(id)}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="account-group-outline"
                title="No hay estudiantes"
                subtitle="Añádelos manualmente o importa un archivo .XLS"
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

      <Snackbar visible={!!error} onDismiss={clearError} duration={4000}>
        {error}
      </Snackbar>
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
  yearLevel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
