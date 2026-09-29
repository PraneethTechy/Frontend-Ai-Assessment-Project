import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Flag,
  RotateCcw,
  Send,
  HelpCircle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  startCandidateExam,
  fetchExamQuestions,
  selectAnswer,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  submitCandidateExam,
} from "../../features/exam/examSlice";

import ErrorState from "../../components/common/ErrorState";
import ConfirmModal from "../../components/common/ConfirmModal";

const CandidateExam = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    exam,
    questions,
    answers,
    currentQuestion,
    loading,
    questionsLoading,
    submitting,
    error,
    questionsError,
    submitError,
  } = useAppSelector((state) => state.exam);

  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [markedForReview, setMarkedForReview] = useState({});

  // Start exam
  const handleConfirmStart = async () => {
    setConfirmed(true);

    const result = await dispatch(startCandidateExam(assessmentId));

    if (startCandidateExam.fulfilled.match(result)) {
      setStarted(true);

      const examId =
        result.payload.exam?._id ||
        result.payload.exam?.id ||
        result.payload._id ||
        result.payload.id;

      if (examId) {
        dispatch(fetchExamQuestions(examId));
      }
    }
  };

  // Timer countdown initialization
  useEffect(() => {
    if (!started || !exam) return;

    const duration =
      exam.duration ||
      exam.assessmentId?.duration ||
      30;

    setTimeLeft(duration * 60);
  }, [started, exam]);

  // Timer countdown loop
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === null || previous <= 1) {
          clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const answersRef = useRef(answers);
  const examRef = useRef(exam);
  const submittingRef = useRef(submitting);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // Submission handler
  const executeSubmission = useCallback(
    async (automatic = false) => {
      const currentExam = examRef.current;

      if (!currentExam || submittingRef.current || hasSubmittedRef.current) {
        return;
      }

      hasSubmittedRef.current = true;

      const examId = currentExam._id || currentExam.id;
      const currentAnswers = answersRef.current || {};

      const formattedAnswers = Object.entries(currentAnswers).map(
        ([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })
      );

      const result = await dispatch(
        submitCandidateExam({
          examId,
          answers: formattedAnswers,
        })
      );

      if (submitCandidateExam.fulfilled.match(result)) {
        const resultId =
          result.payload.result?._id ||
          result.payload.result?.id ||
          result.payload._id ||
          result.payload.id;

        if (resultId) {
          navigate(`/candidate/result/${resultId}`);
        } else {
          navigate("/candidate/dashboard");
        }
      }
    },
    [dispatch, navigate]
  );

  // Auto-submit when timer expires
  useEffect(() => {
    if (started && timeLeft === 0 && !submitting) {
      executeSubmission(true);
    }
  }, [started, timeLeft, submitting, executeSubmission]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) {
      return "--:--";
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  // Toggle mark for review
  const toggleMarkForReview = (qId) => {
    if (!qId) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const assessmentName =
    exam?.assessmentId?.name || exam?.name || "MCQ Examination";

  /* ========================================================================= */
  /* SCREEN 1: PRE-EXAM INSTRUCTIONS & CONFIRMATION                             */
  /* ========================================================================= */
  if (!confirmed) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                AI Assess • Candidate Examination
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {assessmentName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please review the exam protocol before launching your session.
            </p>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Clock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Strictly Timed Test</strong>
                The timer will begin the moment you click "Start Exam". When the timer reaches 00:00, all answered questions will be automatically submitted.
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Multiple Choice Questions (MCQ)</strong>
                Each question has four options and exactly one correct answer. You can freely change answers and jump between questions before submission.
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Flag className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Mark for Review</strong>
                Use the "Mark for Review" button on any question to flag it in the question navigator and return to it later.
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Single Submission Guarantee</strong>
                Once finalized and submitted, your assessment score is calculated immediately. Do not refresh or close your browser tab during the test.
              </div>
            </div>
          </div>

          {error && <ErrorState message={error} />}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate("/candidate/dashboard")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              ← Cancel & Return to Dashboard
            </button>

            <button
              onClick={handleConfirmStart}
              disabled={loading}
              className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{loading ? "Initializing Session..." : "I Understand, Start Exam"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SCREEN 2: LOADING OR ERROR                                                */
  /* ========================================================================= */
  if (questionsLoading || (loading && !exam)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-semibold text-slate-700">
            Loading assessment questions...
          </p>
        </div>
      </div>
    );
  }

  if (questionsError || (!questionsLoading && questions.length === 0)) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <ErrorState
          message={questionsError || "No questions found for this assessment."}
          onRetry={() => navigate("/candidate/dashboard")}
        />
      </div>
    );
  }

  /* ========================================================================= */
  /* SCREEN 3: ACTIVE EXAM TWO-COLUMN WORKSPACE                                */
  /* ========================================================================= */
  const question = questions[currentQuestion];
  const questionId = question?._id || question?.id;
  const selectedAnswer = answers[questionId];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const attemptedCount = Object.keys(answers).length;
  const unansweredCount = questions.length - attemptedCount;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const isCurrentMarked = Boolean(markedForReview[questionId]);

  // Timer urgency states
  const isTimeCritical = timeLeft !== null && timeLeft <= 60; // < 1 min
  const isTimeLow = timeLeft !== null && timeLeft <= 300 && !isTimeCritical; // < 5 min

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in">
      {/* =================================================================== */}
      {/* STICKY EXAM TOPBAR (BRAND, ASSESSMENT TITLE, PROGRESS & TIMER)      */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand & Assessment Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
                  AI Assess Exam Room
                </span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {assessmentName}
                </h1>
              </div>
            </div>

            {/* Right: Question Counter & Sticky Timer */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                Question {currentQuestion + 1} of {questions.length}
              </span>

              {/* Urgency-Responsive Timer */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold tracking-wider transition ${
                  isTimeCritical
                    ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse shadow-xs"
                    : isTimeLow
                    ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                    : "bg-slate-50 text-slate-800 border-slate-200"
                }`}
              >
                <Clock
                  className={`h-4 w-4 ${
                    isTimeCritical
                      ? "text-rose-600"
                      : isTimeLow
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                />
                <span>{formatTime(timeLeft)}</span>
                <span className="hidden md:inline text-[10px] uppercase font-semibold opacity-70">
                  Remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN TWO-COLUMN BODY LAYOUT                                         */}
      {/* =================================================================== */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {submitError && (
          <div className="mb-6">
            <ErrorState message={submitError} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* =============================================================== */}
          {/* LEFT COLUMN (~70% -> col-span-8): QUESTION CONTENT & CONTROLS  */}
          {/* =============================================================== */}
          <main className="lg:col-span-8 space-y-6">
            {/* Active Question Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              {/* Card Header: Badges & Mark for Review Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    Question {currentQuestion + 1}
                  </span>

                  {question.technology && (
                    <span className="rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {question.technology}
                    </span>
                  )}

                  {question.difficulty && (
                    <span
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                        question.difficulty === "easy"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : question.difficulty === "hard"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  )}
                </div>

                {/* Mark for Review Button */}
                <button
                  type="button"
                  onClick={() => toggleMarkForReview(questionId)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                    isCurrentMarked
                      ? "border-amber-300 bg-amber-50 text-amber-800 shadow-2xs"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Flag
                    className={`h-3.5 w-3.5 ${
                      isCurrentMarked ? "fill-amber-600 text-amber-600" : "text-slate-400"
                    }`}
                  />
                  <span>
                    {isCurrentMarked ? "Marked for Review" : "Mark for Review"}
                  </span>
                </button>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {question.questionText}
                </h2>
              </div>

              {/* 4 MCQ Options */}
              <div className="space-y-3 pt-2">
                {question.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const letter = String.fromCharCode(65 + index);

                  return (
                    <label
                      key={index}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-150 ${
                        isSelected
                          ? "border-2 border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-700 font-medium"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${questionId}`}
                        value={option}
                        checked={isSelected}
                        onChange={() =>
                          dispatch(
                            selectAnswer({
                              questionId,
                              selectedAnswer: option,
                            })
                          )
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />

                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-extrabold shrink-0 transition ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {letter}
                      </span>

                      <span className="text-xs sm:text-sm leading-relaxed flex-1">
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Clear Answer helper */}
              {selectedAnswer && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        selectAnswer({
                          questionId,
                          selectedAnswer: null,
                        })
                      )
                    }
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear choice
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Question Controls Bar */}
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                disabled={currentQuestion === 0}
                onClick={() => dispatch(previousQuestion())}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </button>

              <div className="flex items-center gap-2.5">
                {!isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => dispatch(nextQuestion())}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs shadow-indigo-200 transition"
                  >
                    Next Question <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs shadow-emerald-200 transition disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> Review & Submit
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* =============================================================== */}
          {/* RIGHT COLUMN (~30% -> col-span-4): STICKY QUESTION NAVIGATOR    */}
          {/* =============================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
              {/* Header & Progress Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Question Navigator
                  </h3>
                  <span className="text-xs font-bold text-indigo-600">
                    {attemptedCount} of {questions.length} answered
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{
                      width: `${(attemptedCount / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Clickable Matrix of Questions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Select Question to Navigate
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                  {questions.map((item, index) => {
                    const id = item._id || item.id;
                    const isAnswered = Boolean(answers[id]);
                    const isCurrent = index === currentQuestion;
                    const isMarked = Boolean(markedForReview[id]);

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => dispatch(goToQuestion(index))}
                        title={`Question ${index + 1}${
                          isAnswered ? " (Answered)" : " (Unanswered)"
                        }${isMarked ? " • Marked for Review" : ""}`}
                        className={`relative h-10 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                          isCurrent
                            ? "ring-2 ring-indigo-600 bg-indigo-50 text-indigo-700 font-extrabold shadow-xs"
                            : isAnswered
                            ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {index + 1}

                        {/* Marked for Review Amber Dot */}
                        {isMarked && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600 font-medium">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Status Legend
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-md ring-2 ring-indigo-600 bg-indigo-50 shrink-0" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-md bg-emerald-600 shrink-0" />
                    <span>Answered ({attemptedCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-md bg-slate-100 border border-slate-200 shrink-0" />
                    <span>Unanswered ({unansweredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative h-4 w-4 rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </span>
                    <span>Marked ({markedCount})</span>
                  </div>
                </div>
              </div>

              {/* Submit Assessment Button in Sidebar */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Submitting..." : "Submit Assessment"}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Modal on Submit */}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          executeSubmission(false);
        }}
        title="Submit Assessment?"
        message={
          unansweredCount > 0
            ? `You have answered ${attemptedCount} of ${questions.length} questions. There are still ${unansweredCount} unanswered question(s). Unanswered questions will receive 0 marks. Are you ready to submit your assessment?`
            : `All ${questions.length} questions have been answered. Once submitted, your exam is finalized and scored immediately. Do you want to submit now?`
        }
        confirmText="Yes, Submit Assessment"
        cancelText="Continue Exam"
        variant={unansweredCount > 0 ? "warning" : "primary"}
        loading={submitting}
      />
    </div>
  );
};

export default CandidateExam;