import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button, Snackbar, Text, TextInput } from 'react-native-paper';

import { fetchUserRole, signInWithEmail } from '@/modules/auth/repository';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  async function handleLogin() {
    setSubmitting(true);
    setErrorMessage(null);

    const { user, error } = await signInWithEmail(email.trim(), password);

    if (error || !user) {
      setErrorMessage(error ?? 'No se pudo iniciar sesión.');
      setSubmitting(false);
      return;
    }

    const role = await fetchUserRole(user.id);
    setSession(user, role);
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
      <Text variant="headlineSmall" style={styles.title}>
        Alejo Zuloaga Asistencia
      </Text>

      <TextInput
        label="Correo electrónico"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        label="Contraseña"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={submitting}
        disabled={submitting || !email || !password}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Ingresar
      </Button>

      <Snackbar visible={!!errorMessage} onDismiss={() => setErrorMessage(null)} duration={4000}>
        {errorMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
    color: colors.text,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    height: 48,
  },
});
