import { useState, useEffect, useRef } from "react";
import { Plus, X, Search, ChevronDown, User } from "lucide-react";
import { facultyApi } from "../../api/facultyApi";
import { inputStyle } from "../../pages/courses/CreateCourse";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function FacultyGroupsField({ groups, onChange }) {
  const addGroup = () => onChange([...groups, { label: "", faculties: [] }]);
  const updateLabel = (idx, label) =>
    onChange(groups.map((g, i) => (i === idx ? { ...g, label } : g)));
  const removeGroup = (idx) => onChange(groups.filter((_, i) => i !== idx));
  const setFaculties = (idx, faculties) =>
    onChange(groups.map((g, i) => (i === idx ? { ...g, faculties } : g)));

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map((g, idx) => (
          <FacultyGroupCard
            key={idx}
            group={g}
            onLabelChange={(label) => updateLabel(idx, label)}
            onFacultiesChange={(faculties) => setFaculties(idx, faculties)}
            onRemove={() => removeGroup(idx)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addGroup}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: groups.length ? 12 : 0,
          border: "1px dashed #d1d5db",
          borderRadius: 10,
          padding: "9px 14px",
          fontSize: 12.5,
          fontWeight: 600,
          color: "#374151",
          background: "none",
          cursor: "pointer",
        }}
      >
        <Plus size={14} /> Add Position / Faculty Group
      </button>
    </div>
  );
}

function FacultyGroupCard({
  group,
  onLabelChange,
  onFacultiesChange,
  onRemove,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const removeFaculty = (facultyId) =>
    onFacultiesChange(group.faculties.filter((f) => f.id !== facultyId));

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={group.label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g. Technical Associates"
          style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
        />
        <button
          type="button"
          onClick={onRemove}
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            border: "1px solid #fecaca",
            background: "#fff",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={15} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: group.faculties.length ? 10 : 0,
        }}
      >
        {group.faculties.map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f3f4f6",
              borderRadius: 999,
              padding: "4px 10px 4px 4px",
            }}
          >
            {f.photoUrl ? (
              <img
                src={f.photoUrl}
                alt=""
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {f.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              {f.name}
            </span>
            {f.subRoleName && (
              <span style={{ fontSize: 10.5, color: "#9ca3af" }}>
                · {f.subRoleName}
              </span>
            )}
            <X
              size={12}
              style={{ cursor: "pointer", color: "#9ca3af" }}
              onClick={() => removeFaculty(f.id)}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowPicker(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--accent)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Plus size={12} /> Assign Faculty
      </button>

      {showPicker && (
        <FacultyPickerModal
          selected={group.faculties}
          onClose={() => setShowPicker(false)}
          onConfirm={(faculties) => {
            onFacultiesChange(faculties);
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}

function FacultyPickerModal({ selected, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [subRoleId, setSubRoleId] = useState("");
  const [subRoles, setSubRoles] = useState([]);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(selected);
  const debounceRef = useRef(null);

  useEffect(() => {
    facultyApi.listSubRoles().then((res) => setSubRoles(res.data.data || []));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      facultyApi.search(search, subRoleId || null).then((res) => {
        const withResolvedUrls = (res.data.data || []).map((f) => ({
          ...f,
          photoUrl: resolveImageUrl(f.photoUrl),
        }));
        setResults(withResolvedUrls);
      });
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [search, subRoleId]);

  const toggle = (f) => {
    const exists = picked.some((p) => p.id === f.id);
    setPicked(
      exists
        ? picked.filter((p) => p.id !== f.id)
        : [
            ...picked,
            {
              id: f.id,
              name: f.name,
              photoUrl: f.photoUrl,
              subRoleName: f.subRoleName,
            },
          ],
    );
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
        zIndex: 250,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 460,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>Assign Faculty</div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "#f3f4f6",
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #e5e7eb",
                borderRadius: 9,
                padding: "7px 10px",
              }}
            >
              <Search size={13} color="#9ca3af" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search faculty..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  flex: 1,
                }}
              />
            </div>
            <select
              value={subRoleId}
              onChange={(e) => setSubRoleId(e.target.value)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 9,
                padding: "0 10px",
                fontSize: 12.5,
                color: "#374151",
              }}
            >
              <option value="">All Roles</option>
              {subRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {results.length === 0 && (
            <div
              style={{
                padding: "20px 10px",
                textAlign: "center",
                fontSize: 12.5,
                color: "#9ca3af",
              }}
            >
              No faculty found.
            </div>
          )}
          {results.map((f) => {
            const isPicked = picked.some((p) => p.id === f.id);
            return (
              <div
                key={f.id}
                onClick={() => toggle(f)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: isPicked
                    ? "rgba(var(--accent-rgb),0.08)"
                    : "transparent",
                }}
              >
                {f.photoUrl ? (
                  <img
                    src={f.photoUrl}
                    alt=""
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={15} color="#9ca3af" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                  >
                    {f.name}
                  </div>
                  {f.subRoleName && (
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {f.subRoleName}
                    </div>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={isPicked}
                  readOnly
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: "var(--accent)",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid #f0f0f0" }}>
          <button
            onClick={() => onConfirm(picked)}
            style={{
              width: "100%",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Confirm ({picked.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
