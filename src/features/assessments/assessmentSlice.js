import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  getAssessmentsByDrive,
  createAssessment,
} from "../../api/assessmentApi";

export const fetchAssessments = createAsyncThunk(
  "assessments/fetchAssessments",
  async (driveId, { rejectWithValue }) => {
    try {
      return await getAssessmentsByDrive(driveId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch assessments"
      );
    }
  }
);

export const addAssessment = createAsyncThunk(
  "assessments/addAssessment",
  async (assessmentData, { rejectWithValue }) => {
    try {
      return await createAssessment(assessmentData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create assessment"
      );
    }
  }
);

const initialState = {
  assessments: [],
  loading: false,
  error: null,
};

const assessmentSlice = createSlice({
  name: "assessments",
  initialState,

  reducers: {
    clearAssessments: (state) => {
      state.assessments = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchAssessments.fulfilled,
        (state, action) => {
          state.loading = false;

          state.assessments =
            action.payload.assessments || [];
        }
      )

      .addCase(
        fetchAssessments.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      .addCase(addAssessment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        addAssessment.fulfilled,
        (state, action) => {
          state.loading = false;

          if (action.payload.assessment) {
            state.assessments.push(
              action.payload.assessment
            );
          }
        }
      )

      .addCase(
        addAssessment.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearAssessments } =
  assessmentSlice.actions;

export default assessmentSlice.reducer;