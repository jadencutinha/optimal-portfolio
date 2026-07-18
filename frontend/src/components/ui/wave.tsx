import type { ComponentProps } from 'react'

const WAVE_BAR_HEIGHTS = ['50%', '75%', '100%', '75%', '50%'] as const

function Wave({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span role="status" className={['wave', className].filter(Boolean).join(' ')} {...props}>
      {WAVE_BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="wave__bar"
          style={{
            width: '12.5%',
            height,
            animationDelay: `calc(var(--wave-delay, 100ms) * ${index})`,
          }}
        />
      ))}
      <span className="wave__sr">Loading</span>
    </span>
  )
}

export { Wave }

export default Wave
