# MEDICARE

MVP web de MEDICARE, una plataforma HealthTech para monitoreo y gestión del cuidado domiciliario de adultos mayores.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Datos mockeados y estado local
- Preparado para deploy en Vercel

## Funcionalidades

- Landing con presentación del producto y beneficios.
- Dashboard del familiar con paciente, adherencia, próxima medicación, última visita, alertas y resumen del día.
- Sección de medicación con estados y acción para marcar como tomada.
- Historial de visitas médicas con profesional, fecha, procedimientos, observaciones y estado.
- Alertas con prioridad y acción para marcar como resueltas.
- Familia y cuidadores con roles y estado de contacto.
- Historial/evolución con métricas visuales simples.

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
