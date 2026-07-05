import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';

import Constants from 'expo-constants';
import { Button, List, Snackbar } from 'react-native-paper';

import { signOutUser } from '@/modules/auth/repository';
import { clearAllLocalData } from '@/services/database/client';
import { logger } from '@/services/logger';
import { useAuthStore } from '@/store/auth-store';
import { useSyncStore } from '@/store/sync-store';
import { colors } from '@/theme';

// TODO: reemplazar por el contacto real de soporte antes de distribuir la app.
const SUPPORT_WHATSAPP_URL = 'https://wa.me/584120000000';

const ROLE_LABELS: Record<string, string> = {
  profesor: 'Profesor',
  coordinador: 'Coordinador',
};

function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return 'Nunca';
  return new Date(timestamp).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AjustesScreen() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  const pendingCount = useSyncStore((state) => state.pendingCount);
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);
  const sync = useSyncStore((state) => state.sync);

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  async function performLogout() {
    setLoggingOut(true);
    try {
      await clearAllLocalData();
      await signOutUser();
    } catch (error) {
      logger.error('Error durante el cierre de sesión', error);
      Alert.alert('Error', 'No se pudo limpiar la base de datos local al cerrar sesión.');
    } finally {
      setLoggingOut(false);
    }
  }

  function handleSignOut() {
    if (loggingOut) return;

    if (pendingCount > 0) {
      Alert.alert(
        'Cambios sin sincronizar',
        `Tienes ${pendingCount} cambio(s) pendiente(s) por subir a la nube. Si cierras sesión sin sincronizar, se perderán de forma permanente.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sincronizar y Salir',
            onPress: async () => {
              try {
                const res = await sync();
                if (res && res.failed === 0) {
                  await performLogout();
                } else {
                  Alert.alert(
                    'Sincronización incompleta',
                    'Algunos cambios no se pudieron sincronizar. ¿Deseas cerrar sesión de todos modos perdiendo los cambios?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Salir de todos modos', style: 'destructive', onPress: performLogout }
                    ]
                  );
                }
              } catch (err: any) {
                Alert.alert(
                  'Error de sincronización',
                  `No se pudo sincronizar: ${err.message || 'Sin conexión'}. ¿Deseas cerrar sesión de todos modos?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir de todos modos', style: 'destructive', onPress: performLogout }
                  ]
                );
              }
            }
          },
          {
            text: 'Salir de todos modos',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    } else {
      Alert.alert('Cerrar sesión', '¿Seguro que deseas cerrar tu sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  }

  async function handleSyncNow() {
    try {
      const result = await sync();
      if (result) {
        setSnackbarMessage(
          result.failed > 0
            ? `Sincronización parcial: ${result.pushed} subidos, ${result.failed} fallidos.`
            : `Sincronización exitosa: ${result.pushed} enviados, ${result.pulled} descargados.`,
        );
      }
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Fallo al sincronizar datos.');
    }
  }

  function handleReportIssue() {
    Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Intenta de nuevo más tarde.');
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <List.Section>
        <List.Subheader style={styles.subheader}>Cuenta</List.Subheader>
        <List.Item
          title={user?.email ?? 'Sin correo'}
          description="Correo electrónico"
          left={(props) => <List.Icon {...props} icon="account-outline" color={colors.primary} />}
        />
        <List.Item
          title={role ? (ROLE_LABELS[role] ?? role) : 'Sin rol'}
          description="Rol"
          left={(props) => <List.Icon {...props} icon="shield-account-outline" color={colors.primary} />}
        />
        <View style={styles.buttonRow}>
          <Button mode="outlined" textColor={colors.danger} onPress={handleSignOut}>
            Cerrar sesión
          </Button>
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.subheader}>Sincronización</List.Subheader>
        <List.Item
          title={formatLastSync(lastSyncAt)}
          description="Última sincronización"
          left={(props) => <List.Icon {...props} icon="cloud-check-outline" color={colors.primary} />}
        />
        <List.Item
          title={String(pendingCount)}
          description="Cambios pendientes por subir"
          left={(props) => <List.Icon {...props} icon="cloud-upload-outline" color={colors.primary} />}
        />
        <View style={styles.buttonRow}>
          <Button mode="contained" onPress={handleSyncNow}>
            Sincronizar ahora
          </Button>
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.subheader}>Acerca de</List.Subheader>
        <List.Item
          title={Constants.expoConfig?.name ?? 'Alejo Zuloaga Asistencia'}
          description={`Versión ${Constants.expoConfig?.version ?? '1.0.0'}`}
          left={(props) => <List.Icon {...props} icon="information-outline" color={colors.primary} />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.subheader}>Soporte</List.Subheader>
        <View style={styles.buttonRow}>
          <Button mode="outlined" icon="whatsapp" onPress={handleReportIssue}>
            Reportar un problema
          </Button>
        </View>
      </List.Section>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage(null)} duration={4000}>
        {snackbarMessage ?? ''}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  subheader: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  buttonRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
