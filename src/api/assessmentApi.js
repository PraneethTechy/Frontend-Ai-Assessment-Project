import api from "./axios";

export const createAssessment = async (
  assessmentData
) => {
  const response = await api.post(
    "/assessments",
    assessmentData
  );

  return response.data;
};

export const getAssessmentsByDrive = async (
  driveId
) => {
  const response = await api.get(
    `/assessments/drive/${driveId}`
  );

  return response.data;
};

export const getAssessment = async (
  assessmentId
) => {
  const response = await api.get(
    `/assessments/${assessmentId}`
  );

  return response.data;
};

export const generateQuestions = async (
  assessmentId
) => {
  const response = await api.post(
    `/assessments/${assessmentId}/generate-questions`
  );

  return response.data;
};


export const publishAssessment = async (
  assessmentId
) => {
  const response = await api.patch(
    `/assessments/${assessmentId}/status`,
    {
      status: "published",
    }
  );

  return response.data;
};

export const unpublishAssessment = async (
  assessmentId
) => {
  const response = await api.patch(
    `/assessments/${assessmentId}/status`,
    {
      status: "ready",
    }
  );

  return response.data;
};

export const getShareLink = async (
  assessmentId
) => {
  const response = await api.get(
    `/assessments/${assessmentId}/share`
  );

  return response.data;
};