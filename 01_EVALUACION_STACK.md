# 01 — Evaluación del Stack (Nexo TI, versión simple)

## Veredicto

El stack propuesto es **funcional pero sobredimensionado** para una mesa de ayuda y un taller interno. Tiene varias librerías que resuelven problemas que todavía no existen (Realtime, SWR, Radix, RHF, Resend, XLSX). La recomendación es un núcleo pequeño, con Supabase como única fuente de verdad: base de datos, autenticación, seguridad (RLS) y almacenamiento de archivos.

Principio rector: **cada dependencia debe justificar su existencia con un requisito concreto de v1.**

---

## Decisiones por tecnología

| Tecnología | Versión propuesta | Decisión | Motivo |
|---|---|---|---|
| Next.js (App Router) | 16.2.7 | **Mantener** | Full-stack unificado, Server Components y Server Actions cubren lectura y escritura sin API separada. Fijar versión exacta (sin `^`). Verificar en la documentación oficial la convención actual del archivo de intercepción de rutas (en Next 16 se documenta como `proxy.ts`). |
| React / React DOM | 19.2.4 | **Mantener** | Versión estable que acompaña a Next. Fijar exacta. |
| TypeScript | ^5 (strict) | **Mantener** | Tipado estricto. Usar `strict: true` y `noUncheckedIndexedAccess: true`. |
| PostgreSQL (Supabase) | — | **Mantener, núcleo** | Relacional, RLS, funciones y triggers. Reemplaza a Prisma como fuente de verdad. |
| Supabase CLI | — | **Añadir** | Migraciones SQL versionadas en `supabase/migrations/`. Reemplaza el flujo `prisma migrate`. |
| `@supabase/supabase-js` | — | **Añadir** | Cliente de datos tipado. Tipos generados con `supabase gen types typescript`. |
| `@supabase/ssr` | ^0.10.3 | **Mantener** | Sesión en cookies HttpOnly. Imprescindible para SSR seguro. |
| Autenticación por username | — | **⚠️ Pendiente (ver preguntas)** | Supabase Auth está pensado para email. Login por username requiere un mapeo (ver `02_ARQUITECTURA`). |
| Supabase Realtime | ^2.107.0 | **Posponer** | Solo justificado si la Pizarra necesita ver cambios en vivo entre varios usuarios. Para v1, revalidar al navegar o un refresco manual basta. |
| SWR | ^2.4.1 | **Eliminar** | Con Server Components y Server Actions, `revalidatePath` y `router.refresh()` cubren el caso. Una capa de caché de cliente duplica estado. |
| Tailwind CSS | ^3.4.19 | **Mantener** | Estable y bien conocido. Migrar a v4 no aporta valor a este proyecto. Fijar versión. |
| PostCSS / Autoprefixer | 8.5.15 / 10.5.0 | **No listar explícitamente** | Vienen con la plantilla de Next + Tailwind. Añadirlos a mano genera configuraciones duplicadas. |
| Lucide React | ^1.18.0 | **Mantener** | Iconos ligeros y tree-shakeables. |
| Zod | ^4.4.3 | **Mantener** | Validación en el borde de cada Server Action y de cada formulario. |
| React Hook Form | ^7.72.1 | **Eliminar en v1** | Con formularios pequeños, un `<form action={serverAction}>` con `useActionState` y validación Zod es suficiente. Añadirlo solo si un formulario gana mucha complejidad. |
| Sonner | ^2.0.7 | **Mantener** | Notificaciones de un solo archivo, poco peso. |
| qrcode.react | ^4.2.0 | **Posponer a Fase 5** | Es una funcionalidad del roadmap, no del núcleo. |
| Resend | ^6.12.4 | **Eliminar en v1** | Solo si hay requisito explícito de correo. Si se necesita después, Supabase puede enviar correos de autenticación y se añade una integración puntual. |
| XLSX (SheetJS) | ^0.18.5 | **Reemplazar** | Versiones anteriores a 0.20.x tienen advisories de seguridad publicados (prototype pollution y ReDoS) en el registro de npm. Para exportar, **CSV** cubre la necesidad sin dependencia. Si se exige `.xlsx`, evaluar una alternativa mantenida. |
| Radix UI | — | **Eliminar en v1** | Usar elementos nativos accesibles (`<dialog>`, `<select>`, `<details>`) y estilos propios. Añadir un paquete Radix concreto solo cuando un componente lo requiera (por ejemplo, un Dropdown con navegación compleja). |
| Prisma | — | **Eliminado** (solicitado) | Sustituido por supabase-js tipado, migraciones SQL, RLS y funciones PL/pgSQL para operaciones transaccionales. |

---

## Stack mínimo resultante

**Runtime y framework**
- Next.js (versión exacta fijada), React, React DOM, TypeScript

**Datos y seguridad**
- `@supabase/supabase-js`, `@supabase/ssr`, Supabase CLI (dev)

**Validación y UI**
- Zod, Tailwind CSS, Lucide React, Sonner

**Diferido (solo si hay requisito)**
- qrcode.react (Fase 5), exportación Excel (evaluar), correo transaccional (evaluar), Realtime (evaluar), Radix (puntual)

Esto pasa de **15 dependencias de producción a 8**, con un impacto directo en superficie de ataque, tiempo de build y mantenimiento.

---

## Riesgos identificados en el planteamiento original

1. **Seguridad anti-IDOR en la aplicación, no en la base de datos.** Sin Prisma, la barrera principal debe ser **RLS (Row Level Security)**. Si solo se filtra en el código, cualquier cliente con la clave pública puede leer datos ajenos. Las políticas RLS son obligatorias en cada tabla.
2. **La `service_role` key nunca debe llegar al navegador ni usarse en código de cliente.** Su uso debe limitarse a tareas administrativas servidor-side controladas.
3. **Versiones con rango `^`.** Para un sistema de misión crítica conviene fijar versiones exactas y commitear el lockfile.
4. **Transacciones.** Donde antes había `prisma.$transaction`, ahora se usan **funciones PL/pgSQL** llamadas por RPC. Esto es más seguro, porque la lógica queda en la base y no depende de la red entre pasos.
5. **Auditoría.** Se implementa con **triggers** en PostgreSQL y con permisos que impiden `UPDATE` y `DELETE` sobre la tabla de auditoría. Así la inmutabilidad se aplica en la base de datos y no solo por convención.
6. **Realtime y SWR a la vez.** Son dos mecanismos de sincronización distintos. Mantener solo uno evita condiciones de carrera difíciles de depurar.

---

## Versiones: nota de verificación

Las versiones listadas en el stack original (Next 16.2.7, React 19.2.4, Zod 4.4.3, etc.) deben confirmarse en el registro de npm en el momento de la instalación. Antes de fijarlas, revisar también las notas de migración oficiales de cada una, sobre todo en Next y Zod, donde hubo cambios de API entre mayores.

---

## Decisiones confirmadas (v2)

| Tema | Decisión |
|---|---|
| Login | Por username. Internamente se usa un correo ficticio (`usuario@cabelab.local`, dominio a confirmar). Sin recuperación por correo: el admin restablece contraseñas. |
| Correo transaccional | Eliminado (Resend fuera del proyecto). |
| Exportación | No se implementa (ni CSV ni Excel). XLSX eliminado. |
| Realtime | Opcional, fuera de v1. |
| Kanban | Cambio de estado mediante menú o botones. Sin drag-and-drop. |
| Pipeline | Fijo: Diagnóstico, Reparación, Pruebas, Entrega. |
| Adjuntos | Sin Supabase Storage. |
| Organización | Una sola empresa. Sin multi-tenant. |
| Migración | Ninguna; proyecto desde cero. |
| Idioma | Solo español (sin i18n). |

Stack final: Next.js, React, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, Tailwind CSS, Zod, Lucide React, Sonner. Opcional en fase 5: qrcode.react.

## Actualización de decisiones (v3)

| Tema | Decisión |
|---|---|
| Estado inicial de tarjeta | `EN_LABORATORIO` (reemplaza a `RECIBIDA`) |
| Alta de usuarios | Desde la app, por el admin. Server Action con `SUPABASE_SERVICE_ROLE_KEY`, solo servidor |
| Paquete nuevo | `server-only`, para impedir que el cliente admin llegue al navegador |

Con este cambio, la `service_role` key sí entra en el proyecto. Su uso queda limitado a dos Server Actions de administración, y el riesgo se controla con `server-only`, la verificación de rol antes de cada llamada y una prueba de bundle en la Fase 1.

## Actualización de decisiones (v4)

| Tema | Decisión |
|---|---|
| Dominio interno | `cabelab.local` (verificar que Supabase lo acepte en Fase 1; `.local` es un TLD reservado, así que puede requerir otro dominio) |
| Permisos de admin | Existe un superadmin (`is_superadmin = true`), que se asigna solo por SQL. Solo el superadmin crea usuarios, promueve admins, restablece contraseñas y activa o desactiva cuentas |
| Protecciones | Nadie se desactiva a sí mismo y siempre queda al menos un superadmin activo |

## Actualización de decisiones (v5)

| Tema | Decisión |
|---|---|
| Superadmin | Único: `venllas`. Índice único en base de datos impide un segundo |
| Creación de usuarios | `ADMIN_TI` y superadmin pueden crear usuarios de cualquier rol |
| Restablecer contraseña y activar o desactivar | Solo superadmin (supuesto a confirmar) |
