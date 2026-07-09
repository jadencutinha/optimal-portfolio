import { useState } from 'react'
import { apiClient } from '../api/client'
import { useCourseDetail } from '../api/queries'
import type { AnswerResult } from '../api/types'

interface Props {
  courseId: string
  onExam: () => void
  onBack: () => void
}

export function CourseModule({ courseId, onExam, onBack }: Props) {
  const detail = useCourseDetail(courseId)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [busy, setBusy] = useState(false)

  if (detail.isLoading || !detail.data) {
    return <p className="muted">Loading course…</p>
  }

  const course = detail.data
  const topic = course.topics[index]
  const isLast = index === course.topics.length - 1

  const submit = async () => {
    if (choice === null) return
    setBusy(true)
    const { data } = await apiClient.post<AnswerResult>(
      `/api/courses/${courseId}/topics/${topic.id}/answer`,
      { choice },
    )
    setResult(data)
    setBusy(false)
  }

  const next = () => {
    setIndex((value) => value + 1)
    setChoice(null)
    setResult(null)
  }

  return (
    <div className="course-module">
      <div className="course-module-head">
        <button type="button" className="signin-trigger" onClick={onBack}>
          ← Courses
        </button>
        <span className="muted">
          Topic {index + 1} of {course.topics.length}
        </span>
      </div>
      <div className="course-progress-track">
        <div className="course-progress-fill" style={{ width: `${(index / course.topics.length) * 100}%` }} />
      </div>

      <article className="topic-card">
        <h2>{topic.title}</h2>
        <div className="lesson">
          {topic.body.map((block, blockIndex) => {
            const key = `${topic.id}-${blockIndex}`
            if (block.type === 'h') {
              return (
                <h3 key={key} className="lesson-h">
                  {block.text}
                </h3>
              )
            }
            if (block.type === 'formula') {
              return (
                <pre key={key} className="lesson-formula">
                  {block.text}
                </pre>
              )
            }
            if (block.type === 'ul') {
              return (
                <ul key={key} className="lesson-ul">
                  {(block.items ?? []).map((item, itemIndex) => (
                    <li key={`${key}-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              )
            }
            return (
              <p key={key} className="lesson-p">
                {block.text}
              </p>
            )
          })}
        </div>

        <div className="topic-quiz">
          <h3 className="quiz-heading">Knowledge check</h3>
          <p className="quiz-prompt">{topic.quiz.prompt}</p>
          {topic.quiz.options.map((option, optionIndex) => {
            let state = ''
            if (result) {
              if (optionIndex === result.answer) state = 'correct'
              else if (optionIndex === choice) state = 'wrong'
            } else if (optionIndex === choice) {
              state = 'selected'
            }
            return (
              <label key={option} className={`quiz-option ${state}`}>
                <input
                  type="radio"
                  name={topic.id}
                  disabled={result !== null}
                  checked={choice === optionIndex}
                  onChange={() => setChoice(optionIndex)}
                />
                {option}
              </label>
            )
          })}

          {!result ? (
            <button className="primary" disabled={choice === null || busy} onClick={submit}>
              Submit answer
            </button>
          ) : (
            <>
              <p className={result.correct ? 'answer-correct' : 'answer-wrong'}>
                {result.correct
                  ? 'Correct!'
                  : `Not quite. The answer is "${topic.quiz.options[result.answer]}".`}
              </p>
              {isLast ? (
                <button className="primary" onClick={onExam}>
                  Take final exam →
                </button>
              ) : (
                <button className="primary" onClick={next}>
                  Next topic →
                </button>
              )}
            </>
          )}
        </div>
      </article>
    </div>
  )
}
