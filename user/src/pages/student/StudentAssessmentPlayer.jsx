import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation,useSearchParams } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, Send, ShieldCheck } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import { studentLearningApi } from "../../api/studentLearningApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { formatLabel } from "../../utils/labelFormat";
import { useProctoringMonitor } from "../../hooks/useProctoringMonitor";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudentAssessmentPlayer() {
 const { assessmentId } = useParams();
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const entityType = searchParams.get("entityType");
const courseId = searchParams.get("courseId");

const entityId = searchParams.get("entityId");
const moduleId = searchParams.get("moduleId");
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [examSecondsLeft, setExamSecondsLeft] = useState(null);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(true);
const [attemptId, setAttemptId] = useState(null);
const [gateInfo, setGateInfo] = useState(null);
const { settings: proctorSettings, status: proctorStatus, warning: proctorWarning, requestMedia } = useProctoringMonitor(
  assessmentId,
  attemptId,
  () => handleSubmit(true)
);
const autoSubmitRef = useRef(false);

  useEffect(() => {
  (async () => {
    const startRes = await studentLearningApi.startAttempt(assessmentId);
    const { attemptId, expiresAt, serverNow } = startRes.data.data;
    setAttemptId(attemptId);

    const [aRes, qRes] = await Promise.all([
      studentLearningApi.getAssessment(assessmentId),
      studentLearningApi.getAssessmentQuestions(assessmentId),
    ]);
    const a = aRes.data.data;
    let qs = (qRes.data.data || []).map((q) => ({
      ...q,
      media: q.media.map((m) => ({ ...m, url: resolveImageUrl(m.url) })),
    }));
    if (a.isShuffle) qs = shuffleArray(qs);
    if (a.questionsToShow && a.questionsToShow < qs.length)
      qs = qs.slice(0, a.questionsToShow);
    setAssessment(a);
    setQuestions(qs);

    if (expiresAt) {
      const remainingSec = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - new Date(serverNow).getTime()) / 1000),
      );
      setExamSecondsLeft(remainingSec);
    }

    const progressRes = await studentLearningApi.getProgress(attemptId);
    const saved = {};
    for (const ans of progressRes.data.data) {
      saved[ans.questionId] = ans.selectedOptionIds ?? ans.textAnswer ?? [];
    }
    setAnswers(saved);
    setLoading(false);
  })();
}, [assessmentId]);

useEffect(() => {
  if (!attemptId || submitted) return;
  const t = setTimeout(() => {
    studentLearningApi.saveProgress(attemptId, {
      attemptId,
      assessmentId: Number(assessmentId),
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id]?.filter?.((v) => typeof v === "number") || undefined,
        textAnswer: typeof answers[q.id] === "string" ? answers[q.id] : undefined,
      })),
    });
  }, 800);
  return () => clearTimeout(t);
}, [answers, attemptId]);

  useEffect(() => {
    if (examSecondsLeft === null || submitted) return;
    if (examSecondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setExamSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [examSecondsLeft, submitted]);

  useEffect(() => {
    if (
      !assessment?.isTimer ||
      assessment.timerScope !== "per_question" ||
      submitted ||
      questions.length === 0
    )
      return;
    setQuestionSecondsLeft(
      (assessment.timerValue || 0) *
        (assessment.timerUnit === "minutes" ? 60 : 1),
    );
  }, [currentIndex, assessment, questions.length]);

  useEffect(() => {
    if (questionSecondsLeft === null || submitted) return;
    if (questionSecondsLeft <= 0) {
      if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      else handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setQuestionSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [questionSecondsLeft, submitted]);

  if (loading || !assessment)
    return (
      <div
        style={{
          color: "#9ca3af",
          fontSize: 13.5,
          maxWidth: 700,
          margin: "40px auto",
        }}
      >
        Loading assessment...
      </div>
    );

    if (proctorSettings && proctorStatus !== "active" && proctorStatus !== "not_required") {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <ShieldCheck size={40} color="#dc2626" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Proctoring Required</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
          This exam requires camera/microphone access to proceed.
        </div>
        {proctorStatus === "denied" && (
          <div style={{ color: "#dc2626", fontSize: 12.5, marginBottom: 14 }}>Access denied. Please allow permissions and try again.</div>
        )}
        <button onClick={requestMedia} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          {proctorStatus === "requesting" ? "Requesting..." : "Grant Access & Start Exam"}
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isOptionType =
    q?.questionType === "mcq_single" || q?.questionType === "mcq_multi";
  const correctCount = isOptionType
    ? q.options.filter((o) => o.isCorrect).length
    : 0;
  const isMulti = q?.questionType === "mcq_multi";

  const setAnswer = (val) => setAnswers((prev) => ({ ...prev, [q.id]: val }));

  const toggleOption = (optId) => {
    if (q.questionType === "mcq_single") {
      setAnswer([optId]);
      return;
    }
    const cur = answers[q.id] || [];
    if (cur.includes(optId)) {
      setAnswer(cur.filter((id) => id !== optId));
    } else {
      // exact-N enforcement: student cannot select more than the number of correct answers
      if (cur.length >= correctCount) return;
      setAnswer([...cur, optId]);
    }
  };

  const handleSubmit = async (auto = false) => {
    if (submitted) return;
    if (autoSubmitRef.current && !auto) return;
    autoSubmitRef.current = true;
    setSubmitted(true);

    const payload = {
  attemptId,
  assessmentId: Number(assessmentId),
  answers: questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds:
          answers[question.id]?.filter?.((v) => typeof v === "number") ||
          undefined,
        textAnswer:
          typeof answers[question.id] === "string"
            ? answers[question.id]
            : undefined,
      })),
    };
    const res = await studentLearningApi.submitAttempt(payload);
    setResult(res.data.data);

    // fetch real gate status so the message reflects actual unlock rules, not a guess
    if (entityType && entityId) {
      try {
        const gateRes = await studentLearningApi.getGateStatus(entityType, entityId);
        setGateInfo(gateRes.data.data);
      } catch {
        setGateInfo(null);
      }
    }
  };

const handleContinue = () => {
  if (entityType === "chapter" && moduleId) {
    navigate(`/student/modules/${moduleId}/chapters${courseId ? `?courseId=${courseId}` : ""}`);
  } else if (entityType === "module" && courseId) {
    navigate(`/student/courses/${courseId}/modules`);
  } else {
    navigate("/student/batches");
  }
};

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (submitted && result) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto" }}>
        {result.mode === "review" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 40,
              textAlign: "center",
              border: "1px solid #f0f0f0",
            }}
          >
            <Send
              size={34}
              color="var(--accent)"
              style={{ marginBottom: 14 }}
            />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
              Submitted — Under Review
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              Your faculty will review your answers and unlock the next step
              once graded.
            </div>
            <button onClick={handleContinue} style={continueBtnStyle}>
              Back
            </button>
          </div>
        ) : (
          <div
            style={{
              background: result.passed
                ? "linear-gradient(135deg, #16a34a, #22c55e)"
                : "linear-gradient(135deg, #dc2626, #ef4444)",
              borderRadius: 18,
              padding: "36px 24px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            {result.passed ? (
              <CheckCircle2 size={36} style={{ marginBottom: 10 }} />
            ) : (
              <XCircle size={36} style={{ marginBottom: 10 }} />
            )}
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {result.percent}%
            </div>
           <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4 }}>
  {result.totalAwarded} / {result.totalPossible} marks
  {result.grade && ` · Grade ${result.grade}`}
  {result.passed != null && (
    result.passed
      ? " · Passed"
      : gateInfo?.gateCleared
        ? " · Not Passed — you may still continue"
        : gateInfo?.reason === "pending_review"
          ? " · Submitted — awaiting faculty review to continue"
          : gateInfo?.reason === "failed_pending_override"
            ? " · Not Passed — faculty approval required to continue"
            : " · Not Passed"
  )}
</div>
            <button
              onClick={handleContinue}
              style={{
                ...continueBtnStyle,
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {proctorWarning && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#dc2626", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, zIndex: 400, boxShadow: "0 4px 20px rgba(220,38,38,0.4)" }}>
          ⚠ {proctorWarning}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
            {assessment.name}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
        {(examSecondsLeft !== null || questionSecondsLeft !== null) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Clock size={14} />{" "}
            {formatTime(examSecondsLeft ?? questionSecondsLeft)}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 6,
            lineHeight: 1.6,
          }}
        >
          {q.questionText}
        </div>
        {isMulti && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--accent)",
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            Select exactly {correctCount} answer{correctCount !== 1 ? "s" : ""}
          </div>
        )}

        {q.media.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {q.media.map((m) =>
              m.mediaType === "video" ? (
                <video
                  key={m.id}
                  src={m.url}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    gridColumn: "1 / -1",
                  }}
                />
              ) : m.mediaType === "image" ? (
                <img
                  key={m.id}
                  src={m.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              ) : (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: "var(--accent)" }}
                >
                  View document
                </a>
              ),
            )}
          </div>
        )}

        {isOptionType ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((o, idx) => {
              const selected = (answers[q.id] || []).includes(o.id);
              const disabled =
                isMulti &&
                !selected &&
                (answers[q.id] || []).length >= correctCount;
              return (
                <label
                  key={o.id}
                  onClick={() => !disabled && toggleOption(o.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: selected
                      ? "1.5px solid var(--accent)"
                      : "1px solid #e5e7eb",
                    background: selected
                      ? "rgba(var(--accent-rgb),0.06)"
                      : disabled
                        ? "#f9fafb"
                        : "#fff",
                    borderRadius: 11,
                    padding: "12px 14px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#9ca3af",
                    }}
                  >
                    {formatLabel(idx, assessment.optionFormat)}
                  </span>
                  <span style={{ fontSize: 13.5, color: "#111827" }}>
                    {o.optionText}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <textarea
            value={answers[q.id] || ""}
            onChange={(e) => setAnswer(e.target.value)}
            rows={q.questionType === "long_answer" ? 8 : 3}
            placeholder="Type your answer..."
            style={{
              width: "100%",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13.5,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          style={{ ...navBtnStyle, opacity: currentIndex === 0 ? 0.4 : 1 }}
        >
          Previous
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            style={{
              ...navBtnStyle,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            style={{
              ...navBtnStyle,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
            }}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

const navBtnStyle = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
const continueBtnStyle = {
  width: "100%",
  marginTop: 18,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 11,
  padding: "12px 20px",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};
