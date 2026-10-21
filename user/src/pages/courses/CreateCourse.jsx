import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { courseApi } from "../../api/courseApi";
import MultiImageUpload from "../../components/MultiImageUpload";
import CategoryPicker from "../../components/CategoryPicker";
import FacultyGroupsField from "../../components/courses/FacultyGroupsField";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];
const DURATION_UNITS = ["day", "week", "month", "year"];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationValue: "",
    durationUnit: "month",
    difficultyLevel: "beginner",
    isFinalAssessment: false,
    isDraft: true,
  });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [facultyGroups, setFacultyGroups] = useState([]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Course name is required.");
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("Name", form.name);
      fd.append("Description", form.description || "");
      if (form.durationValue) fd.append("DurationValue", form.durationValue);
      fd.append("DurationUnit", form.durationUnit);
      fd.append("DifficultyLevel", form.difficultyLevel);
      fd.append("IsFinalAssessment", form.isFinalAssessment);
      fd.append("IsDraft", form.isDraft);
      categories.forEach((c) => fd.append("CategoryIds", c.id));
      images.forEach((f) => fd.append("Images", f));

      const groupsPayload = facultyGroups
        .filter((g) => g.label.trim())
        .map((g) => ({
          label: g.label,
          facultyIds: g.faculties.map((f) => f.id),
        }));
      fd.append("FacultyGroupsJson", JSON.stringify(groupsPayload));

      const res = await courseApi.createCourse(fd);
      navigate(`/courses/${res.data.data.id}/modules`);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to create course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <button
        onClick={() => navigate("/courses")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 14,
          padding: 0,
        }}
      >
        <ArrowLeft size={15} /> Back to courses
      </button>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 20,
        }}
      >
        Create Course
      </div>

      <form
        onSubmit={submit}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #f0f0f0",
        }}
      >
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

        <Field label="Course Name">
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Advanced React Development"
            style={inputStyle}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={4}
            placeholder="What will learners gain from this course?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="Duration">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                min="1"
                value={form.durationValue}
                onChange={set("durationValue")}
                placeholder="e.g. 3"
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

        <Field label="Categories">
          <CategoryPicker selected={categories} onChange={setCategories} />
        </Field>

        <Field label="Assign Faculty (optional)">
          <FacultyGroupsField
            groups={facultyGroups}
            onChange={setFacultyGroups}
          />
        </Field>

        <Field label="Course Images">
          <MultiImageUpload
            existing={[]}
            newFiles={images}
            onAddFiles={(files) => setImages((prev) => [...prev, ...files])}
            onRemoveExisting={() => {}}
            onRemoveNewFile={(idx) =>
              setImages((prev) => prev.filter((_, i) => i !== idx))
            }
          />
        </Field>

        <div
          style={{ display: "flex", gap: 24, marginTop: 6, marginBottom: 22 }}
        >
          <Toggle
            label="Includes Final Assessment"
            checked={form.isFinalAssessment}
            onChange={(v) => setForm((f) => ({ ...f, isFinalAssessment: v }))}
          />
          <Toggle
            label="Save as Draft"
            checked={form.isDraft}
            onChange={(v) => setForm((f) => ({ ...f, isDraft: v }))}
          />
        </div>

        <button type="submit" disabled={saving} style={submitBtnStyle}>
          {saving ? "Creating..." : "Create & Continue to Modules"}
        </button>
      </form>
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

export const inputStyle = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  color: "#111827",
};

export const submitBtnStyle = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 20px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};
