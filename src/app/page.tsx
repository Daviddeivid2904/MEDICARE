"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Clock,
  HeartPulse,
  LogIn,
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
import type {
  AlertPriority,
  CareAlert,
  CareContact,
  Medication,
  MedicationStatus,
  Patient,
  SectionId,
  SessionUser,
  Visit,
  VisitStatus,
} from "@/types";

const STORAGE_KEY = "medicare-mvp-state-v2";

type PersistedState = {
  session: SessionUser | null;
  activeSection: SectionId;
  patient: Patient;
  medications: Medication[];
  visits: Visit[];
  alerts: CareAlert[];
  contacts: CareContact[];
  activityLog: string[];
};

type MedicationForm = {
  name: string;
  dose: string;
  time: string;
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

const defaultActivityLog = [
  "12/05 10:30 · Visita clínica registrada con estado estable.",
  "12/05 08:20 · Presión arterial dentro de rango.",
  "11/05 20:05 · Medicación nocturna confirmada.",
  "11/05 17:40 · Alerta de control atrasado resuelta.",
];

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [entered, setEntered] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [alerts, setAlerts] = useState<CareAlert[]>(initialAlerts);
  const [contacts, setContacts] = useState<CareContact[]>(defaultContacts);
  const [activityLog, setActivityLog] = useState<string[]>(defaultActivityLog);

  useEffect(() => {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (rawState) {
      try {
        const parsed = JSON.parse(rawState) as Partial<PersistedState>;
        if (parsed.session) {
          setSession(parsed.session);
          setEntered(true);
        }
        if (parsed.activeSection) setActiveSection(parsed.activeSection);
        if (parsed.patient) setPatient(parsed.patient);
        if (parsed.medications) setMedications(parsed.medications);
        if (parsed.visits) setVisits(parsed.visits);
        if (parsed.alerts) setAlerts(parsed.alerts);
        if (parsed.contacts) setContacts(parsed.contacts);
        if (parsed.activityLog) setActivityLog(parsed.activityLog);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const state: PersistedState = {
      session,
      activeSection,
      patient,
      medications,
      visits,
      alerts,
      contacts,
      activityLog,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    activeSection,
    activityLog,
    alerts,
    contacts,
    hydrated,
    medications,
    patient,
    session,
    visits,
  ]);

  const visibleMedications = useMemo(
    () =>
      medications.map((medication) => ({
        ...medication,
        status: getMedicationStatus(medication),
      })),
    [medications],
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

  const addLog = (message: string) => {
    setActivityLog((current) => [`${getShortTimestamp()} · ${message}`, ...current].slice(0, 10));
  };

  const handleLogin = (name: string) => {
    const userName = name.trim() || "Ana Gómez";
    setSession({
      name: userName,
      role: "Familiar responsable",
      initials: getInitials(userName),
    });
    setEntered(true);
    setActiveSection("dashboard");
  };

  const handleLogout = () => {
    setSession(null);
    setEntered(false);
  };

  const markMedicationAsTaken = (id: number) => {
    const medication = medications.find((item) => item.id === id);
    setMedications((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "tomado" } : item)),
    );
    if (medication) addLog(`${medication.name} marcada como tomada.`);
  };

  const addMedication = (form: MedicationForm) => {
    const medication: Medication = {
      id: Date.now(),
      name: form.name.trim(),
      dose: form.dose.trim(),
      time: form.time,
      status: "pendiente",
    };
    setMedications((current) => [...current, medication].sort((a, b) => a.time.localeCompare(b.time)));
    addLog(`Nueva medicación registrada: ${medication.name} a las ${medication.time}.`);
  };

  const resolveAlert = (id: number) => {
    const alert = alerts.find((item) => item.id === id);
    setAlerts((current) =>
      current.map((item) => (item.id === id ? { ...item, resolved: true } : item)),
    );
    if (alert) addLog(`Alerta resuelta: ${alert.title}.`);
  };

  const addAlert = (form: AlertForm) => {
    const alert: CareAlert = {
      id: Date.now(),
      title: form.title.trim(),
      detail: form.detail.trim(),
      priority: form.priority,
      resolved: false,
    };
    setAlerts((current) => [alert, ...current]);
    addLog(`Nueva alerta cargada: ${alert.title}.`);
  };

  const addVisit = (form: VisitForm) => {
    const visit: Visit = {
      id: Date.now(),
      professional: form.professional.trim(),
      role: form.role.trim(),
      date: formatDate(form.date),
      time: form.time,
      procedures: form.procedures.trim(),
      notes: form.notes.trim(),
      status: form.status,
    };
    setVisits((current) => [visit, ...current]);
    addLog(`Visita registrada: ${visit.professional} (${visit.status}).`);
  };

  const addContact = (form: ContactForm) => {
    const contact: CareContact = {
      id: Date.now(),
      name: form.name.trim(),
      role: form.role.trim(),
      status: form.status,
      initials: getInitials(form.name),
    };
    setContacts((current) => [...current, contact]);
    addLog(`Nuevo contacto agregado: ${contact.name}.`);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatient(updatedPatient);
    addLog(`Datos del paciente actualizados: ${updatedPatient.name}.`);
  };

  if (!entered) {
    return <Landing onEnter={() => setEntered(true)} />;
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      patient={patient}
      user={session}
      onLogout={handleLogout}
    >
      {activeSection === "dashboard" ? (
        <Dashboard
          adherence={adherence}
          patient={patient}
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
          adherence={adherence}
          onAddMedication={addMedication}
          onMarkTaken={markMedicationAsTaken}
        />
      ) : null}
      {activeSection === "visitas" ? (
        <VisitsSection visits={visits} onAddVisit={addVisit} />
      ) : null}
      {activeSection === "alertas" ? (
        <AlertsSection alerts={alerts} onAddAlert={addAlert} onResolve={resolveAlert} />
      ) : null}
      {activeSection === "familia" ? (
        <FamilySection contacts={contacts} onAddContact={addContact} />
      ) : null}
      {activeSection === "historial" ? (
        <EvolutionSection metrics={dynamicMetrics} activityLog={activityLog} />
      ) : null}
    </AppShell>
  );
}

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState("Ana Gómez");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(name);
  };

  return (
    <main className="health-gradient flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white bg-white/90 p-6 shadow-xl shadow-blue-900/10 backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <LogIn size={24} />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">Ingreso familiar</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sesión simulada para usar el MVP sin backend ni base de datos.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nombre del familiar</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              placeholder="Ana Gómez"
            />
          </label>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            <LogIn size={18} />
            Ingresar como familiar
          </button>
        </form>
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

function Dashboard({
  adherence,
  patient,
  nextMedication,
  lastVisit,
  activeAlerts,
  activityLog,
  onPatientUpdate,
}: {
  adherence: number;
  patient: Patient;
  nextMedication: Medication | undefined;
  lastVisit: Visit;
  activeAlerts: CareAlert[];
  activityLog: string[];
  onPatientUpdate: (patient: Patient) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Dashboard del familiar"
        subtitle="Vista rápida del estado general, medicación, visitas y alertas activas."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PatientCard patient={patient} adherence={adherence} onPatientUpdate={onPatientUpdate} />

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Resumen del día</h2>
          <div className="mt-4 space-y-3">
            {[...dayEvents, ...activityLog.slice(0, 2)].slice(0, 5).map((event) => (
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
  adherence,
  onPatientUpdate,
}: {
  patient: Patient;
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
  adherence,
  onAddMedication,
  onMarkTaken,
}: {
  medications: Medication[];
  adherence: number;
  onAddMedication: (form: MedicationForm) => void;
  onMarkTaken: (id: number) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Medicación"
        subtitle="Control de tratamientos, horarios y cumplimiento diario del paciente."
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <AddMedicationForm onAddMedication={onAddMedication} />
        <div>
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Cumplimiento de hoy</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {adherence}% de la medicación fue confirmada.
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

function VisitsSection({
  visits,
  onAddVisit,
}: {
  visits: Visit[];
  onAddVisit: (form: VisitForm) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Visitas médicas"
        subtitle="Historial de profesionales, procedimientos, observaciones y visitas pendientes."
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <AddVisitForm onAddVisit={onAddVisit} />
        <div className="grid gap-4">
          {visits.map((visit) => (
            <article key={visit.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
          ))}
        </div>
      </div>
    </section>
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
  onResolve,
}: {
  alerts: CareAlert[];
  onAddAlert: (form: AlertForm) => void;
  onResolve: (id: number) => void;
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
                <button
                  onClick={() => onResolve(alert.id)}
                  disabled={alert.resolved}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-emerald-800"
                >
                  <Check size={17} />
                  {alert.resolved ? "Resuelta" : "Marcar resuelta"}
                </button>
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
}: {
  contacts: CareContact[];
  onAddContact: (form: ContactForm) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Familia y cuidadores"
        subtitle="Personas conectadas al cuidado, con roles claros y estado de contacto."
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <AddContactForm onAddContact={onAddContact} />
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
  activityLog: string[];
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
            <div key={record} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {record}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
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

function getMedicationStatus(medication: Medication): MedicationStatus {
  if (medication.status === "tomado") return "tomado";

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [hours, minutes] = medication.time.split(":").map(Number);
  const medicationMinutes = hours * 60 + minutes;

  return medicationMinutes < currentMinutes ? "atrasado" : "pendiente";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string) {
  if (!date) return new Date().toLocaleDateString("es-AR");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getShortTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}
