import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Brain,
  BarChart,
  ArrowRight,
  Trophy,
  Users,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { getDrives } from "../../api/driveApi";
import { getDriveResults } from "../../api/examApi";
import PageHeader from "../../components/common/PageHeader";

const AIInsights = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Drive for Leaderboard Integration
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [driveLeaderboardData, setDriveLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  useEffect(() => {
    const loadDrives = async () => {
      try {
        setLoading(true);
        const res = await getDrives();
        const loadedDrives = res.drives || [];
        setDrives(loadedDrives);
        if (loadedDrives.length > 0) {
          setSelectedDriveId(loadedDrives[0]._id);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    loadDrives();
  }, []);

  // Fetch leaderboard data when selected drive changes
  useEffect(() => {
    if (!selectedDriveId) return;

    const loadDriveLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        setLeaderboardError("");
        const res = await getDriveResults(selectedDriveId);
        setDriveLeaderboardData(res);
      } catch (err) {
        setLeaderboardError(
          err.response?.data?.message || "Failed to load drive leaderboard"
        );
        setDriveLeaderboardData(null);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadDriveLeaderboard();
  }, [selectedDriveId]);

  const selectedDrive = useMemo(
    () => drives.find((d) => d._id === selectedDriveId),
    [drives, selectedDriveId]
  );

  const topCandidates = useMemo(
    () => (driveLeaderboardData?.candidates || []).slice(0, 5),
    [driveLeaderboardData]
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="AI Intelligence & Insights"
        subtitle="Explore AI-assisted question generation, candidate performance summaries, and executive drive reports."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 px-3 py-0.5 text-xs font-bold border border-purple-200 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            Active AI Engine
          </span>
        }
      />

      {/* AI Capabilities Cards (Responsive: 1-col mobile, 2-col tablet, 3-col desktop) */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 w-fit">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Automated Question Generation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-set MCQ synthesis with difficulty distribution and semantic deduplication.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 w-fit">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Question Quality & Refinement
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant clarity evaluation, distractor improvement, and side-by-side question refinement.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3 md:col-span-2 lg:col-span-1">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 w-fit">
              <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Candidate & Drive Summaries
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Factual score synthesis, identified strengths, focus areas, and interview recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Hiring Drives with AI Analytics */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Hiring Drives with AI Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an active hiring drive to generate an AI Executive Summary or drill down into assessment insights.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 self-start sm:self-auto">
            {drives.length} Drive{drives.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading drives...
          </div>
        ) : drives.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No hiring drives created yet. Create a hiring drive to run AI assessments.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {drives.map((drive) => (
              <div
                key={drive._id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {drive.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Domain: <span className="font-semibold text-slate-700">{drive.domain}</span>
                    {drive.technologies?.length > 0 && (
                      <span className="hidden sm:inline"> • Tech: {drive.technologies.join(", ")}</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
                  <button
                    onClick={() =>
                      navigate(`/recruiter/drives/${drive._id}/results`)
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-4 py-2 text-xs font-bold transition shadow-2xs w-full sm:w-auto"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Drive AI Executive Summary</span>
                  </button>

                  <button
                    onClick={() => navigate(`/recruiter/drives/${drive._id}`)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs w-full sm:w-auto"
                  >
                    <span>View Drive</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Performance Leaderboard Section */}
      {drives.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
          {/* Section Header: Fully Responsive across Desktop, Tablet, and Mobile */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <Trophy className="h-4 w-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Drive Candidate Leaderboard Preview
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time cohort performance and rankings aggregated across all rounds in the selected drive.
              </p>
            </div>

            {/* Controls: Adapts gracefully from Desktop row to Mobile column without overflow */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <label
                  htmlFor="drive-select"
                  className="text-xs font-bold text-slate-500 shrink-0"
                >
                  Select Drive:
                </label>
                <select
                  id="drive-select"
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="w-full sm:w-auto sm:max-w-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs truncate"
                >
                  {drives.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.domain || "General"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDriveId && (
                <button
                  onClick={() =>
                    navigate(`/recruiter/drives/${selectedDriveId}/results`)
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs shadow-indigo-100 w-full sm:w-auto shrink-0"
                >
                  <span>View Full Leaderboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 pt-0">
            {leaderboardLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Loading drive leaderboard results...
              </div>
            ) : leaderboardError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between">
                <span>{leaderboardError}</span>
                <button
                  onClick={() =>
                    navigate(`/recruiter/drives/${selectedDriveId}/results`)
                  }
                  className="font-bold underline ml-2"
                >
                  Go to Drive Page
                </button>
              </div>
            ) : topCandidates.length === 0 ? (
              <div className="p-6 sm:p-8 text-center space-y-2 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200">
                <div className="text-2xl">📊</div>
                <h4 className="text-sm font-bold text-slate-700">
                  No candidate submissions yet for "{selectedDrive?.name}"
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Once candidates are approved and submit their MCQ assessments, their aggregated cohort rankings and performance metrics will appear here.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() =>
                      navigate(`/recruiter/drives/${selectedDriveId}`)
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <span>Manage Drive Rounds & Candidates</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Drive Quick Metric Strip (1 col on mobile, 3 cols on sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Rounds
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">
                        {driveLeaderboardData?.totalAssessments || 0} Assessments
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Evaluated
                      </span>
                      <span className="text-sm sm:text-base font-bold text-purple-700 truncate block">
                        {driveLeaderboardData?.totalCandidates || 0} Candidates
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Top Score
                      </span>
                      <span className="text-sm sm:text-base font-bold text-emerald-600 truncate block">
                        {topCandidates[0]?.overallPercentage ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* DESKTOP & TABLET VIEW: Clean Table (hidden on mobile < 768px) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Candidate</th>
                        <th className="px-4 py-3">Rounds Completed</th>
                        <th className="px-4 py-3">Total Score</th>
                        <th className="px-4 py-3">Overall %</th>
                        <th className="px-4 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCandidates.map((candidate) => {
                        const pct = candidate.overallPercentage || 0;
                        const badgeColor =
                          pct >= 80
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : pct >= 60
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-700 border-amber-200";

                        return (
                          <tr
                            key={candidate.candidateId}
                            className="hover:bg-slate-50/70 transition"
                          >
                            <td className="px-4 py-3 font-bold text-slate-900">
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
                                <span>#{candidate.rank}</span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900 block truncate max-w-xs">
                                {candidate.candidateName}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                {candidate.candidateEmail}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {candidate.assessments?.length || 0} /{" "}
                              {driveLeaderboardData?.totalAssessments || 1}
                            </td>

                            <td className="px-4 py-3 font-bold text-slate-900">
                              {candidate.totalCorrect}{" "}
                              <span className="font-normal text-slate-400 text-[11px]">
                                / {candidate.totalQuestions}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeColor}`}
                              >
                                {pct}%
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/recruiter/drives/${selectedDriveId}/results`
                                  )
                                }
                                className="font-bold text-indigo-600 hover:text-indigo-800 transition"
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

                {/* MOBILE VIEW: Compact Candidate Cards (visible on mobile < 768px) */}
                <div className="block md:hidden space-y-3">
                  {topCandidates.map((candidate) => {
                    const pct = candidate.overallPercentage || 0;
                    const badgeColor =
                      pct >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : pct >= 60
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <div
                        key={candidate.candidateId}
                        className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs"
                      >
                        {/* Header: Rank + Candidate Name + Overall % */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center justify-center font-black text-sm shrink-0">
                              {candidate.rank === 1 ? (
                                <span className="text-amber-600 font-black">🥇 #1</span>
                              ) : candidate.rank === 2 ? (
                                <span className="text-slate-500 font-black">🥈 #2</span>
                              ) : candidate.rank === 3 ? (
                                <span className="text-amber-700 font-black">🥉 #3</span>
                              ) : (
                                <span className="text-slate-600">#{candidate.rank}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {candidate.candidateName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {candidate.candidateEmail}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold shrink-0 ${badgeColor}`}
                          >
                            {pct}%
                          </span>
                        </div>

                        {/* Metric Row */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                              Rounds
                            </span>
                            <span className="font-bold text-slate-700 text-xs">
                              {candidate.assessments?.length || 0} / {driveLeaderboardData?.totalAssessments || 1}
                            </span>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                              Total Score
                            </span>
                            <span className="font-bold text-slate-700 text-xs">
                              {candidate.totalCorrect} / {candidate.totalQuestions}
                            </span>
                          </div>
                        </div>

                        {/* Action Link */}
                        <button
                          onClick={() =>
                            navigate(
                              `/recruiter/drives/${selectedDriveId}/results`
                            )
                          }
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <span>View Full Scorecard</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
