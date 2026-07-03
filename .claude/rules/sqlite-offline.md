---
description: "Patrones offline-first: SQLite, outbox, sincronización"
paths: "src/services/database/**/*.ts, src/services/sync/**/*.ts, src/modules/**/*.ts"
---

# Patrones offline-first (SQLite + Outbox)

- **SQLite (expo-sqlite) es el source of truth** de la app. La UI siempre lee y escribe primero en SQLite, nunca espera una respuesta de red para responder.
- Toda escritura a SQLite que deba sincronizarse debe **también insertar un evento en la tabla `outbox` dentro de la misma transacción**. No hay escritura de dominio sin su evento de outbox correspondiente.
- Usar transacciones (`db.withTransactionAsync` o equivalente) para cualquier operación que toque más de una tabla.
- IDs como `TEXT` (UUID v4), generados con `crypto.randomUUID()` o `expo-crypto`. Nunca autoincrementales, para evitar colisiones al sincronizar.
- Toda tabla de dominio (`sections`, `students`, `attendance_records`, `behavior_reports`) tiene el campo `synced INTEGER DEFAULT 0`.
- Estructura de la tabla `outbox`: `id, entity, entity_id, op (upsert|delete), payload (JSON), idempotency_key, created_at, attempts, last_error`.
- Estructura de la tabla `sync_meta`: `key TEXT PRIMARY KEY, value TEXT` — guarda el cursor de la última sincronización exitosa.
- El `SyncManager` sigue siempre el mismo orden: **procesar outbox (push) → pull de cambios del servidor → actualizar `sync_meta`**.
- Manejo de conflictos: **last-write-wins** comparando `updated_at`. El registro más reciente gana, sin merges parciales.
- Antes de sincronizar, verificar conexión con `@react-native-community/netinfo`. Si no hay red, no intentar la sincronización y notificar al usuario.
- Estados de sincronización posibles: `idle`, `syncing`, `success`, `error`, `partial`. La UI del botón "Sincronizar" refleja siempre uno de estos estados.
- Ver detalle completo del algoritmo en [agent_docs/offline_sync.md](../../agent_docs/offline_sync.md).
