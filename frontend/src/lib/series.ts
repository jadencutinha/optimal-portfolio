export const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)']

export const SERIES_SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const

export type SeriesShape = (typeof SERIES_SHAPES)[number]

export const GOLD = '#d4af37'
export const GOLD_BRIGHT = '#f0d98c'
export const GOLD_DEEP = '#8a6a1f'
export const IVORY = '#ede7da'
export const SLATE = '#8a8f98'

export const METALLIC_SERIES = [
  '#d4af37',
  '#ede7da',
  '#b08d57',
  '#8a8f98',
  '#f0d98c',
  '#c0c4cc',
  '#8a6a1f',
  '#6e6a62',
  '#e0c98a',
  '#4a4e56',
]

export const metallicAt = (index: number) => METALLIC_SERIES[index % METALLIC_SERIES.length]

export const GAME_COLORS = ['#f0d98c', '#6fb3dd', '#2fd6a4', '#e8705f', '#c58cf0', '#f0a56f']
