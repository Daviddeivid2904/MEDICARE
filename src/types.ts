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

export type NavItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export type Medication = {
  id: number;
  name: string;
  dose: string;
  time: string;
  status: MedicationStatus;
};

export type Visit = {
  id: number;
  professional: string;
  role: string;
  date: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
};

export type CareAlert = {
  id: number;
  title: string;
  detail: string;
  priority: AlertPriority;
  resolved: boolean;
};

export type CareContact = {
  id: number;
  name: string;
  role: string;
  status: "En línea" | "Disponible" | "Fuera de horario";
  initials: string;
};

export type EvolutionMetric = {
  label: string;
  value: string;
  trend: string;
  percent: number;
};
