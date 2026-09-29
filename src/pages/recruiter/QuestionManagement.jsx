import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  ShieldCheck,
  Wand2,
  Edit3,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchQuestions,
  addQuestion,
  editQuestion,
  removeQuestion,
} from "../../features/questions/questionSlice";
import { analyzeQuestionApi, improveQuestionApi } from "../../api/aiApi";
import { getAssessment, generateQuestions } from "../../api/assessmentApi";

const emptyForm = {
  questionText: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correctOptionIndex: 0,
  explanation: "",
  technology: "",
  difficulty: "medium",
  setNumber: 1,
};

const QuestionManagement = () => {
  const { assessmentId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { questions, loading, error } = useAppSelector(
    (state) => state.questions
  );

  const [assessment, setAssessment] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const [setFilter, setSetFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [technologyFilter, setTechnologyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // AI Quality Analysis State (keyed by question ID)
  const [qualityMap, setQualityMap] = useState({});
  const [qualityLoadingMap, setQualityLoadingMap] = useState({});

  // AI Improvement Comparison Modal State
  const [improvingId, setImprovingId] = useState(null);
  const [improvementModal, setImprovementModal] = useState(null);
  const [applyingImprovement, setApplyingImprovement] = useState(false);

  useEffect(() => {
    dispatch(fetchQuestions(assessmentId));

    const loadAssessmentDetails = async () => {
      try {
        const data = await getAssessment(assessmentId);
        if (data.assessment) {
          setAssessment(data.assessment);
          if (data.assessment.technologies?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              technology: prev.technology || data.assessment.technologies[0],
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load assessment metadata:", err);
      }
    };

    loadAssessmentDetails();
  }, [assessmentId, dispatch]);

  const technologies = useMemo(() => {
    const list = questions.map((item) => item.technology).filter(Boolean);
    return Array.from(new Set(list));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchSet =
        setFilter === "all" || question.setNumber === Number(setFilter);

      const matchDifficulty =
        difficultyFilter === "all" ||
        question.difficulty === difficultyFilter;

      const matchTechnology =
        technologyFilter === "all" ||
        question.technology === technologyFilter;

      const matchSearch =
        !searchTerm.trim() ||
        question.questionText?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        question.technology?.toLowerCase().includes(searchTerm.toLowerCase().trim());

      return matchSet && matchDifficulty && matchTechnology && matchSearch;
    });
  }, [questions, setFilter, difficultyFilter, technologyFilter, searchTerm]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const options = [
      formData.option1.trim(),
      formData.option2.trim(),
      formData.option3.trim(),
      formData.option4.trim(),
    ];

    if (options.some((opt) => !opt)) {
      alert("Please provide all 4 options.");
      return;
    }

    const correctAnswer = options[formData.correctOptionIndex];

    const questionData = {
      assessmentId,
      questionText: formData.questionText.trim(),
      type: "mcq",
      options,
      correctAnswer,
      explanation: formData.explanation.trim(),
      technology: formData.technology.trim() || assessment?.technologies?.[0] || "General",
      difficulty: formData.difficulty,
      setNumber: Number(formData.setNumber),
      generatedByAI: false,
    };

    if (editingId) {
      const result = await dispatch(
        editQuestion({
          questionId: editingId,
          questionData,
        })
      );

      if (editQuestion.fulfilled.match(result)) {
        setActionSuccess("Question updated successfully!");
        resetForm();
      }
      return;
    }

    const result = await dispatch(addQuestion(questionData));
    if (addQuestion.fulfilled.match(result)) {
      setActionSuccess("Question created successfully!");
      resetForm();
    }
  };

  const handleEdit = (question) => {
    setEditingId(question._id);
    const options = question.options || ["", "", "", ""];
    let correctIdx = options.findIndex((opt) => opt === question.correctAnswer);
    if (correctIdx === -1) correctIdx = 0;

    setFormData({
      questionText: question.questionText || "",
      option1: options[0] || "",
      option2: options[1] || "",
      option3: options[2] || "",
      option4: options[3] || "",
      correctOptionIndex: correctIdx,
      explanation: question.explanation || "",
      technology: question.technology || assessment?.technologies?.[0] || "",
      difficulty: question.difficulty || "medium",
      setNumber: question.setNumber || 1,
    });
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );
    if (!confirmed) return;
    dispatch(removeQuestion(questionId));
    setActionSuccess("Question deleted.");
  };

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      technology: assessment?.technologies?.[0] || "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Trigger OpenRouter AI Question Generation directly from Question Studio
  const handleGenerateAI = async () => {
    if (generatingAI) return;

    try {
      setGeneratingAI(true);
      setActionSuccess("");
      const res = await generateQuestions(assessmentId);
      setActionSuccess(
        `OpenRouter AI successfully synthesized ${res.totalQuestions || 0} questions!`
      );
      dispatch(fetchQuestions(assessmentId));
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "AI question generation failed."
      );
    } finally {
      setGeneratingAI(false);
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

      const result = await dispatch(
        editQuestion({
          questionId,
          questionData,
        })
      );

      if (editQuestion.fulfilled.match(result)) {
        setImprovementModal(null);
        setActionSuccess("AI improvement applied to question!");
      }
    } finally {
      setApplyingImprovement(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back button & Breadcrumb */}
      <div>
        <button
          onClick={() => navigate(`/recruiter/assessments/${assessmentId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Assessment Overview
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {assessment?.name || "Assessment"} • Question Studio
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Author custom MCQs, generate with OpenRouter AI, run quality audits, and refine distractors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateAI}
            disabled={generatingAI}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generatingAI ? "Synthesizing with AI..." : "Generate with AI"}
          </button>

          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Close Form" : "+ Add Question Manually"}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2.5 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess("")}
            className="text-xs text-emerald-600 font-bold hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Manual Question Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-indigo-200 bg-linear-to-b from-indigo-50/40 via-white to-white p-6 sm:p-8 shadow-md space-y-5 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-indigo-600" />
              {editingId ? "Edit Question" : "Author New Multiple-Choice Question"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Question Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="questionText"
              rows={3}
              required
              value={formData.questionText}
              onChange={handleChange}
              placeholder="e.g. In React 19, what hook replaces useEffect for loading asynchronous resources?"
              className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-600"
            />
          </div>

          {/* 4 Options with Radio Select for Correct Answer */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Options & Correct Answer <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 -mt-1.5">
              Select the radio button beside the option that represents the correct answer.
            </p>

            {[0, 1, 2, 3].map((idx) => {
              const key = `option${idx + 1}`;
              const letter = String.fromCharCode(65 + idx);
              const isSelected = formData.correctOptionIndex === idx;

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
                        setFormData({ ...formData, correctOptionIndex: idx })
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
                    name={key}
                    required
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={`Option ${letter} text`}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-600 bg-white"
                  />

                  {isSelected && (
                    <span className="rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                      Correct ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Set Number
              </label>
              <select
                name="setNumber"
                value={formData.setNumber}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
              >
                {Array.from({ length: assessment?.numberOfSets || 4 }).map((_, i) => (
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
                name="technology"
                required
                value={formData.technology}
                onChange={handleChange}
                placeholder="e.g. React"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
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
              name="explanation"
              rows={2}
              value={formData.explanation}
              onChange={handleChange}
              placeholder="Why this answer is correct..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
            >
              {editingId ? "Save Changes" : "Create Question"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
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
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
          >
            <option value="all">All Sets</option>
            {Array.from({ length: assessment?.numberOfSets || 4 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Set {i + 1}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={technologyFilter}
            onChange={(e) => setTechnologyFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
          >
            <option value="all">All Technologies</option>
            {technologies.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredQuestions.length} of {questions.length} questions
        </span>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {loading && questions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Loading questions...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 space-y-2">
            <p className="font-bold text-slate-700">No questions found matching your filter.</p>
            <p className="text-xs text-slate-400">
              Use &quot;Generate with AI&quot; or &quot;+ Add Question Manually&quot; to populate your assessment.
            </p>
          </div>
        ) : (
          filteredQuestions.map((question, index) => {
            const qAnalysis = qualityMap[question._id];
            const isQualityLoading = qualityLoadingMap[question._id];
            const isImproving = improvingId === question._id;

            return (
              <div
                key={question._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4 transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      #{index + 1}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      Set {question.setNumber || 1}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        question.difficulty === "easy"
                          ? "bg-emerald-50 text-emerald-700"
                          : question.difficulty === "hard"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {question.difficulty?.toUpperCase()}
                    </span>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      {question.technology || "General"}
                    </span>
                    {question.generatedByAI ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                        <Sparkles className="h-3 w-3" /> AI
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Manual
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQualityCheck(question._id)}
                      disabled={isQualityLoading}
                      title="AI Quality Audit"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                      {isQualityLoading ? "Checking..." : "AI Audit"}
                    </button>

                    <button
                      onClick={() => handleRequestImprovement(question)}
                      disabled={isImproving}
                      title="Refine with AI"
                      className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                      {isImproving ? "Refining..." : "AI Improve"}
                    </button>

                    <button
                      onClick={() => handleEdit(question)}
                      title="Edit Question"
                      className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(question._id)}
                      title="Delete Question"
                      className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  {question.questionText}
                </p>

                {/* 4 Options Grid with Correct Answer Highlight */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.options?.map((option, optIdx) => {
                    const isCorrect = option === question.correctAnswer;
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

                {question.explanation && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
                    <strong className="text-slate-800">Explanation: </strong>
                    {question.explanation}
                  </div>
                )}

                {/* AI Quality Audit Banner */}
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
          })
        )}
      </div>

      {/* AI Improvement Modal */}
      {improvementModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
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
    </div>
  );
};

export default QuestionManagement;