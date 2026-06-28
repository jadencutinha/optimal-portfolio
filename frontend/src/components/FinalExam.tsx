import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import type { ExamQuestion, ExamResult } from '../api/types'

interface Props {
  courseId: string
  courseTitle: string
  learner: string
  onClose: () => void
}

export function FinalExam({ courseId, courseTitle, learner, onClose }: Props) {
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<ExamResult | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiClient.get<ExamQuestion[]>(`/api/courses/${courseId}/exam`).then((response) => setQuestions(response.data))
  }, [courseId])

  const submit = async () => {
    setBusy(true)
    const { data } = await apiClient.post<ExamResult>(`/api/courses/${courseId}/exam`, { answers })
    setResult(data)
    setBusy(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const retake = () => {
    setResult(null)
    setAnswers({})
  }

  if (!questions) {
    return <p className="muted">Loading exam…</p>
  }

  if (result) {
    if (result.passed) {
      return (
        <div className="certificate">
          <div className="cert-seal">✓</div>
          <h2>Certificate of Success</h2>
          <p className="cert-name">{learner}</p>
          <p className="cert-course">
            has successfully completed <strong>{courseTitle}</strong>
          </p>
          <p className="cert-score">
            Final exam: {result.score}/{result.total} ({Math.round(result.percent * 100)}%)
          </p>
          <p className="cert-id muted">Credential {result.credential_id}</p>
          <div className="cert-actions">
            <button type="button" className="signin-trigger" onClick={() => window.print()}>
              Download / Print
            </button>
            <a className="cert-link" href={`/verify/${result.credential_id}`} target="_blank" rel="noreferrer">
              Verify credential
            </a>
          </div>
          <button className="primary" onClick={onClose}>
            Back to courses
          </button>
        </div>
      )
    }
    return (
      <div className="exam-fail">
        <h2>Not passed yet</h2>
        <p>
          You scored {result.score}/{result.total} ({Math.round(result.percent * 100)}%). You need 90% to earn the
          certificate.
        </p>
        <button className="primary" onClick={retake}>
          Retake exam
        </button>
        <button type="button" className="modal-toggle" onClick={onClose}>
          Back to courses
        </button>
      </div>
    )
  }

  const allAnswered = questions.every((question) => answers[question.id] !== undefined)

  return (
    <div className="final-exam">
      <h2>{courseTitle} — Final Exam</h2>
      <p className="muted">{questions.length} questions · 90% to pass</p>
      {questions.map((question, questionIndex) => (
        <div key={question.id} className="exam-q">
          <p className="exam-prompt">
            {questionIndex + 1}. {question.prompt}
          </p>
          {question.options.map((option, optionIndex) => (
            <label key={option} className={`quiz-option ${answers[question.id] === optionIndex ? 'selected' : ''}`}>
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === optionIndex}
                onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
              />
              {option}
            </label>
          ))}
        </div>
      ))}
      <button className="primary" disabled={!allAnswered || busy} onClick={submit}>
        {busy ? 'Grading…' : 'Submit exam'}
      </button>
    </div>
  )
}
