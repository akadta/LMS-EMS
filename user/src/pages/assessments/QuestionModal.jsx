import { useState } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import { inputStyle, submitBtnStyle } from "../courses/CreateCourse";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { formatLabel, formatBytes } from "../../utils/labelFormat";
import UploadProgressModal from "../../components/UploadProgressModal";

const TYPES = [
  { value: "mcq_single", label: "Single Correct" },
  { value: "mcq_multi", label: "Multiple Correct" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
];

export default function QuestionModal({
  assessment,
  question,
  onClose,
  onSaved,
}) {
  const isEdit = !!question;
  const allowShortLong = assessment.mode === "review";
  const [form, setForm] = useState({
    questionText: question?.questionText || "",
    questionType: question?.questionType || "mcq_single",
    markingMode: question?.markingMode || "per_question",

    mark: question?.mark ?? "",
  });
  const [options, setOptions] = useState(
    question?.options?.length
      ? question.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          mark: o.mark ?? "",
        }))
      : [
          { optionText: "", isCorrect: false, mark: "" },
          { optionText: "", isCorrect: false, mark: "" },
        ],
  );
  const [existingMedia, setExistingMedia] = useState(
    question?.media?.map((m) => ({ ...m, url: resolveImageUrl(m.url) })) || [],
  );
  const [keepMediaIds, setKeepMediaIds] = useState(
    question?.media?.map((m) => m.id) || [],
  );
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [newDocs, setNewDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);

  const isOptionType =
    form.questionType === "mcq_single" || form.questionType === "mcq_multi";
  const hasNewMedia = newImages.length + newVideos.length + newDocs.length > 0;

  const setOption = (idx, key, val) =>
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, [key]: val } : o)),
    );

  const toggleCorrect = (idx) => {
    if (form.questionType === "mcq_single") {
      setOptions((prev) =>
        prev.map((o, i) => ({ ...o, isCorrect: i === idx })),
      );
    } else {
      setOptions((prev) =>
        prev.map((o, i) => (i === idx ? { ...o, isCorrect: !o.isCorrect } : o)),
      );
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.questionText.trim())
      return setError("Question text is required.");
    if (isOptionType) {
      const filled = options.filter((o) => o.optionText.trim());
      if (filled.length < 2) return setError("Add at least 2 options.");
      if (!filled.some((o) => o.isCorrect))
        return setError("Mark at least one correct option.");
      if (
        form.markingMode === "per_option" &&
        filled.some((o) => o.isCorrect && o.mark === "")
      ) {
        return setError("Set a mark for every correct option.");
      }
    }
    setError("");
    setSaving(true);
    setProgress(0);
    setUploadDone(false);
    try {
      const fd = new FormData();
      fd.append("AssessmentId", assessment.id);
      fd.append("QuestionText", form.questionText);
      fd.append("QuestionType", form.questionType);
      fd.append("MarkingMode", form.markingMode);
      if (form.markingMode === "per_question" && form.mark !== "")
        fd.append("Mark", form.mark);
      if (isOptionType) {
        const cleanOptions = options
          .filter((o) => o.optionText.trim())
          .map((o) => ({
            id: o.id,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            mark: o.mark === "" ? null : Number(o.mark),
          }));
        fd.append("OptionsJson", JSON.stringify(cleanOptions));
      }
      keepMediaIds.forEach((id) => fd.append("KeepMediaIds", id));
      newImages.forEach((f) => fd.append("Images", f));
      newVideos.forEach((f) => fd.append("Videos", f));
      newDocs.forEach((f) => fd.append("Documents", f));

      const onUploadProgress = (evt) => {
        if (!evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setProgress(pct);
        if (pct >= 100) setUploadDone(true);
      };

      const res = isEdit
        ? await assessmentApi.updateQuestion(question.id, fd, onUploadProgress)
        : await assessmentApi.createQuestion(fd, onUploadProgress);

      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to save question.");
      setSaving(false);
      setProgress(0);
      setUploadDone(false);
    }
  };

  const visibleExisting = existingMedia.filter((m) =>
    keepMediaIds.includes(m.id),
  );

  return (
    <>
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
            width: 660,
            maxHeight: "92vh",
            overflowY: "auto",
            padding: 24,
            position: "relative",
          }}
        >
          {!saving && (
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
          )}
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>
            {isEdit ? "Edit Question" : "Add Question"}
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

            <fieldset
              disabled={saving}
              style={{ border: "none", padding: 0, margin: 0 }}
            >
              <Field label="Question Type">
              <select
  value={form.questionType}
  onChange={(e) =>
    setForm((f) => ({
      ...f,
      questionType: e.target.value,
markingMode: e.target.value === "mcq_multi" ? "per_option" : "per_question",    }))
  }
  style={inputStyle}
>
                  {TYPES.filter(
                    (t) => allowShortLong || t.value.startsWith("mcq"),
                  ).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {!allowShortLong && (
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                    Short/Long answer requires Review mode.
                  </div>
                )}
              </Field>

              <Field label="Question Text">
                <textarea
                  value={form.questionText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, questionText: e.target.value }))
                  }
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>

         {form.questionType === "mcq_multi" && (
  <Field label="Marking Type for this Question">
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={() =>
          setForm((f) => ({ ...f, markingMode: "per_question" }))
        }
        style={pillBtn(form.markingMode === "per_question")}
      >
        Mark per Question
      </button>
      <button
        type="button"
        onClick={() =>
          setForm((f) => ({ ...f, markingMode: "per_option" }))
        }
        style={pillBtn(form.markingMode === "per_option")}
      >
        Mark per Option
      </button>
    </div>
  </Field>
)}
              {form.markingMode === "per_question" && (
                <Field label="Mark for this question">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.mark}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mark: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </Field>
              )}

              <Field label="Attach Media to Question (optional — image, video, or document)">
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <UploadPill
                    icon={ImageIcon}
                    label="Image"
                    accept="image/*"
                    multiple
                    onFiles={(f) => setNewImages((p) => [...p, ...f])}
                  />
                  <UploadPill
                    icon={Video}
                    label="Video"
                    accept="video/*"
                    multiple
                    onFiles={(f) => setNewVideos((p) => [...p, ...f])}
                  />
                  <UploadPill
                    icon={FileText}
                    label="Document"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    multiple
                    onFiles={(f) => setNewDocs((p) => [...p, ...f])}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 10,
                  }}
                >
                  {visibleExisting.map((m) => (
                    <MediaTile
                      key={`e-${m.id}`}
                      type={m.mediaType}
                      name={m.url.split("/").pop()}
                      src={m.url}
                      saved
                      onExpand={
                        m.mediaType !== "document"
                          ? () => setLightbox({ type: m.mediaType, src: m.url })
                          : undefined
                      }
                      onRemove={() =>
                        setKeepMediaIds((p) => p.filter((id) => id !== m.id))
                      }
                    />
                  ))}
                  {newImages.map((f, i) => (
                    <MediaTile
                      key={`ni-${i}`}
                      type="image"
                      name={f.name}
                      size={f.size}
                      src={URL.createObjectURL(f)}
                      onExpand={() =>
                        setLightbox({
                          type: "image",
                          src: URL.createObjectURL(f),
                        })
                      }
                      onRemove={() =>
                        setNewImages((p) => p.filter((_, idx) => idx !== i))
                      }
                    />
                  ))}
                  {newVideos.map((f, i) => (
                    <MediaTile
                      key={`nv-${i}`}
                      type="video"
                      name={f.name}
                      size={f.size}
                      src={URL.createObjectURL(f)}
                      onExpand={() =>
                        setLightbox({
                          type: "video",
                          src: URL.createObjectURL(f),
                        })
                      }
                      onRemove={() =>
                        setNewVideos((p) => p.filter((_, idx) => idx !== i))
                      }
                    />
                  ))}
                  {newDocs.map((f, i) => (
                    <MediaTile
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
              </Field>

              {isOptionType && (
                <Field
                  label={`Options (mark the correct ${form.questionType === "mcq_multi" ? "answers" : "answer"})`}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {options.map((o, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#9ca3af",
                            flexShrink: 0,
                          }}
                        >
                          {formatLabel(idx, assessment.optionFormat)}
                        </span>
                        <input
                          type={
                            form.questionType === "mcq_multi"
                              ? "checkbox"
                              : "radio"
                          }
                          checked={o.isCorrect}
                          onChange={() => toggleCorrect(idx)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: "var(--accent)",
                            flexShrink: 0,
                          }}
                        />
                        <input
                          value={o.optionText}
                          onChange={(e) =>
                            setOption(idx, "optionText", e.target.value)
                          }
                          placeholder={`Option ${formatLabel(idx, assessment.optionFormat)}`}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        {form.markingMode === "per_option" && o.isCorrect && (
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={o.mark}
                            onChange={(e) =>
                              setOption(idx, "mark", e.target.value)
                            }
                            placeholder="Mark"
                            style={{ ...inputStyle, width: 70 }}
                          />
                        )}
                        {options.length > 2 && (
                          <Trash2
                            size={15}
                            style={{
                              cursor: "pointer",
                              color: "#dc2626",
                              flexShrink: 0,
                            }}
                            onClick={() =>
                              setOptions((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((prev) => [
                          ...prev,
                          { optionText: "", isCorrect: false, mark: "" },
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
                      <Plus size={13} /> Add option
                    </button>
                  </div>
                </Field>
              )}
            </fieldset>

            <button
              type="submit"
              disabled={saving}
              style={{ ...submitBtnStyle, opacity: saving ? 0.75 : 1 }}
            >
              {saving ? "Saving..." : isEdit ? "Save Question" : "Add Question"}
            </button>
          </form>
        </div>
      </div>

      {saving && (
        <UploadProgressModal
          progress={progress}
          done={uploadDone}
          hasMedia={hasNewMedia}
        />
      )}

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
            zIndex: 500,
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
    </>
  );
}

function UploadPill({ icon: Icon, label, accept, multiple, onFiles }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "1px dashed #d1d5db",
        borderRadius: 10,
        padding: "7px 12px",
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        cursor: "pointer",
      }}
    >
      <Icon size={13} /> {label} <Plus size={11} />
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

function MediaTile({ type, name, src, size, saved, onRemove, onExpand }) {
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
          top: 5,
          right: 5,
          width: 20,
          height: 20,
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
        <X size={11} />
      </button>
      {(type === "image" || type === "video") && src ? (
        <div
          onClick={onExpand}
          style={{
            width: "100%",
            height: 88,
            background: "#000",
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
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: 88,
            background: "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} color="var(--accent)" />
        </div>
      )}
      <div style={{ padding: "6px 8px" }}>
        <div
          style={{
            fontSize: 10.5,
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
        <div style={{ fontSize: 9.5, color: "#9ca3af", marginTop: 1 }}>
          {saved ? "Saved" : size ? formatBytes(size) : ""}
        </div>
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

function pillBtn(active) {
  return {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: active ? "1.5px solid var(--accent)" : "1px solid #e5e7eb",
    background: active ? "rgba(var(--accent-rgb),0.08)" : "#fff",
    color: active ? "var(--accent)" : "#374151",
  };
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
