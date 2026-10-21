const API_ORIGIN = (
  import.meta.env.VITE_BASE_URL ?? "http://localhost:5262/api"
).replace(/\/api\/?$/, "");

export function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
