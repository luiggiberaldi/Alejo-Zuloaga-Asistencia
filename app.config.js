export default {
  expo: {
    name: 'Alejo Zuloaga Asistencia',
    slug: 'alejo-zuloaga-asistencia',
    scheme: 'alejo-zuloaga',
    version: '1.0.0',
    icon: './assets/images/icon.png',
    android: {
      package: 'com.alejozuloaga.asistencia',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#1B5E20',
      },
    },
    plugins: [
      'expo-router',
      'expo-sharing',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          backgroundColor: '#1B5E20',
          imageWidth: 200,
        },
      ],
    ],
    extra: {
      eas: {
        // TODO: Pegar aquí el projectId real generado tras ejecutar `eas build:configure`
        projectId: '',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
