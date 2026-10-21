import { useEffect, useRef, useState, useCallback } from "react";
import { proctoringApi } from "../api/proctoringApi";

export function useProctoringMonitor(assessmentId, attemptId, onAutoSubmit) {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | not_required
  const [warning, setWarning] = useState(null);
  const streamRef = useRef(null);
  const videoElRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    proctoringApi.getSettingsForStudent(assessmentId).then((res) => {
      setSettings(res.data.data);
      if (!res.data.data) setStatus("not_required");
    });
  }, [assessmentId]);

  const requestMedia = useCallback(async () => {
    if (!settings) return false;
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: settings.requireCamera,
        audio: settings.requireMicrophone,
      });
      streamRef.current = stream;
      setStatus("active");
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, [settings]);

  const flash = (msg) => {
    if (!settings?.showWarningsToStudent) return;
    setWarning(msg);
    setTimeout(() => setWarning(null), 3500);
  };

  const logEvent = useCallback(async (eventType, detail) => {
    if (!attemptId) return;
    const res = await proctoringApi.logEvent(attemptId, { eventType, detail });
    if (res.data.data?.shouldAutoSubmit) onAutoSubmit?.();
  }, [attemptId, onAutoSubmit]);

  const captureSnapshot = useCallback(async () => {
    if (!streamRef.current || !attemptId) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const video = document.createElement("video");
    video.srcObject = streamRef.current;
    await video.play();
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 240;
    canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fd = new FormData();
      fd.append("file", blob, "snapshot.jpg");
      await proctoringApi.uploadSnapshot(attemptId, fd);
    }, "image/jpeg", 0.7);
  }, [attemptId]);

  // start monitoring once active
  useEffect(() => {
    if (status !== "active" || !settings || !attemptId) return;

    // snapshots
    let snapshotTimer;
    if (settings.takeSnapshots) {
      const schedule = () => {
        const delay = settings.snapshotMode === "fixed"
          ? settings.snapshotFixedSeconds * 1000
          : (settings.snapshotMinSeconds + Math.random() * (settings.snapshotMaxSeconds - settings.snapshotMinSeconds)) * 1000;
        snapshotTimer = setTimeout(() => { captureSnapshot(); schedule(); }, delay);
      };
      schedule();
    }

    // continuous video recording, uploaded as periodic chunks (acts as both "always recording" and violation clips)
    if (settings.recordVideo && streamRef.current) {
      try {
        const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
        recorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          if (chunksRef.current.length === 0) return;
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          chunksRef.current = [];
          const fd = new FormData();
          fd.append("file", blob, "clip.webm");
          fd.append("reason", "periodic");
          await proctoringApi.uploadVideoClip(attemptId, fd);
        };
        recorder.start();
        // flush every 60s into a new clip
        var recTimer = setInterval(() => { recorder.stop(); recorder.start(); }, 60000);
      } catch { /* MediaRecorder unsupported — skip video */ }
    }

    // violation listeners
    const onVisibility = () => {
      if (document.hidden && settings.blockTabSwitch) { flash("Tab switch detected — this has been logged."); logEvent("tab_switch"); }
    };
    const onBlur = () => { if (settings.blockTabSwitch) { flash("Window lost focus — this has been logged."); logEvent("window_blur"); } };
    const onCopy = (e) => { if (settings.blockCopyPaste) { e.preventDefault(); flash("Copying is disabled during this exam."); logEvent("copy"); } };
    const onPaste = (e) => { if (settings.blockCopyPaste) { e.preventDefault(); flash("Pasting is disabled during this exam."); logEvent("paste"); } };
    const onContextMenu = (e) => { if (settings.blockRightClick) { e.preventDefault(); flash("Right-click is disabled during this exam."); logEvent("right_click"); } };
    const onBeforeUnload = (e) => {
      if (settings.warnOnRefreshAttempt) {
        logEvent("refresh_attempt");
        e.preventDefault();
        e.returnValue = "";
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearTimeout(snapshotTimer);
      clearInterval(recTimer);
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("beforeunload", onBeforeUnload);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [status, settings, attemptId, captureSnapshot, logEvent]);

  return { settings, status, warning, requestMedia };
}