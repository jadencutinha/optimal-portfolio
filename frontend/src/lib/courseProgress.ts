const KEY = 'course_progress_v1'
const COMPLETIONS_KEY = 'course_completions_v1'
const MASTERY_KEY = 'course_mastery_v1'
const STREAK_KEY = 'course_streak_v1'
const KNOWN_FLASHCARDS_KEY = 'course_known_flashcards_v1'

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

// 3 stars for a first-try perfect run, fewer for each retake it took.
export function starsForRetakes(retakes: number): number {
  if (retakes <= 0) return 3
  if (retakes === 1) return 2
  return 1
}

export type MasteryMap = Record<string, number>

export function loadMastery(): MasteryMap {
  try {
    const raw = localStorage.getItem(MASTERY_KEY)
    return raw ? (JSON.parse(raw) as MasteryMap) : {}
  } catch {
    return {}
  }
}

// Records the best mastery a module has ever earned, so a worse retake later can't downgrade it.
export function recordMastery(trackId: number, moduleId: number, retakes: number): number {
  const stars = starsForRetakes(retakes)
  const mastery = loadMastery()
  const key = moduleKey(trackId, moduleId)
  const best = Math.max(mastery[key] ?? 0, stars)
  mastery[key] = best
  localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery))
  return stars
}

// The learner's in-progress quiz answers per module, so a quiz keeps the picks
// they already made when they leave the module, the platform, or the account.
export interface QuizAttempt {
  answers: Record<number, number>
  retakes: number
}

function loadQuizAttempts(): Record<string, QuizAttempt> {
  try {
    const raw = localStorage.getItem(QUIZ_STATE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, QuizAttempt>) : {}
  } catch {
    return {}
  }
}

export function loadQuizAttempt(trackId: number, moduleId: number): QuizAttempt {
  const attempt = loadQuizAttempts()[moduleKey(trackId, moduleId)]
  return attempt ?? { answers: {}, retakes: 0 }
}

export function saveQuizAttempt(trackId: number, moduleId: number, attempt: QuizAttempt): void {
  const attempts = loadQuizAttempts()
  attempts[moduleKey(trackId, moduleId)] = attempt
  localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(attempts))
}

export interface StreakState {
  current: number
  longest: number
  lastActiveDate: string | null
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    return raw ? (JSON.parse(raw) as StreakState) : { current: 0, longest: 0, lastActiveDate: null }
  } catch {
    return { current: 0, longest: 0, lastActiveDate: null }
  }
}

// Call on any site visit (dashboard load) or learning action (module completed).
// Same-day calls are idempotent; a gap of more than one day resets the streak instead of extending it.
export function touchStreak(): StreakState {
  const state = loadStreak()
  const now = today()

  if (state.lastActiveDate === now) {
    return state
  }

  const gap = state.lastActiveDate ? daysBetween(state.lastActiveDate, now) : null
  const current = gap === 1 ? state.current + 1 : 1
  const next: StreakState = {
    current,
    longest: Math.max(state.longest, current),
    lastActiveDate: now,
  }
  localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next
}

// Flashcard terms the learner has marked "Got it", keyed by term text so the
// set survives the deck being reordered or extended.
export function loadKnownFlashcards(): Set<string> {
  try {
    const raw = localStorage.getItem(KNOWN_FLASHCARDS_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function saveKnownFlashcards(known: Set<string>): void {
  localStorage.setItem(KNOWN_FLASHCARDS_KEY, JSON.stringify([...known]))
}
