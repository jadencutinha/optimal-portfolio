const KEY = 'course_progress_v1'

export type CourseProgress = Record<string, boolean>

export function moduleKey(trackId: number, moduleId: number): string {
  return `${trackId}:${moduleId}`
}

export function loadProgress(): CourseProgress {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CourseProgress) : {}
  } catch {
    return {}
  }
}

export function saveProgress(progress: CourseProgress): void {
  localStorage.setItem(KEY, JSON.stringify(progress))
}
