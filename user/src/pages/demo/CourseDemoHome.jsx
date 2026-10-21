import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Lock,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  PartyPopper,
  BookOpen,
} from "lucide-react";
import { courseApi } from "../../api/courseApi";
import { assessmentApi } from "../../api/assessmentApi";
import {
  loadProgress,
  resetProgress,
  markCourseComplete,
  isGateRequired,
  isAssessmentSatisfied,
} from "../../utils/demoProgress";
import DemoHeader from "../../components/demo/DemoHeader";
import ConfirmModal from "../../components/ConfirmModal";

export default function CourseDemoHome() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [courseAssessment, setCourseAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      courseApi.getCourse(courseId),
      courseApi.listModules(courseId),
    ])
      .then(async ([cRes, mRes]) => {
        const c = cRes.data.data;
        setCourse(c);
        setModules(
          (mRes.data.data.modules || []).filter(
            (m) => !m.isDraft && m.chapterCount > 0,
          ),
        );
        if (c.isFinalAssessment) {
          const aRes = await assessmentApi.forEntity("course", courseId);
          setCourseAssessment(aRes.data.data);
        }
        setProgress(loadProgress(courseId));
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const allModulesDone =
    modules.length > 0 &&
    progress &&
    modules.every((m) => progress.completedModuleIds.includes(m.id));
  const courseGateRequired =
    course?.isFinalAssessment && isGateRequired(courseAssessment);
  const courseGateSatisfied =
    !courseGateRequired ||
    (progress && isAssessmentSatisfied(progress, courseAssessment.id));
  const courseFullyComplete = allModulesDone && courseGateSatisfied;

  useEffect(() => {
    if (courseFullyComplete && progress && !progress.courseCompleted) {
      markCourseComplete(courseId);
      setProgress(loadProgress(courseId));
    }
  }, [courseFullyComplete]);

  const doReset = () => {
    resetProgress(courseId);
    setProgress(loadProgress(courseId));
    setShowReset(false);
  };

  if (loading || !course || !progress)
    return (
      <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading demo...</div>
    );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <DemoHeader
        title={`${course.name} — Student Demo`}
        subtitle="Preview how a student experiences this course"
        onBack={() => navigate(`/courses/${courseId}/modules`)}
        onReset={() => setShowReset(true)}
      />

      {courseFullyComplete && (
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--accent), rgba(var(--accent-rgb),0.7))",
            borderRadius: 18,
            padding: "32px 24px",
            textAlign: "center",
            color: "#fff",
            marginBottom: 24,
          }}
        >
          <PartyPopper size={34} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 19, fontWeight: 800 }}>Course Completed!</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
            You've finished every module
            {courseGateRequired ? " and the final assessment" : ""}.
          </div>
          <button
            onClick={() => setShowReset(true)}
            style={{
              marginTop: 16,
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: 10,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retest from the Beginning
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modules.map((m, idx) => {
          const isDone = progress.completedModuleIds.includes(m.id);
          const prevDone =
            idx === 0 ||
            progress.completedModuleIds.includes(modules[idx - 1].id);
          const adminLocked = m.isLock;
          const unlocked = prevDone && !adminLocked;

          return (
            <div
              key={m.id}
              onClick={() =>
                unlocked &&
                navigate(`/courses/${courseId}/demo/modules/${m.id}`)
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
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: isDone
                    ? "#dcfce7"
                    : unlocked
                      ? "rgba(var(--accent-rgb),0.12)"
                      : "#f3f4f6",
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={19} color="#16a34a" />
                ) : unlocked ? (
                  <BookOpen size={17} color="var(--accent)" />
                ) : (
                  <Lock size={16} color="#9ca3af" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
                  {isDone
                    ? "Completed"
                    : unlocked
                      ? `${m.chapterCount} chapters`
                      : adminLocked
                        ? "Locked"
                        : "Complete the previous module to unlock"}
                </div>
              </div>
              {m.isFinalAssessment && (
                <Sparkles size={14} color="var(--accent)" />
              )}
            </div>
          );
        })}
      </div>

      {courseGateRequired && (
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
            opacity: allModulesDone ? 1 : 0.55,
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
              background: courseGateSatisfied
                ? "#dcfce7"
                : "rgba(var(--accent-rgb),0.12)",
            }}
          >
            {courseGateSatisfied ? (
              <CheckCircle2 size={19} color="#16a34a" />
            ) : (
              <Sparkles size={17} color="var(--accent)" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Final Course Assessment
            </div>
            <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
              {courseGateSatisfied
                ? "Completed"
                : allModulesDone
                  ? "Ready to take"
                  : "Complete all modules to unlock"}
            </div>
          </div>
          {allModulesDone && !courseGateSatisfied && (
            <button
              onClick={() =>
                navigate(
                  `/courses/${courseId}/demo/assessment/${courseAssessment.id}`,
                  {
                    state: {
                      scope: "course",
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

      {showReset && (
        <ConfirmModal
          title="Reset demo progress?"
          message="This clears all completed chapters, modules, and assessment attempts for this course's demo. You'll start from the very beginning."
          confirmLabel="Reset Progress"
          onConfirm={doReset}
          onCancel={() => setShowReset(false)}
        />
      )}
    </div>
  );
}
