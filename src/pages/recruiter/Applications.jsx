import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  PlayCircle,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchApplications,
  approveCandidate,
  activateCandidateExamAction,
} from "../../features/applications/applicationSlice";

import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { TableSkeleton } from "../../components/common/SkeletonLoader";
import ErrorState from "../../components/common/ErrorState";
import ConfirmModal from "../../components/common/ConfirmModal";

const Applications = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { applications, loading, error } = useAppSelector(
    (state) => state.applications
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [success, setSuccess] = useState("");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "primary",
    onConfirm: null,
  });

  useEffect(() => {
    dispatch(fetchApplications(assessmentId));
    const interval = setInterval(() => {
      dispatch(fetchApplications(assessmentId));
    }, 4000);
    return () => clearInterval(interval);
  }, [dispatch, assessmentId]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter(
        (a) => a.status === "approved" && !a.examActivated
      ).length,
      activated: applications.filter(
        (a) => a.examActivated === true && a.status !== "completed"
      ).length,
      completed: applications.filter((a) => a.status === "completed").length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const name = app.candidateId?.name?.toLowerCase() || "";
      const email = app.candidateId?.email?.toLowerCase() || "";
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || name.includes(query) || email.includes(query);

      let matchesStatus = true;
      if (statusFilter === "pending") matchesStatus = app.status === "pending";
      else if (statusFilter === "approved") matchesStatus = app.status === "approved" && !app.examActivated;
      else if (statusFilter === "activated") matchesStatus = app.examActivated === true && app.status !== "completed";
      else if (statusFilter === "completed") matchesStatus = app.status === "completed";

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const handleApprove = (applicationId, candidateName) => {
    setConfirmModal({
      isOpen: true,
      title: "Approve Candidate Application?",
      message: `Are you sure you want to approve ${candidateName || "this candidate"} for this assessment?`,
      variant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(applicationId);
          setSuccess("");
          const result = await dispatch(approveCandidate(applicationId));
          if (approveCandidate.fulfilled.match(result)) {
            setSuccess("Candidate approved successfully.");
          }
        } finally {
          setActionLoading(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleActivate = (applicationId, candidateName) => {
    setConfirmModal({
      isOpen: true,
      title: "Activate Candidate Exam?",
      message: `Activate the timed examination session for ${candidateName || "this candidate"}? They will be able to start immediately.`,
      variant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(applicationId);
          setSuccess("");
          const result = await dispatch(activateCandidateExamAction(applicationId));
          if (activateCandidateExamAction.fulfilled.match(result)) {
            setSuccess("Candidate exam session activated successfully.");
          }
        } finally {
          setActionLoading(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        backButton={
          <button
            onClick={() => navigate(`/recruiter/assessments/${assessmentId}`)}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assessment
          </button>
        }
        title="Candidate Applications & Approvals"
        subtitle="Review registered applicants, verify qualification, and activate timed exam attempts."
        actions={
          <button
            onClick={() =>
              navigate(`/recruiter/assessments/${assessmentId}/results`)
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            View Scored Results →
          </button>
        }
      />

      {/* Success Alert */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorState message={error} />}

      {/* Summary Stat Pills */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">
            Total Applications
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-amber-600">
            Pending Review
          </span>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-indigo-600">
            Activated & In-Flight
          </span>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{stats.activated}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600">
            Completed Exams
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
      </div>

      {/* Table & Filter Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Registered Applicants
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              ({filteredApplications.length} of {applications.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="activated">Activated</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading && applications.length === 0 ? (
          <TableSkeleton rows={4} cols={5} />
        ) : filteredApplications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title={
                searchTerm || statusFilter !== "all"
                  ? "No matching applicants found"
                  : "No candidate applications yet"
              }
              description={
                searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "Share the assessment link or QR code with candidates to begin collecting registrations."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Applied Date</th>
                  <th className="px-5 py-3.5">Assigned Set</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Exam Session</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApplications.map((app) => {
                  const candidateName = app.candidateId?.name || "Candidate";
                  const candidateEmail = app.candidateId?.email || "-";
                  const isPending = app.status === "pending";
                  const isApproved = app.status === "approved";
                  const isActivated = app.examActivated === true;
                  const isCompleted = app.status === "completed";
                  const isActing = actionLoading === app._id;

                  return (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {candidateName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {candidateEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {formatDate(app.createdAt)}
                      </td>

                      <td className="px-5 py-3.5">
                        {app.setNumber ? (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                            Set #{app.setNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      <td className="px-5 py-3.5">
                        {isCompleted ? (
                          <span className="rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[11px] font-bold">
                            ✓ Completed
                          </span>
                        ) : isActivated ? (
                          <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold animate-pulse border border-emerald-200">
                            ⚡ Exam Live
                          </span>
                        ) : isApproved ? (
                          <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[11px] font-bold">
                            Approved (Waiting)
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(app._id, candidateName)}
                              disabled={isActing}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                              {isActing ? "Approving..." : "Approve"}
                            </button>
                          )}

                          {isApproved && !isActivated && !isCompleted && (
                            <button
                              onClick={() => handleActivate(app._id, candidateName)}
                              disabled={isActing}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                              {isActing ? "Activating..." : "Activate Exam"}
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/recruiter/assessments/${assessmentId}/results`
                                )
                              }
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Scorecard →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={Boolean(actionLoading)}
      />
    </div>
  );
};

export default Applications;