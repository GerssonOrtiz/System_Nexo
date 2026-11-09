# 03 — Módulos y Rutas de la Aplicación

El sistema cuenta con 14 rutas estructuradas bajo el Next.js App Router, todas tipadas y renderizadas de forma dinámica/estática según corresponda.

---

## 1. Mapa de Rutas

```
/
├── /login                         # Pantalla pública de autenticación
└── (dashboard)/                   # Zona autenticada protegida por proxy/layout
    ├── /tickets                   # Mesa de Ayuda (listado con filtros)
    ├── /tickets/nuevo             # Formulario de alta de ticket
    ├── /tickets/[id]              # Detalle, hilo de mensajes y notas internas
    ├── /taller                    # Pipeline de laboratorio (tarjetas activas)
    ├── /taller/nueva              # Ingreso de tarjeta (genera serial TRJ)
    ├── /taller/[id]               # Ficha de tarjeta: Stepper, BOM y Bitácora
    ├── /kb                        # Base de Conocimiento (artículos públicos/borradores)
    ├── /kb/nuevo                  # Editor de artículos en Markdown (solo ADMIN_TI)
    ├── /kb/[slug]                 # Visor de artículo con conteo de lecturas
    ├── /admin/usuarios            # Alta de usuarios, reseteo de claves y activación
    └── /admin/auditoria           # Visor inmutable de eventos y diffs JSON
```

---

## 2. Descripción de Pantallas

### Mesa de Ayuda (`/tickets`)
- **Acceso:** Todos los usuarios autenticados.
- **Diferenciación de Rol:** El `SOLICITANTE` ve sus propios tickets; el `ADMIN_TI` ve los tickets de toda la empresa y puede cambiar su estado (`ABIERTO`, `EN_PROGRESO`, `EN_ESPERA`, `RESUELTO`, `CERRADO`).
- **Detalle de Ticket (`/tickets/[id]`):** Permite mantener una conversación interactiva. Los administradores disponen de un checkbox para marcar comentarios como "Nota interna (oculta al solicitante)".

### Taller de Tarjetas (`/taller`)
- **Acceso:** Exclusivo `ADMIN_TI`.
- **Ficha Técnica (`/taller/[id]`):**
  - **Pipeline Stepper:** Muestra el progreso secuencial de 4 etapas (Diagnóstico, Reparación, Pruebas y Entrega) con marcas de tiempo `completed_at` y diálogo para adjuntar notas técnicas al avanzar.
  - **BOM (Lista de Materiales):** Alta de componentes por designador (`R12`, `C45`, `U3`), número de parte y encapsulado. Control de estado (`REQUERIDO`, `SOLICITADO`, `EN_STOCK`, `INSTALADO`).
  - **Bitácora Técnica:** Registro de notas de trabajo, alertas y mediciones de osciloscopio o multímetro (`TP3`, `3.3V`).

### Base de Conocimiento (`/kb`)
- **Acceso:** Lectura para todos los usuarios autenticados (solo artículos con `is_published = true`). Edición y borradores exclusivos para `ADMIN_TI`.
- **Visor (`/kb/[slug]`):** Formato enriquecido en Markdown con tags, autor y conteo de vistas en tiempo real.

### Gestión de Usuarios (`/admin/usuarios`)
- **Acceso:** Exclusivo `ADMIN_TI`.
- **Alta de cuentas:** Creación de usuarios con username, nombre, rol y contraseña temporal.
- **Controles de Superadmin:** Solo el usuario con `is_superadmin = true` (`venllas`) puede ver y accionar los botones de **Restablecer Contraseña** y **Activar/Desactivar Cuenta**.

### Auditoría (`/admin/auditoria`)
- **Acceso:** Exclusivo `ADMIN_TI`.
- **Contenido:** Tabla cronológica con ID, fecha, actor que realizó la acción, tipo de operación (`INSERT`, `UPDATE`, `DELETE`), entidad afectada y diff JSON con los valores anteriores y posteriores.
