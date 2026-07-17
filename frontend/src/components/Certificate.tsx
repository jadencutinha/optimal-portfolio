import type { Track } from '../data/courseData'
import type { TrackCompletion } from '../lib/courseProgress'

interface Props {
  track: Track
  completion: TrackCompletion
  learner: string
  onClose: () => void
}

export function Certificate({ track, completion, learner, onClose }: Props) {
  const issuedLabel = new Date(completion.completedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="certificate-page">
      <div className="certificate">
        <span className="cert-corner cert-corner--tl" aria-hidden="true" />
        <span className="cert-corner cert-corner--tr" aria-hidden="true" />
        <span className="cert-corner cert-corner--bl" aria-hidden="true" />
        <span className="cert-corner cert-corner--br" aria-hidden="true" />

        <img src="/logo-wordmark.png" alt="Halo!" className="cert-logo" />

        <div className="cert-seal" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="cert-seal-ring">
            <circle cx="50" cy="50" r="45" />
            <circle cx="50" cy="50" r="38" />
          </svg>
          <span className="cert-seal-check">&#10003;</span>
        </div>

        <p className="cert-eyebrow">Certificate of Completion</p>
        <h2 className="cert-name">{learner}</h2>
        <div className="cert-rule" aria-hidden="true" />
        <p className="cert-course">has successfully completed</p>
        <p className="cert-track-title">{track.title}</p>
        <p className="cert-score">
          {track.modules.length} modules &middot; {track.estimatedTime} &middot; {track.difficulty}
        </p>

        <div className="cert-footer">
          <div className="cert-footer-item">
            <span className="cert-footer-label">Issued</span>
            <span className="cert-footer-value">{issuedLabel}</span>
          </div>
          <div className="cert-footer-item cert-footer-item--credential">
            <span className="cert-footer-label">Credential</span>
            <span className="cert-footer-value">{completion.credentialId}</span>
          </div>
        </div>
      </div>

      <div className="cert-actions">
        <button type="button" className="signin-trigger" onClick={() => window.print()}>
          Download / Print
        </button>
        <button type="button" className="primary cert-back-btn" onClick={onClose}>
          Back to courses
        </button>
      </div>
    </div>
  )
}
