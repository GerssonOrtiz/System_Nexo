<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# INSTRUCCIONES CRÍTICAS PARA AGENTES — REPOSITORIO NEXO TI

> [!IMPORTANT]
> **REGLA DE ORO DE INICIO DE SESIÓN:**
> Al iniciar cualquier sesión o tarea en este repositorio, el agente **DEBE LEER PRIMERO** el directorio `Vault_nexo/` para cargar el contexto técnico, arquitectura, reglas de seguridad y contratos de base de datos antes de responder o modificar código.

## Contexto del Proyecto (`Vault_nexo/`)
Consulta obligatoria según el área de trabajo:
- **Visión general y directrices clave:** [`Vault_nexo/README.md`](file:///C:/Users/gorti/Desktop/System_Nexo/Vault_nexo/README.md)
- **Stack, TypeScript estricto y estructura:** [`Vault_nexo/01_ARQUITECTURA_Y_STACK.md`](file:///C:/Users/gorti/Desktop/System_Nexo/Vault_nexo/01_ARQUITECTURA_Y_STACK.md)
- **Esquema de 10 tablas, RPCs y RLS:** [`Vault_nexo/02_BASE_DE_DATOS_Y_RLS.md`](file:///C:/Users/gorti/Desktop/System_Nexo/Vault_nexo/02_BASE_DE_DATOS_Y_RLS.md)
- **Rutas del App Router y componentes:** [`Vault_nexo/03_MODULOS_Y_RUTAS.md`](file:///C:/Users/gorti/Desktop/System_Nexo/Vault_nexo/03_MODULOS_Y_RUTAS.md)
- **Seguridad, login por username interno y RBAC:** [`Vault_nexo/04_SEGURIDAD_AUTH_Y_ROLES.md`](file:///C:/Users/gorti/Desktop/System_Nexo/Vault_nexo/04_SEGURIDAD_AUTH_Y_ROLES.md)
- **Despliegues, URLs de producción y Vercel:** [`Vault_nexo/05_DESPLIEGUE_Y_OPERACIONES.md`](file:///C:/Users/gorti/Desktop/System_Nexo/Vault_nexo/05_DESPLIEGUE_Y_OPERACIONES.md)

## Reglas Inquebrantables del Código
1. **Supabase es la única fuente de verdad:** Todo control de acceso debe reflejarse en directivas de Row Level Security (RLS). No confiar únicamente en validaciones del lado del cliente.
2. **Uso de `server-only`:** `SUPABASE_SERVICE_ROLE_KEY` jamás debe exponerse en el cliente ni importarse en archivos fuera de Server Actions administrativos protegidos.
3. **Validación Zod estricta:** Toda mutación o Server Action debe validar su entrada con Zod usando `safeParse` antes de interactuar con Supabase.
4. **Verificación continua:** Antes de dar una tarea por completada, ejecutar siempre:
   - `npm run typecheck` (debe pasar con 0 errores).
   - `npm run build` (debe compilar de forma limpia).
