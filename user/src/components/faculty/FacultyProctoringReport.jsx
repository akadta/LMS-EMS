import { useState, useEffect } from "react";
import { Camera, Video, Copy, MousePointerClick, Eye, RotateCcw } from "lucide-react";
import { proctoringApi } from "../../api/proctoringApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

const ICONS = {
  snapshot: Camera, video_clip: Video, copy: Copy, paste: Copy,
  right_click: MousePointerClick, tab_switch: Eye, window_blur: Eye, refresh_attempt: RotateCcw,
};

export default function FacultyProctoringReport({ attemptId }) {
  const [events, setEvents] = useState(null);
  useEffect(() => { proctoringApi.getEvents(attemptId).then((res) => setEvents(res.data.data)); }, [attemptId]);

  if (!events) return <div style={{ fontSize: 12.5, color: "#9ca3af" }}>Loading proctoring data...</div>;
  if (events.length === 0) return <div style={{ fontSize: 12.5, color: "#9ca3af" }}>No proctoring data for this attempt.</div>;

  const snapshots = events.filter((e) => e.eventType === "snapshot");
  const clips = events.filter((e) => e.eventType === "video_clip");
  const violations = events.filter((e) => !["snapshot", "video_clip"].includes(e.eventType));

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: "#111827" }}>Violations ({violations.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
        {violations.map((e) => {
          const Icon = ICONS[e.eventType] || Eye;
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, background: "#fef2f2", color: "#dc2626", padding: "7px 10px", borderRadius: 8 }}>
              <Icon size={13} />
              <span style={{ flex: 1, textTransform: "capitalize" }}>{e.eventType.replace("_", " ")}</span>
              <span style={{ fontSize: 10.5, color: "#9ca3af" }}>{new Date(e.occurredAt).toLocaleString()}</span>
            </div>
          );
        })}
        {violations.length === 0 && <div style={{ fontSize: 12, color: "#9ca3af" }}>No violations recorded.</div>}
      </div>

     <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: "#111827" }}>Snapshots ({snapshots.length})</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 18 }}>
        {snapshots.map((s) => {
          const url = resolveImageUrl(s.filePath);
          return (
            <a key={s.id} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0" }} />
            </a>
          );
        })}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: "#111827" }}>Video Clips ({clips.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {clips.map((c) => (
          <video key={c.id} src={resolveImageUrl(c.filePath)} controls style={{ width: "100%", borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}