import api from "./Axios";

export const aiCourseBuilderApi = {
  createCompleteCourse: (payload) => api.post(`/lms/ai-course-builder/create-complete-course`, payload, { timeout: 120000 }),
  addModules: (payload) => api.post(`/lms/ai-course-builder/add-modules`, payload, { timeout: 120000 }),
  addChapters: (payload) => api.post(`/lms/ai-course-builder/add-chapters`, payload, { timeout: 120000 }),
};