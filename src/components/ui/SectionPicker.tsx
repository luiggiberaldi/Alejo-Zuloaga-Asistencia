import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Menu, Text } from 'react-native-paper';

import { colors } from '@/theme';

import type { Section } from '@/modules/sections/types';

interface SectionPickerProps {
  sections: Section[];
  selectedSection: Section | null;
  onSelect: (section: Section) => void;
}

export function SectionPicker({ sections, selectedSection, onSelect }: SectionPickerProps) {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(visible && sections.length > 0 ? false : true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (section: Section) => {
    onSelect(section);
    closeMenu();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sección:</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        style={styles.menu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            icon="chevron-down"
            disabled={sections.length === 0}
          >
            {selectedSection
              ? `${selectedSection.yearLevel} Año - ${selectedSection.name}`
              : sections.length === 0
                ? 'No hay secciones disponibles'
                : 'Seleccionar sección'}
          </Button>
        }
      >
        {sections.map((section) => (
          <Menu.Item
            key={section.id}
            onPress={() => handleSelect(section)}
            title={`${section.yearLevel} Año - ${section.name}`}
            titleStyle={styles.menuItemText}
          />
        ))}
      </Menu>
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
    marginBottom: 6,
    color: colors.text,
  },
  button: {
    width: '100%',
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: colors.text,
  },
  menu: {
    width: '90%',
  },
  menuItemText: {
    fontSize: 16,
  },
});
