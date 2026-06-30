import { useState } from 'react'
import type { ContentBlock, QuizQuestion } from '../data/courseData'

interface Props {
  trackTitle: string
  moduleNumber: number
  totalModules: number
  title: string
  content: ContentBlock[]
  quiz: QuizQuestion[]
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
}

function renderText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

export function ModuleLayout({
  trackTitle,
  moduleNumber,
  totalModules,
  title,
  content,
  quiz,
  onBack,
  onNext,
  onPrev,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})

  function handleAnswer(qIndex: number, oIndex: number) {
    if (qIndex in answers) return
    setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))
  }

  const allAnswered = Object.keys(answers).length === quiz.length
  const correctCount = quiz.filter((q, i) => {
    const chosen = answers[i]
    return chosen !== undefined && q.options[chosen]?.correct
  }).length

  return (
    <div className="module-layout">
      <div className="module-breadcrumb">
        <button type="button" className="breadcrumb-back" onClick={onBack}>
          ← {trackTitle}
        </button>
        <span className="breadcrumb-sep">·</span>
        <span className="breadcrumb-pos">
          Module {moduleNumber} of {totalModules}
        </span>
      </div>

      <h1 className="module-title">{title}</h1>

      <div className="lesson-content">
        {content.map((block, i) => {
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
                {renderText(block.text ?? '')}
              </div>
            )
          }
          return null
        })}
      </div>

      <div className="quiz">
        <h2 className="quiz-heading">Knowledge check</h2>
        {quiz.map((q, qIndex) => {
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
          <div className={`quiz-result ${correctCount === quiz.length ? 'perfect' : ''}`}>
            {correctCount === quiz.length
              ? `Perfect — ${correctCount}/${quiz.length} correct!`
              : `${correctCount}/${quiz.length} correct — review the highlighted answers above.`}
          </div>
        )}
      </div>

      <div className="module-nav">
        <button
          type="button"
          className="module-nav-btn"
          onClick={onPrev}
          disabled={!onPrev}
        >
          ← Previous
        </button>
        <button
          type="button"
          className="module-nav-btn primary-nav"
          onClick={onNext}
          disabled={!onNext}
        >
          {onNext ? 'Next module →' : 'Track complete'}
        </button>
      </div>
    </div>
  )
}
