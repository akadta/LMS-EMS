import { ArrowLeft, RotateCcw } from "lucide-react";

export default function DemoHeader({ title, subtitle, onBack, onReset }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <button onClick={onBack} style={backBtnStyle}>
          <ArrowLeft size={15} /> Back
        </button>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            marginTop: 8,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {onReset && (
        <button onClick={onReset} style={resetBtnStyle}>
          <RotateCcw size={13} /> Reset Progress
        </button>
      )}
    </div>
  );
}

const backBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};
const resetBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#fff",
  border: "1px solid #e5e7eb",
  color: "#374151",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
