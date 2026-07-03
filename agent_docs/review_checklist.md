# Checklist de revisión de código — Alejo Zuloaga Asistencia

Usar este checklist antes de aprobar cualquier cambio de código (propio o generado por Claude Code).
Ningún cambio se integra sin pasar todas las casillas aplicables.

## Correctness

- [ ] El código compila sin errores de TypeScript (`npx tsc --noEmit`).
- [ ] La función hace exactamente lo que se pidió, ni más ni menos.
- [ ] Se manejan los casos edge (lista vacía, sin conexión, datos inválidos, archivo vacío).
- [ ] Los tipos están definidos correctamente; no hay `any` sin justificación.

## Seguridad

- [ ] No hay secrets hardcodeados.
- [ ] Cambios en auth / RLS marcados para revisión manual.
- [ ] No hay nuevas dependencias sin justificación.
- [ ] No se exponen claves de Supabase `service_role`.

## Calidad

- [ ] Ningún archivo supera 600 líneas.
- [ ] No hay `console.log` fuera del logger centralizado.
- [ ] Imports siguen el orden establecido (React, externas, internas, tipos).
- [ ] Componentes UI cumplen accesibilidad mínima (48dp, 16sp, contraste AA).
- [ ] No hay datos mock hardcodeados en componentes.

## Arquitectura

- [ ] No se violan límites entre módulos (un módulo no importa de otro módulo directamente).
- [ ] Toda escritura a SQLite también encola en `outbox`.
- [ ] Toda operación de red tiene manejo de error offline.
- [ ] Los errores de red no crashean la app.
- [ ] Las acciones destructivas tienen confirmación.

## Documentación

- [ ] Si se añadió un módulo o servicio nuevo, se documentó en `agent_docs/`.
- [ ] Si se cambió la arquitectura, se actualizó `ARQUITECTURA.md`.
- [ ] El cambio se registró en `BITACORA.md`.
