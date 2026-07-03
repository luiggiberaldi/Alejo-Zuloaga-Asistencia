import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Badge, IconButton, Portal, Snackbar } from 'react-native-paper';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncStore } from '@/store/sync-store';

import type { SyncStatus } from '@/modules/sync/types';

export function SyncButton() {
  const status = useSyncStore((state) => state.status);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const sync = useSyncStore((state) => state.sync);
  const refreshPendingCount = useSyncStore((state) => state.refreshPendingCount);
  const { isConnected } = useNetworkStatus();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Cargar contador de pendientes al montar el componente
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  async function handlePress() {
    if (status === 'syncing') return;

    if (!isConnected) {
      Alert.alert(
        'Sin conexión',
        'No hay conexión a internet disponible. Conéctate a una red para sincronizar tus datos.',
      );
      return;
    }

    try {
      const result = await sync();
      if (result) {
        if (result.failed > 0) {
          setSnackbarMessage(
            `Sincronización parcial: ${result.pushed} subidos, ${result.failed} fallidos.`,
          );
        } else {
          setSnackbarMessage(
            `Sincronización exitosa: ${result.pushed} enviados, ${result.pulled} descargados.`,
          );
        }
        setSnackbarVisible(true);
      }
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Fallo completo al sincronizar datos.');
      setSnackbarVisible(true);
    }
  }

  function getIconForStatus(currentStatus: SyncStatus): string {
    switch (currentStatus) {
      case 'success':
        return 'cloud-check';
      case 'error':
      case 'partial':
        return 'cloud-alert';
      default:
        return 'cloud-upload-outline';
    }
  }

  function getIconColorForStatus(currentStatus: SyncStatus): string {
    switch (currentStatus) {
      case 'success':
        return '#81C784'; // Verde claro institucional
      case 'error':
        return '#FF8A80'; // Rojo claro peligro
      case 'partial':
        return '#FFD54F'; // Naranja/ámbar claro
      default:
        return '#FFFFFF'; // Blanco
    }
  }

  return (
    <View style={styles.container}>
      {status === 'syncing' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <IconButton
          icon={getIconForStatus(status)}
          iconColor={getIconColorForStatus(status)}
          size={24}
          onPress={handlePress}
          accessibilityLabel="Sincronizar datos"
        />
      )}

      {pendingCount > 0 && status !== 'syncing' && (
        <Badge style={styles.badge} size={16}>
          {pendingCount}
        </Badge>
      )}

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={5000}
          action={{
            label: 'Cerrar',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  loaderContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFD54F', // Color secundario del liceo (amarillo/oro)
    color: '#000000',
    fontWeight: 'bold',
  },
});
