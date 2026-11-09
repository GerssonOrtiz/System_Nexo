# 05 — Despliegue y Operaciones

Información operativa para mantenimiento, despliegue y administración de entornos de producción y desarrollo.

---

## 1. Entornos y URLs Oficiales

- **Producción (Vercel):** [https://system-nexo.vercel.app](https://system-nexo.vercel.app)
- **Deployment URL:** [https://system-nexo-6yy88mdzj-venllas-projects.vercel.app](https://system-nexo-6yy88mdzj-venllas-projects.vercel.app)
- **Repositorio GitHub:** `https://github.com/GerssonOrtiz/System_Nexo`
- **Dashboard de Vercel:** [https://vercel.com/venllas-projects/system-nexo](https://vercel.com/venllas-projects/system-nexo)

---

## 2. Variables de Entorno

Tanto en `.env.local` como en la configuración de proyectos de Vercel, se requieren 3 variables:

```env
# URL de la instancia de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co

# Clave pública anónima para solicitudes de cliente y SSR con RLS
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

# Clave privada service_role (NUNCA EXPONER EN CLIENTE NI COMMITEAR)
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

---

## 3. Comandos Útiles

- **Iniciar servidor de desarrollo local:**
  ```bash
  npm run dev
  ```
- **Verificación estricta de TypeScript:**
  ```bash
  npm run typecheck
  ```
- **Compilación de producción local:**
  ```bash
  npm run build
  ```
- **Desplegar a producción vía Vercel CLI:**
  ```bash
  npx vercel --prod
  ```
- **Aprovisionar o restablecer Superadmin (`venllas`):**
  ```bash
  node scripts/create-superadmin.mjs "NuevaContraseña123!"
  ```

---

## 4. Script de Aprovisionamiento (`scripts/create-superadmin.mjs`)
Este script se conecta de forma segura con `SUPABASE_SERVICE_ROLE_KEY`:
1. Crea el usuario `venllas@cabelab.local` con confirmación inmediata de correo en Supabase Auth (o actualiza su contraseña si ya existía).
2. Inserta o actualiza el registro en `public.profiles` garantizando:
   - `role = 'ADMIN_TI'`
   - `is_superadmin = true`
   - `is_active = true`
