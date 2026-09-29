import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAssessmentResults, getDriveResults } from "../../api/examApi";

export const fetchAssessmentResults = createAsyncThunk(
  "results/fetchAssessmentResults",
  async (assessmentId, { rejectWithValue }) => {
    try {
      const data = await getAssessmentResults(assessmentId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load assessment results"
      );
    }
  }
);

export const fetchDriveResults = createAsyncThunk(
  "results/fetchDriveResults",
  async (driveId, { rejectWithValue }) => {
    try {
      const data = await getDriveResults(driveId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load drive results"
      );
    }
  }
);

const initialState = {
  assessmentResults: {
    data: null,
    loading: false,
    error: null,
  },
  driveResults: {
    data: null,
    loading: false,
    error: null,
  },
};

const resultsSlice = createSlice({
  name: "results",
  initialState,
  reducers: {
    clearAssessmentResults: (state) => {
      state.assessmentResults = { data: null, loading: false, error: null };
    },
    clearDriveResults: (state) => {
      state.driveResults = { data: null, loading: false, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      // Assessment Results
      .addCase(fetchAssessmentResults.pending, (state) => {
        state.assessmentResults.loading = true;
        state.assessmentResults.error = null;
      })
      .addCase(fetchAssessmentResults.fulfilled, (state, action) => {
        state.assessmentResults.loading = false;
        state.assessmentResults.data = action.payload;
      })
      .addCase(fetchAssessmentResults.rejected, (state, action) => {
        state.assessmentResults.loading = false;
        state.assessmentResults.error = action.payload;
      })
      // Drive Results
      .addCase(fetchDriveResults.pending, (state) => {
        state.driveResults.loading = true;
        state.driveResults.error = null;
      })
      .addCase(fetchDriveResults.fulfilled, (state, action) => {
        state.driveResults.loading = false;
        state.driveResults.data = action.payload;
      })
      .addCase(fetchDriveResults.rejected, (state, action) => {
        state.driveResults.loading = false;
        state.driveResults.error = action.payload;
      });
  },
});

export const { clearAssessmentResults, clearDriveResults } = resultsSlice.actions;

export default resultsSlice.reducer;
