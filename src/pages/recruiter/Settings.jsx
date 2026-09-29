import { useAppSelector } from "../../app/hooks";
import PageHeader from "../../components/common/PageHeader";
import { User, Mail, Shield, Sparkles } from "lucide-react";

const Settings = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings & Profile"
        subtitle="Manage your recruiter profile details and platform preferences."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Recruiter Profile
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Full Name
            </span>
            <p className="text-base font-bold text-slate-900">{user?.name || "Recruiter"}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </span>
            <p className="text-base font-bold text-slate-900">{user?.email || "recruiter@example.com"}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Account Role
            </span>
            <p className="text-base font-bold text-indigo-600 capitalize">{user?.role || "Recruiter"}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Engine Status
            </span>
            <p className="text-base font-bold text-emerald-600">Active & Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
