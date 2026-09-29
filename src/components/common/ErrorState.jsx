import { AlertCircle, RotateCcw } from "lucide-react";

const ErrorState = ({ message, onRetry, className = "" }) => {
  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 text-rose-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm font-medium leading-relaxed">
          {message || "An unexpected error occurred. Please try again."}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100/60 border border-rose-200 shadow-xs transition-colors shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
