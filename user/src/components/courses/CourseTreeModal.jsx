import { useState, useEffect } from "react";
import {
  X, ChevronDown, ChevronRight, CheckCircle2, FileEdit,
  Sparkles, Send, ShieldCheck, Loader2,
} from "lucide-react";
import { courseTreeApi } from "../../api/courseTreeApi";

export default function CourseTreeModal({ courseId, onClose, onPublished }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [resultData, setResultData] = useState(null);

  const load = () => {
    setLoading(true);
    courseTreeApi.getTree(courseId).then((res) => setTree(res.data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [courseId]);

  const toggleModule = (id) => setExpandedModules((p) => ({ ...p, [id]: !p[id] }));

  const publishAll = async () => {
    setPublishing(true);
    const res = await courseTreeApi.publishAll(courseId);
    setPublishing(false);
    setResultData(res.data.data);
    load();
    onPublished?.();
  };

const isAssessmentPublishable = (a) =>
  a && a.assessmentId != null && a.assessmentQuestionCount > 0 && (a.assessmentIsDraft || !a.assessmentIsPublished);

const draftCount = tree
  ? (tree.isDraft ? 1 : 0) +
    tree.modules.filter((m) => m.isDraft).length +
    tree.modules.flatMap((m) => m.chapters).filter((c) => c.isDraft).length +
    (tree.hasFinalAssessment && isAssessmentPublishable(tree) ? 1 : 0) +
    tree.modules.filter((m) => m.hasFinalAssessment && isAssessmentPublishable(m)).length +
    tree.modules.flatMap((m) => m.chapters).filter((c) => c.hasFinalAssessment && isAssessmentPublishable(c)).length
  : 0;

  return (
  <div style={overlayStyle}>
    <div style={modalStyle}>
      <button onClick={onClose} style={closeBtnStyle}><X size={15} /></button>

      {loading || !tree ? (
        <div style={{ color: "#9ca3af", fontSize: 13.5, padding: 24 }}>Loading tree...</div>
      ) : (
        <>
          <div style={{ padding: "24px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{tree.courseName}</div>
              <StatusBadge isDraft={tree.isDraft} />
            </div>
           <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 18 }}>
  {tree.modules.length} module(s) ·{" "}
  {draftCount > 0 ? `${draftCount} item(s) still unpublished` : "Everything published"}
</div>
            {draftCount > 0 && (
              <button onClick={publishAll} disabled={publishing} style={publishAllBtnStyle}>
                {publishing ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                {publishing ? "Publishing..." : `Publish Entire Course (${draftCount} item(s))`}
              </button>
            )}

            {resultData && (
              <div style={resultBannerStyle}>
                <ShieldCheck size={14} />
                Published: {resultData.modulesPublished} module(s), {resultData.chaptersPublished} chapter(s), {resultData.assessmentsPublished} assessment(s).
              </div>
            )}

            {tree.hasFinalAssessment && (
              <TreeAssessmentRow
                label="Course Final Assessment"
                assessmentId={tree.assessmentId}
                isDraft={tree.assessmentIsDraft}
                isPublished={tree.assessmentIsPublished}
                questionCount={tree.assessmentQuestionCount}
              />
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tree.modules.map((m) => (
                <div key={m.id} style={moduleBoxStyle}>
                  <div onClick={() => toggleModule(m.id)} style={moduleHeaderStyle}>
                    {expandedModules[m.id] ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{m.chapters.length} chapter(s)</span>
                    <StatusBadge isDraft={m.isDraft} />
                  </div>

                  {expandedModules[m.id] && (
                    <div style={{ padding: "0 14px 12px 30px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {m.hasFinalAssessment && (
                        <TreeAssessmentRow
                          label="Module Assessment"
                          assessmentId={m.assessmentId}
                          isDraft={m.assessmentIsDraft}
                          isPublished={m.assessmentIsPublished}
                          questionCount={m.assessmentQuestionCount}
                          compact
                        />
                      )}
                      {m.chapters.map((c) => (
                        <div key={c.id}>
                          <div style={chapterRowStyle}>
                            <span style={{ fontSize: 12.5, color: "#374151", flex: 1 }}>{c.name}</span>
                            <StatusBadge isDraft={c.isDraft} small />
                          </div>
                          {c.hasFinalAssessment && (
                            <div style={{ marginLeft: 14 }}>
                              <TreeAssessmentRow
                                label="Chapter Assessment"
                                assessmentId={c.assessmentId}
                                isDraft={c.assessmentIsDraft}
                                isPublished={c.assessmentIsPublished}
                                questionCount={c.assessmentQuestionCount}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
}

function StatusBadge({ isDraft, small }) {
  return isDraft ? (
    <span style={badgeStyle("#f3f4f6", "#6b7280", small)}><FileEdit size={small ? 9 : 11} /> Draft</span>
  ) : (
    <span style={badgeStyle("#dcfce7", "#16a34a", small)}><CheckCircle2 size={small ? 9 : 11} /> Live</span>
  );
}

function TreeAssessmentRow({ label, assessmentId, isDraft, isPublished, questionCount, compact }) {
  const noAssessment = assessmentId == null;
  const needsQuestions = !noAssessment && questionCount === 0;
  const isLive = !noAssessment && !needsQuestions && isPublished && !isDraft;

  const content = (
    <>
      <Sparkles size={compact ? 11 : 13} color={noAssessment ? "#9ca3af" : "#7c3aed"} />
      <span style={{ color: noAssessment ? "#9ca3af" : "#374151", fontWeight: 600, flex: 1 }}>{label}</span>
      {!noAssessment && <span style={{ color: "#9ca3af", fontSize: 10.5 }}>{questionCount} question(s)</span>}
      {noAssessment ? (
        <span style={badgeStyle("#f3f4f6", "#9ca3af", true)}>No Assessment Created</span>
      ) : needsQuestions ? (
        <span style={badgeStyle("#fee2e2", "#dc2626", true)}>Needs Questions</span>
      ) : isLive ? (
        <span style={badgeStyle("#dcfce7", "#16a34a", true)}>Published</span>
      ) : (
        <span style={badgeStyle("#fef3c7", "#d97706", true)}>Not Published</span>
      )}
    </>
  );

  const rowStyle = {
    display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
    background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 8,
    padding: compact ? "6px 10px" : "8px 12px", fontSize: compact ? 11.5 : 12.5,
  };

  if (noAssessment) {
    return <div style={{ ...rowStyle, background: "#f9fafb", border: "1px solid #f0f0f0" }}>{content}</div>;
  }

  return <a href={"/assessments/" + assessmentId} style={rowStyle}>{content}</a>;
}
function badgeStyle(bg, color, small) {
  return {
    display: "flex", alignItems: "center", gap: 3, background: bg, color,
    fontSize: small ? 9.5 : 10.5, fontWeight: 700, padding: small ? "2px 6px" : "3px 8px", borderRadius: 999,
  };
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 };
const modalStyle = { background: "#fff", borderRadius: 18, width: 620, maxHeight: "85vh", padding: 0, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" };
const closeBtnStyle = { position: "absolute", top: 16, right: 16, border: "none", background: "#f3f4f6", borderRadius: 8, width: 30, height: 30, cursor: "pointer" };
const moduleBoxStyle = { border: "1px solid #f0f0f0", borderRadius: 12, overflow: "hidden" };
const moduleHeaderStyle = { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer" };
const chapterRowStyle = { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 7 };
const publishAllBtnStyle = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", border: "none",
  borderRadius: 10, padding: "12px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginBottom: 14,
};
const resultBannerStyle = {
  display: "flex", alignItems: "center", gap: 8, background: "#dcfce7", color: "#16a34a",
  fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 8, marginBottom: 14,
};