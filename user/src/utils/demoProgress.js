const keyFor = (courseId) => `lms_demo_progress_${courseId}`;

function emptyProgress() {
  return {
    completedChapterIds: [],
    completedModuleIds: [],
    courseCompleted: false,
    assessmentResults: {}, // { [assessmentId]: { attempted, mode, percent, passed, grade, completedAt } }
  };
}

export function loadProgress(courseId) {
  try {
    const raw = localStorage.getItem(keyFor(courseId));
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(courseId, progress) {
  localStorage.setItem(keyFor(courseId), JSON.stringify(progress));
}

export function resetProgress(courseId) {
  localStorage.removeItem(keyFor(courseId));
}

export function markChapterComplete(courseId, chapterId) {
  const p = loadProgress(courseId);
  if (!p.completedChapterIds.includes(chapterId)) {
    p.completedChapterIds.push(chapterId);
    saveProgress(courseId, p);
  }
  return p;
}

export function markModuleComplete(courseId, moduleId) {
  const p = loadProgress(courseId);
  if (!p.completedModuleIds.includes(moduleId)) {
    p.completedModuleIds.push(moduleId);
    saveProgress(courseId, p);
  }
  return p;
}

export function markCourseComplete(courseId) {
  const p = loadProgress(courseId);
  p.courseCompleted = true;
  saveProgress(courseId, p);
  return p;
}

export function recordAssessmentResult(courseId, assessmentId, result) {
  const p = loadProgress(courseId);
  p.assessmentResults[assessmentId] = { attempted: true, ...result };
  saveProgress(courseId, p);
  return p;
}

export function isAssessmentSatisfied(progress, assessmentId) {
  return !!progress.assessmentResults[assessmentId]?.attempted;
}

export function isGateRequired(assessment) {
  return (
    !!assessment &&
    assessment.isPublished &&
    assessment.isActive &&
    assessment.questionCount > 0
  );
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
