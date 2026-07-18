import { describe, expect, it } from 'vitest'
import { TRACKS } from './courseData'

describe('course data integrity', () => {
  it('gives every track a unique id', () => {
    const ids = TRACKS.map((track) => track.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every module a unique id within its track', () => {
    for (const track of TRACKS) {
      const ids = track.modules.map((module) => module.id)
      expect(new Set(ids).size, `duplicate module id in "${track.title}"`).toBe(ids.length)
    }
  })

  it('gives every module non-empty lesson content', () => {
    for (const track of TRACKS) {
      for (const module of track.modules) {
        expect(module.content.length, `"${track.title}" > "${module.title}" has no content`).toBeGreaterThan(0)
      }
    }
  })

  it('gives every module at least one quiz question, since ModuleLayout requires quiz.length > 0 to ever mark a module complete', () => {
    for (const track of TRACKS) {
      for (const module of track.modules) {
        expect(module.quiz.length, `"${track.title}" > "${module.title}" has no quiz questions`).toBeGreaterThan(0)
      }
    }
  })

  it('gives every quiz question exactly one correct option', () => {
    for (const track of TRACKS) {
      for (const module of track.modules) {
        for (const question of module.quiz) {
          const correctCount = question.options.filter((option) => option.correct).length
          expect(
            correctCount,
            `"${track.title}" > "${module.title}" > "${question.question}" has ${correctCount} correct options`,
          ).toBe(1)
        }
      }
    }
  })

  it('gives every quiz question at least two options', () => {
    for (const track of TRACKS) {
      for (const module of track.modules) {
        for (const question of module.quiz) {
          expect(
            question.options.length,
            `"${track.title}" > "${module.title}" > "${question.question}" has fewer than 2 options`,
          ).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })
})
