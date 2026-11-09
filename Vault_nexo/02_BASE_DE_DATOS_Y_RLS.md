# 02 — Base de Datos y Seguridad RLS

El modelo de datos se diseñó para PostgreSQL 15+ en Supabase. Cuenta con **10 tablas**, 7 tipos ENUM, triggers de auditoría inmutables y funciones atómicas transaccionales (`SECURITY DEFINER` con `search_path = public, pg_temp`).

---

## 1. Tablas y Tipos

### Tipos ENUM
- `user_role`: `'SOLICITANTE' | 'ADMIN_TI'`
- `ticket_status`: `'ABIERTO' | 'EN_PROGRESO' | 'EN_ESPERA' | 'RESUELTO' | 'CERRADO'`
- `ticket_priority`: `'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'`
- `board_status`: `'EN_LABORATORIO' | 'EN_REPARACION' | 'REPARADA' | 'ENTREGADA'`
- `repair_step`: `'DIAGNOSTICO' | 'REPARACION' | 'PRUEBAS' | 'ENTREGA'`
- `component_status`: `'REQUERIDO' | 'EN_STOCK' | 'SOLICITADO' | 'INSTALADO'`
- `log_kind`: `'NOTA_TECNICA' | 'MEDICION' | 'CAMBIO_ESTADO' | 'ALERTA'`

### Tablas del Sistema
| Tabla | Clave Primaria | Propósito | RLS |
|---|---|---|---|
| `public.profiles` | `id` (UUID references auth.users) | Perfil de usuario, username único, rol y flags de superadmin y actividad | ✅ |
| `public.board_serial_counters` | `year` (int) | Contador atómico para seriales anuales `TRJ-{YYYY}-{NNN}` | ✅ |
| `public.boards` | `id` (UUID) | Ficha de tarjeta electrónica con serial, modelo, cliente y fase actual | ✅ |
| `public.board_steps` | `id` (UUID) | Registro histórico de inicio y fin de cada paso del pipeline | ✅ |
| `public.board_components` | `id` (UUID) | Lista de materiales (BOM) requeridos/instalados por tarjeta | ✅ |
| `public.board_logs` | `id` (UUID) | Bitácora técnica con notas, cambios de fase y mediciones JSONB | ✅ |
| `public.tickets` | `id` (UUID) | Incidencias y requerimientos de soporte técnico | ✅ |
| `public.ticket_comments` | `id` (UUID) | Mensajes y notas internas sobre cada ticket | ✅ |
| `public.kb_articles` | `id` (UUID) | Artículos de conocimiento técnico en Markdown | ✅ |
| `public.audit_logs` | `id` (bigint identity) | Registro inmutable append-only de mutaciones del sistema | ✅ |

---

## 2. Funciones Atómicas (RPC)

### `public.create_board(p_model text, p_owner text) -> uuid`
- **Seguridad:** Requiere que el usuario sea `ADMIN_TI`.
- **Atomicidad:** Realiza un `UPSERT` en `board_serial_counters` sobre el año en curso:
  ```sql
  insert into public.board_serial_counters (year, last_number)
  values (v_year, 1)
  on conflict (year) do update
    set last_number = public.board_serial_counters.last_number + 1
  returning last_number into v_n;
  ```
- **Formato:** Genera seriales únicos tipo `TRJ-2026-001`, eliminando cualquier riesgo de colisión concurrente.

### `public.advance_board_step(p_board_id uuid, p_note text) -> public.board_status`
- **Bloqueo:** Usa `SELECT ... FOR UPDATE` sobre la tarjeta para evitar avances dobles por peticiones simultáneas.
- **Pipeline fijo:**
  - Si no tiene paso $\longrightarrow$ Pasa a `DIAGNOSTICO` (`status = EN_REPARACION`).
  - `DIAGNOSTICO` $\longrightarrow$ Pasa a `REPARACION`.
  - `REPARACION` $\longrightarrow$ Pasa a `PRUEBAS`.
  - `PRUEBAS` $\longrightarrow$ Pasa a `ENTREGA` (`status = REPARADA`).
  - `ENTREGA` $\longrightarrow$ Finaliza el pipeline (`status = ENTREGADA`, `current_step = null`).
- Actualiza automáticamente `completed_at` en `board_steps` e inserta una entrada tipo `CAMBIO_ESTADO` en `board_logs`.

### `public.increment_view_count(p_article_id uuid) -> void`
- Incrementa de forma atómica y no bloqueante las lecturas de un artículo publicado en `kb_articles`.

---

## 3. Políticas de Row Level Security (RLS)

- **Anti-IDOR en Tickets:**
  - Solicitante: Solo lee y crea tickets donde `requester_id = auth.uid()`.
  - Técnico (`ADMIN_TI`): Acceso completo de lectura y actualización.
- **Notas Internas Ocultas:**
  - Solicitante: Solo lee comentarios con `is_internal = false` en sus propios tickets.
  - Técnico: Lee y escribe notas tanto públicas como internas (`is_internal = true`).
- **Taller Exclusivo:**
  - Acceso a `boards`, `board_steps`, `board_components`, `board_logs` y `board_serial_counters` restringido 100% a usuarios con rol `ADMIN_TI`. Un solicitante que consulte la tabla vía API recibe 0 filas.
- **Inmutabilidad en Auditoría:**
  - `revoke update, delete, truncate on public.audit_logs from anon, authenticated;`
  - Nadie puede alterar o borrar registros de auditoría desde PostgREST.
