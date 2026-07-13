import { Suspense, lazy, useState } from 'react'
import { Certificate } from '../components/Certificate'
import { CourseSearch } from '../components/CourseSearch'
import { CheckIcon, FlameIcon, LockIcon } from '../components/icons'
import { ModuleLayout } from '../components/ModuleLayout'
import { PlatformHeader } from '../components/PlatformHeader'
import { TRACKS, type Track } from '../data/courseData'
import {
  awardXP,
  ensureTrackCompletion,
  loadMastery,
  loadProgress,
  loadStreak,
  loadXP,
  moduleKey,
  recordMastery,
  saveProgress,
  touchStreak,
  xpForStars,
  type CourseProgress,
  type MasteryMap,
  type StreakState,
} from '../lib/courseProgress'

const ConstellationMap = lazy(() =>
  import('../components/ConstellationMap').then((module) => ({ default: module.ConstellationMap })),
)
const TrackPlanet = lazy(() =>
  import('../components/TrackPlanet').then((module) => ({ default: module.TrackPlanet })),
)

const PLANET_KIND_BY_TRACK: Record<number, 'earth' | 'moon' | 'saturn' | 'neptune'> = {
  1: 'earth',
  2: 'moon',
  3: 'saturn',
  4: 'neptune',
}

const SECTOR_BY_TRACK: Record<number, string> = {
  1: 'Sector I',
  2: 'Sector II',
  3: 'Sector III',
  4: 'Sector IV',
}

export function CoursePage({
  onSwitch,
  learnerName,
}: {
  onSwitch: () => void
  learnerName?: string | null
}) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [viewingModule, setViewingModule] = useState(false)
  const [moduleIndex, setModuleIndex] = useState(0)
  const [progress, setProgress] = useState<CourseProgress>(loadProgress)
  const [certificateTrack, setCertificateTrack] = useState<Track | null>(null)
  const [mastery, setMastery] = useState<MasteryMap>(loadMastery)
  const [xp, setXp] = useState<number>(loadXP)
  const [streak, setStreak] = useState<StreakState>(loadStreak)
  const [zoomingTrackId, setZoomingTrackId] = useState<number | null>(null)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const isComplete = (trackId: number, moduleId: number) => Boolean(progress[moduleKey(trackId, moduleId)])

  const markComplete = (trackId: number, moduleId: number, retakes: number) => {
    setProgress((prev) => {
      const key = moduleKey(trackId, moduleId)
      if (prev[key]) return prev
      const next = { ...prev, [key]: true }
      saveProgress(next)
      const stars = recordMastery(trackId, moduleId, retakes)
      setMastery(loadMastery())
      setXp(awardXP(xpForStars(stars)))
      setStreak(touchStreak())
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
    setViewingModule(false)
  }

  function flyToTrack(track: Track) {
    if (zoomingTrackId !== null) return
    if (reduceMotion) {
      openTrack(track)
      return
    }
    setZoomingTrackId(track.id)
    window.setTimeout(() => openTrack(track), 480)
  }

  if (selectedTrack && viewingModule) {
    return (
      <ModuleLayout
        track={selectedTrack}
        moduleIndex={moduleIndex}
        onSelectModule={setModuleIndex}
        onBackToTracks={() => setViewingModule(false)}
        isModuleComplete={(moduleId) => isComplete(selectedTrack.id, moduleId)}
        onModuleComplete={(moduleId, retakes) => markComplete(selectedTrack.id, moduleId, retakes)}
        getModuleStars={(moduleId) => mastery[moduleKey(selectedTrack.id, moduleId)] ?? 0}
        xp={xp}
        streak={streak.current}
      />
    )
  }

  if (selectedTrack) {
    return (
      <div className="course-module">
        <button
          type="button"
          className="sidebar-back constellation-back"
          onClick={() => {
            setSelectedTrack(null)
            setZoomingTrackId(null)
          }}
        >
          ← Back to Tracks
        </button>
        <h1 className="track-page-title">{selectedTrack.title}</h1>
        <p className="track-page-desc">{selectedTrack.description}</p>
        <Suspense fallback={<div className="constellation" />}>
          <ConstellationMap
            track={selectedTrack}
            isModuleComplete={(moduleId) => isComplete(selectedTrack.id, moduleId)}
            onSelectModule={(index) => {
              setModuleIndex(index)
              setViewingModule(true)
            }}
          />
        </Suspense>
      </div>
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

  return (
    <div className="course-landing">
      <PlatformHeader onSwitch={onSwitch} />
      <div className="course-landing-inner">
      <div className="course-landing-head">
        <div>
          <h1 className="course-landing-title">PortfoliU Learn</h1>
          <p className="course-landing-desc">
            From saving basics to the math behind hedge funds. Three tracks that build on each
            other.
          </p>
        </div>
        <div className="sidebar-stats course-landing-stats">
          <span className="xp-badge">{xp} XP</span>
          {streak.current > 0 && (
            <span className="streak-badge">
              <FlameIcon />
              {streak.current} day{streak.current === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

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

      <CourseSearch
        tracks={TRACKS}
        onOpen={(trackId, mi) => {
          const track = TRACKS.find((t) => t.id === trackId)
          if (track) {
            setSelectedTrack(track)
            setModuleIndex(mi)
            setViewingModule(true)
          }
        }}
      />

      <div className="track-grid">
        {TRACKS.map((track) => {
            const available = track.modules.length > 0
            const pct = trackPct(track)
            const statusLabel = pct === 0 ? 'Not started' : pct === 100 ? 'Completed' : 'In progress'
            const buttonLabel = pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'
            const zooming = zoomingTrackId === track.id
            return (
              <div
                key={track.id}
                className={`track-card ${zooming ? 'is-zooming' : ''}`}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  const px = (e.clientX - r.left) / r.width - 0.5
                  const py = (e.clientY - r.top) / r.height - 0.5
                  e.currentTarget.style.transform = `perspective(900px) rotateX(${py * -6}deg) rotateY(${px * 6}deg)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                }}
              >
                <span className="track-card-drift" aria-hidden="true" />
                <span className="track-card-particles" aria-hidden="true">
                  <i /><i /><i /><i /><i />
                </span>

                <div className="track-card-body">
                <div className="track-card-top">
                  <span className="track-card-num">{SECTOR_BY_TRACK[track.id] ?? `Track ${track.id}`}</span>
                </div>

                {available && (
                  <button
                    type="button"
                    className="track-planet-btn"
                    onClick={() => flyToTrack(track)}
                    aria-label={`Fly into ${track.title}`}
                  >
                    <Suspense fallback={<div className="track-planet" />}>
                      <TrackPlanet kind={PLANET_KIND_BY_TRACK[track.id] ?? 'moon'} progress={pct} />
                    </Suspense>
                  </button>
                )}

                <h3 className="track-card-title">{track.title}</h3>
                <p className="track-card-desc">{track.description}</p>

                <span className={`difficulty-badge difficulty-${track.difficulty.toLowerCase()}`}>
                  {track.difficulty}
                </span>

                <p className="track-card-meta">
                  {available
                    ? `${track.modules.length} modules · ${track.estimatedTime} · ${statusLabel}${pct > 0 && pct < 100 ? ` · ${pct}%` : ''}`
                    : 'Coming soon'}
                </p>

                {available ? (
                  <button type="button" className="track-card-btn" onClick={() => flyToTrack(track)}>
                    {buttonLabel}
                  </button>
                ) : (
                  <button type="button" className="track-card-btn disabled" disabled>
                    Coming Soon
                  </button>
                )}
                </div>
              </div>
            )
          })}
        </div>

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
    </div>
  )
}
