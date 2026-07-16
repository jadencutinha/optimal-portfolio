import { useEffect, useState } from 'react'
import { FLASHCARDS, type Flashcard } from '../data/flashcards'

interface Props {
  onClose: () => void
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function Flashcards({ onClose }: Props) {
  const [order, setOrder] = useState<Flashcard[]>(FLASHCARDS)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      else if (event.key === ' ') {
        event.preventDefault()
        setFlipped((f) => !f)
      } else if (event.key === 'ArrowRight') goNext()
      else if (event.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, order.length])

  const card = order[index]
  const progressPct = Math.round(((index + 1) / order.length) * 100)

  function goNext() {
    setFlipped(false)
    setIndex((i) => Math.min(i + 1, order.length - 1))
  }

  function goPrev() {
    setFlipped(false)
    setIndex((i) => Math.max(i - 1, 0))
  }

  function markKnown() {
    setKnown((prev) => new Set(prev).add(card.term))
    goNext()
  }

  function restart({ withShuffle }: { withShuffle: boolean }) {
    setOrder(withShuffle ? shuffle(FLASHCARDS) : FLASHCARDS)
    setIndex(0)
    setFlipped(false)
    setKnown(new Set())
  }

  const isLast = index === order.length - 1

  return (
    <div className="flashcards-shell">
      <div className="flashcards-head">
        <button type="button" className="sidebar-back" onClick={onClose}>
          ← Back
        </button>
        <span className="flashcards-track-name">Course Flashcards</span>
      </div>

      <div className="flashcards-progress">
        <span className="flashcards-progress-label">
          {index + 1} / {order.length} · {known.size} known
        </span>
        <div className="flashcards-progress-track">
          <div className="flashcards-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <button
        type="button"
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Showing definition, click to flip back' : 'Showing term, click to reveal definition'}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <span className="flashcard-eyebrow">{card.category}</span>
            <p className="flashcard-text">{card.term}</p>
            <span className="flashcard-hint">Click or press space to flip</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="flashcard-eyebrow">Definition</span>
            <p className="flashcard-text flashcard-definition">{card.definition}</p>
          </div>
        </div>
      </button>

      <div className="flashcards-controls">
        <button type="button" className="module-nav-btn" onClick={goPrev} disabled={index === 0}>
          ← Prev
        </button>
        <button type="button" className="flashcard-known-btn" onClick={markKnown}>
          {isLast ? 'Got it · Finish' : 'Got it →'}
        </button>
        <button type="button" className="module-nav-btn" onClick={goNext} disabled={isLast}>
          Next →
        </button>
      </div>

      <div className="flashcards-footer">
        <button type="button" className="flashcards-shuffle-btn" onClick={() => restart({ withShuffle: true })}>
          Shuffle & restart
        </button>
        <button type="button" className="flashcards-shuffle-btn" onClick={() => restart({ withShuffle: false })}>
          Restart in order
        </button>
      </div>
    </div>
  )
}
