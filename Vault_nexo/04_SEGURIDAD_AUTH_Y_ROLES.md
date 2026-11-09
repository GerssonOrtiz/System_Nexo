# 04 — Seguridad, Autenticación y Roles

El esquema de seguridad de Nexo TI está fundamentado en defensas en profundidad, separando estrictamente las responsabilidades entre el cliente web, el servidor de aplicaciones y PostgreSQL.

---

## 1. Autenticación por Username Interno

Supabase Auth opera nativamente mediante correos electrónicos. Para brindar una experiencia empresarial sin requerir cuentas de correo externas:
1. En `/login`, el usuario introduce su **username** (ej. `venllas`) y contraseña.
2. El servidor construye de forma transparente el correo interno:
   $$\text{email} = \text{username} + \text{"@cabelab.local"}$$
3. Se invoca `signInWithPassword` con dicho correo.
4. Las cookies de sesión HttpOnly son gestionadas automáticamente por `@supabase/ssr`.
5. Si un usuario tiene `is_active = false` o `deleted_at IS NOT NULL`, el layout y el Server Action revocan la sesión de inmediato.

---

## 2. Jerarquía de Roles y Matriz de Permisos

| Capacidad | `SOLICITANTE` | `ADMIN_TI` | `SUPERADMIN` (Venllas) |
|---|:---:|:---:|:---:|
| Crear y consultar tickets propios | ✅ | ✅ | ✅ |
| Ver todos los tickets y notas internas | ❌ | ✅ | ✅ |
| Acceder al Taller (tarjetas, pipeline, BOM, bitácora) | ❌ | ✅ | ✅ |
| Publicar y editar artículos en la Base de Conocimiento | ❌ | ✅ | ✅ |
| Consultar registros de Auditoría | ❌ | ✅ | ✅ |
| Crear nuevos usuarios (`SOLICITANTE` o `ADMIN_TI`) | ❌ | ✅ | ✅ |
| Restablecer contraseñas de otros usuarios | ❌ | ❌ | ✅ |
| Activar o desactivar cuentas | ❌ | ❌ | ✅ |
| Auto-desactivarse | ❌ | ❌ | 🚫 Prohibido |

---

## 3. Superadmin Único (`venllas`)

El sistema implementa una restricción de superadmin único impuesta a nivel de base de datos:
```sql
create unique index profiles_single_superadmin on public.profiles (is_superadmin) where is_superadmin;
```
- Esto garantiza matemáticamente que jamás puedan existir dos registros con `is_superadmin = true`.
- Ninguna Server Action o formulario web tiene permitido asignar el flag `is_superadmin`. Dicha marca solo puede asignarse directamente vía SQL en el aprovisionamiento inicial.

---

## 4. Trazabilidad y Auditoría Append-Only

Toda mutación que ocurre sobre las tablas principales (`tickets`, `boards`, `kb_articles`, `profiles`) dispara el trigger `audit_row()`:
- Registra el `actor_id` (`auth.uid()`), la acción (`INSERT`, `UPDATE`, `DELETE`), la entidad, el `entity_id` y el diff en formato JSON:
  ```json
  {
    "before": { "status": "ABIERTO" },
    "after": { "status": "EN_PROGRESO" }
  }
  ```
- Para operaciones administrativas realizadas mediante `service_role` (donde `auth.uid()` es nulo en el trigger), los Server Actions en [src/actions/users.ts](file:///C:/Users/gorti/Desktop/System_Nexo/src/actions/users.ts) registran explícitamente al actor en `audit_logs`.
- La tabla de auditoría tiene revocado cualquier permiso de mutación para roles de aplicación:
  ```sql
  revoke update, delete, truncate on public.audit_logs from anon, authenticated;
  ```
