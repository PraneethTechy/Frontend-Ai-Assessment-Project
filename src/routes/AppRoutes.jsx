import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Unauthorized from "../pages/common/Unauthorized";

import ProtectedRoute from "./ProtectedRoute";
import RecruiterLayout from "../components/layout/RecruiterLayout";
import CandidateLayout from "../components/layout/CandidateLayout";

import Dashboard from "../pages/recruiter/Dashboard";
import Drives from "../pages/recruiter/Drives";
import DriveDetails from "../pages/recruiter/DriveDetails";
import AssessmentDetails from "../pages/recruiter/AssessmentDetails";
import QuestionManagement from "../pages/recruiter/QuestionManagement";
import Applications from "../pages/recruiter/Applications";
import AssessmentResults from "../pages/recruiter/AssessmentResults";
import DriveResults from "../pages/recruiter/DriveResults";
import AIInsights from "../pages/recruiter/AIInsights";
import Reports from "../pages/recruiter/Reports";
import Settings from "../pages/recruiter/Settings";
import HelpSupport from "../pages/recruiter/HelpSupport";

import CandidateDashboard from "../pages/candidate/CandidateDashboard";
import CandidateExam from "../pages/candidate/CandidateExam";
import ExamResult from "../pages/candidate/ExamResult";
import PublicAssessmentRegister from "../pages/candidate/PublicAssessmentRegister";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication & Registration Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/assessment/:assessmentId/register"
          element={<PublicAssessmentRegister />}
        />

        {/* Recruiter Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["recruiter"]} />}>
          <Route path="/recruiter" element={<RecruiterLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="drives" element={<Drives />} />
            <Route path="drives/:driveId" element={<DriveDetails />} />
            <Route
              path="drives/:driveId/results"
              element={<DriveResults />}
            />
            <Route
              path="assessments/:assessmentId"
              element={<AssessmentDetails />}
            />
            <Route
              path="assessments/:assessmentId/questions"
              element={<QuestionManagement />}
            />
            <Route
              path="assessments/:assessmentId/applications"
              element={<Applications />}
            />
            <Route
              path="assessments/:assessmentId/results"
              element={<AssessmentResults />}
            />
            <Route path="ai-insights" element={<AIInsights />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<HelpSupport />} />
          </Route>
        </Route>

        {/* Candidate Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route
              path="exam/:assessmentId"
              element={<CandidateExam />}
            />
            <Route
              path="result/:resultId"
              element={<ExamResult />}
            />
          </Route>
        </Route>

        {/* Default & Catch-all Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
