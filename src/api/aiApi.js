import api from "./axios";

export const analyzeQuestionApi = async (questionId) => {
  const response = await api.post(`/ai/questions/${questionId}/analyze`);
  return response.data;
};

export const improveQuestionApi = async (questionId) => {
  const response = await api.post(`/ai/questions/${questionId}/improve`);
  return response.data;
};

export const analyzeCandidateResultApi = async (resultId) => {
  const response = await api.post(`/ai/results/${resultId}/analysis`);
  return response.data;
};

export const getAssessmentAIInsightsApi = async (assessmentId) => {
  const response = await api.post(`/ai/assessments/${assessmentId}/insights`);
  return response.data;
};

export const getDriveAISummaryApi = async (driveId) => {
  const response = await api.post(`/ai/drives/${driveId}/summary`);
  return response.data;
};
