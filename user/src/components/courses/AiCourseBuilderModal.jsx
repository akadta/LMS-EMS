import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { aiCourseBuilderApi } from "../../api/aiCourseBuilderApi";
import AiStructureSettingsForm, { defaultAiOptions } from "./AiStructureSettingsForm";
import AiGenerationAnimationModal from "./AiGenerationAnimationModal";

export default function AiCourseBuilderModal({ mode, courseId, moduleId, onClose, onCreated }) {
  const [options, setOptions] = useState(defaultAiOptions());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (mode === "full_course" && !options.topic.trim()) return setError("Please enter a topic.");
    setError("");
    setGenerating(true);
    try {
      const payload = { options: buildOptionsPayload(options) };
      if (mode === "full_course") {
        await aiCourseBuilderApi.createCompleteCourse(payload);
      } else if (mode === "add_modules") {
        await aiCourseBuilderApi.addModules({ courseId, options: payload.options });
      } else if (mode === "add_chapters") {
        await aiCourseBuilderApi.addChapters({ moduleId, options: payload.options });
      }
      onCreated();
  } catch (err) {
  console.error("AI course generation error:", err.response?.data || err);
  setError(err.response?.data?.errors?.[0] || err.message || "Generation failed. Try again.");
  if (err.response?.data?.debug) {
    console.error("FULL BACKEND STACK TRACE:", err.response.data.debug);
  }
  setGenerating(false);
}
  };

  const titles = {
    full_course: "Create Complete Course with AI",
    add_modules: "Add Modules with AI",
    add_chapters: "Add Chapters with AI",
  };

  return (
    <>
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <button onClick={onClose} style={closeBtnStyle}><X size={15} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Sparkles size={18} color="#7c3aed" />
            <div style={{ fontSize: 17, fontWeight: 700 }}>{titles[mode]}</div>
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <AiStructureSettingsForm
            options={options}
            setOptions={setOptions}
            showTopic={mode === "full_course"}
            showModuleCount={mode === "full_course" || mode === "add_modules"}
            showChapterCount={true}
            showCourseFinal={mode === "full_course"}
            showModuleFinal={mode === "full_course" || mode === "add_modules"}
            showChapterFinal={true}
          />

          <button onClick={submit} disabled={generating} style={submitBtnStyle}>
            <Sparkles size={15} /> Generate
          </button>
        </div>
      </div>
      <AiGenerationAnimationModal active={generating} />
    </>
  );
}

function buildOptionsPayload(o) {
  return {
    topic: o.topic,
    moduleCount: { mode: o.moduleCount.mode, fixed: o.moduleCount.fixed, min: o.moduleCount.min, max: o.moduleCount.max },
    chapterCount: { mode: o.chapterCount.mode, fixed: o.chapterCount.fixed, min: o.chapterCount.min, max: o.chapterCount.max },
    difficultyMode: o.difficultyMode,
    difficulty: o.difficulty,
    includeImages: o.includeImages,
    draftMode: o.draftMode,
    isDraft: o.isDraft,
    courseFinalAssessment: { mode: o.courseFinalAssessment.mode },
    moduleFinalAssessment: { mode: o.moduleFinalAssessment.mode },
    chapterFinalAssessment: { mode: o.chapterFinalAssessment.mode },
    generateQuestions: o.generateQuestions,
  };
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 };
const modalStyle = { background: "#fff", borderRadius: 18, width: 560, maxHeight: "90vh", overflowY: "auto", padding: 24, position: "relative" };
const closeBtnStyle = { position: "absolute", top: 16, right: 16, border: "none", background: "#f3f4f6", borderRadius: 8, width: 30, height: 30, cursor: "pointer" };
const errorStyle = { background: "#fef2f2", color: "#dc2626", fontSize: 13, padding: "9px 12px", borderRadius: 8, marginBottom: 16 };
const submitBtnStyle = { width: "100%", marginTop: 20, background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };