import api from "./Axios";

export const batchApi = {
  list: () => api.get(`/lms/batches`),
  get: (id) => api.get(`/lms/batches/${id}`),
  create: (payload) => api.post(`/lms/batches`, payload),
  update: (id, payload) => api.put(`/lms/batches/${id}`, payload),
  toggleActive: (id) => api.put(`/lms/batches/${id}/toggle-active`),
  delete: (id) => api.delete(`/lms/batches/${id}`),

  getRoster: (id, params) => api.get(`/lms/batches/${id}/roster`, { params }),
  searchAvailableStudents: (id, params) =>
    api.get(`/lms/batches/${id}/roster/search-available`, { params }),
  addStudentsToRoster: (id, studentIds) =>
    api.post(`/lms/batches/${id}/roster`, { studentIds }),
  addAllMatchingToRoster: (id, search) =>
    api.post(`/lms/batches/${id}/roster/add-by-filter`, { search }),
  removeFromRoster: (id, studentId) =>
    api.delete(`/lms/batches/${id}/roster/${studentId}`),

  getBatchCourses: (id) => api.get(`/lms/batches/${id}/courses`),
  getAvailableCourses: (id, search) =>
    api.get(`/lms/batches/${id}/available-courses`, { params: { search } }),
  addCourseToBatch: (id, courseId) =>
    api.post(`/lms/batches/${id}/courses`, { courseId }),
  removeCourseFromBatch: (id, batchCourseId) =>
    api.delete(`/lms/batches/${id}/courses/${batchCourseId}`),
};

export const batchCourseAllocationApi = {
  getInfo: (batchCourseId) => api.get(`/lms/batch-courses/${batchCourseId}`),
  searchRoster: (batchCourseId, params) =>
    api.get(`/lms/batch-courses/${batchCourseId}/roster`, { params }),
  allocate: (batchCourseId, studentIds) =>
    api.post(`/lms/batch-courses/${batchCourseId}/allocate`, { studentIds }),
  allocateAllMatching: (batchCourseId, search) =>
    api.post(`/lms/batch-courses/${batchCourseId}/allocate-all-matching`, {
      search,
    }),
  deallocate: (batchCourseId, studentIds) =>
    api.post(`/lms/batch-courses/${batchCourseId}/deallocate`, { studentIds }),
};
