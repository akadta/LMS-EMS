import api from "./Axios";

export const assessmentApi = {
  forEntity: (entityType, entityId) =>
    api.get(`/lms/assessments/for-entity`, {
      params: { entityType, entityId },
    }),
  get: (id) => api.get(`/lms/assessments/${id}`),
  create: (payload) => api.post(`/lms/assessments`, payload),
  updateSettings: (id, payload) => api.put(`/lms/assessments/${id}`, payload),
  switchMode: (id, payload) =>
    api.put(`/lms/assessments/${id}/switch-mode`, payload),
  publish: (id, payload) => api.post(`/lms/assessments/${id}/publish`, payload),
  toggleActive: (id) => api.put(`/lms/assessments/${id}/toggle-active`),
  deleteAssessment: (id) => api.delete(`/lms/assessments/${id}`),

  listQuestions: (assessmentId) =>
    api.get(`/lms/assessment-questions`, { params: { assessmentId } }),
  getQuestion: (id) => api.get(`/lms/assessment-questions/${id}`),
  createQuestion: (formData, onUploadProgress) =>
    api.post(`/lms/assessment-questions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  updateQuestion: (id, formData, onUploadProgress) =>
    api.put(`/lms/assessment-questions/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  deleteQuestion: (id) => api.delete(`/lms/assessment-questions/${id}`),

  aiGenerate: (payload) => api.post(`/lms/assessment-questions/ai-generate`, payload),
aiCommit: (payload) => api.post(`/lms/assessment-questions/ai-commit`, payload),
};
