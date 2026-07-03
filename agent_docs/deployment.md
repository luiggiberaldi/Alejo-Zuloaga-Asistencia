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

## Setup de Supabase

1. Crear proyecto en [supabase.com](https://supabase.com).
2. Ejecutar migraciones: `supabase db push` (aplica `supabase/migrations/001..006`).
3. Cargar datos de demo: `supabase/seed.sql` con **2 profesores, 1 coordinador, 3 secciones y 15
   estudiantes** para pruebas.
4. Copiar `Project URL` y `anon key` a `.env` / EAS secrets.

## Icono y splash de la app

- Obtener el logo del liceo desde Instagram **@cealejozuloaga**.
- Redimensionar a **1024×1024 px** para `icon.png`.
- Splash con fondo verde institucional `#1B5E20`.

## Distribución inicial

- APK por **sideloading**: se comparte el archivo `.apk` generado por EAS con los docentes, que lo
  instalan manualmente (habilitando "instalar apps de origen desconocido" en Android).
- No se usa Play Store en la primera fase para acelerar la entrega y evitar la revisión de la tienda.

Ver [database_schema.md](database_schema.md) para el detalle de las migraciones y
[roles_and_permissions.md](roles_and_permissions.md) para la asignación de roles en el seed.
