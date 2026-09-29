import api from "./axios";

export const getAssessmentQuestions = async (assessmentId) => {
  const response = await api.get(
    `/assessments/${assessmentId}/questions`
  );

  return response.data;
};

export const createQuestion = async (questionData) => {
  const response = await api.post(
    "/questions",
    questionData
  );

  return response.data;
};

export const updateQuestion = async (
  questionId,
  questionData
) => {
  const response = await api.put(
    `/questions/${questionId}`,
    questionData
  );

  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(
    `/questions/${questionId}`
  );

  return response.data;
};