const StatCard = ({
  icon: Icon,
  iconBg = "bg-indigo-50",
  iconColor = "text-indigo-600",
  label,
  value,
  subtext,
  onClick,
  trend,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600">
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 leading-normal">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
