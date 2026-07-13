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
        <img src="/logo-wordmark.png" alt="Halo!" className="cert-logo" />
        <div className="cert-seal">✓</div>
        <h2>Certificate of Completion</h2>
        <p className="cert-name">{learner}</p>
        <p className="cert-course">
          has successfully completed <strong>{track.title}</strong>
        </p>
        <p className="cert-score">
          {track.modules.length} modules · {track.estimatedTime}
        </p>
        <p className="cert-id muted">
          Issued {issuedLabel} · Credential {completion.credentialId}
        </p>
        <div className="cert-actions">
          <button type="button" className="signin-trigger" onClick={() => window.print()}>
            Download / Print
          </button>
        </div>
        <button type="button" className="primary cert-back-btn" onClick={onClose}>
          Back to courses
        </button>
      </div>
    </div>
  )
}