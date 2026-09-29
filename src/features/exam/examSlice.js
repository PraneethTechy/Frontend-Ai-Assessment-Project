import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  startExam,
  getExamQuestions,
  submitExam,
  getExamResult,
} from "../../api/examApi";

/* =================================
   START EXAM
================================= */

export const startCandidateExam =
  createAsyncThunk(
    "exam/startExam",
    async (assessmentId, { rejectWithValue }) => {
      try {
        return await startExam(assessmentId);
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to start exam"
        );
      }
    }
  );

/* =================================
   GET QUESTIONS
================================= */

export const fetchExamQuestions =
  createAsyncThunk(
    "exam/fetchQuestions",
    async (examId, { rejectWithValue }) => {
      try {
        return await getExamQuestions(examId);
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to load exam questions"
        );
      }
    }
  );

/* =================================
   SUBMIT EXAM
================================= */

export const submitCandidateExam =
  createAsyncThunk(
    "exam/submitExam",
    async (
      { examId, answers },
      { rejectWithValue }
    ) => {
      try {
        return await submitExam(
          examId,
          answers
        );
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to submit exam"
        );
      }
    }
  );

/* =================================
   GET RESULT
================================= */

export const fetchExamResult =
  createAsyncThunk(
    "exam/fetchResult",
    async (resultId, { rejectWithValue }) => {
      try {
        return await getExamResult(resultId);
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to load result"
        );
      }
    }
  );

/* =================================
   INITIAL STATE
================================= */

const initialState = {
  exam: null,
  questions: [],
  result: null,

  answers: {},

  currentQuestion: 0,

  loading: false,
  questionsLoading: false,
  submitting: false,
  resultLoading: false,

  error: null,
  questionsError: null,
  submitError: null,
  resultError: null,
};

/* =================================
   SLICE
================================= */

const examSlice = createSlice({
  name: "exam",

  initialState,

  reducers: {
    selectAnswer: (
      state,
      action
    ) => {
      const {
        questionId,
        selectedAnswer,
      } = action.payload;

      state.answers[questionId] =
        selectedAnswer;
    },

    nextQuestion: (state) => {
      if (
        state.currentQuestion <
        state.questions.length - 1
      ) {
        state.currentQuestion += 1;
      }
    },

    previousQuestion: (state) => {
      if (
        state.currentQuestion > 0
      ) {
        state.currentQuestion -= 1;
      }
    },

    goToQuestion: (
      state,
      action
    ) => {
      const index = action.payload;

      if (
        index >= 0 &&
        index < state.questions.length
      ) {
        state.currentQuestion = index;
      }
    },

    clearExam: (state) => {
      state.exam = null;
      state.questions = [];
      state.result = null;
      state.answers = {};
      state.currentQuestion = 0;
      state.error = null;
      state.questionsError = null;
      state.submitError = null;
      state.resultError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ==============================
         START
      ============================== */

      .addCase(
        startCandidateExam.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        startCandidateExam.fulfilled,
        (state, action) => {
          state.loading = false;

          state.exam =
            action.payload.exam ||
            action.payload;
        }
      )

      .addCase(
        startCandidateExam.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      /* ==============================
         QUESTIONS
      ============================== */

      .addCase(
        fetchExamQuestions.pending,
        (state) => {
          state.questionsLoading = true;
          state.questionsError = null;
        }
      )

      .addCase(
        fetchExamQuestions.fulfilled,
        (state, action) => {
          state.questionsLoading = false;

          state.questions =
            action.payload.questions ||
            [];

          state.currentQuestion = 0;
        }
      )

      .addCase(
        fetchExamQuestions.rejected,
        (state, action) => {
          state.questionsLoading = false;
          state.questionsError =
            action.payload;
        }
      )

      /* ==============================
         SUBMIT
      ============================== */

      .addCase(
        submitCandidateExam.pending,
        (state) => {
          state.submitting = true;
          state.submitError = null;
        }
      )

      .addCase(
        submitCandidateExam.fulfilled,
        (state, action) => {
          state.submitting = false;

          state.result =
            action.payload.result ||
            null;
        }
      )

      .addCase(
        submitCandidateExam.rejected,
        (state, action) => {
          state.submitting = false;
          state.submitError =
            action.payload;
        }
      )

      /* ==============================
         RESULT
      ============================== */

      .addCase(
        fetchExamResult.pending,
        (state) => {
          state.resultLoading = true;
          state.resultError = null;
        }
      )

      .addCase(
        fetchExamResult.fulfilled,
        (state, action) => {
          state.resultLoading = false;

          state.result =
            action.payload.result ||
            action.payload;
        }
      )

      .addCase(
        fetchExamResult.rejected,
        (state, action) => {
          state.resultLoading = false;
          state.resultError =
            action.payload;
        }
      );
  },
});

export const {
  selectAnswer,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  clearExam,
} = examSlice.actions;

export default examSlice.reducer;