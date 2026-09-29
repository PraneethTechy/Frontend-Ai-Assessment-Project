import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  getDrives,
  createDrive,
} from "../../api/driveApi";

export const fetchDrives = createAsyncThunk(
  "drives/fetchDrives",
  async (_, { rejectWithValue }) => {
    try {
      return await getDrives();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch hiring drives"
      );
    }
  }
);

export const addDrive = createAsyncThunk(
  "drives/addDrive",
  async (driveData, { rejectWithValue }) => {
    try {
      return await createDrive(driveData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create hiring drive"
      );
    }
  }
);

const initialState = {
  drives: [],
  loading: false,
  error: null,
};

const driveSlice = createSlice({
  name: "drives",
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchDrives.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchDrives.fulfilled, (state, action) => {
        state.loading = false;

        state.drives =
          action.payload.drives || [];
      })

      .addCase(fetchDrives.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addDrive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addDrive.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.drive) {
          state.drives.unshift(
            action.payload.drive
          );
        }
      })

      .addCase(addDrive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default driveSlice.reducer;