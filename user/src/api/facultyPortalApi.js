import api from "./Axios";

export const facultyPortalApi = {
  getBatches: () => api.get(`/faculty/portal/batches`),
  getStudentTracking: (batchCourseId) =>
    api.get(`/faculty/portal/batch-courses/${batchCourseId}/students`),
getReviewQueueCourses: () => api.get(`/faculty/portal/review-queue/courses`),
getReviewQueueStudents: (batchCourseId, search) =>
  api.get(`/faculty/portal/review-queue/batch-courses/${batchCourseId}/students`, { params: { search } }),
  getAttemptDetail: (attemptId) =>
    api.get(`/faculty/portal/attempts/${attemptId}`),
  gradeAnswer: (attemptId, answerId, payload) =>
    api.put(
      `/faculty/portal/attempts/${attemptId}/answers/${answerId}/grade`,
      payload,
    ),
  approveAttempt: (attemptId, approve) =>
    api.post(`/faculty/portal/attempts/${attemptId}/approve`, { approve }),
  overrideUnlock: (attemptId, override_) =>
    api.post(`/faculty/portal/attempts/${attemptId}/override-unlock`, {
      override: override_,
    }),

    getStudentFullReport: (studentId, batchCourseId) =>
  api.get(`/faculty/portal/students/${studentId}/full-report`, { params: { batchCourseId } }),

    getStudentCourseOverview: (studentId, batchCourseId) =>
  api.get(`/faculty/portal/students/${studentId}/course-overview`, { params: { batchCourseId } }),
getModuleDetailForStudent: (studentId, moduleId) =>
  api.get(`/faculty/portal/students/${studentId}/modules/${moduleId}`),
getAssessmentAttemptsForStudent: (studentId, assessmentId) =>
  api.get(`/faculty/portal/students/${studentId}/assessments/${assessmentId}/attempts`),
};
