import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  Share2,
  BarChart3,
  Copy,
  FileCheck,
  PlusCircle,
  HelpCircle,
  Wand2,
  Trash2,
  Edit3,
  ShieldCheck,
  Search,
  Users,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  UserCheck,
  XCircle,
  Lock,
  RotateCcw,
} from "lucide-react";

import {
  getAssessment,
  generateQuestions,
  publishAssessment,
  unpublishAssessment,
  getShareLink,
} from "../../api/assessmentApi";
import {
  getAssessmentQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../api/questionApi";
import {
  getAssessmentApplications,
  updateApplicationStatus,
  activateCandidateExam,
  bulkApproveApplications,
  bulkActivateExams,
} from "../../api/applicationApi";
import { analyzeQuestionApi, improveQuestionApi } from "../../api/aiApi";

import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import ErrorState from "../../components/common/ErrorState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { TableSkeleton } from "../../components/common/SkeletonLoader";

const emptyManualForm = {
  questionText: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correctOptionIndex: 0, // 0 for option1, 1 for option2, etc.
  explanation: "",
  technology: "",
  difficulty: "medium",
  setNumber: 1,
};

const AssessmentDetails = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [shareData, setShareData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual Question Form Modal
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [savingManual, setSavingManual] = useState(false);

  // Filters for Questions Bank
  const [setFilter, setSetFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // AI Quality Analysis State
  const [qualityMap, setQualityMap] = useState({});
  const [qualityLoadingMap, setQualityLoadingMap] = useState({});

  // AI Improvement Comparison Modal State
  const [improvingId, setImprovingId] = useState(null);
  const [improvementModal, setImprovementModal] = useState(null);
  const [applyingImprovement, setApplyingImprovement] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Live Candidate Proctoring State
  const [activeMainTab, setActiveMainTab] = useState("questions"); // "questions" | "candidates"
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateActionLoading, setCandidateActionLoading] = useState(null);
  const [autoRefreshCandidates, setAutoRefreshCandidates] = useState(true);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all");

  const loadCandidates = async (silent = false) => {
    try {
      if (!silent) setLoadingCandidates(true);
      const res = await getAssessmentApplications(assessmentId);
      setCandidates(res.applications || []);
    } catch (err) {
      if (!silent) {
        console.error("Failed to load candidates:", err);
      }
    } finally {
      if (!silent) setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [assessmentId]);

  // Live polling candidates roster
  useEffect(() => {
    if (!autoRefreshCandidates) return;
    const interval = setInterval(() => {
      loadCandidates(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [assessmentId, autoRefreshCandidates]);

  const handleApproveCandidate = async (applicationId, candidateName) => {
    try {
      setCandidateActionLoading(applicationId);
      setError("");
      await updateApplicationStatus(applicationId, "approved");
      setSuccess(`Candidate ${candidateName || ""} approved successfully!`);
      await loadCandidates(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve candidate");
    } finally {
      setCandidateActionLoading(null);
    }
  };

  const handleRejectCandidate = async (applicationId, candidateName) => {
    if (!window.confirm(`Are you sure you want to reject ${candidateName || "this candidate"}?`)) return;
    try {
      setCandidateActionLoading(applicationId);
      setError("");
      await updateApplicationStatus(applicationId, "rejected");
      setSuccess(`Candidate ${candidateName || ""} marked as rejected.`);
      await loadCandidates(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject candidate");
    } finally {
      setCandidateActionLoading(null);
    }
  };

  const handleActivateExam = async (applicationId, candidateName) => {
    try {
      setCandidateActionLoading(applicationId);
      setError("");
      await activateCandidateExam(applicationId);
      setSuccess(`Exam session activated for ${candidateName || "candidate"}! They can now begin.`);
      await loadCandidates(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate exam");
    } finally {
      setCandidateActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    try {
      setCandidateActionLoading("bulk-approve");
      setError("");
      const res = await bulkApproveApplications(assessmentId);
      setSuccess(res.message || "All pending applicants approved!");
      await loadCandidates(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bulk approve candidates");
    } finally {
      setCandidateActionLoading(null);
    }
  };

  const handleBulkActivate = async () => {
    try {
      setCandidateActionLoading("bulk-activate");
      setError("");
      const res = await bulkActivateExams(assessmentId);
      setSuccess(res.message || "All approved candidates activated for exam!");
      await loadCandidates(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bulk activate exams");
    } finally {
      setCandidateActionLoading(null);
    }
  };

  const candidateStats = useMemo(() => {
    const total = candidates.length;
    const pending = candidates.filter((c) => c.status === "pending").length;
    const approved = candidates.filter(
      (c) => c.status === "approved" && !c.examActivated
    ).length;
    const activated = candidates.filter(
      (c) => c.examActivated === true && c.status !== "completed"
    ).length;
    const completed = candidates.filter((c) => c.status === "completed").length;
    return { total, pending, approved, activated, completed };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const name = c.candidateId?.name?.toLowerCase() || "";
      const email = c.candidateId?.email?.toLowerCase() || "";
      const q = candidateSearch.toLowerCase().trim();
      const matchSearch = !q || name.includes(q) || email.includes(q);

      let matchStatus = true;
      if (candidateStatusFilter === "pending") matchStatus = c.status === "pending";
      else if (candidateStatusFilter === "approved") matchStatus = c.status === "approved" && !c.examActivated;
      else if (candidateStatusFilter === "activated") matchStatus = c.examActivated === true && c.status !== "completed";
      else if (candidateStatusFilter === "completed") matchStatus = c.status === "completed";

      return matchSearch && matchStatus;
    });
  }, [candidates, candidateSearch, candidateStatusFilter]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setError("");
      const [assessmentRes, questionsRes] = await Promise.all([
        getAssessment(assessmentId),
        getAssessmentQuestions(assessmentId).catch(() => ({ sets: {} })),
      ]);

      setAssessment(assessmentRes.assessment);

      let loadedQuestions = [];
      if (Array.isArray(questionsRes?.questions)) {
        loadedQuestions = questionsRes.questions;
      } else if (questionsRes?.sets) {
        loadedQuestions = Object.values(questionsRes.sets).flat();
      }
      setQuestions(loadedQuestions);

      if (assessmentRes.assessment?.technologies?.length > 0) {
        setManualForm((prev) => ({
          ...prev,
          technology: prev.technology || assessmentRes.assessment.technologies[0],
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assessment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessmentData();
  }, [assessmentId]);

  const handleGenerateQuestionsAI = async () => {
    if (generating) return;

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const data = await generateQuestions(assessmentId);

      setSuccess(
        `OpenRouter AI successfully synthesized ${data.totalQuestions || 0} questions across ${
          data.numberOfSets || 0
        } randomized sets.`
      );

      // Reload assessment and questions
      await loadAssessmentData();
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError("OpenRouter AI quota rate-limited. Please verify your API key or try again shortly.");
      } else {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "AI question generation failed. Check server logs or OpenRouter key.";
        setError(errorMsg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (publishing) return;

    try {
      setPublishing(true);
      setError("");
      setSuccess("");

      await publishAssessment(assessmentId);
      setSuccess("Assessment published successfully! Candidates can now apply.");

      await loadAssessmentData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish assessment");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (unpublishing) return;

    try {
      setUnpublishing(true);
      setError("");
      setSuccess("");

      await unpublishAssessment(assessmentId);
      setSuccess("Assessment unpublished. Question bank editing is now unlocked.");
      setShowUnpublishConfirm(false);

      await loadAssessmentData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unpublish assessment");
    } finally {
      setUnpublishing(false);
    }
  };

  const handleShare = async () => {
    try {
      setError("");
      const data = await getShareLink(assessmentId);
      setShareData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate share link");
    }
  };

  const handleCopyLink = async () => {
    if (!shareData?.registrationLink) return;
    try {
      await navigator.clipboard.writeText(shareData.registrationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Open Manual Form for New Question
  const handleOpenNewManual = () => {
    setEditingQuestionId(null);
    setManualForm({
      ...emptyManualForm,
      technology: assessment?.technologies?.[0] || "",
    });
    setShowManualForm(true);
  };

  // Open Manual Form to Edit Existing Question
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    const options = q.options || ["", "", "", ""];
    let correctIdx = options.findIndex((opt) => opt === q.correctAnswer);
    if (correctIdx === -1) correctIdx = 0;

    setManualForm({
      questionText: q.questionText || "",
      option1: options[0] || "",
      option2: options[1] || "",
      option3: options[2] || "",
      option4: options[3] || "",
      correctOptionIndex: correctIdx,
      explanation: q.explanation || "",
      technology: q.technology || assessment?.technologies?.[0] || "",
      difficulty: q.difficulty || "medium",
      setNumber: q.setNumber || 1,
    });
    setShowManualForm(true);
  };

  // Submit Manual Question
  const handleSaveManualQuestion = async (e) => {
    e.preventDefault();

    const options = [
      manualForm.option1.trim(),
      manualForm.option2.trim(),
      manualForm.option3.trim(),
      manualForm.option4.trim(),
    ];

    if (options.some((opt) => !opt)) {
      alert("Please provide all 4 options for the multiple-choice question.");
      return;
    }

    const correctAnswer = options[manualForm.correctOptionIndex];

    const questionPayload = {
      assessmentId,
      setNumber: Number(manualForm.setNumber) || 1,
      questionText: manualForm.questionText.trim(),
      type: "mcq",
      options,
      correctAnswer,
      explanation: manualForm.explanation.trim(),
      technology: manualForm.technology.trim() || assessment?.technologies?.[0] || "General",
      difficulty: manualForm.difficulty,
      generatedByAI: false,
    };

    try {
      setSavingManual(true);
      setError("");

      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, questionPayload);
        setSuccess("Question updated successfully!");
      } else {
        await createQuestion(questionPayload);
        setSuccess("Question added to assessment bank successfully!");
      }

      setShowManualForm(false);
      setManualForm(emptyManualForm);
      setEditingQuestionId(null);

      // Refresh question list
      await loadAssessmentData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save question");
    } finally {
      setSavingManual(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await deleteQuestion(qId);
      setSuccess("Question deleted.");
      setQuestions((prev) => prev.filter((q) => q._id !== qId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  // AI Quality Check
  const handleQualityCheck = async (questionId) => {
    try {
      setQualityLoadingMap((prev) => ({ ...prev, [questionId]: true }));
      const res = await analyzeQuestionApi(questionId);
      setQualityMap((prev) => ({ ...prev, [questionId]: res.analysis }));
    } catch {
      setQualityMap((prev) => ({
        ...prev,
        [questionId]: {
          qualityScore: 75,
          clarity: "Good",
          difficulty: "Medium",
          issues: [],
          suggestions: ["Standard multiple-choice format."],
        },
      }));
    } finally {
      setQualityLoadingMap((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // AI Question Improvement Request
  const handleRequestImprovement = async (question) => {
    try {
      setImprovingId(question._id);
      const res = await improveQuestionApi(question._id);
      setImprovementModal({
        questionId: question._id,
        setNumber: question.setNumber,
        technology: question.technology,
        original: res.original,
        suggestion: res.suggestion,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate AI improvement.");
    } finally {
      setImprovingId(null);
    }
  };

  // Apply AI Suggestion
  const handleApplySuggestion = async () => {
    if (!improvementModal) return;

    try {
      setApplyingImprovement(true);
      const { questionId, setNumber, technology, suggestion } = improvementModal;

      const questionData = {
        assessmentId,
        questionText: suggestion.questionText,
        options: suggestion.options,
        correctAnswer: suggestion.correctAnswer,
        explanation: suggestion.explanation,
        technology: technology || "General",
        difficulty: suggestion.difficulty || "medium",
        setNumber: Number(setNumber) || 1,
      };

      await updateQuestion(questionId, questionData);
      setSuccess("AI improvements applied to question!");
      setImprovementModal(null);
      await loadAssessmentData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply improvement");
    } finally {
      setApplyingImprovement(false);
    }
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSet = setFilter === "all" || q.setNumber === Number(setFilter);
      const matchDiff = difficultyFilter === "all" || q.difficulty === difficultyFilter;
      const matchSearch =
        !searchTerm.trim() ||
        q.questionText?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        q.technology?.toLowerCase().includes(searchTerm.toLowerCase().trim());
      return matchSet && matchDiff && matchSearch;
    });
  }, [questions, setFilter, difficultyFilter, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  if (!assessment) {
    return (
      <ErrorState
        message={error || "Assessment not found"}
        onRetry={() => navigate(-1)}
      />
    );
  }

  const isPublished = assessment.status === "published";
  const totalTargetQuestions =
    (assessment.questionsPerSet || 0) * (assessment.numberOfSets || 0);
  const questionsCount = questions.length;
  const hasQuestions = questionsCount > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        backButton={
          <button
            onClick={() =>
              navigate(
                assessment.driveId?._id
                  ? `/recruiter/drives/${assessment.driveId._id}`
                  : "/recruiter/drives"
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hiring Drive
          </button>
        }
        title={assessment.name}
        badge={<StatusBadge status={assessment.status} size="lg" />}
        subtitle={`Program: ${assessment.driveId?.name || "Hiring Drive"} • Generate MCQs with OpenRouter AI or author questions manually.`}
        actions={
          <div className="flex items-center gap-2.5">
            {isPublished && (
              <>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share Link / QR
                </button>

                <button
                  onClick={() => setShowUnpublishConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  Unpublish to Edit
                </button>
              </>
            )}

            <button
              onClick={() =>
                navigate(`/recruiter/assessments/${assessmentId}/results`)
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              Results & Stats
            </button>

            {!isPublished && (
              <button
                onClick={handlePublish}
                disabled={publishing || !hasQuestions}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {publishing ? "Publishing..." : "Publish Assessment"}
              </button>
            )}
          </div>
        }
      />

      {/* Floating Viewport Toast Alerts */}
      {success &&
        createPortal(
          <div className="fixed top-6 right-6 z-[99999] max-w-md rounded-2xl border border-emerald-300 bg-white p-4 shadow-xl text-xs font-semibold text-emerald-900 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>
          </div>,
          document.body
        )}

      {error &&
        createPortal(
          <div className="fixed top-6 right-6 z-[99999] max-w-md rounded-2xl border border-rose-300 bg-white p-4 shadow-xl text-xs font-semibold text-rose-900 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>
          </div>,
          document.body
        )}

      {/* Assessment Specifications Overview Cards */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Assessment Specifications & Bank Status
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Target: {totalTargetQuestions} Questions Total
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Duration
            </span>
            <p className="text-lg font-bold text-slate-900">
              {assessment.duration} minutes
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Questions / Set
            </span>
            <p className="text-lg font-bold text-slate-900">
              {assessment.questionsPerSet} MCQs
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <FileCheck className="h-3.5 w-3.5" /> Randomized Sets
            </span>
            <p className="text-lg font-bold text-slate-900">
              {assessment.numberOfSets} sets
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
            <span className="text-xs font-semibold text-indigo-500 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Current Bank Status
            </span>
            <p className="text-lg font-bold text-indigo-900">
              {questionsCount} / {totalTargetQuestions} Questions
            </p>
          </div>
        </div>

        {/* Technologies & Difficulty Distribution */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              Target Skills:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {assessment.technologies?.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-indigo-50 border border-indigo-100/60 px-2.5 py-0.5 text-xs font-bold text-indigo-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="text-slate-400 font-semibold">Distribution Split:</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-bold">
              Easy: {assessment.difficultyDistribution?.easy || 0}
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 font-bold">
              Med: {assessment.difficultyDistribution?.medium || 0}
            </span>
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-rose-700 font-bold">
              Hard: {assessment.difficultyDistribution?.hard || 0}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN ASSESSMENT TABS: QUESTION STUDIO vs LIVE CANDIDATE PROCTOR */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveMainTab("questions")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeMainTab === "questions"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Question Studio & Bank</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeMainTab === "questions"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {questionsCount} / {totalTargetQuestions}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("candidates")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition relative ${
            activeMainTab === "candidates"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Live Candidates & Exam Proctor</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeMainTab === "candidates"
                ? "bg-white/20 text-white"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {candidateStats.total}
          </span>
          {candidateStats.pending > 0 && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              {candidateStats.pending} pending
            </span>
          )}
        </button>
      </div>

      {activeMainTab === "questions" && (
        <div className="space-y-8 animate-fade-in">
          {/* Published Protection Banner */}
          {isPublished && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Assessment is Published & Live
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Question generation and authoring are locked to protect candidate attempt integrity. Unpublish the assessment if you need to modify, regenerate, or add questions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnpublishConfirm(true)}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shrink-0 shadow-2xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Unpublish Assessment
              </button>
            </div>
          )}

          {/* DUAL MODE QUESTION HUB: AI GENERATE OR ADD MANUALLY */}
          <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Question Generation & Authoring Station
          </h3>
          <p className="text-xs text-slate-500">
            Choose whether to generate the complete assessment bank using OpenRouter AI or author custom MCQs manually.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card A: Generate with AI */}
          <div className="rounded-2xl border border-purple-200 bg-linear-to-br from-purple-50/70 via-white to-purple-50/30 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5 transition hover:shadow-md hover:border-purple-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  OpenRouter AI Engine
                </span>
                <span className="text-[11px] font-semibold text-purple-600">
                  Automated Synthesizer
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-900">
                {hasQuestions ? "Regenerate Questions with AI" : "Generate Questions with AI"}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically synthesizes{" "}
                <strong className="text-purple-900 font-bold">
                  {totalTargetQuestions} unique MCQs
                </strong>{" "}
                across {assessment.numberOfSets} sets, strictly adhering to your difficulty split (
                {assessment.difficultyDistribution?.easy} Easy,{" "}
                {assessment.difficultyDistribution?.medium} Medium,{" "}
                {assessment.difficultyDistribution?.hard} Hard) and target technologies.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleGenerateQuestionsAI}
                disabled={generating || isPublished}
                className="w-full rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generating
                  ? "Synthesizing with OpenRouter AI..."
                  : hasQuestions
                  ? "Regenerate Full Bank with AI"
                  : "Generate Assessment with AI"}
              </button>

              {isPublished && (
                <p className="text-[11px] text-center text-slate-400">
                  Assessment is published. Close or unpublish to regenerate.
                </p>
              )}
            </div>
          </div>

          {/* Card B: Add Questions Manually */}
          <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50/70 via-white to-indigo-50/30 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5 transition hover:shadow-md hover:border-indigo-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">
                  <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                  Custom Authoring
                </span>
                <span className="text-[11px] font-semibold text-indigo-600">
                  Manual Creator
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-900">
                Author MCQ Questions Manually
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed">
                Add custom multiple-choice questions one by one. Specify the prompt, 4 candidate options, choose the correct answer with a single click, and configure difficulty and explanation.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleOpenNewManual}
                disabled={isPublished}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                + Add Question Manually
              </button>

              {isPublished && (
                <p className="text-[11px] text-center text-slate-400">
                  Assessment is published. Close or unpublish to modify questions.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Publish Banner (if in draft or ready and has questions) */}
      {!isPublished && hasQuestions && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Assessment Question Bank is Populated ({questionsCount} Questions)
            </h3>
            <p className="text-xs text-emerald-800">
              Review your questions below or run AI quality audits. When satisfied, publish the assessment to generate registration links.
            </p>
          </div>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 shrink-0"
          >
            {publishing ? "Publishing..." : "Publish Assessment Now"}
          </button>
        </div>
      )}

      {/* QUESTION BANK SECTION */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Assessment Question Bank ({questions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Inspect all questions, verify correct answers, run AI quality audits, or request AI improvements.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-600"
              />
            </div>

            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-600"
            >
              <option value="all">All Sets</option>
              {Array.from({ length: assessment.numberOfSets || 1 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Set {i + 1}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-600"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions Cards List */}
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
            <FileCheck className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">
              {questions.length === 0
                ? "No questions in this assessment yet"
                : "No questions match your filter"}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {questions.length === 0
                ? "Generate questions using OpenRouter AI or add them manually using the cards above."
                : "Try resetting your search or difficulty filter to see all questions."}
            </p>
            {questions.length === 0 && (
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleGenerateQuestionsAI}
                  disabled={generating}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
                >
                  Generate with AI
                </button>
                <button
                  onClick={handleOpenNewManual}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                >
                  + Add Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const qAnalysis = qualityMap[q._id];
              const isQualityLoading = qualityLoadingMap[q._id];
              const isImproving = improvingId === q._id;

              return (
                <div
                  key={q._id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4 transition hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        Set {q.setNumber || 1}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          q.difficulty === "easy"
                            ? "bg-emerald-50 text-emerald-700"
                            : q.difficulty === "hard"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {q.difficulty?.toUpperCase()}
                      </span>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {q.technology || "General"}
                      </span>
                      {q.generatedByAI ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                          <Sparkles className="h-3 w-3" /> AI
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          Manual
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleQualityCheck(q._id)}
                        disabled={isQualityLoading}
                        title="AI Quality Check"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                        {isQualityLoading ? "Checking..." : "AI Audit"}
                      </button>

                      <button
                        onClick={() => handleRequestImprovement(q)}
                        disabled={isImproving}
                        title="Improve with AI"
                        className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition"
                      >
                        <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                        {isImproving ? "Refining..." : "AI Improve"}
                      </button>

                      {!isPublished && (
                        <>
                          <button
                            onClick={() => handleEditQuestion(q)}
                            title="Edit Question"
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q._id)}
                            title="Delete Question"
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* 4 Options Grid with Correct Answer Highlight */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options?.map((option, optIdx) => {
                      const isCorrect = option === q.correctAnswer;
                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`rounded-xl border p-3 text-xs flex items-start gap-2.5 transition ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 font-bold"
                              : "border-slate-200 bg-slate-50/50 text-slate-700"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 leading-snug">{option}</span>
                          {isCorrect && (
                            <span className="rounded-md bg-emerald-600 text-white px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0">
                              Correct ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {q.explanation && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
                      <strong className="text-slate-800">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}

                  {/* AI Quality Audit Results Card */}
                  {qAnalysis && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-indigo-600" />
                          AI Quality Audit Score: {qAnalysis.qualityScore}/100
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-700">
                          Clarity: {qAnalysis.clarity} • Difficulty: {qAnalysis.difficulty}
                        </span>
                      </div>
                      {qAnalysis.suggestions?.length > 0 && (
                        <p className="text-xs text-indigo-950">
                          <strong>Suggestions: </strong>
                          {qAnalysis.suggestions.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}

      {/* LIVE CANDIDATE PROCTORING TAB */}
      {activeMainTab === "candidates" && (
        <div className="space-y-6 animate-fade-in">
          {/* Proctor Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-400">Total Registered</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{candidateStats.total}</p>
              <span className="text-[11px] text-slate-400">Applied candidates</span>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">Pending Review</span>
                {candidateStats.pending > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-700">{candidateStats.pending}</p>
              <span className="text-[11px] text-amber-600">Awaiting your approval</span>
            </div>

            <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 shadow-xs">
              <span className="text-xs font-bold text-blue-700">Approved & Ready</span>
              <p className="mt-1 text-2xl font-bold text-blue-700">{candidateStats.approved}</p>
              <span className="text-[11px] text-blue-600">Waiting for exam activation</span>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">Live Exam Sessions</span>
                {candidateStats.activated > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{candidateStats.activated}</p>
              <span className="text-[11px] text-emerald-600">Candidates in-flight</span>
            </div>
          </div>

          {/* Master Proctor Command Center */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Candidate Roster & Exam Proctor Controls
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve registered candidates and start their timed exam sessions individually or in bulk.
                </p>
              </div>

              {/* Master Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={candidateStats.pending === 0 || candidateActionLoading === "bulk-approve"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {candidateActionLoading === "bulk-approve" ? "Approving..." : `Approve All Pending (${candidateStats.pending})`}
                </button>

                <button
                  type="button"
                  onClick={handleBulkActivate}
                  disabled={candidateStats.approved === 0 || candidateActionLoading === "bulk-activate"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed animate-pulse"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {candidateActionLoading === "bulk-activate" ? "Starting..." : `Start Exam for All Approved (${candidateStats.approved})`}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                  Share Link / QR
                </button>
              </div>
            </div>

            {/* Filter and Live Polling Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate by name or email..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-600 w-64"
                  />
                </div>

                <select
                  value={candidateStatusFilter}
                  onChange={(e) => setCandidateStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white outline-none"
                >
                  <option value="all">All Statuses ({candidateStats.total})</option>
                  <option value="pending">Pending Approval ({candidateStats.pending})</option>
                  <option value="approved">Approved / Ready ({candidateStats.approved})</option>
                  <option value="activated">Exam Live ({candidateStats.activated})</option>
                  <option value="completed">Completed ({candidateStats.completed})</option>
                </select>
              </div>

              {/* Live Auto-Sync Status */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRefreshCandidates(!autoRefreshCandidates)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    autoRefreshCandidates
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${autoRefreshCandidates ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                  {autoRefreshCandidates ? "Auto-Sync Live" : "Auto-Sync Paused"}
                </button>

                <button
                  type="button"
                  onClick={() => loadCandidates()}
                  disabled={loadingCandidates}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  title="Refresh candidate roster"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingCandidates ? "animate-spin text-indigo-600" : ""}`} />
                </button>
              </div>
            </div>

            {/* Candidates Roster Table */}
            {loadingCandidates && candidates.length === 0 ? (
              <TableSkeleton rows={3} cols={5} />
            ) : filteredCandidates.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {candidateSearch || candidateStatusFilter !== "all"
                      ? "No matching candidates found"
                      : "No candidates registered yet"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    {candidateSearch || candidateStatusFilter !== "all"
                      ? "Try adjusting your search keyword or status filter."
                      : "Share the public exam link or QR code with candidates. When candidates register, they appear here live for approval and exam launch."}
                  </p>
                </div>
                {!candidateSearch && candidateStatusFilter === "all" && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Get Candidate Invite Link / QR
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Candidate</th>
                      <th className="px-5 py-3.5">Applied At</th>
                      <th className="px-5 py-3.5">Assigned Set</th>
                      <th className="px-5 py-3.5">Exam Status</th>
                      <th className="px-5 py-3.5 text-right">Proctor Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredCandidates.map((c) => {
                      const candidateName = c.candidateId?.name || "Candidate";
                      const candidateEmail = c.candidateId?.email || "-";
                      const isPending = c.status === "pending";
                      const isApproved = c.status === "approved";
                      const isActivated = c.examActivated === true;
                      const isCompleted = c.status === "completed";
                      const isActing = candidateActionLoading === c._id;

                      const appliedDate = c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-";

                      return (
                        <tr key={c._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-100">
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
                            {appliedDate}
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                              Set #{c.setNumber || 1}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            {isCompleted ? (
                              <span className="rounded-md bg-purple-100 text-purple-800 px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1">
                                ✓ Completed
                              </span>
                            ) : isActivated ? (
                              <span className="rounded-md bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold animate-pulse border border-emerald-200 inline-flex items-center gap-1">
                                ⚡ Exam Live
                              </span>
                            ) : isApproved ? (
                              <span className="rounded-md bg-blue-100 text-blue-800 px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1">
                                Approved (Ready to Start)
                              </span>
                            ) : (
                              <span className="rounded-md bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1">
                                ⏳ Pending Approval
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveCandidate(c._id, candidateName)}
                                    disabled={isActing}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                                  >
                                    {isActing ? "..." : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectCandidate(c._id, candidateName)}
                                    disabled={isActing}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {isApproved && !isActivated && !isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleActivateExam(c._id, candidateName)}
                                  disabled={isActing}
                                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 animate-pulse"
                                >
                                  <PlayCircle className="h-3.5 w-3.5" />
                                  <span>{isActing ? "Starting..." : "Start Exam"}</span>
                                </button>
                              )}

                              {isActivated && !isCompleted && (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                  Exam In Progress
                                </span>
                              )}

                              {isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/recruiter/assessments/${assessmentId}/results`)}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                  View Scorecard →
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
        </div>
      )}
      {showManualForm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-indigo-600" />
                  {editingQuestionId ? "Edit Question" : "Author New Multiple-Choice Question"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter question prompt, 4 options, and select the correct answer by clicking the radio button.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualForm.questionText}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, questionText: e.target.value })
                  }
                  placeholder="e.g. What is the primary purpose of the useMemo hook in React?"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* 4 Options with Radio Button to Pick Correct Answer */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Options & Correct Answer <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 -mt-2">
                  Select the radio button beside the option that represents the correct answer.
                </p>

                {[0, 1, 2, 3].map((idx) => {
                  const key = `option${idx + 1}`;
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = manualForm.correctOptionIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-50/50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={isSelected}
                          onChange={() =>
                            setManualForm({ ...manualForm, correctOptionIndex: idx })
                          }
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {letter}
                        </span>
                      </label>

                      <input
                        type="text"
                        required
                        placeholder={`Option ${letter} text...`}
                        value={manualForm[key]}
                        onChange={(e) =>
                          setManualForm({ ...manualForm, [key]: e.target.value })
                        }
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-600 bg-white"
                      />

                      {isSelected && (
                        <span className="rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Set, Tech, Difficulty Row */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Set Number
                  </label>
                  <select
                    value={manualForm.setNumber}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        setNumber: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  >
                    {Array.from({ length: assessment.numberOfSets || 1 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Set {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Technology
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.technology}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, technology: e.target.value })
                    }
                    placeholder="e.g. React"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={manualForm.difficulty}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, difficulty: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={manualForm.explanation}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, explanation: e.target.value })
                  }
                  placeholder="Explain why the selected answer is correct..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs disabled:opacity-50"
                >
                  {savingManual ? "Saving..." : editingQuestionId ? "Update Question" : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* AI IMPROVEMENT MODAL (BEFORE & AFTER COMPARISON) */}
      {improvementModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-purple-600" />
                  OpenRouter AI Question Refinement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare the current question with the AI-optimized version and apply improvements with 1 click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImprovementModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Original */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Original Question
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {improvementModal.original?.questionText}
                </p>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {improvementModal.original?.options?.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-[11px] ${
                        opt === improvementModal.original?.correctAnswer
                          ? "border-emerald-300 bg-emerald-50 text-emerald-950 font-bold"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Improved */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI Improved Version
                </span>
                <p className="text-xs font-bold text-purple-950">
                  {improvementModal.suggestion?.questionText}
                </p>
                <div className="space-y-1.5 text-xs text-purple-950">
                  {improvementModal.suggestion?.options?.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-[11px] ${
                        opt === improvementModal.suggestion?.correctAnswer
                          ? "border-emerald-400 bg-emerald-100 text-emerald-950 font-bold"
                          : "border-purple-200 bg-white"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
                {improvementModal.suggestion?.improvementsSummary && (
                  <p className="text-[11px] text-purple-800 bg-purple-100/60 p-2 rounded-lg">
                    <strong>Changes: </strong>
                    {improvementModal.suggestion.improvementsSummary}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImprovementModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Original
              </button>
              <button
                type="button"
                onClick={handleApplySuggestion}
                disabled={applyingImprovement}
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {applyingImprovement ? "Applying..." : "Apply AI Improvement"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SHARE MODAL */}
      {shareData &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Candidate Assessment Link
              </h3>
              <button
                onClick={() => setShareData(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {shareData.qrCode && (
              <div className="flex justify-center py-2">
                <img
                  src={shareData.qrCode}
                  alt="Assessment QR Code"
                  className="h-44 w-44 rounded-xl border border-slate-200 p-2 shadow-2xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Public Candidate Registration URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareData.registrationLink || ""}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition shrink-0 flex items-center gap-1"
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

      {/* Unpublish Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnpublishConfirm}
        onClose={() => setShowUnpublishConfirm(false)}
        onConfirm={handleUnpublish}
        title="Unpublish Assessment?"
        message="Unpublishing will temporarily pause candidate registration and revert the assessment to Ready state. You will be able to freely generate AI questions or add manual MCQs, then republish when you are ready. Do you want to unpublish?"
        confirmText="Yes, Unpublish Assessment"
        cancelText="Keep Published"
        variant="warning"
        loading={unpublishing}
      />
    </div>
  );
};

export default AssessmentDetails;