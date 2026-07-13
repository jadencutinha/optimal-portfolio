import { Suspense, lazy, useEffect, useRef, useState } from 'react'
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
  5: 'Sector V',
  6: 'Sector VI',
  7: 'Sector VII',
}

const ARCHETYPE_BY_TRACK: Record<number, string> = {
  1: 'Foundations',
  2: 'Mindset',
  3: 'Engineering',
  4: 'Analysis',
}

const BECOMES_BY_TRACK: Record<number, string> = {
  1: 'Financially Literate',
  2: 'Emotionally Disciplined',
  3: 'Portfolio Builder',
  4: 'Portfolio Analyst',
}

const START_HERE_BY_TRACK: Record<number, string> = {
  1: "Start here if you're new to investing.",
  4: 'Start here if you already know the basics and want to read portfolio metrics.',
  6: "Start here if you're a seasoned investor wanting the professional, quant side.",
}

interface StubSector {
  id: number
  archetype: string
  title: string
  description: string
  becomes: string
}

const STUB_SECTORS: StubSector[] = [
  {
    id: 5,
    archetype: 'Institutional',
    title: 'Institutional Investing',
    description: 'How hedge funds generate ideas, size positions, and manage risk.',
    becomes: 'Institutional Thinker',
  },
  {
    id: 6,
    archetype: 'Quantitative',
    title: 'Quantitative Investing',
    description: 'Factor investing, systematic strategies, and market regimes.',
    becomes: 'Quantitative Investor',
  },
  {
    id: 7,
    archetype: 'Allocation',
    title: 'Capital Allocation',
    description: 'Conviction vs. concentration: portfolio construction at scale.',
    becomes: 'Capital Allocator',
  },
]

type SpineNode =
  | { kind: 'real'; id: number; track: Track }
  | { kind: 'stub'; id: number; stub: StubSector }

const SECTOR_IDS_IN_ORDER = [...TRACKS.map((t) => t.id), ...STUB_SECTORS.map((s) => s.id)]

interface LinePoint {
  x: number
  y: number
}

// Pulls a line's endpoints inward toward its midpoint so it stops short of
// each planet instead of running center-to-center.
function trimLine(p: LinePoint, q: LinePoint, amount: number) {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy)

  // If the line is shorter than the combined trim amount, collapse to center
  if (len <= 2 * amount) {
    const mx = (p.x + q.x) / 2
    const my = (p.y + q.y) / 2
    return { x1: mx, y1: my, x2: mx, y2: my }
  }

  const ux = dx / len
  const uy = dy / len

  return {
    x1: p.x + ux * amount, // Push start inward
    y1: p.y + uy * amount, 
    x2: q.x - ux * amount, // Pull end inward
    y2: q.y - uy * amount,
  }
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
  const [linePoints, setLinePoints] = useState<LinePoint[]>([])
  const spineRef = useRef<HTMLDivElement>(null)
  const planetRefs = useRef<Map<number, HTMLElement>>(new Map())
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const setPlanetRef = (id: number) => (el: HTMLElement | null) => {
    if (el) planetRefs.current.set(id, el)
    else planetRefs.current.delete(id)
  }

  // Measures each sector's actual planet position so the connecting lines run
  // planet-to-planet instead of down a fixed center spine.
  useEffect(() => {
    const container = spineRef.current
    if (!container) return

    const measure = () => {
      const containerRect = container.getBoundingClientRect()
      const points = SECTOR_IDS_IN_ORDER.map((id) => {
        const el = planetRefs.current.get(id)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 - containerRect.left, y: r.top + r.height / 2 - containerRect.top }
      })
      if (points.every((p): p is LinePoint => p !== null)) {
        setLinePoints(points)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [selectedTrack, certificateTrack])

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
        learner={learnerName?.trim() || 'Halo Learner'}
        onClose={() => setCertificateTrack(null)}
      />
    )
  }

  const completedTracks = TRACKS.filter((track) => track.modules.length > 0 && trackPct(track) === 100).length

  const spineNodes: SpineNode[] = [
    ...TRACKS.map((track): SpineNode => ({ kind: 'real', id: track.id, track })),
    ...STUB_SECTORS.map((stub): SpineNode => ({ kind: 'stub', id: stub.id, stub })),
  ]

  return (
    <div className="course-landing">
      <div className="course-landing-inner">
      <PlatformHeader onSwitch={onSwitch} />
      <div className="course-landing-head">
        <div>
          <h1 className="course-landing-title">Halo Learn</h1>
          <p className="course-landing-desc">
            Master the hidden curriculum of investing through interactive lessons and real
            portfolio building.
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

      <p className="sector-spine-tagline">
        Complete each sector to unlock the thinking frameworks used by professional investors.
      </p>

      <div className="sector-spine" ref={spineRef}>
        <svg className="sector-lines" aria-hidden="true">
          {linePoints.slice(0, -1).map((p, i) => {
            const q = linePoints[i + 1]
            const a = spineNodes[i]
            const b = spineNodes[i + 1]
            const state =
              a?.kind === 'real' && b?.kind === 'real'
                ? trackPct(a.track) === 100
                  ? 'is-done'
                  : trackPct(a.track) > 0
                    ? 'is-leading'
                    : 'is-locked'
                : 'is-locked'
            const { x1, y1, x2, y2 } = trimLine(p, q, 190)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={`sector-line ${state}`} />
          })}
        </svg>
        {Object.entries(START_HERE_BY_TRACK).map(([idStr, text]) => {
          const id = Number(idStr)
          const point = linePoints[SECTOR_IDS_IN_ORDER.indexOf(id)]
          if (!point) return null
          return (
            <p key={id} className="sector-annotation" style={{ top: point.y }}>
              {text}
            </p>
          )
        })}
        {spineNodes.map((node) => {
          if (node.kind === 'stub') {
            const { stub } = node
            return (
              <div key={`stub-${stub.id}`} className="sector-node-wrap">
                <div className="sector-node sector-node--stub">
                  <span className="sector-node-eyebrow">{SECTOR_BY_TRACK[stub.id] ?? `Sector ${stub.id}`}</span>
                  <h3 className="sector-node-archetype">{stub.archetype}</h3>
                  <p className="sector-node-subtitle">{stub.title}</p>

                  <div className="sector-node-stub-planet" ref={setPlanetRef(stub.id)} aria-hidden="true">
                    <LockIcon />
                  </div>

                  <p className="sector-node-desc">{stub.description}</p>
                  <p className="sector-node-becomes">
                    You become: <strong>{stub.becomes}</strong>
                  </p>

                  <button type="button" className="sector-node-cta disabled" disabled>
                    Coming Soon
                  </button>
                </div>
              </div>
            )
          }

          const { track } = node
          const available = track.modules.length > 0
          const pct = trackPct(track)
          const statusLabel = pct === 0 ? 'Not started' : pct === 100 ? 'Completed' : 'In progress'
          const buttonLabel = pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'
          const zooming = zoomingTrackId === track.id
          return (
            <div key={track.id} className="sector-node-wrap">
              <div className={`sector-node ${zooming ? 'is-zooming' : ''}`}>
                <span className="sector-node-eyebrow">{SECTOR_BY_TRACK[track.id] ?? `Sector ${track.id}`}</span>
                <h3 className="sector-node-archetype">{ARCHETYPE_BY_TRACK[track.id] ?? track.title}</h3>
                <p className="sector-node-subtitle">{track.title}</p>

                {available && (
                  <button
                    type="button"
                    className="track-planet-btn"
                    ref={setPlanetRef(track.id)}
                    onClick={() => flyToTrack(track)}
                    aria-label={`Fly into ${track.title}`}
                  >
                    <Suspense fallback={<div className="track-planet" />}>
                      <TrackPlanet kind={PLANET_KIND_BY_TRACK[track.id] ?? 'moon'} progress={pct} />
                    </Suspense>
                  </button>
                )}

                <p className="sector-node-desc">{track.description}</p>

                <div className="sector-node-meta">
                  <span className={`difficulty-badge difficulty-${track.difficulty.toLowerCase()}`}>
                    {track.difficulty}
                  </span>
                  {available && (
                    <span className="sector-node-status">
                      {track.modules.length} modules · {track.estimatedTime} · {statusLabel}
                      {pct > 0 && pct < 100 ? ` · ${pct}%` : ''}
                    </span>
                  )}
                </div>

                {BECOMES_BY_TRACK[track.id] && (
                  <p className="sector-node-becomes">
                    You become: <strong>{BECOMES_BY_TRACK[track.id]}</strong>
                  </p>
                )}

                {available ? (
                  <button type="button" className="sector-node-cta" onClick={() => flyToTrack(track)}>
                    {buttonLabel}
                  </button>
                ) : (
                  <button type="button" className="sector-node-cta disabled" disabled>
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

      <div className="course-callout">Complete all {TRACKS.length} sectors to unlock a Pro discount</div>
      </div>
    </div>
  )
}
