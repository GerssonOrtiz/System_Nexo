-- Script de verificación de RLS y funciones para Nexo TI
-- Ejecutar en el SQL Editor de Supabase después de aplicar la migración

-- 1. Verificar existencia de las 10 tablas
select table_name from information_schema.tables 
where table_schema = 'public' and table_name in (
  'profiles', 'board_serial_counters', 'boards', 'board_steps', 
  'board_components', 'board_logs', 'tickets', 'ticket_comments', 
  'kb_articles', 'audit_logs'
);

-- 2. Verificar que RLS esté activo en todas las tablas
select relname, relrowsecurity 
from pg_class 
where relname in (
  'profiles', 'board_serial_counters', 'boards', 'board_steps', 
  'board_components', 'board_logs', 'tickets', 'ticket_comments', 
  'kb_articles', 'audit_logs'
);

-- 3. Asignación inicial de SUPERADMIN para venllas:
-- (Ejecutar esto una vez creado el usuario en el dashboard de Supabase Auth)
-- UPDATE public.profiles 
-- SET role = 'ADMIN_TI', is_superadmin = true 
-- WHERE username = 'venllas';
