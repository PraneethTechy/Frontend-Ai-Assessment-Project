import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  BarChart3,
  ArrowLeft,
  Award,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchExamResult } from "../../features/exam/examSlice";
import ErrorState from "../../components/common/ErrorState";

const ExamResult = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { result, resultLoading, resultError } = useAppSelector(
    (state) => state.exam
  );

  useEffect(() => {
    if (resultId) {
      dispatch(fetchExamResult(resultId));
    }
  }, [dispatch, resultId]);

  if (resultLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">
            Loading your examination scorecard...
          </p>
        </div>
      </div>
    );
  }

  if (resultError) {
    return (
      <div className="mx-auto max-w-xl my-12">
        <ErrorState
          message={resultError}
          onRetry={() => navigate("/candidate/dashboard")}
        />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Result record not available.
      </div>
    );
  }

  const assessmentName = result.assessmentId?.name || "Assessment Round";
  const percentage = result.percentage || 0;
  const isHighPass = percentage >= 75;
  const isPass = percentage >= 50;

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in py-4">
      {/* Completion Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-xs border border-emerald-100">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Examination Completed
        </h1>

        <p className="text-xs sm:text-sm text-slate-500">
          Your answers for <strong className="text-slate-700">{assessmentName}</strong> have been submitted and scored.
        </p>
      </div>

      {/* Main Scorecard Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-10 text-center shadow-xs space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Final Scored Result
        </span>

        <p className="text-5xl sm:text-6xl font-black text-indigo-600 tracking-tight">
          {result.score}
          <span className="text-2xl font-normal text-slate-400">
            {" "}
            / {result.totalQuestions}
          </span>
        </p>

        <div className="flex items-center justify-center pt-2">
          <span
            className={`inline-block rounded-full px-5 py-1.5 text-xs font-bold border ${
              isHighPass
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isPass
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {percentage}% Overall Accuracy
          </span>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-center">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Total Questions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{result.totalQuestions}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Attempted</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{result.attemptedQuestions}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600">Correct Answers</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{result.correctAnswers}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold text-rose-600">Incorrect Answers</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{result.incorrectAnswers}</p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => navigate("/candidate/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Candidate Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default ExamResult;