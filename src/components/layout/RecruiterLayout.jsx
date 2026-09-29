import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

const RecruiterLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAppSelector((state) => state.auth);

  // Desktop Hover Rail State
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef(null);

  // Mobile Off-canvas Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle Desktop Hover Expansion with 250ms collapse delay
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navSections = [
    {
      title: "MAIN",
      items: [
        {
          name: "Dashboard",
          path: "/recruiter/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "HIRING MANAGEMENT",
      items: [
        {
          name: "Hiring Drives",
          path: "/recruiter/drives",
          icon: Briefcase,
        },
      ],
    },
    {
      title: "RESULTS & INTELLIGENCE",
      items: [
        {
          name: "AI Insights",
          path: "/recruiter/ai-insights",
          icon: Sparkles,
          badge: "AI",
        },
      ],
    },
    {
      title: "REPORTING",
      items: [
        {
          name: "Reports & Exports",
          path: "/recruiter/reports",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          name: "Settings",
          path: "/recruiter/settings",
          icon: Settings,
        },
        {
          name: "Help & Support",
          path: "/recruiter/help",
          icon: HelpCircle,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* ======================================================== */}
      {/* DESKTOP HOVER COLLAPSIBLE SIDEBAR                        */}
      {/* Seamless edge-to-edge bar; header line aligned at h-16  */}
      {/* ======================================================== */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden lg:flex flex-col sticky top-0 h-screen z-30 bg-white border-r border-slate-200/80 shrink-0 transition-[width] duration-300 ease-in-out ${
          isHovered ? "w-[260px]" : "w-[72px]"
        }`}
      >
        {/* Sidebar Header: exactly h-16 to align seamlessly with top navbar */}
        <div
          className="h-16 border-b border-slate-200/80 flex items-center px-4 cursor-pointer group shrink-0"
          onClick={() => navigate("/recruiter/dashboard")}
          title="AI Assess Talent Platform"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0 transition group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>

            {isHovered && (
              <div className="flex flex-col justify-center min-w-0 animate-fade-in">
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight block whitespace-nowrap">
                  AI Assess
                </span>
                <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase block leading-none mt-0.5 whitespace-nowrap">
                  Talent Platform
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {isHovered && (
                <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase transition-opacity duration-300">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/recruiter/dashboard" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <div key={item.path} className="relative group">
                      <NavLink
                        to={item.path}
                        className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isHovered
                            ? "px-3 py-2.5 justify-between w-full"
                            : "h-10 w-10 justify-center mx-auto"
                        } ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        }`}
                        aria-label={item.name}
                      >
                        <div
                          className={`flex items-center ${
                            isHovered ? "gap-3" : "justify-center"
                          }`}
                        >
                          <Icon
                            className={`h-4.5 w-4.5 shrink-0 ${
                              isActive ? "text-white" : "text-slate-400"
                            }`}
                          />
                          {isHovered && (
                            <span className="whitespace-nowrap transition-opacity duration-300">
                              {item.name}
                            </span>
                          )}
                        </div>

                        {isHovered && item.badge && (
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>

                      {/* Hover Tooltip when Collapsed */}
                      {!isHovered && (
                        <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-2.5 py-1 text-xs font-bold text-white bg-slate-900 rounded-lg shadow-md whitespace-nowrap animate-fade-in">
                          {item.name}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Recruiter Profile Footer */}
        <div className="p-3 border-t border-slate-200/80 shrink-0">
          {isHovered ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || "R"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || "Recruiter"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.email || "Recruiter Account"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative group flex justify-center">
              <div
                className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs cursor-pointer border border-indigo-100 mx-auto transition hover:bg-indigo-100"
                onClick={handleLogout}
                title={`Logout (${user?.name || "Recruiter"})`}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "R"}
              </div>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-2.5 py-1 text-xs font-bold text-white bg-slate-900 rounded-lg shadow-md whitespace-nowrap animate-fade-in">
                Logout ({user?.name || "Recruiter"})
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE / TABLET OFF-CANVAS DRAWER (< 1024px)             */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                  AI Assess
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block mt-0.5">
                  Talent Platform
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/recruiter/dashboard" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "R"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || "Recruiter"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA & TOP HEADER                          */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300">
        {/* Top Header: exactly h-16, flush with sidebar top */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile / Tablet Menu Button (< 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 min-w-0">
              <span className="text-indigo-600 hidden sm:inline shrink-0">
                Recruiter Portal
              </span>
              <ChevronRight className="h-3 w-3 text-slate-300 hidden sm:inline shrink-0" />
              <span className="capitalize text-slate-800 font-bold truncate">
                {location.pathname.split("/")[2]?.replace("-", " ") || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs font-semibold text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">AI Engine Connected</span>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "R"}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[120px]">
                  {user?.name || "Recruiter"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                  Lead Talent Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RecruiterLayout;