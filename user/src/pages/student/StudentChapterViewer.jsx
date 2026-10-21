import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation ,useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, X } from "lucide-react";
import { courseApi } from "../../api/courseApi";
import { studentLearningApi } from "../../api/studentLearningApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function StudentChapterViewer() {
const { chapterId } = useParams();
const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
 const [searchParams] = useSearchParams();
const courseId = searchParams.get("courseId");
const batchId = searchParams.get("batchId");

  useEffect(() => {
    setLoading(true);
    courseApi
      .getChapter(chapterId)
      .then((res) => {
        const d = res.data.data;
        setChapter({
          ...d,
          media: d.media.map((m) => ({ ...m, url: resolveImageUrl(m.url) })),
        });
      })
      .finally(() => setLoading(false));
  }, [chapterId]);

const [completing, setCompleting] = useState(true);

useEffect(() => {
  if (!chapter) return;
  setCompleting(true);
  studentLearningApi.completeChapter(chapterId).finally(() => setCompleting(false));
}, [chapter, chapterId]);

  if (loading || !chapter)
    return (
      <div
        style={{
          color: "#9ca3af",
          fontSize: 13.5,
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        Loading...
      </div>
    );

  const images = chapter.media.filter((m) => m.mediaType === "image");
  const videos = chapter.media.filter((m) => m.mediaType === "video");
  const docs = chapter.media.filter((m) => m.mediaType === "document");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
<button
  onClick={() => navigate(`/student/modules/${chapter.moduleId}/chapters${courseId ? `?courseId=${courseId}` : ""}${batchId ? `&batchId=${batchId}` : ""}`)}
  disabled={completing}
  style={{ ...backBtnStyle, opacity: completing ? 0.5 : 1, cursor: completing ? "default" : "pointer" }}
>
  <ArrowLeft size={15} /> {completing ? "Saving progress..." : "Back to chapters"}
</button>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 16,
        }}
      >
        {chapter.name}
      </div>

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
      wordBreak: "break-word",
      overflowWrap: "break-word",
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
