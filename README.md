# MEDICARE

MVP web de MEDICARE, una plataforma HealthTech para monitoreo y gestión del cuidado domiciliario de adultos mayores.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase como base de datos
- Estado local solo para la UI
- Preparado para deploy en Vercel

## Funcionalidades

- Landing con presentación del producto y beneficios.
- Dashboard del familiar con paciente, adherencia, próxima medicación, última visita, alertas y resumen del día.
- Sección de medicación con estados y acción para marcar como tomada.
- Formulario para agregar nuevas medicaciones.
- Historial de visitas médicas con profesional, fecha, procedimientos, observaciones y estado.
- Formulario para registrar visitas médicas.
- Alertas con prioridad y acción para marcar como resueltas.
- Formulario para crear alertas manuales.
- Familia y cuidadores con roles y estado de contacto.
- Formulario para agregar familiares o cuidadores.
- Historial/evolución con métricas visuales simples.
- Login simulado sin backend.
- Perfiles de acceso:
  - Familiar/cuidador: gestor principal del paciente, puede cargar medicaciones indicadas, visitas y recordatorios.
  - Médico invitado: puede colaborar con datos clínicos, medicación y visitas.
  - Paciente adulto mayor: vista simple de medicaciones del día, recordatorios, visitas e historial reciente.
- Edición básica de datos del paciente.
- Registro de actividad reciente generado por las acciones del usuario.
- Datos persistidos en Supabase: paciente, medicamentos, visitas, alertas, contactos, logs y recordatorios.
- Recordatorios por email de MVP: se guardan en `medication_reminders` y generan una fila en `email_reminder_outbox`.
- Seguimiento diario por fecha en `medication_intakes`.
- Calendario de cuidado con estados verde/amarillo/rojo para revisar días anteriores.

## Usuarios demo

La app carga estos usuarios desde Supabase:

| Perfil | Email |
| --- | --- |
| Familiar | `familiar@medicare.demo` |
| Médico | `medico@medicare.demo` |
| Paciente | `paciente@medicare.demo` |

No usan contraseña real en esta versión. Son usuarios demo para presentar el flujo completo sin depender todavía de Supabase Auth.

## Correr localmente

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Supabase

El proyecto ya incluye:

- `.mcp.json` para conectar Codex con Supabase MCP.
- `.env.example` con las variables necesarias.
- `src/lib/supabase/client.ts` para crear el cliente browser.
- `supabase/sql/001_medicare_schema.sql` con tablas iniciales y RLS.
- `supabase/sql/003_medicare_demo_users_and_reminders.sql` con usuarios demo, datos iniciales y recordatorios.

Variables necesarias:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Para crear las tablas sin MCP:

1. Entrar al dashboard de Supabase.
2. Abrir el proyecto.
3. Ir a `SQL Editor`.
4. Copiar el contenido de `supabase/sql/001_medicare_schema.sql`.
5. Ejecutar `Run`.

Para conectar Codex directo con Supabase:

1. Reiniciar la sesión del IDE/Codex desde este proyecto.
2. Autorizar el servidor Supabase MCP cuando aparezca el flujo OAuth.
3. Volver al chat y avisar que ya quedó autenticado.

## Validar producción

```bash
npm run build
npm run start
```

## Deploy en Vercel

1. Subir este repositorio a GitHub.
2. Entrar a Vercel y crear un nuevo proyecto desde el repositorio.
3. Vercel detecta Next.js automáticamente.
4. En `Settings` → `Environment Variables`, agregar:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://gjncbofcmalgmrqtdpaj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XPidDjre2nYrcWdjjB3tqQ_1yMd_ks1
```

5. Usar los defaults:
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next`
6. Deploy. Si ya estaba deployado, ejecutar `Redeploy` después de guardar las variables.
