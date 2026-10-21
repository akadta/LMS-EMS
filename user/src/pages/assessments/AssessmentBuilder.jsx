import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Send,
  Power,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import AssessmentSetupModal from "../../components/assessments/AssessmentSetupModal";
import ModeSwitchModal from "../../components/assessments/ModeSwitchModal";
import ConfirmModal from "../../components/ConfirmModal";
import QuestionModal from "./QuestionModal";
import PublishModal from "./PublishModal";
import { formatLabel } from "../../utils/labelFormat";
import { courseApi } from "../../api/courseApi";
import AiQuestionGeneratorModal from "../../components/assessments/AiQuestionGeneratorModal";

export default function AssessmentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const [questionModal, setQuestionModal] = useState(null);
  const [showPublish, setShowPublish] = useState(false);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);
  const [showDeleteAssessment, setShowDeleteAssessment] = useState(false);
  const [deletingAssessment, setDeletingAssessment] = useState(false);

  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const [gating, setGating] = useState({
    isPass: false,
    isReviewUnlock: false,
  });
  const [savingGating, setSavingGating] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([assessmentApi.get(id), assessmentApi.listQuestions(id)])
      .then(async ([aRes, qRes]) => {
        const a = aRes.data.data;
        setAssessment(a);
        setQuestions(qRes.data.data);

        if (a.entityType === "module") {
          const res = await courseApi.getModule(a.entityId);
          setGating({
            isPass: res.data.data.isPass,
            isReviewUnlock: res.data.data.isReviewUnlock,
          });
        } else if (a.entityType === "chapter") {
          const res = await courseApi.getChapter(a.entityId);
          setGating({
            isPass: res.data.data.isPass,
            isReviewUnlock: res.data.data.isReviewUnlock,
          });
        }
      })
      .finally(() => setLoading(false));
  };

  const toggleGatingFlag = async (key) => {
    const next = { ...gating, [key]: !gating[key] };
    setGating(next);
    setSavingGating(true);
    try {
      if (assessment.entityType === "module")
        await courseApi.updateModuleGating(assessment.entityId, next);
      else if (assessment.entityType === "chapter")
        await courseApi.updateChapterGating(assessment.entityId, next);
    } finally {
      setSavingGating(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const confirmDeleteQuestion = async () => {
    setDeletingQuestion(true);
    await assessmentApi.deleteQuestion(deleteQuestionTarget.id);
    setDeletingQuestion(false);
    setDeleteQuestionTarget(null);
    load();
  };

  const confirmDeleteAssessment = async () => {
    setDeletingAssessment(true);
    await assessmentApi.deleteAssessment(assessment.id);
    navigate(-1);
  };

  const toggleActive = async () => {
    const res = await assessmentApi.toggleActive(assessment.id);
    setAssessment((a) => ({ ...a, isActive: res.data.data.isActive }));
  };

  if (loading || !assessment)
    return (
      <div style={{ color: "#9ca3af", fontSize: 13.5 }}>
        Loading assessment...
      </div>
    );

  return (
    <div style={{ maxWidth: 860 }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back
      </button>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Sparkles size={17} color="var(--accent)" />
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
                {assessment.name}
              </div>
              {assessment.isPublished && (
                <span style={publishedTag}>Published</span>
              )}
              {!assessment.isActive && (
                <span style={inactiveTag}>Inactive</span>
              )}
              {assessment.isDraft && !assessment.isPublished && (
                <span style={draftTag}>Draft</span>
              )}
            </div>
            {assessment.description && (
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>
                {assessment.description}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 14,
                fontSize: 11.5,
                color: "#6b7280",
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowModeSwitch(true)}
                style={modeBadgeStyle}
              >
                <ArrowRightLeft size={11} />{" "}
                {assessment.mode === "instant"
                  ? "Instant Result"
                  : "Result After Review"}
              </button>
              <span>
                {assessment.isTimer
                  ? `Timer: ${assessment.timerValue} ${assessment.timerUnit} (${assessment.timerScope === "per_question" ? "per question" : "per exam"})`
                  : "No timer"}
              </span>
              <span>{questions.length} question(s)</span>
              {assessment.passPercentage != null && (
                <span>Pass mark: {assessment.passPercentage}%</span>
              )}
              {assessment.questionsToShow != null && (
                <span>
                  Shows {assessment.questionsToShow} of {questions.length}
                </span>
              )}
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}
          >
            <button
              onClick={() => setShowSettings(true)}
              style={secondaryBtnStyle}
            >
              <Pencil size={13} /> Settings
            </button>
            <button onClick={toggleActive} style={secondaryBtnStyle}>
              <Power size={13} />{" "}
              {assessment.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => setShowPublish(true)}
              style={primaryBtnStyle}
            >
              <Send size={13} />{" "}
              {assessment.isPublished ? "Republish" : "Publish"}
            </button>
            <button
              onClick={() => setShowDeleteAssessment(true)}
              style={dangerBtnStyle}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        {(assessment.entityType === "module" ||
          assessment.entityType === "chapter") && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #f0f0f0",
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 10,
              }}
            >
              Unlock Rules{" "}
              {savingGating && (
                <span
                  style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}
                >
                  Saving...
                </span>
              )}
            </div>
            {assessment.mode === "instant" && (
              <label style={gatingRowStyle}>
                <input
                  type="checkbox"
                  checked={gating.isPass}
                  onChange={() => toggleGatingFlag("isPass")}
                  style={checkboxStyle}
                />
                Must pass to unlock next{" "}
                {assessment.entityType === "module" ? "module" : "chapter"}{" "}
                (unless faculty overrides)
              </label>
            )}
            {assessment.mode === "review" && (
              <label style={gatingRowStyle}>
                <input
                  type="checkbox"
                  checked={gating.isReviewUnlock}
                  onChange={() => toggleGatingFlag("isReviewUnlock")}
                  style={checkboxStyle}
                />
                Require faculty review before unlocking next{" "}
                {assessment.entityType === "module" ? "module" : "chapter"}
              </label>
            )}
          </div>
        )}

        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
          Questions
        </div>
       <div style={{ display: "flex", gap: 8 }}>
  <button
    onClick={() => setShowAiGenerator(true)}
    style={aiBtnStyle}
    title="Generate questions with AI"
  >
    <Sparkles size={14} /> AI Generate
  </button>
  <button onClick={() => setQuestionModal("create")} style={primaryBtnStyle}>
    <Plus size={14} /> Add Question
  </button>
</div>
      </div>

      {questions.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 36,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13.5,
            border: "1px solid #f0f0f0",
          }}
        >
          No questions yet. Click "Add Question" to start building.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #f0f0f0",
              padding: 14,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "rgba(var(--accent-rgb),0.1)",
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {formatLabel(idx, assessment.questionFormat)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontSize: 13.5, color: "#111827", fontWeight: 600 }}
              >
                {q.questionText}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginTop: 4,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ textTransform: "capitalize" }}>
                  {q.questionType.replace("_", " ")}
                </span>
                <span style={{ textTransform: "capitalize" }}>
                  {q.markingMode === "per_option"
                    ? "Mark per option"
                    : "Mark per question"}
                </span>
                {q.mark != null && <span>{q.mark} mark(s)</span>}
                {q.media.length > 0 && (
                  <span>{q.media.length} attachment(s)</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setQuestionModal(q)} style={iconBtnStyle}>
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setDeleteQuestionTarget(q)}
                style={{ ...iconBtnStyle, color: "#dc2626" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showSettings && (
        <AssessmentSetupModal
          entityType={assessment.entityType}
          entityId={assessment.entityId}
          existing={assessment}
          onClose={() => setShowSettings(false)}
          onSaved={(data) => {
            setAssessment(data);
            setShowSettings(false);
          }}
        />
      )}

      {showModeSwitch && (
        <ModeSwitchModal
          assessment={assessment}
          questionCount={questions.length}
          onClose={() => setShowModeSwitch(false)}
          onSwitched={(data) => {
            setAssessment(data);
            setShowModeSwitch(false);
            load();
          }}
        />
      )}

      {questionModal && (
        <QuestionModal
          assessment={assessment}
          question={questionModal === "create" ? null : questionModal}
          onClose={() => setQuestionModal(null)}
          onSaved={() => {
            setQuestionModal(null);
            load();
          }}
        />
      )}

      {showPublish && (
        <PublishModal
          assessment={{ ...assessment, questionCount: questions.length }}
          onClose={() => setShowPublish(false)}
          onPublished={(data) => {
            setAssessment(data);
            setShowPublish(false);
          }}
        />
      )}

      {deleteQuestionTarget && (
        <ConfirmModal
          title="Delete this question?"
          message={`"${deleteQuestionTarget.questionText}" and any attached media will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete Question"
          loading={deletingQuestion}
          onConfirm={confirmDeleteQuestion}
          onCancel={() => setDeleteQuestionTarget(null)}
        />
      )}

      {showDeleteAssessment && (
        <ConfirmModal
          title="Delete this assessment?"
          message={`"${assessment.name}" and all ${questions.length} question(s) with their media will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete Assessment"
          loading={deletingAssessment}
          onConfirm={confirmDeleteAssessment}
          onCancel={() => setShowDeleteAssessment(false)}
        />
      )}

      {showAiGenerator && (
  <AiQuestionGeneratorModal
    assessment={assessment}
    onClose={() => setShowAiGenerator(false)}
    onCommitted={() => {
      setShowAiGenerator(false);
      load();
    }}
  />
)}
    </div>
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
const primaryBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
const dangerBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#fff",
  color: "#dc2626",
  border: "1px solid #fecaca",
  borderRadius: 9,
  padding: "8px 12px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
const iconBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#374151",
};
const modeBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  background: "#f3f4f6",
  border: "none",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
  cursor: "pointer",
};
const publishedTag = {
  background: "#dcfce7",
  color: "#16a34a",
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  textTransform: "uppercase",
};
const inactiveTag = {
  background: "#fee2e2",
  color: "#dc2626",
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  textTransform: "uppercase",
};
const draftTag = {
  background: "#f3f4f6",
  color: "#6b7280",
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  textTransform: "uppercase",
};
const gatingRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

const aiBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  color: "#fff",
  border: "none",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
};
const checkboxStyle = { width: 16, height: 16, accentColor: "var(--accent)" };
