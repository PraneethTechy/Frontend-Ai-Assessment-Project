import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import driveReducer from "../features/drives/driveSlice";
import assessmentReducer from "../features/assessments/assessmentSlice";
import questionReducer from "../features/questions/questionSlice";
import applicationReducer from "../features/applications/applicationSlice";
import candidateReducer from "../features/candidate/candidateSlice";
import examReducer from "../features/exam/examSlice";
import resultsReducer from "../features/results/resultsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    drives: driveReducer,
    assessments: assessmentReducer,
    questions: questionReducer,
    applications: applicationReducer,
    candidate: candidateReducer,
    exam: examReducer,
    results: resultsReducer,
  },
});
