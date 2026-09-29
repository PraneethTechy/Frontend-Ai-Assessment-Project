import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Briefcase, BarChart3, ArrowRight, Layers } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addDrive, fetchDrives } from "../../features/drives/driveSlice";

import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { CardListSkeleton } from "../../components/common/SkeletonLoader";
import ErrorState from "../../components/common/ErrorState";

const Drives = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { drives, loading, error } = useAppSelector((state) => state.drives);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "",
    technologies: "",
  });

  useEffect(() => {
    dispatch(fetchDrives());
  }, [dispatch]);

  const filteredDrives = useMemo(() => {
    if (!searchTerm.trim()) return drives;
    const q = searchTerm.toLowerCase().trim();
    return drives.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.domain?.toLowerCase().includes(q) ||
        d.technologies?.some((t) => t.toLowerCase().includes(q))
    );
  }, [drives, searchTerm]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const driveData = {
      name: formData.name,
      description: formData.description,
      domain: formData.domain,
      technologies: formData.technologies
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean),
    };

    const result = await dispatch(addDrive(driveData));

    if (addDrive.fulfilled.match(result)) {
      setFormData({
        name: "",
        description: "",
        domain: "",
        technologies: "",
      });
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Hiring Drives"
        subtitle="Organize multi-round candidate assessments, test configurations, and recruitment campaigns."
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel Creation" : "Create Hiring Drive"}
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={() => dispatch(fetchDrives())} />}

      {/* Create Drive Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-indigo-100 bg-white p-6 sm:p-8 shadow-md shadow-indigo-50/50 space-y-6 animate-fade-in"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              New Hiring Drive Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the campaign title, domain focus, and technology tags.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Drive Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. 2026 Senior Full-Stack Engineering Drive"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Domain / Specialization <span className="text-rose-500">*</span>
              </label>
              <input
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
                placeholder="e.g. Full-Stack Web Development"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Technologies & Core Skills <span className="text-rose-500">*</span>
              </label>
              <input
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                required
                placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Separate technologies with commas. These tags will be used by AI during assessment question generation.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Campaign Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Briefly describe the target seniority, role scope, and evaluation goals..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Creating Drive..." : "Create Drive"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Bar */}
      {drives.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search drives by name, domain, or technology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-sm outline-none bg-transparent"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 pr-2">
            {filteredDrives.length} drives
          </span>
        </div>
      )}

      {/* Drives Grid */}
      <div>
        {loading && drives.length === 0 ? (
          <CardListSkeleton count={3} />
        ) : filteredDrives.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={
              searchTerm
                ? "No drives match your search query"
                : "No hiring drives yet"
            }
            description={
              searchTerm
                ? "Try searching for a different keyword or domain."
                : "Create your first hiring drive to start configuring assessments and evaluating talent."
            }
            action={
              !searchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
                >
                  + Create Hiring Drive
                </button>
              )
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDrives.map((drive) => (
              <div
                key={drive._id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:border-indigo-200 hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {drive.name}
                    </h3>
                    <StatusBadge status={drive.status || "active"} size="sm" />
                  </div>

                  <p className="text-xs font-semibold text-indigo-600">
                    {drive.domain}
                  </p>

                  {drive.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {drive.description}
                    </p>
                  )}

                  {drive.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {drive.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate(`/recruiter/drives/${drive._id}/results`)
                    }
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                    Leaderboard
                  </button>

                  <button
                    onClick={() => navigate(`/recruiter/drives/${drive._id}`)}
                    className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs shadow-indigo-100 flex items-center justify-center gap-1.5"
                  >
                    <span>Manage Drive</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drives;