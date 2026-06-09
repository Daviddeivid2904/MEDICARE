import { createClient } from "@/lib/supabase/client";
import type {
  AccessLevel,
  ActivityLog,
  AlertPriority,
  CareAlert,
  CareContact,
  CareInvitation,
  EnterprisePatientHistory,
  Medication,
  MedicationFrequency,
  MedicationIntake,
  MedicationReminder,
  MedicationStatus,
  Patient,
  PatientFamilyAccess,
  ProfessionalPatient,
  SessionUser,
  UserPermissions,
  UserRole,
  Visit,
  VisitRecurrence,
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

export type ProfessionalWorkspaceData = {
  professionalName: string;
  professionalRole: string;
  patients: ProfessionalPatient[];
};

export type ProfessionalPatientInput = {
  name: string;
  age: number;
  diagnosis: string;
  location: string;
  emergencyContact: string;
};

export type ProfessionalMedicationInput = {
  name: string;
  dose: string;
  purpose: string;
  time: string;
  frequencyType: MedicationFrequency;
  intervalHours?: number | null;
  weeklyDays: number[];
  reminderEnabled: boolean;
  reminderEmail: string;
};

export type ProfessionalVisitInput = {
  professional: string;
  role: string;
  date: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
  recurrenceType: VisitRecurrence;
  recurrenceGroupId?: string | null;
  weeklyDays: number[];
  monthlyDay?: number | null;
};

export type ProfessionalFamilyAccessInput = {
  name: string;
  email: string;
  relationship: string;
  accessLevel: AccessLevel;
  permissions: UserPermissions;
};

export type SignupForm = {
  email: string;
  password: string;
  fullName: string;
  patientName: string;
  patientAge: number;
  seniorCanConfirmMedications: boolean;
  seniorCanConfirmVisits: boolean;
};

export type DemoUserRow = {
  id: string;
  patient_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  initials: string;
};

type MembershipRow = {
  patient_id: string;
  user_id: string;
  role: UserRole;
  access_level: AccessLevel;
  can_manage_patient: boolean;
  can_manage_medications: boolean;
  can_confirm_medications: boolean;
  can_manage_visits: boolean;
  can_confirm_visits: boolean;
  can_manage_contacts: boolean;
  can_view_history: boolean;
  patients?: any;
  profiles?: any;
};

const supabase = createClient();

const fullPermissions: UserPermissions = {
  canManagePatient: true,
  canManageMedications: true,
  canConfirmMedications: true,
  canManageVisits: true,
  canConfirmVisits: true,
  canManageContacts: true,
  canViewHistory: true,
};

const viewerPermissions: UserPermissions = {
  canManagePatient: false,
  canManageMedications: false,
  canConfirmMedications: false,
  canManageVisits: false,
  canConfirmVisits: false,
  canManageContacts: false,
  canViewHistory: true,
};

export async function getDemoUsers() {
  const { data, error } = await supabase
    .from("demo_users")
    .select("id, patient_id, full_name, email, role, initials")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapDemoUser);
}

export async function getCurrentSessionUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return getRegisteredUserContext(user.id, user.email ?? "");
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("No se pudo iniciar sesión.");

  return getRegisteredUserContext(data.user.id, data.user.email ?? email);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signUpWithPatient(form: SignupForm) {
  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.fullName,
        patient_name: form.patientName,
        patient_age: form.patientAge,
        senior_can_confirm_medications: form.seniorCanConfirmMedications,
        senior_can_confirm_visits: form.seniorCanConfirmVisits,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("No se pudo crear la cuenta.");

  if (!data.session) {
    return {
      user: null,
      message:
        "Cuenta creada. Revisá tu email para confirmar la cuenta y después iniciá sesión.",
    };
  }

  const user = await bootstrapRegisteredUser(data.user.id, data.user.email ?? form.email, form);
  return { user, message: "Cuenta creada correctamente." };
}

export async function bootstrapRegisteredUser(
  userId: string,
  email: string,
  setup?: SignupForm,
) {
  const userMetadata = await getAuthUserMetadata();
  const fullName = setup?.fullName || userMetadata.full_name || email.split("@")[0];
  const patientName = setup?.patientName || userMetadata.patient_name || "Paciente";
  const patientAge = Number(setup?.patientAge ?? userMetadata.patient_age ?? 75);
  const seniorCanConfirmMedications = Boolean(
    setup?.seniorCanConfirmMedications ?? userMetadata.senior_can_confirm_medications,
  );
  const seniorCanConfirmVisits = Boolean(
    setup?.seniorCanConfirmVisits ?? userMetadata.senior_can_confirm_visits,
  );

  await upsertProfile(userId, fullName, "family");

  const existingMembership = await getFirstMembership();
  if (existingMembership) return mapRegisteredSession(existingMembership, email);

  const patientId = createClientUuid();
  const { error: patientError } = await supabase
    .from("patients")
    .insert({
      id: patientId,
      name: patientName,
      age: Number.isFinite(patientAge) ? patientAge : 75,
      diagnosis: "Sin diagnóstico cargado",
      emergency_contact: "",
      doctor: "",
      general_status: "En configuración",
      allergies: "Sin alergias registradas",
      mobility_risk: "Sin evaluación cargada",
      care_plan: "Plan de cuidado inicial pendiente de completar.",
      clinical_notes: "",
    });

  if (patientError) throw patientError;

  const { error: membershipError } = await supabase.from("patient_memberships").insert({
    patient_id: patientId,
    user_id: userId,
    role: "family",
    access_level: "full",
    ...toDbPermissions(fullPermissions),
  });

  if (membershipError) throw membershipError;

  await supabase.from("care_contacts").insert({
    patient_id: patientId,
    name: fullName,
    role: "Familiar administrador",
    email,
    status: "En línea",
    initials: getInitials(fullName),
    access_level: "full",
    invitation_status: "aceptada",
    ...toDbPermissions(fullPermissions),
  });

  if (seniorCanConfirmMedications || seniorCanConfirmVisits) {
    await supabase.from("care_contacts").insert({
      patient_id: patientId,
      name: patientName,
      role: "Persona mayor",
      email: "",
      status: "Disponible",
      initials: getInitials(patientName),
      access_level: "senior_limited",
      invitation_status: "sin cuenta",
      ...toDbPermissions({
        ...viewerPermissions,
        canConfirmMedications: seniorCanConfirmMedications,
        canConfirmVisits: seniorCanConfirmVisits,
      }),
    });
  }

  const membership = await getFirstMembership();
  if (!membership) throw new Error("No se pudo crear la membresía inicial.");

  return mapRegisteredSession(membership, email);
}

export async function getPendingInvitationsForCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return [];

  const { data, error } = await supabase
    .from("care_invitations")
    .select("*")
    .eq("status", "pending")
    .ilike("invitee_email", user.email);

  if (error) throw error;
  return (data ?? []).map(mapInvitation);
}

export async function acceptInvitation(invitation: CareInvitation) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user?.id || !user.email) throw new Error("Tenés que iniciar sesión para aceptar.");

  await upsertProfile(user.id, invitation.inviteeName, invitation.roleType);

  const { error: membershipError } = await supabase.from("patient_memberships").insert({
    patient_id: invitation.patientId,
    user_id: user.id,
    role: invitation.roleType,
    access_level: invitation.accessLevel,
    ...toDbPermissions(invitation.permissions),
  });

  if (membershipError) throw membershipError;

  const { error: inviteError } = await supabase
    .from("care_invitations")
    .update({
      status: "accepted",
      accepted_by_user_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (inviteError) throw inviteError;

  if (invitation.contactId) {
    await supabase
      .from("care_contacts")
      .update({ invitation_status: "aceptada" })
      .eq("id", invitation.contactId);
  }

  return getRegisteredUserContext(user.id, user.email);
}

async function getRegisteredUserContext(userId: string, email: string) {
  await ensureProfile(userId, email);
  const membership = await getFirstMembership();

  if (!membership) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return bootstrapRegisteredUser(userId, email, {
      email,
      password: "",
      fullName: user?.user_metadata?.full_name ?? email.split("@")[0],
      patientName: user?.user_metadata?.patient_name ?? "Paciente",
      patientAge: Number(user?.user_metadata?.patient_age ?? 75),
      seniorCanConfirmMedications: Boolean(user?.user_metadata?.senior_can_confirm_medications),
      seniorCanConfirmVisits: Boolean(user?.user_metadata?.senior_can_confirm_visits),
    });
  }

  return mapRegisteredSession(membership, email);
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
  medication: {
    name: string;
    dose: string;
    purpose: string;
    time: string;
    frequencyType: MedicationFrequency;
    intervalHours?: number | null;
    weeklyDays: number[];
    reminderEnabled: boolean;
    reminderEmail: string;
  },
) {
  const { data, error } = await supabase
    .from("medications")
    .insert({
      patient_id: patientId,
      name: medication.name,
      dose: medication.dose,
      purpose: medication.purpose,
      time: medication.time,
      status: "pendiente",
      frequency_type: medication.frequencyType,
      interval_hours: medication.intervalHours,
      weekly_days: medication.weeklyDays,
      reminder_enabled: medication.reminderEnabled,
      reminder_email: medication.reminderEmail,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMedication(data);
}

export async function createMedicationIntakes(
  patientId: string,
  medication: Medication,
  dates: string[],
) {
  const rows = dates.flatMap((date) =>
    getScheduledTimesForMedication(medication, date).map((scheduledTime) => ({
      patient_id: patientId,
      medication_id: medication.id,
      scheduled_date: date,
      scheduled_time: scheduledTime,
      status: "pendiente",
    })),
  );

  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from("medication_intakes")
    .upsert(rows, { onConflict: "medication_id,scheduled_date,scheduled_time" })
    .select();

  if (error) throw error;
  return (data ?? []).map(mapIntake);
}

export async function upsertMedicationIntake({
  patientId,
  medicationId,
  scheduledDate,
  scheduledTime,
  status,
}: {
  patientId: string;
  medicationId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: MedicationStatus;
}) {
  const { data, error } = await supabase
    .from("medication_intakes")
    .upsert(
      {
        patient_id: patientId,
        medication_id: medicationId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status,
        taken_at: status === "tomado" ? new Date().toISOString() : null,
      },
      { onConflict: "medication_id,scheduled_date,scheduled_time" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapIntake(data);
}

type VisitInput = {
  professional: string;
  role: string;
  date: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
  recurrenceType: VisitRecurrence;
  recurrenceGroupId?: string | null;
  weeklyDays: number[];
  monthlyDay?: number | null;
};

export async function createVisit(patientId: string, visit: VisitInput) {
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
      recurrence_type: visit.recurrenceType,
      recurrence_group_id: visit.recurrenceGroupId,
      weekly_days: visit.weeklyDays,
      monthly_day: visit.monthlyDay,
    })
    .select()
    .single();

  if (error) throw error;
  return mapVisit(data);
}

export async function createVisitSeries(patientId: string, visits: VisitInput[]) {
  const rows = visits.map((visit) => ({
    patient_id: patientId,
    professional: visit.professional,
    role: visit.role,
    visit_date: visit.date,
    visit_time: visit.time,
    procedures: visit.procedures,
    notes: visit.notes,
    status: visit.status,
    recurrence_type: visit.recurrenceType,
    recurrence_group_id: visit.recurrenceGroupId,
    weekly_days: visit.weeklyDays,
    monthly_day: visit.monthlyDay,
  }));

  const { data, error } = await supabase
    .from("visits")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []).map(mapVisit);
}

export async function updateVisitStatus(id: string, status: VisitStatus) {
  const { data, error } = await supabase
    .from("visits")
    .update({ status })
    .eq("id", id)
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
  email: string;
  status: CareContact["status"];
  initials: string;
  accessLevel: AccessLevel;
  permissions: UserPermissions;
  invitationStatus: CareContact["invitationStatus"];
}) {
  const { data, error } = await supabase
    .from("care_contacts")
    .insert({
      patient_id: patientId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      status: contact.status,
      initials: contact.initials,
      access_level: contact.accessLevel,
      invitation_status: contact.invitationStatus,
      ...toDbPermissions(contact.permissions),
    })
    .select()
    .single();

  if (error) throw error;
  return mapContact(data);
}

export async function createCareInvitation(
  patientId: string,
  invitation: {
    contactId?: string;
    inviteeEmail: string;
    inviteeName: string;
    roleLabel: string;
    roleType: UserRole;
    accessLevel: AccessLevel;
    permissions: UserPermissions;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("care_invitations")
    .insert({
      patient_id: patientId,
      contact_id: invitation.contactId,
      invitee_email: invitation.inviteeEmail,
      invitee_name: invitation.inviteeName,
      role_label: invitation.roleLabel,
      role: invitation.roleType,
      access_level: invitation.accessLevel,
      invited_by_user_id: user?.id,
      ...toDbPermissions(invitation.permissions),
    })
    .select()
    .single();

  if (error) throw error;
  return mapInvitation(data);
}

export async function createInvitationEmail(patientId: string, invitation: CareInvitation) {
  const subject = "Invitación a MEDICARE";
  const body = `Te invitaron a MEDICARE para acompañar el cuidado de un paciente. Registrate o iniciá sesión con este email (${invitation.inviteeEmail}) y aceptá la invitación pendiente.`;

  const { data, error } = await supabase
    .from("email_reminder_outbox")
    .insert({
      patient_id: patientId,
      recipient_email: invitation.inviteeEmail,
      subject,
      body,
      status: "queued",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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

export async function loadProfessionalWorkspaceData(): Promise<ProfessionalWorkspaceData | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) return null;

  await ensureProfile(user.id, user.email ?? "");

  const [profileResult, membershipsResult, assignmentsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("patient_memberships").select("patient_id").eq("user_id", user.id),
    supabase
      .from("patient_professional_assignments")
      .select("patient_id")
      .eq("professional_user_id", user.id)
      .eq("active", true),
  ]);

  const firstError = profileResult.error ?? membershipsResult.error ?? assignmentsResult.error;
  if (firstError) throw firstError;

  const patientIds = Array.from(
    new Set([
      ...(membershipsResult.data ?? []).map((row) => row.patient_id),
      ...(assignmentsResult.data ?? []).map((row) => row.patient_id),
    ]),
  ).filter(Boolean);

  const patients = await Promise.all(patientIds.map(loadProfessionalPatient));
  const profile = profileResult.data;
  const professionalName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Profesional";

  return {
    professionalName,
    professionalRole: profile?.role === "doctor" ? "Profesional de salud" : "Equipo de cuidado",
    patients,
  };
}

export async function createProfessionalPatient(
  form: ProfessionalPatientInput,
): Promise<ProfessionalPatient> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) throw new Error("Tenés que iniciar sesión para crear pacientes.");

  await ensureProfile(user.id, user.email ?? "");

  const patientId = createClientUuid();
  const { error: patientError } = await supabase.from("patients").insert({
    id: patientId,
    name: form.name,
    age: form.age,
    diagnosis: form.diagnosis,
    emergency_contact: form.emergencyContact,
    doctor: "",
    general_status: "Nuevo paciente",
    allergies: "Sin datos cargados",
    mobility_risk: form.location,
    care_plan: "Plan de cuidado pendiente de definir.",
    clinical_notes: "Paciente creado desde el panel profesional.",
  });

  if (patientError) throw patientError;

  const { error: membershipError } = await supabase.from("patient_memberships").insert({
    patient_id: patientId,
    user_id: user.id,
    role: "doctor",
    access_level: "full",
    ...toDbPermissions(fullPermissions),
  });

  if (membershipError) throw membershipError;

  const [contextResult, assignmentResult] = await Promise.all([
    supabase.from("patient_care_contexts").insert({
      patient_id: patientId,
      owner_user_id: user.id,
      context_type: "independent_professional",
      name: "Plan profesional independiente",
    }),
    supabase.from("patient_professional_assignments").insert({
      patient_id: patientId,
      professional_user_id: user.id,
      specialty: "",
      active: true,
    }),
  ]);

  const firstError = contextResult.error ?? assignmentResult.error;
  if (firstError) throw firstError;

  await createProfessionalHistory(patientId, {
    title: "Paciente agregado",
    detail: "Se creó la ficha inicial del paciente.",
    eventType: "nota",
  });

  return loadProfessionalPatient(patientId);
}

export async function updateProfessionalPatientProfile(
  patientId: string,
  updates: Pick<ProfessionalPatient, "generalStatus" | "allergies" | "carePlan" | "clinicalNotes">,
) {
  const { error } = await supabase
    .from("patients")
    .update({
      general_status: updates.generalStatus,
      allergies: updates.allergies,
      care_plan: updates.carePlan,
      clinical_notes: updates.clinicalNotes,
    })
    .eq("id", patientId);

  if (error) throw error;

  await createProfessionalHistory(patientId, {
    title: "Ficha actualizada",
    detail: "Se modificó la información clínica del paciente.",
    eventType: "nota",
  });

  return loadProfessionalPatient(patientId);
}

export async function createProfessionalMedication(
  patientId: string,
  medication: ProfessionalMedicationInput,
) {
  const createdMedication = await createMedication(patientId, medication);
  await createMedicationIntakes(patientId, createdMedication, getDateRange(0, 14));

  if (medication.reminderEnabled && medication.reminderEmail.trim()) {
    await Promise.all(
      getScheduledTimesForMedication(createdMedication, getDateOffset(0)).map(async (scheduledTime) => {
        const reminder = await createReminder(patientId, {
          medicationId: createdMedication.id,
          recipientEmail: medication.reminderEmail.trim(),
          scheduledTime,
        });
        await createReminderEmail(patientId, reminder);
      }),
    );
  }

  await createProfessionalHistory(patientId, {
    title: "Medicación agregada",
    detail: `${createdMedication.name} ${createdMedication.dose} a las ${createdMedication.time}.`,
    eventType: "medicacion",
  });

  return loadProfessionalPatient(patientId);
}

export async function updateMedicationPlanStatus(
  patientId: string,
  medicationId: string,
  scheduledTime: string,
  status: MedicationStatus,
) {
  const { data, error } = await supabase
    .from("medications")
    .update({ status })
    .eq("id", medicationId)
    .select()
    .single();

  if (error) throw error;

  await upsertMedicationIntake({
    patientId,
    medicationId,
    scheduledDate: getDateOffset(0),
    scheduledTime,
    status,
  });

  await createProfessionalHistory(patientId, {
    title: status === "tomado" ? "Toma confirmada" : "Toma no confirmada",
    detail: `${data.name} de las ${scheduledTime} quedó como ${status}.`,
    eventType: "medicacion",
  });

  return loadProfessionalPatient(patientId);
}

export async function deleteMedicationPlan(patientId: string, medicationId: string) {
  const { data: medication } = await supabase
    .from("medications")
    .select("name")
    .eq("id", medicationId)
    .maybeSingle();

  const { error } = await supabase.from("medications").delete().eq("id", medicationId);
  if (error) throw error;

  await createProfessionalHistory(patientId, {
    title: "Medicación retirada",
    detail: medication?.name ? `${medication.name} fue quitada del plan.` : "Se quitó una medicación.",
    eventType: "medicacion",
  });

  return loadProfessionalPatient(patientId);
}

export async function createProfessionalVisits(
  patientId: string,
  visits: ProfessionalVisitInput[],
) {
  const createdVisits = await createVisitSeries(patientId, visits);

  await createProfessionalHistory(patientId, {
    title: "Visita programada",
    detail: `${createdVisits.length} visita${createdVisits.length === 1 ? "" : "s"} agregada${createdVisits.length === 1 ? "" : "s"} a la agenda.`,
    eventType: "visita",
  });

  return loadProfessionalPatient(patientId);
}

export async function updateProfessionalVisitStatus(
  patientId: string,
  visitId: string,
  status: VisitStatus,
) {
  const visit = await updateVisitStatus(visitId, status);

  await createProfessionalHistory(patientId, {
    title: `Visita ${status}`,
    detail: `${visit.procedures} de las ${visit.time} quedó como ${status}.`,
    eventType: "visita",
  });

  return loadProfessionalPatient(patientId);
}

export async function deleteProfessionalVisit(patientId: string, visitId: string) {
  const { data: visit } = await supabase
    .from("visits")
    .select("visit_date, visit_time, procedures")
    .eq("id", visitId)
    .maybeSingle();

  const { error } = await supabase.from("visits").delete().eq("id", visitId);
  if (error) throw error;

  await createProfessionalHistory(patientId, {
    title: "Visita eliminada",
    detail: visit
      ? `${formatDateForDisplay(visit.visit_date)} ${normalizeTime(visit.visit_time)} fue quitada de agenda.`
      : "Se quitó una visita.",
    eventType: "visita",
  });

  return loadProfessionalPatient(patientId);
}

export async function createProfessionalObservation(patientId: string, observation: string) {
  const { error } = await supabase
    .from("patients")
    .update({ clinical_notes: observation })
    .eq("id", patientId);

  if (error) throw error;

  await createProfessionalHistory(patientId, {
    title: "Observación clínica",
    detail: observation,
    eventType: "nota",
  });

  return loadProfessionalPatient(patientId);
}

export async function createProfessionalFamilyAccess(
  patientId: string,
  access: ProfessionalFamilyAccessInput,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("patient_family_accesses").insert({
    patient_id: patientId,
    invited_by_user_id: user?.id,
    invitee_email: access.email,
    invitee_name: access.name,
    relationship: access.relationship,
    access_level: access.accessLevel,
    invitation_status: "pending",
    ...toDbPermissions(access.permissions),
  });

  if (error) throw error;

  const invitation = await createCareInvitation(patientId, {
    inviteeEmail: access.email,
    inviteeName: access.name,
    roleLabel: access.relationship || "Familiar",
    roleType: "family",
    accessLevel: access.accessLevel,
    permissions: access.permissions,
  });
  await createInvitationEmail(patientId, invitation);

  await createProfessionalHistory(patientId, {
    title: "Familiar invitado",
    detail: `${access.name} recibirá acceso ${access.accessLevel} al dashboard.`,
    eventType: "nota",
  });

  return loadProfessionalPatient(patientId);
}

async function loadProfessionalPatient(patientId: string): Promise<ProfessionalPatient> {
  const [baseData, historyResult, familyAccessesResult] = await Promise.all([
    loadMedicareData(patientId),
    supabase
      .from("patient_clinical_history")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("patient_family_accesses")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = historyResult.error ?? familyAccessesResult.error;
  if (firstError) throw firstError;

  return mapProfessionalPatient(
    baseData,
    (historyResult.data ?? []).map(mapClinicalHistory),
    (familyAccessesResult.data ?? []).map(mapFamilyAccess),
  );
}

async function createProfessionalHistory(
  patientId: string,
  event: { title: string; detail: string; eventType: EnterprisePatientHistory["type"] },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("patient_clinical_history").insert({
    patient_id: patientId,
    created_by_user_id: user?.id,
    event_type: event.eventType,
    title: event.title,
    detail: event.detail,
  });

  if (error) throw error;
}

export function mapDemoUser(row: DemoUserRow): SessionUser {
  const permissions =
    row.role === "senior"
      ? { ...viewerPermissions, canConfirmMedications: true, canConfirmVisits: true }
      : fullPermissions;

  return {
    id: row.id,
    patientId: row.patient_id,
    email: row.email,
    name: row.full_name,
    role: getRoleLabel(row.role),
    roleType: row.role,
    initials: row.initials,
    accessLevel: row.role === "senior" ? "senior_limited" : "full",
    permissions,
    isDemo: true,
  };
}

async function ensureProfile(userId: string, email: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (data) return;

  await upsertProfile(userId, email.split("@")[0], "family");
}

async function upsertProfile(userId: string, fullName: string, role: UserRole) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role,
    initials: getInitials(fullName),
  });

  if (error) throw error;
}

async function getFirstMembership() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  const { data, error } = await supabase
    .from("patient_memberships")
    .select("*, patients(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { ...data, profiles: profile } as MembershipRow;
}

async function getAuthUserMetadata() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.user_metadata ?? {};
}

function mapRegisteredSession(row: MembershipRow, email: string): SessionUser {
  const profile = row.profiles;
  const name = profile?.full_name ?? email.split("@")[0];

  return {
    id: row.user_id,
    patientId: row.patient_id,
    email,
    name,
    role: getRoleLabel(row.role),
    roleType: row.role,
    initials: profile?.initials ?? getInitials(name),
    accessLevel: row.access_level ?? "viewer",
    permissions: mapPermissions(row),
    isDemo: false,
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
    purpose: row.purpose ?? "",
    time: normalizeTime(row.time),
    status: row.status,
    frequencyType: row.frequency_type ?? "daily",
    intervalHours: row.interval_hours,
    weeklyDays: row.weekly_days ?? [],
    reminderEnabled: row.reminder_enabled ?? false,
    reminderEmail: row.reminder_email ?? "",
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
    recurrenceType: row.recurrence_type ?? "once",
    recurrenceGroupId: row.recurrence_group_id,
    weeklyDays: row.weekly_days ?? [],
    monthlyDay: row.monthly_day,
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
    email: row.email ?? "",
    accessLevel: row.access_level ?? "viewer",
    permissions: mapPermissions(row),
    invitationStatus: row.invitation_status ?? "sin cuenta",
    status: row.status,
    initials: row.initials,
  };
}

function mapInvitation(row: any): CareInvitation {
  return {
    id: row.id,
    patientId: row.patient_id,
    contactId: row.contact_id,
    inviteeEmail: row.invitee_email,
    inviteeName: row.invitee_name,
    roleLabel: row.role_label,
    roleType: row.role,
    accessLevel: row.access_level,
    permissions: mapPermissions(row),
    status: row.status,
    token: row.token,
    createdAt: row.created_at,
  };
}

function mapPermissions(row: any): UserPermissions {
  return {
    canManagePatient: row.can_manage_patient ?? false,
    canManageMedications: row.can_manage_medications ?? false,
    canConfirmMedications: row.can_confirm_medications ?? false,
    canManageVisits: row.can_manage_visits ?? false,
    canConfirmVisits: row.can_confirm_visits ?? false,
    canManageContacts: row.can_manage_contacts ?? false,
    canViewHistory: row.can_view_history ?? true,
  };
}

function toDbPermissions(permissions: UserPermissions) {
  return {
    can_manage_patient: permissions.canManagePatient,
    can_manage_medications: permissions.canManageMedications,
    can_confirm_medications: permissions.canConfirmMedications,
    can_manage_visits: permissions.canManageVisits,
    can_confirm_visits: permissions.canConfirmVisits,
    can_manage_contacts: permissions.canManageContacts,
    can_view_history: permissions.canViewHistory,
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
    scheduledTime: normalizeTime(row.scheduled_time),
    status: row.status,
    takenAt: row.taken_at,
    notes: row.notes,
  };
}

function mapProfessionalPatient(
  data: MedicareData,
  clinicalHistory: EnterprisePatientHistory[],
  familyAccesses: PatientFamilyAccess[],
): ProfessionalPatient {
  const contactAccesses = data.contacts
    .filter((contact) => contact.email || contact.role.toLowerCase().includes("familiar"))
    .map(mapContactToFamilyAccess);
  const mergedFamilyAccesses = mergeFamilyAccesses([...familyAccesses, ...contactAccesses]);
  const activityHistory: EnterprisePatientHistory[] = data.activityLog.map((log) => ({
    id: log.id,
    date: formatShortDateTime(log.createdAt),
    title: "Actividad",
    detail: log.message,
    type: "nota",
  }));

  return {
    id: data.patient.id ?? "",
    name: data.patient.name,
    age: data.patient.age,
    diagnosis: data.patient.diagnosis,
    location: data.patient.mobilityRisk || "Domicilio sin cargar",
    emergencyContact: data.patient.emergencyContact,
    generalStatus: data.patient.generalStatus,
    allergies: data.patient.allergies,
    carePlan: data.patient.carePlan,
    clinicalNotes: data.patient.clinicalNotes,
    medications: data.medications,
    visits: data.visits,
    history: [...clinicalHistory, ...activityHistory],
    familyAccesses: mergedFamilyAccesses,
  };
}

function mapClinicalHistory(row: any): EnterprisePatientHistory {
  return {
    id: row.id,
    date: formatShortDateTime(row.created_at),
    title: row.title,
    detail: row.detail,
    type: normalizeHistoryType(row.event_type),
  };
}

function mapFamilyAccess(row: any): PatientFamilyAccess {
  return {
    id: row.id,
    name: row.invitee_name || row.invitee_email || "Familiar invitado",
    email: row.invitee_email ?? "",
    relationship: row.relationship || "Familiar",
    accessLevel: row.access_level ?? "viewer",
    permissions: mapPermissions(row),
    invitationStatus: mapFamilyInvitationStatus(row.invitation_status),
  };
}

function mapContactToFamilyAccess(contact: CareContact): PatientFamilyAccess {
  return {
    id: `contact-${contact.id}`,
    name: contact.name,
    email: contact.email,
    relationship: contact.role,
    accessLevel: contact.accessLevel,
    permissions: contact.permissions,
    invitationStatus:
      contact.invitationStatus === "aceptada" || contact.invitationStatus === "rechazada"
        ? contact.invitationStatus
        : "pendiente",
  };
}

function mergeFamilyAccesses(accesses: PatientFamilyAccess[]) {
  const seen = new Set<string>();
  return accesses.filter((access) => {
    const key = access.email.trim().toLowerCase() || `${access.name}-${access.relationship}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeHistoryType(value: string): EnterprisePatientHistory["type"] {
  if (value === "medicacion" || value === "visita" || value === "alerta") return value;
  return "nota";
}

function mapFamilyInvitationStatus(value: string): PatientFamilyAccess["invitationStatus"] {
  if (value === "accepted" || value === "aceptada") return "aceptada";
  if (value === "declined" || value === "rechazada") return "rechazada";
  return "pendiente";
}

function getDateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function getDateRange(startOffset: number, days: number) {
  return Array.from({ length: days }, (_, index) => getDateOffset(startOffset + index));
}

export function getScheduledTimesForMedication(medication: Medication, date: string) {
  if (medication.frequencyType === "weekly") {
    const day = new Date(`${date}T00:00:00`).getDay();
    if (!medication.weeklyDays.includes(day)) return [];
    return [medication.time];
  }

  if (medication.frequencyType !== "interval" || !medication.intervalHours) {
    return [medication.time];
  }

  const [startHour, startMinute] = medication.time.split(":").map(Number);
  const times: string[] = [];

  for (let minutes = startHour * 60 + startMinute; minutes < 24 * 60; minutes += medication.intervalHours * 60) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }

  return times;
}

function normalizeTime(value: string) {
  return value?.slice(0, 5) ?? "";
}

function formatDateForDisplay(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRoleLabel(roleType: UserRole) {
  const labels: Record<UserRole, string> = {
    family: "Familiar responsable",
    doctor: "Médico",
    senior: "Paciente",
  };

  return labels[roleType];
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function createClientUuid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    "00000000-0000-4000-8000-000000000000"
  );
}
