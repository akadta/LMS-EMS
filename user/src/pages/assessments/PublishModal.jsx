import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import { inputStyle, submitBtnStyle } from "../courses/CreateCourse";

export default function PublishModal({ assessment, onClose, onPublished }) {
  const [passPercentage, setPassPercentage] = useState(
    assessment.passPercentage ?? 50,
  );
  const [isShuffle, setIsShuffle] = useState(assessment.isShuffle);
  const [questionsToShow, setQuestionsToShow] = useState(
    assessment.questionsToShow ?? "",
  );
  const [grades, setGrades] = useState(
    assessment.grades?.length
      ? assessment.grades
      : [
          { label: "A", minPercentage: 80, maxPercentage: 100 },
          { label: "B", minPercentage: 60, maxPercentage: 79 },
          { label: "C", minPercentage: 40, maxPercentage: 59 },
          { label: "D", minPercentage: 0, maxPercentage: 39 },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setGrade = (idx, key, val) =>
    setGrades((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, [key]: val } : g)),
    );

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await assessmentApi.publish(assessment.id, {
        passPercentage: Number(passPercentage),
        isShuffle,
        questionsToShow:
          questionsToShow === "" ? null : Number(questionsToShow),
        grades: grades
          .filter((g) => g.label.trim())
          .map((g) => ({
            label: g.label,
            minPercentage: Number(g.minPercentage),
            maxPercentage: Number(g.maxPercentage),
          })),
      });
      onPublished(res.data.data);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to publish.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
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
        style={{
          background: "#fff",
          borderRadius: 18,
          width: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            border: "none",
            background: "#f3f4f6",
            borderRadius: 8,
            width: 30,
            height: 30,
            cursor: "pointer",
          }}
        >
          <X size={15} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
          Publish Assessment
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>
          {assessment.questionCount} question(s) total
        </div>

        <form onSubmit={submit}>
          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 13,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <Field label="Pass Percentage">
            <input
              type="number"
              min="0"
              max="100"
              value={passPercentage}
              onChange={(e) => setPassPercentage(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Grade System">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grades.map((g, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    value={g.label}
                    onChange={(e) => setGrade(idx, "label", e.target.value)}
                    placeholder="Grade (e.g. A)"
                    style={{ ...inputStyle, flex: 1.2 }}
                  />
                  <input
                    type="number"
                    value={g.minPercentage}
                    onChange={(e) =>
                      setGrade(idx, "minPercentage", e.target.value)
                    }
                    placeholder="Min %"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="number"
                    value={g.maxPercentage}
                    onChange={(e) =>
                      setGrade(idx, "maxPercentage", e.target.value)
                    }
                    placeholder="Max %"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {grades.length > 1 && (
                    <Trash2
                      size={15}
                      style={{ cursor: "pointer", color: "#dc2626" }}
                      onClick={() =>
                        setGrades((prev) => prev.filter((_, i) => i !== idx))
                      }
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setGrades((prev) => [
                    ...prev,
                    { label: "", minPercentage: "", maxPercentage: "" },
                  ])
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  alignSelf: "flex-start",
                }}
              >
                <Plus size={13} /> Add grade band
              </button>
            </div>
          </Field>

          <Field label="">
            <Toggle
              label="Shuffle questions for each attempt"
              checked={isShuffle}
              onChange={setIsShuffle}
            />
          </Field>

          <Field
            label={`Number of Questions to Show (of ${assessment.questionCount} total, blank = show all)`}
          >
            <input
              type="number"
              min="1"
              max={assessment.questionCount}
              value={questionsToShow}
              onChange={(e) => setQuestionsToShow(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <button type="submit" disabled={saving} style={submitBtnStyle}>
            {saving ? "Publishing..." : "Publish Assessment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "#374151",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
      />
      {label}
    </label>
  );
}
