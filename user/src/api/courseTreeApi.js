import api from "./Axios";

export const courseTreeApi = {
  getTree: (courseId) => api.get(`/lms/course-tree/${courseId}`),
  publishAll: (courseId) => api.post(`/lms/course-tree/${courseId}/publish-all`),
};