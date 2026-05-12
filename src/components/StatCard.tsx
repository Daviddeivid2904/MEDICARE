import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "blue" | "violet" | "green" | "amber";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
};

export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`rounded-xl p-3 ring-1 ${toneClasses[tone]}`}>
          <Icon size={22} />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{detail}</p>
    </article>
  );
}
