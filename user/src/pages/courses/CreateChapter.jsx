import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Plus,
  Play,
  CheckCircle2,
} from "lucide-react";
import { courseApi } from "../../api/courseApi";
import { inputStyle, submitBtnStyle } from "./CreateCourse";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateChapter() {
  const { courseId, moduleId, chapterId } = useParams();
  const isEdit = !!chapterId;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    isFinalAssessment: false,
    isDraft: true,
  });
  const [existingMedia, setExistingMedia] = useState([]); // [{id, mediaType, url, caption}]
  const [keepMediaIds, setKeepMediaIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [newDocs, setNewDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null); // {type, src}

  useEffect(() => {
    if (isEdit) {
      courseApi.getChapter(chapterId).then((res) => {
        const d = res.data.data;
        setForm({
          name: d.name,
          description: d.description || "",
          isFinalAssessment: d.isFinalAssessment,
          isDraft: d.isDraft,
        });
        const media = d.media.map((m) => ({
          ...m,
          url: resolveImageUrl(m.url),
        }));
        setExistingMedia(media);
        setKeepMediaIds(media.map((m) => m.id));
      });
    }
  }, [chapterId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const totalNewFilesSize =
    newImages.reduce((s, f) => s + f.size, 0) +
    newVideos.reduce((s, f) => s + f.size, 0) +
    newDocs.reduce((s, f) => s + f.size, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Chapter name is required.");
    setSaving(true);
    setUploadDone(false);
    setUploadProgress(0);
    setError("");
    try {
      const fd = new FormData();
      fd.append("ModuleId", moduleId);
      fd.append("Name", form.name);
      fd.append("Description", form.description || "");
      fd.append("IsFinalAssessment", form.isFinalAssessment);
      fd.append("IsDraft", form.isDraft);

      keepMediaIds.forEach((id) => fd.append("KeepMediaIds", id));
      newImages.forEach((f) => fd.append("Images", f));
      newVideos.forEach((f) => fd.append("Videos", f));
      newDocs.forEach((f) => fd.append("Documents", f));

      const onUploadProgress = (evt) => {
        if (!evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setUploadProgress(pct);
        if (pct >= 100) setUploadDone(true);
      };

      if (isEdit)
        await courseApi.updateChapter(chapterId, fd, onUploadProgress);
      else await courseApi.createChapter(fd, onUploadProgress);

      navigate(`/courses/${courseId}/modules/${moduleId}/chapters`);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to save chapter.");
      setSaving(false);
      setUploadProgress(0);
      setUploadDone(false);
    }
  };

  const visibleExisting = existingMedia.filter((m) =>
    keepMediaIds.includes(m.id),
  );

  const totalMediaCount =
    visibleExisting.length +
    newImages.length +
    newVideos.length +
    newDocs.length;

  return (
    <div style={{ maxWidth: 780 }}>
      <style>{`
        @keyframes lms-spin { to { transform: rotate(360deg); } }
        @keyframes lms-progress-stripes { 0% { background-position: 0 0; } 100% { background-position: 40px 0; } }
      `}</style>

      <button
        onClick={() =>
          navigate(`/courses/${courseId}/modules/${moduleId}/chapters`)
        }
        style={backBtnStyle}
        disabled={saving}
      >
        <ArrowLeft size={15} /> Back to chapters
      </button>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 20,
        }}
      >
        {isEdit ? "Edit Chapter" : "Create Chapter"}
      </div>

      <form
        onSubmit={submit}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #f0f0f0",
          position: "relative",
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

        <fieldset
          disabled={saving}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
          <Field label="Chapter Name">
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Introduction to Hooks"
              style={inputStyle}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field
            label={`Chapter Content (images, videos, documents) ${totalMediaCount ? `· ${totalMediaCount} item(s)` : ""}`}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <MediaUploadButton
                icon={ImageIcon}
                label="Add Images"
                accept="image/*"
                multiple
                onFiles={(f) => setNewImages((p) => [...p, ...f])}
              />
              <MediaUploadButton
                icon={Video}
                label="Add Videos"
                accept="video/*"
                multiple
                onFiles={(f) => setNewVideos((p) => [...p, ...f])}
              />
              <MediaUploadButton
                icon={FileText}
                label="Add Documents"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                multiple
                onFiles={(f) => setNewDocs((p) => [...p, ...f])}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {visibleExisting.map((m) => (
                <MediaCard
                  key={`e-${m.id}`}
                  type={m.mediaType}
                  name={m.url.split("/").pop()}
                  src={m.url}
                  saved
                  onRemove={() =>
                    setKeepMediaIds((p) => p.filter((id) => id !== m.id))
                  }
                  onExpand={() =>
                    setLightbox({ type: m.mediaType, src: m.url })
                  }
                />
              ))}
              {newImages.map((f, i) => (
                <MediaCard
                  key={`ni-${i}`}
                  type="image"
                  name={f.name}
                  size={f.size}
                  src={URL.createObjectURL(f)}
                  onRemove={() =>
                    setNewImages((p) => p.filter((_, idx) => idx !== i))
                  }
                  onExpand={() =>
                    setLightbox({ type: "image", src: URL.createObjectURL(f) })
                  }
                />
              ))}
              {newVideos.map((f, i) => (
                <MediaCard
                  key={`nv-${i}`}
                  type="video"
                  name={f.name}
                  size={f.size}
                  src={URL.createObjectURL(f)}
                  onRemove={() =>
                    setNewVideos((p) => p.filter((_, idx) => idx !== i))
                  }
                  onExpand={() =>
                    setLightbox({ type: "video", src: URL.createObjectURL(f) })
                  }
                />
              ))}
              {newDocs.map((f, i) => (
                <MediaCard
                  key={`nd-${i}`}
                  type="document"
                  name={f.name}
                  size={f.size}
                  onRemove={() =>
                    setNewDocs((p) => p.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>
            {totalMediaCount === 0 && (
              <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 4 }}>
                No media added yet.
              </div>
            )}
          </Field>

          <div style={{ marginTop: 6, marginBottom: 22 }}>
            <Toggle
              label="Final Assessment for this chapter"
              checked={form.isFinalAssessment}
              onChange={(v) => setForm((f) => ({ ...f, isFinalAssessment: v }))}
            />
            <div style={{ height: 10 }} />
            <Toggle
              label="Draft (hidden from students)"
              checked={form.isDraft}
              onChange={(v) => setForm((f) => ({ ...f, isDraft: v }))}
            />
          </div>
        </fieldset>

        {saving && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {uploadDone ? (
                  <>
                    <CheckCircle2 size={14} color="#16a34a" /> Finishing up...
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        border: "2px solid #e5e7eb",
                        borderTopColor: "var(--accent)",
                        display: "inline-block",
                        animation: "lms-spin 0.6s linear infinite",
                      }}
                    />
                    {totalNewFilesSize > 0
                      ? "Uploading media..."
                      : "Saving chapter..."}
                  </>
                )}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {uploadProgress}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#f0f0f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb),0.7))",
                  backgroundSize: "40px 40px",
                  backgroundImage: uploadDone
                    ? "none"
                    : "linear-gradient(45deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)",
                  animation: uploadDone
                    ? "none"
                    : "lms-progress-stripes 0.8s linear infinite",
                  transition: "width 0.15s ease",
                }}
              />
            </div>
            {totalNewFilesSize > 0 && (
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                {formatBytes(
                  Math.round((uploadProgress / 100) * totalNewFilesSize),
                )}{" "}
                of {formatBytes(totalNewFilesSize)}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            ...submitBtnStyle,
            opacity: saving ? 0.75 : 1,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving
            ? uploadDone
              ? "Finishing up..."
              : `Uploading ${uploadProgress}%`
            : isEdit
              ? "Save Changes"
              : "Create Chapter"}
        </button>
      </form>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
          {lightbox.type === "image" ? (
            <img
              src={lightbox.src}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                borderRadius: 10,
                objectFit: "contain",
              }}
            />
          ) : (
            <video
              src={lightbox.src}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 10 }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MediaUploadButton({ icon: Icon, label, accept, multiple, onFiles }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "1px dashed #d1d5db",
        borderRadius: 10,
        padding: "9px 14px",
        fontSize: 12.5,
        fontWeight: 600,
        color: "#374151",
        cursor: "pointer",
      }}
    >
      <Icon size={14} /> {label} <Plus size={12} />
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />
    </label>
  );
}

function MediaCard({ type, name, src, size, saved, onRemove, onExpand }) {
  const Icon =
    type === "image" ? ImageIcon : type === "video" ? Video : FileText;

  return (
    <div
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={onRemove}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        <X size={12} />
      </button>

      {(type === "image" || type === "video") && src ? (
        <div
          onClick={onExpand}
          style={{
            width: "100%",
            height: 110,
            background: "#000",
            position: "relative",
            cursor: onExpand ? "pointer" : "default",
          }}
        >
          {type === "image" ? (
            <img
              src={src}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <video
              src={src}
              preload="metadata"
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {type === "video" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Play
                  size={15}
                  color="#111827"
                  fill="#111827"
                  style={{ marginLeft: 2 }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: 110,
            background: "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={28} color="var(--accent)" />
        </div>
      )}

      <div style={{ padding: "8px 10px" }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#374151",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={name}
        >
          {name}
        </div>
        <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>
          {saved ? "Saved" : size ? formatBytes(size) : ""}
        </div>
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

const backBtnStyle = {
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
};
