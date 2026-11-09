# Nexo TI — Guía de Puesta en Marcha

Sistema integral de mesa de ayuda y taller interno de tarjetas electrónicas para Cabelab.

---

## 1. Configuración de Base de Datos en Supabase

1. Accede a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Abre el **SQL Editor** y ejecuta el script de migración completo:
   - Archivo: `supabase/migrations/20261109000001_initial_schema.sql`
   - Esto creará las 10 tablas, tipos ENUM, triggers de auditoría, funciones atómicas (`create_board`, `advance_board_step`, `increment_view_count`) y todas las directivas de seguridad RLS.
3. Desactiva el registro público:
   - En **Authentication > Providers > Email**, asegúrate de que *Confirm email* esté activado y *Enable signup* desactivado.

---

## 2. Variables de Entorno (`.env.local`)

Edita el archivo `.env.local` en la raíz del proyecto y coloca los valores de tu proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-id-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

> **Aviso de Seguridad:** `SUPABASE_SERVICE_ROLE_KEY` está protegido por `server-only` y no se filtra al navegador ni al bundle compilado.

---

## 3. Creación del Superadmin Único (`venllas`)

1. En el Dashboard de Supabase, ve a **Authentication > Users** y crea el usuario:
   - Email: `venllas@cabelab.local`
   - Password: La contraseña que elijas para tu acceso
   - En **User Metadata** (opcional): `{"username": "venllas", "full_name": "Venllas Superadmin"}`
2. En el **SQL Editor**, ejecuta:
   ```sql
   UPDATE public.profiles
   SET role = 'ADMIN_TI', is_superadmin = true
   WHERE username = 'venllas';
   ```

---

## 4. Ejecución del Sistema

- **Modo Desarrollo:**
  ```bash
  npm run dev
  ```
  Accede a `http://localhost:3000` e inicia sesión con el usuario `venllas`.

- **Verificación de Tipos y Compilación:**
  ```bash
  npm run typecheck
  npm run build
  ```
