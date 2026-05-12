type ProgressBarProps = {
  value: number;
  tone?: "blue" | "violet" | "green" | "amber" | "red";
};

const barClasses = {
  blue: "bg-blue-600",
  violet: "bg-violet-600",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
};

export function ProgressBar({ value, tone = "blue" }: ProgressBarProps) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${barClasses[tone]}`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}
