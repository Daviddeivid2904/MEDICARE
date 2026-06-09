import type { LucideIcon } from "lucide-react";

export type SectionId =
  | "dashboard"
  | "medicacion"
  | "visitas"
  | "alertas"
  | "familia"
  | "historial";

export type MedicationStatus = "tomado" | "pendiente" | "atrasado";
export type MedicationFrequency = "daily" | "weekly" | "interval";
export type VisitStatus = "realizada" | "pendiente";
export type VisitRecurrence = "once" | "daily" | "weekly" | "monthly";
export type AlertPriority = "baja" | "media" | "alta";
export type UserRole = "family" | "doctor" | "senior";
export type AccessLevel = "full" | "editor" | "viewer" | "senior_limited" | "custom";

export type UserPermissions = {
  canManagePatient: boolean;
  canManageMedications: boolean;
  canConfirmMedications: boolean;
  canManageVisits: boolean;
  canConfirmVisits: boolean;
  canManageContacts: boolean;
  canViewHistory: boolean;
};

export type NavItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export type Medication = {
  id: string;
  patientId?: string;
  scheduleKey?: string;
  name: string;
  dose: string;
  purpose: string;
  time: string;
  status: MedicationStatus;
  frequencyType: MedicationFrequency;
  intervalHours?: number | null;
  weeklyDays: number[];
  reminderEnabled: boolean;
  reminderEmail: string;
};

export type Visit = {
  id: string;
  patientId?: string;
  professional: string;
  role: string;
  date: string;
  dateIso?: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
  recurrenceType: VisitRecurrence;
  recurrenceGroupId?: string | null;
  weeklyDays: number[];
  monthlyDay?: number | null;
};

export type CareAlert = {
  id: string;
  patientId?: string;
  title: string;
  detail: string;
  priority: AlertPriority;
  resolved: boolean;
};

export type CareContact = {
  id: string;
  patientId?: string;
  name: string;
  role: string;
  email: string;
  accessLevel: AccessLevel;
  permissions: UserPermissions;
  invitationStatus: "sin cuenta" | "pendiente" | "aceptada" | "rechazada";
  status: "En línea" | "Disponible" | "Fuera de horario";
  initials: string;
};

export type Patient = {
  id?: string;
  name: string;
  age: number;
  diagnosis: string;
  emergencyContact: string;
  doctor: string;
  generalStatus: string;
  allergies: string;
  mobilityRisk: string;
  carePlan: string;
  clinicalNotes: string;
};

export type SessionUser = {
  id?: string;
  patientId?: string;
  email?: string;
  name: string;
  role: string;
  roleType: UserRole;
  initials: string;
  accessLevel: AccessLevel;
  permissions: UserPermissions;
  isDemo?: boolean;
};

export type MedicationReminder = {
  id: string;
  patientId: string;
  medicationId: string;
  recipientEmail: string;
  scheduledTime: string;
  enabled: boolean;
  medicationName?: string;
};

export type MedicationIntake = {
  id: string;
  patientId: string;
  medicationId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: MedicationStatus;
  takenAt?: string | null;
  notes: string;
};

export type ActivityLog = {
  id: string;
  message: string;
  createdAt: string;
};

export type EvolutionMetric = {
  label: string;
  value: string;
  trend: string;
  percent: number;
};

export type EnterpriseDoctor = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: "En visita" | "Disponible" | "Atrasado";
  patientsToday: number;
  completedVisits: number;
  pendingVisits: number;
  lastCheckIn: string;
};

export type EnterpriseMedication = {
  name: string;
  time: string;
  status: MedicationStatus;
};

export type EnterpriseVisit = {
  professional: string;
  type: string;
  time: string;
  status: VisitStatus;
};

export type EnterprisePatientHistory = {
  id: string;
  date: string;
  title: string;
  detail: string;
  type: "medicacion" | "visita" | "alerta" | "nota";
};

export type EnterprisePatient = {
  id: string;
  name: string;
  age: number;
  coverage: string;
  location: string;
  status: string;
  assignedDoctors: string[];
  medicationAdherence: number;
  completedVisits: number;
  pendingVisits: number;
  medications: EnterpriseMedication[];
  visits: EnterpriseVisit[];
  alerts: string[];
  history: EnterprisePatientHistory[];
};

export type CareInvitation = {
  id: string;
  patientId: string;
  contactId?: string | null;
  inviteeEmail: string;
  inviteeName: string;
  roleLabel: string;
  roleType: UserRole;
  accessLevel: AccessLevel;
  permissions: UserPermissions;
  status: "pending" | "accepted" | "declined";
  token: string;
  createdAt: string;
};
