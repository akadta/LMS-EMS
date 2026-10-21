import { useState } from "react";
import { X } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import { inputStyle, submitBtnStyle } from "../../pages/courses/CreateCourse";

const TIMER_UNITS = ["seconds", "minutes"];
const FORMATS = [
  { value: "numeric", label: "1, 2, 3..." },
  { value: "alpha_lower", label: "a, b, c..." },
  { value: "alpha_upper", label: "A, B, C..." },
];

export default function AssessmentSetupModal({
  entityType,
  entityId,
  existing,
  onClose,
  onSaved,
}) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name: existing?.name || "",
    description: existing?.description || "",
    mode: existing?.mode || "instant",
    isTimer: existing?.isTimer || false,
    timerScope: existing?.timerScope || "per_question",
    timerValue: existing?.timerValue || "",
    timerUnit: existing?.timerUnit || "minutes",
    questionFormat: existing?.questionFormat || "numeric",
    optionFormat: existing?.optionFormat || "alpha_lower",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Assessment name is required.");
    setSaving(true);
    setError("");
    try {
      const payload = {
        entityType,
        entityId,
        name: form.name,
        description: form.description,
        mode: form.mode,
        isTimer: form.isTimer,
        timerScope: form.isTimer ? form.timerScope : null,
        timerValue: form.isTimer ? Number(form.timerValue) || null : null,
        timerUnit: form.isTimer ? form.timerUnit : null,
        questionFormat: form.questionFormat,
        optionFormat: form.optionFormat,
      };
      const res = isEdit
        ? await assessmentApi.updateSettings(existing.id, payload)
        : await assessmentApi.create(payload);
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to save assessment.");
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
          width: 560,
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
          {isEdit ? "Edit Assessment Settings" : "Set Up Assessment"}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>
          {isEdit
            ? "To change the mode, use the mode switch on the builder page."
            : "You'll add questions on the next page."}
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

          <Field label="Assessment Name">
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Module 1 Final Test"
              style={inputStyle}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          {!isEdit && (
            <Field label="Result Mode">
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mode: "instant" }))}
                  style={pillBtn(form.mode === "instant")}
                >
                  Instant Result
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mode: "review" }))}
                  style={pillBtn(form.mode === "review")}
                >
                  Result After Review
                </button>
              </div>
            </Field>
          )}

          <Field label="">
            <Toggle
              label="Enable Timer"
              checked={form.isTimer}
              onChange={(v) => setForm((f) => ({ ...f, isTimer: v }))}
            />
          </Field>

          {form.isTimer && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <select
                value={form.timerScope}
                onChange={set("timerScope")}
                style={inputStyle}
              >
                <option value="per_question">Per Question</option>
                <option value="per_exam">Per Exam</option>
              </select>
              <input
                type="number"
                min="1"
                placeholder="Duration"
                value={form.timerValue}
                onChange={set("timerValue")}
                style={inputStyle}
              />
              <select
                value={form.timerUnit}
                onChange={set("timerUnit")}
                style={inputStyle}
              >
                {TIMER_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="Question Numbering">
              <select
                value={form.questionFormat}
                onChange={set("questionFormat")}
                style={inputStyle}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Option Lettering">
              <select
                value={form.optionFormat}
                onChange={set("optionFormat")}
                style={inputStyle}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <button type="submit" disabled={saving} style={submitBtnStyle}>
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Settings"
                : "Create & Add Questions"}
          </button>
        </form>
      </div>
    </div>
  );
}

function pillBtn(active) {
  return {
    flex: 1,
    padding: "9px 10px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    border: active ? "1.5px solid var(--accent)" : "1px solid #e5e7eb",
    background: active ? "rgba(var(--accent-rgb),0.08)" : "#fff",
    color: active ? "var(--accent)" : "#374151",
  };
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
