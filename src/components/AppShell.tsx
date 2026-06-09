"use client";

import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/data/mockData";
import type { Patient, SectionId, SessionUser } from "@/types";

type AppShellProps = {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  patient: Patient;
  user: SessionUser;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppShell({
  activeSection,
  onSectionChange,
  patient,
  user,
  onLogout,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);

  const handleSectionChange = (section: SectionId) => {
    onSectionChange(section);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white px-4 py-5 shadow-xl shadow-slate-900/10 transition lg:static lg:w-auto lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={23} />
            </div>
            <div>
              <p className="font-bold tracking-wide">MEDICARE</p>
              <p className="text-xs text-slate-500">Cuidado domiciliario</p>
            </div>
          </div>
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900 ring-1 ring-violet-100">
          <p className="font-bold">Paciente monitoreado</p>
          <p className="mt-1 text-violet-700">
            {patient.name}, {patient.age} años
          </p>
          <p className="mt-2 text-xs text-violet-600">{patient.generalStatus}</p>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur sm:px-5 sm:py-4 lg:px-8">
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-medium text-slate-500 sm:inline">
              {user.name} · {user.role}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {user.initials}
            </div>
            <button
              aria-label="Cerrar sesión"
              onClick={onLogout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
