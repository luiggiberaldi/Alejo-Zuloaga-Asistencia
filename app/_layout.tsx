import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import { fetchUserRole, getCurrentSession } from '@/modules/auth/repository';
import { hasSections } from '@/modules/sections/repository';
import { initSchema } from '@/services/database/schema';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useSectionsStore } from '@/store/sections-store';
import { useSyncStore } from '@/store/sync-store';
import { colors, paperTheme } from '@/theme';

import type { PropsWithChildren } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

// En el primer arranque en frío (justo después de instalar), hideAsync()
// puede fallar silenciosamente si el módulo nativo de splash screen aún no
// terminó de registrarse — sin reintento, el splash queda pegado hasta que
// se cierra y reabre la app manualmente. Reintentamos unas cuantas veces.
async function hideSplashWithRetry(retries = 4): Promise<void> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await SplashScreen.hideAsync();
      return;
    } catch {
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }
}

function AuthBootstrap({ children }: PropsWithChildren) {
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      let user = null;
      try {
        user = await getCurrentSession();
        const role = user ? await fetchUserRole(user.id) : null;
        if (isMounted) setSession(user, role);
      } finally {
        await hideSplashWithRetry();
      }

      if (user) {
        try {
          const alreadyHasSections = await hasSections();
          if (!alreadyHasSections) {
            await useSyncStore.getState().sync();
            if (isMounted) useSectionsStore.getState().loadSections();
          }
        } catch {
          // Pull inicial silencioso: si falla (sin red, error de servidor, etc.)
          // no se interrumpe el arranque de la app — el profesor puede
          // sincronizar manualmente con el botón de sincronizar.
        }
      }
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
