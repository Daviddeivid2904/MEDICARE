import type { LucideIcon } from "lucide-react";

export type SectionId =
  | "dashboard"
  | "medicacion"
  | "visitas"
  | "alertas"
  | "familia"
  | "historial";

export type MedicationStatus = "tomado" | "pendiente" | "atrasado";
export type VisitStatus = "realizada" | "pendiente";
export type AlertPriority = "baja" | "media" | "alta";
export type UserRole = "family" | "doctor" | "senior";

export type NavItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export type Medication = {
  id: string;
  patientId?: string;
  name: string;
  dose: string;
  time: string;
  status: MedicationStatus;
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
