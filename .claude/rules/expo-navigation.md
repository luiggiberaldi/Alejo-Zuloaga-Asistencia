---
description: "Reglas de navegación con expo-router"
paths: "app/**/*.tsx"
---

# Navegación con expo-router

- Usar **expo-router** (file-based routing) exclusivamente. Prohibido instalar o usar `@react-navigation/native` directamente; expo-router ya lo envuelve internamente.
- Organizar rutas en grupos:
  - `app/(auth)/` — pantalla de login (sin sesión activa)
  - `app/(tabs)/` — navegación principal autenticada (Inicio, Reportes)
- Layouts declarados con `Stack` y `Tabs` de `expo-router` (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`).
- Rutas dinámicas con notación `[id].tsx` para detalle de sección (ej: `app/(tabs)/secciones/[id].tsx`).
- Navegación programática siempre con `router.push()` / `router.replace()` / `router.back()`, nunca con `navigation.navigate()` de React Navigation.
- El layout raíz (`app/_layout.tsx`) decide el grupo activo según el estado de sesión en el store de Zustand (auth).
- Las pantallas del rol coordinador y profesor viven bajo el mismo grupo `(tabs)`, renderizando contenido condicional según `role`, no rutas duplicadas.
