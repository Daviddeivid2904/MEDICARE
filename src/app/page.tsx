"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Clock,
  HeartPulse,
  Pill,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Landing } from "@/components/Landing";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  contacts,
  dayEvents,
  evolutionMetrics,
  initialAlerts,
  initialMedications,
  visits,
} from "@/data/mockData";
import type { CareAlert, Medication, SectionId } from "@/types";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [alerts, setAlerts] = useState<CareAlert[]>(initialAlerts);

  const takenCount = medications.filter((medication) => medication.status === "tomado").length;
  const adherence = Math.round((takenCount / medications.length) * 100);
  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const nextMedication =
    medications.find((medication) => medication.status !== "tomado") ?? medications[0];
  const lastVisit = visits.find((visit) => visit.status === "realizada") ?? visits[0];

  const resolvedAlerts = alerts.filter((alert) => alert.resolved).length;
  const dynamicMetrics = useMemo(
    () =>
      evolutionMetrics.map((metric) =>
        metric.label === "Adherencia a medicación"
          ? { ...metric, value: `${adherence}%`, percent: adherence }
          : metric.label === "Alertas resueltas"
            ? {
                ...metric,
                value: String(18 + resolvedAlerts),
                trend: `${resolvedAlerts} resueltas en esta sesión`,
                percent: Math.min(100, metric.percent + resolvedAlerts * 4),
              }
            : metric,
      ),
    [adherence, resolvedAlerts],
  );

  const markMedicationAsTaken = (id: number) => {
    setMedications((current) =>
      current.map((medication) =>
        medication.id === id ? { ...medication, status: "tomado" } : medication,
      ),
    );
  };

  const resolveAlert = (id: number) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, resolved: true } : alert)),
    );
  };

  if (!entered) {
    return <Landing onEnter={() => setEntered(true)} />;
  }

  return (
    <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "dashboard" ? (
        <Dashboard
          adherence={adherence}
          nextMedication={nextMedication}
          lastVisit={lastVisit}
          activeAlerts={activeAlerts}
        />
      ) : null}
      {activeSection === "medicacion" ? (
        <MedicationSection
          medications={medications}
          adherence={adherence}
          onMarkTaken={markMedicationAsTaken}
        />
      ) : null}
      {activeSection === "visitas" ? <VisitsSection /> : null}
      {activeSection === "alertas" ? (
        <AlertsSection alerts={alerts} onResolve={resolveAlert} />
      ) : null}
      {activeSection === "familia" ? <FamilySection /> : null}
      {activeSection === "historial" ? <EvolutionSection metrics={dynamicMetrics} /> : null}
    </AppShell>
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
  nextMedication,
  lastVisit,
  activeAlerts,
}: {
  adherence: number;
  nextMedication: Medication;
  lastVisit: (typeof visits)[number];
  activeAlerts: CareAlert[];
}) {
  return (
    <section>
      <SectionHeader
        title="Dashboard del familiar"
        subtitle="Vista rápida del estado general, medicación, visitas y alertas activas."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <UserRound size={42} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Paciente</p>
                <h2 className="text-2xl font-bold text-slate-950">Rosa Martínez</h2>
                <p className="mt-1 text-slate-500">78 años · Cuidado domiciliario</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              Estado general estable
            </span>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                Adherencia a medicación
              </span>
              <span className="text-sm font-bold text-blue-700">{adherence}%</span>
            </div>
            <ProgressBar value={adherence} tone={adherence >= 70 ? "green" : "amber"} />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Resumen del día</h2>
          <div className="mt-4 space-y-3">
            {dayEvents.map((event) => (
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
          value={nextMedication.time}
          detail={`${nextMedication.name} · ${nextMedication.dose}`}
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
          value="Estable"
          detail="Signos vitales dentro del rango esperado"
          icon={HeartPulse}
          tone="green"
        />
      </div>
    </section>
  );
}

function MedicationSection({
  medications,
  adherence,
  onMarkTaken,
}: {
  medications: Medication[];
  adherence: number;
  onMarkTaken: (id: number) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Medicación"
        subtitle="Control de tratamientos, horarios y cumplimiento diario del paciente."
      />
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
    </section>
  );
}

function VisitsSection() {
  return (
    <section>
      <SectionHeader
        title="Visitas médicas"
        subtitle="Historial de profesionales, procedimientos, observaciones y visitas pendientes."
      />
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
    </section>
  );
}

function AlertsSection({
  alerts,
  onResolve,
}: {
  alerts: CareAlert[];
  onResolve: (id: number) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Alertas"
        subtitle="Eventos importantes priorizados para que la familia pueda actuar rápido."
      />
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
    </section>
  );
}

function FamilySection() {
  return (
    <section>
      <SectionHeader
        title="Familia y cuidadores"
        subtitle="Personas conectadas al cuidado, con roles claros y estado de contacto."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
    </section>
  );
}

function EvolutionSection({
  metrics,
}: {
  metrics: { label: string; value: string; trend: string; percent: number }[];
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
          {[
            "12/05 10:30 · Visita clínica registrada con estado estable.",
            "12/05 08:20 · Presión arterial dentro de rango.",
            "11/05 20:05 · Medicación nocturna confirmada.",
            "11/05 17:40 · Alerta de control atrasado resuelta.",
          ].map((record) => (
            <div key={record} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {record}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
