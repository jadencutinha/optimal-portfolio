import { useState } from 'react'
import { useCourseAssistant } from '../api/queries'
import { extractApiError } from '../lib/errors'

interface Props {
  trackTitle: string
  moduleTitle: string
}

export function CourseAssistant({ trackTitle, moduleTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const assistant = useCourseAssistant()

  const canAsk = message.trim().length > 0 && !assistant.isPending
  const ask = () => {
    if (!canAsk) return
    assistant.mutate({ message: message.trim(), track_title: trackTitle, module_title: moduleTitle })
  }

  return (
    <div className={`course-assistant ${open ? 'course-assistant--open' : ''}`}>
      <button
        type="button"
        className="course-assistant-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>Ask Halo about this lesson</span>
        <span className="course-assistant-caret" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="course-assistant-body">
          <p className="course-assistant-hint">
            Ask a general money question, like what to do with savings for a short-term goal. This isn&apos;t the
            portfolio optimizer, so it won&apos;t pick stocks for you.
          </p>
          <div className="course-assistant-input-row">
            <input
              type="text"
              className="course-assistant-input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') ask()
              }}
              placeholder="e.g. What should I do with money I'm saving for a trip in a few months?"
              disabled={assistant.isPending}
            />
            <button type="button" className="signin-trigger" onClick={ask} disabled={!canAsk}>
              {assistant.isPending ? 'Asking…' : 'Ask'}
            </button>
          </div>

          {assistant.isError && (
            <p className="error">
              {extractApiError(assistant.error, 'The assistant could not answer that. Try rephrasing.')}
            </p>
          )}

          {assistant.data && <p className="course-assistant-reply">{assistant.data.reply}</p>}
        </div>
      )}
    </div>
  )
}
