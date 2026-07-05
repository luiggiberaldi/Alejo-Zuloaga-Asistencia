import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { router, useFocusEffect } from 'expo-router';
import { FAB, Snackbar, Text } from 'react-native-paper';

import { AddSectionModal } from '@/components/ui/AddSectionModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { useAuthStore } from '@/store/auth-store';
import { useSectionsStore } from '@/store/sections-store';
import { colors } from '@/theme';

import type { Section, YearLevel } from '@/modules/sections/types';

const YEAR_OPTIONS: ('todos' | YearLevel)[] = ['todos', '1ro', '2do', '3ro', '4to', '5to'];

export default function InicioScreen() {
  const sections = useSectionsStore((state) => state.sections);
  const loading = useSectionsStore((state) => state.loading);
  const error = useSectionsStore((state) => state.error);
  const loadSections = useSectionsStore((state) => state.loadSections);
  const addSection = useSectionsStore((state) => state.addSection);
  const clearError = useSectionsStore((state) => state.clearError);

  const role = useAuthStore((state) => state.role);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState<'todos' | YearLevel>('todos');

  useFocusEffect(
    useCallback(() => {
      loadSections();
    }, [loadSections])
  );

  const handleCreateSection = useCallback(
    async (name: string, yearLevel: YearLevel) => {
      await addSection(name, yearLevel);
    },
    [addSection],
  );

  function renderItem({ item }: { item: Section }) {
    return <SectionCard section={item} onPress={() => router.push(`/section/${item.id}`)} />;
  }

  const filteredSections = sections.filter((s) => {
    if (selectedYear === 'todos') return true;
    return s.yearLevel === selectedYear;
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Mis Secciones
      </Text>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {YEAR_OPTIONS.map((year) => (
            <TouchableOpacity
              key={year}
              onPress={() => setSelectedYear(year)}
              style={[
                styles.chip,
                selectedYear === year ? styles.chipSelected : styles.chipUnselected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedYear === year ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {year === 'todos' ? 'Todos' : `${year} Año`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredSections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={filteredSections.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSections} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title="No hay secciones"
            subtitle={
              selectedYear !== 'todos'
                ? `No hay secciones registradas para ${selectedYear} año.`
                : role === 'profesor'
                ? 'Crea la primera con el botón +'
                : 'No hay secciones disponibles.'
            }
          />
        }
      />

      {role === 'profesor' && (
        <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={() => setModalVisible(true)} />
      )}

      <AddSectionModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSubmit={handleCreateSection}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: colors.text,
    fontWeight: 'bold',
  },
  filterWrapper: {
    height: 48,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextUnselected: {
    color: '#616161',
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyContent: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
});
