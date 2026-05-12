import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Home,
  Pill,
  Users,
} from "lucide-react";
import type {
  CareAlert,
  CareContact,
  EvolutionMetric,
  Medication,
  NavItem,
  Patient,
  Visit,
} from "@/types";

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "medicacion", label: "Medicación", icon: Pill },
  { id: "visitas", label: "Visitas", icon: CalendarDays },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "familia", label: "Familia", icon: Users },
  { id: "historial", label: "Evolución", icon: Activity },
];

export const benefits = [
  {
    title: "Monitoreo en tiempo real",
    text: "Seguimiento diario del estado general y eventos relevantes.",
    icon: HeartPulse,
  },
  {
    title: "Recordatorios de medicación",
    text: "Horarios visibles y estados claros para reducir olvidos.",
    icon: Pill,
  },
  {
    title: "Registro de visitas médicas",
    text: "Historial organizado de profesionales, controles y observaciones.",
    icon: ClipboardList,
  },
  {
    title: "Alertas para familiares",
    text: "Priorización de situaciones que requieren atención.",
    icon: Bell,
  },
];

export const initialMedications: Medication[] = [
  { id: 1, name: "Losartán", dose: "50 mg", time: "08:00", status: "tomado" },
  { id: 2, name: "Metformina", dose: "850 mg", time: "12:30", status: "pendiente" },
  { id: 3, name: "Atorvastatina", dose: "20 mg", time: "20:00", status: "pendiente" },
  { id: 4, name: "Vitamina D", dose: "1 cápsula", time: "09:00", status: "atrasado" },
];

export const initialPatient: Patient = {
  name: "Rosa Martínez",
  age: 78,
  diagnosis: "Hipertensión y diabetes tipo 2",
  emergencyContact: "Ana Gómez · +54 11 5555-0142",
  doctor: "Dra. Lucía Pérez",
  generalStatus: "Estable",
};

export const initialVisits: Visit[] = [
  {
    id: 1,
    professional: "Dra. Lucía Pérez",
    role: "Médica clínica",
    date: "12/05/2026",
    time: "10:30",
    procedures: "Control de presión, glucemia y revisión de medicación.",
    notes: "Paciente estable. Reforzar hidratación y caminata suave.",
    status: "realizada",
  },
  {
    id: 2,
    professional: "Martín Acosta",
    role: "Kinesiólogo",
    date: "13/05/2026",
    time: "16:00",
    procedures: "Movilidad articular y ejercicios de equilibrio.",
    notes: "Visita programada para seguimiento semanal.",
    status: "pendiente",
  },
  {
    id: 3,
    professional: "Enf. Camila Ríos",
    role: "Enfermera domiciliaria",
    date: "10/05/2026",
    time: "09:15",
    procedures: "Curación menor y control de signos vitales.",
    notes: "Sin signos de alarma. Familia notificada.",
    status: "realizada",
  },
];

export const initialAlerts: CareAlert[] = [
  {
    id: 1,
    title: "Medicación pendiente",
    detail: "Metformina de las 12:30 todavía no fue confirmada.",
    priority: "alta",
    resolved: false,
  },
  {
    id: 2,
    title: "Control atrasado",
    detail: "Falta registrar el control de presión vespertino.",
    priority: "media",
    resolved: false,
  },
  {
    id: 3,
    title: "Visita médica no registrada",
    detail: "Confirmar observaciones de la última visita de enfermería.",
    priority: "baja",
    resolved: false,
  },
];

export const contacts: CareContact[] = [
  { id: 1, name: "Ana Gómez", role: "Hija responsable", status: "En línea", initials: "AG" },
  { id: 2, name: "Carlos Gómez", role: "Familiar autorizado", status: "Disponible", initials: "CG" },
  { id: 3, name: "Dra. Lucía Pérez", role: "Médica asignada", status: "Disponible", initials: "LP" },
  { id: 4, name: "Camila Ríos", role: "Cuidadora domiciliaria", status: "Fuera de horario", initials: "CR" },
];

export const evolutionMetrics: EvolutionMetric[] = [
  { label: "Adherencia a medicación", value: "64%", trend: "+8% esta semana", percent: 64 },
  { label: "Visitas realizadas", value: "11", trend: "3 en los últimos 7 días", percent: 78 },
  { label: "Alertas resueltas", value: "18", trend: "5 resueltas hoy", percent: 86 },
  { label: "Controles completados", value: "72%", trend: "+12% mensual", percent: 72 },
];

export const dayEvents = [
  "Presión registrada a las 08:20 dentro de rango esperado.",
  "Desayuno completo y caminata asistida de 12 minutos.",
  "Pendiente confirmar medicación del mediodía.",
];
