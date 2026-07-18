import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { awardXP, loadStreak } from '../lib/courseProgress'
import { MissionControlHUD } from './MissionControlHUD'

beforeEach(() => {
  localStorage.clear()
  // jsdom doesn't implement matchMedia; useAnimatedNumber reads it to decide
  // whether to animate or jump straight to the target value.
  window.matchMedia = window.matchMedia ?? (() => ({ matches: true }) as MediaQueryList)
})

describe('MissionControlHUD', () => {
  it('shows the plan tier, current XP, and streak', () => {
    awardXP(80)
    render(<MissionControlHUD plan="pro" />)

    expect(screen.getByText('PRO')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it('touches the streak on mount, so just loading the dashboard counts as a visit', () => {
    expect(loadStreak().current).toBe(0)
    render(<MissionControlHUD plan="free" />)

    expect(loadStreak().current).toBe(1)
  })

  it('updates live when XP is awarded elsewhere, instead of staying stuck at its mount-time value', () => {
    render(<MissionControlHUD plan="free" />)
    expect(screen.getByText('0')).toBeInTheDocument()

    act(() => {
      awardXP(50)
    })

    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
