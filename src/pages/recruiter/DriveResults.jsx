import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layers,
  Users,
  CheckCircle2,
  Award,
  Sparkles,
  RotateCcw,
  Download,
  ArrowLeft,
  Search,
  ExternalLink,
  Brain,
  Trophy,
  X,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchDriveResults,
  clearDriveResults,
} from "../../features/results/resultsSlice";
import {
  getDriveAISummaryApi,
  analyzeCandidateResultApi,
} from "../../api/aiApi";
import ErrorState from "../../components/common/ErrorState";

const DriveResults = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data, loading, error } = useAppSelector(
    (state) => state.results.driveResults
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Drive AI Executive Summary State
  const [driveAISummary, setDriveAISummary] = useState(null);
  const [driveAILoading, setDriveAILoading] = useState(false);
  const [driveAIError, setDriveAIError] = useState("");

  // Candidate AI Analysis in Modal State
  const [candidateAIAnalysis, setCandidateAIAnalysis] = useState(null);
  const [candidateAILoading, setCandidateAILoading] = useState(false);
  const [candidateAIError, setCandidateAIError] = useState("");

  useEffect(() => {
    dispatch(fetchDriveResults(driveId));
    return () => {
      dispatch(clearDriveResults());
    };
  }, [dispatch, driveId]);

  const drive = data?.drive;
  const rawCandidates = useMemo(() => data?.candidates || [], [data]);
  const driveAssessments = useMemo(() => data?.assessments || [], [data]);

  // Aggregate Drive Statistics
  const driveStats = useMemo(() => {
    const totalAssessments =
      data?.totalAssessments || driveAssessments.length || 0;
    const totalCandidates = rawCandidates.length;

    let totalCompletedExams = 0;
    let sumPercentage = 0;

    rawCandidates.forEach((c) => {
      sumPercentage += c.overallPercentage || 0;
      totalCompletedExams += (c.assessments || []).length;
    });

    const avgOverallPercentage =
      totalCandidates > 0
        ? (sumPercentage / totalCandidates).toFixed(1)
        : "0.0";

    const assessmentBreakdown = driveAssessments.map((a) => ({
      id: a.id || a._id,
      name: a.name || "Assessment Round",
      completedCount: a.completedCount ?? 0,
      avgScore: a.avgScore ?? 0,
      avgPercentage: a.avgPercentage ?? 0,
      questionsPerSet: a.questionsPerSet ?? 0,
    }));

    return {
      totalAssessments,
      totalCandidates,
      totalCompletedExams,
      avgOverallPercentage,
      assessmentBreakdown,
    };
  }, [data, rawCandidates, driveAssessments]);

  // Filter & Sort Candidates
  const filteredCandidates = useMemo(() => {
    let list = [...rawCandidates];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      list = list.filter((c) => {
        const name = c.candidateName?.toLowerCase() || "";
        const email = c.candidateEmail?.toLowerCase() || "";
        return name.includes(query) || email.includes(query);
      });
    }

    if (sortBy === "name") {
      list.sort((a, b) =>
        (a.candidateName || "").localeCompare(b.candidateName || "")
      );
    } else if (sortBy === "correct") {
      list.sort((a, b) => (b.totalCorrect || 0) - (a.totalCorrect || 0));
    } else if (sortBy === "percentage") {
      list.sort(
        (a, b) => (b.overallPercentage || 0) - (a.overallPercentage || 0)
      );
    } else if (sortBy === "assessments") {
      list.sort(
        (a, b) =>
          (b.assessments?.length || 0) - (a.assessments?.length || 0)
      );
    } else {
      list.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }

    return list;
  }, [rawCandidates, searchTerm, sortBy]);

  // Trigger Drive AI Summary
  const handleGenerateDriveAISummary = async () => {
    if (rawCandidates.length === 0) return;
    try {
      setDriveAILoading(true);
      setDriveAIError("");
      const res = await getDriveAISummaryApi(driveId);
      setDriveAISummary(res.summary);
    } catch (err) {
      setDriveAIError(
        err.response?.data?.message ||
          "Unable to generate AI drive executive summary at this time."
      );
    } finally {
      setDriveAILoading(false);
    }
  };

  // Trigger Individual Candidate AI Analysis
  const handleAnalyzeCandidate = async (candidate) => {
    const firstResult = candidate.assessments?.[0];
    if (!firstResult?.resultId) return;

    try {
      setCandidateAILoading(true);
      setCandidateAIError("");
      const res = await analyzeCandidateResultApi(firstResult.resultId);
      setCandidateAIAnalysis(res.analysis);
    } catch (err) {
      setCandidateAIError(
        err.response?.data?.message ||
          "Failed to analyze candidate result with AI."
      );
    } finally {
      setCandidateAILoading(false);
    }
  };

  // CSV Export for Combined Drive Results
  const handleExportCSV = () => {
    if (rawCandidates.length === 0) return;

    const headers = [
      "Rank",
      "Candidate Name",
      "Candidate Email",
      "Assessments Completed",
      "Total Correct",
      "Total Questions",
      "Overall Percentage",
      "Assessment Breakdown",
    ];

    const rows = rawCandidates.map((c) => {
      const roundsSummary = (c.assessments || [])
        .map(
          (a) =>
            `${a.assessmentName}: ${a.percentage}% (${a.score}/${a.totalQuestions})`
        )
        .join("; ");

      return [
        c.rank || "-",
        `"${c.candidateName || "Candidate"}"`,
        `"${c.candidateEmail || ""}"`,
        `${c.assessments?.length || 0}/${driveStats.totalAssessments}`,
        c.totalCorrect || 0,
        c.totalQuestions || 0,
        `${c.overallPercentage || 0}%`,
        `"${roundsSummary}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${(drive?.name || "Hiring_Drive").replace(
        /\s+/g,
        "_"
      )}_Multi_Assessment_Leaderboard.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Render Full Error State when fetch failed
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate(`/recruiter/drives/${driveId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Drive Management
          </button>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Hiring Drive Leaderboard
          </h1>
        </div>

        <ErrorState
          message={error}
          onRetry={() => dispatch(fetchDriveResults(driveId))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Navigation & Metadata */}
      <div>
        <button
          onClick={() => navigate(`/recruiter/drives/${driveId}`)}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Drive Management
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Trophy className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {drive?.name || "Hiring Drive"} — Multi-Assessment Leaderboard
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Domain:{" "}
              <span className="font-semibold text-slate-700">
                {drive?.domain || "General"}
              </span>{" "}
              • Aggregated candidate results across all MCQ assessment rounds
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateDriveAISummary}
              disabled={driveAILoading || rawCandidates.length === 0}
              title={
                rawCandidates.length === 0
                  ? "At least one candidate submission is required for AI Drive Summary"
                  : "Generate AI executive summary across all rounds"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-40 transition shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {driveAILoading ? "Analyzing Drive..." : "✨ Generate AI Drive Summary"}
            </button>

            <button
              onClick={() => dispatch(fetchDriveResults(driveId))}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-2xs"
            >
              <RotateCcw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={rawCandidates.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* AI Drive Executive Summary Alert */}
      {driveAIError && (
        <ErrorState
          message={driveAIError}
          onRetry={handleGenerateDriveAISummary}
        />
      )}

      {/* AI Drive Executive Summary Card */}
      {driveAISummary && (
        <div className="rounded-3xl border border-purple-200 bg-linear-to-r from-purple-50 via-indigo-50/40 to-purple-50 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-purple-950">
                Executive AI Drive Performance Report
              </h2>
            </div>
            <span className="rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold px-3 py-0.5 border border-purple-200 uppercase tracking-wider">
              Gemini AI Synthesized
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {driveAISummary.executiveSummary}
          </p>

          <div className="grid gap-3 sm:grid-cols-3 text-xs pt-1">
            <div className="bg-white/90 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                Strongest Round
              </span>
              <p className="text-slate-700 font-medium">
                {driveAISummary.strongestRound || "Consistent across rounds"}
              </p>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider">
                Challenging Round
              </span>
              <p className="text-slate-700 font-medium">
                {driveAISummary.mostChallengingRound || "No critical deficit detected"}
              </p>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-bold text-indigo-900 block text-[11px] uppercase tracking-wider">
                Strategic Next Step
              </span>
              <p className="text-slate-700 font-medium">
                {driveAISummary.strategicNextSteps?.[0] ||
                  "Invite top cohort for recruiter interviews."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                <div className="h-8 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-white border border-slate-200"></div>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Assessments
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {driveStats.totalAssessments}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Configured rounds in this drive
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Evaluated Candidates
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-purple-700">
                {driveStats.totalCandidates}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Candidates with completed tests
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Completed Tests
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                {driveStats.totalCompletedExams}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Total submitted assessment tests
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Overall Drive Average
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {driveStats.avgOverallPercentage}%
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Combined cohort mean score
              </p>
            </div>
          </div>

          {/* Assessment Rounds Comparison Breakdown */}
          {driveStats.assessmentBreakdown.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Assessment Rounds in this Drive
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct access and candidate completion breakdown per round
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {driveStats.assessmentBreakdown.length} round
                  {driveStats.assessmentBreakdown.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {driveStats.assessmentBreakdown.map((item) => (
                  <div
                    key={item.id || item.name}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-slate-50 hover:border-indigo-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {item.name}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {item.questionsPerSet || 20} Questions / Set
                          </span>
                        </div>
                        {item.id && (
                          <button
                            onClick={() =>
                              navigate(
                                `/recruiter/assessments/${item.id}/results`
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
                          >
                            <span>Round Scorecard</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
                          <span className="text-slate-400 block text-[11px]">
                            Submissions
                          </span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                            {item.completedCount} candidates
                          </span>
                        </div>

                        <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
                          <span className="text-slate-400 block text-[11px]">
                            Average Score
                          </span>
                          <span className="font-bold text-indigo-600 text-sm mt-0.5 block">
                            {item.avgPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(item.avgPercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combined Candidate Leaderboard */}
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            {/* Table Controls Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Drive Candidate Leaderboard & Rankings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredCandidates.length} of {rawCandidates.length}{" "}
                  evaluated candidates
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-1.5 text-xs outline-none focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white text-slate-700 font-semibold outline-none focus:border-indigo-500"
                >
                  <option value="rank">Sort by Rank</option>
                  <option value="percentage">Sort by Overall %</option>
                  <option value="correct">Sort by Total Correct</option>
                  <option value="assessments">Sort by Assessments Done</option>
                  <option value="name">Sort by Candidate Name</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {filteredCandidates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 text-xl font-bold">
                  🏆
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {searchTerm
                    ? "No candidates match your search filter"
                    : "No completed candidate test results in this drive yet"}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {searchTerm
                    ? "Try adjusting your search query or clear the filter to see all candidates."
                    : "Approved candidates who register and submit their MCQ exams inside this hiring drive will have their aggregated scores, performance ranks, and round breakdowns automatically populated here."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate(`/recruiter/drives/${driveId}`)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs shadow-indigo-100"
                  >
                    <span>Manage Drive & Candidates</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* Desktop & Tablet Table (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3.5">Rank</th>
                        <th className="px-5 py-3.5">Candidate</th>
                        <th className="px-5 py-3.5">Rounds Done</th>
                        <th className="px-5 py-3.5">Total Correct / Questions</th>
                        <th className="px-5 py-3.5">Overall Percentage</th>
                        <th className="px-5 py-3.5">Round Breakdown</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCandidates.map((candidate) => {
                        const percentage = candidate.overallPercentage || 0;
                        const badgeColor =
                          percentage >= 80
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : percentage >= 60
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : percentage >= 50
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200";

                        const completedCount =
                          candidate.assessments?.length || 0;
                        const totalRounds = driveStats.totalAssessments || 1;

                        return (
                          <tr
                            key={candidate.candidateId}
                            className="hover:bg-slate-50/70 transition cursor-pointer"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setCandidateAIAnalysis(null);
                              setCandidateAIError("");
                            }}
                          >
                            <td className="px-5 py-4 font-bold text-slate-900">
                              {candidate.rank === 1 ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-black">
                                  🥇 #1
                                </span>
                              ) : candidate.rank === 2 ? (
                                <span className="inline-flex items-center gap-1 text-slate-500 font-black">
                                  🥈 #2
                                </span>
                              ) : candidate.rank === 3 ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 font-black">
                                  🥉 #3
                                </span>
                              ) : (
                                <span className="text-slate-600">
                                  #{candidate.rank}
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">
                                {candidate.candidateName || "Candidate"}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {candidate.candidateEmail || "-"}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                                  completedCount >= totalRounds
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {completedCount} / {totalRounds} Completed
                              </span>
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-900">
                              {candidate.totalCorrect}{" "}
                              <span className="font-normal text-slate-400 text-[11px]">
                                / {candidate.totalQuestions}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}
                              >
                                {percentage}%
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {(candidate.assessments || []).map(
                                  (round, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-700 border border-slate-200"
                                    >
                                      <span className="font-medium text-slate-600">
                                        {round.assessmentName}:
                                      </span>
                                      <span className="font-bold text-indigo-600">
                                        {round.percentage}%
                                      </span>
                                    </span>
                                  )
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCandidate(candidate);
                                  setCandidateAIAnalysis(null);
                                  setCandidateAIError("");
                                }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                              >
                                View Scorecard →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Candidate Cards (< md) */}
                <div className="block md:hidden p-4 space-y-3">
                  {filteredCandidates.map((candidate) => {
                    const percentage = candidate.overallPercentage || 0;
                    const badgeColor =
                      percentage >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : percentage >= 60
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : percentage >= 50
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200";

                    const completedCount = candidate.assessments?.length || 0;
                    const totalRounds = driveStats.totalAssessments || 1;

                    return (
                      <div
                        key={candidate.candidateId}
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setCandidateAIAnalysis(null);
                          setCandidateAIError("");
                        }}
                        className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs cursor-pointer hover:border-indigo-200 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="text-sm font-black shrink-0">
                              {candidate.rank === 1 ? (
                                <span className="text-amber-600">🥇 #1</span>
                              ) : candidate.rank === 2 ? (
                                <span className="text-slate-500">🥈 #2</span>
                              ) : candidate.rank === 3 ? (
                                <span className="text-amber-700">🥉 #3</span>
                              ) : (
                                <span className="text-slate-600">#{candidate.rank}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {candidate.candidateName || "Candidate"}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {candidate.candidateEmail || "-"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold shrink-0 ${badgeColor}`}
                          >
                            {percentage}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              Completed
                            </span>
                            <span className="font-bold text-slate-700">
                              {completedCount} / {totalRounds} Rounds
                            </span>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              Score
                            </span>
                            <span className="font-bold text-slate-700">
                              {candidate.totalCorrect} / {candidate.totalQuestions}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <span>View Full Scorecard</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Candidate Multi-Round Detail Modal */}
      {selectedCandidate &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedCandidate(null)}
          >
            <div
              className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Drive Candidate Scorecard
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedCandidate.candidateName || "Candidate"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCandidate.candidateEmail}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Overview Metric Pills */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Rank
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    #{selectedCandidate.rank}
                  </p>
                </div>

                <div className="bg-indigo-50/70 rounded-2xl p-3.5 border border-indigo-100">
                  <span className="text-[11px] font-semibold text-indigo-500 block uppercase">
                    Combined %
                  </span>
                  <p className="text-2xl font-black text-indigo-700 mt-0.5">
                    {selectedCandidate.overallPercentage}%
                  </p>
                </div>

                <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-600 block uppercase">
                    Total Correct
                  </span>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">
                    {selectedCandidate.totalCorrect} /{" "}
                    {selectedCandidate.totalQuestions}
                  </p>
                </div>
              </div>

              {/* AI Candidate Analysis Section */}
              <div className="pt-1">
                {candidateAIAnalysis ? (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span>AI Candidate Performance Analysis</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {candidateAIAnalysis.summary}
                    </p>
                    {candidateAIAnalysis.recommendation && (
                      <p className="text-purple-800 font-semibold">
                        Recommendation: {candidateAIAnalysis.recommendation}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleAnalyzeCandidate(selectedCandidate)}
                    disabled={candidateAILoading}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/60 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs disabled:opacity-50"
                  >
                    <Brain className="h-3.5 w-3.5 text-purple-600" />
                    {candidateAILoading
                      ? "Generating AI Analysis..."
                      : "✨ Generate AI Candidate Analysis"}
                  </button>
                )}
                {candidateAIError && (
                  <p className="mt-1 text-xs text-rose-600">
                    {candidateAIError}
                  </p>
                )}
              </div>

              {/* Assessment-by-Assessment Detailed Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assessment Rounds Breakdown:
                </h4>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {(selectedCandidate.assessments || []).map((round, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">
                          {round.assessmentName}
                        </span>
                        <span className="font-bold text-indigo-600 text-sm">
                          {round.percentage}%
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>
                          Score: <strong>{round.score}</strong> /{" "}
                          {round.totalQuestions}
                        </span>
                        <span>
                          Correct:{" "}
                          <strong className="text-emerald-600">
                            {round.correctAnswers}
                          </strong>{" "}
                          | Incorrect:{" "}
                          <strong className="text-rose-600">
                            {round.incorrectAnswers}
                          </strong>
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-200/60">
                        <span>Set #{round.setNumber}</span>
                        <span>Submitted: {formatDate(round.submittedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
              >
                Close Scorecard
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DriveResults;
