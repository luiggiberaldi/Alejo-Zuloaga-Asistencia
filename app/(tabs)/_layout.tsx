import { Redirect, Tabs } from 'expo-router';

import { SyncButton } from '@/components/ui/SyncButton';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        tabBarActiveTintColor: colors.primary,
        headerRight: () => <SyncButton />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="reportes" options={{ title: 'Reportes' }} />
    </Tabs>
  );
}
