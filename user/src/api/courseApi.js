import api from "./Axios";

export const courseApi = {
  listCategories: (search = "") =>
    api.get(`/lms/course-categories`, { params: { search } }),
  createCategory: (name) => api.post(`/lms/course-categories`, { name }),
  updateCategory: (id, name) =>
    api.put(`/lms/course-categories/${id}`, { name }),

  listCourses: () => api.get(`/lms/courses`),
  getCourse: (id) => api.get(`/lms/courses/${id}`),
  createCourse: (formData) =>
    api.post(`/lms/courses`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateCourse: (id, formData) =>
    api.put(`/lms/courses/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteCourse: (id) => api.delete(`/lms/courses/${id}`),

  listModules: (courseId) => api.get(`/lms/modules`, { params: { courseId } }),
  getModule: (id) => api.get(`/lms/modules/${id}`),
  createModule: (formData) =>
    api.post(`/lms/modules`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateModule: (id, formData) =>
    api.put(`/lms/modules/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteModule: (id) => api.delete(`/lms/modules/${id}`),

  updateModuleGating: (id, payload) =>
    api.put(`/lms/modules/${id}/gating`, payload),

  listChapters: (moduleId) =>
    api.get(`/lms/chapters`, { params: { moduleId } }),
  getChapter: (id) => api.get(`/lms/chapters/${id}`),
  createChapter: (formData, onUploadProgress) =>
    api.post(`/lms/chapters`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  updateChapter: (id, formData, onUploadProgress) =>
    api.put(`/lms/chapters/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  deleteChapter: (id) => api.delete(`/lms/chapters/${id}`),

  updateChapterGating: (id, payload) =>
    api.put(`/lms/chapters/${id}/gating`, payload),

  getAssessment: (ownerType, ownerId) =>
    api.get(`/lms/assessments`, { params: { ownerType, ownerId } }),
  saveAssessmentSettings: (payload) => api.post(`/lms/assessments`, payload),
  toggleAssessmentActive: (id, isActive) =>
    api.patch(`/lms/assessments/${id}/active`, { isActive }),

  listAssessmentQuestions: (assessmentId) =>
    api.get(`/lms/assessments/${assessmentId}/questions`),
  createAssessmentQuestion: (assessmentId, formData) =>
    api.post(`/lms/assessments/${assessmentId}/questions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateAssessmentQuestion: (assessmentId, id, formData) =>
    api.put(`/lms/assessments/${assessmentId}/questions/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteAssessmentQuestion: (assessmentId, id) =>
    api.delete(`/lms/assessments/${assessmentId}/questions/${id}`),
  reorderAssessmentQuestions: (assessmentId, questionIds) =>
    api.post(`/lms/assessments/${assessmentId}/questions/reorder`, {
      questionIds,
    }),

  uploadAssessmentMedia: (
    ownerType,
    ownerId,
    mediaType,
    file,
    onUploadProgress,
  ) => {
    const fd = new FormData();
    fd.append("ownerType", ownerType);
    fd.append("ownerId", ownerId);
    fd.append("mediaType", mediaType);
    fd.append("file", file);
    return api.post(`/lms/assessment-media`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
  deleteAssessmentMedia: (id) => api.delete(`/lms/assessment-media/${id}`),
};
