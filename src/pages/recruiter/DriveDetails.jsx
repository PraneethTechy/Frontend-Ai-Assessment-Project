import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  BarChart3,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Wand2,
  Share2,
  Copy,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAssessments,
  addAssessment,
  clearAssessments,
} from "../../features/assessments/assessmentSlice";
import { getDriveById } from "../../api/driveApi";
import { getShareLink } from "../../api/assessmentApi";

import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { CardListSkeleton } from "../../components/common/SkeletonLoader";
import ErrorState from "../../components/common/ErrorState";

const DriveDetails = () => {
  const { driveId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { assessments, loading, error } = useAppSelector(
    (state) => state.assessments
  );

  const [drive, setDrive] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [formSuccess, setFormSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    instructions: "Answer all multiple-choice questions within the allotted duration. Each question has exactly 4 options and 1 correct answer.",
    duration: 30,
    questionsPerSet: 20,
    numberOfSets: 2,
    easy: 6,
    medium: 10,
    hard: 4,
    technologies: "",
  });

  useEffect(() => {
    dispatch(clearAssessments());
    dispatch(fetchAssessments(driveId));

    const loadDrive = async () => {
      try {
        const data = await getDriveById(driveId);
        if (data.drive) {
          setDrive(data.drive);
          if (data.drive.technologies?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              technologies: prev.technologies || data.drive.technologies.join(", "),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load drive details:", err);
      }
    };

    loadDrive();

    return () => {
      dispatch(clearAssessments());
    };
  }, [dispatch, driveId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // If questionsPerSet changes, auto-rebalance difficulty distribution
      if (name === "questionsPerSet") {
        const qCount = Math.max(1, Number(value) || 10);
        const easy = Math.round(qCount * 0.3);
        const hard = Math.round(qCount * 0.2);
        const medium = Math.max(0, qCount - easy - hard);
        updated.easy = easy;
        updated.medium = medium;
        updated.hard = hard;
      }
      return updated;
    });
  };

  const handleAutoBalance = () => {
    const qCount = Math.max(1, Number(formData.questionsPerSet) || 10);
    const easy = Math.round(qCount * 0.3);
    const hard = Math.round(qCount * 0.2);
    const medium = Math.max(0, qCount - easy - hard);
    setFormData((prev) => ({
      ...prev,
      easy,
      medium,
      hard,
    }));
  };

  const totalCalculated =
    Number(formData.easy || 0) +
    Number(formData.medium || 0) +
    Number(formData.hard || 0);

  const isDistributionBalanced = totalCalculated === Number(formData.questionsPerSet);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isDistributionBalanced) {
      alert(`Difficulty distribution (${totalCalculated}) must equal questions per set (${formData.questionsPerSet}).`);
      return;
    }

    const assessmentData = {
      driveId,
      name: formData.name,
      instructions: formData.instructions,
      duration: Number(formData.duration),
      questionsPerSet: Number(formData.questionsPerSet),
      numberOfSets: Number(formData.numberOfSets),
      difficultyDistribution: {
        easy: Number(formData.easy),
        medium: Number(formData.medium),
        hard: Number(formData.hard),
      },
      technologies: formData.technologies
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean),
    };

    const result = await dispatch(addAssessment(assessmentData));

    if (addAssessment.fulfilled.match(result)) {
      setFormSuccess("Assessment created successfully! Opening assessment manager...");
      setShowForm(false);
      const createdAssessment = result.payload.assessment;
      setTimeout(() => {
        if (createdAssessment?._id) {
          navigate(`/recruiter/assessments/${createdAssessment._id}`);
        }
      }, 700);
    }
  };

  const handleShare = async (assessmentId, e) => {
    e.stopPropagation();
    try {
      const data = await getShareLink(assessmentId);
      setShareData(data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate share link");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        backButton={
          <button
            onClick={() => navigate("/recruiter/drives")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hiring Programs
          </button>
        }
        title={drive?.name || "Hiring Program Assessments"}
        subtitle={
          drive
            ? `Domain: ${drive.domain || "General"} • Configure MCQ assessments, synthesize questions with OpenRouter AI or manually, and manage candidate workflows.`
            : "Manage testing rounds, configure AI question generation, and review candidate results."
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/recruiter/drives/${driveId}/results`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              Drive Leaderboard
            </button>

            <button
              onClick={() => {
                setShowForm(!showForm);
                setFormSuccess("");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              {showForm ? "Close Form" : "+ Create Assessment"}
            </button>
          </div>
        }
      />

      {/* Program Summary Pill Banner */}
      {drive && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Program Stack:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {drive.technologies?.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 text-xs font-bold text-indigo-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500 flex items-center gap-3">
            <span>
              Total Assessments:{" "}
              <strong className="text-slate-900 font-bold">
                {assessments.length}
              </strong>
            </span>
            <span>•</span>
            <span>
              Domain:{" "}
              <strong className="text-slate-900 font-bold">
                {drive.domain || "Tech"}
              </strong>
            </span>
          </div>
        </div>
      )}

      {formSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {error && (
        <ErrorState
          message={error}
          onRetry={() => dispatch(fetchAssessments(driveId))}
        />
      )}

      {/* Assessment Creation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-indigo-200 bg-linear-to-b from-indigo-50/40 via-white to-white p-6 sm:p-8 shadow-md shadow-indigo-100/50 space-y-6 animate-fade-in"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                New MCQ Assessment Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the assessment structure. Once created, you can generate questions using AI or add them manually.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assessment Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Core React & Frontend Systems MCQ"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Technologies (comma-separated) <span className="text-rose-500">*</span>
              </label>
              <input
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                required
                placeholder="e.g. React, JavaScript, Redux, CSS"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Test Duration (Minutes) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="duration"
                  min="5"
                  max="180"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
                <div className="flex gap-1">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, duration: mins }))}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        formData.duration === mins
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Questions / Set <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="questionsPerSet"
                  min="1"
                  max="100"
                  value={formData.questionsPerSet}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Sets Count <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfSets"
                  min="1"
                  max="10"
                  value={formData.numberOfSets}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
              </div>
            </div>

            {/* Difficulty Split with Auto-Balance */}
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Difficulty Distribution Split
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sum must equal Questions per Set ({formData.questionsPerSet})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      isDistributionBalanced
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {totalCalculated} / {formData.questionsPerSet}{" "}
                    {isDistributionBalanced ? "✓ Balanced" : "⚠ Mismatch"}
                  </span>

                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Wand2 className="h-3 w-3 text-indigo-600" />
                    Auto-Balance
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                    Easy Qs
                  </label>
                  <input
                    type="number"
                    name="easy"
                    min="0"
                    value={formData.easy}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-700 mb-1">
                    Medium Qs
                  </label>
                  <input
                    type="number"
                    name="medium"
                    min="0"
                    value={formData.medium}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-700 mb-1">
                    Hard Qs
                  </label>
                  <input
                    type="number"
                    name="hard"
                    min="0"
                    value={formData.hard}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Candidate Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !isDistributionBalanced}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <span>Create Assessment</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Assessments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Program Assessment Rounds ({assessments.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click &quot;Manage&quot; to generate questions via AI or create MCQs manually
          </span>
        </div>

        {loading && assessments.length === 0 ? (
          <CardListSkeleton count={3} />
        ) : assessments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assessments created for this hiring program yet"
            description="Create your first assessment round to synthesize MCQs with OpenRouter AI or add custom questions."
            action={
              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                + Create Assessment Round
              </button>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assessments.map((assessment) => {
              const isDraft = assessment.status === "draft";
              const isReady = assessment.status === "ready";
              const isPublished = assessment.status === "published";

              return (
                <div
                  key={assessment._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:border-indigo-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                          {assessment.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isDraft && "Draft • Needs Questions"}
                          {isReady && "Ready to Publish"}
                          {isPublished && "Published • Live Exam"}
                        </span>
                      </div>
                      <StatusBadge status={assessment.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {assessment.duration} min
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        {assessment.questionsPerSet} Qs/set ({assessment.numberOfSets} sets)
                      </span>
                    </div>

                    {assessment.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {assessment.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 text-[11px] font-semibold text-indigo-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/recruiter/assessments/${assessment._id}/results`)
                        }
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        Results
                      </button>

                      {isPublished && (
                        <button
                          onClick={(e) => handleShare(assessment._id, e)}
                          title="Share Link"
                          className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-2 text-indigo-600 hover:bg-indigo-100 transition"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          navigate(`/recruiter/assessments/${assessment._id}`)
                        }
                        className="flex-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Manage Assessment</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareData &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Candidate Assessment Link
                </h3>
                <button
                  onClick={() => {
                    setShareData(null);
                    setCopied(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {shareData.qrCode && (
                <div className="flex justify-center py-2">
                  <img
                    src={shareData.qrCode}
                    alt="QR Code"
                    className="h-44 w-44 rounded-xl border border-slate-200 p-2 shadow-2xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Public Registration URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareData.registrationLink || ""}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.registrationLink || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition shrink-0 flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DriveDetails;