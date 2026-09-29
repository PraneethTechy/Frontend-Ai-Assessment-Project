import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, LogOut, User, Menu, X, LayoutDashboard } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

const CandidateLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isExamPage = location.pathname.startsWith("/candidate/exam/");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (isExamPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate("/candidate/dashboard")}
            >
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 transition group-hover:scale-105">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none block">
                  AI Assess
                </span>
                <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mt-1 block">
                  Candidate Portal
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink
                to="/candidate/dashboard"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>My Assessments</span>
              </NavLink>
            </nav>

            {/* User Profile & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                  {user?.name?.charAt(0)?.toUpperCase() || "C"}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.name || "Candidate"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="h-5 w-px bg-slate-200" />

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100/60 transition shadow-2xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-fade-in shadow-lg">
            <NavLink
              to="/candidate/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>My Assessments</span>
            </NavLink>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CandidateLayout;
