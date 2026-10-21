import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  X,
} from "lucide-react";
import { courseApi } from "../../api/courseApi";
import { assessmentApi } from "../../api/assessmentApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

import {
  loadProgress,
  markChapterComplete,
  isGateRequired,
  isAssessmentSatisfied,
} from "../../utils/demoProgress";
import DemoHeader from "../../components/demo/DemoHeader";

export default function ChapterViewerDemo() {
  const { courseId, moduleId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    courseApi
      .getChapter(chapterId)
      .then(async (res) => {
        const c = res.data.data;
        c.media = c.media.map((m) => ({ ...m, url: resolveImageUrl(m.url) }));
        setChapter(c);
        if (c.isFinalAssessment) {
          const aRes = await assessmentApi.forEntity("chapter", chapterId);
          setAssessment(aRes.data.data);
        }
        setProgress(loadProgress(courseId));
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

  if (loading || !chapter || !progress)
    return <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>;

  const isDone = progress.completedChapterIds.includes(chapter.id);
  const gateRequired = chapter.isFinalAssessment && isGateRequired(assessment);
  const gateSatisfied =
    !gateRequired || isAssessmentSatisfied(progress, assessment.id);

  const handleComplete = () => {
    markChapterComplete(courseId, chapter.id);
    if (gateRequired && !gateSatisfied) {
      navigate(`/courses/${courseId}/demo/assessment/${assessment.id}`, {
        state: {
          scope: "chapter",
          chapterId,
          moduleId,
          returnPath: `/courses/${courseId}/demo/modules/${moduleId}`,
        },
      });
    } else {
      navigate(`/courses/${courseId}/demo/modules/${moduleId}`);
    }
  };

  const images = chapter.media.filter((m) => m.mediaType === "image");
  const videos = chapter.media.filter((m) => m.mediaType === "video");
  const docs = chapter.media.filter((m) => m.mediaType === "document");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <DemoHeader
        title={chapter.name}
        onBack={() => navigate(`/courses/${courseId}/demo/modules/${moduleId}`)}
      />

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          padding: 24,
        }}
      >
        {chapter.description && (
          <div
            style={{
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.7,
              marginBottom: 22,
              whiteSpace: "pre-wrap",
            }}
          >
            {chapter.description}
          </div>
        )}

        {videos.map((v) => (
          <video
            key={v.id}
            src={v.url}
            controls
            style={{
              width: "100%",
              borderRadius: 12,
              marginBottom: 16,
              background: "#000",
            }}
          />
        ))}

        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                onClick={() => setLightbox(img.url)}
                style={{
                  width: "100%",
                  height: 110,
                  objectFit: "cover",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}

        {docs.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {docs.map((d) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #f0f0f0",
                  borderRadius: 10,
                  padding: "10px 14px",
                  textDecoration: "none",
                  color: "#374151",
                  fontSize: 13,
                }}
              >
                <FileText size={16} color="var(--accent)" />{" "}
                {d.url.split("/").pop()}
              </a>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 10,
            paddingTop: 20,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          {isDone && gateSatisfied ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#16a34a",
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={17} /> Chapter Completed
            </div>
          ) : isDone && gateRequired && !gateSatisfied ? (
            <button
              onClick={() =>
                navigate(
                  `/courses/${courseId}/demo/assessment/${assessment.id}`,
                  {
                    state: {
                      scope: "chapter",
                      chapterId,
                      moduleId,
                      returnPath: `/courses/${courseId}/demo/modules/${moduleId}`,
                    },
                  },
                )
              }
              style={ctaBtnStyle}
            >
              <Sparkles size={15} /> Take Chapter Assessment
            </button>
          ) : (
            <button onClick={handleComplete} style={ctaBtnStyle}>
              <PlayCircle size={15} /> Mark as Complete
              {gateRequired ? " & Continue to Assessment" : ""}
            </button>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 400,
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
          <img
            src={lightbox}
            alt=""
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              borderRadius: 10,
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}

const ctaBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 11,
  padding: "12px 20px",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};
