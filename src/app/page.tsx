"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Clock,
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
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Landing } from "@/components/Landing";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  contacts as defaultContacts,
  dayEvents,
  evolutionMetrics,
  initialAlerts,
  initialMedications,
  initialPatient,
  initialVisits,
} from "@/data/mockData";
import {
  createActivityLog,
  createAlert,
  createContact,
  createMedication,
  createReminder,
  createReminderEmail,
  createVisit,
  getDemoUsers,
  loadMedicareData,
  updateAlertResolved,
  upsertMedicationIntake,
  updatePatient as savePatient,
} from "@/lib/medicareData";
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
  SectionId,
  SessionUser,
  UserRole,
  Visit,
  VisitStatus,
} from "@/types";

type MedicationForm = {
  name: string;
  dose: string;
  time: string;
};

type ReminderForm = {
  medicationId: string;
  recipientEmail: string;
  scheduledTime: string;
};

type VisitForm = {
  professional: string;
  role: string;
  date: string;
  time: string;
  procedures: string;
  notes: string;
  status: VisitStatus;
};

type AlertForm = {
  title: string;
  detail: string;
  priority: AlertPriority;
};

type ContactForm = {
  name: string;
  role: string;
  status: CareContact["status"];
};

const defaultActivityLog: ActivityLog[] = [];

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [entered, setEntered] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
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
  const [loadingData, setLoadingData] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    getDemoUsers()
      .then((users) => setDemoUsers(users))
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
    setEntered(true);
    setActiveSection("dashboard");
    await hydratePatientData(user.patientId);
  };

  const handleLogout = () => {
    setSession(null);
    setEntered(false);
  };

  const markMedicationAsTaken = async (id: string) => {
    const medication = medications.find((item) => item.id === id);
    if (!patient.id) return;

    const intake = await upsertMedicationIntake({
      patientId: patient.id,
      medicationId: id,
      scheduledDate: selectedDate,
      status: "tomado",
    });

    setIntakes((current) =>
      [intake, ...current.filter((item) => item.id !== intake.id)].filter(
        (item, index, array) =>
          array.findIndex(
            (candidate) =>
              candidate.medicationId === item.medicationId &&
              candidate.scheduledDate === item.scheduledDate,
          ) === index,
      ),
    );
    if (medication) await addLog(`${medication.name} marcada como tomada.`);
  };

  const addMedication = async (form: MedicationForm) => {
    if (!patient.id) return;
    const medication = await createMedication(patient.id, {
      name: form.name.trim(),
      dose: form.dose.trim(),
      time: form.time,
    });
    setMedications((current) =>
      [...current, medication].sort((a, b) => a.time.localeCompare(b.time)),
    );
    await addLog(`Nueva medicación registrada: ${medication.name} a las ${medication.time}.`);
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
    const visit = await createVisit(patient.id, {
      professional: form.professional.trim(),
      role: form.role.trim(),
      date: form.date,
      time: form.time,
      procedures: form.procedures.trim(),
      notes: form.notes.trim(),
      status: form.status,
    });
    setVisits((current) => [visit, ...current]);
    await addLog(`Visita registrada: ${visit.professional} (${visit.status}).`);
  };

  const addContact = async (form: ContactForm) => {
    if (!patient.id) return;
    const contact = await createContact(patient.id, {
      name: form.name.trim(),
      role: form.role.trim(),
      status: form.status,
      initials: getInitials(form.name),
    });
    setContacts((current) => [...current, contact]);
    await addLog(`Nuevo contacto agregado: ${contact.name}.`);
  };

  const updatePatient = async (updatedPatient: Patient) => {
    const savedPatient = await savePatient(updatedPatient);
    setPatient(savedPatient);
    await addLog(`Datos del paciente actualizados: ${savedPatient.name}.`);
  };

  const addReminder = async (form: ReminderForm) => {
    if (!patient.id) return;
    const reminder = await createReminder(patient.id, {
      medicationId: form.medicationId,
      recipientEmail: form.recipientEmail.trim(),
      scheduledTime: form.scheduledTime,
      createdByDemoUser: session?.id,
    });
    await createReminderEmail(patient.id, reminder);
    setReminders((current) => [...current, reminder].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));
    await addLog(`Recordatorio por email programado para ${reminder.recipientEmail}.`);
  };

  if (!entered) {
    return <Landing onEnter={() => setEntered(true)} />;
  }

  if (!session) {
    return (
      <LoginScreen
        demoUsers={demoUsers}
        loading={!hydrated || loadingData}
        error={appError}
        onLogin={handleLogin}
      />
    );
  }

  if (session.roleType === "senior") {
    return (
      <SeniorPortal
        patient={patient}
        medications={visibleMedications}
        baseMedications={medications}
        intakes={intakes}
        visits={visits}
        reminders={reminders}
        loading={loadingData}
        error={appError}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      patient={patient}
      user={session}
      onLogout={handleLogout}
    >
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
          reminders={reminders}
          intakes={intakes}
          visits={visits}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          adherence={adherence}
          onAddMedication={addMedication}
          onAddReminder={addReminder}
          onMarkTaken={markMedicationAsTaken}
          canEdit
        />
      ) : null}
      {activeSection === "visitas" ? (
        <VisitsSection
          visits={visits}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onAddVisit={addVisit}
          canEdit
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
          canEdit
        />
      ) : null}
      {activeSection === "historial" ? (
        <EvolutionSection metrics={dynamicMetrics} activityLog={activityLog} />
      ) : null}
    </AppShell>
  );
}

function LoginScreen({
  demoUsers,
  loading,
  error,
  onLogin,
}: {
  demoUsers: SessionUser[];
  loading: boolean;
  error: string | null;
  onLogin: (user: SessionUser) => void;
}) {
  return (
    <main className="health-gradient flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-white bg-white/90 p-6 shadow-xl shadow-blue-900/10 backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <LogIn size={24} />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">Ingreso MEDICARE</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Elegí un usuario demo. La información se guarda en Supabase.
        </p>
        {error ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {demoUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                {user.initials}
              </div>
              <p className="mt-4 font-bold text-slate-950">{user.name}</p>
              <p className="mt-1 text-sm text-slate-500">{user.role}</p>
              <p className="mt-3 text-xs font-semibold text-blue-700">{user.email}</p>
            </button>
          ))}
        </div>
        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-700">
            <Loader2 className="animate-spin" size={17} />
            Cargando datos...
          </p>
        ) : null}
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
          <h2 className="text-lg font-bold text-slate-950">Calendario de cuidado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Verde: día completo. Amarillo: pendiente hoy. Rojo: faltó algo.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {formatSelectedDate(selectedDate)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {summaries.map((day) => (
          <button
            key={day.date}
            onClick={() => onSelectDate(day.date)}
            className={`min-h-24 rounded-xl border p-2 text-left transition ${
              selectedDate === day.date
                ? "border-blue-600 ring-2 ring-blue-100"
                : "border-slate-200 hover:border-blue-200"
            }`}
          >
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                day.tone === "green"
                  ? "bg-emerald-100 text-emerald-700"
                  : day.tone === "red"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {day.label}
            </span>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {day.taken}/{day.total} medic.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {day.completedVisits + day.pendingVisits} visitas
            </p>
          </button>
        ))}
      </div>
    </article>
  );
}

function SeniorPortal({
  patient,
  medications,
  baseMedications,
  intakes,
  visits,
  reminders,
  loading,
  error,
  onLogout,
}: {
  patient: Patient;
  medications: Medication[];
  baseMedications: Medication[];
  intakes: MedicationIntake[];
  visits: Visit[];
  reminders: MedicationReminder[];
  loading: boolean;
  error: string | null;
  onLogout: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const dailyMedications = getDailyMedications(baseMedications, intakes, selectedDate);
  const daySummaries = buildDaySummaries(baseMedications, intakes, visits);
  const pendingMedications = medications
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
                <div key={medication.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{medication.name}</p>
                      <p className="mt-1 text-slate-500">{medication.dose}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">{medication.time}</p>
                      <StatusBadge value={medication.status} />
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
  reminders,
  intakes,
  visits,
  selectedDate,
  onDateChange,
  adherence,
  onAddMedication,
  onAddReminder,
  onMarkTaken,
  canEdit,
}: {
  medications: Medication[];
  reminders: MedicationReminder[];
  intakes: MedicationIntake[];
  visits: Visit[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  adherence: number;
  onAddMedication: (form: MedicationForm) => void;
  onAddReminder: (form: ReminderForm) => void;
  onMarkTaken: (id: string) => void;
  canEdit: boolean;
}) {
  const taken = medications.filter((medication) => medication.status === "tomado").length;
  const daySummaries = buildDaySummaries(medications, intakes, visits);

  return (
    <section>
      <SectionHeader
        title="Medicación"
        subtitle="Vista de 24 horas para saber qué se tomó, qué falta y qué quedó atrasado."
      />
      <div className="mb-5">
        <DayCalendar
          selectedDate={selectedDate}
          summaries={daySummaries}
          onSelectDate={onDateChange}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          {canEdit ? (
            <AddMedicationForm onAddMedication={onAddMedication} />
          ) : (
            <ReadOnlyNotice
              title="Modo familiar"
              text="Podés confirmar tomas, consultar horarios y agregar recordatorios por email. La carga del tratamiento queda para el perfil médico."
            />
          )}
          <AddReminderForm
            medications={medications}
            reminders={reminders}
            onAddReminder={onAddReminder}
          />
        </div>
        <div>
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Cumplimiento del día</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {taken} de {medications.length} tomas confirmadas.
                </p>
              </div>
              <span className="text-3xl font-bold text-blue-700">{adherence}%</span>
            </div>
            <div className="mt-4">
              <ProgressBar value={adherence} tone={adherence >= 70 ? "green" : "amber"} />
            </div>
          </div>

          <div className="grid gap-4">
            {medications.map((medication) => (
              <article
                key={medication.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Pill size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-950">{medication.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{medication.dose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock size={18} />
                  <span className="font-semibold">{medication.time}</span>
                  <StatusBadge value={medication.status} />
                </div>
                <button
                  onClick={() => onMarkTaken(medication.id)}
                  disabled={medication.status === "tomado"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <Check size={17} />
                  {medication.status === "tomado" ? "Confirmado" : "Marcar tomado"}
                </button>
              </article>
            ))}
          </div>
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
    time: "09:00",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.dose.trim() || !form.time) return;
    onAddMedication(form);
    setForm({ name: "", dose: "", time: "09:00" });
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
        <TextField
          label="Horario"
          type="time"
          value={form.time}
          onChange={(value) => setForm((current) => ({ ...current, time: value }))}
          required
        />
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
        <Plus size={17} />
        Agregar
      </button>
    </form>
  );
}

function AddReminderForm({
  medications,
  reminders,
  onAddReminder,
}: {
  medications: Medication[];
  reminders: MedicationReminder[];
  onAddReminder: (form: ReminderForm) => void;
}) {
  const pendingMedication = medications.find((medication) => medication.status !== "tomado");
  const [form, setForm] = useState<ReminderForm>({
    medicationId: pendingMedication?.id ?? medications[0]?.id ?? "",
    recipientEmail: "familiar@medicare.demo",
    scheduledTime: pendingMedication?.time ?? "09:00",
  });

  useEffect(() => {
    if (!form.medicationId && medications[0]) {
      setForm((current) => ({
        ...current,
        medicationId: medications[0].id,
        scheduledTime: medications[0].time,
      }));
    }
  }, [form.medicationId, medications]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.medicationId || !form.recipientEmail.trim() || !form.scheduledTime) return;
    onAddReminder(form);
    setForm((current) => ({ ...current, recipientEmail: "", scheduledTime: "09:00" }));
  };

  return (
    <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <Mail size={21} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Recordatorio por email</h2>
          <p className="text-sm text-slate-500">MVP: queda en cola de envío en Supabase.</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <SelectField
          label="Medicamento"
          value={form.medicationId}
          onChange={(value) => {
            const medication = medications.find((item) => item.id === value);
            setForm((current) => ({
              ...current,
              medicationId: value,
              scheduledTime: medication?.time ?? current.scheduledTime,
            }));
          }}
          options={medications.map((medication) => ({
            label: `${medication.name} · ${medication.time}`,
            value: medication.id,
          }))}
        />
        <TextField
          label="Email de destino"
          type="email"
          value={form.recipientEmail}
          onChange={(value) => setForm((current) => ({ ...current, recipientEmail: value }))}
          placeholder="familiar@email.com"
          required
        />
        <TextField
          label="Hora de recordatorio"
          type="time"
          value={form.scheduledTime}
          onChange={(value) => setForm((current) => ({ ...current, scheduledTime: value }))}
          required
        />
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
        <Plus size={17} />
        Programar recordatorio
      </button>
      <div className="mt-5 space-y-2">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-bold text-slate-800">{reminder.scheduledTime}</span>{" "}
            {reminder.medicationName} · {reminder.recipientEmail}
          </div>
        ))}
      </div>
    </form>
  );
}

function VisitsSection({
  visits,
  selectedDate,
  onDateChange,
  onAddVisit,
  canEdit,
}: {
  visits: Visit[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddVisit: (form: VisitForm) => void;
  canEdit: boolean;
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
          />
          <VisitGroup
            title="Próximas visitas agendadas"
            emptyText="No hay visitas pendientes."
            visits={pendingVisits}
          />
          <VisitGroup
            title="Historial de visitas realizadas"
            emptyText="Todavía no hay visitas realizadas."
            visits={completedVisits}
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
}: {
  title: string;
  emptyText: string;
  visits: Visit[];
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
          visits.map((visit) => <VisitCard key={visit.id} visit={visit} />)
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
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
          </div>
        </div>
        <StatusBadge value={visit.status} />
      </div>
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
  const [form, setForm] = useState<VisitForm>({
    professional: "",
    role: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    procedures: "",
    notes: "",
    status: "pendiente",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.professional.trim() || !form.role.trim()) return;
    onAddVisit(form);
    setForm({
      professional: "",
      role: "",
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      procedures: "",
      notes: "",
      status: "pendiente",
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
            onChange={(value) => setForm((current) => ({ ...current, date: value }))}
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
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Users size={17} />
                  Contacto
                </span>
                <span
                  className={`text-sm font-bold ${
                    contact.status === "Fuera de horario" ? "text-slate-500" : "text-emerald-700"
                  }`}
                >
                  {contact.status}
                </span>
              </div>
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
    status: "Disponible",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    onAddContact(form);
    setForm({ name: "", role: "", status: "Disponible" });
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
  return medications.map((medication) => {
    const intake = intakes.find(
      (item) => item.medicationId === medication.id && item.scheduledDate === selectedDate,
    );

    return {
      ...medication,
      status: intake?.status ?? getDefaultDailyMedicationStatus(medication, selectedDate),
    };
  });
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

function formatSelectedDate(value: string) {
  const today = getTodayIso();
  if (value === today) return "Hoy";

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
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

function getShortTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}
