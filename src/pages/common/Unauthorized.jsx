import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Access Restricted (403)
        </h1>

        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have permission to view this resource. Please sign in with an authorized account or return to the login page.
        </p>

        <div className="pt-2">
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;