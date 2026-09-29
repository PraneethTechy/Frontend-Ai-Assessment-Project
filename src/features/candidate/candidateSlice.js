import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  getMyApplications,
  getMyExam,
} from "../../api/candidateApi";

/* ================================
   GET MY APPLICATIONS
================================ */

export const fetchMyApplications =
  createAsyncThunk(
    "candidate/fetchMyApplications",
    async (_, { rejectWithValue }) => {
      try {
        return await getMyApplications();
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to fetch applications"
        );
      }
    }
  );

/* ================================
   GET MY EXAM
================================ */

export const fetchMyExam =
  createAsyncThunk(
    "candidate/fetchMyExam",
    async (assessmentId, { rejectWithValue }) => {
      try {
        return await getMyExam(
          assessmentId
        );
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to fetch exam"
        );
      }
    }
  );

/* ================================
   INITIAL STATE
================================ */

const initialState = {
  applications: [],
  exam: null,
  loading: false,
  examLoading: false,
  error: null,
  examError: null,
};

/* ================================
   SLICE
================================ */

const candidateSlice = createSlice({
  name: "candidate",

  initialState,

  reducers: {
    clearCandidateError: (state) => {
      state.error = null;
      state.examError = null;
    },

    clearExam: (state) => {
      state.exam = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ============================
         APPLICATIONS
      ============================ */

      .addCase(
        fetchMyApplications.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchMyApplications.fulfilled,
        (state, action) => {
          state.loading = false;

          state.applications =
            action.payload.applications || [];
        }
      )

      .addCase(
        fetchMyApplications.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      /* ============================
         EXAM
      ============================ */

      .addCase(
        fetchMyExam.pending,
        (state) => {
          state.examLoading = true;
          state.examError = null;
        }
      )

      .addCase(
        fetchMyExam.fulfilled,
        (state, action) => {
          state.examLoading = false;

          state.exam =
            action.payload.exam || null;
        }
      )

      .addCase(
        fetchMyExam.rejected,
        (state, action) => {
          state.examLoading = false;
          state.examError = action.payload;
        }
      );
  },
});

export const {
  clearCandidateError,
  clearExam,
} = candidateSlice.actions;

export default candidateSlice.reducer;