# 03 — Plan de Fases (Nexo TI, v2)

Cada fase termina solo cuando cumple sus criterios de aceptación. No se avanza con pruebas pendientes.

---

## Fase 0 — Preparación

**Tareas**
- Crear proyecto Next.js con TypeScript estricto (`strict`, `noUncheckedIndexedAccess`) y Tailwind.
- Fijar versiones exactas en `package.json` y commitear el lockfile.
- Crear proyecto Supabase, instalar Supabase CLI y `supabase init`.
- Configurar `.env.local` con URL, clave `anon` y `SUPABASE_SERVICE_ROLE_KEY`. Esta última nunca usa prefijo `NEXT_PUBLIC_`.
- Scripts: `dev`, `build`, `typecheck` (`tsc --noEmit`), `lint`.
- Desactivar el registro público en Supabase Auth.

**Aceptación**
- `npm run build` y `npm run typecheck` pasan.
- `.env.local` está en `.gitignore`.
- Registro público desactivado (se comprueba intentando crear una cuenta desde la API pública y recibiendo rechazo).

---

## Fase 1 — Base de datos, auth y RLS

**Tareas**
- Migración inicial: enums, `profiles`, trigger `handle_new_user`, función `current_role_nexo`.
- Verificar que Supabase acepte el dominio interno elegido (ver `02`, sección 3). Si lo rechaza, cambiarlo.
- `login/page.tsx`: formulario de username y contraseña que construye el correo interno.
- `proxy.ts`: refresco de sesión.
- `lib/supabase/server.ts`, `client.ts`, `lib/auth.ts`.
- `(dashboard)/layout.tsx` con `getUser()` y validación de `is_active`.
- Políticas RLS de `profiles`.
- Generar tipos con `supabase gen types typescript`.
- Crear el usuario `venllas` desde el dashboard y marcarlo por SQL como `role = 'ADMIN_TI'` e `is_superadmin = true`. Es el único paso manual.
- Paquete `server-only`, cliente admin en `lib/supabase/admin.ts`.
- Server Actions `createUser` (ADMIN_TI y superadmin), `setUserActive` y `resetUserPassword` (solo superadmin), y pantalla `/admin/usuarios`.

**Aceptación**
- Sin sesión, cualquier ruta del dashboard redirige a `/login`.
- Un usuario con `is_active = false` no entra aunque tenga credenciales válidas.
- Un `SOLICITANTE` no accede a `/admin/auditoria`.
- Un usuario no puede cambiar su propio `role` desde el cliente (prueba SQL).
- Un `SOLICITANTE` que invoque `createUser` recibe "No autorizado".
- Un `ADMIN_TI` puede crear solicitantes y otros admins.
- Un `ADMIN_TI` que invoque `setUserActive` o `resetUserPassword` recibe "No autorizado".
- Nadie puede desactivarse a sí mismo.
- Un segundo `is_superadmin = true` es rechazado por el índice único.
- Un admin crea un usuario y el registro queda en `audit_logs` con su `actor_id`.
- `SUPABASE_SERVICE_ROLE_KEY` no aparece en `.next/static` tras el build.
- Pruebas SQL de RLS de `profiles` pasan.

---

## Fase 2 — Mesa de ayuda

**Tareas**
- Migración de `tickets` y `ticket_comments` con sus políticas.
- Trigger de auditoría en `tickets`.
- Server Actions: crear ticket, cambiar estado, asignar técnico, comentar.
- Lista de tickets: solicitante ve los suyos; técnico ve todos. Filtro por estado.
- Detalle con hilo de comentarios y checkbox de nota interna (solo para técnicos).
- Vista tipo tablero agrupada por estado. El cambio de estado se hace con un menú o botones en cada tarjeta. Sin drag-and-drop.

**Aceptación**
- **Anti-IDOR:** un solicitante que conoce el `id` de un ticket ajeno recibe "no encontrado" en la página y en una consulta directa a Supabase.
- Un solicitante no ve comentarios con `is_internal = true` aunque consulte la tabla directamente.
- Cada cambio de estado deja una fila en `audit_logs`.
- Todos los Server Actions validan con Zod.

---

## Fase 3 — Taller de tarjetas

**Tareas**
- Migración de `boards`, `board_steps`, `board_components`, `board_logs`, `board_serial_counters`.
- Función `create_board` para el serial `TRJ-{YYYY}-{NNN}`.
- Función `advance_board_step` con el pipeline fijo (Diagnóstico, Reparación, Pruebas, Entrega).
- Pantalla de detalle con stepper que muestra el paso actual y el historial.
- Botón "Avanzar paso" con nota opcional.
- BOM: alta de componente, cambio de estado, designador único por tarjeta.
- Bitácora: tipos `NOTA_TECNICA`, `MEDICION`, `CAMBIO_ESTADO`, `ALERTA`. Campos de medición (punto, valor, unidad) cuando el tipo es `MEDICION`.

**Aceptación**
- Dos llamadas simultáneas a `advance_board_step` sobre la misma tarjeta producen un solo avance. Se verifica con dos sesiones en paralelo.
- El pipeline recorre los cuatro pasos en orden. Al completar Pruebas la tarjeta pasa a `REPARADA`. Al completar Entrega pasa a `ENTREGADA`.
- No se puede avanzar una tarjeta ya entregada.
- Dos altas simultáneas generan seriales distintos.
- Un solicitante no puede leer tarjetas, pasos, BOM ni bitácora.

---

## Fase 4 — Base de conocimiento y auditoría

**Tareas**
- Migración de `kb_articles` con sus políticas.
- CRUD de artículos para admin (crear, editar, publicar/despublicar). Slug generado a partir del título.
- Renderizado de Markdown con sanitización mediante una librería dedicada y lista blanca explícita. No escribir un sanitizador propio.
- Incremento de `view_count` con `increment_view_count`.
- Visor de auditoría para admin con filtros por entidad y fecha, y paginación por cursor. Sin exportación.

**Aceptación**
- Un solicitante no ve artículos con `is_published = false`, ni por la interfaz ni por consulta directa.
- Un `<script>` o `<img onerror>` dentro de un artículo no se ejecuta en el navegador.
- Un `UPDATE` o `DELETE` directo sobre `audit_logs` es rechazado por la base de datos.
- El visor muestra los cambios de estado y de datos con su diff.

---

## Fase 5 — Extras (solo si se confirman)

- Códigos QR por tarjeta con `qrcode.react` y nivel de corrección `H`.
- Búsqueda rápida con `Ctrl + K` implementada sin librería, si se necesita.
- Realtime en el taller, solo si varios técnicos trabajan a la vez sobre la misma tarjeta.

---

## Verificación transversal

| Tipo | Herramienta | Frecuencia |
|---|---|---|
| Compilación | `tsc --noEmit` y `npm run build` | Cada commit |
| Lint | ESLint con configuración de Next | Cada commit |
| RLS y esquema | Scripts SQL en `supabase/tests/` con dos usuarios | Cada migración |
| Anti-IDOR | Consultas con sesión de otro usuario | Fases 2 a 4 |
| Concurrencia | Dos sesiones en paralelo | Fase 3 y cambios en funciones |
| Auditoría | Cada mutación deja fila en `audit_logs` | Fases 2 a 4 |

**Criterio de salida de cada fase:** build limpio, tipos regenerados, pruebas de la fase en verde y ninguna clave secreta en el código ni en el bundle del cliente.
