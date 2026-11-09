# 02 — Arquitectura y Base de Datos (Nexo TI, v2)

## 1. Principios

1. **Supabase es la única fuente de verdad:** datos, auth y RLS.
2. **La seguridad vive en la base de datos (RLS).** El código de la app es una conveniencia.
3. **Lectura en Server Components; escritura en Server Actions.** Sin route handlers en v1.
4. **Toda entrada se valida con Zod** antes de tocar Supabase.
5. **Operaciones multi-paso = función SQL** (atómica).
6. **Sin borrado físico** en entidades de negocio.
7. **Una sola empresa, solo español.** Sin multi-tenant ni i18n.

---

## 2. Estructura de carpetas

```
nexo-ti/
├── proxy.ts                         # Refresco de sesión y guardas (verificar convención de Next 16)
├── supabase/
│   ├── config.toml
│   ├── migrations/                  # Esquema, RLS, funciones, triggers
│   └── tests/                       # Pruebas SQL de RLS con dos usuarios
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Valida usuario y pasa perfil al cliente
│   │   │   ├── tickets/             # Lista, detalle, tablero por estado
│   │   │   ├── taller/              # Tarjetas, pipeline, BOM, bitácora
│   │   │   ├── kb/                  # Artículos
│   │   │   └── admin/auditoria/     # Solo ADMIN_TI
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts
│   │   │   ├── client.ts
│   │   │   ├── admin.ts             # service_role, solo servidor (server-only)
│   │   │   └── types.ts             # Generados con supabase gen types
│   │   ├── auth.ts                  # getCurrentProfile(), requireRole()
│   │   └── validators/              # Esquemas Zod por dominio
│   ├── actions/                     # Server Actions: tickets.ts, taller.ts, kb.ts, users.ts
│   └── components/                  # UI sin lógica de negocio
└── .env.local                       # URL, clave anon y SUPABASE_SERVICE_ROLE_KEY (solo servidor)
```

---

## 3. Autenticación por username

### Cómo funciona

1. El usuario escribe **username y contraseña** en `/login`.
2. El servidor construye el correo interno: `username@cabelab.local` (dominio a confirmar).
3. Llama a `signInWithPassword` con ese correo.
4. `proxy.ts` refresca la sesión en cada petición.
5. `(dashboard)/layout.tsx` valida con `getUser()` (nunca `getSession()`), consulta `profiles` y comprueba `is_active` y `deleted_at`.

### Gestión de usuarios

**Roles y permisos**

| Capacidad | SOLICITANTE | ADMIN_TI | SUPERADMIN (Venllas) |
|---|---|---|---|
| Crear y ver sus tickets | Sí | Sí | Sí |
| Gestionar tickets, taller, KB y auditoría | No | Sí | Sí |
| Crear usuarios de cualquier rol | No | Sí | Sí |
| Restablecer contraseñas | No | No | Sí |
| Activar o desactivar usuarios | No | No | Sí |
| Asignar `is_superadmin` | No | No | Nadie (solo SQL) |

- **Un único superadmin:** el usuario `venllas` (`role = 'ADMIN_TI'`, `is_superadmin = true`). Se crea desde el dashboard de Supabase y se marca por SQL. Un índice único impide que exista un segundo superadmin.
- **Admins creados por la app:** un `ADMIN_TI` puede crear otros `ADMIN_TI`, y esos también pueden crear usuarios. Restablecer contraseñas y desactivar cuentas siguen siendo exclusivos del superadmin.
- **Sin registro público.** El signup está desactivado en Supabase Auth.
- **Pantalla `/admin/usuarios`:** alta con username, nombre, rol (`SOLICITANTE` o `ADMIN_TI`) y contraseña temporal. Para el superadmin también aparecen las acciones de restablecer y desactivar.
- **Protección:** nadie puede desactivarse a sí mismo.
- **El superadmin no se asigna desde la app.** Ninguna Server Action puede escribir `is_superadmin`.

Los clientes no tienen permiso de escritura sobre `profiles`. Todos los cambios de rol y estado pasan por Server Actions que verifican el permiso antes de usar `service_role`.

```ts
// src/lib/supabase/admin.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Faltan variables de Supabase en el servidor');

export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

```ts
// src/actions/users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createUserSchema, setActiveSchema } from '@/lib/validators/users';
import type { ActionResult } from '@/lib/types';

const INTERNAL_DOMAIN = 'cabelab.local';

// Admins (y el superadmin) pueden crear usuarios de cualquier rol
export async function createUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') return { success: false, error: 'No autorizado' };

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Datos inválidos' };
  const { username, fullName, role, tempPassword } = parsed.data;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `${username}@${INTERNAL_DOMAIN}`,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { username, full_name: fullName },
  });
  if (error || !data.user) return { success: false, error: 'No se pudo crear el usuario' };

  // El trigger crea el perfil como SOLICITANTE. Si se pidió ADMIN_TI, se asigna el rol.
  if (role === 'ADMIN_TI') {
    const { error: roleError } = await supabaseAdmin
      .from('profiles').update({ role }).eq('id', data.user.id);
    if (roleError) return { success: false, error: 'Usuario creado, pero no se pudo asignar el rol' };
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: me.id,
    action: 'INSERT',
    entity: 'profiles',
    entity_id: data.user.id,
    diff: { created_by_admin: true, username, role },
  });

  revalidatePath('/admin/usuarios');
  return { success: true, data: { id: data.user.id } };
}

// Solo superadmin
export async function setUserActive(input: unknown): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (!me?.is_superadmin) return { success: false, error: 'No autorizado' };

  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Datos inválidos' };
  const { userId, active } = parsed.data;

  if (userId === me.id) {
    return { success: false, error: 'No puedes desactivarte a ti mismo' };
  }

  const { error } = await supabaseAdmin
    .from('profiles').update({ is_active: active }).eq('id', userId);
  if (error) return { success: false, error: 'No se pudo actualizar el usuario' };

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: me.id,
    action: 'UPDATE',
    entity: 'profiles',
    entity_id: userId,
    diff: { is_active: { after: active } },
  });

  revalidatePath('/admin/usuarios');
  return { success: true, data: null };
}

// resetUserPassword: solo superadmin, mismo patrón (Zod, auditoría, supabaseAdmin.auth.admin.updateUserById).
```

Nota de auditoría: las altas y cambios hechos con `service_role` no tienen `auth.uid()`, así que cada Server Action registra al actor de forma explícita. Un cambio hecho directamente desde el dashboard de Supabase no pasa por la app y debe revisarse de forma periódica.

> Verificar en Fase 1 que Supabase acepte el dominio elegido para correos. Si lo rechaza, se cambia por otro dominio ficticio sin afectar el resto del diseño.

### Tabla de perfiles y trigger

```sql
create type user_role as enum ('SOLICITANTE', 'ADMIN_TI');

create table profiles (
  id          uuid primary key references auth.users(id) on delete restrict,
  username    text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  full_name   text not null,
  role        user_role not null default 'SOLICITANTE',
  is_superadmin boolean not null default false,  -- control total; se asigna solo por SQL
  is_active   boolean not null default true,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Un único superadmin en todo el sistema
create unique index profiles_single_superadmin on profiles (is_superadmin) where is_superadmin;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
```

El rol nunca viene de metadatos del usuario, así no se puede auto-asignar `ADMIN_TI`.

---

## 4. Modelo de datos (9 tablas)

| Tabla | Propósito |
|---|---|
| `profiles` | Usuarios |
| `tickets` | Incidencias |
| `ticket_comments` | Hilo con `is_internal` |
| `boards` | Tarjetas electrónicas |
| `board_steps` | Historial de pasos del pipeline por tarjeta |
| `board_components` | BOM |
| `board_logs` | Bitácora |
| `board_serial_counters` | Correlativo anual `TRJ-{YYYY}-{NNN}` |
| `kb_articles` | Base de conocimiento |
| `audit_logs` | Auditoría append-only |

Son 10 tablas en total porque `board_serial_counters` cuenta como tabla de apoyo.

### Esquema

```sql
-- ===== Tickets =====
create type ticket_status as enum ('ABIERTO','EN_PROGRESO','EN_ESPERA','RESUELTO','CERRADO');
create type ticket_priority as enum ('BAJA','MEDIA','ALTA','CRITICA');

create table tickets (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id),
  assignee_id   uuid references profiles(id),
  title         text not null check (length(title) between 3 and 150),
  description   text not null,
  status        ticket_status not null default 'ABIERTO',
  priority      ticket_priority not null default 'MEDIA',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index tickets_requester_idx on tickets(requester_id);
create index tickets_status_idx on tickets(status) where deleted_at is null;

create table ticket_comments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id),
  author_id   uuid not null references profiles(id),
  body        text not null check (length(body) between 1 and 5000),
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);
create index ticket_comments_ticket_idx on ticket_comments(ticket_id);

-- ===== Taller =====
-- Estado general de la tarjeta
create type board_status as enum ('EN_LABORATORIO','EN_REPARACION','REPARADA','ENTREGADA');
-- Pipeline fijo. 'EN_LABORATORIO' es el estado inicial y no es un paso.
create type repair_step as enum ('DIAGNOSTICO','REPARACION','PRUEBAS','ENTREGA');
create type component_status as enum ('REQUERIDO','EN_STOCK','SOLICITADO','INSTALADO');
create type log_kind as enum ('NOTA_TECNICA','MEDICION','CAMBIO_ESTADO','ALERTA');

create table board_serial_counters (
  year        int primary key,
  last_number int not null default 0
);

create table boards (
  id           uuid primary key default gen_random_uuid(),
  serial       text not null unique,          -- TRJ-2026-001
  model        text not null,
  owner_name   text,
  status       board_status not null default 'EN_LABORATORIO',
  current_step repair_step,                   -- null mientras está EN_LABORATORIO
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table board_steps (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references boards(id),
  step         repair_step not null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (board_id, step)
);

create table board_components (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references boards(id),
  designator   text not null,                 -- R12, C45, U3
  part_number  text not null,
  package      text,
  status       component_status not null default 'REQUERIDO',
  unique (board_id, designator)
);

create table board_logs (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references boards(id),
  author_id   uuid not null references profiles(id),
  kind        log_kind not null,
  body        text not null,
  measurement jsonb,                          -- {"point":"TP3","value":3.3,"unit":"V"}
  created_at  timestamptz not null default now()
);

-- ===== Base de conocimiento =====
create table kb_articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  body_md      text not null,
  tags         text[] not null default '{}',
  is_published boolean not null default false,
  view_count   int not null default 0,
  author_id    uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ===== Auditoría (append-only) =====
create table audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id),
  action      text not null,                  -- INSERT | UPDATE | DELETE
  entity      text not null,
  entity_id   uuid,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs(entity, entity_id);
```

Nota: `ip_address` se eliminó del esquema porque PostgREST no expone de forma fiable la IP del cliente dentro de un trigger. Si se necesita, se evalúa en una fase posterior.

---

## 5. Seguridad: RLS

Todas las tablas de negocio tienen RLS activa. Sin política, Supabase no devuelve filas.

```sql
-- Rol del usuario actual. SECURITY DEFINER evita recursión de RLS.
create or replace function current_role_nexo()
returns user_role language sql stable security definer set search_path = ''
as $$
  select role from public.profiles
  where id = auth.uid() and is_active and deleted_at is null;
$$;

-- Superadmin: control total sobre usuarios
create or replace function current_is_superadmin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select is_superadmin from public.profiles
    where id = auth.uid() and is_active and deleted_at is null), false);
$$;

alter table profiles enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;
alter table boards enable row level security;
alter table board_steps enable row level security;
alter table board_components enable row level security;
alter table board_logs enable row level security;
alter table board_serial_counters enable row level security;
alter table kb_articles enable row level security;
alter table audit_logs enable row level security;

-- Perfiles: cada uno ve el suyo; el admin ve todos. Nadie escribe desde el cliente.
create policy profiles_select on profiles for select using (
  id = auth.uid() or current_role_nexo() = 'ADMIN_TI'
);

-- Tickets (anti-IDOR): el solicitante solo ve y crea los suyos
create policy tickets_select on tickets for select using (
  requester_id = auth.uid() or current_role_nexo() = 'ADMIN_TI'
);
create policy tickets_insert on tickets for insert with check (
  requester_id = auth.uid() and current_role_nexo() is not null
);
create policy tickets_update_admin on tickets for update
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');

-- Comentarios: las notas internas no las ve el solicitante
create policy comments_select on ticket_comments for select using (
  current_role_nexo() = 'ADMIN_TI'
  or (is_internal = false and exists (
        select 1 from tickets t where t.id = ticket_id and t.requester_id = auth.uid()))
);
create policy comments_insert on ticket_comments for insert with check (
  author_id = auth.uid()
  and (
    current_role_nexo() = 'ADMIN_TI'
    or (is_internal = false and exists (
          select 1 from tickets t where t.id = ticket_id and t.requester_id = auth.uid()))
  )
);

-- Taller: solo ADMIN_TI (el solicitante no ve tarjetas ni BOM)
create policy boards_admin on boards for all
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');
create policy board_steps_admin on board_steps for all
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');
create policy board_components_admin on board_components for all
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');
create policy board_logs_admin on board_logs for all
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');
create policy board_counters_admin on board_serial_counters for all
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');

-- Base de conocimiento: autenticados leen publicados; admin gestiona
create policy kb_select on kb_articles for select using (
  is_published = true or current_role_nexo() = 'ADMIN_TI'
);
create policy kb_admin_write on kb_articles for all
  using (current_role_nexo() = 'ADMIN_TI')
  with check (current_role_nexo() = 'ADMIN_TI');

-- Auditoría: solo lectura para admin. Sin políticas de escritura.
create policy audit_select_admin on audit_logs for select using (
  current_role_nexo() = 'ADMIN_TI'
);
```

**Prueba obligatoria:** en `supabase/tests/`, un script SQL con dos usuarios que verifique que un solicitante no lee ni actualiza tickets ajenos, no lee notas internas y no lee tarjetas.

---

## 6. Funciones atómicas

### Crear tarjeta con serial correlativo

```sql
create or replace function create_board(p_model text, p_owner text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_year int := extract(year from now())::int;
  v_n    int;
  v_id   uuid;
begin
  if current_role_nexo() is distinct from 'ADMIN_TI' then
    raise exception 'No autorizado';
  end if;

  -- Upsert atómico: no hay carreras entre dos altas simultáneas
  insert into public.board_serial_counters (year, last_number)
  values (v_year, 1)
  on conflict (year) do update
    set last_number = public.board_serial_counters.last_number + 1
  returning last_number into v_n;

  insert into public.boards (serial, model, owner_name, created_by)
  values ('TRJ-' || v_year || '-' || lpad(v_n::text, 3, '0'), p_model, p_owner, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;
```

### Avanzar pipeline

Orden fijo: `DIAGNOSTICO → REPARACION → PRUEBAS → ENTREGA`.

| Paso completado | Nuevo `current_step` | Nuevo `status` |
|---|---|---|
| (ninguno) | DIAGNOSTICO | EN_REPARACION |
| DIAGNOSTICO | REPARACION | EN_REPARACION |
| REPARACION | PRUEBAS | EN_REPARACION |
| PRUEBAS | ENTREGA | REPARADA |
| ENTREGA | — | ENTREGADA |

```sql
create or replace function advance_board_step(p_board_id uuid, p_note text)
returns board_status language plpgsql security definer set search_path = ''
as $$
declare
  v_current repair_step;
  v_status  board_status;
  v_next    repair_step;
begin
  if current_role_nexo() is distinct from 'ADMIN_TI' then
    raise exception 'No autorizado';
  end if;

  -- Bloqueo de fila: dos avances simultáneos producen exactamente uno
  select current_step into v_current
  from public.boards
  where id = p_board_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Tarjeta no encontrada';
  end if;

  if v_current = 'ENTREGA' then
    update public.board_steps set completed_at = now()
      where board_id = p_board_id and step = 'ENTREGA';
    update public.boards set status = 'ENTREGADA' where id = p_board_id
      returning status into v_status;
    insert into public.board_logs (board_id, author_id, kind, body)
      values (p_board_id, auth.uid(), 'CAMBIO_ESTADO', coalesce(p_note, 'Entregada'));
    return v_status;
  end if;

  v_next := case v_current
    when null           then 'DIAGNOSTICO'::repair_step
    when 'DIAGNOSTICO'  then 'REPARACION'::repair_step
    when 'REPARACION'   then 'PRUEBAS'::repair_step
    when 'PRUEBAS'      then 'ENTREGA'::repair_step
  end;

  if v_current is not null then
    update public.board_steps set completed_at = now()
      where board_id = p_board_id and step = v_current;
  end if;

  insert into public.board_steps (board_id, step) values (p_board_id, v_next);

  v_status := case v_next
    when 'ENTREGA' then 'REPARADA'::board_status
    else 'EN_REPARACION'::board_status
  end;

  update public.boards
    set current_step = v_next, status = v_status
    where id = p_board_id;

  insert into public.board_logs (board_id, author_id, kind, body)
    values (p_board_id, auth.uid(), 'CAMBIO_ESTADO', coalesce(p_note, 'Avance a ' || v_next));

  return v_status;
end;
$$;
```

Nota: `security definer` con `search_path = ''` y la comprobación de rol al inicio. Las pruebas de concurrencia de la Fase 3 deben confirmar que el `for update` funciona como se espera.

### Incremento atómico de vistas

```sql
create or replace function increment_view_count(p_article_id uuid)
returns void language sql security definer set search_path = ''
as $$
  update public.kb_articles set view_count = view_count + 1
  where id = p_article_id and is_published = true;
$$;
```

---

## 7. Auditoría automática

```sql
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, diff)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    (to_jsonb(coalesce(NEW, OLD)) ->> 'id')::uuid,
    jsonb_build_object(
      'before', case when TG_OP <> 'INSERT' then to_jsonb(OLD) end,
      'after',  case when TG_OP <> 'DELETE' then to_jsonb(NEW) end
    )
  );
  return coalesce(NEW, OLD);
end;
$$;

create trigger tickets_audit after insert or update or delete on tickets
  for each row execute function audit_row();
create trigger boards_audit after insert or update or delete on boards
  for each row execute function audit_row();
create trigger kb_audit after insert or update or delete on kb_articles
  for each row execute function audit_row();
create trigger profiles_audit after insert or update or delete on profiles
  for each row execute function audit_row();

-- Inmutabilidad: nadie escribe ni borra auditoría desde la API
revoke update, delete, truncate on audit_logs from anon, authenticated;
```

El trigger usa `TG_OP` directamente, así que la acción registrada es `INSERT`, `UPDATE` o `DELETE`. Los cambios de estado se identifican en el diff.

---

## 8. Contrato de Server Actions

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

Cada acción:
1. Valida la entrada con Zod (`safeParse`).
2. Obtiene el perfil con `getCurrentProfile()`.
3. Ejecuta con supabase-js (RLS aplica) o con una función RPC.
4. Llama a `revalidatePath` sobre la ruta afectada.
5. Devuelve `ActionResult<T>`.

Lecturas: en Server Components. Sin API REST separada.

---

## 9. Operación

- Índices en claves foráneas y columnas de filtro.
- Paginación por cursor en listas de tickets y auditoría.
- `select` con columnas explícitas, nunca `select('*')`.
- Cambios de esquema solo por migraciones (`supabase db push`).
- Variables de entorno: URL y clave `anon` en el cliente. `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor, nunca con prefijo `NEXT_PUBLIC_`.
