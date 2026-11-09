-- Migración 00001: Esquema base, funciones, triggers y RLS para Nexo TI (Idempotente y Robusto)
-- Cumple estrictamente con 02_ARQUITECTURA_Y_BASE_DE_DATOS.md

-- ============================================================================
-- 1. TIPOS Y ENUMS (en esquema public)
-- ============================================================================
do $$ begin
  create type public.user_role as enum ('SOLICITANTE', 'ADMIN_TI');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ticket_status as enum ('ABIERTO', 'EN_PROGRESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ticket_priority as enum ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.board_status as enum ('EN_LABORATORIO', 'EN_REPARACION', 'REPARADA', 'ENTREGADA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_step as enum ('DIAGNOSTICO', 'REPARACION', 'PRUEBAS', 'ENTREGA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.component_status as enum ('REQUERIDO', 'EN_STOCK', 'SOLICITADO', 'INSTALADO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.log_kind as enum ('NOTA_TECNICA', 'MEDICION', 'CAMBIO_ESTADO', 'ALERTA');
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- 2. TABLAS NÚCLEO
-- ============================================================================

-- Perfiles vinculados a auth.users
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete restrict,
  username      text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  full_name     text not null,
  role          public.user_role not null default 'SOLICITANTE',
  is_superadmin boolean not null default false,
  is_active     boolean not null default true,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- Un único superadmin en todo el sistema
create unique index if not exists profiles_single_superadmin on public.profiles (is_superadmin) where is_superadmin;

-- Contador anual para seriales de tarjetas
create table if not exists public.board_serial_counters (
  year        int primary key,
  last_number int not null default 0
);

-- Tarjetas electrónicas
create table if not exists public.boards (
  id           uuid primary key default gen_random_uuid(),
  serial       text not null unique,
  model        text not null,
  owner_name   text,
  status       public.board_status not null default 'EN_LABORATORIO',
  current_step public.repair_step,
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- Pasos del pipeline
create table if not exists public.board_steps (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references public.boards(id),
  step         public.repair_step not null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (board_id, step)
);

-- BOM (Componentes de tarjeta)
create table if not exists public.board_components (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references public.boards(id),
  designator   text not null,
  part_number  text not null,
  package      text,
  status       public.component_status not null default 'REQUERIDO',
  unique (board_id, designator)
);

-- Bitácora de laboratorio
create table if not exists public.board_logs (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id),
  author_id   uuid not null references public.profiles(id),
  kind        public.log_kind not null,
  body        text not null,
  measurement jsonb,
  created_at  timestamptz not null default now()
);

-- Tickets de mesa de ayuda
create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id),
  assignee_id   uuid references public.profiles(id),
  title         text not null check (length(title) between 3 and 150),
  description   text not null,
  status        public.ticket_status not null default 'ABIERTO',
  priority      public.ticket_priority not null default 'MEDIA',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists tickets_requester_idx on public.tickets(requester_id);
create index if not exists tickets_status_idx on public.tickets(status) where deleted_at is null;

-- Comentarios e historial de tickets
create table if not exists public.ticket_comments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id),
  author_id   uuid not null references public.profiles(id),
  body        text not null check (length(body) between 1 and 5000),
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists ticket_comments_ticket_idx on public.ticket_comments(ticket_id);

-- Base de conocimiento (KB)
create table if not exists public.kb_articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  body_md      text not null,
  tags         text[] not null default '{}',
  is_published boolean not null default false,
  view_count   int not null default 0,
  author_id    uuid not null references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auditoría inmutable (append-only)
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity, entity_id);

-- ============================================================================
-- 3. FUNCIONES DE SEGURIDAD (SECURITY DEFINER)
-- ============================================================================

-- Rol del usuario actual
create or replace function public.current_role_nexo()
returns public.user_role language sql stable security definer set search_path = public, pg_temp
as $$
  select role from public.profiles
  where id = auth.uid() and is_active and deleted_at is null;
$$;

-- Verificación de superadmin
create or replace function public.current_is_superadmin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce((select is_superadmin from public.profiles
    where id = auth.uid() and is_active and deleted_at is null), false);
$$;

-- Trigger para creación automática de perfil desde auth.users
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger de auditoría automática
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp
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

drop trigger if exists tickets_audit on public.tickets;
create trigger tickets_audit after insert or update or delete on public.tickets
  for each row execute function public.audit_row();

drop trigger if exists boards_audit on public.boards;
create trigger boards_audit after insert or update or delete on public.boards
  for each row execute function public.audit_row();

drop trigger if exists kb_audit on public.kb_articles;
create trigger kb_audit after insert or update or delete on public.kb_articles
  for each row execute function public.audit_row();

drop trigger if exists profiles_audit on public.profiles;
create trigger profiles_audit after insert or update or delete on public.profiles
  for each row execute function public.audit_row();

-- ============================================================================
-- 4. FUNCIONES DE NEGOCIO ATÓMICAS (RPC)
-- ============================================================================

-- Crear tarjeta con correlativo anual único TRJ-{YYYY}-{NNN}
create or replace function public.create_board(p_model text, p_owner text)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_year int := extract(year from now())::int;
  v_n    int;
  v_id   uuid;
begin
  if public.current_role_nexo() is distinct from 'ADMIN_TI' then
    raise exception 'No autorizado';
  end if;

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

-- Avanzar pipeline de taller
create or replace function public.advance_board_step(p_board_id uuid, p_note text default null)
returns public.board_status language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_current public.repair_step;
  v_status  public.board_status;
  v_next    public.repair_step;
begin
  if public.current_role_nexo() is distinct from 'ADMIN_TI' then
    raise exception 'No autorizado';
  end if;

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
    update public.boards set status = 'ENTREGADA', current_step = null where id = p_board_id
      returning status into v_status;
    insert into public.board_logs (board_id, author_id, kind, body)
      values (p_board_id, auth.uid(), 'CAMBIO_ESTADO', coalesce(p_note, 'Entregada'));
    return v_status;
  end if;

  v_next := case v_current
    when null           then 'DIAGNOSTICO'::public.repair_step
    when 'DIAGNOSTICO'  then 'REPARACION'::public.repair_step
    when 'REPARACION'   then 'PRUEBAS'::public.repair_step
    when 'PRUEBAS'      then 'ENTREGA'::public.repair_step
  end;

  if v_current is not null then
    update public.board_steps set completed_at = now()
      where board_id = p_board_id and step = v_current;
  end if;

  insert into public.board_steps (board_id, step) values (p_board_id, v_next);

  v_status := case v_next
    when 'ENTREGA' then 'REPARADA'::public.board_status
    else 'EN_REPARACION'::public.board_status
  end;

  update public.boards
    set current_step = v_next, status = v_status
    where id = p_board_id;

  insert into public.board_logs (board_id, author_id, kind, body)
    values (p_board_id, auth.uid(), 'CAMBIO_ESTADO', coalesce(p_note, 'Avance a ' || v_next));

  return v_status;
end;
$$;

-- Incremento atómico de vistas de KB
create or replace function public.increment_view_count(p_article_id uuid)
returns void language sql security definer set search_path = public, pg_temp
as $$
  update public.kb_articles set view_count = view_count + 1
  where id = p_article_id and is_published = true;
$$;

-- ============================================================================
-- 5. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.boards enable row level security;
alter table public.board_steps enable row level security;
alter table public.board_components enable row level security;
alter table public.board_logs enable row level security;
alter table public.board_serial_counters enable row level security;
alter table public.kb_articles enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.current_role_nexo() = 'ADMIN_TI'
);

-- Tickets (Anti-IDOR)
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets for select using (
  requester_id = auth.uid() or public.current_role_nexo() = 'ADMIN_TI'
);

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert with check (
  requester_id = auth.uid() and public.current_role_nexo() is not null
);

drop policy if exists tickets_update_admin on public.tickets;
create policy tickets_update_admin on public.tickets for update
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

-- Comentarios (Notas internas restringidas)
drop policy if exists comments_select on public.ticket_comments;
create policy comments_select on public.ticket_comments for select using (
  public.current_role_nexo() = 'ADMIN_TI'
  or (is_internal = false and exists (
        select 1 from public.tickets t where t.id = ticket_id and t.requester_id = auth.uid()))
);

drop policy if exists comments_insert on public.ticket_comments;
create policy comments_insert on public.ticket_comments for insert with check (
  author_id = auth.uid()
  and (
    public.current_role_nexo() = 'ADMIN_TI'
    or (is_internal = false and exists (
          select 1 from public.tickets t where t.id = ticket_id and t.requester_id = auth.uid()))
  )
);

-- Taller (Acceso exclusivo a ADMIN_TI)
drop policy if exists boards_admin on public.boards;
create policy boards_admin on public.boards for all
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

drop policy if exists board_steps_admin on public.board_steps;
create policy board_steps_admin on public.board_steps for all
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

drop policy if exists board_components_admin on public.board_components;
create policy board_components_admin on public.board_components for all
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

drop policy if exists board_logs_admin on public.board_logs;
create policy board_logs_admin on public.board_logs for all
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

drop policy if exists board_counters_admin on public.board_serial_counters;
create policy board_counters_admin on public.board_serial_counters for all
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

-- KB
drop policy if exists kb_select on public.kb_articles;
create policy kb_select on public.kb_articles for select using (
  is_published = true or public.current_role_nexo() = 'ADMIN_TI'
);

drop policy if exists kb_admin_write on public.kb_articles;
create policy kb_admin_write on public.kb_articles for all
  using (public.current_role_nexo() = 'ADMIN_TI')
  with check (public.current_role_nexo() = 'ADMIN_TI');

-- Auditoría: Solo lectura para ADMIN_TI. Sin mutación alguna
drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs for select using (
  public.current_role_nexo() = 'ADMIN_TI'
);

revoke update, delete, truncate on public.audit_logs from anon, authenticated;
