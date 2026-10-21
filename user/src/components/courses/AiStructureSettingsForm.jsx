import { inputStyle } from "../../pages/courses/CreateCourse";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];

export default function AiStructureSettingsForm({ options, setOptions, showModuleCount, showChapterCount, showCourseFinal, showModuleFinal, showChapterFinal, showTopic }) {
  const set = (key) => (val) => setOptions((o) => ({ ...o, [key]: val }));
  const setCount = (key) => (patch) => setOptions((o) => ({ ...o, [key]: { ...o[key], ...patch } }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showTopic && (
        <Field label="Course Topic">
          <input value={options.topic || ""} onChange={(e) => set("topic")(e.target.value)} placeholder="e.g. Advanced React Development" style={inputStyle} />
        </Field>
      )}

      {showModuleCount && (
        <CountField label="Number of Modules" value={options.moduleCount} onChange={setCount("moduleCount")} />
      )}
      {showChapterCount && (
        <CountField label="Chapters per Module" value={options.chapterCount} onChange={setCount("chapterCount")} />
      )}

      <Field label="Difficulty">
        <PillGroup
          options={[{ v: "fixed", l: "Choose" }, { v: "random", l: "Random" }]}
          value={options.difficultyMode}
          onChange={set("difficultyMode")}
        />
        {options.difficultyMode === "fixed" && (
          <select value={options.difficulty} onChange={(e) => set("difficulty")(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
          </select>
        )}
      </Field>

      <Field label="Cover Images">
        <PillGroup
          options={[{ v: true, l: "Include Images" }, { v: false, l: "No Images" }]}
          value={options.includeImages}
          onChange={set("includeImages")}
        />
      </Field>

      <Field label="Draft Status">
        <PillGroup
          options={[{ v: "fixed", l: "Choose" }, { v: "random", l: "Random" }]}
          value={options.draftMode}
          onChange={set("draftMode")}
        />
        {options.draftMode === "fixed" && (
          <div style={{ marginTop: 8 }}>
            <PillGroup
              options={[{ v: true, l: "Save as Draft" }, { v: false, l: "Publish Immediately" }]}
              value={options.isDraft}
              onChange={set("isDraft")}
            />
          </div>
        )}
      </Field>

      {showCourseFinal && <FinalAssessmentField label="Course Final Assessment" value={options.courseFinalAssessment} onChange={(v) => set("courseFinalAssessment")(v)} />}
      {showModuleFinal && <FinalAssessmentField label="Module Final Assessments" value={options.moduleFinalAssessment} onChange={(v) => set("moduleFinalAssessment")(v)} />}
      {showChapterFinal && <FinalAssessmentField label="Chapter Final Assessments" value={options.chapterFinalAssessment} onChange={(v) => set("chapterFinalAssessment")(v)} />}

      <Field label="">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={options.generateQuestions} onChange={(e) => set("generateQuestions")(e.target.checked)} style={{ width: 16, height: 16 }} />
          Auto-generate questions for any final assessments created
        </label>
      </Field>
    </div>
  );
}

function CountField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <PillGroup options={[{ v: "fixed", l: "Fixed" }, { v: "random", l: "Random Range" }]} value={value.mode} onChange={(m) => onChange({ mode: m })} />
      {value.mode === "fixed" ? (
        <input type="number" min="1" max="20" value={value.fixed} onChange={(e) => onChange({ fixed: Number(e.target.value) })} style={{ ...inputStyle, marginTop: 8 }} />
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input type="number" min="1" value={value.min} onChange={(e) => onChange({ min: Number(e.target.value) })} style={inputStyle} placeholder="Min" />
          <input type="number" min="1" value={value.max} onChange={(e) => onChange({ max: Number(e.target.value) })} style={inputStyle} placeholder="Max" />
        </div>
      )}
    </Field>
  );
}

function FinalAssessmentField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <PillGroup
        options={[{ v: "yes", l: "Yes" }, { v: "no", l: "No" }, { v: "random", l: "Random" }, { v: "choose_later", l: "Choose Later" }]}
        value={value.mode}
        onChange={(m) => onChange({ mode: m })}
      />
    </Field>
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          style={{
            padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: value === o.v ? "1.5px solid #7c3aed" : "1px solid #e5e7eb",
            background: value === o.v ? "rgba(124,58,237,0.08)" : "#fff",
            color: value === o.v ? "#7c3aed" : "#374151",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>}
      {children}
    </div>
  );
}

export function defaultAiOptions() {
  return {
    topic: "",
    moduleCount: { mode: "fixed", fixed: 3, min: 2, max: 5 },
    chapterCount: { mode: "fixed", fixed: 3, min: 2, max: 5 },
    difficultyMode: "fixed",
    difficulty: "beginner",
    includeImages: true,
    draftMode: "fixed",
    isDraft: true,
    courseFinalAssessment: { mode: "no" },
    moduleFinalAssessment: { mode: "no" },
    chapterFinalAssessment: { mode: "no" },
    generateQuestions: false,
  };
}