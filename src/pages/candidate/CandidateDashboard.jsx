import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  PlayCircle,
  Clock,
  CheckCircle2,
  BarChart3,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchMyApplications } from "../../features/candidate/candidateSlice";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { CardListSkeleton } from "../../components/common/SkeletonLoader";
import ErrorState from "../../components/common/ErrorState";

const CandidateDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { applications, loading, error } = useAppSelector(
    (state) => state.candidate
  );

  const [filterTab, setFilterTab] = useState("all");

  useEffect(() => {
    dispatch(fetchMyApplications());
  }, [dispatch]);

  // Auto-sync applications when candidate is waiting for approval or activation
  useEffect(() => {
    const hasWaiting = applications.some(
      (a) => a.status === "pending" || (a.status === "approved" && !a.examActivated)
    );
    if (!hasWaiting) return;

    const interval = setInterval(() => {
      dispatch(fetchMyApplications());
    }, 4000);

    return () => clearInterval(interval);
  }, [applications, dispatch]);

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "pending").length;
    const ready = applications.filter(
      (a) => a.status === "approved" && a.examActivated === true
    ).length;
    const completed = applications.filter((a) => a.status === "completed").length;

    return { total, pending, ready, completed };
  }, [applications]);

  const filteredApps = useMemo(() => {
    if (filterTab === "ready") {
      return applications.filter(
        (a) => a.status === "approved" && a.examActivated === true
      );
    }
    if (filterTab === "pending") {
      return applications.filter((a) => a.status === "pending");
    }
    if (filterTab === "completed") {
      return applications.filter((a) => a.status === "completed");
    }
    return applications;
  }, [applications, filterTab]);

  const handleStartExam = (assessmentId) => {
    navigate(`/candidate/exam/${assessmentId}`);
  };

  const handleViewResult = (resultId) => {
    if (resultId) {
      navigate(`/candidate/result/${resultId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Candidate Assessment Portal"
        subtitle="Track your technical assessment applications, launch timed exam sessions, and view scored performance results."
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={() => dispatch(fetchMyApplications())}
        />
      )}

      {/* Summary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          iconBg="bg-slate-100"
          iconColor="text-slate-700"
          label="Total Applications"
          value={stats.total}
          subtext="Registered assessments"
        />

        <StatCard
          icon={PlayCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Ready to Take"
          value={stats.ready}
          subtext="Activated timed tests"
        />

        <StatCard
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Pending Approval"
          value={stats.pending}
          subtext="Awaiting recruiter verification"
        />

        <StatCard
          icon={CheckCircle2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          label="Completed Tests"
          value={stats.completed}
          subtext="Scored test submissions"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "all", label: `All (${stats.total})` },
          { key: "ready", label: `Ready to Take (${stats.ready})` },
          { key: "pending", label: `Pending (${stats.pending})` },
          { key: "completed", label: `Completed (${stats.completed})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterTab === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div>
        {loading ? (
          <CardListSkeleton count={2} />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              filterTab === "all"
                ? "No applications found"
                : `No ${filterTab} applications`
            }
            description={
              filterTab === "all"
                ? "You haven't registered for any assessments yet. Use an assessment invite link or QR code from a recruiter to apply."
                : "There are currently no assessments matching this tab."
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredApps.map((application) => {
              const assessment = application.assessmentId;
              const assessmentId = assessment?._id || application.assessmentId;
              const assessmentName = assessment?.name || "Assessment Round";
              const driveName = application.driveId?.name || "Hiring Drive";
              const driveDomain = application.driveId?.domain;

              const isPending = application.status === "pending";
              const isApproved = application.status === "approved";
              const isCompleted = application.status === "completed";
              const isRejected = application.status === "rejected";
              const isActivated = application.examActivated === true;

              return (
                <div
                  key={application._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:border-indigo-200 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {driveName} {driveDomain ? `• ${driveDomain}` : ""}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                          {assessmentName}
                        </h2>
                      </div>

                      {isCompleted ? (
                        <StatusBadge status="completed" size="sm" />
                      ) : isApproved && isActivated ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold animate-pulse border border-emerald-200">
                          ⚡ Exam Activated
                        </span>
                      ) : isApproved && !isActivated ? (
                        <StatusBadge status="approved" size="sm" />
                      ) : isPending ? (
                        <StatusBadge status="pending" size="sm" />
                      ) : (
                        <StatusBadge status="rejected" size="sm" />
                      )}
                    </div>

                    {assessment && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                          <span className="text-slate-400 block font-medium">Duration</span>
                          <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                            {assessment.duration || 30} mins
                          </span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                          <span className="text-slate-400 block font-medium">Questions</span>
                          <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                            {assessment.questionsPerSet || 20} MCQs
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1 rounded-xl bg-slate-50 p-3 border border-slate-100">
                          <span className="text-slate-400 block font-medium">Test Format</span>
                          <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                            Single Attempt
                          </span>
                        </div>
                      </div>
                    )}

                    {assessment?.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {assessment.technologies.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isCompleted ? (
                      <button
                        onClick={() => handleViewResult(application.resultId)}
                        disabled={!application.resultId}
                        className="w-full rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white hover:bg-slate-800 transition text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>View Scorecard & Result</span>
                      </button>
                    ) : isApproved && isActivated ? (
                      <button
                        onClick={() => handleStartExam(assessmentId)}
                        className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 transition text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
                      >
                        <PlayCircle className="h-4 w-4" />
                        <span>Start Exam Now</span>
                      </button>
                    ) : isApproved && !isActivated ? (
                      <div className="rounded-xl bg-amber-50 p-3 text-center text-xs font-semibold text-amber-800 border border-amber-200">
                        Application approved. Waiting for recruiter to activate exam session.
                      </div>
                    ) : isPending ? (
                      <div className="rounded-xl bg-slate-50 p-3 text-center text-xs font-medium text-slate-600 border border-slate-200">
                        Application submitted. Awaiting recruiter review and approval.
                      </div>
                    ) : (
                      <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-medium text-rose-700 border border-rose-200">
                        This application was not approved.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;