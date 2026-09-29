import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Download, Briefcase, ExternalLink, CheckCircle } from "lucide-react";

import { getDrives } from "../../api/driveApi";
import { getDriveResults } from "../../api/examApi";
import PageHeader from "../../components/common/PageHeader";

const Reports = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getDrives();
        setDrives(res.drives || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadDriveCSV = async (driveId, driveName) => {
    try {
      const data = await getDriveResults(driveId);
      const candidates = data.candidates || [];
      if (candidates.length === 0) {
        alert("No completed candidate submissions to export for this drive yet.");
        return;
      }

      const headers = [
        "Rank",
        "Candidate Name",
        "Candidate Email",
        "Total Correct",
        "Total Questions",
        "Overall Percentage",
        "Rounds Breakdown",
      ];

      const rows = candidates.map((c) => {
        const rounds = (c.assessments || [])
          .map((a) => `${a.assessmentName}: ${a.percentage}% (${a.score}/${a.totalQuestions})`)
          .join("; ");

        return [
          c.rank || "-",
          `"${c.candidateName || "Candidate"}"`,
          `"${c.candidateEmail || ""}"`,
          c.totalCorrect || 0,
          c.totalQuestions || 0,
          `${c.overallPercentage || 0}%`,
          `"${rounds}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute(
        "download",
        `${(driveName || "Hiring_Drive").replace(/\s+/g, "_")}_Export.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export drive report.");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Data Export"
        subtitle="Export candidate scorecards, multi-round drive results, and assessment rankings in CSV format."
      />

      {/* Reports Directory */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Exportable Hiring Drive Reports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate full candidate scorecards with round breakdowns and percentile rankings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading available drive reports...</div>
        ) : drives.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No drives available for export.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {drives.map((drive) => (
              <div
                key={drive._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {drive.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Domain: {drive.domain} • Standardized CSV Export
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleDownloadDriveCSV(drive._id, drive.name)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-xs font-bold transition shadow-xs shadow-indigo-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </button>

                  <button
                    onClick={() => navigate(`/recruiter/drives/${drive._id}/results`)}
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    View Analytics →
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

export default Reports;
