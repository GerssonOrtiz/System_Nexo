# Vault Nexo TI — Índice y Visión General

Bienvenido a la base de conocimiento y contexto técnico persistente del sistema **Nexo TI**.
Este repositorio contiene la arquitectura, modelos de datos, flujos de seguridad, contratos de Server Actions y procedimientos operativos para que cualquier agente o desarrollador en futuras sesiones comprenda el sistema en su totalidad.

---

## Índice del Vault

1. [01_ARQUITECTURA_Y_STACK.md](./01_ARQUITECTURA_Y_STACK.md): Stack tecnológico, App Router, principios de diseño y aislamiento de credenciales.
2. [02_BASE_DE_DATOS_Y_RLS.md](./02_BASE_DE_DATOS_Y_RLS.md): Esquema de 10 tablas, tipos ENUM, triggers, funciones atómicas RPC y directivas de seguridad RLS.
3. [03_MODULOS_Y_RUTAS.md](./03_MODULOS_Y_RUTAS.md): Descripción de cada pantalla (Mesa de ayuda, Taller, KB, Auditoría, Gestión de Usuarios).
4. [04_SEGURIDAD_AUTH_Y_ROLES.md](./04_SEGURIDAD_AUTH_Y_ROLES.md): Flujo de autenticación por username interno (`@cabelab.local`), RBAC, superadmin único (`venllas`) y auditoría append-only.
5. [05_DESPLIEGUE_Y_OPERACIONES.md](./05_DESPLIEGUE_Y_OPERACIONES.md): Entorno Vercel, Supabase en la nube, scripts de mantenimiento (`create-superadmin.mjs`) y variables de entorno.

---

## Principio Rector de Nexo TI
- **Supabase es la única fuente de verdad:** Base de datos, autenticación, RLS y almacenamiento.
- **La seguridad vive en la base de datos (RLS):** El código frontend es solo conveniencia. Sin política RLS, ninguna fila es visible ni modificable.
- **`server-only` innegociable:** La clave `SUPABASE_SERVICE_ROLE_KEY` jamás se expone al cliente ni se compila en el bundle estático.
- **Sin borrado físico:** Solo borrado lógico mediante `deleted_at`.
- **Operaciones multi-paso atómicas:** Funciones PL/pgSQL llamadas vía RPC con bloqueo de fila (`FOR UPDATE`).
