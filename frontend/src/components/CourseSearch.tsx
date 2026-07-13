import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Track } from '../data/courseData'

interface SearchItem {
  type: 'track' | 'module'
  trackId: number
  trackTitle: string
  moduleIndex: number
  title: string
}

interface Props {
  tracks: Track[]
  onOpen: (trackId: number, moduleIndex: number) => void
}

export function CourseSearch({ tracks, onOpen }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const index = useMemo<SearchItem[]>(
    () =>
      tracks.flatMap((track) =>
        track.modules.length === 0
          ? []
          : [
              { type: 'track', trackId: track.id, trackTitle: track.title, moduleIndex: 0, title: track.title },
              ...track.modules.map((module, moduleIndex) => ({
                type: 'module' as const,
                trackId: track.id,
                trackTitle: track.title,
                moduleIndex,
                title: module.title,
              })),
            ],
      ),
    [tracks],
  )

  const q = query.trim().toLowerCase()
  const results = q
    ? index
        .filter((item) => item.title.toLowerCase().includes(q) || item.trackTitle.toLowerCase().includes(q))
        .slice(0, 8)
    : []
  const open = focused && q.length > 0

  const choose = (item: SearchItem) => {
    onOpen(item.trackId, item.moduleIndex)
    setQuery('')
    setFocused(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (event.key === 'Enter') {
      if (results[active]) choose(results[active])
    } else if (event.key === 'Escape') {
      setQuery('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="course-search">
      <div className={open ? 'csearch open' : 'csearch'}>
        <svg className="csearch-icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className="csearch-input"
          placeholder="Search the galaxy…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKeyDown}
          aria-label="Search courses"
        />
        {query && (
          <button
            type="button"
            className="csearch-clear"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        {open && (
          <div className="csearch-results" role="listbox">
            {results.length === 0 ? (
              <div className="csearch-empty">No matches for “{query}”.</div>
            ) : (
              <>
                <div className="csearch-count">
                  {results.length} result{results.length === 1 ? '' : 's'}
                </div>
                {results.map((item, i) => (
                  <button
                    key={`${item.type}-${item.trackId}-${item.moduleIndex}-${i}`}
                    type="button"
                    className={i === active ? 'csearch-item active' : 'csearch-item'}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(item)}
                  >
                    <span className={`csearch-type csearch-type-${item.type}`}>
                      {item.type === 'track' ? 'Track' : 'Module'}
                    </span>
                    <span className="csearch-item-text">
                      <span className="csearch-item-title">{item.title}</span>
                      {item.type === 'module' && <span className="csearch-item-sub">{item.trackTitle}</span>}
                    </span>
                    <span className="csearch-go">↵</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
