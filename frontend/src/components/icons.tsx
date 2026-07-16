export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5L6.5 12L13 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V4.75a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M8 1.5l1.98 4.13 4.52.62-3.27 3.24.79 4.5L8 11.8l-4.02 2.19.79-4.5-3.27-3.24 4.52-.62L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CardsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4.5" width="10" height="8" rx="1.5" transform="rotate(-8 1.5 4.5)" stroke="currentColor" strokeWidth="1.3" />
      <rect x="4" y="3.5" width="10" height="8" rx="1.5" fill="var(--panel, #10201d)" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function FlameIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5c.5 2 2.5 2.7 2.5 5.3 0 .9-.4 1.6-.9 2.1.7-.2 1.5-.9 1.7-2 .6.9.9 1.9.9 2.9 0 2.6-2 4.7-4.7 4.7S2.3 12.4 2.3 9.8c0-2.9 1.6-4.2 2.6-6 .3.8.3 1.7 0 2.3 1-.9 1.6-2.3 1.6-3.8.6.5 1.1 1.1 1.5 1.7Z"
        fill="currentColor"
      />
    </svg>
  )
}
