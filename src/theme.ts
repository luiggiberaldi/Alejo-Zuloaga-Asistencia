import { MD3LightTheme } from 'react-native-paper';

// Paleta institucional del liceo — ver agent_docs/ui_ux_guidelines.md
export const colors = {
  primary: '#1B5E20',
  primaryLight: '#4C8C4A',
  secondary: '#FFD54F',
  background: '#F5F5F5',
  text: '#212121',
  success: '#2E7D32',
  danger: '#C62828',
  warning: '#EF6C00',
  info: '#1565C0',
} as const;

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    onBackground: colors.text,
    error: colors.danger,
  },
};
