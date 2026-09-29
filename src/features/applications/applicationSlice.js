import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  getAssessmentApplications,
  updateApplicationStatus,
  activateCandidateExam,
} from "../../api/applicationApi";

/* ================================
   FETCH APPLICATIONS
================================ */

export const fetchApplications =
  createAsyncThunk(
    "applications/fetchApplications",
    async (assessmentId, { rejectWithValue }) => {
      try {
        return await getAssessmentApplications(
          assessmentId
        );
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to fetch applications"
        );
      }
    }
  );

/* ================================
   APPROVE APPLICATION
================================ */

export const approveCandidate =
  createAsyncThunk(
    "applications/approveCandidate",
    async (applicationId, { rejectWithValue }) => {
      try {
        return await updateApplicationStatus(
          applicationId,
          "approved"
        );
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to approve candidate"
        );
      }
    }
  );

/* ================================
   ACTIVATE EXAM
================================ */

export const activateCandidateExamAction =
  createAsyncThunk(
    "applications/activateExam",
    async (applicationId, { rejectWithValue }) => {
      try {
        return await activateCandidateExam(
          applicationId
        );
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message ||
            "Failed to activate exam"
        );
      }
    }
  );

/* ================================
   INITIAL STATE
================================ */

const initialState = {
  applications: [],
  loading: false,
  error: null,
};

/* ================================
   SLICE
================================ */

const applicationSlice = createSlice({
  name: "applications",

  initialState,

  reducers: {
    clearApplications: (state) => {
      state.applications = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* FETCH */

      .addCase(
        fetchApplications.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchApplications.fulfilled,
        (state, action) => {
          state.loading = false;

          state.applications =
            action.payload.applications || [];
        }
      )

      .addCase(
        fetchApplications.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      /* APPROVE */

      .addCase(
        approveCandidate.pending,
        (state) => {
          state.error = null;
        }
      )

      .addCase(
        approveCandidate.fulfilled,
        (state, action) => {
          const updated =
            action.payload.application;

          if (!updated) {
            return;
          }

          const index =
            state.applications.findIndex(
              (application) =>
                application._id === updated._id
            );

          if (index !== -1) {
            state.applications[index] =
              updated;
          }
        }
      )

      .addCase(
        approveCandidate.rejected,
        (state, action) => {
          state.error = action.payload;
        }
      )

      /* ACTIVATE */

      .addCase(
        activateCandidateExamAction.pending,
        (state) => {
          state.error = null;
        }
      )

      .addCase(
        activateCandidateExamAction.fulfilled,
        (state, action) => {
          const updated =
            action.payload.application;

          if (!updated) {
            return;
          }

          const index =
            state.applications.findIndex(
              (application) =>
                application._id === updated._id
            );

          if (index !== -1) {
            state.applications[index] =
              updated;
          }
        }
      )

      .addCase(
        activateCandidateExamAction.rejected,
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export const {
  clearApplications,
} = applicationSlice.actions;

export default applicationSlice.reducer;