# Sincronización offline — Alejo Zuloaga Asistencia

La app es **offline-first**: SQLite es la fuente de verdad y la sincronización con Supabase ocurre
solo cuando el docente presiona manualmente "Sincronizar". Este documento detalla el patrón Outbox,
el algoritmo del `SyncManager`, el manejo de conflictos y la UX del botón de sincronización.

## Patrón Outbox

Cada vez que se muta un registro de dominio en SQLite, en la **misma transacción** se inserta un
evento en la tabla `outbox`. Así, la escritura local y la intención de sincronizar son atómicas: o
ambas ocurren o ninguna. El `SyncManager` procesa esa cola cuando hay conexión.

### Estructura de la tabla outbox

| Campo             | Propósito                                                              |
|-------------------|-----------------------------------------------------------------------|
| `id`              | UUID del evento de outbox                                              |
| `entity`          | Tipo de entidad: `section`, `student`, `attendance`, `behavior`       |
| `entity_id`       | ID del registro de dominio afectado                                   |
| `op`              | Operación: `upsert` o `delete`                                        |
| `payload`         | JSON serializado del registro (para el upsert remoto)                 |
| `idempotency_key` | Clave única que evita duplicados en reintentos                        |
| `created_at`      | Timestamp; define el orden FIFO de procesamiento                      |
| `attempts`        | Número de intentos de envío realizados                                |
| `last_error`      | Último mensaje de error, para diagnóstico                             |

### idempotency_key

Se genera combinando `entity + entity_id + op + updated_at` (o un UUID estable por evento). Al hacer
el upsert en Supabase se envía esta clave; si el evento se reintenta tras un fallo parcial (por
ejemplo, la respuesta se perdió pero el servidor sí escribió), el servidor reconoce la clave y **no
duplica** el registro. Esto hace que la sincronización sea segura ante reintentos.

## Algoritmo del SyncManager (paso a paso)

1. **Verificar conexión** con `@react-native-community/netinfo`. Si no hay red, abortar y mostrar
   snackbar "Sin conexión".
2. Si hay conexión: **leer el outbox** ordenado por `created_at` (FIFO).
3. Para cada evento, ejecutar el `upsert`/`delete` correspondiente en Supabase según `entity` y `op`,
   enviando la `idempotency_key`.
4. **Si éxito:** eliminar el evento del outbox y marcar el registro local como `synced = 1`.
5. **Si error:** incrementar `attempts`, guardar `last_error`, y **continuar con el siguiente** evento
   (no se detiene toda la sincronización por un fallo aislado).
6. Terminado el push, hacer **pull** de los cambios del servidor desde el último cursor guardado en
   `sync_meta` (`last_pull_cursor`).
7. **Actualizar el cursor** en `sync_meta` con el timestamp del pull más reciente.
8. **Actualizar el estado** de sincronización en la UI (success / partial / error).

## Manejo de conflictos

Estrategia **last-write-wins** comparando `updated_at`: si el registro remoto y el local difieren,
gana el de `updated_at` más reciente. No se hacen merges parciales campo a campo; dada la naturaleza
del dominio (un docente es el dueño de sus secciones), los conflictos reales son poco frecuentes.

## Detección de red

Se usa `@react-native-community/netinfo`:
- `NetInfo.fetch()` para una comprobación puntual antes de sincronizar.
- `NetInfo.addEventListener(...)` para reflejar en la UI el estado de conexión en tiempo real
  (por ejemplo, habilitar/deshabilitar el botón "Sincronizar").

## Estados de sincronización

| Estado    | Indicador visual                          |
|-----------|-------------------------------------------|
| `idle`    | Ícono gris (cloud-upload)                 |
| `syncing` | Spinner animado                           |
| `success` | Check verde                               |
| `error`   | Ícono rojo                                |
| `partial` | Ícono naranja con contador de fallidos    |

## UX del botón "Sincronizar"

- Ubicado arriba a la derecha (header), con ícono **cloud-upload**.
- Muestra un **badge** con el número de eventos pendientes en el outbox.
- Cambia de color/ícono según el estado de sincronización listado arriba.
- Al terminar, muestra feedback claro: "Todo sincronizado" o "N registros no se pudieron subir".

## Casos edge

| Caso                     | Comportamiento                                                    |
|--------------------------|-------------------------------------------------------------------|
| Sin conexión             | Snackbar "Sin conexión"; no se intenta sincronizar                |
| Outbox vacío             | Mensaje "Todo sincronizado"; no se hace ninguna llamada de push   |
| Error parcial            | Ícono naranja + contador de cuántos eventos fallaron              |
| Fallo repetido de un evento | Se conserva en outbox con `attempts` y `last_error` para revisión |

Ver también [database_schema.md](database_schema.md) (tablas `outbox` y `sync_meta`) y la regla
[.claude/rules/sqlite-offline.md](../.claude/rules/sqlite-offline.md).
