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
      '@react-native-community/datetimepicker',
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
        projectId: 'bbcfea76-2235-4773-aae7-cafc6ff58f81',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
