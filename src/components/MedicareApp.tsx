"use client";

import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  Check,
  Clock,
  ClipboardCheck,
  HeartPulse,
  Loader2,
  LogIn,
  Mail,
  Pencil,
  Pill,
  Plus,
  Save,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Landing } from "@/components/Landing";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  contacts as defaultContacts,
  dayEvents,
  enterpriseDoctors,
  enterprisePatients,
  evolutionMetrics,
  initialAlerts,
  initialMedications,
  initialPatient,
  initialVisits,
  professionalPatients,
} from "@/data/mockData";
import {
  createActivityLog,
  createAlert,
  acceptInvitation,
  bootstrapRegisteredUser,
  createCareInvitation,
  createContact,
  createInvitationEmail,
  createMedication,
  createMedicationIntakes,
  createProfessionalFamilyAccess,
  createProfessionalMedication,
  createProfessionalObservation,
  createProfessionalPatient,
  createProfessionalVisits,
  createReminder,
  createReminderEmail,
  createVisitSeries,
  deleteMedicationPlan,
  deleteProfessionalVisit,
  getCurrentSessionUser,
  getDemoUsers,
  getPendingInvitationsForCurrentUser,
  getScheduledTimesForMedication,
  loadMedicareData,
  loadProfessionalWorkspaceData,
  signInWithEmail,
  signOut,
  signUpWithPatient,
  updateAlertResolved,
  updateMedicationPlanStatus,
  upsertMedicationIntake,
  updatePatient as savePatient,
  updateProfessionalPatientProfile,
  updateProfessionalVisitStatus,
  updateVisitStatus,
} from "@/lib/medicareData";
import type {
  AccessLevel,
  ActivityLog,
  AlertPriority,
  CareAlert,
  CareContact,
  CareInvitation,
  EnterpriseDoctor,
  EnterprisePatient,
  Medication,
  MedicationFrequency,
  MedicationIntake,
  MedicationReminder,
  MedicationStatus,
  Patient,
  PatientFamilyAccess,
  ProfessionalPatient,
  SectionId,
  SessionUser,
  UserPermissions,
  UserRole,
  Visit,
  VisitRecurrence,
  VisitStatus,
} from "@/types";

type MedicationForm = {
  name: string;
  dose: string;
  purpose: string;
  time: string;
  frequencyType: MedicationFrequency;
  intervalHours: number | null;
  weeklyDays: number[];
  reminderEnabled: boolean;
  reminderEmail: string;
};

type VisitForm = {
  professional: string;
  role: string;
  date: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
  recurrenceType: VisitRecurrence;
  weeklyDays: number[];
  monthlyDay: number;
};

type AlertForm = {
  title: string;
  detail: string;
  priority: AlertPriority;
};

type ContactForm = {
  name: string;
  role: string;
  email: string;
  roleType: UserRole;
  accessLevel: AccessLevel;
  permissions: UserPermissions;
  inviteWithAccount: boolean;
  status: CareContact["status"];
};

type LoginForm = {
  email: string;
  password: string;
};

type SignupForm = {
  email: string;
  password: string;
  fullName: string;
  patientName: string;
  patientAge: string;
  seniorCanConfirmMedications: boolean;
  seniorCanConfirmVisits: boolean;
};

type EnterpriseDoctorForm = {
  name: string;
  email: string;
  specialty: string;
};

type EnterprisePatientForm = {
  name: string;
  age: string;
  coverage: string;
  location: string;
  assignedDoctors: string[];
};

type ProfessionalPatientForm = {
  name: string;
  age: string;
  diagnosis: string;
  location: string;
  emergencyContact: string;
};

type ProfessionalMedicationForm = {
  name: string;
  dose: string;
  purpose: string;
  time: string;
  frequencyType: MedicationFrequency;
  intervalHours: number;
  weeklyDays: number[];
  reminderEnabled: boolean;
  reminderEmail: string;
};

type ProfessionalVisitForm = {
  date: string;
  time: string;
  procedures: string;
  notes: string;
  recurrenceType: VisitRecurrence;
  weeklyDays: number[];
  monthlyDay: number;
};

type FamilyAccessForm = {
  name: string;
  email: string;
  relationship: string;
  accessLevel: AccessLevel;
  canConfirmMedications: boolean;
  canConfirmVisits: boolean;
};

type ProfessionalScheduledVisit = {
  patientId: string;
  patientName: string;
  patientAge: number;
  patientStatus: string;
  visit: Visit;
};

type ProfessionalPersistence = {
  sourceLabel: string;
  onAddPatient: (form: ProfessionalPatientForm) => Promise<ProfessionalPatient>;
  onUpdatePatient: (
    patientId: string,
    updates: Pick<ProfessionalPatient, "generalStatus" | "allergies" | "carePlan" | "clinicalNotes">,
  ) => Promise<ProfessionalPatient>;
  onAddMedication: (
    patientId: string,
    form: ProfessionalMedicationForm,
  ) => Promise<ProfessionalPatient>;
  onRemoveMedication: (patientId: string, medicationId: string) => Promise<ProfessionalPatient>;
  onMedicationStatusChange: (
    patientId: string,
    medicationId: string,
    scheduledTime: string,
    status: MedicationStatus,
  ) => Promise<ProfessionalPatient>;
  onAddVisit: (patientId: string, form: ProfessionalVisitForm) => Promise<ProfessionalPatient>;
  onRemoveVisit: (patientId: string, visitId: string) => Promise<ProfessionalPatient>;
  onVisitStatusChange: (
    patientId: string,
    visitId: string,
    status: VisitStatus,
  ) => Promise<ProfessionalPatient>;
  onAddObservation: (patientId: string, observation: string) => Promise<ProfessionalPatient>;
  onAddFamilyAccess: (patientId: string, form: FamilyAccessForm) => Promise<ProfessionalPatient>;
};

const defaultActivityLog: ActivityLog[] = [];
const weekDays = [
  { label: "Dom", value: 0 },
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
];

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

const seniorLimitedPermissions: UserPermissions = {
  ...viewerPermissions,
  canConfirmMedications: true,
  canConfirmVisits: true,
};

const permissionOptions: { key: keyof UserPermissions; label: string }[] = [
  { key: "canManagePatient", label: "Editar datos del paciente" },
  { key: "canManageMedications", label: "Agregar o editar medicación" },
  { key: "canConfirmMedications", label: "Marcar medicación como tomada" },
  { key: "canManageVisits", label: "Agendar o editar visitas" },
  { key: "canConfirmVisits", label: "Confirmar visitas realizadas" },
  { key: "canManageContacts", label: "Agregar familiares/cuidadores" },
  { key: "canViewHistory", label: "Ver historial y días pasados" },
];

type MedicareAppMode = "landing" | "app" | "enterprise" | "professional";

type MedicareAppProps = {
  initialMode?: MedicareAppMode;
  initialSection?: SectionId;
};

const sectionRoutes: Record<SectionId, string> = {
  dashboard: "/dashboard",
  medicacion: "/medicacion",
  visitas: "/visitas",
  alertas: "/alertas",
  familia: "/familia",
  historial: "/historial",
};

const demoSessionStorageKey = "medicare-demo-session";

export function MedicareApp({
  initialMode = "landing",
  initialSection = "dashboard",
}: MedicareAppProps) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [entered, setEntered] = useState(initialMode !== "landing");
  const [enterpriseMode, setEnterpriseMode] = useState(initialMode === "enterprise");
  const [professionalMode, setProfessionalMode] = useState(initialMode === "professional");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [demoUsers, setDemoUsers] = useState<SessionUser[]>([]);
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [alerts, setAlerts] = useState<CareAlert[]>(initialAlerts);
  const [contacts, setContacts] = useState<CareContact[]>(defaultContacts);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(defaultActivityLog);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [intakes, setIntakes] = useState<MedicationIntake[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CareInvitation[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    setEntered(initialMode !== "landing");
    setEnterpriseMode(initialMode === "enterprise");
    setProfessionalMode(initialMode === "professional");
    setActiveSection(initialSection);
  }, [initialMode, initialSection]);

  useEffect(() => {
    Promise.all([getDemoUsers(), getCurrentSessionUser()])
      .then(async ([users, currentUser]) => {
        setDemoUsers(users);
        if (currentUser?.patientId) {
          setSession(currentUser);
          setEntered(true);
          await hydratePatientData(currentUser.patientId);
          const invitations = await getPendingInvitationsForCurrentUser();
          setPendingInvitations(invitations);
          return;
        }

        const storedDemoUser = getStoredDemoUser();
        if (storedDemoUser?.patientId) {
          setSession(storedDemoUser);
          setEntered(true);
          await hydratePatientData(storedDemoUser.patientId);
        }
      })
      .catch((error) => setAppError(error.message))
      .finally(() => setHydrated(true));
  }, []);

  const hydratePatientData = async (patientId: string) => {
    setLoadingData(true);
    setAppError(null);

    try {
      const data = await loadMedicareData(patientId);
      setPatient(data.patient);
      setMedications(data.medications);
      setVisits(data.visits);
      setAlerts(data.alerts);
      setContacts(data.contacts);
      setActivityLog(data.activityLog);
      setReminders(data.reminders);
      setIntakes(data.intakes);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo cargar Supabase.");
    } finally {
      setLoadingData(false);
    }
  };

  const visibleMedications = useMemo(
    () => getDailyMedications(medications, intakes, selectedDate),
    [intakes, medications, selectedDate],
  );

  const takenCount = visibleMedications.filter(
    (medication) => medication.status === "tomado",
  ).length;
  const adherence =
    visibleMedications.length === 0
      ? 0
      : Math.round((takenCount / visibleMedications.length) * 100);
  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const nextMedication =
    [...visibleMedications]
      .filter((medication) => medication.status !== "tomado")
      .sort((a, b) => a.time.localeCompare(b.time))[0] ?? visibleMedications[0];
  const lastVisit =
    visits.find((visit) => visit.status === "realizada") ?? visits[0] ?? initialVisits[0];
  const resolvedAlerts = alerts.filter((alert) => alert.resolved).length;

  const dynamicMetrics = useMemo(
    () =>
      evolutionMetrics.map((metric) =>
        metric.label === "Adherencia a medicación"
          ? { ...metric, value: `${adherence}%`, percent: adherence }
          : metric.label === "Visitas realizadas"
            ? {
                ...metric,
                value: String(visits.filter((visit) => visit.status === "realizada").length),
                trend: `${visits.length} visitas registradas`,
                percent: Math.min(
                  100,
                  Math.round(
                    (visits.filter((visit) => visit.status === "realizada").length /
                      Math.max(visits.length, 1)) *
                      100,
                  ),
                ),
              }
            : metric.label === "Alertas resueltas"
              ? {
                  ...metric,
                  value: String(resolvedAlerts),
                  trend: `${activeAlerts.length} alertas activas`,
                  percent: Math.min(
                    100,
                    Math.round((resolvedAlerts / Math.max(alerts.length, 1)) * 100),
                  ),
                }
              : metric,
      ),
    [activeAlerts.length, adherence, alerts.length, resolvedAlerts, visits],
  );

  const addLog = async (message: string) => {
    if (!patient.id) return;

    const log = await createActivityLog(patient.id, message);
    setActivityLog((current) => [log, ...current].slice(0, 10));
  };

  const handleLogin = async (user: SessionUser) => {
    if (!user.patientId) {
      setAppError("El usuario demo no tiene paciente asignado.");
      return;
    }

    setSession(user);
    if (user.isDemo) storeDemoUser(user);
    setEntered(true);
    setActiveSection("dashboard");
    router.push("/dashboard");
    await hydratePatientData(user.patientId);
  };

  const handleEmailLogin = async (form: LoginForm) => {
    setLoadingData(true);
    setAppError(null);

    try {
      const user = await signInWithEmail(form.email.trim(), form.password);
      setSession(user);
      clearStoredDemoUser();
      setEntered(true);
      setActiveSection("dashboard");
      router.push("/dashboard");
      if (user.patientId) await hydratePatientData(user.patientId);
      setPendingInvitations(await getPendingInvitationsForCurrentUser());
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignup = async (form: SignupForm) => {
    setLoadingData(true);
    setAppError(null);

    try {
      const result = await signUpWithPatient({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        patientName: form.patientName.trim(),
        patientAge: Number(form.patientAge) || 75,
        seniorCanConfirmMedications: form.seniorCanConfirmMedications,
        seniorCanConfirmVisits: form.seniorCanConfirmVisits,
      });

      if (!result.user) {
        setAppError(result.message);
        return;
      }

      setSession(result.user);
      clearStoredDemoUser();
      setEntered(true);
      setActiveSection("dashboard");
      router.push("/dashboard");
      if (result.user.patientId) await hydratePatientData(result.user.patientId);
      setPendingInvitations(await getPendingInvitationsForCurrentUser());
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo crear la cuenta.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAcceptInvitation = async (invitation: CareInvitation) => {
    setLoadingData(true);
    setAppError(null);

    try {
      const user = await acceptInvitation(invitation);
      setSession(user);
      clearStoredDemoUser();
      setEntered(true);
      setActiveSection("dashboard");
      router.push("/dashboard");
      setPendingInvitations((current) => current.filter((item) => item.id !== invitation.id));
      if (user.patientId) await hydratePatientData(user.patientId);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "No se pudo aceptar la invitación.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    if (!session?.isDemo) await signOut().catch(() => undefined);
    clearStoredDemoUser();
    setSession(null);
    setEntered(false);
    setEnterpriseMode(false);
    setProfessionalMode(false);
    setPendingInvitations([]);
    router.push("/");
  };

  const handleEnterpriseDemo = () => {
    setEnterpriseMode(true);
    setProfessionalMode(false);
    setEntered(true);
    setSession(null);
    clearStoredDemoUser();
    router.push("/empresas");
  };

  const handleProfessionalDemo = () => {
    setProfessionalMode(true);
    setEnterpriseMode(false);
    setEntered(true);
    setSession(null);
    clearStoredDemoUser();
    router.push("/profesional");
  };

  const handleEnterFromLanding = () => {
    setEntered(true);
    router.push("/ingresar");
  };

  const handleEnterpriseExit = () => {
    setEnterpriseMode(false);
    setProfessionalMode(false);
    setEntered(true);
    router.push("/ingresar");
  };

  const handleSectionChange = (section: SectionId) => {
    setActiveSection(section);
    router.push(sectionRoutes[section]);
  };

  const markMedicationAsTaken = async (medication: Medication) => {
    const baseMedication = medications.find((item) => item.id === medication.id);
    if (!patient.id) return;

    const intake = await upsertMedicationIntake({
      patientId: patient.id,
      medicationId: medication.id,
      scheduledDate: selectedDate,
      scheduledTime: medication.time,
      status: "tomado",
    });

    setIntakes((current) =>
      [intake, ...current.filter((item) => item.id !== intake.id)].filter(
        (item, index, array) =>
          array.findIndex(
            (candidate) =>
              candidate.medicationId === item.medicationId &&
              candidate.scheduledDate === item.scheduledDate &&
              candidate.scheduledTime === item.scheduledTime,
          ) === index,
      ),
    );
    if (baseMedication) await addLog(`${baseMedication.name} de las ${medication.time} marcada como tomada.`);
  };

  const addMedication = async (form: MedicationForm) => {
    if (!patient.id) return;
    const medication = await createMedication(patient.id, {
      name: form.name.trim(),
      dose: form.dose.trim(),
      purpose: form.purpose.trim(),
      time: form.time,
      frequencyType: form.frequencyType,
      intervalHours: form.frequencyType === "interval" ? form.intervalHours : 24,
      weeklyDays: form.frequencyType === "weekly" ? form.weeklyDays : [],
      reminderEnabled: form.reminderEnabled,
      reminderEmail: form.reminderEnabled ? form.reminderEmail.trim() : "",
    });
    const plannedIntakes = await createMedicationIntakes(
      patient.id,
      medication,
      getDateRange(0, 14),
    );
    const createdReminders =
      form.reminderEnabled && form.reminderEmail.trim()
        ? await Promise.all(
            getReminderTimesForMedication(medication).map(async (scheduledTime) => {
              const reminder = await createReminder(patient.id!, {
                medicationId: medication.id,
                recipientEmail: form.reminderEmail.trim(),
                scheduledTime,
                createdByDemoUser: session?.id,
              });
              await createReminderEmail(patient.id!, reminder);
              return reminder;
            }),
          )
        : [];

    setMedications((current) =>
      [...current, medication].sort((a, b) => a.time.localeCompare(b.time)),
    );
    setIntakes((current) => [...plannedIntakes, ...current]);
    if (createdReminders.length > 0) {
      setReminders((current) =>
        [...current, ...createdReminders].sort((a, b) =>
          a.scheduledTime.localeCompare(b.scheduledTime),
        ),
      );
    }
    await addLog(
      `Nueva medicación registrada: ${medication.name} (${formatMedicationFrequency(medication)}).`,
    );
  };

  const resolveAlert = async (id: string) => {
    const alert = alerts.find((item) => item.id === id);
    const updatedAlert = await updateAlertResolved(id, true);
    setAlerts((current) =>
      current.map((item) => (item.id === id ? updatedAlert : item)),
    );
    if (alert) await addLog(`Alerta resuelta: ${alert.title}.`);
  };

  const contactAboutAlert = async (id: string) => {
    const alert = alerts.find((item) => item.id === id);
    if (alert) await addLog(`Contacto iniciado por alerta: ${alert.title}.`);
  };

  const addAlert = async (form: AlertForm) => {
    if (!patient.id) return;
    const alert = await createAlert(patient.id, {
      title: form.title.trim(),
      detail: form.detail.trim(),
      priority: form.priority,
    });
    setAlerts((current) => [alert, ...current]);
    await addLog(`Nueva alerta cargada: ${alert.title}.`);
  };

  const addVisit = async (form: VisitForm) => {
    if (!patient.id) return;
    const recurrenceGroupId =
      form.recurrenceType === "once" ? null : createClientUuid();
    const dates = getVisitSeriesDates(form);
    const createdVisits = await createVisitSeries(
      patient.id,
      dates.map((date) => ({
        professional: form.professional.trim(),
        role: form.role.trim(),
        date,
        time: form.time,
        procedures: form.procedures.trim(),
        notes: form.notes.trim(),
        status: form.recurrenceType === "once" ? form.status : "pendiente",
        recurrenceType: form.recurrenceType,
        recurrenceGroupId,
        weeklyDays: form.recurrenceType === "weekly" ? form.weeklyDays : [],
        monthlyDay: form.recurrenceType === "monthly" ? form.monthlyDay : null,
      })),
    );
    setVisits((current) => [...createdVisits, ...current]);
    await addLog(
      `${createdVisits.length} visita${createdVisits.length === 1 ? "" : "s"} registrada${createdVisits.length === 1 ? "" : "s"}: ${form.professional.trim()} (${formatVisitRecurrence(form)}).`,
    );
  };

  const changeVisitStatus = async (id: string, status: VisitStatus) => {
    const updatedVisit = await updateVisitStatus(id, status);
    setVisits((current) =>
      current.map((visit) => (visit.id === updatedVisit.id ? updatedVisit : visit)),
    );
    await addLog(`Visita actualizada: ${updatedVisit.professional} (${updatedVisit.status}).`);
  };

  const addContact = async (form: ContactForm) => {
    if (!patient.id) return;
    const contact = await createContact(patient.id, {
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      status: form.status,
      initials: getInitials(form.name),
      accessLevel: form.accessLevel,
      permissions: form.permissions,
      invitationStatus: form.inviteWithAccount ? "pendiente" : "sin cuenta",
    });

    if (form.inviteWithAccount && form.email.trim() && !session?.isDemo) {
      const invitation = await createCareInvitation(patient.id, {
        contactId: contact.id,
        inviteeEmail: form.email.trim(),
        inviteeName: form.name.trim(),
        roleLabel: form.role.trim(),
        roleType: form.roleType,
        accessLevel: form.accessLevel,
        permissions: form.permissions,
      });
      await createInvitationEmail(patient.id, invitation);
    }

    setContacts((current) => [...current, contact]);
    await addLog(
      form.inviteWithAccount
        ? session?.isDemo
          ? `Invitación demo simulada para ${contact.email}.`
          : `Invitación enviada a ${contact.email}.`
        : `Nuevo contacto agregado: ${contact.name}.`,
    );
  };

  const updatePatient = async (updatedPatient: Patient) => {
    const savedPatient = await savePatient(updatedPatient);
    setPatient(savedPatient);
    await addLog(`Datos del paciente actualizados: ${savedPatient.name}.`);
  };

  if (!entered) {
    return <Landing onEnter={handleEnterFromLanding} />;
  }

  if (enterpriseMode) {
    return <EnterprisePortal onExit={handleEnterpriseExit} />;
  }

  if (professionalMode) {
    return <ProfessionalPortal onExit={handleEnterpriseExit} />;
  }

  if (!session) {
    return (
      <LoginScreen
        demoUsers={demoUsers}
        pendingInvitations={pendingInvitations}
        loading={!hydrated || loadingData}
        error={appError}
        onDemoLogin={handleLogin}
        onEmailLogin={handleEmailLogin}
        onSignup={handleSignup}
        onAcceptInvitation={handleAcceptInvitation}
        onEnterpriseDemo={handleEnterpriseDemo}
        onProfessionalDemo={handleProfessionalDemo}
      />
    );
  }

  if (session.roleType === "senior") {
    return (
      <SeniorPortal
        patient={patient}
        baseMedications={medications}
        intakes={intakes}
        visits={visits}
        reminders={reminders}
        loading={loadingData}
        error={appError}
        permissions={session.permissions}
        onMarkTaken={markMedicationAsTaken}
        onVisitStatusChange={changeVisitStatus}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      patient={patient}
      user={session}
      onLogout={handleLogout}
    >
      {pendingInvitations.length > 0 ? (
        <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900">
          <p className="font-bold">Tenés invitaciones pendientes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingInvitations.map((invitation) => (
              <button
                key={invitation.id}
                onClick={() => handleAcceptInvitation(invitation)}
                disabled={loadingData}
                className="rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                Aceptar acceso como {invitation.roleLabel}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {loadingData ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          <Loader2 className="animate-spin" size={18} />
          Sincronizando con Supabase...
        </div>
      ) : null}
      {appError ? (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {appError}
        </div>
      ) : null}
      {activeSection === "dashboard" ? (
        <Dashboard
          adherence={adherence}
          patient={patient}
          userRole={session.roleType}
          nextMedication={nextMedication}
          lastVisit={lastVisit}
          activeAlerts={activeAlerts}
          activityLog={activityLog}
          onPatientUpdate={updatePatient}
        />
      ) : null}
      {activeSection === "medicacion" ? (
        <MedicationSection
          medications={visibleMedications}
          baseMedications={medications}
          reminders={reminders}
          intakes={intakes}
          visits={visits}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          adherence={adherence}
          onAddMedication={addMedication}
          onMarkTaken={markMedicationAsTaken}
          canEdit={session.permissions.canManageMedications}
          canConfirm={session.permissions.canConfirmMedications}
        />
      ) : null}
      {activeSection === "visitas" ? (
        <VisitsSection
          visits={visits}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onAddVisit={addVisit}
          onVisitStatusChange={changeVisitStatus}
          canEdit={session.permissions.canManageVisits}
          canConfirm={session.permissions.canConfirmVisits}
        />
      ) : null}
      {activeSection === "alertas" ? (
        <AlertsSection
          alerts={alerts}
          onAddAlert={addAlert}
          onContact={contactAboutAlert}
          onResolve={resolveAlert}
        />
      ) : null}
      {activeSection === "familia" ? (
        <FamilySection
          contacts={contacts}
          onAddContact={addContact}
          canEdit={session.permissions.canManageContacts}
        />
      ) : null}
      {activeSection === "historial" ? (
        <EvolutionSection metrics={dynamicMetrics} activityLog={activityLog} />
      ) : null}
    </AppShell>
  );
}

function ProfessionalPortal({ onExit }: { onExit: () => void }) {
  const [workspaceData, setWorkspaceData] = useState<{
    professionalName: string;
    professionalRole: string;
    patients: ProfessionalPatient[];
  }>({
    professionalName: "Camila Ríos",
    professionalRole: "Enfermería domiciliaria",
    patients: professionalPatients,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadProfessionalWorkspaceData()
      .then((data) => {
        if (cancelled || !data) return;
        setWorkspaceData({
          professionalName: data.professionalName,
          professionalRole: data.professionalRole,
          patients: data.patients,
        });
        setIsConnected(true);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar Supabase.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistence: ProfessionalPersistence | undefined = isConnected
    ? {
        sourceLabel: "Conectado a Supabase",
        onAddPatient: async (form) =>
          createProfessionalPatient({
            name: form.name.trim(),
            age: Number(form.age) || 75,
            diagnosis: form.diagnosis.trim(),
            location: form.location.trim(),
            emergencyContact: form.emergencyContact.trim(),
          }),
        onUpdatePatient: updateProfessionalPatientProfile,
        onAddMedication: async (patientId, form) =>
          createProfessionalMedication(patientId, {
            name: form.name.trim(),
            dose: form.dose.trim(),
            purpose: form.purpose.trim(),
            time: form.time,
            frequencyType: form.frequencyType,
            intervalHours: form.frequencyType === "interval" ? form.intervalHours : 24,
            weeklyDays: form.frequencyType === "weekly" ? form.weeklyDays : [],
            reminderEnabled: form.reminderEnabled,
            reminderEmail: form.reminderEnabled ? form.reminderEmail.trim() : "",
          }),
        onRemoveMedication: deleteMedicationPlan,
        onMedicationStatusChange: updateMedicationPlanStatus,
        onAddVisit: async (patientId, form) => {
          const recurrenceGroupId =
            form.recurrenceType === "once" ? null : createClientUuid();
          const dates = getVisitSeriesDates(form);
          return createProfessionalVisits(
            patientId,
            dates.map((date) => ({
              professional: workspaceData.professionalName,
              role: workspaceData.professionalRole,
              date,
              time: form.time,
              procedures: form.procedures.trim(),
              notes: form.notes.trim(),
              status: "pendiente",
              recurrenceType: form.recurrenceType,
              recurrenceGroupId,
              weeklyDays: form.recurrenceType === "weekly" ? form.weeklyDays : [],
              monthlyDay: form.recurrenceType === "monthly" ? form.monthlyDay : null,
            })),
          );
        },
        onRemoveVisit: deleteProfessionalVisit,
        onVisitStatusChange: updateProfessionalVisitStatus,
        onAddObservation: createProfessionalObservation,
        onAddFamilyAccess: async (patientId, form) => {
          const access = buildFamilyAccess(form);
          return createProfessionalFamilyAccess(patientId, {
            name: access.name,
            email: access.email,
            relationship: access.relationship,
            accessLevel: access.accessLevel,
            permissions: access.permissions,
          });
        },
      }
    : undefined;

  return (
    <ProfessionalWorkspace
      initialPatients={workspaceData.patients}
      professionalName={workspaceData.professionalName}
      professionalRole={workspaceData.professionalRole}
      contextLabel="Profesional independiente"
      heading="Gestión de pacientes propios"
      description="Agenda, medicación, observaciones e historial clínico digital para quienes trabajan con varios pacientes de manera independiente."
      loading={loading}
      error={error}
      persistence={persistence}
      onExit={onExit}
      exitLabel="Volver al ingreso"
    />
  );
}

function ProfessionalWorkspace({
  initialPatients,
  professionalName,
  professionalRole,
  contextLabel,
  heading,
  description,
  loading = false,
  error,
  persistence,
  onExit,
  exitLabel,
  onBack,
  backLabel,
}: {
  initialPatients: ProfessionalPatient[];
  professionalName: string;
  professionalRole: string;
  contextLabel: string;
  heading: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  persistence?: ProfessionalPersistence;
  onExit: () => void;
  exitLabel: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  const [patients, setPatients] = useState<ProfessionalPatient[]>(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [savingLabel, setSavingLabel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resumen" | "pacientes" | "visitas" | "actividad">(
    "resumen",
  );

  useEffect(() => {
    setPatients(initialPatients);
    setSelectedPatientId((current) =>
      initialPatients.some((patient) => patient.id === current)
        ? current
        : initialPatients[0]?.id ?? "",
    );
  }, [initialPatients]);

  const visiblePatients = patients.filter((patient) =>
    [patient.name, patient.diagnosis, patient.location, patient.generalStatus]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const selectedPatient =
    visiblePatients.find((patient) => patient.id === selectedPatientId) ??
    visiblePatients[0] ??
    patients[0];
  const scheduledVisits = getProfessionalScheduledVisits(patients);
  const todaysVisits = patients.reduce(
    (total, patient) => total + patient.visits.filter((visit) => visit.status === "pendiente").length,
    0,
  );
  const pendingMedications = patients.reduce(
    (total, patient) =>
      total + patient.medications.filter((medication) => medication.status !== "tomado").length,
    0,
  );
  const averageAdherence = Math.round(
    patients.reduce((total, patient) => total + getProfessionalAdherence(patient), 0) /
      Math.max(patients.length, 1),
  );

  const replacePatient = (updatedPatient: ProfessionalPatient) => {
    setPatients((current) =>
      current.some((patient) => patient.id === updatedPatient.id)
        ? current.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient))
        : [updatedPatient, ...current],
    );
    setSelectedPatientId(updatedPatient.id);
  };

  const handlePersistedAction = async (
    label: string,
    action: () => Promise<ProfessionalPatient>,
  ) => {
    setSavingLabel(label);
    setWorkspaceError(null);
    try {
      replacePatient(await action());
    } catch (actionError) {
      setWorkspaceError(
        actionError instanceof Error ? actionError.message : "No se pudo guardar en Supabase.",
      );
    } finally {
      setSavingLabel(null);
    }
  };

  const addPatient = async (form: ProfessionalPatientForm) => {
    if (persistence) {
      await handlePersistedAction("Creando paciente...", () => persistence.onAddPatient(form));
      return;
    }

    const patient: ProfessionalPatient = {
      id: `professional-patient-${Date.now()}`,
      name: form.name.trim(),
      age: Number(form.age) || 75,
      diagnosis: form.diagnosis.trim(),
      location: form.location.trim(),
      emergencyContact: form.emergencyContact.trim(),
      generalStatus: "Nuevo paciente",
      allergies: "Sin datos cargados",
      carePlan: "Plan de cuidado pendiente de definir.",
      clinicalNotes: "Paciente creado desde el panel profesional.",
      medications: [],
      visits: [],
      history: [
        {
          id: `professional-history-${Date.now()}`,
          date: getShortTimestamp(),
          title: "Paciente agregado",
          detail: "Se creó la ficha inicial del paciente.",
          type: "nota",
        },
      ],
      familyAccesses: [],
    };
    setPatients((current) => [patient, ...current]);
    setSelectedPatientId(patient.id);
  };

  const updatePatient = async (
    patientId: string,
    updates: Pick<ProfessionalPatient, "generalStatus" | "allergies" | "carePlan" | "clinicalNotes">,
  ) => {
    if (persistence) {
      await handlePersistedAction("Guardando ficha...", () =>
        persistence.onUpdatePatient(patientId, updates),
      );
      return;
    }

    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              ...updates,
              history: [
                {
                  id: `professional-history-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Ficha actualizada",
                  detail: "Se modificó la información clínica del paciente.",
                  type: "nota",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  const addMedication = async (patientId: string, form: ProfessionalMedicationForm) => {
    if (persistence) {
      await handlePersistedAction("Guardando medicación...", () =>
        persistence.onAddMedication(patientId, form),
      );
      return;
    }

    const medication: Medication = {
      id: `professional-medication-${Date.now()}`,
      name: form.name.trim(),
      dose: form.dose.trim(),
      purpose: form.purpose.trim(),
      time: form.time,
      status: "pendiente",
      frequencyType: form.frequencyType,
      intervalHours: form.frequencyType === "interval" ? form.intervalHours : 24,
      weeklyDays: form.frequencyType === "weekly" ? form.weeklyDays : [],
      reminderEnabled: form.reminderEnabled,
      reminderEmail: form.reminderEnabled ? form.reminderEmail.trim() : "",
    };

    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              medications: [...patient.medications, medication].sort((a, b) =>
                a.time.localeCompare(b.time),
              ),
              history: [
                {
                  id: `professional-history-med-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Medicación agregada",
                  detail: `${medication.name} ${medication.dose} a las ${medication.time}.`,
                  type: "medicacion",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  const removeMedication = async (patientId: string, medicationId: string) => {
    if (persistence) {
      await handlePersistedAction("Quitando medicación...", () =>
        persistence.onRemoveMedication(patientId, medicationId),
      );
      return;
    }

    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId) return patient;
        const medication = patient.medications.find((item) => item.id === medicationId);
        return {
          ...patient,
          medications: patient.medications.filter((item) => item.id !== medicationId),
          history: [
            {
              id: `professional-history-remove-med-${Date.now()}`,
              date: getShortTimestamp(),
              title: "Medicación retirada",
              detail: medication ? `${medication.name} fue quitada del plan.` : "Se quitó una medicación.",
              type: "medicacion",
            },
            ...patient.history,
          ],
        };
      }),
    );
  };

  const updateMedicationStatus = (
    patientId: string,
    medicationId: string,
    status: MedicationStatus,
  ) => {
    if (persistence) {
      const medication = patients
        .find((patient) => patient.id === patientId)
        ?.medications.find((item) => item.id === medicationId);
      void handlePersistedAction("Actualizando toma...", () =>
        persistence.onMedicationStatusChange(
          patientId,
          medicationId,
          medication?.time ?? "08:00",
          status,
        ),
      );
      return;
    }

    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId) return patient;
        const medication = patient.medications.find((item) => item.id === medicationId);
        return {
          ...patient,
          medications: patient.medications.map((item) =>
            item.id === medicationId ? { ...item, status } : item,
          ),
          history: [
            {
              id: `professional-history-status-med-${Date.now()}`,
              date: getShortTimestamp(),
              title: status === "tomado" ? "Toma confirmada" : "Toma no confirmada",
              detail: medication
                ? `${medication.name} de las ${medication.time} quedó como ${status}.`
                : `Una medicación quedó como ${status}.`,
              type: "medicacion",
            },
            ...patient.history,
          ],
        };
      }),
    );
  };

  const addVisit = async (patientId: string, form: ProfessionalVisitForm) => {
    if (persistence) {
      await handlePersistedAction("Agendando visita...", () =>
        persistence.onAddVisit(patientId, form),
      );
      return;
    }

    const dates = getVisitSeriesDates(form);
    const recurrenceGroupId = form.recurrenceType === "once" ? null : createClientUuid();
    const createdVisits: Visit[] = dates.map((date, index) => ({
      id: `professional-visit-${Date.now()}-${index}`,
      professional: professionalName,
      role: professionalRole,
      date: formatSelectedDate(date),
      dateIso: date,
      time: form.time,
      procedures: form.procedures.trim(),
      notes: form.notes.trim(),
      status: "pendiente",
      recurrenceType: form.recurrenceType,
      recurrenceGroupId,
      weeklyDays: form.recurrenceType === "weekly" ? form.weeklyDays : [],
      monthlyDay: form.recurrenceType === "monthly" ? form.monthlyDay : null,
    }));

    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              visits: [...patient.visits, ...createdVisits].sort(compareVisitsBySchedule),
              history: [
                {
                  id: `professional-history-visit-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Visita programada",
                  detail: `${createdVisits.length} visita${createdVisits.length === 1 ? "" : "s"} agregada${createdVisits.length === 1 ? "" : "s"} a la agenda.`,
                  type: "visita",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  const removeVisit = async (patientId: string, visitId: string) => {
    if (persistence) {
      await handlePersistedAction("Quitando visita...", () =>
        persistence.onRemoveVisit(patientId, visitId),
      );
      return;
    }

    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId) return patient;
        const visit = patient.visits.find((item) => item.id === visitId);
        return {
          ...patient,
          visits: patient.visits.filter((item) => item.id !== visitId),
          history: [
            {
              id: `professional-history-remove-visit-${Date.now()}`,
              date: getShortTimestamp(),
              title: "Visita eliminada",
              detail: visit ? `${visit.date} ${visit.time} fue quitada de agenda.` : "Se quitó una visita.",
              type: "visita",
            },
            ...patient.history,
          ],
        };
      }),
    );
  };

  const updateVisit = async (patientId: string, visitId: string, status: VisitStatus) => {
    if (persistence) {
      await handlePersistedAction("Actualizando visita...", () =>
        persistence.onVisitStatusChange(patientId, visitId, status),
      );
      return;
    }

    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId) return patient;
        const visit = patient.visits.find((item) => item.id === visitId);
        return {
          ...patient,
          visits: patient.visits.map((item) =>
            item.id === visitId ? { ...item, status } : item,
          ),
          history: [
            {
              id: `professional-history-status-visit-${Date.now()}`,
              date: getShortTimestamp(),
              title: `Visita ${status}`,
              detail: visit
                ? `${visit.procedures} de las ${visit.time} quedó como ${status}.`
                : `Una visita quedó como ${status}.`,
              type: "visita",
            },
            ...patient.history,
          ],
        };
      }),
    );
  };

  const addObservation = async (patientId: string, observation: string) => {
    if (persistence) {
      await handlePersistedAction("Guardando observación...", () =>
        persistence.onAddObservation(patientId, observation.trim()),
      );
      return;
    }

    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              clinicalNotes: observation.trim(),
              history: [
                {
                  id: `professional-history-note-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Observación clínica",
                  detail: observation.trim(),
                  type: "nota",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  const addFamilyAccess = async (patientId: string, form: FamilyAccessForm) => {
    if (persistence) {
      await handlePersistedAction("Enviando invitación...", () =>
        persistence.onAddFamilyAccess(patientId, form),
      );
      return;
    }

    const access = buildFamilyAccess(form);
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              familyAccesses: [access, ...patient.familyAccesses],
              history: [
                {
                  id: `professional-history-family-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Familiar invitado",
                  detail: `${access.name} recibirá acceso ${formatAccessLevel(access.accessLevel)} al dashboard.`,
                  type: "nota",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Stethoscope size={23} />
            </div>
            <div>
              <p className="font-bold tracking-wide">MEDICARE Profesional</p>
              <p className="text-xs text-slate-500">{professionalRole}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onBack ? (
              <button
                onClick={onBack}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {backLabel}
              </button>
            ) : null}
            <button
              onClick={onExit}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {exitLabel}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-600">
            {contextLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className={`rounded-full px-3 py-1 ${
              persistence ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}>
              {persistence?.sourceLabel ?? "Modo demo local"}
            </span>
            {loading ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                <Loader2 className="animate-spin" size={13} />
                Cargando Supabase
              </span>
            ) : null}
            {savingLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                <Loader2 className="animate-spin" size={13} />
                {savingLabel}
              </span>
            ) : null}
          </div>
          {error || workspaceError ? (
            <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {workspaceError ?? error}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Pacientes" value={String(patients.length)} detail="Cartera activa" icon={Users} tone="blue" />
          <StatCard title="Adherencia" value={`${averageAdherence}%`} detail="Promedio de tomas" icon={Pill} tone={averageAdherence >= 75 ? "green" : "amber"} />
          <StatCard title="Visitas pendientes" value={String(todaysVisits)} detail="Agenda activa" icon={CalendarClock} tone={todaysVisits > 0 ? "amber" : "green"} />
          <StatCard title="Tomas pendientes" value={String(pendingMedications)} detail="Requieren control" icon={Bell} tone={pendingMedications > 0 ? "amber" : "green"} />
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="grid min-w-[620px] grid-cols-4 gap-1">
            {[
              { id: "resumen", label: "Resumen", icon: UserRound },
              { id: "pacientes", label: "Pacientes", icon: Users },
              { id: "visitas", label: "Visitas", icon: CalendarClock },
              { id: "actividad", label: "Actividad", icon: ClipboardCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-violet-600 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "resumen" ? (
          <ProfessionalOverview
            patients={patients}
            scheduledVisits={scheduledVisits}
            averageAdherence={averageAdherence}
            pendingMedications={pendingMedications}
            professionalName={professionalName}
            professionalRole={professionalRole}
            onOpenPatients={() => setActiveTab("pacientes")}
            onOpenVisits={() => setActiveTab("visitas")}
          />
        ) : null}

        {activeTab === "pacientes" ? (
          <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-5">
              <ProfessionalPatientList
                patients={visiblePatients}
                selectedPatientId={selectedPatient?.id}
                search={search}
                onSearchChange={setSearch}
                onSelectPatient={setSelectedPatientId}
              />
              <AddProfessionalPatientForm onAddPatient={addPatient} />
            </div>
            {selectedPatient ? (
              <ProfessionalPatientDetail
                patient={selectedPatient}
                onUpdatePatient={updatePatient}
                onAddMedication={addMedication}
                onRemoveMedication={removeMedication}
                onMedicationStatusChange={updateMedicationStatus}
                onAddVisit={addVisit}
                onRemoveVisit={removeVisit}
                onVisitStatusChange={updateVisit}
                onAddObservation={addObservation}
                onAddFamilyAccess={addFamilyAccess}
              />
            ) : (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                No hay pacientes para esa búsqueda.
              </article>
            )}
          </div>
        ) : null}

        {activeTab === "visitas" ? (
          <ProfessionalAgenda
            visits={scheduledVisits}
            onVisitStatusChange={updateVisit}
            onRemoveVisit={removeVisit}
          />
        ) : null}

        {activeTab === "actividad" ? (
          <ProfessionalActivity patients={patients} />
        ) : null}
      </section>
    </main>
  );
}

function ProfessionalOverview({
  patients,
  scheduledVisits,
  averageAdherence,
  pendingMedications,
  professionalName,
  professionalRole,
  onOpenPatients,
  onOpenVisits,
}: {
  patients: ProfessionalPatient[];
  scheduledVisits: ProfessionalScheduledVisit[];
  averageAdherence: number;
  pendingMedications: number;
  professionalName: string;
  professionalRole: string;
  onOpenPatients: () => void;
  onOpenVisits: () => void;
}) {
  const priorityPatients = patients
    .filter(
      (patient) =>
        getProfessionalAdherence(patient) < 75 ||
        patient.medications.some((medication) => medication.status === "atrasado") ||
        patient.generalStatus.toLowerCase().includes("alerta"),
    )
    .slice(0, 3);

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white">
            {getInitials(professionalName)}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">
              Mi panel
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{professionalName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {professionalRole}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">Pacientes activos</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{patients.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">Adherencia promedio</p>
            <p className="mt-2 text-3xl font-bold text-violet-700">{averageAdherence}%</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">Próximas visitas</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{scheduledVisits.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">Tomas a revisar</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">{pendingMedications}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onOpenPatients}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Users size={17} />
            Ver pacientes
          </button>
          <button
            onClick={onOpenVisits}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <CalendarClock size={17} />
            Ver agenda
          </button>
        </div>
      </article>

      <div className="space-y-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Próximas visitas</h2>
              <p className="mt-1 text-sm text-slate-500">Agenda inmediata del profesional.</p>
            </div>
            <Clock className="text-violet-600" size={22} />
          </div>
          <div className="mt-4 space-y-3">
            {scheduledVisits.slice(0, 4).map((item) => (
              <div
                key={`${item.patientId}-${item.visit.id}`}
                className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[88px_1fr]"
              >
                <p className="text-sm font-bold text-violet-700">{item.visit.time}</p>
                <div>
                  <p className="font-bold text-slate-950">{item.patientName}</p>
                  <p className="text-sm text-slate-500">{item.visit.procedures}</p>
                </div>
              </div>
            ))}
            {scheduledVisits.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                No hay visitas pendientes.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Pacientes a revisar</h2>
              <p className="mt-1 text-sm text-slate-500">Casos con tomas atrasadas o bajo cumplimiento.</p>
            </div>
            <AlertTriangle className="text-amber-600" size={22} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {priorityPatients.map((patient) => (
              <div key={patient.id} className="rounded-xl bg-amber-50 p-3">
                <p className="font-bold text-slate-950">{patient.name}</p>
                <p className="mt-1 text-sm text-slate-600">{patient.generalStatus}</p>
                <p className="mt-2 text-xs font-bold text-amber-700">
                  {getProfessionalAdherence(patient)}% adherencia
                </p>
              </div>
            ))}
            {priorityPatients.length === 0 ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                Sin pacientes críticos en este momento.
              </p>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

function ProfessionalAgenda({
  visits,
  onVisitStatusChange,
  onRemoveVisit,
}: {
  visits: ProfessionalScheduledVisit[];
  onVisitStatusChange: (patientId: string, visitId: string, status: VisitStatus) => void;
  onRemoveVisit: (patientId: string, visitId: string) => void;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Visitas agendadas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Todas las visitas futuras del profesional, agrupadas por paciente.
          </p>
        </div>
        <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          {visits.length} pendientes
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
        {visits.map((item) => (
          <div
            key={`${item.patientId}-${item.visit.id}`}
            className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 lg:grid-cols-[120px_1fr_auto] lg:items-center"
          >
            <div>
              <p className="text-sm font-bold text-violet-700">{item.visit.date}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{item.visit.time}</p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{item.patientName}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {item.patientAge} años
                </span>
                <StatusBadge value={item.visit.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">{item.visit.procedures}</p>
              {item.visit.notes ? (
                <p className="mt-1 text-xs text-slate-500">{item.visit.notes}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {item.visit.status === "pendiente" ? (
                <button
                  onClick={() => onVisitStatusChange(item.patientId, item.visit.id, "realizada")}
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                >
                  Confirmar
                </button>
              ) : null}
              <button
                onClick={() => onRemoveVisit(item.patientId, item.visit.id)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        {visits.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No hay visitas futuras cargadas.</p>
        ) : null}
      </div>
    </section>
  );
}

function ProfessionalActivity({ patients }: { patients: ProfessionalPatient[] }) {
  const events = patients
    .flatMap((patient) =>
      patient.history.map((event) => ({
        ...event,
        patientName: patient.name,
      })),
    )
    .slice(0, 12);

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Actividad reciente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Últimos registros clínicos y operativos de todos los pacientes.
          </p>
        </div>
        <ClipboardCheck className="text-violet-600" size={24} />
      </div>
      <div className="mt-5 space-y-3">
        {events.map((event) => (
          <div
            key={`${event.patientName}-${event.id}`}
            className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[120px_1fr]"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                {event.date}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                {event.type}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-950">{event.patientName} · {event.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfessionalPatientList({
  patients,
  selectedPatientId,
  search,
  onSearchChange,
  onSelectPatient,
}: {
  patients: ProfessionalPatient[];
  selectedPatientId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPatient: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Mis pacientes</h2>
          <p className="mt-1 text-sm text-slate-500">{patients.length} resultados</p>
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar paciente..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 sm:max-w-xs"
        />
      </div>

      <div className="mt-4 grid max-h-[620px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
        {patients.map((patient) => {
          const adherence = getProfessionalAdherence(patient);
          const pendingVisits = patient.visits.filter((visit) => visit.status === "pendiente").length;
          return (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedPatientId === patient.id
                  ? "border-violet-200 bg-violet-50"
                  : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{patient.name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {patient.age} años
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{patient.location}</p>
              <p className="mt-1 truncate text-xs font-semibold text-violet-700">
                {patient.diagnosis}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  {adherence}% tomas
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                  {pendingVisits} visitas pend.
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-violet-700">Abrir ficha</p>
            </button>
          );
        })}
        {patients.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No hay pacientes para esa búsqueda.</p>
        ) : null}
      </div>
    </article>
  );
}

function AddProfessionalPatientForm({
  onAddPatient,
}: {
  onAddPatient: (form: ProfessionalPatientForm) => void;
}) {
  const [form, setForm] = useState<ProfessionalPatientForm>({
    name: "",
    age: "75",
    diagnosis: "",
    location: "",
    emergencyContact: "",
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.name.trim() || !form.diagnosis.trim()) return;
        onAddPatient(form);
        setForm({ name: "", age: "75", diagnosis: "", location: "", emergencyContact: "" });
      }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-bold text-slate-950">Agregar paciente</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <TextField label="Nombre" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
        <TextField label="Edad" type="number" value={form.age} onChange={(value) => setForm((current) => ({ ...current, age: value }))} required />
        <TextField label="Diagnóstico / motivo" value={form.diagnosis} onChange={(value) => setForm((current) => ({ ...current, diagnosis: value }))} required />
        <TextField label="Ubicación" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
        <TextField label="Contacto de emergencia" value={form.emergencyContact} onChange={(value) => setForm((current) => ({ ...current, emergencyContact: value }))} />
      </div>
      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
        <Plus size={17} />
        Crear ficha
      </button>
    </form>
  );
}

function ProfessionalPatientDetail({
  patient,
  onUpdatePatient,
  onAddMedication,
  onRemoveMedication,
  onMedicationStatusChange,
  onAddVisit,
  onRemoveVisit,
  onVisitStatusChange,
  onAddObservation,
  onAddFamilyAccess,
}: {
  patient: ProfessionalPatient;
  onUpdatePatient: (
    patientId: string,
    updates: Pick<ProfessionalPatient, "generalStatus" | "allergies" | "carePlan" | "clinicalNotes">,
  ) => void;
  onAddMedication: (patientId: string, form: ProfessionalMedicationForm) => void;
  onRemoveMedication: (patientId: string, medicationId: string) => void;
  onMedicationStatusChange: (
    patientId: string,
    medicationId: string,
    status: MedicationStatus,
  ) => void;
  onAddVisit: (patientId: string, form: ProfessionalVisitForm) => void;
  onRemoveVisit: (patientId: string, visitId: string) => void;
  onVisitStatusChange: (patientId: string, visitId: string, status: VisitStatus) => void;
  onAddObservation: (patientId: string, observation: string) => void;
  onAddFamilyAccess: (patientId: string, form: FamilyAccessForm) => void;
}) {
  const adherence = getProfessionalAdherence(patient);
  const [detailTab, setDetailTab] = useState<"info" | "medicacion" | "visitas" | "historial" | "familia">(
    "info",
  );
  const [profileForm, setProfileForm] = useState({
    generalStatus: patient.generalStatus,
    allergies: patient.allergies,
    carePlan: patient.carePlan,
    clinicalNotes: patient.clinicalNotes,
  });

  useEffect(() => {
    setProfileForm({
      generalStatus: patient.generalStatus,
      allergies: patient.allergies,
      carePlan: patient.carePlan,
      clinicalNotes: patient.clinicalNotes,
    });
  }, [patient]);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-600">
            Ficha del paciente
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{patient.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {patient.age} años · {patient.location}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{patient.diagnosis}</p>
        </div>
        <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          {patient.generalStatus}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Adherencia de hoy</p>
          <p className="mt-2 text-3xl font-bold text-violet-700">{adherence}%</p>
          <div className="mt-3">
            <ProgressBar value={adherence} tone={adherence >= 75 ? "green" : "amber"} />
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Medicamentos</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{patient.medications.length}</p>
          <p className="mt-1 text-xs text-slate-500">Plan activo</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Visitas pendientes</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {patient.visits.filter((visit) => visit.status === "pendiente").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Agenda próxima</p>
        </div>
      </div>

      <ProfessionalTodayPanel
        patient={patient}
        onMedicationStatusChange={onMedicationStatusChange}
        onVisitStatusChange={onVisitStatusChange}
      />

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <div className="grid min-w-[720px] grid-cols-5 gap-1">
          {[
            { id: "info", label: "Info general", icon: UserRound },
            { id: "medicacion", label: "Medicación", icon: Pill },
            { id: "visitas", label: "Visitas", icon: CalendarClock },
            { id: "historial", label: "Historial", icon: ClipboardCheck },
            { id: "familia", label: "Familia", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = detailTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as typeof detailTab)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-950"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {detailTab === "info" ? (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onUpdatePatient(patient.id, profileForm);
        }}
        className="mt-5 rounded-2xl border border-slate-200 p-4"
      >
        <h3 className="font-bold text-slate-950">Información clínica</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <TextField label="Estado general" value={profileForm.generalStatus} onChange={(value) => setProfileForm((current) => ({ ...current, generalStatus: value }))} />
          <TextField label="Alergias" value={profileForm.allergies} onChange={(value) => setProfileForm((current) => ({ ...current, allergies: value }))} />
          <TextAreaField label="Plan de cuidado" value={profileForm.carePlan} onChange={(value) => setProfileForm((current) => ({ ...current, carePlan: value }))} />
          <TextAreaField label="Notas clínicas" value={profileForm.clinicalNotes} onChange={(value) => setProfileForm((current) => ({ ...current, clinicalNotes: value }))} />
        </div>
        <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
          <Save size={17} />
          Guardar ficha
        </button>
      </form>
      ) : null}

      {detailTab === "medicacion" ? (
        <ProfessionalMedicationPanel
          patient={patient}
          onAddMedication={onAddMedication}
          onRemoveMedication={onRemoveMedication}
          onMedicationStatusChange={onMedicationStatusChange}
        />
      ) : null}

      {detailTab === "visitas" ? (
        <ProfessionalVisitPanel
          patient={patient}
          onAddVisit={onAddVisit}
          onRemoveVisit={onRemoveVisit}
          onVisitStatusChange={onVisitStatusChange}
        />
      ) : null}

      {detailTab === "historial" ? (
        <ProfessionalHistoryPanel patient={patient} onAddObservation={onAddObservation} />
      ) : null}

      {detailTab === "familia" ? (
      <FamilyAccessPanel
        patientId={patient.id}
        familyAccesses={patient.familyAccesses}
        ownerLabel="profesional"
        onAddFamilyAccess={onAddFamilyAccess}
      />
      ) : null}
    </article>
  );
}

function ProfessionalTodayPanel({
  patient,
  onMedicationStatusChange,
  onVisitStatusChange,
}: {
  patient: ProfessionalPatient;
  onMedicationStatusChange: (
    patientId: string,
    medicationId: string,
    status: MedicationStatus,
  ) => void;
  onVisitStatusChange: (patientId: string, visitId: string, status: VisitStatus) => void;
}) {
  const todayIso = getTodayIso();
  const todayMedications = patient.medications
    .filter((medication) => isMedicationScheduledToday(medication, todayIso))
    .sort((a, b) => a.time.localeCompare(b.time));
  const todayVisits = patient.visits
    .filter((visit) => (visit.dateIso ?? toIsoDate(visit.date)) === todayIso)
    .sort(compareVisitsBySchedule);
  const completedTasks =
    todayMedications.filter((medication) => medication.status === "tomado").length +
    todayVisits.filter((visit) => visit.status === "realizada").length;
  const totalTasks = todayMedications.length + todayVisits.length;

  return (
    <section className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Hoy</h3>
          <p className="mt-1 text-sm text-violet-800">
            {completedTasks} de {totalTasks} tareas completadas para este paciente.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">
          {formatSelectedDate(todayIso)}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-950">Medicación de hoy</h4>
              <p className="mt-1 text-sm text-slate-500">
                {todayMedications.filter((medication) => medication.status === "tomado").length} de{" "}
                {todayMedications.length} tomadas.
              </p>
            </div>
            <Pill className="text-blue-600" size={22} />
          </div>
          <div className="mt-3 space-y-2">
            {todayMedications.map((medication) => (
              <div
                key={`${patient.id}-today-${medication.id}`}
                className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center"
              >
                <p className="text-sm font-bold text-blue-700">{medication.time}</p>
                <div>
                  <p className="font-bold text-slate-950">{medication.name}</p>
                  <p className="text-sm text-slate-500">{medication.dose}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <StatusBadge value={medication.status} />
                  {medication.status !== "tomado" ? (
                    <button
                      onClick={() => onMedicationStatusChange(patient.id, medication.id, "tomado")}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                    >
                      Tomó
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {todayMedications.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                No hay medicación indicada para hoy.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-950">Visitas de hoy</h4>
              <p className="mt-1 text-sm text-slate-500">
                {todayVisits.filter((visit) => visit.status === "realizada").length} de{" "}
                {todayVisits.length} realizadas.
              </p>
            </div>
            <CalendarClock className="text-violet-600" size={22} />
          </div>
          <div className="mt-3 space-y-2">
            {todayVisits.map((visit) => (
              <div
                key={`${patient.id}-today-${visit.id}`}
                className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center"
              >
                <p className="text-sm font-bold text-violet-700">{visit.time}</p>
                <div>
                  <p className="font-bold text-slate-950">{visit.procedures}</p>
                  <p className="text-sm text-slate-500">{visit.notes || visit.role}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <StatusBadge value={visit.status} />
                  {visit.status === "pendiente" ? (
                    <button
                      onClick={() => onVisitStatusChange(patient.id, visit.id, "realizada")}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                    >
                      Confirmar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {todayVisits.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                No hay visitas programadas para hoy.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfessionalMedicationPanel({
  patient,
  onAddMedication,
  onRemoveMedication,
  onMedicationStatusChange,
}: {
  patient: ProfessionalPatient;
  onAddMedication: (patientId: string, form: ProfessionalMedicationForm) => void;
  onRemoveMedication: (patientId: string, medicationId: string) => void;
  onMedicationStatusChange: (
    patientId: string,
    medicationId: string,
    status: MedicationStatus,
  ) => void;
}) {
  const [form, setForm] = useState<ProfessionalMedicationForm>({
    name: "",
    dose: "",
    purpose: "",
    time: "08:00",
    frequencyType: "daily",
    intervalHours: 12,
    weeklyDays: [getWeekdayFromIso(getTodayIso())],
    reminderEnabled: false,
    reminderEmail: "",
  });

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-950">Medicación</h3>
      <div className="mt-3 space-y-2">
        {patient.medications.map((medication) => (
          <div key={medication.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-950">{medication.name}</p>
                <p className="text-sm text-slate-500">
                  {medication.dose} · {medication.time} · {formatMedicationFrequency(medication)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{medication.purpose}</p>
              </div>
              <StatusBadge value={medication.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => onMedicationStatusChange(patient.id, medication.id, "tomado")}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
              >
                Tomó
              </button>
              <button
                onClick={() => onMedicationStatusChange(patient.id, medication.id, "atrasado")}
                className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
              >
                No tomó
              </button>
              <button
                onClick={() => onRemoveMedication(patient.id, medication.id)}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        {patient.medications.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Sin medicación cargada.</p>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim() || !form.dose.trim()) return;
          onAddMedication(patient.id, form);
          setForm({
            name: "",
            dose: "",
            purpose: "",
            time: "08:00",
            frequencyType: "daily",
            intervalHours: 12,
            weeklyDays: [getWeekdayFromIso(getTodayIso())],
            reminderEnabled: false,
            reminderEmail: "",
          });
        }}
        className="mt-4 rounded-xl bg-violet-50 p-3"
      >
        <p className="text-sm font-bold text-violet-900">Agregar medicamento</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField label="Nombre" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextField label="Dosis" value={form.dose} onChange={(value) => setForm((current) => ({ ...current, dose: value }))} required />
          <TextField label="Horario inicial" type="time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
          <SelectField
            label="Frecuencia"
            value={form.frequencyType}
            onChange={(value) => setForm((current) => ({ ...current, frequencyType: value as MedicationFrequency }))}
            options={[
              { label: "Diaria", value: "daily" },
              { label: "Semanal", value: "weekly" },
              { label: "Cada X horas", value: "interval" },
            ]}
          />
          {form.frequencyType === "interval" ? (
            <TextField label="Cada cuántas horas" type="number" value={String(form.intervalHours)} onChange={(value) => setForm((current) => ({ ...current, intervalHours: Number(value) || 12 }))} />
          ) : null}
          <TextField label="Para qué sirve" value={form.purpose} onChange={(value) => setForm((current) => ({ ...current, purpose: value }))} />
          {form.frequencyType === "weekly" ? (
            <div className="sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Días</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={form.weeklyDays.includes(day.value)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          weeklyDays: event.target.checked
                            ? [...current.weeklyDays, day.value]
                            : current.weeklyDays.filter((value) => value !== day.value),
                        }))
                      }
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.reminderEnabled}
              onChange={(event) =>
                setForm((current) => ({ ...current, reminderEnabled: event.target.checked }))
              }
            />
            Enviar recordatorio por email
          </label>
          {form.reminderEnabled ? (
            <TextField
              label="Email de recordatorio"
              type="email"
              value={form.reminderEmail}
              onChange={(value) => setForm((current) => ({ ...current, reminderEmail: value }))}
              required
            />
          ) : null}
        </div>
        <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} />
          Agregar
        </button>
      </form>
    </section>
  );
}

function ProfessionalVisitPanel({
  patient,
  onAddVisit,
  onRemoveVisit,
  onVisitStatusChange,
}: {
  patient: ProfessionalPatient;
  onAddVisit: (patientId: string, form: ProfessionalVisitForm) => void;
  onRemoveVisit: (patientId: string, visitId: string) => void;
  onVisitStatusChange: (patientId: string, visitId: string, status: VisitStatus) => void;
}) {
  const [form, setForm] = useState<ProfessionalVisitForm>({
    date: getTodayIso(),
    time: "10:00",
    procedures: "",
    notes: "",
    recurrenceType: "once",
    weeklyDays: [getWeekdayFromIso(getTodayIso())],
    monthlyDay: getDayOfMonthFromIso(getTodayIso()),
  });

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-950">Visitas programadas</h3>
      <div className="mt-3 space-y-2">
        {patient.visits.map((visit) => (
          <div key={visit.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-950">{visit.date} · {visit.time}</p>
                <p className="text-sm text-slate-500">{visit.procedures}</p>
                <p className="mt-1 text-xs text-slate-500">{visit.notes}</p>
              </div>
              <StatusBadge value={visit.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {visit.status === "pendiente" ? (
                <button
                  onClick={() => onVisitStatusChange(patient.id, visit.id, "realizada")}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                >
                  Confirmar
                </button>
              ) : null}
              <button
                onClick={() => onRemoveVisit(patient.id, visit.id)}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        {patient.visits.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Sin visitas programadas.</p>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.procedures.trim()) return;
          onAddVisit(patient.id, form);
          setForm({
            date: getTodayIso(),
            time: "10:00",
            procedures: "",
            notes: "",
            recurrenceType: "once",
            weeklyDays: [getWeekdayFromIso(getTodayIso())],
            monthlyDay: getDayOfMonthFromIso(getTodayIso()),
          });
        }}
        className="mt-4 rounded-xl bg-blue-50 p-3"
      >
        <p className="text-sm font-bold text-blue-900">Agregar visita</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField label="Fecha" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
          <TextField label="Hora" type="time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
          <SelectField
            label="Frecuencia"
            value={form.recurrenceType}
            onChange={(value) => setForm((current) => ({ ...current, recurrenceType: value as VisitRecurrence }))}
            options={[
              { label: "Única", value: "once" },
              { label: "Diaria", value: "daily" },
              { label: "Semanal", value: "weekly" },
              { label: "Mensual", value: "monthly" },
            ]}
          />
          {form.recurrenceType === "weekly" ? (
            <div className="sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Días de visita</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={form.weeklyDays.includes(day.value)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          weeklyDays: event.target.checked
                            ? [...current.weeklyDays, day.value]
                            : current.weeklyDays.filter((value) => value !== day.value),
                        }))
                      }
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {form.recurrenceType === "monthly" ? (
            <TextField
              label="Día del mes"
              type="number"
              value={String(form.monthlyDay)}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  monthlyDay: Math.min(31, Math.max(1, Number(value) || 1)),
                }))
              }
            />
          ) : null}
          <TextField label="Procedimiento" value={form.procedures} onChange={(value) => setForm((current) => ({ ...current, procedures: value }))} required />
          <TextAreaField label="Observaciones" value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
        </div>
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700">
          {formatVisitRecurrence(form)}
        </p>
        <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} />
          Agendar
        </button>
      </form>
    </section>
  );
}

function ProfessionalHistoryPanel({
  patient,
  onAddObservation,
}: {
  patient: ProfessionalPatient;
  onAddObservation: (patientId: string, observation: string) => void;
}) {
  const [observation, setObservation] = useState("");

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950">Historia clínica digital</h3>
          <p className="mt-1 text-sm text-slate-500">
            Observaciones, cambios de medicación y visitas quedan registrados.
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {patient.history.length} eventos
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!observation.trim()) return;
          onAddObservation(patient.id, observation);
          setObservation("");
        }}
        className="mt-4 rounded-xl bg-slate-50 p-3"
      >
        <TextAreaField
          label="Nueva observación clínica"
          value={observation}
          onChange={setObservation}
          placeholder="Ej. Paciente refiere mareos al levantarse..."
        />
        <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} />
          Guardar observación
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {patient.history.map((event) => (
          <div
            key={event.id}
            className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[120px_1fr]"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                {event.date}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                {event.type}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-950">{event.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FamilyAccessPanel({
  patientId,
  familyAccesses,
  ownerLabel,
  onAddFamilyAccess,
}: {
  patientId: string;
  familyAccesses: PatientFamilyAccess[];
  ownerLabel: string;
  onAddFamilyAccess: (patientId: string, form: FamilyAccessForm) => void;
}) {
  const [form, setForm] = useState<FamilyAccessForm>({
    name: "",
    email: "",
    relationship: "",
    accessLevel: "viewer",
    canConfirmMedications: false,
    canConfirmVisits: false,
  });

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950">Acceso familiar</h3>
          <p className="mt-1 text-sm text-slate-500">
            El {ownerLabel} puede invitar familiares al dashboard del paciente con permisos limitados.
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {familyAccesses.length} accesos
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {familyAccesses.map((access) => (
          <div key={access.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-950">{access.name}</p>
                <p className="text-sm text-slate-500">{access.relationship} · {access.email}</p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                {access.invitationStatus}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <PermissionPill label={formatAccessLevel(access.accessLevel)} />
              {access.permissions.canConfirmMedications ? <PermissionPill label="Confirma tomas" /> : null}
              {access.permissions.canConfirmVisits ? <PermissionPill label="Confirma visitas" /> : null}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim() || !form.email.trim()) return;
          onAddFamilyAccess(patientId, form);
          setForm({
            name: "",
            email: "",
            relationship: "",
            accessLevel: "viewer",
            canConfirmMedications: false,
            canConfirmVisits: false,
          });
        }}
        className="mt-4 rounded-xl bg-blue-50 p-3"
      >
        <p className="text-sm font-bold text-blue-900">Invitar familiar</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField label="Nombre" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
          <TextField label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} required />
          <TextField label="Vínculo" value={form.relationship} onChange={(value) => setForm((current) => ({ ...current, relationship: value }))} placeholder="Ej. hija, nieto, responsable" />
          <SelectField
            label="Nivel"
            value={form.accessLevel}
            onChange={(value) => setForm((current) => ({ ...current, accessLevel: value as AccessLevel }))}
            options={[
              { label: "Solo ver dashboard", value: "viewer" },
              { label: "Puede confirmar", value: "editor" },
              { label: "Acceso completo", value: "full" },
            ]}
          />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={form.canConfirmMedications}
              onChange={(event) =>
                setForm((current) => ({ ...current, canConfirmMedications: event.target.checked }))
              }
            />
            Puede confirmar medicación
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={form.canConfirmVisits}
              onChange={(event) =>
                setForm((current) => ({ ...current, canConfirmVisits: event.target.checked }))
              }
            />
            Puede confirmar visitas
          </label>
        </div>
        <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          <Mail size={16} />
          Enviar invitación
        </button>
      </form>
    </section>
  );
}

function EnterprisePortal({ onExit }: { onExit: () => void }) {
  const [doctors, setDoctors] = useState<EnterpriseDoctor[]>(enterpriseDoctors);
  const [patients, setPatients] = useState<EnterprisePatient[]>(enterprisePatients);
  const [doctorSession, setDoctorSession] = useState<EnterpriseDoctor | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(enterprisePatients[0]?.id ?? "");
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const visiblePatients = patients.filter((patient) => {
    const matchesDoctor = doctorSession
      ? patient.assignedDoctors.includes(doctorSession.name)
      : true;
    const query = patientSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [patient.name, patient.coverage, patient.location, ...patient.assignedDoctors]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesDoctor && matchesSearch;
  });
  const visibleDoctors = doctors.filter((doctor) =>
    [doctor.name, doctor.email, doctor.specialty]
      .join(" ")
      .toLowerCase()
      .includes(doctorSearch.trim().toLowerCase()),
  );
  const selectedPatient =
    visiblePatients.find((patient) => patient.id === selectedPatientId) ??
    visiblePatients[0] ??
    patients[0];
  const totalPatients = doctorSession ? visiblePatients.length : patients.length;
  const averageAdherence = Math.round(
    visiblePatients.reduce((total, patient) => total + patient.medicationAdherence, 0) /
      Math.max(visiblePatients.length, 1),
  );
  const pendingVisits = visiblePatients.reduce((total, patient) => total + patient.pendingVisits, 0);
  const completedVisits = visiblePatients.reduce((total, patient) => total + patient.completedVisits, 0);
  const delayedDoctors = doctors.filter((doctor) => doctor.status === "Atrasado").length;

  const addDoctor = (form: EnterpriseDoctorForm) => {
    const doctor: EnterpriseDoctor = {
      id: `doctor-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      specialty: form.specialty.trim(),
      status: "Disponible",
      patientsToday: 0,
      completedVisits: 0,
      pendingVisits: 0,
      lastCheckIn: getCurrentTimeLabel(),
    };
    setDoctors((current) => [doctor, ...current]);
  };

  const addPatient = (form: EnterprisePatientForm) => {
    const patient: EnterprisePatient = {
      id: `enterprise-patient-${Date.now()}`,
      name: form.name.trim(),
      age: Number(form.age) || 75,
      coverage: form.coverage.trim(),
      location: form.location.trim(),
      status: "Nuevo ingreso",
      assignedDoctors: form.assignedDoctors,
      medicationAdherence: 0,
      completedVisits: 0,
      pendingVisits: 0,
      medications: [],
      visits: [],
      alerts: ["Pendiente cargar medicación y visitas"],
      history: [
        {
          id: `history-${Date.now()}`,
          date: getShortTimestamp(),
          title: "Paciente creado",
          detail: `Equipo asignado: ${form.assignedDoctors.join(", ")}.`,
          type: "nota",
        },
      ],
      familyAccesses: [],
    };
    setPatients((current) => [patient, ...current]);
    setSelectedPatientId(patient.id);
  };

  const updateEnterpriseMedication = (
    patientId: string,
    medicationName: string,
    medicationTime: string,
    status: MedicationStatus,
  ) => {
    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId) return patient;
        const medications = patient.medications.map((medication) =>
          medication.name === medicationName && medication.time === medicationTime
            ? { ...medication, status }
            : medication,
        );
        const taken = medications.filter((medication) => medication.status === "tomado").length;
        return {
          ...patient,
          medications,
          medicationAdherence:
            medications.length === 0 ? 0 : Math.round((taken / medications.length) * 100),
          history: [
            {
              id: `history-med-${Date.now()}`,
              date: getShortTimestamp(),
              title:
                status === "tomado"
                  ? `${medicationName} confirmada`
                  : `${medicationName} no confirmada`,
              detail: `Toma de las ${medicationTime} marcada como ${status}.`,
              type: "medicacion",
            },
            ...patient.history,
          ],
        };
      }),
    );
  };

  const updateEnterpriseVisit = (
    patientId: string,
    professional: string,
    visitTime: string,
    status: VisitStatus,
  ) => {
    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId) return patient;
        const visits = patient.visits.map((visit) =>
          visit.professional === professional && visit.time === visitTime
            ? { ...visit, status }
            : visit,
        );
        return {
          ...patient,
          visits,
          completedVisits: visits.filter((visit) => visit.status === "realizada").length,
          pendingVisits: visits.filter((visit) => visit.status === "pendiente").length,
          history: [
            {
              id: `history-visit-${Date.now()}`,
              date: getShortTimestamp(),
              title: `Visita ${status}`,
              detail: `${professional} a las ${visitTime} quedó como ${status}.`,
              type: "visita",
            },
            ...patient.history,
          ],
        };
      }),
    );
  };

  const addEnterpriseMedication = (
    patientId: string,
    form: Pick<ProfessionalMedicationForm, "name" | "time">,
  ) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              medications: [
                ...patient.medications,
                { name: form.name.trim(), time: form.time, status: "pendiente" as MedicationStatus },
              ].sort((a, b) => a.time.localeCompare(b.time)),
              history: [
                {
                  id: `enterprise-history-med-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Medicación agregada",
                  detail: `${form.name.trim()} a las ${form.time}.`,
                  type: "medicacion",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  const addEnterpriseVisit = (
    patientId: string,
    form: Pick<ProfessionalVisitForm, "time" | "procedures">,
  ) => {
    const professional = doctorSession?.name ?? "Equipo institucional";
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              visits: [
                ...patient.visits,
                {
                  professional,
                  type: form.procedures.trim(),
                  time: form.time,
                  status: "pendiente" as VisitStatus,
                },
              ].sort((a, b) => a.time.localeCompare(b.time)),
              pendingVisits: patient.pendingVisits + 1,
              history: [
                {
                  id: `enterprise-history-visit-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Visita agregada",
                  detail: `${professional}: ${form.procedures.trim()} a las ${form.time}.`,
                  type: "visita",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  const addEnterpriseFamilyAccess = (patientId: string, form: FamilyAccessForm) => {
    const access = buildFamilyAccess(form);
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              familyAccesses: [access, ...patient.familyAccesses],
              history: [
                {
                  id: `enterprise-history-family-${Date.now()}`,
                  date: getShortTimestamp(),
                  title: "Familiar invitado",
                  detail: `${access.name} recibirá acceso al dashboard desde la institución.`,
                  type: "nota",
                },
                ...patient.history,
              ],
            }
          : patient,
      ),
    );
  };

  if (doctorSession) {
    const assignedPatients = patients
      .filter((patient) => patient.assignedDoctors.includes(doctorSession.name))
      .map(convertEnterprisePatientToProfessionalPatient);

    return (
      <ProfessionalWorkspace
        key={doctorSession.id}
        initialPatients={assignedPatients}
        professionalName={doctorSession.name}
        professionalRole={`${doctorSession.specialty} · Profesional institucional`}
        contextLabel="Médico dentro de institución"
        heading="Mi panel profesional"
        description="Vista profesional con los pacientes asignados por la institución. Usa los mismos datos de medicación, visitas, historial y familiares del paciente."
        onBack={() => setDoctorSession(null)}
        backLabel="Volver a institución"
        onExit={onExit}
        exitLabel="Volver al ingreso"
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 size={23} />
            </div>
            <div>
              <p className="font-bold tracking-wide">MEDICARE Empresas</p>
              <p className="text-xs text-slate-500">Administrador institucional</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onExit}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Volver al ingreso
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
            Obra social / geriátrico
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
            Administrador institucional
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Control integral de médicos, pacientes, familiares, medicación recibida y visitas realizadas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Pacientes" value={String(totalPatients)} detail="En seguimiento" icon={Users} tone="blue" />
          <StatCard title="Adherencia" value={`${averageAdherence}%`} detail="Promedio visible" icon={Pill} tone={averageAdherence >= 75 ? "green" : "amber"} />
          <StatCard title="Visitas pendientes" value={String(pendingVisits)} detail={`${completedVisits} realizadas`} icon={CalendarClock} tone={pendingVisits > 0 ? "amber" : "green"} />
          <StatCard title="Médicos atrasados" value={String(delayedDoctors)} detail={`${doctors.length} en nómina`} icon={ClipboardCheck} tone={delayedDoctors > 0 ? "amber" : "green"} />
        </div>

        {!doctorSession ? (
          <EnterpriseAdminPanel doctors={doctors} onAddDoctor={addDoctor} onAddPatient={addPatient} />
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <EnterprisePatientList
            patients={visiblePatients}
            selectedPatientId={selectedPatient?.id}
            search={patientSearch}
            onSearchChange={setPatientSearch}
            onSelectPatient={setSelectedPatientId}
          />
          {selectedPatient ? (
            <EnterprisePatientDetail
              patient={selectedPatient}
              canEdit
              onMedicationStatusChange={updateEnterpriseMedication}
              onVisitStatusChange={updateEnterpriseVisit}
              onAddFamilyAccess={addEnterpriseFamilyAccess}
              onAddMedication={addEnterpriseMedication}
              onAddVisit={addEnterpriseVisit}
            />
          ) : null}
        </div>

        {!doctorSession ? (
          <EnterpriseDoctorRoster
            doctors={visibleDoctors}
            search={doctorSearch}
            onSearchChange={setDoctorSearch}
            onLoginAsDoctor={setDoctorSession}
          />
        ) : null}
      </section>
    </main>
  );
}

function EnterpriseAdminPanel({
  doctors,
  onAddDoctor,
  onAddPatient,
}: {
  doctors: EnterpriseDoctor[];
  onAddDoctor: (form: EnterpriseDoctorForm) => void;
  onAddPatient: (form: EnterprisePatientForm) => void;
}) {
  const [doctorForm, setDoctorForm] = useState<EnterpriseDoctorForm>({
    name: "",
    email: "",
    specialty: "",
  });
  const [patientForm, setPatientForm] = useState<EnterprisePatientForm>({
    name: "",
    age: "75",
    coverage: "",
    location: "",
    assignedDoctors: doctors[0] ? [doctors[0].name] : [],
  });

  const togglePatientDoctor = (doctorName: string) => {
    setPatientForm((current) => {
      const alreadySelected = current.assignedDoctors.includes(doctorName);
      return {
        ...current,
        assignedDoctors: alreadySelected
          ? current.assignedDoctors.filter((name) => name !== doctorName)
          : [...current.assignedDoctors, doctorName],
      };
    });
  };

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!doctorForm.name.trim() || !doctorForm.email.trim() || !doctorForm.specialty.trim()) return;
          onAddDoctor(doctorForm);
          setDoctorForm({ name: "", email: "", specialty: "" });
        }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="font-bold text-slate-950">Agregar médico</h2>
        <p className="mt-1 text-sm text-slate-500">Crea una cuenta demo para iniciar sesión como médico.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <TextField label="Nombre" value={doctorForm.name} onChange={(value) => setDoctorForm((current) => ({ ...current, name: value }))} required />
          <TextField label="Email" type="email" value={doctorForm.email} onChange={(value) => setDoctorForm((current) => ({ ...current, email: value }))} required />
          <TextField label="Especialidad" value={doctorForm.specialty} onChange={(value) => setDoctorForm((current) => ({ ...current, specialty: value }))} required />
        </div>
        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white sm:w-auto">
          <Plus size={17} />
          Crear médico
        </button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!patientForm.name.trim() || patientForm.assignedDoctors.length === 0) return;
          onAddPatient(patientForm);
          setPatientForm({
            name: "",
            age: "75",
            coverage: "",
            location: "",
            assignedDoctors: doctors[0] ? [doctors[0].name] : [],
          });
        }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="font-bold text-slate-950">Agregar paciente</h2>
        <p className="mt-1 text-sm text-slate-500">Asignalo a uno o más profesionales de la nómina.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TextField label="Nombre" value={patientForm.name} onChange={(value) => setPatientForm((current) => ({ ...current, name: value }))} required />
          <TextField label="Edad" type="number" value={patientForm.age} onChange={(value) => setPatientForm((current) => ({ ...current, age: value }))} required />
          <TextField label="Cobertura" value={patientForm.coverage} onChange={(value) => setPatientForm((current) => ({ ...current, coverage: value }))} />
          <TextField label="Ubicación" value={patientForm.location} onChange={(value) => setPatientForm((current) => ({ ...current, location: value }))} />
        </div>
        <div className="mt-4">
          <p className="text-sm font-bold text-slate-700">Equipo asignado</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <label
                key={doctor.id}
                className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  patientForm.assignedDoctors.includes(doctor.name)
                    ? "border-blue-200 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={patientForm.assignedDoctors.includes(doctor.name)}
                  onChange={() => togglePatientDoctor(doctor.name)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-bold">{doctor.name}</span>
                  <span className="block text-xs text-slate-500">{doctor.specialty}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white sm:w-auto">
          <Plus size={17} />
          Crear paciente
        </button>
      </form>
    </div>
  );
}

function EnterprisePatientList({
  patients,
  selectedPatientId,
  search,
  onSearchChange,
  onSelectPatient,
}: {
  patients: EnterprisePatient[];
  selectedPatientId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPatient: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Pacientes</h2>
          <p className="mt-1 text-sm text-slate-500">{patients.length} resultados</p>
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar paciente, médico, cobertura..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
        />
      </div>

      <div className="mt-4 max-h-[560px] overflow-y-auto rounded-xl border border-slate-100">
        {patients.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onSelectPatient(patient.id)}
            className={`grid w-full gap-2 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center ${
              selectedPatientId === patient.id ? "bg-blue-50" : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{patient.name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {patient.age} años
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {patient.location} · {formatAssignedDoctors(patient.assignedDoctors)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                {patient.medicationAdherence}% med.
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                {patient.pendingVisits} visitas pend.
              </span>
            </div>
          </button>
        ))}
        {patients.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No hay pacientes para esa búsqueda.</p>
        ) : null}
      </div>
    </article>
  );
}

function EnterprisePatientDetail({
  patient,
  canEdit,
  onMedicationStatusChange,
  onVisitStatusChange,
  onAddFamilyAccess,
  onAddMedication,
  onAddVisit,
}: {
  patient: EnterprisePatient;
  canEdit: boolean;
  onMedicationStatusChange: (
    patientId: string,
    medicationName: string,
    medicationTime: string,
    status: MedicationStatus,
  ) => void;
  onVisitStatusChange: (
    patientId: string,
    professional: string,
    visitTime: string,
    status: VisitStatus,
  ) => void;
  onAddFamilyAccess: (patientId: string, form: FamilyAccessForm) => void;
  onAddMedication: (
    patientId: string,
    form: Pick<ProfessionalMedicationForm, "name" | "time">,
  ) => void;
  onAddVisit: (
    patientId: string,
    form: Pick<ProfessionalVisitForm, "time" | "procedures">,
  ) => void;
}) {
  const taken = patient.medications.filter((medication) => medication.status === "tomado").length;
  const [medicationForm, setMedicationForm] = useState({ name: "", time: "08:00" });
  const [visitForm, setVisitForm] = useState({ procedures: "", time: "10:00" });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-600">Paciente</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{patient.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{patient.coverage} · {patient.location}</p>
        </div>
        <div className="flex max-w-xl flex-wrap gap-2">
          {patient.assignedDoctors.map((doctor) => (
            <span
              key={doctor}
              className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
            >
              {doctor}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-950">Medicación de hoy</h3>
            <p className="mt-1 text-sm text-slate-500">{taken} de {patient.medications.length} tomas confirmadas.</p>
          </div>
          <span className="text-3xl font-bold text-blue-700">{patient.medicationAdherence}%</span>
        </div>
        <div className="mt-4">
          <ProgressBar value={patient.medicationAdherence} tone={patient.medicationAdherence >= 75 ? "green" : "amber"} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-slate-700">Tomas</h3>
          <div className="mt-3 space-y-2">
            {patient.medications.length > 0 ? (
              patient.medications.map((medication) => (
                <div key={`${patient.id}-${medication.name}-${medication.time}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{medication.name}</p>
                      <p className="text-sm text-slate-500">{medication.time}</p>
                    </div>
                    <StatusBadge value={medication.status} />
                  </div>
                  {canEdit ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onMedicationStatusChange(patient.id, medication.name, medication.time, "tomado")}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                      >
                        Tomó
                      </button>
                      <button
                        onClick={() => onMedicationStatusChange(patient.id, medication.name, medication.time, "atrasado")}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                      >
                        No tomó
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Sin medicación cargada.</p>
            )}
          </div>
          {canEdit ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!medicationForm.name.trim()) return;
                onAddMedication(patient.id, medicationForm);
                setMedicationForm({ name: "", time: "08:00" });
              }}
              className="mt-3 rounded-xl bg-blue-50 p-3"
            >
              <p className="text-sm font-bold text-blue-900">Agregar medicación</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <TextField label="Nombre" value={medicationForm.name} onChange={(value) => setMedicationForm((current) => ({ ...current, name: value }))} />
                <TextField label="Hora" type="time" value={medicationForm.time} onChange={(value) => setMedicationForm((current) => ({ ...current, time: value }))} />
              </div>
              <button className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                Agregar
              </button>
            </form>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700">Visitas</h3>
          <div className="mt-3 space-y-2">
            {patient.visits.length > 0 ? (
              patient.visits.map((visit) => (
                <div key={`${patient.id}-${visit.professional}-${visit.time}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{visit.professional}</p>
                      <p className="text-sm text-slate-500">{visit.type} · {visit.time}</p>
                    </div>
                    <StatusBadge value={visit.status} />
                  </div>
                  {canEdit && visit.status === "pendiente" ? (
                    <button
                      onClick={() => onVisitStatusChange(patient.id, visit.professional, visit.time, "realizada")}
                      className="mt-3 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"
                    >
                      Confirmar visita
                    </button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Sin visitas cargadas.</p>
            )}
          </div>
          {canEdit ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!visitForm.procedures.trim()) return;
                onAddVisit(patient.id, visitForm);
                setVisitForm({ procedures: "", time: "10:00" });
              }}
              className="mt-3 rounded-xl bg-violet-50 p-3"
            >
              <p className="text-sm font-bold text-violet-900">Agregar visita</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <TextField label="Procedimiento" value={visitForm.procedures} onChange={(value) => setVisitForm((current) => ({ ...current, procedures: value }))} />
                <TextField label="Hora" type="time" value={visitForm.time} onChange={(value) => setVisitForm((current) => ({ ...current, time: value }))} />
              </div>
              <button className="mt-3 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white">
                Agendar
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-950">Historial del paciente</h3>
            <p className="mt-1 text-sm text-slate-500">
              Registro de cambios, visitas, alertas y medicación.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {patient.history.length} eventos
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {patient.history.map((event) => (
            <div
              key={event.id}
              className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[120px_1fr] sm:items-start"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                  {event.date}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${
                    event.type === "medicacion"
                      ? "bg-blue-100 text-blue-700"
                      : event.type === "visita"
                        ? "bg-violet-100 text-violet-700"
                        : event.type === "alerta"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {event.type}
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-950">{event.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{event.detail}</p>
              </div>
            </div>
          ))}
          {patient.history.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              Todavía no hay historial para este paciente.
            </p>
          ) : null}
        </div>
      </div>
      <FamilyAccessPanel
        patientId={patient.id}
        familyAccesses={patient.familyAccesses}
        ownerLabel="equipo institucional"
        onAddFamilyAccess={onAddFamilyAccess}
      />
    </article>
  );
}

function EnterpriseDoctorRoster({
  doctors,
  search,
  onSearchChange,
  onLoginAsDoctor,
}: {
  doctors: EnterpriseDoctor[];
  search: string;
  onSearchChange: (value: string) => void;
  onLoginAsDoctor: (doctor: EnterpriseDoctor) => void;
}) {
  return (
    <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Médicos</h2>
          <p className="mt-1 text-sm text-slate-500">{doctors.length} resultados</p>
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar médico o especialidad..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="grid gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{doctor.name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{doctor.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{doctor.specialty} · {doctor.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600">{doctor.patientsToday} pacientes</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{doctor.completedVisits} OK</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{doctor.pendingVisits} pend.</span>
            </div>
            <button
              onClick={() => onLoginAsDoctor(doctor)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Entrar como médico
            </button>
          </div>
        ))}
        {doctors.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No hay médicos para esa búsqueda.</p>
        ) : null}
      </div>
    </article>
  );
}

function LoginScreen({
  demoUsers,
  pendingInvitations,
  loading,
  error,
  onDemoLogin,
  onEmailLogin,
  onSignup,
  onAcceptInvitation,
  onEnterpriseDemo,
  onProfessionalDemo,
}: {
  demoUsers: SessionUser[];
  pendingInvitations: CareInvitation[];
  loading: boolean;
  error: string | null;
  onDemoLogin: (user: SessionUser) => void;
  onEmailLogin: (form: LoginForm) => void;
  onSignup: (form: SignupForm) => void;
  onAcceptInvitation: (invitation: CareInvitation) => void;
  onEnterpriseDemo: () => void;
  onProfessionalDemo: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    email: "",
    password: "",
    fullName: "",
    patientName: "",
    patientAge: "75",
    seniorCanConfirmMedications: true,
    seniorCanConfirmVisits: false,
  });

  return (
    <main className="health-gradient min-h-screen px-5 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-2xl border border-white bg-white/90 p-6 shadow-xl shadow-blue-900/10 backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <LogIn size={24} />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-950">Ingreso MEDICARE</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Iniciá sesión o creá un paciente desde cero. La demo queda disponible aparte.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold">
            <button
              onClick={() => setMode("login")}
              className={`rounded-lg px-4 py-2 ${mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-lg px-4 py-2 ${mode === "signup" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
            >
              Registrarse
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {mode === "login" ? (
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                onEmailLogin(loginForm);
              }}
            >
              <TextField
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(value) => setLoginForm((current) => ({ ...current, email: value }))}
                required
              />
              <TextField
                label="Contraseña"
                type="password"
                value={loginForm.password}
                onChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                required
              />
              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
                Entrar
              </button>
            </form>
          ) : (
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSignup(signupForm);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Tu nombre"
                  value={signupForm.fullName}
                  onChange={(value) => setSignupForm((current) => ({ ...current, fullName: value }))}
                  required
                />
                <TextField
                  label="Nombre de la persona mayor"
                  value={signupForm.patientName}
                  onChange={(value) => setSignupForm((current) => ({ ...current, patientName: value }))}
                  required
                />
                <TextField
                  label="Edad"
                  type="number"
                  value={signupForm.patientAge}
                  onChange={(value) => setSignupForm((current) => ({ ...current, patientAge: value }))}
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={signupForm.email}
                  onChange={(value) => setSignupForm((current) => ({ ...current, email: value }))}
                  required
                />
              </div>
              <TextField
                label="Contraseña"
                type="password"
                value={signupForm.password}
                onChange={(value) => setSignupForm((current) => ({ ...current, password: value }))}
                required
              />
              <label className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={signupForm.seniorCanConfirmMedications}
                  onChange={(event) =>
                    setSignupForm((current) => ({
                      ...current,
                      seniorCanConfirmMedications: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                La persona mayor puede marcar medicación como tomada
              </label>
              <label className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={signupForm.seniorCanConfirmVisits}
                  onChange={(event) =>
                    setSignupForm((current) => ({
                      ...current,
                      seniorCanConfirmVisits: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                La persona mayor puede confirmar si una visita ocurrió
              </label>
              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
                Crear cuenta y paciente
              </button>
            </form>
          )}

          {pendingInvitations.length > 0 ? (
            <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4">
              <p className="text-sm font-bold text-violet-900">Invitaciones pendientes</p>
              <div className="mt-3 space-y-2">
                {pendingInvitations.map((invitation) => (
                  <button
                    key={invitation.id}
                    onClick={() => onAcceptInvitation(invitation)}
                    disabled={loading}
                    className="w-full rounded-xl bg-white px-4 py-3 text-left text-sm font-semibold text-violet-800 shadow-sm"
                  >
                    Aceptar acceso como {invitation.roleLabel}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white bg-white/90 p-6 shadow-xl shadow-blue-900/10 backdrop-blur">
          <h2 className="text-xl font-bold text-slate-950">Acceder a la demo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Entrá rápido con datos cargados para presentar el MVP.
          </p>
          <button
            onClick={onEnterpriseDemo}
            disabled={loading}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 size={23} />
            </div>
            <div>
              <p className="font-bold text-slate-950">Portal empresas</p>
              <p className="text-sm text-slate-600">Obra social / geriátrico</p>
            </div>
          </button>
          <button
            onClick={onProfessionalDemo}
            disabled={loading}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Stethoscope size={23} />
            </div>
            <div>
              <p className="font-bold text-slate-950">Profesional independiente</p>
              <p className="text-sm text-slate-600">Cuidadores, enfermería y salud domiciliaria</p>
            </div>
          </button>
          <div className="mt-6 grid gap-3">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onDemoLogin(user)}
                disabled={loading}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                    {user.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-blue-700">{user.email}</p>
              </button>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
        MEDICARE
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-slate-500">{subtitle}</p>
    </div>
  );
}

function ReadOnlyNotice({ title, text }: { title: string; text: string }) {
  return (
    <article className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </article>
  );
}

type DaySummary = {
  date: string;
  label: string;
  taken: number;
  total: number;
  pendingVisits: number;
  completedVisits: number;
  tone: "green" | "yellow" | "red";
};

function DayCalendar({
  selectedDate,
  summaries,
  onSelectDate,
}: {
  selectedDate: string;
  summaries: DaySummary[];
  onSelectDate: (date: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Días recientes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Historial de medicamentos y visitas por fecha.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Completo</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Pendiente</span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">Faltó algo</span>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
        Día seleccionado: {formatSelectedDate(selectedDate)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {summaries.map((day) => {
          const display = getDayTileDisplay(day.date);
          const toneClass =
            day.tone === "green"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : day.tone === "red"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-amber-200 bg-amber-50 text-amber-800";

          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`min-h-28 rounded-xl border p-3 text-left transition sm:min-h-32 ${
                selectedDate === day.date
                  ? "border-blue-600 bg-white ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {display.weekday}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{display.dayNumber}</p>
                  <p className="text-xs font-semibold text-slate-500">{display.month}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold sm:text-[11px] ${toneClass}`}>
                  {getDayToneLabel(day.tone)}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-700 sm:mt-4">
                {day.taken}/{day.total} medic.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {day.completedVisits + day.pendingVisits} visitas
              </p>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function SeniorPortal({
  patient,
  baseMedications,
  intakes,
  visits,
  reminders,
  loading,
  error,
  permissions,
  onMarkTaken,
  onVisitStatusChange,
  onLogout,
}: {
  patient: Patient;
  baseMedications: Medication[];
  intakes: MedicationIntake[];
  visits: Visit[];
  reminders: MedicationReminder[];
  loading: boolean;
  error: string | null;
  permissions: UserPermissions;
  onMarkTaken: (medication: Medication) => void;
  onVisitStatusChange: (id: string, status: VisitStatus) => void;
  onLogout: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const dailyMedications = getDailyMedications(baseMedications, intakes, selectedDate);
  const daySummaries = buildDaySummaries(baseMedications, intakes, visits);
  const pendingMedications = dailyMedications
    .filter((medication) => medication.status !== "tomado")
    .sort((a, b) => a.time.localeCompare(b.time));
  const nextVisits = visits
    .filter((visit) => visit.status === "pendiente")
    .sort(compareVisitsBySchedule)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-950 sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
            MEDICARE
          </p>
          <h1 className="mt-1 text-3xl font-bold">Hola, {patient.name}</h1>
        </div>
        <button
          onClick={onLogout}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Salir
        </button>
      </header>

      {loading ? (
        <div className="mx-auto mt-5 flex max-w-5xl items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          <Loader2 className="animate-spin" size={18} />
          Actualizando información...
        </div>
      ) : null}
      {error ? (
        <div className="mx-auto mt-5 max-w-5xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="mx-auto mt-6 grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Pill size={34} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">Próximo recordatorio</p>
              <h2 className="mt-2 text-3xl font-bold">
                {pendingMedications[0]?.time ?? "Sin pendientes"}
              </h2>
              <p className="mt-2 text-lg text-slate-600">
                {pendingMedications[0]
                  ? `${pendingMedications[0].name} · ${pendingMedications[0].dose}`
                  : "Todas las medicaciones figuran confirmadas."}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Información importante</p>
          <p className="mt-3 text-lg font-bold text-slate-950">{patient.generalStatus}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{patient.carePlan}</p>
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            Emergencia: {patient.emergencyContact}
          </p>
        </article>
      </section>

      <section className="mx-auto mt-5 max-w-5xl">
        <DayCalendar
          selectedDate={selectedDate}
          summaries={daySummaries}
          onSelectDate={setSelectedDate}
        />
      </section>

      <section className="mx-auto mt-5 grid max-w-5xl gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Medicamentos del día</h2>
          <div className="mt-4 space-y-3">
            {dailyMedications.length > 0 ? (
              dailyMedications.map((medication) => (
                <div key={medication.scheduleKey ?? `${medication.id}-${medication.time}`} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{medication.name}</p>
                      <p className="mt-1 text-slate-500">{medication.dose}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">{medication.time}</p>
                      <StatusBadge value={medication.status} />
                      {permissions.canConfirmMedications ? (
                        <button
                          onClick={() => onMarkTaken(medication)}
                          disabled={medication.status === "tomado"}
                          className="mt-3 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          {medication.status === "tomado" ? "Ya tomada" : "Ya la tomé"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                No hay medicación pendiente.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Próximas visitas</h2>
          <div className="mt-4 space-y-3">
            {nextVisits.length > 0 ? (
              nextVisits.map((visit) => (
                <div key={visit.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-lg font-bold">{visit.professional}</p>
                  <p className="mt-1 text-slate-500">{visit.role}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {visit.date} · {visit.time}
                  </p>
                  {permissions.canConfirmVisits && visit.status === "pendiente" ? (
                    <button
                      onClick={() => onVisitStatusChange(visit.id, "realizada")}
                      className="mt-3 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Confirmar que vino
                    </button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No hay visitas pendientes registradas.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Recordatorios</h2>
          <div className="mt-4 space-y-3">
            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-bold">{reminder.medicationName}</p>
                  <p className="mt-1 text-sm text-slate-500">{reminder.recipientEmail}</p>
                  <p className="mt-2 text-lg font-bold text-blue-700">{reminder.scheduledTime}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No hay recordatorios por email cargados.
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

function Dashboard({
  adherence,
  patient,
  userRole,
  nextMedication,
  lastVisit,
  activeAlerts,
  activityLog,
  onPatientUpdate,
}: {
  adherence: number;
  patient: Patient;
  userRole: UserRole;
  nextMedication: Medication | undefined;
  lastVisit: Visit;
  activeAlerts: CareAlert[];
  activityLog: ActivityLog[];
  onPatientUpdate: (patient: Patient) => void;
}) {
  return (
    <section>
      <SectionHeader
        title={userRole === "doctor" ? "Dashboard médico" : "Dashboard del familiar"}
        subtitle={
          userRole === "doctor"
            ? "Vista clínica con edición ampliada de datos, visitas y tratamiento."
            : "Vista rápida del estado general, medicación, visitas y alertas activas."
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PatientCard
          patient={patient}
          userRole={userRole}
          adherence={adherence}
          onPatientUpdate={onPatientUpdate}
        />

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Resumen del día</h2>
          <div className="mt-4 space-y-3">
            {[...dayEvents, ...activityLog.slice(0, 2).map((log) => log.message)]
              .slice(0, 5)
              .map((event) => (
              <div key={event} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                <p className="text-sm leading-6 text-slate-600">{event}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Próxima medicación"
          value={nextMedication?.time ?? "--:--"}
          detail={
            nextMedication
              ? `${nextMedication.name} · ${nextMedication.dose}`
              : "Sin medicaciones pendientes"
          }
          icon={Pill}
          tone="blue"
        />
        <StatCard
          title="Última visita"
          value={lastVisit.time}
          detail={`${lastVisit.professional} · ${lastVisit.date}`}
          icon={Stethoscope}
          tone="violet"
        />
        <StatCard
          title="Alertas activas"
          value={String(activeAlerts.length)}
          detail={activeAlerts.length > 0 ? activeAlerts[0].title : "Sin alertas pendientes"}
          icon={Bell}
          tone="amber"
        />
        <StatCard
          title="Estado general"
          value={patient.generalStatus}
          detail={patient.diagnosis}
          icon={HeartPulse}
          tone="green"
        />
      </div>
    </section>
  );
}

function PatientCard({
  patient,
  userRole,
  adherence,
  onPatientUpdate,
}: {
  patient: Patient;
  userRole: UserRole;
  adherence: number;
  onPatientUpdate: (patient: Patient) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Patient>(patient);

  useEffect(() => {
    setForm(patient);
  }, [patient]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPatientUpdate({ ...form, age: Number(form.age) || patient.age });
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">Editar paciente</h2>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Save size={17} />
            Guardar
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            required
          />
          <TextField
            label="Edad"
            type="number"
            value={String(form.age)}
            onChange={(value) => setForm((current) => ({ ...current, age: Number(value) }))}
            required
          />
          <TextField
            label="Diagnóstico"
            value={form.diagnosis}
            onChange={(value) => setForm((current) => ({ ...current, diagnosis: value }))}
            required
          />
          <TextField
            label="Médico asignado"
            value={form.doctor}
            onChange={(value) => setForm((current) => ({ ...current, doctor: value }))}
            required
          />
          <TextField
            label="Contacto de emergencia"
            value={form.emergencyContact}
            onChange={(value) =>
              setForm((current) => ({ ...current, emergencyContact: value }))
            }
            required
          />
          <TextField
            label="Estado general"
            value={form.generalStatus}
            onChange={(value) => setForm((current) => ({ ...current, generalStatus: value }))}
            required
          />
          {userRole === "doctor" ? (
            <>
              <TextField
                label="Alergias"
                value={form.allergies}
                onChange={(value) => setForm((current) => ({ ...current, allergies: value }))}
              />
              <TextField
                label="Riesgo de movilidad"
                value={form.mobilityRisk}
                onChange={(value) =>
                  setForm((current) => ({ ...current, mobilityRisk: value }))
                }
              />
              <TextAreaField
                label="Plan de cuidado"
                value={form.carePlan}
                onChange={(value) => setForm((current) => ({ ...current, carePlan: value }))}
              />
              <TextAreaField
                label="Notas clínicas"
                value={form.clinicalNotes}
                onChange={(value) =>
                  setForm((current) => ({ ...current, clinicalNotes: value }))
                }
              />
            </>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <UserRound size={42} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Paciente</p>
            <h2 className="text-2xl font-bold text-slate-950">{patient.name}</h2>
            <p className="mt-1 text-slate-500">
              {patient.age} años · {patient.diagnosis}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {patient.doctor} · Emergencia: {patient.emergencyContact}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <p className="rounded-xl bg-slate-50 px-3 py-2">{patient.allergies}</p>
              <p className="rounded-xl bg-slate-50 px-3 py-2">{patient.mobilityRisk}</p>
            </div>
            {userRole === "doctor" ? (
              <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-800">
                {patient.clinicalNotes}
              </p>
            ) : null}
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil size={17} />
          Editar
        </button>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Adherencia a medicación</span>
          <span className="text-sm font-bold text-blue-700">{adherence}%</span>
        </div>
        <ProgressBar value={adherence} tone={adherence >= 70 ? "green" : "amber"} />
      </div>
    </article>
  );
}

function MedicationSection({
  medications,
  baseMedications,
  reminders,
  intakes,
  visits,
  selectedDate,
  onDateChange,
  adherence,
  onAddMedication,
  onMarkTaken,
  canEdit,
  canConfirm,
}: {
  medications: Medication[];
  baseMedications: Medication[];
  reminders: MedicationReminder[];
  intakes: MedicationIntake[];
  visits: Visit[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  adherence: number;
  onAddMedication: (form: MedicationForm) => void;
  onMarkTaken: (medication: Medication) => void;
  canEdit: boolean;
  canConfirm: boolean;
}) {
  const taken = medications.filter((medication) => medication.status === "tomado").length;
  const pending = medications.filter((medication) => medication.status !== "tomado").length;
  const daySummaries = buildDaySummaries(baseMedications, intakes, visits);

  return (
    <section>
      <SectionHeader
        title="Medicación"
        subtitle="Primero revisá las tomas de hoy; la carga y la configuración quedan más abajo."
      />
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Tomas de {formatSelectedDate(selectedDate).toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {taken} confirmadas, {pending} pendientes.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-blue-50 px-4 py-3 sm:min-w-44">
            <span className="text-sm font-bold text-blue-700">Cumplimiento</span>
            <span className="text-3xl font-bold text-blue-700">{adherence}%</span>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={adherence} tone={adherence >= 70 ? "green" : "amber"} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {medications.length > 0 ? (
          medications.map((medication) => (
            <article
              key={medication.scheduleKey ?? `${medication.id}-${medication.time}`}
              className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                medication.status === "tomado"
                  ? "border-emerald-100"
                  : medication.status === "atrasado"
                    ? "border-rose-200"
                    : "border-amber-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {medication.time}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">{medication.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{medication.dose}</p>
                </div>
                <StatusBadge value={medication.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{medication.purpose}</p>
              {canConfirm ? (
                <button
                  onClick={() => onMarkTaken(medication)}
                  disabled={medication.status === "tomado"}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
                >
                  <Check size={17} />
                  {medication.status === "tomado" ? "Ya confirmada" : "Marcar como tomada"}
                </button>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-500 sm:w-fit">
                  Solo lectura
                </p>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
            No hay tomas programadas para este día.
          </p>
        )}
      </div>

      <div className="mt-5">
        <DayCalendar
          selectedDate={selectedDate}
          summaries={daySummaries}
          onSelectDate={onDateChange}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <TreatmentList medications={baseMedications} />
          <ReminderList reminders={reminders} />
        </div>
        <div className="space-y-5">
          {canEdit ? (
            <AddMedicationForm onAddMedication={onAddMedication} />
          ) : (
            <ReadOnlyNotice
              title="Sin edición de tratamiento"
              text="Tu acceso permite consultar o confirmar tomas, pero no modificar la medicación indicada."
            />
          )}
        </div>
      </div>
    </section>
  );
}

function AddMedicationForm({
  onAddMedication,
}: {
  onAddMedication: (form: MedicationForm) => void;
}) {
  const [form, setForm] = useState<MedicationForm>({
    name: "",
    dose: "",
    purpose: "",
    time: "09:00",
    frequencyType: "daily",
    intervalHours: null,
    weeklyDays: [1],
    reminderEnabled: false,
    reminderEmail: "familiar@medicare.demo",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.dose.trim() || !form.purpose.trim() || !form.time) return;
    if (form.frequencyType === "weekly" && form.weeklyDays.length === 0) return;
    if (form.reminderEnabled && !form.reminderEmail.trim()) return;
    onAddMedication({
      ...form,
      intervalHours: form.frequencyType === "interval" ? form.intervalHours ?? 12 : 24,
      weeklyDays: form.frequencyType === "weekly" ? form.weeklyDays : [],
    });
    setForm({
      name: "",
      dose: "",
      purpose: "",
      time: "09:00",
      frequencyType: "daily",
      intervalHours: null,
      weeklyDays: [1],
      reminderEnabled: false,
      reminderEmail: "familiar@medicare.demo",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Agregar medicación</h2>
      <div className="mt-4 space-y-4">
        <TextField
          label="Medicamento"
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="Ej. Aspirina"
          required
        />
        <TextField
          label="Dosis"
          value={form.dose}
          onChange={(value) => setForm((current) => ({ ...current, dose: value }))}
          placeholder="Ej. 100 mg"
          required
        />
        <TextAreaField
          label="Para qué sirve"
          value={form.purpose}
          onChange={(value) => setForm((current) => ({ ...current, purpose: value }))}
          placeholder="Ej. Control de presión arterial"
          required
        />
        <TextField
          label="Primer horario"
          type="time"
          value={form.time}
          onChange={(value) => setForm((current) => ({ ...current, time: value }))}
          required
        />
        <SelectField
          label="Frecuencia"
          value={getFrequencySelectValue(form)}
          onChange={(value) =>
            setForm((current) => {
              if (value === "daily") {
                return { ...current, frequencyType: "daily", intervalHours: null };
              }
              if (value === "weekly") {
                return { ...current, frequencyType: "weekly", intervalHours: null };
              }
              return {
                ...current,
                frequencyType: "interval",
                intervalHours: Number(value.replace("interval-", "")),
              };
            })
          }
          options={[
            { label: "Diario", value: "daily" },
            { label: "Semanal", value: "weekly" },
            { label: "Cada 12 horas", value: "interval-12" },
            { label: "Cada 8 horas", value: "interval-8" },
          ]}
        />
        {form.frequencyType === "weekly" ? (
          <div>
            <p className="text-sm font-semibold text-slate-700">Días de la semana</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {weekDays.map((day) => {
                const active = form.weeklyDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        weeklyDays: active
                          ? current.weeklyDays.filter((value) => value !== day.value)
                          : [...current.weeklyDays, day.value].sort((a, b) => a - b),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-blue-200"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={form.reminderEnabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reminderEnabled: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">Recordatorio por email</span>
            <span className="mt-1 block text-sm leading-5 text-slate-500">
              Si está marcado, MEDICARE deja el recordatorio en cola de envío.
            </span>
          </span>
        </label>
        {form.reminderEnabled ? (
          <TextField
            label="Email para recordatorio"
            type="email"
            value={form.reminderEmail}
            onChange={(value) => setForm((current) => ({ ...current, reminderEmail: value }))}
            placeholder="familiar@email.com"
            required
          />
        ) : null}
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
        <Plus size={17} />
        Agregar
      </button>
    </form>
  );
}

function ReminderList({ reminders }: { reminders: MedicationReminder[] }) {
  return (
    <article className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <Mail size={21} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Recordatorios activos</h2>
          <p className="text-sm text-slate-500">Se crean al marcar la casilla del medicamento.</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {reminders.length > 0 ? (
          reminders.map((reminder) => (
            <div key={reminder.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-bold text-slate-800">{reminder.scheduledTime}</span>{" "}
              {reminder.medicationName} · {reminder.recipientEmail}
            </div>
          ))
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No hay recordatorios por email activados.
          </p>
        )}
      </div>
    </article>
  );
}

function TreatmentList({ medications }: { medications: Medication[] }) {
  return (
    <article className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Tratamiento completo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Medicamentos indicados, frecuencia y objetivo de cada uno.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {medications.length} medicamentos
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {medications.map((medication) => (
          <div key={medication.id} className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold text-slate-950">{medication.name}</p>
                <p className="mt-1 text-sm text-slate-500">{medication.dose}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{medication.purpose}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {formatMedicationFrequency(medication)}
                </span>
                {medication.reminderEnabled ? (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    Recordatorio
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function VisitsSection({
  visits,
  selectedDate,
  onDateChange,
  onAddVisit,
  onVisitStatusChange,
  canEdit,
  canConfirm,
}: {
  visits: Visit[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddVisit: (form: VisitForm) => void;
  onVisitStatusChange: (id: string, status: VisitStatus) => void;
  canEdit: boolean;
  canConfirm: boolean;
}) {
  const selectedDayVisits = visits
    .filter((visit) => (visit.dateIso ?? toIsoDate(visit.date)) === selectedDate)
    .sort(compareVisitsBySchedule);
  const pendingVisits = visits
    .filter((visit) => visit.status === "pendiente")
    .sort(compareVisitsBySchedule);
  const completedVisits = visits
    .filter((visit) => visit.status === "realizada")
    .sort(compareVisitsBySchedule)
    .reverse();

  return (
    <section>
      <SectionHeader
        title="Visitas médicas"
        subtitle="Revisá qué visitas hay hoy, cuáles vienen y qué quedó registrado."
      />
      <div className="mb-5">
        <DayCalendar
          selectedDate={selectedDate}
          summaries={buildDaySummaries([], [], visits)}
          onSelectDate={onDateChange}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        {canEdit ? (
          <AddVisitForm onAddVisit={onAddVisit} />
        ) : (
          <ReadOnlyNotice
            title="Historial familiar"
            text="Acá se consultan visitas realizadas y pendientes. El registro clínico lo carga el médico o cuidador autorizado."
          />
        )}
        <div className="space-y-5">
          <VisitGroup
            title={`Visitas del día (${formatSelectedDate(selectedDate)})`}
            emptyText="No hay visitas para este día."
            visits={selectedDayVisits}
            canConfirm={canConfirm}
            onVisitStatusChange={onVisitStatusChange}
          />
          <VisitGroup
            title="Próximas visitas agendadas"
            emptyText="No hay visitas pendientes."
            visits={pendingVisits}
            canConfirm={canConfirm}
            onVisitStatusChange={onVisitStatusChange}
          />
          <VisitGroup
            title="Historial de visitas realizadas"
            emptyText="Todavía no hay visitas realizadas."
            visits={completedVisits}
            canConfirm={false}
            onVisitStatusChange={onVisitStatusChange}
          />
        </div>
      </div>
    </section>
  );
}

function VisitGroup({
  title,
  emptyText,
  visits,
  canConfirm,
  onVisitStatusChange,
}: {
  title: string;
  emptyText: string;
  visits: Visit[];
  canConfirm: boolean;
  onVisitStatusChange: (id: string, status: VisitStatus) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {visits.length}
        </span>
      </div>
      <div className="grid gap-4">
        {visits.length > 0 ? (
          visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              canConfirm={canConfirm}
              onVisitStatusChange={onVisitStatusChange}
            />
          ))
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function VisitCard({
  visit,
  canConfirm,
  onVisitStatusChange,
}: {
  visit: Visit;
  canConfirm: boolean;
  onVisitStatusChange: (id: string, status: VisitStatus) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <CalendarClock size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{visit.professional}</h2>
            <p className="text-sm text-slate-500">{visit.role}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {visit.date} · {visit.time}
            </p>
            {visit.recurrenceType !== "once" ? (
              <p className="mt-2 w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                {formatVisitRecurrence(visit)}
              </p>
            ) : null}
          </div>
        </div>
        <StatusBadge value={visit.status} />
      </div>
      {canConfirm && visit.status === "pendiente" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onVisitStatusChange(visit.id, "realizada")}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Check size={17} />
            Confirmar realizada
          </button>
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">Procedimientos</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{visit.procedures}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">Observaciones</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{visit.notes}</p>
        </div>
      </div>
    </article>
  );
}

function AddVisitForm({ onAddVisit }: { onAddVisit: (form: VisitForm) => void }) {
  const today = getTodayIso();
  const [form, setForm] = useState<VisitForm>({
    professional: "",
    role: "",
    date: today,
    time: "10:00",
    procedures: "",
    notes: "",
    status: "pendiente",
    recurrenceType: "once",
    weeklyDays: [getWeekdayFromIso(today)],
    monthlyDay: getDayOfMonthFromIso(today),
  });
  const plannedDates = getVisitSeriesDates(form);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.professional.trim() || !form.role.trim()) return;
    if (form.recurrenceType === "weekly" && form.weeklyDays.length === 0) return;
    onAddVisit(form);
    const nextToday = getTodayIso();
    setForm({
      professional: "",
      role: "",
      date: nextToday,
      time: "10:00",
      procedures: "",
      notes: "",
      status: "pendiente",
      recurrenceType: "once",
      weeklyDays: [getWeekdayFromIso(nextToday)],
      monthlyDay: getDayOfMonthFromIso(nextToday),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Registrar visita</h2>
      <div className="mt-4 space-y-4">
        <TextField
          label="Profesional"
          value={form.professional}
          onChange={(value) => setForm((current) => ({ ...current, professional: value }))}
          placeholder="Ej. Dra. Paula Ruiz"
          required
        />
        <TextField
          label="Rol"
          value={form.role}
          onChange={(value) => setForm((current) => ({ ...current, role: value }))}
          placeholder="Ej. Médica clínica"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                date: value,
                weeklyDays:
                  current.recurrenceType === "weekly" && current.weeklyDays.length === 1
                    ? [getWeekdayFromIso(value)]
                    : current.weeklyDays,
                monthlyDay: getDayOfMonthFromIso(value),
              }))
            }
            required
          />
          <TextField
            label="Hora"
            type="time"
            value={form.time}
            onChange={(value) => setForm((current) => ({ ...current, time: value }))}
            required
          />
        </div>
        <SelectField
          label="Repetición"
          value={form.recurrenceType}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              recurrenceType: value as VisitRecurrence,
              weeklyDays:
                value === "weekly" && current.weeklyDays.length === 0
                  ? [getWeekdayFromIso(current.date)]
                  : current.weeklyDays,
              monthlyDay:
                value === "monthly" ? getDayOfMonthFromIso(current.date) : current.monthlyDay,
            }))
          }
          options={[
            { label: "Una sola vez", value: "once" },
            { label: "Diaria", value: "daily" },
            { label: "Semanal", value: "weekly" },
            { label: "Una vez al mes", value: "monthly" },
          ]}
        />
        {form.recurrenceType === "weekly" ? (
          <div>
            <p className="text-sm font-semibold text-slate-700">Días de visita</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {weekDays.map((day) => {
                const active = form.weeklyDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        weeklyDays: active
                          ? current.weeklyDays.filter((value) => value !== day.value)
                          : [...current.weeklyDays, day.value].sort((a, b) => a - b),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600 hover:border-violet-200"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {form.recurrenceType === "monthly" ? (
          <TextField
            label="Día del mes"
            type="number"
            value={String(form.monthlyDay)}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                monthlyDay: Math.min(31, Math.max(1, Number(value) || 1)),
              }))
            }
            required
          />
        ) : null}
        {form.recurrenceType !== "once" ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-800">
            <p className="font-bold">{formatVisitRecurrence(form)}</p>
            <p className="mt-1">
              Se van a crear {plannedDates.length} visitas futuras desde{" "}
              {formatSelectedDate(plannedDates[0] ?? form.date)}.
            </p>
          </div>
        ) : null}
        <TextAreaField
          label="Procedimientos"
          value={form.procedures}
          onChange={(value) => setForm((current) => ({ ...current, procedures: value }))}
          placeholder="Control de presión, glucemia..."
        />
        <TextAreaField
          label="Observaciones"
          value={form.notes}
          onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
          placeholder="Paciente estable..."
        />
        {form.recurrenceType === "once" ? (
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(value) =>
              setForm((current) => ({ ...current, status: value as VisitStatus }))
            }
            options={[
              { label: "Pendiente", value: "pendiente" },
              { label: "Realizada", value: "realizada" },
            ]}
          />
        ) : (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            Las visitas recurrentes se agendan como pendientes.
          </div>
        )}
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
        <Plus size={17} />
        Guardar visita
      </button>
    </form>
  );
}

function AlertsSection({
  alerts,
  onAddAlert,
  onContact,
  onResolve,
}: {
  alerts: CareAlert[];
  onAddAlert: (form: AlertForm) => void;
  onContact: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Alertas"
        subtitle="Eventos importantes priorizados para que la familia pueda actuar rápido."
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <AddAlertForm onAddAlert={onAddAlert} />
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-2xl border p-5 shadow-sm ${
                alert.resolved
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-950">{alert.title}</h2>
                      <StatusBadge value={alert.resolved ? "resuelta" : alert.priority} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{alert.detail}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => onContact(alert.id)}
                    disabled={alert.resolved}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Contactar médico
                  </button>
                  <button
                    onClick={() => onResolve(alert.id)}
                    disabled={alert.resolved}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-emerald-800"
                  >
                    <Check size={17} />
                    {alert.resolved ? "Resuelta" : "Marcar resuelta"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddAlertForm({ onAddAlert }: { onAddAlert: (form: AlertForm) => void }) {
  const [form, setForm] = useState<AlertForm>({
    title: "",
    detail: "",
    priority: "media",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.detail.trim()) return;
    onAddAlert(form);
    setForm({ title: "", detail: "", priority: "media" });
  };

  return (
    <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Crear alerta</h2>
      <div className="mt-4 space-y-4">
        <TextField
          label="Título"
          value={form.title}
          onChange={(value) => setForm((current) => ({ ...current, title: value }))}
          placeholder="Ej. Control atrasado"
          required
        />
        <TextAreaField
          label="Detalle"
          value={form.detail}
          onChange={(value) => setForm((current) => ({ ...current, detail: value }))}
          placeholder="Describir qué debe revisar la familia"
          required
        />
        <SelectField
          label="Prioridad"
          value={form.priority}
          onChange={(value) =>
            setForm((current) => ({ ...current, priority: value as AlertPriority }))
          }
          options={[
            { label: "Baja", value: "baja" },
            { label: "Media", value: "media" },
            { label: "Alta", value: "alta" },
          ]}
        />
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
        <Plus size={17} />
        Crear alerta
      </button>
    </form>
  );
}

function FamilySection({
  contacts,
  onAddContact,
  canEdit,
}: {
  contacts: CareContact[];
  onAddContact: (form: ContactForm) => void;
  canEdit: boolean;
}) {
  return (
    <section>
      <SectionHeader
        title="Familia y cuidadores"
        subtitle="Personas conectadas al cuidado, con roles claros y estado de contacto."
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        {canEdit ? (
          <AddContactForm onAddContact={onAddContact} />
        ) : (
          <ReadOnlyNotice title="Contactos" text="Listado de contactos importantes del cuidado." />
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <article key={contact.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">
                  {contact.initials}
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">{contact.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{contact.role}</p>
                  {contact.email ? (
                    <p className="mt-1 text-xs font-semibold text-blue-700">{contact.email}</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Users size={17} />
                  {formatAccessLevel(contact.accessLevel)}
                </span>
                <span
                  className={`text-sm font-bold ${
                    contact.status === "Fuera de horario" ? "text-slate-500" : "text-emerald-700"
                  }`}
                >
                  {contact.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {contact.permissions.canManageMedications ? <PermissionPill label="Edita medicación" /> : null}
                {contact.permissions.canConfirmMedications ? <PermissionPill label="Confirma tomas" /> : null}
                {contact.permissions.canManageVisits ? <PermissionPill label="Agenda visitas" /> : null}
                {contact.permissions.canConfirmVisits ? <PermissionPill label="Confirma visitas" /> : null}
                {contact.permissions.canManageContacts ? <PermissionPill label="Invita personas" /> : null}
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                Cuenta: {formatInvitationStatus(contact.invitationStatus)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddContactForm({ onAddContact }: { onAddContact: (form: ContactForm) => void }) {
  const [form, setForm] = useState<ContactForm>({
    name: "",
    role: "",
    email: "",
    roleType: "family",
    accessLevel: "viewer",
    permissions: viewerPermissions,
    inviteWithAccount: true,
    status: "Disponible",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    if (form.inviteWithAccount && !form.email.trim()) return;
    onAddContact(form);
    setForm({
      name: "",
      role: "",
      email: "",
      roleType: "family",
      accessLevel: "viewer",
      permissions: viewerPermissions,
      inviteWithAccount: true,
      status: "Disponible",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Agregar cuidador</h2>
      <div className="mt-4 space-y-4">
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="Ej. Sofía Martínez"
          required
        />
        <TextField
          label="Rol"
          value={form.role}
          onChange={(value) => setForm((current) => ({ ...current, role: value }))}
          placeholder="Ej. Nieta autorizada"
          required
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          placeholder="persona@email.com"
          required={form.inviteWithAccount}
        />
        <SelectField
          label="Tipo de usuario"
          value={form.roleType}
          onChange={(value) =>
            setForm((current) => ({ ...current, roleType: value as UserRole }))
          }
          options={[
            { label: "Familiar", value: "family" },
            { label: "Médico/cuidador", value: "doctor" },
            { label: "Persona mayor", value: "senior" },
          ]}
        />
        <SelectField
          label="Nivel de acceso"
          value={form.accessLevel}
          onChange={(value) => {
            const accessLevel = value as AccessLevel;
            setForm((current) => ({
              ...current,
              accessLevel,
              permissions: getPermissionsForAccessLevel(accessLevel),
            }));
          }}
          options={[
            { label: "Acceso completo", value: "full" },
            { label: "Puede editar cuidado", value: "editor" },
            { label: "Solo lectura", value: "viewer" },
            { label: "Persona mayor limitada", value: "senior_limited" },
            { label: "Personalizado", value: "custom" },
          ]}
        />
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-800">Permisos</p>
          <div className="mt-3 grid gap-2">
            {permissionOptions.map((permission) => (
              <label key={permission.key} className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.permissions[permission.key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      accessLevel: "custom",
                      permissions: {
                        ...current.permissions,
                        [permission.key]: event.target.checked,
                      },
                    }))
                  }
                />
                {permission.label}
              </label>
            ))}
          </div>
        </div>
        <label className="flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <input
            type="checkbox"
            checked={form.inviteWithAccount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                inviteWithAccount: event.target.checked,
              }))
            }
            className="mt-1"
          />
          Enviar invitación para que esta persona tenga cuenta
        </label>
        <SelectField
          label="Estado de contacto"
          value={form.status}
          onChange={(value) =>
            setForm((current) => ({ ...current, status: value as CareContact["status"] }))
          }
          options={[
            { label: "En línea", value: "En línea" },
            { label: "Disponible", value: "Disponible" },
            { label: "Fuera de horario", value: "Fuera de horario" },
          ]}
        />
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
        <Plus size={17} />
        Agregar contacto
      </button>
    </form>
  );
}

function PermissionPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
      {label}
    </span>
  );
}

function getProfessionalAdherence(patient: ProfessionalPatient) {
  if (patient.medications.length === 0) return 0;
  const taken = patient.medications.filter((medication) => medication.status === "tomado").length;
  return Math.round((taken / patient.medications.length) * 100);
}

function getProfessionalScheduledVisits(patients: ProfessionalPatient[]): ProfessionalScheduledVisit[] {
  return patients
    .flatMap((patient) =>
      patient.visits
        .filter((visit) => visit.status === "pendiente")
        .map((visit) => ({
          patientId: patient.id,
          patientName: patient.name,
          patientAge: patient.age,
          patientStatus: patient.generalStatus,
          visit,
        })),
    )
    .sort((a, b) => compareVisitsBySchedule(a.visit, b.visit));
}

function convertEnterprisePatientToProfessionalPatient(patient: EnterprisePatient): ProfessionalPatient {
  const today = getTodayIso();
  return {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    diagnosis: patient.status,
    location: patient.location,
    emergencyContact: patient.familyAccesses[0]
      ? `${patient.familyAccesses[0].name} · ${patient.familyAccesses[0].email}`
      : "Sin contacto familiar cargado",
    generalStatus: patient.status,
    allergies: "Sin alergias registradas en demo institucional",
    carePlan: `Seguimiento institucional por ${formatAssignedDoctors(patient.assignedDoctors)}.`,
    clinicalNotes: patient.alerts.join(". "),
    medications: patient.medications.map((medication, index) => ({
      id: `${patient.id}-enterprise-med-${index}`,
      name: medication.name,
      dose: "Dosis registrada en institución",
      purpose: "Tratamiento indicado por el equipo de salud.",
      time: medication.time,
      status: medication.status,
      frequencyType: "daily",
      intervalHours: 24,
      weeklyDays: [],
      reminderEnabled: false,
      reminderEmail: "",
    })),
    visits: patient.visits.map((visit, index) => ({
      id: `${patient.id}-enterprise-visit-${index}`,
      professional: visit.professional,
      role: visit.type,
      date: formatSelectedDate(today),
      dateIso: today,
      time: visit.time,
      procedures: visit.type,
      notes: `Profesional asignado: ${visit.professional}`,
      status: visit.status,
      recurrenceType: "once",
      weeklyDays: [],
      monthlyDay: null,
    })),
    history: patient.history,
    familyAccesses: patient.familyAccesses,
  };
}

function isMedicationScheduledToday(medication: Medication, dateIso: string) {
  if (medication.frequencyType === "weekly") {
    return medication.weeklyDays.includes(getWeekdayFromIso(dateIso));
  }
  return true;
}

function buildFamilyAccess(form: FamilyAccessForm): PatientFamilyAccess {
  const canEdit = form.accessLevel === "full" || form.accessLevel === "editor";
  return {
    id: `family-access-${Date.now()}`,
    name: form.name.trim(),
    email: form.email.trim(),
    relationship: form.relationship.trim() || "Familiar",
    accessLevel: form.accessLevel,
    invitationStatus: "pendiente",
    permissions: {
      canManagePatient: form.accessLevel === "full",
      canManageMedications: form.accessLevel === "full",
      canConfirmMedications: canEdit || form.canConfirmMedications,
      canManageVisits: form.accessLevel === "full",
      canConfirmVisits: canEdit || form.canConfirmVisits,
      canManageContacts: false,
      canViewHistory: true,
    },
  };
}

function EvolutionSection({
  metrics,
  activityLog,
}: {
  metrics: { label: string; value: string; trend: string; percent: number }[];
  activityLog: ActivityLog[];
}) {
  return (
    <section>
      <SectionHeader
        title="Historial y evolución"
        subtitle="Indicadores recientes para evaluar avances, cumplimiento y eventos resueltos."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm text-blue-700">{metric.trend}</p>
            <div className="mt-5">
              <ProgressBar value={metric.percent} tone={metric.percent >= 75 ? "green" : "blue"} />
            </div>
          </article>
        ))}
      </div>

      <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Registros recientes</h2>
        <div className="mt-4 grid gap-3">
          {activityLog.map((record) => (
            <div key={record.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">
                {formatDateTime(record.createdAt)}
              </span>{" "}
              {record.message}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getDailyMedications(
  medications: Medication[],
  intakes: MedicationIntake[],
  selectedDate: string,
) {
  return medications
    .flatMap((medication) =>
      getScheduledTimesForMedication(medication, selectedDate).map((time) => {
        const intake = intakes.find(
          (item) =>
            item.medicationId === medication.id &&
            item.scheduledDate === selectedDate &&
            item.scheduledTime === time,
        );

        return {
          ...medication,
          scheduleKey: `${medication.id}-${selectedDate}-${time}`,
          time,
          status:
            intake?.status ??
            getDefaultDailyMedicationStatus({ ...medication, time }, selectedDate),
        };
      }),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}

function getDefaultDailyMedicationStatus(
  medication: Medication,
  selectedDate: string,
): MedicationStatus {
  const today = getTodayIso();

  if (selectedDate < today) return "atrasado";
  if (selectedDate > today) return "pendiente";

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [hours, minutes] = medication.time.split(":").map(Number);
  const medicationMinutes = hours * 60 + minutes;

  return medicationMinutes < currentMinutes ? "atrasado" : "pendiente";
}

function buildDaySummaries(
  medications: Medication[],
  intakes: MedicationIntake[],
  visits: Visit[],
): DaySummary[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = getDateOffset(index - 6);
    const dayMedications = getDailyMedications(medications, intakes, date);
    const taken = dayMedications.filter((medication) => medication.status === "tomado").length;
    const missed = dayMedications.filter((medication) => medication.status === "atrasado").length;
    const dayVisits = visits.filter((visit) => (visit.dateIso ?? toIsoDate(visit.date)) === date);
    const pendingPastVisits = dayVisits.filter(
      (visit) => visit.status === "pendiente" && date < getTodayIso(),
    ).length;
    const pendingVisits = dayVisits.filter((visit) => visit.status === "pendiente").length;
    const completedVisits = dayVisits.filter((visit) => visit.status === "realizada").length;
    const tone =
      missed > 0 || pendingPastVisits > 0
        ? "red"
        : date === getTodayIso() && (pendingVisits > 0 || taken < dayMedications.length)
          ? "yellow"
          : "green";

    return {
      date,
      label: String(new Date(`${date}T00:00:00`).getDate()),
      taken,
      total: dayMedications.length,
      pendingVisits,
      completedVisits,
      tone,
    };
  });
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getDateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function getDateRange(startOffset: number, days: number) {
  return Array.from({ length: days }, (_, index) => getDateOffset(startOffset + index));
}

function formatSelectedDate(value: string) {
  const today = getTodayIso();
  if (value === today) return "Hoy";

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function getDayTileDisplay(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return {
    weekday: new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(date),
    dayNumber: new Intl.DateTimeFormat("es-AR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date),
  };
}

function getDayToneLabel(tone: DaySummary["tone"]) {
  const labels: Record<DaySummary["tone"], string> = {
    green: "OK",
    yellow: "Hoy",
    red: "Revisar",
  };

  return labels[tone];
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleLabel(roleType: UserRole) {
  const labels: Record<UserRole, string> = {
    family: "Familiar responsable",
    doctor: "Médico",
    senior: "Paciente",
  };

  return labels[roleType];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function compareVisitsBySchedule(a: Visit, b: Visit) {
  const dateA = `${a.dateIso ?? toIsoDate(a.date)}T${a.time}`;
  const dateB = `${b.dateIso ?? toIsoDate(b.date)}T${b.time}`;

  return dateA.localeCompare(dateB);
}

function toIsoDate(displayDate: string) {
  const [day, month, year] = displayDate.split("/");
  return `${year}-${month}-${day}`;
}

function getFrequencySelectValue(form: MedicationForm) {
  if (form.frequencyType === "interval") return `interval-${form.intervalHours ?? 12}`;
  return form.frequencyType;
}

function getReminderTimesForMedication(medication: Medication) {
  const todayTimes = getScheduledTimesForMedication(medication, getTodayIso());
  return todayTimes.length > 0 ? todayTimes : [medication.time];
}

function formatMedicationFrequency(medication: Medication) {
  if (medication.frequencyType === "weekly") {
    const days = weekDays
      .filter((day) => medication.weeklyDays.includes(day.value))
      .map((day) => day.label)
      .join(", ");
    return days ? `Semanal: ${days}` : "Semanal";
  }

  if (medication.frequencyType === "interval" && medication.intervalHours) {
    return `Cada ${medication.intervalHours} horas`;
  }

  return "Diario";
}

function getVisitSeriesDates(
  visit: Pick<VisitForm, "date" | "recurrenceType" | "weeklyDays" | "monthlyDay">,
) {
  if (visit.recurrenceType === "once") return [visit.date];

  const start = parseIsoLocalDate(visit.date);

  if (visit.recurrenceType === "daily") {
    return Array.from({ length: 14 }, (_, index) => formatLocalIsoDate(addDays(start, index)));
  }

  if (visit.recurrenceType === "weekly") {
    const selectedDays = visit.weeklyDays.length > 0 ? visit.weeklyDays : [start.getDay()];
    const dates: string[] = [];

    for (let offset = 0; dates.length < 12 && offset < 84; offset += 1) {
      const date = addDays(start, offset);
      if (selectedDays.includes(date.getDay())) {
        dates.push(formatLocalIsoDate(date));
      }
    }

    return dates;
  }

  const dates: string[] = [];
  const targetDay = Math.min(31, Math.max(1, visit.monthlyDay || start.getDate()));

  for (let monthOffset = 0; dates.length < 6 && monthOffset < 8; monthOffset += 1) {
    const year = start.getFullYear();
    const month = start.getMonth() + monthOffset;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const date = new Date(year, month, Math.min(targetDay, lastDay));

    if (date >= start) {
      dates.push(formatLocalIsoDate(date));
    }
  }

  return dates;
}

function formatVisitRecurrence(
  visit: {
    recurrenceType: VisitRecurrence;
    weeklyDays: number[];
    monthlyDay?: number | null;
  },
) {
  if (visit.recurrenceType === "daily") return "Diaria";
  if (visit.recurrenceType === "monthly") return `Mensual: día ${visit.monthlyDay}`;
  if (visit.recurrenceType === "weekly") {
    const days = weekDays
      .filter((day) => visit.weeklyDays.includes(day.value))
      .map((day) => day.label)
      .join(", ");
    return days ? `Semanal: ${days}` : "Semanal";
  }

  return "Una sola vez";
}

function getPermissionsForAccessLevel(accessLevel: AccessLevel): UserPermissions {
  if (accessLevel === "full") return fullPermissions;
  if (accessLevel === "editor") {
    return {
      ...fullPermissions,
      canManagePatient: false,
      canManageContacts: false,
    };
  }
  if (accessLevel === "senior_limited") return seniorLimitedPermissions;
  return viewerPermissions;
}

function formatAccessLevel(accessLevel: AccessLevel) {
  const labels: Record<AccessLevel, string> = {
    full: "Acceso completo",
    editor: "Editor de cuidado",
    viewer: "Solo lectura",
    senior_limited: "Persona mayor",
    custom: "Personalizado",
  };

  return labels[accessLevel];
}

function formatInvitationStatus(status: CareContact["invitationStatus"]) {
  const labels: Record<CareContact["invitationStatus"], string> = {
    "sin cuenta": "sin cuenta",
    pendiente: "invitación pendiente",
    aceptada: "aceptada",
    rechazada: "rechazada",
  };

  return labels[status];
}

function formatAssignedDoctors(doctors: string[]) {
  if (doctors.length === 0) return "Sin equipo asignado";
  if (doctors.length === 1) return doctors[0];
  return `${doctors[0]} + ${doctors.length - 1} más`;
}

function parseIsoLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getWeekdayFromIso(value: string) {
  return parseIsoLocalDate(value).getDay();
}

function getDayOfMonthFromIso(value: string) {
  return parseIsoLocalDate(value).getDate();
}

function createClientUuid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    "00000000-0000-4000-8000-000000000000"
  );
}

function getStoredDemoUser() {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = window.sessionStorage.getItem(demoSessionStorageKey);
    return rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
  } catch {
    return null;
  }
}

function storeDemoUser(user: SessionUser) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(demoSessionStorageKey, JSON.stringify(user));
}

function clearStoredDemoUser() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(demoSessionStorageKey);
}

function getShortTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function getCurrentTimeLabel() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
