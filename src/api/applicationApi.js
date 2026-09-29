import api from "./axios";

export const getAssessmentApplications = async (
  assessmentId
) => {
  const response = await api.get(
    `/candidates/assessment/${assessmentId}/applications`
  );

  return response.data;
};

export const updateApplicationStatus = async (
  applicationId,
  status
) => {
  const response = await api.patch(
    `/candidates/applications/${applicationId}/status`,
    {
      status,
    }
  );

  return response.data;
};

export const activateCandidateExam = async (
  applicationId
) => {
  const response = await api.patch(
    `/candidates/applications/${applicationId}/activate`
  );

  return response.data;
};

export const bulkApproveApplications = async (assessmentId) => {
  const response = await api.patch(
    `/candidates/assessment/${assessmentId}/approve-all`
  );
  return response.data;
};

export const bulkActivateExams = async (assessmentId) => {
  const response = await api.patch(
    `/candidates/assessment/${assessmentId}/activate-all`
  );
  return response.data;
};