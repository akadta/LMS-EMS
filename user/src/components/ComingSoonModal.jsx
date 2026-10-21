import { Sparkles, X } from "lucide-react";

export default function ComingSoonModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,20,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "28px 26px",
          width: 320,
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#9ca3af",
          }}
        >
          <X size={18} />
        </button>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            margin: "0 auto 14px",
            background: "rgba(var(--accent-rgb), 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={24} color="var(--accent)" />
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827" }}>
          Final Assessment
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          This feature is coming soon. We're working on it!
        </div>
      </div>
    </div>
  );
}
