import api from "./Axios";

export const proctoringApi = {
  getCourseOverview: (courseId) => api.get(`/lms/proctoring/courses/${courseId}/overview`),
  applyCourseProctoring: (courseId, payload) => api.put(`/lms/proctoring/courses/${courseId}/apply`, payload),
  getSettingsForStudent: (assessmentId) => api.get(`/lms/proctoring/assessments/${assessmentId}/settings`),
  logEvent: (attemptId, payload) => api.post(`/lms/proctoring/attempts/${attemptId}/event`, payload),
  uploadSnapshot: (attemptId, formData) => api.post(`/lms/proctoring/attempts/${attemptId}/snapshot`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadVideoClip: (attemptId, formData) => api.post(`/lms/proctoring/attempts/${attemptId}/video-clip`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getEvents: (attemptId) => api.get(`/lms/proctoring/attempts/${attemptId}/events`),
};