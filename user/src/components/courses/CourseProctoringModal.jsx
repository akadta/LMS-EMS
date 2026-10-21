import { useState, useEffect } from "react";
import { X, ShieldCheck, Video, Camera, Mic, Copy, MousePointerClick, RotateCcw, AlertTriangle } from "lucide-react";
import { proctoringApi } from "../../api/proctoringApi";

export default function CourseProctoringModal({ courseId, onClose, onSaved }) {
  const [overview, setOverview] = useState(null);
  const [settings, setSettings] = useState(null);
  const [enabledIds, setEnabledIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    proctoringApi.getCourseOverview(courseId).then((res) => {
      const d = res.data.data;
      setOverview(d);
      setSettings(d.defaultSettings);
      setEnabledIds(new Set(d.assessments.filter((a) => a.isEnabled).map((a) => a.assessmentId)));
    });
  }, [courseId]);

  const toggleAssessment = (id) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const enableAll = () => setEnabledIds(new Set(overview.assessments.map((a) => a.assessmentId)));
  const disableAll = () => setEnabledIds(new Set());

  const set = (key) => (val) => setSettings((s) => ({ ...s, [key]: val }));

  const save = async () => {
    setSaving(true);
    await proctoringApi.applyCourseProctoring(courseId, {
      settings,
      enabledAssessmentIds: Array.from(enabledIds),
    });
    setSaving(false);
    onSaved?.();
    onClose();
  };

  if (!overview || !settings) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle}><X size={15} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, padding: "24px 24px 0" }}>
          <ShieldCheck size={18} color="#dc2626" />
          <div style={{ fontSize: 17, fontWeight: 700 }}>Exam Proctoring Setup</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 18, padding: "0 24px" }}>
          Configure monitoring behavior and choose which exams in this course require it.
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          <SectionTitle icon={Camera} label="Required Devices" />
          <Toggle label="Require Camera" checked={settings.requireCamera} onChange={set("requireCamera")} />
          <Toggle label="Require Microphone" checked={settings.requireMicrophone} onChange={set("requireMicrophone")} />

          <SectionTitle icon={Video} label="Capture" />
          <Toggle label="Record Video (saved to server)" checked={settings.recordVideo} onChange={set("recordVideo")} />
          <Toggle label="Take Periodic Snapshots" checked={settings.takeSnapshots} onChange={set("takeSnapshots")} />
          {settings.takeSnapshots && (
            <div style={{ marginLeft: 24, marginTop: 8, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <PillBtn active={settings.snapshotMode === "fixed"} onClick={() => set("snapshotMode")("fixed")}>Fixed Interval</PillBtn>
                <PillBtn active={settings.snapshotMode === "random"} onClick={() => set("snapshotMode")("random")}>Random Interval</PillBtn>
              </div>
              {settings.snapshotMode === "fixed" ? (
                <NumInput label="Every (seconds)" value={settings.snapshotFixedSeconds} onChange={set("snapshotFixedSeconds")} />
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <NumInput label="Min sec" value={settings.snapshotMinSeconds} onChange={set("snapshotMinSeconds")} />
                  <NumInput label="Max sec" value={settings.snapshotMaxSeconds} onChange={set("snapshotMaxSeconds")} />
                </div>
              )}
            </div>
          )}

          <SectionTitle icon={Copy} label="Browser Restrictions" />
          <Toggle label="Block Copy / Paste" checked={settings.blockCopyPaste} onChange={set("blockCopyPaste")} />
          <Toggle label="Detect Tab Switch / Window Blur" checked={settings.blockTabSwitch} onChange={set("blockTabSwitch")} />
          <Toggle label="Block Right-Click" checked={settings.blockRightClick} onChange={set("blockRightClick")} />
          <Toggle label="Warn on Refresh / Close Attempt" checked={settings.warnOnRefreshAttempt} onChange={set("warnOnRefreshAttempt")} />

          <SectionTitle icon={AlertTriangle} label="Student Experience" />
          <Toggle label="Show Live Warnings to Student" checked={settings.showWarningsToStudent} onChange={set("showWarningsToStudent")} />
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Auto-submit after N violations (blank = never)</label>
            <input
              type="number" min="1"
              value={settings.maxViolationsBeforeAutoSubmit ?? ""}
              onChange={(e) => set("maxViolationsBeforeAutoSubmit")(e.target.value === "" ? null : Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <SectionTitle icon={ShieldCheck} label="Apply To" />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={enableAll} style={smallBtnStyle}>Enable for All</button>
            <button onClick={disableAll} style={smallBtnStyle}>Disable for All</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {overview.assessments.length === 0 && (
              <div style={{ fontSize: 12.5, color: "#9ca3af" }}>No final assessments found in this course yet.</div>
            )}
            {overview.assessments.map((a) => (
              <label key={a.assessmentId} style={assessmentRowStyle}>
                <input
                  type="checkbox"
                  checked={enabledIds.has(a.assessmentId)}
                  onChange={() => toggleAssessment(a.assessmentId)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 12.5, color: "#374151" }}>{a.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={save} disabled={saving} style={saveBtnStyle}>
            {saving ? "Saving..." : `Save Proctoring Settings (${enabledIds.size} exam(s) enabled)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#111827", marginTop: 18, marginBottom: 10 }}>
      <Icon size={13} color="#dc2626" /> {label}
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151", cursor: "pointer", marginBottom: 8 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );
}
function PillBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
      border: active ? "1.5px solid #dc2626" : "1px solid #e5e7eb",
      background: active ? "rgba(220,38,38,0.06)" : "#fff", color: active ? "#dc2626" : "#374151",
    }}>{children}</button>
  );
}
function NumInput({ label, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ ...labelStyle, fontSize: 10.5 }}>{label}</label>
      <input type="number" min="1" value={value} onChange={(e) => onChange(Number(e.target.value))} style={inputStyle} />
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 };
const modalStyle = { background: "#fff", borderRadius: 18, width: 600, maxHeight: "88vh", padding: 0, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" };
const closeBtnStyle = { position: "absolute", top: 16, right: 16, border: "none", background: "#f3f4f6", borderRadius: 8, width: 30, height: 30, cursor: "pointer", zIndex: 2 };
const labelStyle = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 12.5, boxSizing: "border-box" };
const smallBtnStyle = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: "#374151" };
const assessmentRowStyle = { display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 8, padding: "8px 12px", cursor: "pointer" };
const saveBtnStyle = { width: "100%", background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };