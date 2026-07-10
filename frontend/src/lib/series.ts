export const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)']

export const SERIES_SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const

export type SeriesShape = (typeof SERIES_SHAPES)[number]
