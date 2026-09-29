import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  FileText,
  Globe,
  Users,
  Clock,
  Award,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart3,
} from "lucide-react";

import { useAppSelector } from "../../app/hooks";
import { getDrives } from "../../api/driveApi";
import { getAssessmentsByDrive } from "../../api/assessmentApi";
import { getAssessmentApplications } from "../../api/applicationApi";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { StatCardsSkeleton } from "../../components/common/SkeletonLoader";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDrives: 0,
    totalAssessments: 0,
    publishedAssessments: 0,
    totalCandidates: 0,
    pendingApplications: 0,
    completedExams: 0,
    drives: [],
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch drives for recruiter
      const drivesRes = await getDrives();
      const drives = drivesRes.drives || [];

      // 2. Fetch assessments for each drive
      const assessmentPromises = drives.map(async (drive) => {
        try {
          const res = await getAssessmentsByDrive(drive._id);
          return (res.assessments || []).map((a) => ({
            ...a,
            driveName: drive.name,
          }));
        } catch {
          return [];
        }
      });

      const assessmentsNested = await Promise.all(assessmentPromises);
      const allAssessments = assessmentsNested.flat();

      // 3. Fetch applications for each assessment
      const applicationPromises = allAssessments.map(async (assessment) => {
        try {
          const res = await getAssessmentApplications(assessment._id);
          return res.applications || [];
        } catch {
          return [];
        }
      });

      const applicationsNested = await Promise.all(applicationPromises);
      const allApplications = applicationsNested.flat();

      const publishedCount = allAssessments.filter(
        (a) => a.status === "published"
      ).length;

      const pendingCount = allApplications.filter(
        (app) => app.status === "pending"
      ).length;

      const completedCount = allApplications.filter(
        (app) => app.status === "completed"
      ).length;

      const uniqueCandidateIds = new Set(
        allApplications
          .map((app) =>
            typeof app.candidateId === "object"
              ? app.candidateId?._id
              : app.candidateId
          )
          .filter(Boolean)
      );

      setStats({
        totalDrives: drives.length,
        totalAssessments: allAssessments.length,
        publishedAssessments: publishedCount,
        totalCandidates: uniqueCandidateIds.size || allApplications.length,
        pendingApplications: pendingCount,
        completedExams: completedCount,
        drives: drives.slice(0, 5),
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard metrics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || "Recruiter"}`}
        subtitle="Here is a live summary of your active hiring drives, assessments, candidate engagement, and evaluation metrics."
        actions={
          <button
            onClick={() => navigate("/recruiter/drives")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Create Hiring Drive
          </button>
        }
      />

      {/* Error Alert */}
      {error && <ErrorState message={error} onRetry={loadDashboardData} />}

      {/* Loading Skeletons */}
      {loading ? (
        <StatCardsSkeleton count={6} />
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Briefcase}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              label="Hiring Drives"
              value={stats.totalDrives}
              subtext="Click to manage hiring campaigns"
              onClick={() => navigate("/recruiter/drives")}
            />

            <StatCard
              icon={FileText}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Total Assessments"
              value={stats.totalAssessments}
              subtext="Created across all drives"
              onClick={() => navigate("/recruiter/drives")}
            />

            <StatCard
              icon={Globe}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Published Tests"
              value={stats.publishedAssessments}
              subtext="Live for candidate registration"
            />

            <StatCard
              icon={Users}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              label="Total Candidates"
              value={stats.totalCandidates}
              subtext="Registered candidate accounts"
            />

            <StatCard
              icon={Clock}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Pending Applications"
              value={stats.pendingApplications}
              subtext="Awaiting recruiter review"
            />

            <StatCard
              icon={Award}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              label="Completed Exams"
              value={stats.completedExams}
              subtext="Scored test submissions"
            />
          </div>

          {/* Quick AI & Reporting Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              onClick={() => navigate("/recruiter/ai-insights")}
              className="group cursor-pointer rounded-2xl border border-purple-100 bg-linear-to-r from-purple-50/70 via-white to-purple-50/30 p-6 shadow-xs transition hover:border-purple-200 hover:shadow-md flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    AI Talent Intelligence
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Question Quality & Drive Insights
                </h3>
                <p className="text-xs text-slate-500">
                  Run automated clarity audits and multi-round candidate performance syntheses.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
            </div>

            <div
              onClick={() => navigate("/recruiter/reports")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Export Center
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Scorecards & Leaderboard Reports
                </h3>
                <p className="text-xs text-slate-500">
                  Download structured CSV data records for assessment rankings and candidate scores.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Active Hiring Drives Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Active Hiring Drives
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent hiring drives and test configurations.
                </p>
              </div>

              <button
                onClick={() => navigate("/recruiter/drives")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
              >
                View all drives <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {stats.drives.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No hiring drives created yet"
                  description="Create your first hiring drive to configure assessments and invite candidates."
                  action={
                    <button
                      onClick={() => navigate("/recruiter/drives")}
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      + Create Hiring Drive
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.drives.map((drive) => (
                  <div
                    key={drive._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition"
                  >
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {drive.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Domain: <span className="font-semibold text-slate-700">{drive.domain}</span>
                        {drive.technologies?.length > 0 && ` • ${drive.technologies.join(", ")}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() =>
                          navigate(`/recruiter/drives/${drive._id}/results`)
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        Drive Leaderboard
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/recruiter/drives/${drive._id}`)
                        }
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs shadow-indigo-100 flex items-center gap-1.5"
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
        </>
      )}
    </div>
  );
};

export default Dashboard;