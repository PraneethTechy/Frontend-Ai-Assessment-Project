const statusStyles = {
  // Assessment & Drive states
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  generating: "bg-purple-100 text-purple-800 border-purple-200 animate-pulse",
  ready: "bg-blue-100 text-blue-800 border-blue-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",

  // Candidate Application states
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",

  // Exam activation
  activated: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200 animate-pulse",
  submitted: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const StatusBadge = ({ status, customLabel, size = "md" }) => {
  const normalized = String(status || "draft").toLowerCase().trim();
  const style = statusStyles[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold capitalize tracking-wide transition-colors ${style} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {customLabel || normalized.replace("_", " ")}
    </span>
  );
};

export default StatusBadge;
