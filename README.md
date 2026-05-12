# MEDICARE

MVP web de MEDICARE, una plataforma HealthTech para monitoreo y gestión del cuidado domiciliario de adultos mayores.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Datos mockeados y estado local
- Persistencia en `localStorage`
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
- Edición básica de datos del paciente.
- Registro de actividad reciente generado por las acciones del usuario.

## Correr localmente

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Validar producción

```bash
npm run build
npm run start
```

## Deploy en Vercel

1. Subir este repositorio a GitHub.
2. Entrar a Vercel y crear un nuevo proyecto desde el repositorio.
3. Vercel detecta Next.js automáticamente.
4. Usar los defaults:
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next`
5. Deploy.
