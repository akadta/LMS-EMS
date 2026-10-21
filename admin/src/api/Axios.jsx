import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL ?? "http://localhost:5262/api",
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("central_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthUrl = url === "/login" || url.endsWith("/login");

    if (status === 401 && !isAuthUrl) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default api;
