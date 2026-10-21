import api from "./Axios";

export const studentLearningApi = {
  getBatches: () => api.get(`/student/learning/batches`),
  getBatchCourses: (batchId) =>
    api.get(`/student/learning/batches/${batchId}/courses`),
  enroll: (batchCourseId) =>
    api.post(`/student/learning/batch-courses/${batchCourseId}/enroll`),
  getModules: (courseId) =>
    api.get(`/student/learning/courses/${courseId}/modules`),
  getChapters: (moduleId) =>
    api.get(`/student/learning/modules/${moduleId}/chapters`),
  completeChapter: (chapterId) =>
    api.post(`/student/learning/chapters/${chapterId}/complete`),
  completeModule: (moduleId) =>
    api.post(`/student/learning/modules/${moduleId}/complete`),
  submitAttempt: (payload) =>
    api.post(`/student/learning/attempts/submit`, payload),

  getAssessment: (assessmentId) =>
  api.get(`/student/learning/assessments/${assessmentId}`),
getAssessmentQuestions: (assessmentId) =>
  api.get(`/student/learning/assessments/${assessmentId}/questions`),


startAttempt: (assessmentId) =>
  api.post(`/student/learning/assessments/${assessmentId}/start`),
saveProgress: (attemptId, payload) =>
  api.put(`/student/learning/attempts/${attemptId}/answers`, payload),
getProgress: (attemptId) =>
  api.get(`/student/learning/attempts/${attemptId}/answers`),
getGateStatus: (entityType, entityId) =>
  api.get(`/student/learning/gate-status/${entityType}/${entityId}`),
getHistory: () => api.get(`/student/learning/history`),
getHistoryModules: (courseId) => api.get(`/student/learning/history/courses/${courseId}/modules`),
getAttemptDetail: (attemptId) => api.get(`/student/learning/attempts/${attemptId}/detail`),
};


