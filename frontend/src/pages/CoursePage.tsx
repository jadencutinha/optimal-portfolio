import { useState } from 'react'
import { LockIcon } from '../components/icons'
import { ModuleLayout } from '../components/ModuleLayout'
import { TRACKS, type Track } from '../data/courseData'

export function CoursePage() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [moduleIndex, setModuleIndex] = useState(0)

  function openTrack(track: Track) {
    setSelectedTrack(track)
    setModuleIndex(0)
  }

  if (selectedTrack) {
    return (
      <ModuleLayout
        track={selectedTrack}
        moduleIndex={moduleIndex}
        onSelectModule={setModuleIndex}
        onBackToTracks={() => setSelectedTrack(null)}
      />
    )
  }

  const completedTracks = TRACKS.filter(
    (track) => track.modules.length > 0 && track.modules.every((m) => m.isCompleted)
  ).length

  return (
    <div className="course-landing">
      <h1 className="course-landing-title">PortfoliU Learn</h1>
      <p className="course-landing-desc">
        From saving basics to the math behind hedge funds — three tracks that build on each
        other.
      </p>

      <div className="course-progress-summary">
        <span className="course-progress-summary-label">
          {completedTracks} of {TRACKS.length} tracks completed
        </span>
        <div className="course-progress-summary-track">
          <div
            className="course-progress-summary-fill"
            style={{ width: `${(completedTracks / TRACKS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="track-grid">
        {TRACKS.map((track) => {
          const available = track.modules.length > 0
          return (
            <div key={track.id} className="track-card">
              <div className="track-card-top">
                <span className="track-card-num">Track {track.id}</span>
              </div>

              <h3 className="track-card-title">{track.title}</h3>
              <p className="track-card-desc">{track.description}</p>

              <span className={`difficulty-badge difficulty-${track.difficulty.toLowerCase()}`}>
                {track.difficulty}
              </span>

              <p className="track-card-meta">
                {available ? `${track.modules.length} modules · ${track.estimatedTime}` : 'Coming soon'}
              </p>

              <div className="track-card-progress">
                <div className="track-card-progress-track">
                  <div className="track-card-progress-fill" style={{ width: '0%' }} />
                </div>
                <span className="track-card-progress-label">Not started</span>
              </div>

              {available && (
                <ol className="track-card-module-preview">
                  {track.modules.slice(0, 3).map((m) => (
                    <li key={m.id}>{m.title}</li>
                  ))}
                </ol>
              )}

              {available ? (
                <button type="button" className="track-card-btn" onClick={() => openTrack(track)}>
                  Start
                </button>
              ) : (
                <button type="button" className="track-card-btn disabled" disabled>
                  Coming Soon
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="certificates-section">
        <h2 className="certificates-title">Your Certificates</h2>
        <div className="certificates-grid">
          {TRACKS.map((track) => (
            <div key={track.id} className="certificate-card">
              <span className="certificate-lock">
                <LockIcon />
              </span>
              <p className="certificate-track-name">{track.title}</p>
              <p className="certificate-hint">Complete the track to unlock</p>
            </div>
          ))}
        </div>
      </div>

      <div className="course-callout">Complete all three tracks to unlock a Pro discount</div>
    </div>
  )
}
