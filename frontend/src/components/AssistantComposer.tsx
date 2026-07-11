import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

export interface ComposerGoal {
  id: string
  label: string
  phrase: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  pending: boolean
  canAsk: boolean
  goals: readonly ComposerGoal[]
  goal: string | null
  onGoal: (id: string | null) => void
  horizon: number
  onHorizon: (years: number) => void
  risk: number
  onRisk: (percent: number) => void
  starters: readonly string[]
}

type Panel = 'prompts' | 'goal' | 'tune' | null

interface SpeechAlternative {
  transcript: string
}
interface SpeechResult {
  0: SpeechAlternative
  isFinal: boolean
}
interface SpeechResultList {
  length: number
  [index: number]: SpeechResult
}
interface SpeechEvent {
  resultIndex: number
  results: SpeechResultList
}
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function speechCtor(): SpeechRecognitionCtor | null {
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function AssistantComposer({
  value,
  onChange,
  onSubmit,
  pending,
  canAsk,
  goals,
  goal,
  onGoal,
  horizon,
  onHorizon,
  risk,
  onRisk,
  starters,
}: Props) {
  const [panel, setPanel] = useState<Panel>(null)
  const [focused, setFocused] = useState(false)
  const [listening, setListening] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const baseTextRef = useRef('')
  const [voiceSupported] = useState(() => speechCtor() !== null)

  useEffect(() => {
    const node = textRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }, [value])

  useEffect(() => {
    if (panel === null) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPanel(null)
    }
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [panel])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const toggle = (next: Exclude<Panel, null>) => setPanel((current) => (current === next ? null : next))

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const Ctor = speechCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    baseTextRef.current = value ? `${value.trimEnd()} ` : ''

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      onChange(baseTextRef.current + transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setPanel(null)
    textRef.current?.focus()
  }

  const submit = () => {
    if (!canAsk) return
    recognitionRef.current?.stop()
    setPanel(null)
    onSubmit()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const query = value.trim().toLowerCase()
  const matches = query.length > 1 ? starters.filter((s) => s.toLowerCase().includes(query)) : starters
  const activeGoal = goals.find((g) => g.id === goal) ?? null

  const shellClass = [
    'acomp',
    focused ? 'is-focused' : '',
    pending ? 'is-pending' : '',
    listening ? 'is-listening' : '',
    panel ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass} ref={rootRef}>
      <div className="acomp__field">
        <div className="acomp__aura" aria-hidden="true" />

        <div className="acomp__body">
          <textarea
            ref={textRef}
            className="acomp__input"
            rows={1}
            value={value}
            placeholder="Ask me anything…"
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            aria-label="Describe your investing goal"
          />

          <div className="acomp__bar">
            <div className="acomp__tools">
              <button
                type="button"
                className={panel === 'prompts' ? 'acomp__tool is-active' : 'acomp__tool'}
                onClick={() => toggle('prompts')}
                aria-expanded={panel === 'prompts'}
                aria-label="Suggested prompts"
                title="Suggested prompts"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M10 2.5l1.6 4.3 4.4 1.7-4.4 1.7-1.6 4.3-1.6-4.3L4 8.5l4.4-1.7L10 2.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M15.6 13.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9z" fill="currentColor" />
                </svg>
              </button>

              <button
                type="button"
                className={panel === 'goal' ? 'acomp__tool is-active' : 'acomp__tool'}
                onClick={() => toggle('goal')}
                aria-expanded={panel === 'goal'}
                aria-label="Investing goal"
                title="Investing goal"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="10" cy="10" r="1.1" fill="currentColor" />
                </svg>
              </button>

              <span className="acomp__sep" aria-hidden="true" />

              <button
                type="button"
                className={panel === 'tune' ? 'acomp__tool is-active' : 'acomp__tool'}
                onClick={() => toggle('tune')}
                aria-expanded={panel === 'tune'}
                aria-label="Horizon and risk"
                title="Horizon and risk"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M3 6h9M15 6h2M3 14h2M8 14h9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="13.5" cy="6" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6.5" cy="14" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>

              <span className="acomp__sep" aria-hidden="true" />

              <div className="acomp__pills">
                {activeGoal && (
                  <button
                    type="button"
                    className="acomp__pill"
                    onClick={() => onGoal(null)}
                    aria-label={`Clear goal ${activeGoal.label}`}
                  >
                    {activeGoal.label}
                    <span aria-hidden="true">×</span>
                  </button>
                )}
                <span className="acomp__pill is-static">{horizon} yrs</span>
                <span className="acomp__pill is-static">−{risk}% max</span>
              </div>
            </div>

            <div className="acomp__send-group">
              {voiceSupported && (
                <button
                  type="button"
                  className={listening ? 'acomp__mic is-live' : 'acomp__mic'}
                  onClick={toggleVoice}
                  aria-pressed={listening}
                  aria-label={listening ? 'Stop dictation' : 'Dictate your goal'}
                  title={listening ? 'Stop dictation' : 'Dictate your goal'}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <rect x="7.6" y="2.5" width="4.8" height="9" rx="2.4" fill="currentColor" />
                    <path
                      d="M4.8 9.4a5.2 5.2 0 0 0 10.4 0M10 14.6V17.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}

              <button
                type="button"
                className="acomp__send"
                onClick={submit}
                disabled={!canAsk}
                aria-label={pending ? 'Thinking' : 'Ask the assistant'}
                title="Ask the assistant"
              >
                {pending ? (
                  <span className="acomp__spinner" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M10 16V4.6M5.2 9.4 10 4.4l4.8 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {panel === 'prompts' && (
          <div className="acomp__panel" role="dialog" aria-label="Suggested prompts">
            <div className="acomp__panel-head">{query.length > 1 ? 'Matching prompts' : 'Try one of these'}</div>
            {matches.length === 0 ? (
              <p className="acomp__panel-empty">No starter matches what you typed. Just ask in your own words.</p>
            ) : (
              <div className="acomp__panel-list">
                {matches.slice(0, 5).map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    className="acomp__starter"
                    onClick={() => {
                      onChange(starter)
                      setPanel(null)
                      textRef.current?.focus()
                    }}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {panel === 'goal' && (
          <div className="acomp__panel" role="dialog" aria-label="Investing goal">
            <div className="acomp__panel-head">What matters most?</div>
            <div className="acomp__panel-grid">
              {goals.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={goal === option.id ? 'acomp__goal is-active' : 'acomp__goal'}
                  aria-pressed={goal === option.id}
                  onClick={() => onGoal(goal === option.id ? null : option.id)}
                >
                  <span className="acomp__goal-label">{option.label}</span>
                  <span className="acomp__goal-phrase">{option.phrase}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {panel === 'tune' && (
          <div className="acomp__panel" role="dialog" aria-label="Horizon and risk">
            <div className="acomp__panel-head">Fine-tune the ask</div>
            <label className="acomp__range">
              <span>
                Time horizon <strong>{horizon} yrs</strong>
              </span>
              <input
                type="range"
                min={1}
                max={40}
                value={horizon}
                onChange={(event) => onHorizon(Number(event.target.value))}
              />
            </label>
            <label className="acomp__range">
              <span>
                Worst drop I can stomach <strong>{risk}%</strong>
              </span>
              <input
                type="range"
                min={5}
                max={50}
                value={risk}
                onChange={(event) => onRisk(Number(event.target.value))}
              />
            </label>
          </div>
        )}
      </div>

      <div className="acomp__hint" aria-live="polite">
        {listening ? (
          <span className="acomp__hint-live">
            <span className="acomp__hint-dot" aria-hidden="true" />
            Listening… speak your goal
          </span>
        ) : (
          <span>
            <kbd>Enter</kbd> to ask · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line
          </span>
        )}
      </div>
    </div>
  )
}
