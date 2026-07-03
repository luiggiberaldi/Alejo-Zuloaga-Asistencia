# Despliegue — Alejo Zuloaga Asistencia

La app se distribuye como **APK Android** generado con **EAS Build**. No se publica (inicialmente) en
Play Store; la distribución es por sideloading del APK.

## EAS Build para Android

```bash
# APK de preview (distribución interna / sideloading)
eas build --platform android --profile preview

# AAB de producción (para Play Store, si se decide publicar)
eas build --platform android --profile production
```

## Configuración de app.json / app.config.js

```json
{
  "expo": {
    "name": "Alejo Zuloaga Asistencia",
    "slug": "alejo-zuloaga-asistencia",
    "version": "1.0.0",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "backgroundColor": "#1B5E20",
      "resizeMode": "contain"
    },
    "android": {
      "package": "com.alejozuloaga.asistencia",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#1B5E20"
      }
    }
  }
}
```

## eas.json (profiles)

```json
{
  "build": {
    "preview": {
      "developmentClient": false,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Variables de entorno

| Variable                          | Uso                                   |
|-----------------------------------|---------------------------------------|
| `EXPO_PUBLIC_SUPABASE_URL`        | URL del proyecto Supabase             |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | Anon key pública de Supabase          |

- En desarrollo: archivo `.env` (nunca comiteado; ver `.env.example`).
- En producción: **EAS secrets** (`eas secret:create`), nunca hardcodeadas en el repo.

## Setup de Supabase e Infraestructura Remota

1. **Crear proyecto**: registrar el proyecto en [supabase.com](https://supabase.com).
2. **Ejecutar migraciones**: Vincular y subir el esquema desde la terminal con:
   ```bash
   npx supabase login --token <SUPABASE_ACCESS_TOKEN>
   npx supabase link --project-ref kwtqbhhrgolnwasbaadj --yes
   npx supabase db push
   ```
3. **Cargar datos semilla (Usuarios de prueba)**:
   Debido a las políticas de seguridad de Supabase, los usuarios no se pueden insertar directamente en `auth.users` mediante SQL remoto de forma directa y limpia. Debes crearlos manualmente en el Dashboard:
   * Ve a **Authentication** → **Users** → **Add user** → **Create user**.
   * Crea un usuario Profesor (ej: `profesor@liceo.com`, contraseña `profesor123`).
   * Crea un usuario Coordinador (ej: `coordinador@liceo.com`, contraseña `coordinador123`).
   * Ve a la sección **SQL Editor** en el Dashboard de Supabase y ejecuta las siguientes consultas para asignar sus roles, reemplazando los placeholders con los IDs generados:
     ```sql
     -- Asignar rol de Profesor (ej: año 1ro)
     INSERT INTO public.user_roles (user_id, role, year_level)
     VALUES ('<UUID_DEL_PROFESOR>', 'profesor', '1ro')
     ON CONFLICT (user_id) DO NOTHING;

     -- Asignar rol de Coordinador
     INSERT INTO public.user_roles (user_id, role, year_level)
     VALUES ('<UUID_DEL_COORDINADOR>', 'coordinador', 'todos')
     ON CONFLICT (user_id) DO NOTHING;
     ```

## Generación de APK con EAS Build (Android)

Para generar el APK de pruebas (preview) mediante sideloading, sigue estos pasos:

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Iniciar sesión en Expo**:
   ```bash
   eas login
   ```
3. **Configurar el proyecto en EAS**:
   ```bash
   eas build:configure
   ```
   *Nota: Esto generará un ID de proyecto en Expo. Copia ese ID y pégalo en el campo `extra.eas.projectId` dentro de `app.config.js`.*
4. **Ejecutar la compilación del APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   Al finalizar, EAS proporcionará un enlace de descarga y un código QR para descargar directamente el archivo `.apk` e instalarlo en los dispositivos móviles de los docentes.

Ver [database_schema.md](database_schema.md) para el detalle de las migraciones y [roles_and_permissions.md](roles_and_permissions.md) para la asignación de roles.
