import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { courseApi } from "../../api/courseApi";
import MultiImageUpload from "../../components/MultiImageUpload";
import CategoryPicker from "../../components/CategoryPicker";
import { inputStyle, submitBtnStyle } from "./CreateCourse";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import FacultyGroupsField from "../../components/courses/FacultyGroupsField";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];
const DURATION_UNITS = ["day", "week", "month", "year"];

export default function CourseFormModal({ courseId, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [keepImageIds, setKeepImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [facultyGroups, setFacultyGroups] = useState([]);

  useEffect(() => {
    courseApi.getCourse(courseId).then((res) => {
      const d = res.data.data;
      setForm({
        name: d.name,
        description: d.description || "",
        durationValue: d.durationValue || "",
        durationUnit: d.durationUnit || "month",
        difficultyLevel: d.difficultyLevel,
        isFinalAssessment: d.isFinalAssessment,
        isDraft: d.isDraft,
      });
      setCategories(d.categories);
      setFacultyGroups(
        (d.facultyGroups || []).map((g) => ({
          label: g.label,
          faculties: g.faculties.map((f) => ({
            id: f.facultyId,
            name: f.name,
            photoUrl: resolveImageUrl(f.photoUrl),
            subRoleName: f.subRoleName,
          })),
        })),
      );
      const imgs = d.imageUrls.map((url, i) => ({
        id: d.imageIds[i],
        url: resolveImageUrl(url),
      }));
      setExistingImages(imgs);
      setKeepImageIds(imgs.map((i) => i.id));
    });
  }, [courseId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
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
      keepImageIds.forEach((id) => fd.append("KeepImageIds", id));
      newImages.forEach((f) => fd.append("Images", f));

      const groupsPayload = facultyGroups
        .filter((g) => g.label.trim())
        .map((g) => ({
          label: g.label,
          facultyIds: g.faculties.map((f) => f.id),
        }));
      fd.append("FacultyGroupsJson", JSON.stringify(groupsPayload));

      await courseApi.updateCourse(courseId, fd);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to update course.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

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
          width: 640,
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
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>
          Edit Course
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

          <Field label="Course Name">
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
            <Field label="Duration">
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
              existing={existingImages.filter((i) =>
                keepImageIds.includes(i.id),
              )}
              newFiles={newImages}
              onRemoveExisting={(id) =>
                setKeepImageIds((prev) => prev.filter((x) => x !== id))
              }
              onAddFiles={(files) =>
                setNewImages((prev) => [...prev, ...files])
              }
              onRemoveNewFile={(idx) =>
                setNewImages((prev) => prev.filter((_, i) => i !== idx))
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
              label="Draft"
              checked={form.isDraft}
              onChange={(v) => setForm((f) => ({ ...f, isDraft: v }))}
            />
          </div>

          <button type="submit" disabled={saving} style={submitBtnStyle}>
            {saving ? "Saving..." : "Save Changes"}
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
