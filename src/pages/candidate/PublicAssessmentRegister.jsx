import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  PlayCircle,
  RefreshCw,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login, register } from "../../features/auth/authSlice";
import {
  getPublicAssessment,
  applyForAssessment,
  getMyApplications,
} from "../../api/candidateApi";
import ErrorState from "../../components/common/ErrorState";

const PublicAssessmentRegister = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, token } = useAppSelector((state) => state.auth);

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");
  const [existingApp, setExistingApp] = useState(null);

  // Unauthenticated in-place auth state
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPublicAssessment(assessmentId);
      setAssessment(res.assessment);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load assessment details. The link may be invalid or the assessment is closed."
      );
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    if (token && user?.role === "candidate") {
      try {
        const res = await getMyApplications();
        const apps = res.applications || [];
        const match = apps.find(
          (a) =>
            (a.assessmentId?._id || a.assessmentId)?.toString() === assessmentId
        );
        if (match) {
          setExistingApp(match);
        }
      } catch {
        // Silently ignore
      }
    }
  };

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    checkExistingApplication();
  }, [assessmentId, token, user]);

  // Live polling for proctor approval and exam activation
  useEffect(() => {
    if (!token || user?.role !== "candidate" || !existingApp) return;
    if (existingApp.status === "completed") return;
    if (existingApp.status === "approved" && existingApp.examActivated) return;

    const interval = setInterval(async () => {
      try {
        const res = await getMyApplications();
        const apps = res.applications || [];
        const match = apps.find(
          (a) =>
            (a.assessmentId?._id || a.assessmentId)?.toString() === assessmentId
        );
        if (match) {
          setExistingApp(match);
        }
      } catch {
        // Silently continue polling
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [assessmentId, token, user, existingApp]);

  const handleApply = async () => {
    if (!token || user?.role !== "candidate") return;

    try {
      setApplying(true);
      setError("");
      setApplySuccess("");

      const res = await applyForAssessment(assessmentId);
      setApplySuccess("Your application has been submitted successfully!");
      setExistingApp(res.application);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    if (authMode === "login") {
      const res = await dispatch(
        login({ email: authForm.email, password: authForm.password })
      );
      if (!login.fulfilled.match(res)) {
        setAuthError(res.payload || "Login failed.");
      }
    } else {
      const res = await dispatch(
        register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: "candidate",
        })
      );
      if (register.fulfilled.match(res)) {
        const loginRes = await dispatch(
          login({ email: authForm.email, password: authForm.password })
        );
        if (!login.fulfilled.match(loginRes)) {
          setAuthMode("login");
        }
      } else {
        setAuthError(res.payload || "Registration failed.");
      }
    }
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">
            Loading assessment details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xs border border-rose-200 text-center space-y-4">
          <h1 className="text-lg font-bold text-slate-900">
            Assessment Unavailable
          </h1>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Go to Platform Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none block">
                AI Assess
              </span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mt-1 block">
                Public Assessment Registration
              </span>
            </div>
          </div>

          {token && user && (
            <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 shadow-2xs">
              Logged in as {user.name}
            </span>
          )}
        </div>

        {/* Assessment Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-xs font-bold mb-2">
                ● Open for Candidate Application
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {assessment.name}
              </h1>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs text-slate-400 font-semibold uppercase block">
                Duration
              </span>
              <span className="text-2xl font-black text-indigo-600">
                {assessment.duration} mins
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-slate-400 font-medium">Questions per Test</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {assessment.questionsPerSet} Questions
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-slate-400 font-medium">Format</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                Randomized MCQ Sets
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-slate-400 font-medium">Attempt Security</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                Single Attempt Timed
              </p>
            </div>
          </div>

          {/* Target Skills */}
          {assessment.technologies?.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Skills Evaluated
              </span>
              <div className="flex flex-wrap gap-1.5">
                {assessment.technologies.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {assessment.instructions && (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs leading-relaxed space-y-1">
              <strong className="text-slate-800 font-bold block">
                Instructions:
              </strong>
              <p className="text-slate-600 whitespace-pre-line">
                {assessment.instructions}
              </p>
            </div>
          )}

          {/* Notifications */}
          {applySuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 font-semibold">
              ✓ {applySuccess}
            </div>
          )}

          {error && <ErrorState message={error} />}

          {/* Action / Auth Section */}
          <div className="pt-6 border-t border-slate-100">
            {/* 1. Logged in candidate */}
            {token && user?.role === "candidate" && (
              <div>
                {existingApp ? (
                  <div className="space-y-4">
                    {/* Live Proctor Status Banner */}
                    {existingApp.status === "approved" && existingApp.examActivated ? (
                      <div className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-6 sm:p-7 shadow-lg shadow-emerald-500/10 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0 animate-bounce">
                              <PlayCircle className="h-7 w-7" />
                            </div>
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                Exam Session Active
                              </div>
                              <h3 className="text-lg font-bold text-slate-900">
                                Your Exam is LIVE and Ready!
                              </h3>
                              <p className="text-xs text-slate-600 mt-0.5">
                                The recruiter has approved and activated your test attempt. You have {assessment?.duration || 30} minutes.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => navigate(`/candidate/exam/${assessmentId}`)}
                            className="flex-1 rounded-xl bg-emerald-600 py-3.5 px-6 font-bold text-white text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                          >
                            <PlayCircle className="h-5 w-5" />
                            <span>Start Timed Exam Now ({assessment?.duration || 30} Mins)</span>
                          </button>
                          <button
                            onClick={() => navigate("/candidate/dashboard")}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Go to Dashboard
                          </button>
                        </div>
                      </div>
                    ) : existingApp.status === "approved" && !existingApp.examActivated ? (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Clock className="h-5 w-5 animate-spin" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                                Application Approved
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">
                                Waiting for Proctor to Start the Exam Session
                              </h4>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Live sync active
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Your registration has been approved by the talent team. Please keep this screen open; as soon as the proctor starts the exam, the <strong>"Start Exam"</strong> button will automatically unlock right here.
                        </p>
                        <button
                          onClick={() => navigate("/candidate/dashboard")}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View all in Candidate Dashboard →
                        </button>
                      </div>
                    ) : existingApp.status === "pending" ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                              <Clock className="h-5 w-5 animate-pulse" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                                Registration Submitted
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">
                                Awaiting Recruiter Approval
                              </h4>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Auto-refreshing
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Your application has been received and the recruiter has been notified. Keep this tab open — this screen will automatically refresh and unlock your exam as soon as your registration is approved.
                        </p>
                        <button
                          onClick={() => navigate("/candidate/dashboard")}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900"
                        >
                          View Candidate Dashboard →
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Application Status
                          </span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                            Status: {existingApp.status}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate("/candidate/dashboard")}
                          className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          Go to Dashboard →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {applying ? "Submitting Application..." : "Apply for this Assessment Now"}
                  </button>
                )}
              </div>
            )}

            {/* 2. Recruiter logged in */}
            {token && user?.role === "recruiter" && (
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>You are currently logged in as a recruiter.</span>
                <button
                  onClick={() => navigate("/recruiter/dashboard")}
                  className="rounded-lg bg-amber-700 text-white px-3.5 py-1.5 font-bold"
                >
                  Recruiter Portal →
                </button>
              </div>
            )}

            {/* 3. Unauthenticated candidate form */}
            {!token && (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 sm:p-8 space-y-5">
                <div className="text-center max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-slate-900">
                    {authMode === "login" ? "Sign In to Register" : "Create Candidate Account"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {authMode === "login"
                      ? "Sign in with your email to apply for this assessment."
                      : "Create your free profile and submit your test application."}
                  </p>
                </div>

                {authError && <ErrorState message={authError} />}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5 max-w-md mx-auto">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={authForm.name}
                        onChange={handleAuthChange}
                        placeholder="Jane Doe"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={authForm.email}
                      onChange={handleAuthChange}
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={authForm.password}
                      onChange={handleAuthChange}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 mt-1"
                  >
                    {authLoading
                      ? "Processing..."
                      : authMode === "login"
                      ? "Sign In & Apply"
                      : "Create Account & Apply"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === "login" ? "register" : "login");
                        setAuthError("");
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {authMode === "login"
                        ? "New candidate? Create account here"
                        : "Already have an account? Sign in here"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAssessmentRegister;
