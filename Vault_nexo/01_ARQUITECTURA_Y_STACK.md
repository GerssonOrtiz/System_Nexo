# 01 — Arquitectura y Stack Tecnológico

## 1. Stack Tecnológico

| Capa | Tecnología | Versión | Rol / Justificación |
|---|---|---|---|
| **Framework Full-Stack** | Next.js (App Router, Turbopack) | `16.4.5` | SSR, Server Components (lecturas) y Server Actions (mutaciones). Sin API REST separada. |
| **Biblioteca de UI** | React / React DOM | `19.3.1` | Motor de renderizado reactivo compatible con React Compiler y Server Actions. |
| **Lenguaje** | TypeScript | `5.9.3` | Tipado estricto con `strict: true` y `noUncheckedIndexedAccess: true`. |
| **Base de Datos & Auth** | Supabase (PostgreSQL 15+) | Cloud | Fuente única de verdad, RLS, Auth, Triggers y funciones RPC. |
| **Clientes de Datos** | `@supabase/supabase-js`<br>`@supabase/ssr` | `2.119.0`<br>`0.12.7` | Cliente tipado y gestión segura de cookies HttpOnly en SSR. |
| **Seguridad de Servidor** | `server-only` | `0.0.1` | Garantiza que `supabaseAdmin` y `SUPABASE_SERVICE_ROLE_KEY` jamás se empaqueten en el bundle del cliente. |
| **Validación de Datos** | Zod | `4.6.7` | Validación en el borde de cada Server Action y formulario. |
| **Estilos & Iconos** | Tailwind CSS<br>Lucide React | `3.4.19`<br>`1.70.0` | Estilizado utilitario dark mode y set de iconos SVG ligeros. |
| **Notificaciones** | Sonner | `2.0.8` | Toasts enriquecidos para notificaciones de mutaciones. |

---

## 2. Estructura del Proyecto

```
System_Nexo/
├── Vault_nexo/                      # Documentación y contexto persistente del sistema
├── supabase/
│   ├── migrations/                  # Migración SQL versionada e idempotente (20261109000001_initial_schema.sql)
│   └── tests/                       # Scripts de verificación RLS
├── scripts/
│   └── create-superadmin.mjs        # Script de aprovisionamiento de superadmin
├── src/
│   ├── middleware.ts                # Refresco de sesión Supabase SSR y guardas de redirección
│   ├── actions/                     # Server Actions con validación Zod
│   │   ├── users.ts                 # Auth, login, logout, alta de usuarios, reset password, toggle active
│   │   ├── tickets.ts               # Crear ticket, actualizar estado, notas internas
│   │   ├── taller.ts                # createBoard (RPC), advanceBoardStep (RPC), BOM, bitácora
│   │   └── kb.ts                    # Artículos de conocimiento y view_count
│   ├── lib/
│   │   ├── types.ts                 # ActionResult<T>
│   │   ├── utils.ts                 # cn, formatDate
│   │   ├── auth.ts                  # getCurrentProfile(), requireAuth(), requireRole(), requireSuperadmin()
│   │   ├── supabase/
│   │   │   ├── types.ts             # Esquema TypeScript manual 100% tipado con Database
│   │   │   ├── server.ts            # Cliente SSR para Server Components y Actions
│   │   │   ├── client.ts            # Cliente Browser
│   │   │   └── admin.ts             # Cliente service_role exclusivo (server-only)
│   │   └── validators/              # Esquemas Zod por módulo (users, tickets, taller, kb)
│   ├── components/                  # Componentes compartidos (SidebarNav, etc.)
│   └── app/
│       ├── layout.tsx               # RootLayout con Sonner Toaster
│       ├── page.tsx                 # Redirección a /tickets
│       ├── login/page.tsx           # Formulario de login por username
│       └── (dashboard)/             # Rutas protegidas con layout persistente
│           ├── layout.tsx           # Verificación de perfil activo y render de navegación
│           ├── tickets/             # Listado, nuevo ticket y detalle con comentarios
│           ├── taller/              # Listado de tarjetas, nuevo ingreso y ficha con stepper, BOM y bitácora
│           ├── kb/                  # Base de conocimiento y visor Markdown
│           └── admin/               # Módulos exclusivos ADMIN_TI (usuarios y auditoría)
├── .env.local                       # Variables locales (ignorado en git)
├── .env.example                     # Plantilla de variables de entorno
└── AGENTS.md                        # Instrucciones y reglas de contexto para agentes AI
```

---

## 3. Patrón de Comunicación y Flujo de Datos

1. **Lecturas:** Se realizan directamente en **Server Components** llamando a `createClient()` de `@supabase/ssr`. Esto permite que PostgreSQL aplique directamente el Row Level Security (RLS) basado en la sesión del usuario en cookies.
2. **Mutaciones:** Se ejecutan a través de **Server Actions** (`'use server'`).
   - Cada acción recibe `input: unknown`.
   - Valida el payload con Zod (`safeParse`).
   - Verifica la identidad y permisos con `getCurrentProfile()`.
   - Ejecuta la operación mediante `supabase-js` (respetando RLS) o mediante funciones RPC atómicas.
   - Llama a `revalidatePath` para invalidar la caché del App Router.
   - Retorna un objeto `ActionResult<T>` estructurado:
     ```ts
     type ActionResult<T> =
       | { success: true; data: T }
       | { success: false; error: string };
     ```
