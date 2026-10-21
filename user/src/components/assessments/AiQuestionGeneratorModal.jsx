import { useState } from "react";
import { X, Sparkles, Loader2, Check, Trash2 } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import { inputStyle, submitBtnStyle } from "../../pages/courses/CreateCourse";
import { formatLabel } from "../../utils/labelFormat";

export default function AiQuestionGeneratorModal({ assessment, onClose, onCommitted }) {
 const [settings, setSettings] = useState({
  count: 5,
  typeMode: "single",
  multiMarkingMode: "per_option",
  marksMode: "fixed",
  fixedMark: 1,
  minMark: 1,
  maxMark: 2,
  correctCountMode: "fixed",
  fixedCorrectCount: 2,
  minCorrectCount: 1,
  maxCorrectCount: 3,
  optionMarkDistribution: "same",
  focusNote: "",
});
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");

  const set = (key) => (e) =>
    setSettings((s) => ({ ...s, [key]: e.target.value }));

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await assessmentApi.aiGenerate({
  assessmentId: assessment.id,
  count: Number(settings.count),
  typeMode: settings.typeMode,
  multiMarkingMode: settings.multiMarkingMode,
  marksMode: settings.marksMode,
  fixedMark: Number(settings.fixedMark),
  minMark: Number(settings.minMark),
  maxMark: Number(settings.maxMark),
  correctCountMode: settings.correctCountMode,
  fixedCorrectCount: Number(settings.fixedCorrectCount),
  minCorrectCount: Number(settings.minCorrectCount),
  maxCorrectCount: Number(settings.maxCorrectCount),
  optionMarkDistribution: settings.optionMarkDistribution,
  focusNote: settings.focusNote || null,
});
      const qs = res.data.data;
      setQuestions(qs);
      setSelected(Object.fromEntries(qs.map((_, i) => [i, true])));
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const commit = async () => {
    const chosen = questions.filter((_, i) => selected[i]);
    if (chosen.length === 0) return setError("Select at least one question.");
    setCommitting(true);
    setError("");
    try {
      await assessmentApi.aiCommit({ assessmentId: assessment.id, questions: chosen });
      onCommitted();
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to save questions.");
      setCommitting(false);
    }
  };

const needsMultiOptions = ["multiple", "mixed_mcq", "mixed_all"].includes(settings.typeMode);
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle}><X size={15} /></button>
        <div style={headerStyle}>
          <Sparkles size={18} color="#7c3aed" />
          <div style={{ fontSize: 17, fontWeight: 700 }}>AI Question Generator</div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {!questions ? (
          <>
            <Field label="How many questions?">
              <input type="number" min="1" max="20" value={settings.count} onChange={set("count")} style={inputStyle} />
            </Field>

           <Field label="Question Type">
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {[
      { v: "single", l: "Single Correct" },
      { v: "multiple", l: "Multiple Correct" },
      { v: "mixed_mcq", l: "Mixed (MCQ)" },
     ...(assessment.mode === "review"
  ? [
      { v: "short", l: "Short Answer" },
      { v: "long", l: "Long Answer" },
      { v: "mixed_written", l: "Mixed (Short + Long)" },
      { v: "mixed_all", l: "Mixed (All Types)" },
    ]
  : []),
    ].map((t) => (
      <button
        key={t.v}
        type="button"
        onClick={() => setSettings((s) => ({ ...s, typeMode: t.v }))}
        style={pillBtn(settings.typeMode === t.v)}
      >
        {t.l}
      </button>
    ))}
  </div>
</Field>

            {needsMultiOptions && (
  <>
    <Field label="Marking Type for Multiple Correct questions">
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setSettings((s) => ({ ...s, multiMarkingMode: "per_option" }))} style={pillBtn(settings.multiMarkingMode === "per_option")}>Mark per Option</button>
        <button type="button" onClick={() => setSettings((s) => ({ ...s, multiMarkingMode: "per_question" }))} style={pillBtn(settings.multiMarkingMode === "per_question")}>Mark per Question</button>
      </div>
    </Field>

    <Field label="Correct Answers per Multiple-Correct Question">
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => setSettings((s) => ({ ...s, correctCountMode: "fixed" }))} style={pillBtn(settings.correctCountMode === "fixed")}>Fixed</button>
        <button type="button" onClick={() => setSettings((s) => ({ ...s, correctCountMode: "random" }))} style={pillBtn(settings.correctCountMode === "random")}>Random Range</button>
      </div>
      {settings.correctCountMode === "fixed" ? (
        <input type="number" min="2" max="5" value={settings.fixedCorrectCount} onChange={set("fixedCorrectCount")} style={inputStyle} placeholder="e.g. 2" />
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" min="2" max="5" value={settings.minCorrectCount} onChange={set("minCorrectCount")} style={inputStyle} placeholder="Min" />
          <input type="number" min="2" max="5" value={settings.maxCorrectCount} onChange={set("maxCorrectCount")} style={inputStyle} placeholder="Max" />
        </div>
      )}
    </Field>

    {settings.multiMarkingMode === "per_option" && (
      <Field label="Mark Distribution Across Correct Options">
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setSettings((s) => ({ ...s, optionMarkDistribution: "same" }))} style={pillBtn(settings.optionMarkDistribution === "same")}>Same for All</button>
          <button type="button" onClick={() => setSettings((s) => ({ ...s, optionMarkDistribution: "random" }))} style={pillBtn(settings.optionMarkDistribution === "random")}>Random Split</button>
        </div>
      </Field>
    )}
  </>
)}
            <Field label="Marks">
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button type="button" onClick={() => setSettings((s) => ({ ...s, marksMode: "fixed" }))} style={pillBtn(settings.marksMode === "fixed")}>Fixed</button>
                <button type="button" onClick={() => setSettings((s) => ({ ...s, marksMode: "random" }))} style={pillBtn(settings.marksMode === "random")}>Random Range</button>
              </div>
              {settings.marksMode === "fixed" ? (
                <input type="number" step="0.5" min="0" value={settings.fixedMark} onChange={set("fixedMark")} style={inputStyle} placeholder="Marks per question" />
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" step="0.5" min="0" value={settings.minMark} onChange={set("minMark")} style={inputStyle} placeholder="Min" />
                  <input type="number" step="0.5" min="0" value={settings.maxMark} onChange={set("maxMark")} style={inputStyle} placeholder="Max" />
                </div>
              )}
            </Field>

            <Field label="Focus (optional)">
              <textarea rows={2} value={settings.focusNote} onChange={set("focusNote")} style={{ ...inputStyle, resize: "vertical" }} placeholder="e.g. focus on chapter 3, avoid dates" />
            </Field>

            <button onClick={generate} disabled={generating} style={{ ...aiSubmitBtnStyle, opacity: generating ? 0.75 : 1 }}>
              {generating ? (<><Loader2 size={15} className="spin" /> Generating...</>) : (<><Sparkles size={15} /> Generate Questions</>)}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 12 }}>
              Review, deselect, or edit before adding. {Object.values(selected).filter(Boolean).length} of {questions.length} selected.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
              {questions.map((q, i) => (
                <div key={i} style={{ border: selected[i] ? "1.5px solid #7c3aed" : "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: selected[i] ? "rgba(124,58,237,0.04)" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <textarea
                      value={q.questionText}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[i] = { ...copy[i], questionText: e.target.value };
                        setQuestions(copy);
                      }}
                      rows={2}
                      style={{ ...inputStyle, flex: 1, fontSize: 12.5, resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setSelected((s) => ({ ...s, [i]: !s[i] }))} style={miniIconBtn(selected[i])}><Check size={13} /></button>
                      <button onClick={() => setSelected((s) => ({ ...s, [i]: false }))} style={miniIconBtn(false)}><Trash2 size={13} color="#dc2626" /></button>
                    </div>
                  </div>
                 <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
  {q.questionType === "mcq_multi"
    ? "Multiple Correct"
    : q.questionType === "mcq_single"
    ? "Single Correct"
    : q.questionType === "short_answer"
    ? "Short Answer"
    : "Long Answer"}
  {" · "}
  {q.markingMode === "per_option" ? "Mark per option" : `${q.mark} mark(s)`}
</div>
                 {q.options.length > 0 && (
  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
    {q.options.map((o, oi) => (
      <div key={oi} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, background: o.isCorrect ? "#dcfce7" : "#f9fafb", color: o.isCorrect ? "#16a34a" : "#6b7280" }}>
        {formatLabel(oi, assessment.optionFormat)}. {o.optionText} {o.isCorrect && `✓${o.mark != null ? ` (${o.mark})` : ""}`}
      </div>
    ))}
  </div>
)}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setQuestions(null)} style={{ ...submitBtnStyle, background: "#fff", color: "#374151", border: "1px solid #e5e7eb" }}>Back</button>
              <button onClick={commit} disabled={committing} style={{ ...aiSubmitBtnStyle, opacity: committing ? 0.75 : 1 }}>
                {committing ? "Adding..." : "Add Selected Questions"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>{children}</div>;
}
function pillBtn(active) {
  return { flex: 1, padding: "8px 10px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: active ? "1.5px solid #7c3aed" : "1px solid #e5e7eb", background: active ? "rgba(124,58,237,0.08)" : "#fff", color: active ? "#7c3aed" : "#374151" };
}
function miniIconBtn(active) {
  return { width: 26, height: 26, borderRadius: 7, border: "1px solid #e5e7eb", background: active ? "#dcfce7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
}
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 };
const modalStyle = { background: "#fff", borderRadius: 18, width: 600, maxHeight: "90vh", overflowY: "auto", padding: 24, position: "relative" };
const closeBtnStyle = { position: "absolute", top: 16, right: 16, border: "none", background: "#f3f4f6", borderRadius: 8, width: 30, height: 30, cursor: "pointer" };
const headerStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 18 };
const errorStyle = { background: "#fef2f2", color: "#dc2626", fontSize: 13, padding: "9px 12px", borderRadius: 8, marginBottom: 16 };
const aiSubmitBtnStyle = { ...submitBtnStyle, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };