import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  getAssessmentQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../api/questionApi";

export const fetchQuestions = createAsyncThunk(
  "questions/fetchQuestions",
  async (assessmentId, { rejectWithValue }) => {
    try {
      return await getAssessmentQuestions(
        assessmentId
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch questions"
      );
    }
  }
);

export const addQuestion = createAsyncThunk(
  "questions/addQuestion",
  async (questionData, { rejectWithValue }) => {
    try {
      return await createQuestion(questionData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create question"
      );
    }
  }
);

export const editQuestion = createAsyncThunk(
  "questions/editQuestion",
  async (
    { questionId, questionData },
    { rejectWithValue }
  ) => {
    try {
      return await updateQuestion(
        questionId,
        questionData
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to update question"
      );
    }
  }
);

export const removeQuestion = createAsyncThunk(
  "questions/removeQuestion",
  async (questionId, { rejectWithValue }) => {
    try {
      await deleteQuestion(questionId);

      return questionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete question"
      );
    }
  }
);

const initialState = {
  questions: [],
  loading: false,
  error: null,
};

const questionSlice = createSlice({
  name: "questions",
  initialState,

  reducers: {
    clearQuestions: (state) => {
      state.questions = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchQuestions.fulfilled,
        (state, action) => {
          state.loading = false;

          if (Array.isArray(action.payload?.questions)) {
            state.questions = action.payload.questions;
          } else if (action.payload?.sets) {
            state.questions = Object.values(
              action.payload.sets || {}
            ).flat();
          } else {
            state.questions = [];
          }
        }
      )

      .addCase(
        fetchQuestions.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      .addCase(addQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        addQuestion.fulfilled,
        (state, action) => {
          state.loading = false;

          if (action.payload.question) {
            state.questions.push(
              action.payload.question
            );
          }
        }
      )

      .addCase(
        addQuestion.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      .addCase(
        editQuestion.fulfilled,
        (state, action) => {
          const updated =
            action.payload.question;

          const index = state.questions.findIndex(
            (question) =>
              question._id === updated._id
          );

          if (index !== -1) {
            state.questions[index] = updated;
          }
        }
      )

      .addCase(
        editQuestion.rejected,
        (state, action) => {
          state.error = action.payload;
        }
      )

      .addCase(
        removeQuestion.fulfilled,
        (state, action) => {
          state.questions =
            state.questions.filter(
              (question) =>
                question._id !== action.payload
            );
        }
      )

      .addCase(
        removeQuestion.rejected,
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export const { clearQuestions } =
  questionSlice.actions;

export default questionSlice.reducer;