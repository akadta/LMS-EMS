import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { courseApi } from "../../api/courseApi";
import { inputStyle, submitBtnStyle } from "./CreateCourse";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];
const DURATION_UNITS = ["day", "week", "month", "year"];

export default function ModuleFormModal({
  courseId,
  moduleId,
  onClose,
  onSaved,
}) {
  const isEdit = !!moduleId;
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficultyLevel: "beginner",
    durationValue: "",
    durationUnit: "week",
    isLock: false,
    isFinalAssessment: false,
    isDraft: true,
  });
  const [image, setImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [remainingDays, setRemainingDays] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      courseApi.getModule(moduleId).then((res) => {
        const d = res.data.data;
        setForm({
          name: d.name,
          description: d.description || "",
          difficultyLevel: d.difficultyLevel,
          durationValue: d.durationValue || "",
          durationUnit: d.durationUnit || "week",
          isLock: d.isLock,
          isFinalAssessment: d.isFinalAssessment,
          isDraft: d.isDraft,
        });
        setExistingImageUrl(resolveImageUrl(d.imageUrl));
        setRemainingDays(d.remainingCourseDurationDays);
      });
    }
  }, [moduleId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Module name is required.");
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("CourseId", courseId);
      fd.append("Name", form.name);
      fd.append("Description", form.description || "");
      fd.append("DifficultyLevel", form.difficultyLevel);
      if (form.durationValue) fd.append("DurationValue", form.durationValue);
      fd.append("DurationUnit", form.durationUnit);
      fd.append("IsLock", form.isLock);
      fd.append("IsFinalAssessment", form.isFinalAssessment);
      fd.append("IsDraft", form.isDraft);

      if (image) fd.append("Image", image);
      if (removeImage) fd.append("RemoveImage", true);

      if (isEdit) await courseApi.updateModule(moduleId, fd);
      else await courseApi.createModule(fd);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to save module.");
    } finally {
      setSaving(false);
    }
  };

  return (
    // click-outside intentionally does nothing — closes only via X button
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
          {isEdit ? "Edit Module" : "Add Module"}
        </div>
        {remainingDays != null && remainingDays > 0 && (
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
            Remaining course duration: {remainingDays} days
          </div>
        )}
        {remainingDays == null && <div style={{ marginBottom: 16 }} />}

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

          <Field label="Module Name">
            <input
              value={form.name}
              onChange={set("name")}
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

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="Duration (optional)">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  min="1"
                  value={form.durationValue}
                  onChange={set("durationValue")}
                  style={inputStyle}
                />
                <select
                  value={form.durationUnit}
                  onChange={set("durationUnit")}
                  style={inputStyle}
                >
                  {DURATION_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}s
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="Difficulty Level">
              <select
                value={form.difficultyLevel}
                onChange={set("difficultyLevel")}
                style={inputStyle}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Module Image (optional)">
            {(existingImageUrl && !removeImage) || image ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={image ? URL.createObjectURL(image) : existingImageUrl}
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    objectFit: "cover",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setRemoveImage(true);
                  }}
                  style={{
                    fontSize: 12.5,
                    color: "#dc2626",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setImage(e.target.files?.[0] || null);
                  setRemoveImage(false);
                }}
                style={inputStyle}
              />
            )}
          </Field>

          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 6,
              marginBottom: 22,
              flexWrap: "wrap",
            }}
          >
            <Toggle
              label="Lock (for future release)"
              checked={form.isLock}
              onChange={(v) => setForm((f) => ({ ...f, isLock: v }))}
            />
            <Toggle
              label="Final Assessment"
              checked={form.isFinalAssessment}
              onChange={(v) => setForm((f) => ({ ...f, isFinalAssessment: v }))}
            />
            <Toggle
              label="Draft (hidden from students)"
              checked={form.isDraft}
              onChange={(v) => setForm((f) => ({ ...f, isDraft: v }))}
            />
          </div>

          <button type="submit" disabled={saving} style={submitBtnStyle}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Module"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
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
