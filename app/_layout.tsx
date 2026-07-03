import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import { fetchUserRole, getCurrentSession } from '@/modules/auth/repository';
import { initSchema } from '@/services/database/schema';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { colors, paperTheme } from '@/theme';

import type { PropsWithChildren } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthBootstrap({ children }: PropsWithChildren) {
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const user = await getCurrentSession();
      const role = user ? await fetchUserRole(user.id) : null;
      if (isMounted) setSession(user, role);
      SplashScreen.hideAsync().catch(() => {});
    }

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? null } : null;
      const role = user ? await fetchUserRole(user.id) : null;
      if (isMounted) setSession(user, role);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [setSession]);

  return <>{children}</>;
}

function DatabaseLoading() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<DatabaseLoading />}>
        <SQLiteProvider databaseName="alejo_zuloaga.db" onInit={initSchema} useSuspense>
          <PaperProvider theme={paperTheme}>
            <AuthBootstrap>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AuthBootstrap>
          </PaperProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}
