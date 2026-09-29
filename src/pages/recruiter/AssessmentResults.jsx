import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAssessmentResults } from "../../features/results/resultsSlice";
import {
  getAssessmentAIInsightsApi,
  analyzeCandidateResultApi,
} from "../../api/aiApi";

const AssessmentResults = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data, loading, error } = useAppSelector(
    (state) => state.results.assessmentResults
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [sortBy, setSortBy] = useState("rank");

  // Selected candidate detail modal & candidate AI analysis state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateAIAnalysis, setCandidateAIAnalysis] = useState(null);
  const [candidateAILoading, setCandidateAILoading] = useState(false);

  // Assessment Cohort AI Insights State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAssessmentResults(assessmentId));
  }, [dispatch, assessmentId]);

  const assessment = data?.assessment;
  const rawResults = useMemo(() => data?.results || [], [data]);

  // Derived Summary & Analytics
  const stats = useMemo(() => {
    if (rawResults.length === 0) {
      return {
        totalCompleted: 0,
        avgScore: 0,
        avgPercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        totalQuestions: assessment?.questionsPerSet || 0,
        topPerformer: null,
        passRate70: 0,
        lowRate50: 0,
        bins: [
          { label: "81–100%", count: 0, color: "bg-emerald-500" },
          { label: "61–80%", count: 0, color: "bg-indigo-500" },
          { label: "41–60%", count: 0, color: "bg-blue-500" },
          { label: "21–40%", count: 0, color: "bg-amber-500" },
          { label: "0–20%", count: 0, color: "bg-red-500" },
        ],
        mostCommonBin: "-",
      };
    }

    const scores = rawResults.map((r) => r.score || 0);
    const percentages = rawResults.map((r) => r.percentage || 0);
    const totalQuestions = rawResults[0]?.totalQuestions || assessment?.questionsPerSet || 0;

    const sumScore = scores.reduce((a, b) => a + b, 0);
    const sumPercentage = percentages.reduce((a, b) => a + b, 0);

    const above70Count = rawResults.filter((r) => (r.percentage || 0) >= 70).length;
    const below50Count = rawResults.filter((r) => (r.percentage || 0) < 50).length;

    const b81_100 = rawResults.filter((r) => (r.percentage || 0) > 80).length;
    const b61_80 = rawResults.filter((r) => (r.percentage || 0) > 60 && (r.percentage || 0) <= 80).length;
    const b41_60 = rawResults.filter((r) => (r.percentage || 0) > 40 && (r.percentage || 0) <= 60).length;
    const b21_40 = rawResults.filter((r) => (r.percentage || 0) > 20 && (r.percentage || 0) <= 40).length;
    const b0_20 = rawResults.filter((r) => (r.percentage || 0) <= 20).length;

    const bins = [
      { label: "81–100%", count: b81_100, color: "bg-emerald-500" },
      { label: "61–80%", count: b61_80, color: "bg-indigo-500" },
      { label: "41–60%", count: b41_60, color: "bg-blue-500" },
      { label: "21–40%", count: b21_40, color: "bg-amber-500" },
      { label: "0–20%", count: b0_20, color: "bg-red-500" },
    ];

    const sortedBins = [...bins].sort((a, b) => b.count - a.count);
    const mostCommonBin = sortedBins[0].count > 0 ? sortedBins[0].label : "-";

    return {
      totalCompleted: rawResults.length,
      avgScore: (sumScore / rawResults.length).toFixed(1),
      avgPercentage: (sumPercentage / rawResults.length).toFixed(1),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      totalQuestions,
      topPerformer: rawResults[0]?.candidateId?.name || null,
      passRate70: Math.round((above70Count / rawResults.length) * 100),
      lowRate50: Math.round((below50Count / rawResults.length) * 100),
      bins,
      mostCommonBin,
    };
  }, [rawResults, assessment]);

  // Filter & Sort
  const filteredResults = useMemo(() => {
    const list = rawResults.map((r, index) => ({
      ...r,
      rank: index + 1,
    }));

    let filtered = list.filter((r) => {
      const name = r.candidateId?.name?.toLowerCase() || "";
      const email = r.candidateId?.email?.toLowerCase() || "";
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || name.includes(query) || email.includes(query);

      const p = r.percentage || 0;
      let matchesTier = true;
      if (filterTier === "top") matchesTier = p >= 80;
      else if (filterTier === "proficient") matchesTier = p >= 60 && p < 80;
      else if (filterTier === "passing") matchesTier = p >= 50 && p < 60;
      else if (filterTier === "low") matchesTier = p < 50;

      return matchesSearch && matchesTier;
    });

    if (sortBy === "score") {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) =>
        (a.candidateId?.name || "").localeCompare(b.candidateId?.name || "")
      );
    } else if (sortBy === "date") {
      filtered.sort(
        (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
      );
    } else {
      filtered.sort((a, b) => a.rank - b.rank);
    }

    return filtered;
  }, [rawResults, searchTerm, filterTier, sortBy]);

  // Trigger Assessment Cohort AI Insights
  const handleGenerateAIInsights = async () => {
    try {
      setAiInsightsLoading(true);
      const res = await getAssessmentAIInsightsApi(assessmentId);
      setAiInsights(res.insights);
    } catch {
      alert("Unable to generate AI assessment insights at this time.");
    } finally {
      setAiInsightsLoading(false);
    }
  };

  // Trigger Candidate AI Analysis
  const handleGenerateCandidateAI = async (resultId) => {
    try {
      setCandidateAILoading(true);
      const res = await analyzeCandidateResultApi(resultId);
      setCandidateAIAnalysis(res.analysis);
    } catch {
      alert("Unable to generate candidate AI scorecard analysis.");
    } finally {
      setCandidateAILoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (rawResults.length === 0) return;

    const headers = [
      "Rank",
      "Candidate Name",
      "Candidate Email",
      "Score",
      "Total Questions",
      "Percentage",
      "Correct Answers",
      "Incorrect Answers",
      "Attempted Questions",
      "Submitted At",
    ];

    const rows = rawResults.map((r, i) => [
      i + 1,
      `"${r.candidateId?.name || "Candidate"}"`,
      `"${r.candidateId?.email || ""}"`,
      r.score || 0,
      r.totalQuestions || 0,
      `${r.percentage || 0}%`,
      r.correctAnswers || 0,
      r.incorrectAnswers || 0,
      r.attemptedQuestions || 0,
      `"${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${(assessment?.name || "Assessment").replace(/\s+/g, "_")}_Results.csv`
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

  return (
    <div className="space-y-8">
      {/* Header Navigation & Metadata */}
      <div>
        <button
          onClick={() => navigate(`/recruiter/assessments/${assessmentId}`)}
          className="mb-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Assessment Management
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">
                {assessment?.name || "Assessment"} — Performance Analytics
              </h1>
              {assessment?.status && (
                <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider">
                  {assessment.status}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {assessment?.duration ? `${assessment.duration} min duration` : ""}
              {assessment?.questionsPerSet ? ` • ${assessment.questionsPerSet} questions per set` : ""}
              {assessment?.technologies?.length > 0 ? ` • Topics: ${assessment.technologies.join(", ")}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateAIInsights}
              disabled={aiInsightsLoading || rawResults.length === 0}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-40 transition shadow-xs flex items-center gap-1.5"
            >
              {aiInsightsLoading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Analyzing...
                </>
              ) : (
                <>
                  <span>✨</span> Generate AI Assessment Insights
                </>
              )}
            </button>

            <button
              onClick={() => dispatch(fetchAssessmentResults(assessmentId))}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-xs"
            >
              🔄 Refresh
            </button>

            <button
              onClick={handleExportCSV}
              disabled={rawResults.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition shadow-xs flex items-center gap-1.5"
            >
              <span>📥</span> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <p>{error}</p>
          <button
            onClick={() => dispatch(fetchAssessmentResults(assessmentId))}
            className="rounded bg-red-100 px-3 py-1 font-medium text-red-800 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* AI Assessment Insights Banner */}
      {aiInsights && (
        <div className="rounded-2xl border border-purple-200 bg-linear-to-r from-purple-50 via-indigo-50/40 to-purple-50 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-bold text-purple-950">
                AI-Assisted Assessment Insights
              </h2>
            </div>
            <span className="rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold px-3 py-0.5 border border-purple-200 uppercase tracking-wider">
              AI-assisted Analysis
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {aiInsights.overview}
          </p>

          <div className="grid gap-4 sm:grid-cols-3 text-xs pt-2">
            <div className="bg-white/80 p-3.5 rounded-xl border border-purple-100 space-y-1">
              <span className="font-bold text-purple-900 block">Difficulty Alignment:</span>
              <p className="text-slate-600">{aiInsights.difficultyObservations}</p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-purple-100 space-y-1">
              <span className="font-bold text-emerald-800 block">Key Cohort Strength:</span>
              <p className="text-slate-600">
                {aiInsights.cohortStrengths?.[0] || "Solid candidate engagement."}
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-purple-100 space-y-1">
              <span className="font-bold text-indigo-900 block">Recruiter Action Item:</span>
              <p className="text-slate-600">
                {aiInsights.recruiterRecommendations?.[0] || "Schedule top tier candidates."}
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
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
              >
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                <div className="h-8 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-white border border-slate-200"></div>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                Completed Examinations
              </span>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {stats.totalCompleted}
              </p>
              <p className="mt-1 text-xs text-slate-400">Total submitted tests</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                Average Candidate Score
              </span>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {stats.avgPercentage}%
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Mean score: {stats.avgScore} / {stats.totalQuestions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                Top Score
              </span>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {stats.highestScore}{" "}
                <span className="text-base font-normal text-slate-400">
                  / {stats.totalQuestions}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {stats.topPerformer ? `Highest: ${stats.topPerformer}` : "Max recorded"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                Lowest Score
              </span>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {stats.lowestScore}{" "}
                <span className="text-base font-normal text-slate-400">
                  / {stats.totalQuestions}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-400">Minimum recorded score</p>
            </div>
          </div>

          {/* Performance Distribution & Summary Insights */}
          {stats.totalCompleted > 0 && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Score Distribution Chart */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Score Distribution Histogram
                    </h2>
                    <p className="text-xs text-slate-500">
                      Candidate percentage breakdown across 5 standard score brackets
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    Mode: {stats.mostCommonBin}
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  {stats.bins.map((bin) => {
                    const pct =
                      stats.totalCompleted > 0
                        ? Math.round((bin.count / stats.totalCompleted) * 100)
                        : 0;

                    return (
                      <div key={bin.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{bin.label}</span>
                          <span>
                            {bin.count} candidates ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bin.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data-Driven Insights */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Performance Summary
                  </h2>
                  <p className="text-xs text-slate-500">
                    Statistical overview derived from submission data
                  </p>

                  <div className="mt-5 space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block">Top Tier Proficiency (≥ 70%)</span>
                      <p className="text-base font-bold text-emerald-700 mt-0.5">
                        {stats.passRate70}% of candidates
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block">Needs Reinforcement (&lt; 50%)</span>
                      <p className="text-base font-bold text-amber-700 mt-0.5">
                        {stats.lowRate50}% of candidates
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block">Lead Candidate</span>
                      <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                        {stats.topPerformer || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-4">
                  * Metrics automatically calculated from scored answers in this assessment.
                </p>
              </div>
            </div>
          )}

          {/* Results Scorecard Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Table Filter Controls */}
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Candidate Scorecard & Rankings
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredResults.length} of {rawResults.length} candidate submissions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search candidate name / email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 min-w-55"
                />

                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All Score Tiers</option>
                  <option value="top">Top Performers (≥ 80%)</option>
                  <option value="proficient">Proficient (60–79%)</option>
                  <option value="passing">Passing (50–59%)</option>
                  <option value="low">Needs Review (&lt; 50%)</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="rank">Sort by Rank</option>
                  <option value="score">Sort by Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Submitted Date</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredResults.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-slate-600 font-semibold">
                  {searchTerm || filterTier !== "all"
                    ? "No candidates match the selected filters."
                    : "No candidate test submissions found yet."}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Once candidates finish their exam rounds, their scored responses, ranks, and submission metrics will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Rank</th>
                      <th className="px-5 py-3.5">Candidate</th>
                      <th className="px-5 py-3.5">Score</th>
                      <th className="px-5 py-3.5">Percentage</th>
                      <th className="px-5 py-3.5 text-center">Accuracy</th>
                      <th className="px-5 py-3.5 text-center">Attempted</th>
                      <th className="px-5 py-3.5">Submitted At</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.map((result) => {
                      const candidateName =
                        result.candidateId?.name || "Candidate";
                      const candidateEmail =
                        result.candidateId?.email || "-";
                      const percentage = result.percentage || 0;

                      const badgeColor =
                        percentage >= 80
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : percentage >= 60
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : percentage >= 50
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-red-100 text-red-800 border-red-200";

                      return (
                        <tr
                          key={result._id}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                          onClick={() => {
                            setSelectedCandidate(result);
                            setCandidateAIAnalysis(null);
                          }}
                        >
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {result.rank === 1 ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                                🥇 #1
                              </span>
                            ) : result.rank === 2 ? (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                                🥈 #2
                              </span>
                            ) : result.rank === 3 ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                🥉 #3
                              </span>
                            ) : (
                              <span>#{result.rank}</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {candidateName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {candidateEmail}
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {result.score}{" "}
                            <span className="font-normal text-xs text-slate-400">
                              / {result.totalQuestions}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}
                            >
                              {percentage}%
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="text-emerald-700 font-semibold">
                              {result.correctAnswers}
                            </span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-red-600 font-semibold">
                              {result.incorrectAnswers}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center text-slate-600 text-xs">
                            {result.attemptedQuestions} / {result.totalQuestions}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(result.submittedAt)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCandidate(result);
                                setCandidateAIAnalysis(null);
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                            >
                              Scorecard →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Candidate Detail & AI Analysis Modal */}
      {selectedCandidate &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedCandidate(null)}
          >
            <div
              className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Candidate Scorecard Details
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedCandidate.candidateId?.name || "Candidate"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedCandidate.candidateId?.email}
                </p>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Score & Rank Overview */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs text-slate-400 block">Assessment Rank</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  #{selectedCandidate.rank}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <span className="text-xs text-indigo-500 block">Percentage</span>
                <p className="text-2xl font-black text-indigo-700 mt-0.5">
                  {selectedCandidate.percentage}%
                </p>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="space-y-2 text-sm text-slate-700 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-semibold">{selectedCandidate.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Questions Attempted:</span>
                <span className="font-semibold">{selectedCandidate.attemptedQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Correct Answers:</span>
                <span className="font-bold text-emerald-600">{selectedCandidate.correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Incorrect Answers:</span>
                <span className="font-bold text-red-600">{selectedCandidate.incorrectAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Set:</span>
                <span className="font-semibold">Set #{selectedCandidate.setNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted:</span>
                <span className="font-semibold">{formatDate(selectedCandidate.submittedAt)}</span>
              </div>
            </div>

            {/* AI Candidate Performance Analysis Section */}
            {!candidateAIAnalysis ? (
              <button
                type="button"
                onClick={() => handleGenerateCandidateAI(selectedCandidate._id)}
                disabled={candidateAILoading}
                className="w-full rounded-xl border border-purple-200 bg-purple-50/50 py-3 text-xs font-bold text-purple-700 hover:bg-purple-100 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {candidateAILoading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Analyzing Candidate Performance...
                  </>
                ) : (
                  <>
                    <span>✨</span> Generate AI Candidate Evaluation
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="font-bold text-purple-950 flex items-center gap-1.5">
                    <span>✨</span> AI-Assisted Candidate Analysis
                  </span>
                  <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Advisory
                  </span>
                </div>

                <p className="text-slate-700 font-medium leading-relaxed">
                  {candidateAIAnalysis.summary}
                </p>

                {candidateAIAnalysis.strengths?.length > 0 && (
                  <div>
                    <span className="font-bold text-emerald-800 block">Demonstrated Strengths:</span>
                    <ul className="list-disc pl-4 text-slate-600 mt-0.5 space-y-0.5">
                      {candidateAIAnalysis.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {candidateAIAnalysis.followUpRecommendations?.length > 0 && (
                  <div>
                    <span className="font-bold text-indigo-800 block">Suggested Interview Discussion:</span>
                    <ul className="list-disc pl-4 text-slate-600 mt-0.5 space-y-0.5">
                      {candidateAIAnalysis.followUpRecommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
            >
              Close Details
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AssessmentResults;
