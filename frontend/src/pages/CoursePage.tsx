import { useState } from 'react'
import { ModuleLayout } from '../components/ModuleLayout'
import { TRACKS, type Track } from '../data/courseData'

export function CoursePage() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [moduleIndex, setModuleIndex] = useState<number | null>(null)

  if (selectedTrack && moduleIndex !== null) {
    const mod = selectedTrack.modules[moduleIndex]
    return (
      <ModuleLayout
        trackTitle={selectedTrack.title}
        moduleNumber={moduleIndex + 1}
        totalModules={selectedTrack.modules.length}
        title={mod.title}
        content={mod.content}
        quiz={mod.quiz}
        onBack={() => setModuleIndex(null)}
        onPrev={moduleIndex > 0 ? () => setModuleIndex(moduleIndex - 1) : undefined}
        onNext={
          moduleIndex < selectedTrack.modules.length - 1
            ? () => setModuleIndex(moduleIndex + 1)
            : undefined
        }
      />
    )
  }

  if (selectedTrack) {
    return (
      <div className="track-page">
        <button
          type="button"
          className="breadcrumb-back"
          onClick={() => setSelectedTrack(null)}
        >
          ← All tracks
        </button>
        <div className="track-page-header">
          <div>
            <h1 className="track-page-title">{selectedTrack.title}</h1>
            <p className="track-page-meta">
              {selectedTrack.modules.length} modules · {selectedTrack.estimatedTime}
            </p>
          </div>
        </div>
        <div className="module-list">
          {selectedTrack.modules.map((mod, i) => (
            <button
              key={mod.id}
              type="button"
              className="module-card"
              onClick={() => setModuleIndex(i)}
            >
              <span className="module-num">Module {i + 1}</span>
              <span className="module-card-title">{mod.title}</span>
              <span className="module-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="course-landing">
      <h1 className="course-landing-title">PortfoliU Learn</h1>
      <p className="course-landing-desc">
        From saving basics to the math behind hedge funds — three tracks that build on each
        other.
      </p>
      <div className="track-grid">
        {TRACKS.map((track) => {
          const available = track.modules.length > 0
          return (
            <div key={track.id} className={`track-card ${available ? '' : 'track-coming-soon'}`}>
              <div className="track-card-body">
                <h3 className="track-card-title">
                  Track {track.id} — {track.title}
                </h3>
                <p className="track-card-desc">{track.description}</p>
                <p className="track-card-meta">
                  {available
                    ? `${track.modules.length} modules · ${track.estimatedTime}`
                    : 'Coming soon'}
                </p>
              </div>
              {available ? (
                <button
                  type="button"
                  className="track-card-btn"
                  onClick={() => setSelectedTrack(track)}
                >
                  Start
                </button>
              ) : (
                <span className="track-card-locked">Soon</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
