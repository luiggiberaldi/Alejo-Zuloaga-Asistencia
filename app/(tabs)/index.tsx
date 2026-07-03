import { StyleSheet, View } from 'react-native';

import { Button, Text } from 'react-native-paper';

import { signOutUser } from '@/modules/auth/repository';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme';

export default function InicioScreen() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const signOut = useAuthStore((state) => state.signOut);

  async function handleSignOut() {
    await signOutUser();
    signOut();
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Bienvenido/a</Text>
      <Text variant="bodyMedium" style={styles.info}>
        {user?.email ?? 'Sin correo'} · {role ?? 'Sin rol asignado'}
      </Text>
      <Text variant="bodySmall" style={styles.info}>
        Las secciones y la asistencia se implementan en la Fase 2.
      </Text>
      <Button mode="outlined" onPress={handleSignOut} style={styles.button}>
        Cerrar sesión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  info: {
    marginTop: 8,
    color: colors.text,
  },
  button: {
    marginTop: 24,
  },
});
