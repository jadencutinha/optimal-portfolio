import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  awardXP,
  ensureTrackCompletion,
  loadMastery,
  loadProgress,
  loadStreak,
  loadXP,
  moduleKey,
  onXPChange,
  recordMastery,
  saveProgress,
  starsForRetakes,
  touchStreak,
  xpForStars,
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

describe('xp', () => {
  it('starts at 0 and accumulates across awards', () => {
    expect(loadXP()).toBe(0)
    awardXP(50)
    expect(loadXP()).toBe(50)
    awardXP(30)
    expect(loadXP()).toBe(80)
  })

  it('notifies subscribers with the running total, not just the delta', () => {
    const handler = vi.fn()
    const unsubscribe = onXPChange(handler)

    awardXP(50)
    awardXP(15)

    expect(handler).toHaveBeenNthCalledWith(1, 50)
    expect(handler).toHaveBeenNthCalledWith(2, 65)

    unsubscribe()
    awardXP(100)
    expect(handler).toHaveBeenCalledTimes(2)
  })
})

describe('starsForRetakes / xpForStars', () => {
  it('gives 3 stars and 50 XP for a first-try perfect run', () => {
    expect(starsForRetakes(0)).toBe(3)
    expect(xpForStars(3)).toBe(50)
  })

  it('gives 2 stars and 30 XP after one retake', () => {
    expect(starsForRetakes(1)).toBe(2)
    expect(xpForStars(2)).toBe(30)
  })

  it('gives 1 star and 15 XP after two or more retakes', () => {
    expect(starsForRetakes(2)).toBe(1)
    expect(starsForRetakes(5)).toBe(1)
    expect(xpForStars(1)).toBe(15)
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
