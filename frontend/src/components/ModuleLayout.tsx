import { useEffect, useState } from 'react'
import type { ContentBlock, Track } from '../data/courseData'
import { starsForRetakes } from '../lib/courseProgress'
import { CourseAssistant } from './CourseAssistant'
import { CheckIcon, FlameIcon, StarIcon } from './icons'

interface Props {
  track: Track
  moduleIndex: number
  onSelectModule: (index: number) => void
  onBackToTracks: () => void
  isModuleComplete: (moduleId: number) => boolean
  onModuleComplete: (moduleId: number, retakes: number) => void
  getModuleStars?: (moduleId: number) => number
  streak?: number
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="star-row" aria-label={`${stars} out of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= stars ? 'star-filled' : 'star-empty'}>
          <StarIcon filled={n <= stars} />
        </span>
      ))}
    </span>
  )
}

function renderText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

function estimateReadingMinutes(content: ContentBlock[]) {
  const wordCount = content.reduce((sum, block) => {
    const text = block.type === 'list' ? (block.items ?? []).join(' ') : block.text ?? ''
    return sum + text.split(/\s+/).filter(Boolean).length
  }, 0)
  return Math.max(1, Math.round(wordCount / 200))
}

export function ModuleLayout({
  track,
  moduleIndex,
  onSelectModule,
  onBackToTracks,
  isModuleComplete,
  onModuleComplete,
  getModuleStars,
  streak,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [retakeCount, setRetakeCount] = useState(0)
  const mod = track.modules[moduleIndex]

  useEffect(() => {
    setAnswers({})
    setRetakeCount(0)
  }, [moduleIndex])

  function handleAnswer(qIndex: number, oIndex: number) {
    if (qIndex in answers) return
    setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))
  }

  const allAnswered = Object.keys(answers).length === mod.quiz.length
  const correctCount = mod.quiz.filter((q, i) => {
    const chosen = answers[i]
    return chosen !== undefined && q.options[chosen]?.correct
  }).length
  const allCorrect = mod.quiz.length > 0 && allAnswered && correctCount === mod.quiz.length
  const earnedStars = starsForRetakes(retakeCount)

  useEffect(() => {
    if (allCorrect) onModuleComplete(mod.id, retakeCount)
  }, [allCorrect, mod.id, onModuleComplete, retakeCount])

  const completedCount = track.modules.filter((m) => isModuleComplete(m.id)).length
  const progressPct = Math.round((completedCount / track.modules.length) * 100)
  const readingMinutes = estimateReadingMinutes(mod.content)

  const prevModule = moduleIndex > 0 ? track.modules[moduleIndex - 1] : undefined
  const nextModule = moduleIndex < track.modules.length - 1 ? track.modules[moduleIndex + 1] : undefined
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`module-shell ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className={`module-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <button type="button" className="sidebar-back" onClick={onBackToTracks}>
          ← Back to map
        </button>
        <h2 className="sidebar-track-title">{track.title}</h2>
        {streak !== undefined && streak > 0 && (
          <div className="sidebar-stats">
            <span className="streak-badge">
              <FlameIcon />
              {streak} day{streak === 1 ? '' : 's'}
            </span>
          </div>
        )}
        <nav className="sidebar-module-list">
          {track.modules.map((m, i) => {
            const isCurrent = i === moduleIndex
            const done = isModuleComplete(m.id)
            const statusClass = done ? 'completed' : 'available'
            const stars = getModuleStars?.(m.id) ?? 0
            return (
              <button
                key={m.id}
                type="button"
                className={`sidebar-module-item ${statusClass} ${isCurrent ? 'current' : ''}`}
                onClick={() => {
                  onSelectModule(i)
                  setSidebarOpen(false)
                }}
              >
                <span className="sidebar-module-icon">
                  {done ? <CheckIcon /> : <span className="sidebar-module-dot" />}
                </span>
                <span className="sidebar-module-text">
                  <span className="sidebar-module-num">Module {i + 1}</span>
                  <span className="sidebar-module-title">{m.title}</span>
                  {done ? <StarRow stars={stars} /> : <span className="sidebar-module-status">In progress</span>}
                </span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-progress">
          <div className="sidebar-progress-label">
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="sidebar-progress-track">
            <div className="sidebar-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </aside>

      <div className="module-main">
        <div className="module-breadcrumb">
          <button type="button" className="breadcrumb-link" onClick={onBackToTracks}>
            Map
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-track">{track.title}</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Module {moduleIndex + 1}</span>
        </div>

        <div className="module-meta">
          <span className="module-reading-time">{readingMinutes} min read</span>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
          </button>
        </div>

        <h1 className="module-title">{mod.title}</h1>

        <div className="lesson-content">
          {mod.content.map((block, i) => {
            if (block.type === 'paragraph') {
              return (
                <p key={i} className="lesson-paragraph">
                  {renderText(block.text ?? '')}
                </p>
              )
            }
            if (block.type === 'subheading') {
              return (
                <h3 key={i} className="lesson-subheading">
                  {block.text}
                </h3>
              )
            }
            if (block.type === 'list') {
              return (
                <ul key={i} className="lesson-list">
                  {(block.items ?? []).map((item, j) => (
                    <li key={j}>{renderText(item)}</li>
                  ))}
                </ul>
              )
            }
            if (block.type === 'callout') {
              return (
                <div key={i} className="lesson-callout">
                  <span className="lesson-callout-label">Key Concept</span>
                  <p className="lesson-callout-text">{renderText(block.text ?? '')}</p>
                </div>
              )
            }
            if (block.type === 'sources') {
              return (
                <div key={i} className="lesson-sources">
                  <span className="lesson-sources-label">Sources</span>
                  <ul className="lesson-sources-list">
                    {(block.items ?? []).map((item, j) => (
                      <li key={j}>{renderText(item)}</li>
                    ))}
                  </ul>
                </div>
              )
            }
            return null
          })}
        </div>

        <CourseAssistant trackTitle={track.title} moduleTitle={mod.title} />

        <div className="quiz">
          <h2 className="quiz-heading">Check your knowledge</h2>
          {mod.quiz.map((q, qIndex) => {
            const chosen = answers[qIndex]
            const isAnswered = chosen !== undefined
            return (
              <div key={qIndex} className="quiz-question">
                <p className="quiz-q-text">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="quiz-options">
                  {q.options.map((opt, oIndex) => {
                    let cls = 'quiz-option'
                    if (isAnswered) {
                      if (oIndex === chosen) {
                        cls += opt.correct ? ' correct' : ' incorrect'
                      } else if (opt.correct) {
                        cls += ' reveal-correct'
                      }
                    }
                    return (
                      <button
                        key={oIndex}
                        type="button"
                        className={cls}
                        onClick={() => handleAnswer(qIndex, oIndex)}
                        disabled={isAnswered}
                      >
                        {opt.text}
                        {isAnswered && oIndex === chosen && (
                          <span className="quiz-mark">{opt.correct ? ' ✓' : ' ✗'}</span>
                        )}
                        {isAnswered && oIndex !== chosen && opt.correct && (
                          <span className="quiz-mark"> ✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {allAnswered && (
            <div className={`quiz-result ${allCorrect ? 'perfect celebrate' : ''}`}>
              <div className="quiz-result-text">
                {allCorrect
                  ? `Perfect, ${correctCount}/${mod.quiz.length} correct!`
                  : `${correctCount}/${mod.quiz.length} correct. Review the highlighted answers above.`}
              </div>
              {allCorrect && (
                <div className="quiz-mastery">
                  <StarRow stars={earnedStars} />
                </div>
              )}
              <button
                type="button"
                className="quiz-retake-btn"
                onClick={() => {
                  setAnswers({})
                  setRetakeCount((n) => n + 1)
                }}
              >
                Retake quiz
              </button>
            </div>
          )}
        </div>

        <div className="module-nav">
          <button
            type="button"
            className="module-nav-btn"
            onClick={() => {
              if (prevModule) {
                onSelectModule(moduleIndex - 1)
              }
              setSidebarOpen(false)
            }}
            disabled={!prevModule}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="module-nav-btn primary-nav"
            onClick={() => {
              if (nextModule) {
                onSelectModule(moduleIndex + 1)
              } else {
                onBackToTracks()
              }
              setSidebarOpen(false)
            }}
          >
            {nextModule ? 'Next module →' : 'Track complete'}
          </button>
        </div>
      </div>
    </div>
  )
}
