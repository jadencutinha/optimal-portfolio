import { useEffect, useState } from 'react'
import { FLASHCARDS, type Flashcard } from '../data/flashcards'
import { loadKnownFlashcards, saveKnownFlashcards } from '../lib/courseProgress'

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

function deckFor(unknownOnly: boolean, known: Set<string>): Flashcard[] {
  return unknownOnly ? FLASHCARDS.filter((c) => !known.has(c.term)) : FLASHCARDS
}

export function Flashcards({ onClose }: Props) {
  const [known, setKnown] = useState<Set<string>>(() => loadKnownFlashcards())
  const [unknownOnly, setUnknownOnly] = useState(false)
  const [order, setOrder] = useState<Flashcard[]>(() => deckFor(false, known))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

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
  const progressPct = order.length > 0 ? Math.round(((index + 1) / order.length) * 100) : 100

  function goNext() {
    if (order.length === 0) return
    setFlipped(false)
    setIndex((i) => Math.min(i + 1, order.length - 1))
  }

  function goPrev() {
    if (order.length === 0) return
    setFlipped(false)
    setIndex((i) => Math.max(i - 1, 0))
  }

  function markKnown() {
    if (!card) return
    const next = new Set(known).add(card.term)
    setKnown(next)
    saveKnownFlashcards(next)
    if (unknownOnly) {
      const remaining = deckFor(true, next)
      setOrder(remaining)
      setIndex((i) => Math.min(i, Math.max(remaining.length - 1, 0)))
      setFlipped(false)
    } else {
      goNext()
    }
  }

  function toggleUnknownOnly() {
    setUnknownOnly((prev) => {
      const next = !prev
      setOrder(deckFor(next, known))
      setIndex(0)
      setFlipped(false)
      return next
    })
  }

  function forgetKnown() {
    setKnown(new Set())
    saveKnownFlashcards(new Set())
    setOrder(deckFor(unknownOnly, new Set()))
    setIndex(0)
    setFlipped(false)
  }

  function restart({ withShuffle }: { withShuffle: boolean }) {
    const base = deckFor(unknownOnly, known)
    setOrder(withShuffle ? shuffle(base) : base)
    setIndex(0)
    setFlipped(false)
  }

  const isLast = order.length === 0 || index === order.length - 1

  return (
    <div className="flashcards-shell">
      <div className="flashcards-head">
        <button type="button" className="sidebar-back" onClick={onClose}>
          ← Back
        </button>
        <span className="flashcards-track-name">Course Flashcards</span>
        <button
          type="button"
          className={`flashcards-filter-btn ${unknownOnly ? 'is-active' : ''}`}
          onClick={toggleUnknownOnly}
        >
          Unknown only
        </button>
      </div>

      <div className="flashcards-progress">
        <span className="flashcards-progress-label">
          {order.length > 0 ? `${index + 1} / ${order.length}` : '0 / 0'} · {known.size} known
        </span>
        <div className="flashcards-progress-track">
          <div className="flashcards-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {card ? (
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
      ) : (
        <div className="flashcards-empty">
          You know every card in this deck. Turn off "Unknown only" to review them again, or forget your known
          cards to start fresh.
        </div>
      )}

      <div className="flashcards-controls">
        <button type="button" className="module-nav-btn" onClick={goPrev} disabled={!card || index === 0}>
          ← Prev
        </button>
        <button type="button" className="flashcard-known-btn" onClick={markKnown} disabled={!card}>
          {isLast ? 'Got it · Finish' : 'Got it →'}
        </button>
        <button type="button" className="module-nav-btn" onClick={goNext} disabled={!card || isLast}>
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
        {known.size > 0 && (
          <button type="button" className="flashcards-shuffle-btn" onClick={forgetKnown}>
            Forget known cards
          </button>
        )}
      </div>
    </div>
  )
}
