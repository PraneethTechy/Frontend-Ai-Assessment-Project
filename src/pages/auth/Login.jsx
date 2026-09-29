import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Lock, Mail, CheckCircle2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login } from "../../features/auth/authSlice";
import ErrorState from "../../components/common/ErrorState";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;
      if (role === "recruiter") {
        navigate("/recruiter/dashboard");
      } else {
        navigate("/candidate/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 p-12 text-white relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            AI Assess Platform
          </span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Next-Gen Talent Assessment</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Automated technical hiring driven by AI intelligence.
          </h2>

          <p className="text-sm text-indigo-200 leading-relaxed">
            Generate customized multi-set assessments in seconds, evaluate candidates with strict timed integrity, and uncover hiring insights.
          </p>

          <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-indigo-100">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Multi-set randomized question generation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Real-time anti-tampering countdown and auto-submission</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>AI candidate scorecards & executive drive reports</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-indigo-300 relative z-10">
          © {new Date().getFullYear()} AI Assessment SaaS. All rights reserved.
        </div>
      </div>

      {/* Right Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <div className="lg:hidden flex items-center justify-center sm:justify-start gap-2.5 mb-6">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                AI Assess
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your credentials to access the assessment portal.
            </p>
          </div>

          {error && <ErrorState message={error} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;