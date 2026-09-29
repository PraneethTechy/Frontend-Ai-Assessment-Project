import api from "./axios";

export const getMyApplications = async () => {
  const response = await api.get(
    "/candidates/applications"
  );

  return response.data;
};

export const getMyExam = async (
  assessmentId
) => {
  const response = await api.get(
    `/candidates/exam/${assessmentId}`
  );

  return response.data;
};

export const getPublicAssessment = async (
  assessmentId
) => {
  const response = await api.get(
    `/candidates/public/assessment/${assessmentId}`
  );

  return response.data;
};

export const applyForAssessment = async (
  assessmentId
) => {
  const response = await api.post(
    "/candidates/apply",
    {
      assessmentId,
    }
  );

  return response.data;
};