"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { benefits } from "@/data/mockData";

type LandingProps = {
  onEnter: () => void;
};

export function Landing({ onEnter }: LandingProps) {
  return (
    <section className="health-gradient min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-bold tracking-wide text-slate-950">MEDICARE</span>
        </div>
        <button
          onClick={onEnter}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Ingresar
        </button>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 pb-14 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Plataforma HealthTech domiciliaria
          </p>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] text-slate-950 sm:text-6xl">
            MEDICARE
          </h1>
          <p className="mt-5 text-2xl font-semibold text-violet-700">
            Cuidado que te acompaña
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Una web app para familiares y cuidadores que centraliza medicación,
            visitas médicas, alertas y evolución del paciente adulto mayor en un
            panel claro y responsive.
          </p>
          <button
            onClick={onEnter}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Ingresar al dashboard
            <ArrowRight size={19} />
          </button>
        </div>

        <div className="rounded-[28px] border border-white bg-white/80 p-5 shadow-xl shadow-blue-900/10 backdrop-blur">
          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-100">Estado general</p>
                <p className="mt-1 text-2xl font-bold">Estable</p>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-semibold text-emerald-200">
                En seguimiento
              </span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["64%", "Adherencia"],
                ["2", "Alertas"],
                ["10:30", "Última visita"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-xs text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 pt-5 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-slate-100 bg-white p-5">
                <benefit.icon className="text-blue-600" size={24} />
                <h2 className="mt-4 font-bold text-slate-950">{benefit.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
}
