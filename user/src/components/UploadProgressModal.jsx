import { CheckCircle2 } from "lucide-react";

export default function UploadProgressModal({ progress, done, hasMedia }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,20,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 400,
        padding: 16,
      }}
    >
      <style>{`
        @keyframes lms-spin { to { transform: rotate(360deg); } }
        @keyframes lms-stripes { 0% { background-position: 0 0; } 100% { background-position: 40px 0; } }
      `}</style>
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          width: 340,
          padding: 26,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {done ? (
          <CheckCircle2
            size={40}
            color="#16a34a"
            style={{ margin: "0 auto 14px" }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              margin: "0 auto 14px",
              borderRadius: "50%",
              border: "3.5px solid #f0f0f0",
              borderTopColor: "var(--accent)",
              animation: "lms-spin 0.7s linear infinite",
            }}
          />
        )}
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          {done
            ? "Saved successfully"
            : hasMedia
              ? "Uploading media..."
              : "Saving question..."}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          {done ? "Wrapping up" : "Please keep this window open"}
        </div>
        <div
          style={{
            height: 9,
            borderRadius: 999,
            background: "#f0f0f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 999,
              background: done
                ? "#16a34a"
                : "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb),0.7))",
              backgroundSize: "40px 40px",
              backgroundImage: done
                ? "none"
                : "linear-gradient(45deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)",
              animation: done ? "none" : "lms-stripes 0.8s linear infinite",
              transition: "width 0.15s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
            marginTop: 8,
          }}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}
