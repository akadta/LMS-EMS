export function formatLabel(index, format) {
  if (format === "numeric") return `${index + 1}`;
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(97 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return format === "alpha_upper" ? label.toUpperCase() : label;
}

export function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
