---
description: "Manejo de errores centralizado"
paths: "src/services/**/*.ts, src/modules/**/*.ts"
---

# Manejo de errores

- Toda operación contra SQLite debe estar envuelta en `try/catch`. Ningún `catch` puede quedar vacío: siempre loguear con el logger centralizado o propagar el error.
- Toda llamada a Supabase debe manejar explícitamente el objeto `error` retornado (`const { data, error } = await ...`). Nunca ignorar `error`.
- Los **errores de red NO deben crashear la app**. Ante un fallo de red se muestra un mensaje al usuario y la operación queda encolada en el `outbox` para reintentarse en la próxima sincronización.
- Usar el `ErrorHandler` centralizado en `src/services/error-handler.ts` para clasificar y reportar errores.
- Niveles de log disponibles: `info`, `warn`, `error`. Elegir el nivel según la gravedad real.
- **Prohibido `console.log` en producción.** Usar siempre el logger centralizado, que se silencia fuera de `__DEV__`.
- Los errores esperables (validación, sin conexión) se comunican al usuario con lenguaje claro en español; los inesperados se loguean con contexto suficiente para depurar.
