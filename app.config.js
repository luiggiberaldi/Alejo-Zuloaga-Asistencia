const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const urlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
      const keyMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
      if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim();
      if (keyMatch && keyMatch[1]) supabaseAnonKey = keyMatch[1].trim();
    }
  } catch (e) {
    console.warn('Error leyendo .env.local desde app.config.js:', e.message);
  }
}

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
      supabaseUrl,
      supabaseAnonKey,
    },
  },
};
