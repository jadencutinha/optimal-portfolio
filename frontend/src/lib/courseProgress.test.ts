import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureTrackCompletion,
  loadMastery,
  loadProgress,
  loadQuizAttempt,
  loadStreak,
  moduleKey,
  recordMastery,
  saveProgress,
  saveQuizAttempt,
  starsForRetakes,
  touchStreak,
} from './courseProgress'

beforeEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

describe('moduleKey', () => {
  it('combines track and module id into a stable key', () => {
    expect(moduleKey(3, 7)).toBe('3:7')
  })
})

describe('progress', () => {
  it('round-trips through localStorage', () => {
    expect(loadProgress()).toEqual({})
    saveProgress({ '1:1': true })
    expect(loadProgress()).toEqual({ '1:1': true })
  })
})

// JSON.parse throws a real runtime error on malformed input, and localStorage
// content isn't type-checked by TypeScript at all -- it's just a string that
// could have been corrupted, truncated, or hand-edited. Each loader wraps its
// parse in try/catch specifically to survive that; these tests prove it.
describe('malformed localStorage data', () => {
  it('loadProgress falls back to {} instead of throwing on invalid JSON', () => {
    localStorage.setItem('course_progress_v1', '{not valid json')
    expect(loadProgress()).toEqual({})
  })

  it('loadMastery falls back to {} instead of throwing on invalid JSON', () => {
    localStorage.setItem('course_mastery_v1', '{not valid json')
    expect(loadMastery()).toEqual({})
  })

  it('loadStreak falls back to a fresh streak instead of throwing on invalid JSON', () => {
    localStorage.setItem('course_streak_v1', '{not valid json')
    expect(loadStreak()).toEqual({ current: 0, longest: 0, lastActiveDate: null })
  })
})

describe('ensureTrackCompletion', () => {
  it('creates a completion record the first time and reuses it after', () => {
    const first = ensureTrackCompletion(2)
    expect(first.credentialId).toMatch(/^PORTU-2-/)

    const second = ensureTrackCompletion(2)
    expect(second).toEqual(first)
  })

  it('gives different tracks independent credential ids', () => {
    const a = ensureTrackCompletion(1)
    const b = ensureTrackCompletion(2)
    expect(a.credentialId).not.toBe(b.credentialId)
  })
})

describe('starsForRetakes', () => {
  it('gives 3 stars for a first-try perfect run', () => {
    expect(starsForRetakes(0)).toBe(3)
  })

  it('gives 2 stars after one retake', () => {
    expect(starsForRetakes(1)).toBe(2)
  })

  it('gives 1 star after two or more retakes', () => {
    expect(starsForRetakes(2)).toBe(1)
    expect(starsForRetakes(5)).toBe(1)
  })
})

describe('recordMastery', () => {
  it('records the star rating for a module', () => {
    const stars = recordMastery(1, 1, 0)
    expect(stars).toBe(3)
    expect(loadMastery()).toEqual({ '1:1': 3 })
  })

  it('never downgrades a module that already earned a better rating', () => {
    recordMastery(1, 1, 0) // 3 stars
    const stars = recordMastery(1, 1, 5) // a later, worse retake run: 1 star
    expect(stars).toBe(1) // the run itself is still reported as 1 star...
    expect(loadMastery()['1:1']).toBe(3) // ...but the stored best stays at 3
  })
})

describe('quiz attempts', () => {
  it('returns an empty attempt for a module that has never been answered', () => {
    expect(loadQuizAttempt(1, 1)).toEqual({ answers: {}, retakes: 0 })
  })

  it('round-trips a saved attempt through localStorage', () => {
    saveQuizAttempt(1, 2, { answers: { 0: 1, 1: 0 }, retakes: 1 })
    expect(loadQuizAttempt(1, 2)).toEqual({ answers: { 0: 1, 1: 0 }, retakes: 1 })
  })

  it('keeps attempts for different modules independent', () => {
    saveQuizAttempt(1, 1, { answers: { 0: 0 }, retakes: 0 })
    saveQuizAttempt(1, 2, { answers: { 0: 1 }, retakes: 2 })
    expect(loadQuizAttempt(1, 1)).toEqual({ answers: { 0: 0 }, retakes: 0 })
    expect(loadQuizAttempt(1, 2)).toEqual({ answers: { 0: 1 }, retakes: 2 })
  })

  it('falls back to an empty attempt instead of throwing on invalid JSON', () => {
    localStorage.setItem('course_quiz_state_v1', '{not valid json')
    expect(loadQuizAttempt(1, 1)).toEqual({ answers: {}, retakes: 0 })
  })
})

describe('touchStreak', () => {
  beforeEach(() => vi.useFakeTimers())

  const setNow = (iso: string) => vi.setSystemTime(new Date(iso))

  it('starts a 1-day streak on first use', () => {
    setNow('2026-01-01T12:00:00Z')
    const state = touchStreak()
    expect(state).toEqual({ current: 1, longest: 1, lastActiveDate: '2026-01-01' })
  })

  it('is idempotent for repeated calls on the same day', () => {
    setNow('2026-01-01T09:00:00Z')
    touchStreak()
    setNow('2026-01-01T21:00:00Z')
    const state = touchStreak()
    expect(state.current).toBe(1)
  })

  it('extends the streak on a consecutive day', () => {
    setNow('2026-01-01T12:00:00Z')
    touchStreak()
    setNow('2026-01-02T12:00:00Z')
    const state = touchStreak()
    expect(state.current).toBe(2)
    expect(state.longest).toBe(2)
  })

  it('resets to 1 after a gap of more than a day', () => {
    setNow('2026-01-01T12:00:00Z')
    touchStreak()
    setNow('2026-01-05T12:00:00Z')
    const state = touchStreak()
    expect(state.current).toBe(1)
    expect(state.longest).toBe(1) // longest from the earlier 1-day run isn't beaten
  })

  it('keeps the longest streak on record even after a reset', () => {
    setNow('2026-01-01T12:00:00Z')
    touchStreak()
    setNow('2026-01-02T12:00:00Z')
    touchStreak()
    setNow('2026-01-03T12:00:00Z')
    touchStreak() // current 3, longest 3
    setNow('2026-01-10T12:00:00Z')
    const state = touchStreak() // gap resets current to 1
    expect(state.current).toBe(1)
    expect(state.longest).toBe(3)
  })

  it('reflects loadStreak immediately after touching', () => {
    setNow('2026-02-01T12:00:00Z')
    touchStreak()
    expect(loadStreak().current).toBe(1)
  })
})
