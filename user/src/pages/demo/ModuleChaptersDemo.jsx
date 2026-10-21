import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Lock,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import { courseApi } from "../../api/courseApi";
import { assessmentApi } from "../../api/assessmentApi";
import {
  loadProgress,
  markModuleComplete,
  isGateRequired,
  isAssessmentSatisfied,
} from "../../utils/demoProgress";
import DemoHeader from "../../components/demo/DemoHeader";

export default function ModuleChaptersDemo() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [moduleAssessment, setModuleAssessment] = useState(null);
  const [chapterGates, setChapterGates] = useState({}); // { [chapterId]: assessmentDto }
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      courseApi.getModule(moduleId),
      courseApi.listChapters(moduleId),
    ])
      .then(async ([modRes, chRes]) => {
        const mod = modRes.data.data;
        setModule(mod);
        const chs = (chRes.data.data.chapters || []).filter((c) => !c.isDraft);
        setChapters(chs);

        if (mod.isFinalAssessment) {
          const aRes = await assessmentApi.forEntity("module", moduleId);
          setModuleAssessment(aRes.data.data);
        }

        const gated = chs.filter((c) => c.isFinalAssessment);
        if (gated.length > 0) {
          const results = await Promise.all(
            gated.map((c) => assessmentApi.forEntity("chapter", c.id)),
          );
          const map = {};
          gated.forEach((c, i) => {
            map[c.id] = results[i].data.data;
          });
          setChapterGates(map);
        }

        setProgress(loadProgress(courseId));
      })
      .finally(() => setLoading(false));
  }, [moduleId]);

  const chapterRequired = (c) =>
    c.isFinalAssessment && isGateRequired(chapterGates[c.id]);
  const chapterGateSatisfied = (c) =>
    !chapterRequired(c) ||
    isAssessmentSatisfied(progress, chapterGates[c.id].id);

  const allChaptersDone =
    chapters.length > 0 &&
    progress &&
    chapters.every(
      (c) =>
        progress.completedChapterIds.includes(c.id) && chapterGateSatisfied(c),
    );
  const moduleGateRequired =
    module?.isFinalAssessment && isGateRequired(moduleAssessment);
  const moduleGateSatisfied =
    !moduleGateRequired ||
    (progress && isAssessmentSatisfied(progress, moduleAssessment.id));
  const moduleFullyDone = allChaptersDone && moduleGateSatisfied;

  useEffect(() => {
    if (
      moduleFullyDone &&
      progress &&
      !progress.completedModuleIds.includes(Number(moduleId))
    ) {
      markModuleComplete(courseId, Number(moduleId));
      setProgress(loadProgress(courseId));
    }
  }, [moduleFullyDone]);

  if (loading || !module || !progress)
    return <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <DemoHeader
        title={module.name}
        subtitle={
          module.description ||
          "Complete each chapter in order to unlock the next"
        }
        onBack={() => navigate(`/courses/${courseId}/demo`)}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chapters.map((c, idx) => {
          const isDone = progress.completedChapterIds.includes(c.id);
          const prevDone =
            idx === 0 ||
            (progress.completedChapterIds.includes(chapters[idx - 1].id) &&
              chapterGateSatisfied(chapters[idx - 1]));
          const unlocked = prevDone;
          const hasGate = chapterRequired(c);
          const gateDone = chapterGateSatisfied(c);

          return (
            <div
              key={c.id}
              onClick={() =>
                unlocked &&
                navigate(
                  `/courses/${courseId}/demo/modules/${moduleId}/chapters/${c.id}`,
                )
              }
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #f0f0f0",
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: unlocked ? "pointer" : "not-allowed",
                opacity: unlocked || isDone ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background:
                    isDone && gateDone
                      ? "#dcfce7"
                      : unlocked
                        ? "rgba(var(--accent-rgb),0.12)"
                        : "#f3f4f6",
                }}
              >
                {isDone && gateDone ? (
                  <CheckCircle2 size={17} color="#16a34a" />
                ) : unlocked ? (
                  <FileText size={15} color="var(--accent)" />
                ) : (
                  <Lock size={14} color="#9ca3af" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
                  {isDone
                    ? hasGate && !gateDone
                      ? "Assessment pending"
                      : "Completed"
                    : unlocked
                      ? `${c.mediaCount} media item(s)`
                      : "Complete the previous chapter to unlock"}
                </div>
              </div>
              {hasGate && <Sparkles size={13} color="var(--accent)" />}
            </div>
          );
        })}
      </div>

      {moduleGateRequired && (
        <div
          style={{
            marginTop: 20,
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: 14,
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: allChaptersDone ? 1 : 0.55,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: moduleGateSatisfied
                ? "#dcfce7"
                : "rgba(var(--accent-rgb),0.12)",
            }}
          >
            {moduleGateSatisfied ? (
              <CheckCircle2 size={19} color="#16a34a" />
            ) : (
              <Sparkles size={17} color="var(--accent)" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Module Assessment
            </div>
            <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
              {moduleGateSatisfied
                ? "Completed"
                : allChaptersDone
                  ? "All chapters done — ready to take"
                  : "Complete all chapters to unlock"}
            </div>
          </div>
          {allChaptersDone && !moduleGateSatisfied && (
            <button
              onClick={() =>
                navigate(
                  `/courses/${courseId}/demo/assessment/${moduleAssessment.id}`,
                  {
                    state: {
                      scope: "module",
                      moduleId,
                      returnPath: `/courses/${courseId}/demo`,
                    },
                  },
                )
              }
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "9px 16px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <PlayCircle size={14} /> Start
            </button>
          )}
        </div>
      )}

      {moduleFullyDone && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => navigate(`/courses/${courseId}/demo`)}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Module Complete — Back to Modules
          </button>
        </div>
      )}
    </div>
  );
}
