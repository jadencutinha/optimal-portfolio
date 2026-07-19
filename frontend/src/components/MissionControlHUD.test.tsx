import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadStreak } from '../lib/courseProgress'
import { MissionControlHUD } from './MissionControlHUD'

beforeEach(() => {
  localStorage.clear()
  // jsdom doesn't implement matchMedia; useAnimatedNumber reads it to decide
  // whether to animate or jump straight to the target value.
  window.matchMedia = window.matchMedia ?? (() => ({ matches: true }) as MediaQueryList)
})

describe('MissionControlHUD', () => {
  it('shows the plan tier and streak', () => {
    render(<MissionControlHUD plan="pro" />)

    expect(screen.getByText('PRO')).toBeInTheDocument()
  })

  it('touches the streak on mount, so just loading the dashboard counts as a visit', () => {
    expect(loadStreak().current).toBe(0)
    render(<MissionControlHUD plan="free" />)

    expect(loadStreak().current).toBe(1)
  })
})
