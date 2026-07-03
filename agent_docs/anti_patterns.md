# Anti-patrones prohibidos — Alejo Zuloaga Asistencia

Estos anti-patrones están **prohibidos** en el proyecto. La columna "Qué hacer en su lugar" indica la
alternativa correcta.

| Anti-patrón | Por qué es malo | Qué hacer en su lugar |
|---|---|---|
| Prop drilling de más de 2 niveles | Acoplamiento excesivo, difícil de mantener | Usar el store de Zustand |
| Componente con más de 3 `useEffect` | Lógica dispersa, bugs difíciles de rastrear | Extraer a un custom hook |
| Query de Supabase directa en un componente | Difícil de testear y cachear | Usar el Repository pattern |
| Hardcodear strings de UI en inglés | El cliente habla español | Centralizar en `constants.ts` |
| Modal dentro del render de un `FlatList` | Performance deficiente | Renderizar el modal a nivel de pantalla |
| `try/catch` con `catch` vacío | Bugs silenciosos | Siempre loguear o propagar el error |
| Más de 3 props booleanas en un componente | API confusa | Refactorizar a un objeto de configuración |
| `useState` + `useEffect` para datos de servidor | Race conditions | Usar un hook dedicado con `AbortController` |
| Archivo de más de 600 líneas | Difícil de mantener y leer | Refactorizar en archivos más pequeños |
| Import circular entre módulos | Errores en runtime, difícil de depurar | Reestructurar dependencias |
| `console.log` en producción | Contamina logs, filtra información | Usar el logger centralizado |
| Datos mock en componentes de producción | Datos falsos llegan a producción | Usar `src/services/mock.ts` con flag `__DEV__` |
| Commit con más de 200 líneas cambiadas | Difícil de revisar y revertir | Dividir en commits más pequeños |
| Escribir en SQLite sin encolar en `outbox` | Los datos no se sincronizan | Escribir en `outbox` en la misma transacción |
| Ignorar el `error` de Supabase | Bugs silenciosos, datos perdidos | Siempre manejar el objeto `error` retornado |

Ver también [review_checklist.md](review_checklist.md) y las reglas en
[.claude/rules/](../.claude/rules/).
