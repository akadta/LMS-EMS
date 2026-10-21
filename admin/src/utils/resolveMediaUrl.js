import api from "../api/Axios";

const API_ORIGIN = (
  api.defaults.baseURL ?? "http://localhost:5262/api"
).replace(/\/api\/?$/, "");

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}
