import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
  extra,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,20,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 420,
          padding: 22,
          position: "relative",
        }}
      >
        {!loading && (
          <button
            onClick={onCancel}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              border: "none",
              background: "#f3f4f6",
              borderRadius: 8,
              width: 26,
              height: 26,
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: danger ? "#fef2f2" : "rgba(var(--accent-rgb),0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle
              size={18}
              color={danger ? "#dc2626" : "var(--accent)"}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              {title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 5,
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          </div>
        </div>

        {extra}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: danger ? "#dc2626" : "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
