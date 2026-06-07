import { createClient } from "@/lib/supabase/client";
import type {
  ActivityLog,
  AlertPriority,
  CareAlert,
  CareContact,
  Medication,
  MedicationIntake,
  MedicationReminder,
  MedicationStatus,
  Patient,
  SessionUser,
  UserRole,
  Visit,
  VisitStatus,
} from "@/types";

export type MedicareData = {
  patient: Patient;
  medications: Medication[];
  visits: Visit[];
  alerts: CareAlert[];
  contacts: CareContact[];
  activityLog: ActivityLog[];
  reminders: MedicationReminder[];
  intakes: MedicationIntake[];
};

export type DemoUserRow = {
  id: string;
  patient_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  initials: string;
};

const supabase = createClient();

export async function getDemoUsers() {
  const { data, error } = await supabase
    .from("demo_users")
    .select("id, patient_id, full_name, email, role, initials")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapDemoUser);
}

export async function loadMedicareData(patientId: string): Promise<MedicareData> {
  const [
    patientResult,
    medicationsResult,
    visitsResult,
    alertsResult,
    contactsResult,
    logsResult,
    remindersResult,
    intakesResult,
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("id", patientId).single(),
    supabase.from("medications").select("*").eq("patient_id", patientId).order("time"),
    supabase
      .from("visits")
      .select("*")
      .eq("patient_id", patientId)
      .order("visit_date", { ascending: false })
      .order("visit_time", { ascending: false }),
    supabase
      .from("care_alerts")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase.from("care_contacts").select("*").eq("patient_id", patientId).order("created_at"),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("medication_reminders")
      .select("*, medications(name)")
      .eq("patient_id", patientId)
      .order("scheduled_time"),
    supabase
      .from("medication_intakes")
      .select("*")
      .eq("patient_id", patientId)
      .gte("scheduled_date", getDateOffset(-14))
      .lte("scheduled_date", getDateOffset(1))
      .order("scheduled_date", { ascending: false }),
  ]);

  const firstError =
    patientResult.error ??
    medicationsResult.error ??
    visitsResult.error ??
    alertsResult.error ??
    contactsResult.error ??
    logsResult.error ??
    remindersResult.error ??
    intakesResult.error;

  if (firstError) throw firstError;

  return {
    patient: mapPatient(patientResult.data),
    medications: (medicationsResult.data ?? []).map(mapMedication),
    visits: (visitsResult.data ?? []).map(mapVisit),
    alerts: (alertsResult.data ?? []).map(mapAlert),
    contacts: (contactsResult.data ?? []).map(mapContact),
    activityLog: (logsResult.data ?? []).map(mapLog),
    reminders: (remindersResult.data ?? []).map(mapReminder),
    intakes: (intakesResult.data ?? []).map(mapIntake),
  };
}

export async function updatePatient(patient: Patient) {
  if (!patient.id) throw new Error("Missing patient id.");

  const { data, error } = await supabase
    .from("patients")
    .update({
      name: patient.name,
      age: patient.age,
      diagnosis: patient.diagnosis,
      emergency_contact: patient.emergencyContact,
      doctor: patient.doctor,
      general_status: patient.generalStatus,
      allergies: patient.allergies,
      mobility_risk: patient.mobilityRisk,
      care_plan: patient.carePlan,
      clinical_notes: patient.clinicalNotes,
    })
    .eq("id", patient.id)
    .select()
    .single();

  if (error) throw error;
  return mapPatient(data);
}

export async function createMedication(
  patientId: string,
  medication: { name: string; dose: string; time: string },
) {
  const { data, error } = await supabase
    .from("medications")
    .insert({
      patient_id: patientId,
      name: medication.name,
      dose: medication.dose,
      time: medication.time,
      status: "pendiente",
    })
    .select()
    .single();

  if (error) throw error;
  return mapMedication(data);
}

export async function upsertMedicationIntake({
  patientId,
  medicationId,
  scheduledDate,
  status,
}: {
  patientId: string;
  medicationId: string;
  scheduledDate: string;
  status: MedicationStatus;
}) {
  const { data, error } = await supabase
    .from("medication_intakes")
    .upsert(
      {
        patient_id: patientId,
        medication_id: medicationId,
        scheduled_date: scheduledDate,
        status,
        taken_at: status === "tomado" ? new Date().toISOString() : null,
      },
      { onConflict: "medication_id,scheduled_date" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapIntake(data);
}

export async function createVisit(patientId: string, visit: {
  professional: string;
  role: string;
  date: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
}) {
  const { data, error } = await supabase
    .from("visits")
    .insert({
      patient_id: patientId,
      professional: visit.professional,
      role: visit.role,
      visit_date: visit.date,
      visit_time: visit.time,
      procedures: visit.procedures,
      notes: visit.notes,
      status: visit.status,
    })
    .select()
    .single();

  if (error) throw error;
  return mapVisit(data);
}

export async function createAlert(patientId: string, alert: {
  title: string;
  detail: string;
  priority: AlertPriority;
}) {
  const { data, error } = await supabase
    .from("care_alerts")
    .insert({
      patient_id: patientId,
      title: alert.title,
      detail: alert.detail,
      priority: alert.priority,
      resolved: false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAlert(data);
}

export async function updateAlertResolved(id: string, resolved: boolean) {
  const { data, error } = await supabase
    .from("care_alerts")
    .update({ resolved })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapAlert(data);
}

export async function createContact(patientId: string, contact: {
  name: string;
  role: string;
  status: CareContact["status"];
  initials: string;
}) {
  const { data, error } = await supabase
    .from("care_contacts")
    .insert({
      patient_id: patientId,
      name: contact.name,
      role: contact.role,
      status: contact.status,
      initials: contact.initials,
    })
    .select()
    .single();

  if (error) throw error;
  return mapContact(data);
}

export async function createActivityLog(patientId: string, message: string) {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({ patient_id: patientId, message })
    .select()
    .single();

  if (error) throw error;
  return mapLog(data);
}

export async function createReminder(patientId: string, reminder: {
  medicationId: string;
  recipientEmail: string;
  scheduledTime: string;
  createdByDemoUser?: string;
}) {
  const { data, error } = await supabase
    .from("medication_reminders")
    .insert({
      patient_id: patientId,
      medication_id: reminder.medicationId,
      recipient_email: reminder.recipientEmail,
      scheduled_time: reminder.scheduledTime,
      enabled: true,
      created_by_demo_user: reminder.createdByDemoUser,
    })
    .select("*, medications(name)")
    .single();

  if (error) throw error;
  return mapReminder(data);
}

export async function createReminderEmail(patientId: string, reminder: MedicationReminder) {
  const subject = `Recordatorio MEDICARE: ${reminder.medicationName ?? "medicación"}`;
  const body = `Recordatorio programado para las ${reminder.scheduledTime}: tomar ${reminder.medicationName ?? "la medicación indicada"}.`;

  const { data, error } = await supabase
    .from("email_reminder_outbox")
    .insert({
      patient_id: patientId,
      reminder_id: reminder.id,
      recipient_email: reminder.recipientEmail,
      subject,
      body,
      status: "queued",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function mapDemoUser(row: DemoUserRow): SessionUser {
  return {
    id: row.id,
    patientId: row.patient_id,
    email: row.email,
    name: row.full_name,
    role: getRoleLabel(row.role),
    roleType: row.role,
    initials: row.initials,
  };
}

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    diagnosis: row.diagnosis,
    emergencyContact: row.emergency_contact,
    doctor: row.doctor,
    generalStatus: row.general_status,
    allergies: row.allergies,
    mobilityRisk: row.mobility_risk,
    carePlan: row.care_plan,
    clinicalNotes: row.clinical_notes,
  };
}

function mapMedication(row: any): Medication {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    dose: row.dose,
    time: normalizeTime(row.time),
    status: row.status,
  };
}

function mapVisit(row: any): Visit {
  return {
    id: row.id,
    patientId: row.patient_id,
    professional: row.professional,
    role: row.role,
    date: formatDateForDisplay(row.visit_date),
    dateIso: row.visit_date,
    time: normalizeTime(row.visit_time),
    procedures: row.procedures,
    notes: row.notes,
    status: row.status,
  };
}

function mapAlert(row: any): CareAlert {
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    detail: row.detail,
    priority: row.priority,
    resolved: row.resolved,
  };
}

function mapContact(row: any): CareContact {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    role: row.role,
    status: row.status,
    initials: row.initials,
  };
}

function mapLog(row: any): ActivityLog {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.created_at,
  };
}

function mapReminder(row: any): MedicationReminder {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicationId: row.medication_id,
    recipientEmail: row.recipient_email,
    scheduledTime: normalizeTime(row.scheduled_time),
    enabled: row.enabled,
    medicationName: row.medications?.name,
  };
}

function mapIntake(row: any): MedicationIntake {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicationId: row.medication_id,
    scheduledDate: row.scheduled_date,
    status: row.status,
    takenAt: row.taken_at,
    notes: row.notes,
  };
}

function getDateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function normalizeTime(value: string) {
  return value?.slice(0, 5) ?? "";
}

function formatDateForDisplay(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getRoleLabel(roleType: UserRole) {
  const labels: Record<UserRole, string> = {
    family: "Familiar responsable",
    doctor: "Médico",
    senior: "Paciente",
  };

  return labels[roleType];
}
