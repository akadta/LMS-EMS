import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Designing curriculum structure...",
  "Writing module descriptions...",
  "Building chapter outlines...",
  "Sourcing cover images...",
  "Assembling final assessments...",
  "Finalizing your course...",
];

export default function AiGenerationAnimationModal({ active }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    setStageIndex(0);
    const t = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 1800);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,20,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
      <style>{`
        @keyframes ai-pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 70% { transform: scale(1.4); opacity: 0; } 100% { opacity: 0; } }
        @keyframes ai-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes ai-gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 28px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "2px solid rgba(124,58,237,0.5)",
                animation: `ai-pulse-ring 2.2s ease-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute", inset: 18, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed)",
              backgroundSize: "200% 200%",
              animation: "ai-gradient-shift 3s ease infinite, ai-float 2.4s ease-in-out infinite",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 30px rgba(124,58,237,0.5)",
            }}
          >
            <Sparkles size={26} color="#fff" />
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Building your course
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", minHeight: 20 }}>
          {STAGES[stageIndex]}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 20 }}>
          {STAGES.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: i <= stageIndex ? "#a855f7" : "rgba(255,255,255,0.2)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}