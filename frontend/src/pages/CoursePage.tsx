import { useState } from 'react'
import { Certificate } from '../components/Certificate'
import { CheckIcon, LockIcon } from '../components/icons'
import { ModuleLayout } from '../components/ModuleLayout'
import { PlatformHeader } from '../components/PlatformHeader'
import { TRACKS, type Track } from '../data/courseData'
import {
  ensureTrackCompletion,
  loadProgress,
  moduleKey,
  saveProgress,
  type CourseProgress,
} from '../lib/courseProgress'

export function CoursePage({
  onSwitch,
  learnerName,
}: {
  onSwitch: () => void
  learnerName?: string | null
}) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [moduleIndex, setModuleIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [progress, setProgress] = useState<CourseProgress>(loadProgress)
  const [certificateTrack, setCertificateTrack] = useState<Track | null>(null)

  const isComplete = (trackId: number, moduleId: number) => Boolean(progress[moduleKey(trackId, moduleId)])

  const markComplete = (trackId: number, moduleId: number) => {
    setProgress((prev) => {
      const key = moduleKey(trackId, moduleId)
      if (prev[key]) return prev
      const next = { ...prev, [key]: true }
      saveProgress(next)
      return next
    })
  }

  const trackPct = (track: Track) => {
    if (track.modules.length === 0) return 0
    const done = track.modules.filter((m) => isComplete(track.id, m.id)).length
    return Math.round((done / track.modules.length) * 100)
  }

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
        isModuleComplete={(moduleId) => isComplete(selectedTrack.id, moduleId)}
        onModuleComplete={(moduleId) => markComplete(selectedTrack.id, moduleId)}
      />
    )
  }

  if (certificateTrack) {
    return (
      <Certificate
        track={certificateTrack}
        completion={ensureTrackCompletion(certificateTrack.id)}
        learner={learnerName?.trim() || 'PortfoliU Learner'}
        onClose={() => setCertificateTrack(null)}
      />
    )
  }

  const completedTracks = TRACKS.filter((track) => track.modules.length > 0 && trackPct(track) === 100).length

  const query = search.trim().toLowerCase()
  const visibleTracks = query
    ? TRACKS.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.description.toLowerCase().includes(query) ||
          track.modules.some((m) => m.title.toLowerCase().includes(query)),
      )
    : TRACKS

  return (
    <div className="course-landing">
      <PlatformHeader onSwitch={onSwitch} />
      <h1 className="course-landing-title">PortfoliU Learn</h1>
      <p className="course-landing-desc">
        From saving basics to the math behind hedge funds. Three tracks that build on each
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

      <div className="course-search">
        <input
          type="search"
          className="course-search-input"
          placeholder="Search courses…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {visibleTracks.length === 0 ? (
        <p className="course-search-empty muted">No courses match “{search}”.</p>
      ) : (
        <div className="track-grid">
          {visibleTracks.map((track) => {
            const available = track.modules.length > 0
            const pct = trackPct(track)
            const statusLabel = pct === 0 ? 'Not started' : pct === 100 ? 'Completed' : 'In progress'
            const buttonLabel = pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'
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

                {available && (
                  <div className="track-card-progress">
                    <div className="track-card-progress-track">
                      <div className="track-card-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="track-card-progress-label">
                      {statusLabel}
                      {pct > 0 && pct < 100 ? ` · ${pct}%` : ''}
                    </span>
                  </div>
                )}

                {available && (
                  <ol className="track-card-module-preview">
                    {track.modules.slice(0, 3).map((m) => (
                      <li key={m.id}>{m.title}</li>
                    ))}
                  </ol>
                )}

                {available ? (
                  <button type="button" className="track-card-btn" onClick={() => openTrack(track)}>
                    {buttonLabel}
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
      )}

      <div className="certificates-section">
        <h2 className="certificates-title">Your Certificates</h2>
        <div className="certificates-grid">
          {TRACKS.map((track) => {
            const earned = track.modules.length > 0 && trackPct(track) === 100
            return (
              <div key={track.id} className="certificate-card">
                <span className={`certificate-lock ${earned ? 'earned' : ''}`}>
                  {earned ? <CheckIcon /> : <LockIcon />}
                </span>
                <p className="certificate-track-name">{track.title}</p>
                {earned ? (
                  <button
                    type="button"
                    className="certificate-download-btn"
                    onClick={() => setCertificateTrack(track)}
                  >
                    View Certificate
                  </button>
                ) : (
                  <p className="certificate-hint">Complete the track to unlock</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="course-callout">Complete all three tracks to unlock a Pro discount</div>
    </div>
  )
}
