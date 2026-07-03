import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { FAB, Snackbar, Text } from 'react-native-paper';

import { AddSectionModal } from '@/components/ui/AddSectionModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { useSectionsStore } from '@/store/sections-store';
import { colors } from '@/theme';

import type { Section, YearLevel } from '@/modules/sections/types';

export default function InicioScreen() {
  const sections = useSectionsStore((state) => state.sections);
  const loading = useSectionsStore((state) => state.loading);
  const error = useSectionsStore((state) => state.error);
  const loadSections = useSectionsStore((state) => state.loadSections);
  const addSection = useSectionsStore((state) => state.addSection);
  const clearError = useSectionsStore((state) => state.clearError);

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const handleCreateSection = useCallback(
    async (name: string, yearLevel: YearLevel) => {
      await addSection(name, yearLevel);
    },
    [addSection],
  );

  function renderItem({ item }: { item: Section }) {
    return <SectionCard section={item} onPress={() => router.push(`/section/${item.id}`)} />;
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Mis Secciones
      </Text>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={sections.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSections} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title="No hay secciones"
            subtitle="Crea la primera con el botón +"
          />
        }
      />

      <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={() => setModalVisible(true)} />

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
    padding: 16,
    color: colors.text,
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
