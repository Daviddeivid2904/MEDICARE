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

const fullPermissions = {
  canManagePatient: true,
  canManageMedications: true,
  canConfirmMedications: true,
  canManageVisits: true,
  canConfirmVisits: true,
  canManageContacts: true,
  canViewHistory: true,
};

const viewerPermissions = {
  canManagePatient: false,
  canManageMedications: false,
  canConfirmMedications: false,
  canManageVisits: false,
  canConfirmVisits: false,
  canManageContacts: false,
  canViewHistory: true,
};

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
  { id: "mock-med-1", name: "Losartán", dose: "50 mg", purpose: "Control de presión arterial.", time: "08:00", status: "tomado", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: false, reminderEmail: "" },
  { id: "mock-med-2", name: "Metformina", dose: "850 mg", purpose: "Control de glucemia.", time: "12:30", status: "pendiente", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: true, reminderEmail: "familiar@medicare.demo" },
  { id: "mock-med-3", name: "Atorvastatina", dose: "20 mg", purpose: "Control de colesterol.", time: "20:00", status: "pendiente", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: false, reminderEmail: "" },
  { id: "mock-med-4", name: "Vitamina D", dose: "1 cápsula", purpose: "Suplemento indicado.", time: "09:00", status: "atrasado", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: false, reminderEmail: "" },
];

export const initialPatient: Patient = {
  name: "Rosa Martínez",
  age: 78,
  diagnosis: "Hipertensión y diabetes tipo 2",
  emergencyContact: "Ana Gómez · +54 11 5555-0142",
  doctor: "Dra. Lucía Pérez",
  generalStatus: "Estable",
  allergies: "Sin alergias medicamentosas registradas",
  mobilityRisk: "Riesgo medio de caídas",
  carePlan: "Control de presión diario, caminata asistida y revisión semanal.",
  clinicalNotes: "Mantener hidratación. Evaluar adherencia a Metformina durante la semana.",
};

export const initialVisits: Visit[] = [
  {
    id: "mock-visit-1",
    professional: "Dra. Lucía Pérez",
    role: "Médica clínica",
    date: "12/05/2026",
    time: "10:30",
    procedures: "Control de presión, glucemia y revisión de medicación.",
    notes: "Paciente estable. Reforzar hidratación y caminata suave.",
    status: "realizada",
    recurrenceType: "once",
    weeklyDays: [],
    monthlyDay: null,
  },
  {
    id: "mock-visit-2",
    professional: "Martín Acosta",
    role: "Kinesiólogo",
    date: "13/05/2026",
    time: "16:00",
    procedures: "Movilidad articular y ejercicios de equilibrio.",
    notes: "Visita programada para seguimiento semanal.",
    status: "pendiente",
    recurrenceType: "weekly",
    recurrenceGroupId: "mock-weekly-kinesio",
    weeklyDays: [3],
    monthlyDay: null,
  },
  {
    id: "mock-visit-3",
    professional: "Enf. Camila Ríos",
    role: "Enfermera domiciliaria",
    date: "10/05/2026",
    time: "09:15",
    procedures: "Curación menor y control de signos vitales.",
    notes: "Sin signos de alarma. Familia notificada.",
    status: "realizada",
    recurrenceType: "once",
    weeklyDays: [],
    monthlyDay: null,
  },
];

export const initialAlerts: CareAlert[] = [
  {
    id: "mock-alert-1",
    title: "Medicación pendiente",
    detail: "Metformina de las 12:30 todavía no fue confirmada.",
    priority: "alta",
    resolved: false,
  },
  {
    id: "mock-alert-2",
    title: "Control atrasado",
    detail: "Falta registrar el control de presión vespertino.",
    priority: "media",
    resolved: false,
  },
  {
    id: "mock-alert-3",
    title: "Visita médica no registrada",
    detail: "Confirmar observaciones de la última visita de enfermería.",
    priority: "baja",
    resolved: false,
  },
];

export const contacts: CareContact[] = [
  { id: "mock-contact-1", name: "Ana Gómez", role: "Hija responsable", email: "familiar@medicare.demo", accessLevel: "full", permissions: fullPermissions, invitationStatus: "aceptada", status: "En línea", initials: "AG" },
  { id: "mock-contact-2", name: "Carlos Gómez", role: "Familiar autorizado", email: "carlos@medicare.demo", accessLevel: "viewer", permissions: viewerPermissions, invitationStatus: "pendiente", status: "Disponible", initials: "CG" },
  { id: "mock-contact-3", name: "Dra. Lucía Pérez", role: "Médica asignada", email: "medico@medicare.demo", accessLevel: "full", permissions: fullPermissions, invitationStatus: "aceptada", status: "Disponible", initials: "LP" },
  { id: "mock-contact-4", name: "Camila Ríos", role: "Cuidadora domiciliaria", email: "camila@medicare.demo", accessLevel: "editor", permissions: { ...fullPermissions, canManagePatient: false, canManageContacts: false }, invitationStatus: "sin cuenta", status: "Fuera de horario", initials: "CR" },
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
