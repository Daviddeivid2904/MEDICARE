import type { AlertPriority, MedicationStatus, VisitStatus } from "@/types";

type BadgeValue = MedicationStatus | VisitStatus | AlertPriority | "resuelta";

type StatusBadgeProps = {
  value: BadgeValue;
};

const classes: Record<BadgeValue, string> = {
  tomado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pendiente: "bg-amber-50 text-amber-700 ring-amber-200",
  atrasado: "bg-rose-50 text-rose-700 ring-rose-200",
  realizada: "bg-blue-50 text-blue-700 ring-blue-200",
  baja: "bg-slate-100 text-slate-700 ring-slate-200",
  media: "bg-amber-50 text-amber-700 ring-amber-200",
  alta: "bg-rose-50 text-rose-700 ring-rose-200",
  resuelta: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${classes[value]}`}>
      {value}
    </span>
  );
}
