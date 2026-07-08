const KEY = 'course_progress_v1'
const COMPLETIONS_KEY = 'course_completions_v1'

export type CourseProgress = Record<string, boolean>

export interface TrackCompletion {
  completedAt: string
  credentialId: string
}

type CompletionMap = Record<number, TrackCompletion>

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

function loadCompletions(): CompletionMap {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    return raw ? (JSON.parse(raw) as CompletionMap) : {}
  } catch {
    return {}
  }
}

function generateCredentialId(trackId: number): string {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `PORTU-${trackId}-${random}`
}

// Returns the existing completion record for a track, creating one the
// first time it's called after the track reaches 100%, so the
// certificate's issue date and credential ID stay stable afterward.
export function ensureTrackCompletion(trackId: number): TrackCompletion {
  const completions = loadCompletions()
  const existing = completions[trackId]
  if (existing) return existing

  const completion: TrackCompletion = {
    completedAt: new Date().toISOString(),
    credentialId: generateCredentialId(trackId),
  }
  completions[trackId] = completion
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions))
  return completion
}
