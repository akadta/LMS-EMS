import { useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";

export default function ModeSwitchModal({
  assessment,
  questionCount,
  onClose,
  onSwitched,
}) {
  const targetMode = assessment.mode === "instant" ? "review" : "instant";
  const [keepCompatible, setKeepCompatible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const incompatibleWarning =
    targetMode === "instant"
      ? "Switching to Instant Result mode does not support Short Answer or Long Answer questions. Those questions will be permanently removed if you choose to transfer."
      : null;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await assessmentApi.switchMode(assessment.id, {
        mode: targetMode,
        keepCompatible,
      });
      onSwitched(res.data.data);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to switch mode.");
      setSaving(false);
    }
  };

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
          width: 440,
          padding: 22,
          position: "relative",
        }}
      >
        {!saving && (
          <button
            onClick={onClose}
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

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(var(--accent-rgb),0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowRightLeft size={17} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              Switch to{" "}
              {targetMode === "instant"
                ? "Instant Result"
                : "Result After Review"}
              ?
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 5,
                lineHeight: 1.5,
              }}
            >
              This assessment currently has <strong>{questionCount}</strong>{" "}
              question(s) in{" "}
              {assessment.mode === "instant" ? "Instant Result" : "Review"}{" "}
              mode.
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: 13,
              padding: "9px 12px",
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <label style={optionCardStyle(keepCompatible)}>
            <input
              type="radio"
              checked={keepCompatible}
              onChange={() => setKeepCompatible(true)}
              style={{ marginTop: 2, accentColor: "var(--accent)" }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                Transfer compatible questions
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 3,
                  lineHeight: 1.5,
                }}
              >
                Keep all option-based questions as-is.
                {incompatibleWarning && (
                  <span style={{ color: "#dc2626" }}>
                    {" "}
                    {incompatibleWarning}
                  </span>
                )}
              </div>
            </div>
          </label>

          <label style={optionCardStyle(!keepCompatible)}>
            <input
              type="radio"
              checked={!keepCompatible}
              onChange={() => setKeepCompatible(false)}
              style={{ marginTop: 2, accentColor: "#dc2626" }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                Start fresh
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 3,
                  lineHeight: 1.5,
                }}
              >
                Permanently delete all {questionCount} existing question(s) and
                switch to a clean{" "}
                {targetMode === "instant" ? "Instant Result" : "Review"}{" "}
                assessment.
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: !keepCompatible ? "#dc2626" : "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? "Switching..." : "Confirm Switch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function optionCardStyle(active) {
  return {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    border: active ? "1.5px solid var(--accent)" : "1px solid #e5e7eb",
    background: active ? "rgba(var(--accent-rgb),0.05)" : "#fff",
  };
}
