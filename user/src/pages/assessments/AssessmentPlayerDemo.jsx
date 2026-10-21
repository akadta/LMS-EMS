import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, Send } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { formatLabel } from "../../utils/labelFormat";
import {
  shuffleArray,
  recordAssessmentResult,
  markModuleComplete,
  markCourseComplete,
} from "../../utils/demoProgress";

export default function AssessmentPlayerDemo() {
  const { courseId, assessmentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const scope = state?.scope || "chapter";
  const returnPath = state?.returnPath || `/courses/${courseId}/demo`;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [examSecondsLeft, setExamSecondsLeft] = useState(null);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    Promise.all([
      assessmentApi.get(assessmentId),
      assessmentApi.listQuestions(assessmentId),
    ]).then(([aRes, qRes]) => {
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
      if (a.isTimer && a.timerScope === "per_exam") {
        setExamSecondsLeft(
          (a.timerValue || 0) * (a.timerUnit === "minutes" ? 60 : 1),
        );
      }
      setLoading(false);
    });
  }, [assessmentId]);

  // per-exam countdown
  useEffect(() => {
    if (examSecondsLeft === null || submitted) return;
    if (examSecondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setExamSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [examSecondsLeft, submitted]);

  // per-question countdown
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

  const q = questions[currentIndex];
  const isOptionType =
    q?.questionType === "mcq_single" || q?.questionType === "mcq_multi";

  const setAnswer = (val) => setAnswers((prev) => ({ ...prev, [q.id]: val }));

  const toggleOption = (optId) => {
    if (q.questionType === "mcq_single") {
      setAnswer([optId]);
    } else {
      const cur = answers[q.id] || [];
      setAnswer(
        cur.includes(optId)
          ? cur.filter((id) => id !== optId)
          : [...cur, optId],
      );
    }
  };

  function gradeQuestion(question) {
    const selected = answers[question.id] || [];
    const correctIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id);
    if (question.markingMode === "per_option") {
      const possible = question.options
        .filter((o) => o.isCorrect)
        .reduce((s, o) => s + (o.mark || 0), 0);
      const awarded = question.options
        .filter((o) => o.isCorrect && selected.includes(o.id))
        .reduce((s, o) => s + (o.mark || 0), 0);
      return { possible, awarded };
    }
    const possible = question.mark || 0;
    const fullyCorrect =
      correctIds.length === selected.length &&
      correctIds.every((id) => selected.includes(id));
    return { possible, awarded: fullyCorrect ? possible : 0 };
  }

  const handleSubmit = (auto = false) => {
    if (submitted) return;
    if (autoSubmitRef.current && !auto) return;
    autoSubmitRef.current = true;
    setSubmitted(true);

    let finalResult;
    if (assessment.mode === "instant") {
      let totalPossible = 0,
        totalAwarded = 0;
      const breakdown = questions.map((question) => {
        const g = gradeQuestion(question);
        totalPossible += g.possible;
        totalAwarded += g.awarded;
        return { question, selected: answers[question.id] || [], ...g };
      });
      const percent =
        totalPossible > 0
          ? Math.round((totalAwarded / totalPossible) * 100)
          : 0;
      const passed =
        assessment.passPercentage != null
          ? percent >= assessment.passPercentage
          : null;
      const grade =
        assessment.grades.find(
          (gr) => percent >= gr.minPercentage && percent <= gr.maxPercentage,
        )?.label || null;
      finalResult = {
        mode: "instant",
        totalPossible,
        totalAwarded,
        percent,
        passed,
        grade,
        breakdown,
      };
    } else {
      finalResult = { mode: "review" };
    }
    setResult(finalResult);
  };

  const handleContinue = () => {
    recordAssessmentResult(courseId, assessmentId, {
      mode: assessment.mode,
      percent: result.percent ?? null,
      passed: result.passed ?? null,
      grade: result.grade ?? null,
      completedAt: Date.now(),
    });
    if (scope === "module")
      markModuleComplete(courseId, Number(state.moduleId));
    if (scope === "course") markCourseComplete(courseId);
    navigate(returnPath);
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (submitted && result) {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto" }}>
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
              Your answers have been submitted. Results for this assessment are
              released after manual review.
            </div>
            <button onClick={handleContinue} style={continueBtnStyle}>
              Continue
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                background: result.passed
                  ? "linear-gradient(135deg, #16a34a, #22c55e)"
                  : "linear-gradient(135deg, #dc2626, #ef4444)",
                borderRadius: 18,
                padding: "32px 24px",
                textAlign: "center",
                color: "#fff",
                marginBottom: 20,
              }}
            >
              {result.passed ? (
                <CheckCircle2 size={34} style={{ marginBottom: 10 }} />
              ) : (
                <XCircle size={34} style={{ marginBottom: 10 }} />
              )}
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {result.percent}%
              </div>
              <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4 }}>
                {result.totalAwarded} / {result.totalPossible} marks
                {result.grade && ` · Grade ${result.grade}`}
                {result.passed != null &&
                  (result.passed ? " · Passed" : " · Not Passed")}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {result.breakdown.map((b, idx) => (
                <div
                  key={b.question.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #f0f0f0",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {formatLabel(idx, assessment.questionFormat)}.{" "}
                      {b.question.questionText}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          b.awarded === b.possible
                            ? "#16a34a"
                            : b.awarded > 0
                              ? "#d97706"
                              : "#dc2626",
                        flexShrink: 0,
                      }}
                    >
                      {b.awarded}/{b.possible}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {b.question.options.map((o) => {
                      const wasSelected = b.selected.includes(o.id);
                      const bg = o.isCorrect
                        ? "#dcfce7"
                        : wasSelected
                          ? "#fee2e2"
                          : "transparent";
                      const color = o.isCorrect
                        ? "#16a34a"
                        : wasSelected
                          ? "#dc2626"
                          : "#6b7280";
                      return (
                        <div
                          key={o.id}
                          style={{
                            fontSize: 12,
                            padding: "5px 9px",
                            borderRadius: 7,
                            background: bg,
                            color,
                          }}
                        >
                          {o.optionText} {o.isCorrect && "✓"}{" "}
                          {wasSelected && !o.isCorrect && "(your answer)"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleContinue} style={continueBtnStyle}>
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
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
        style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}
      >
        {questions.map((qq, idx) => (
          <button
            key={qq.id}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border:
                idx === currentIndex
                  ? "1.5px solid var(--accent)"
                  : "1px solid #e5e7eb",
              background: answers[qq.id]
                ? "rgba(var(--accent-rgb),0.12)"
                : "#fff",
              color: idx === currentIndex ? "var(--accent)" : "#374151",
            }}
          >
            {formatLabel(idx, assessment.questionFormat)}
          </button>
        ))}
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
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          {q.questionText}
        </div>

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
              return (
                <label
                  key={o.id}
                  onClick={() => toggleOption(o.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: selected
                      ? "1.5px solid var(--accent)"
                      : "1px solid #e5e7eb",
                    background: selected
                      ? "rgba(var(--accent-rgb),0.06)"
                      : "#fff",
                    borderRadius: 11,
                    padding: "12px 14px",
                    cursor: "pointer",
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
