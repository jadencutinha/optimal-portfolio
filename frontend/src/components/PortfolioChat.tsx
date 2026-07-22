import { useEffect, useRef, useState } from 'react'
import { usePortfolioChat } from '../api/queries'
import type { OptimizeResponse } from '../api/types'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

const SUGGESTIONS = [
  'Is my portfolio well diversified?',
  'What does my Sharpe ratio mean?',
  'Which holding carries the most risk?',
]

function HaloMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`halo-mark halo-mark--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id="pchatHaloCore" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#fff7e0" />
            <stop offset="55%" stopColor="#f0d98c" />
            <stop offset="100%" stopColor="#9a7420" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="28.5" r="10.5" fill="url(#pchatHaloCore)" />
        <ellipse
          cx="24"
          cy="15"
          rx="13.5"
          ry="4.4"
          transform="rotate(-16 24 15)"
          stroke="#f4dd97"
          strokeWidth="2.4"
        />
        <circle cx="34.4" cy="12.4" r="1.7" fill="#fff8e6" />
      </svg>
    </span>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12l16-8-6 8 6 8-16-8Z" fill="currentColor" />
    </svg>
  )
}

export function PortfolioChat({
  tickers,
  result,
}: {
  tickers: string[]
  result: OptimizeResponse | null
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const chat = usePortfolioChat()
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chat.isPending])

  const send = (raw: string) => {
    const message = raw.trim()
    if (!message || chat.isPending) return
    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    const weights = result
      ? Object.fromEntries(result.weights.map((allocation) => [allocation.ticker, allocation.weight]))
      : undefined
    chat.mutate(
      {
        message,
        tickers: result ? result.weights.map((allocation) => allocation.ticker) : tickers,
        weights,
        objective: result?.objective,
        expected_return: result?.metrics.expected_return,
        volatility: result?.metrics.volatility,
        sharpe: result?.metrics.sharpe_ratio,
      },
      {
        onSuccess: (data) => setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]),
        onError: () =>
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: 'I could not reach the assistant just now. Please try again in a moment.',
            },
          ]),
      },
    )
  }

  return (
    <>
      <button
        type="button"
        className={open ? 'pchat-fab is-open' : 'pchat-fab'}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close Halo AI' : 'Ask Halo AI'}
      >
        <span className="pchat-fab__glow" aria-hidden="true" />
        {open ? <span className="pchat-fab__x">×</span> : <HaloMark size="sm" />}
        {!open && <span className="pchat-fab__label">Ask Halo AI</span>}
      </button>

      {open && (
        <div className="pchat" role="dialog" aria-label="Halo AI portfolio assistant">
          <header className="pchat__head">
            <HaloMark size="md" />
            <span className="pchat__title">
              <strong>Halo AI</strong>
              <span>Portfolio assistant</span>
            </span>
            <button
              type="button"
              className="pchat__close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div className="pchat__body" ref={bodyRef}>
            {messages.length === 0 && (
              <div className="pchat__welcome">
                <HaloMark size="lg" />
                <p>
                  Ask me anything about your portfolio, what the metrics mean, or investing in
                  general.
                </p>
                <div className="pchat__suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => send(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`pchat__msg pchat__msg--${message.role}`}>
                {message.role === 'assistant' && <HaloMark size="sm" />}
                <div className="pchat__bubble">{message.text}</div>
              </div>
            ))}

            {chat.isPending && (
              <div className="pchat__msg pchat__msg--assistant">
                <HaloMark size="sm" />
                <div className="pchat__bubble pchat__typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <form
            className="pchat__input"
            onSubmit={(event) => {
              event.preventDefault()
              send(input)
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your portfolio…"
              aria-label="Message Halo AI"
            />
            <button type="submit" disabled={!input.trim() || chat.isPending} aria-label="Send">
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
