import api from "./Axios";

export const facultyApi = {
  search: (query = "", subRoleId = null) =>
    api.get(`/lms/faculties/search`, { params: { query, subRoleId } }),
  listSubRoles: () => api.get(`/lms/faculties/sub-roles`),
};
