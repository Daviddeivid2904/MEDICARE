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
  EnterpriseDoctor,
  EnterprisePatient,
  EvolutionMetric,
  Medication,
  NavItem,
  Patient,
  ProfessionalPatient,
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

export const enterpriseDoctors: EnterpriseDoctor[] = [
  {
    id: "doctor-1",
    name: "Dra. Lucía Pérez",
    email: "lucia.perez@medicare.empresas",
    specialty: "Clínica médica",
    status: "En visita",
    patientsToday: 7,
    completedVisits: 5,
    pendingVisits: 2,
    lastCheckIn: "14:40",
  },
  {
    id: "doctor-2",
    name: "Dr. Nicolás Herrera",
    email: "nicolas.herrera@medicare.empresas",
    specialty: "Cardiología",
    status: "Disponible",
    patientsToday: 5,
    completedVisits: 5,
    pendingVisits: 0,
    lastCheckIn: "15:05",
  },
  {
    id: "doctor-3",
    name: "Enf. Camila Ríos",
    email: "camila.rios@medicare.empresas",
    specialty: "Enfermería domiciliaria",
    status: "Atrasado",
    patientsToday: 9,
    completedVisits: 6,
    pendingVisits: 3,
    lastCheckIn: "13:20",
  },
  {
    id: "doctor-4",
    name: "Martín Acosta",
    email: "martin.acosta@medicare.empresas",
    specialty: "Kinesiología",
    status: "En visita",
    patientsToday: 6,
    completedVisits: 4,
    pendingVisits: 2,
    lastCheckIn: "14:55",
  },
];

export const enterprisePatients: EnterprisePatient[] = [
  {
    id: "enterprise-patient-1",
    name: "Rosa Martínez",
    age: 78,
    coverage: "Plan geriátrico domiciliario",
    location: "Habitación 204",
    status: "Estable",
    assignedDoctors: ["Dra. Lucía Pérez", "Martín Acosta", "Enf. Camila Ríos"],
    medicationAdherence: 64,
    completedVisits: 2,
    pendingVisits: 1,
    medications: [
      { name: "Losartán", time: "08:00", status: "tomado" },
      { name: "Metformina", time: "12:30", status: "pendiente" },
      { name: "Atorvastatina", time: "20:00", status: "pendiente" },
    ],
    visits: [
      { professional: "Dra. Lucía Pérez", type: "Control clínico", time: "10:30", status: "realizada" },
      { professional: "Martín Acosta", type: "Kinesiología", time: "16:00", status: "pendiente" },
    ],
    alerts: ["Medicación pendiente", "Visita de kinesiología pendiente"],
    history: [
      { id: "hist-rosa-1", date: "Hoy 12:30", title: "Metformina pendiente", detail: "Todavía no se confirmó la toma del mediodía.", type: "medicacion" },
      { id: "hist-rosa-2", date: "Hoy 10:30", title: "Control clínico realizado", detail: "Presión y glucemia dentro de parámetros esperados.", type: "visita" },
      { id: "hist-rosa-3", date: "Ayer 20:00", title: "Atorvastatina confirmada", detail: "Toma nocturna registrada por familiar.", type: "medicacion" },
    ],
    familyAccesses: [
      { id: "fam-rosa-1", name: "Ana Gómez", email: "ana.gomez@familia.demo", relationship: "Hija", accessLevel: "viewer", permissions: viewerPermissions, invitationStatus: "aceptada" },
      { id: "fam-rosa-2", name: "Carlos Gómez", email: "carlos.gomez@familia.demo", relationship: "Hijo", accessLevel: "editor", permissions: { ...viewerPermissions, canConfirmMedications: true, canConfirmVisits: true }, invitationStatus: "pendiente" },
    ],
  },
  {
    id: "enterprise-patient-2",
    name: "Alberto Suárez",
    age: 83,
    coverage: "Obra social Norte",
    location: "Domicilio",
    status: "Requiere seguimiento",
    assignedDoctors: ["Dr. Nicolás Herrera", "Dra. Lucía Pérez"],
    medicationAdherence: 82,
    completedVisits: 1,
    pendingVisits: 0,
    medications: [
      { name: "Bisoprolol", time: "09:00", status: "tomado" },
      { name: "Furosemida", time: "14:00", status: "tomado" },
    ],
    visits: [
      { professional: "Dr. Nicolás Herrera", type: "Cardiología", time: "11:15", status: "realizada" },
    ],
    alerts: ["Control cardiológico completado"],
    history: [
      { id: "hist-alberto-1", date: "Hoy 14:00", title: "Furosemida tomada", detail: "Confirmada por cuidador domiciliario.", type: "medicacion" },
      { id: "hist-alberto-2", date: "Hoy 11:15", title: "Visita cardiológica", detail: "Sin signos de alarma. Se mantiene plan actual.", type: "visita" },
    ],
    familyAccesses: [
      { id: "fam-alberto-1", name: "Mariana Suárez", email: "mariana.suarez@familia.demo", relationship: "Nieta", accessLevel: "viewer", permissions: viewerPermissions, invitationStatus: "aceptada" },
    ],
  },
  {
    id: "enterprise-patient-3",
    name: "Marta Quiroga",
    age: 80,
    coverage: "Geriátrico San Rafael",
    location: "Habitación 118",
    status: "Alerta media",
    assignedDoctors: ["Enf. Camila Ríos", "Dra. Lucía Pérez"],
    medicationAdherence: 43,
    completedVisits: 0,
    pendingVisits: 2,
    medications: [
      { name: "Levotiroxina", time: "07:30", status: "tomado" },
      { name: "Enalapril", time: "13:00", status: "atrasado" },
      { name: "Calcio", time: "21:00", status: "pendiente" },
    ],
    visits: [
      { professional: "Enf. Camila Ríos", type: "Control de signos", time: "12:00", status: "pendiente" },
      { professional: "Dra. Lucía Pérez", type: "Evaluación clínica", time: "18:00", status: "pendiente" },
    ],
    alerts: ["Medicación atrasada", "Control de signos pendiente"],
    history: [
      { id: "hist-marta-1", date: "Hoy 13:00", title: "Enalapril atrasado", detail: "Requiere seguimiento del equipo de enfermería.", type: "alerta" },
      { id: "hist-marta-2", date: "Ayer 18:10", title: "Evaluación clínica", detail: "Se indicó reforzar hidratación y control de presión.", type: "visita" },
    ],
    familyAccesses: [
      { id: "fam-marta-1", name: "Laura Quiroga", email: "laura.quiroga@familia.demo", relationship: "Hija", accessLevel: "editor", permissions: { ...viewerPermissions, canConfirmMedications: true, canConfirmVisits: true }, invitationStatus: "aceptada" },
    ],
  },
  {
    id: "enterprise-patient-4",
    name: "Elena Bianchi",
    age: 76,
    coverage: "Plan premium domiciliario",
    location: "Domicilio",
    status: "Estable",
    assignedDoctors: ["Martín Acosta", "Enf. Camila Ríos"],
    medicationAdherence: 100,
    completedVisits: 2,
    pendingVisits: 0,
    medications: [
      { name: "Vitamina D", time: "09:00", status: "tomado" },
      { name: "Amlodipina", time: "19:00", status: "tomado" },
    ],
    visits: [
      { professional: "Martín Acosta", type: "Kinesiología", time: "09:45", status: "realizada" },
      { professional: "Enf. Camila Ríos", type: "Enfermería", time: "13:30", status: "realizada" },
    ],
    alerts: ["Sin alertas activas"],
    history: [
      { id: "hist-elena-1", date: "Hoy 13:30", title: "Enfermería realizada", detail: "Control general sin novedades.", type: "visita" },
      { id: "hist-elena-2", date: "Hoy 09:00", title: "Medicación completa", detail: "Todas las tomas de la mañana fueron confirmadas.", type: "medicacion" },
    ],
    familyAccesses: [
      { id: "fam-elena-1", name: "Sofía Bianchi", email: "sofia.bianchi@familia.demo", relationship: "Sobrina", accessLevel: "viewer", permissions: viewerPermissions, invitationStatus: "pendiente" },
    ],
  },
];

export const professionalPatients: ProfessionalPatient[] = [
  {
    id: "professional-patient-1",
    name: "Rosa Martínez",
    age: 78,
    diagnosis: "Hipertensión y diabetes tipo 2",
    location: "Domicilio - Palermo",
    emergencyContact: "Ana Gómez · +54 11 5555-0142",
    generalStatus: "Estable",
    allergies: "Sin alergias registradas",
    carePlan: "Control de presión diario, medicación supervisada y caminata asistida.",
    clinicalNotes: "Paciente orientada. Reforzar hidratación y observar adherencia de mediodía.",
    medications: [
      { id: "pro-med-1", name: "Losartán", dose: "50 mg", purpose: "Control de presión arterial.", time: "08:00", status: "tomado", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: true, reminderEmail: "ana@familia.demo" },
      { id: "pro-med-2", name: "Metformina", dose: "850 mg", purpose: "Control de glucemia.", time: "12:30", status: "pendiente", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: true, reminderEmail: "ana@familia.demo" },
      { id: "pro-med-3", name: "Atorvastatina", dose: "20 mg", purpose: "Control de colesterol.", time: "20:00", status: "pendiente", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: false, reminderEmail: "" },
    ],
    visits: [
      { id: "pro-visit-1", professional: "Enf. Camila Ríos", role: "Enfermería", date: "09/06/2026", dateIso: "2026-06-09", time: "10:30", procedures: "Control de signos vitales y glucemia.", notes: "Sin signos de alarma.", status: "realizada", recurrenceType: "weekly", weeklyDays: [2], monthlyDay: null },
      { id: "pro-visit-2", professional: "Enf. Camila Ríos", role: "Enfermería", date: "09/06/2026", dateIso: "2026-06-09", time: "18:00", procedures: "Supervisión de medicación nocturna.", notes: "Confirmar toma de Atorvastatina.", status: "pendiente", recurrenceType: "once", weeklyDays: [], monthlyDay: null },
    ],
    history: [
      { id: "pro-hist-1", date: "Hoy 10:30", title: "Visita realizada", detail: "Control de signos vitales dentro de rango esperado.", type: "visita" },
      { id: "pro-hist-2", date: "Hoy 08:00", title: "Losartán confirmado", detail: "La toma de la mañana fue registrada correctamente.", type: "medicacion" },
    ],
    familyAccesses: [
      { id: "pro-fam-rosa-1", name: "Ana Gómez", email: "ana.gomez@familia.demo", relationship: "Hija", accessLevel: "viewer", permissions: viewerPermissions, invitationStatus: "aceptada" },
      { id: "pro-fam-rosa-2", name: "Carlos Gómez", email: "carlos.gomez@familia.demo", relationship: "Hijo", accessLevel: "editor", permissions: { ...viewerPermissions, canConfirmMedications: true, canConfirmVisits: true }, invitationStatus: "pendiente" },
    ],
  },
  {
    id: "professional-patient-2",
    name: "Marta Quiroga",
    age: 80,
    diagnosis: "Hipotiroidismo, hipertensión y riesgo de caídas",
    location: "Geriátrico San Rafael - Hab. 118",
    emergencyContact: "Laura Quiroga · +54 11 5555-0188",
    generalStatus: "Alerta media",
    allergies: "Penicilina",
    carePlan: "Supervisión de medicación, control de presión y acompañamiento en traslados.",
    clinicalNotes: "Requiere seguimiento cercano por tomas atrasadas durante la tarde.",
    medications: [
      { id: "pro-med-4", name: "Levotiroxina", dose: "75 mcg", purpose: "Tratamiento de hipotiroidismo.", time: "07:30", status: "tomado", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: true, reminderEmail: "laura@familia.demo" },
      { id: "pro-med-5", name: "Enalapril", dose: "10 mg", purpose: "Control de presión arterial.", time: "13:00", status: "atrasado", frequencyType: "daily", intervalHours: 24, weeklyDays: [], reminderEnabled: true, reminderEmail: "laura@familia.demo" },
    ],
    visits: [
      { id: "pro-visit-3", professional: "Enf. Camila Ríos", role: "Enfermería", date: "09/06/2026", dateIso: "2026-06-09", time: "12:00", procedures: "Control de presión y medicación.", notes: "Pendiente registrar evolución.", status: "pendiente", recurrenceType: "daily", weeklyDays: [], monthlyDay: null },
    ],
    history: [
      { id: "pro-hist-3", date: "Hoy 13:00", title: "Enalapril atrasado", detail: "Se notificó a familiar responsable.", type: "alerta" },
      { id: "pro-hist-4", date: "Ayer 18:15", title: "Observación clínica", detail: "Marcha inestable al levantarse. Se recomienda asistencia.", type: "nota" },
    ],
    familyAccesses: [
      { id: "pro-fam-marta-1", name: "Laura Quiroga", email: "laura.quiroga@familia.demo", relationship: "Hija", accessLevel: "editor", permissions: { ...viewerPermissions, canConfirmMedications: true, canConfirmVisits: false }, invitationStatus: "aceptada" },
    ],
  },
];
