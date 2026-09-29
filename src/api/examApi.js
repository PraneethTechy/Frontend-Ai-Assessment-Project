import api from "./axios";

export const startExam = async (assessmentId) => {
  const response = await api.post(
    `/exams/${assessmentId}/start`
  );

  return response.data;
};

export const getExamQuestions = async (examId) => {
  const response = await api.get(
    `/exams/${examId}/questions`
  );

  return response.data;
};

export const submitExam = async (
  examId,
  answers
) => {
  const response = await api.post(
    `/exams/${examId}/submit`,
    {
      answers,
    }
  );

  return response.data;
};

export const getExamResult = async (resultId) => {
  const response = await api.get(
    `/exams/results/${resultId}`
  );

  return response.data;
};

export const getAssessmentResults = async (assessmentId) => {
  const response = await api.get(
    `/exams/assessment/${assessmentId}/results`
  );

  return response.data;
};

export const getDriveResults = async (driveId) => {
  const response = await api.get(
    `/exams/drive/${driveId}/results`
  );

  return response.data;
};