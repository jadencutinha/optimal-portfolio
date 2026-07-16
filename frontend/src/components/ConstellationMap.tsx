import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import type { Track } from '../data/courseData'
import { constellationStars, makeMaterial } from './celestial/particles'

interface Props {
  track: Track
  isModuleComplete: (moduleId: number) => boolean
  onSelectModule: (index: number) => void
}

const STEP_WORLD = 2
const WORLD_PAD = 1.1
const PX_PER_UNIT = 90
const CAMERA_Z = 8
const DUST_COUNT = 46
const WOBBLE_WORLD = 0.9

// Deterministic per-track layout — module 0 (first) sits on the left, the
// last module on the right, with a gentle up-down drift so it reads as a
// climbing star chain rather than a straight line.
function layout(count: number, seed: number, stepWorld: number): [number, number, number][] {
  const points: [number, number, number][] = []
  for (let i = 0; i < count; i += 1) {
    const wobble = Math.sin(seed + i * 2.1) * WOBBLE_WORLD
    points.push([i * stepWorld, wobble, 0])
  }
  return points
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function ConstellationMap({ track, isModuleComplete, onSelectModule }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const hoverActiveRef = useRef(false)
  const [viewHeight, setViewHeight] = useState(300)
  const [viewWidth, setViewWidth] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [traveling, setTraveling] = useState<number | null>(null)
  const [entering, setEntering] = useState(true)
  const [burstIndex, setBurstIndex] = useState<number | null>(null)
  const prevCompleteRef = useRef<boolean[]>([])
  const prevTrackIdRef = useRef<number | null>(null)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Node spacing stretches to fill the available box width — it only ever
  // grows past STEP_WORLD (when there's room to spread modules out), never
  // shrinks below it, so labels never crowd. Falls back to the fixed step
  // (and horizontal scroll) when the box is too narrow for the module count.
  const stepWorld = useMemo(() => {
    const count = track.modules.length
    if (viewWidth == null || count <= 1) return STEP_WORLD
    const availableWorld = viewWidth / PX_PER_UNIT - WORLD_PAD * 2
    return Math.max(STEP_WORLD, availableWorld / (count - 1))
  }, [track, viewWidth])

  const points = useMemo(
    () => layout(track.modules.length, track.id * 1.7, stepWorld),
    [track, stepWorld],
  )

  const currentIndex = track.modules.findIndex((m) => !isModuleComplete(m.id))

  // Detect a module flipping from incomplete → complete and fire a one-time
  // "explodes into light" burst on that node + the line leading out of it.
  useEffect(() => {
    const now = track.modules.map((m) => isModuleComplete(m.id))
    if (prevTrackIdRef.current !== track.id) {
      prevTrackIdRef.current = track.id
      prevCompleteRef.current = now
      return
    }
    const prev = prevCompleteRef.current
    const justDone = now.findIndex((done, i) => done && !prev[i])
    prevCompleteRef.current = now
    if (justDone !== -1 && !reduceMotion) {
      setBurstIndex(justDone)
      const t = window.setTimeout(() => setBurstIndex(null), 700)
      return () => window.clearTimeout(t)
    }
  }, [track, isModuleComplete, reduceMotion])

  const rightX = (track.modules.length - 1) * stepWorld + WORLD_PAD
  const leftX = -WORLD_PAD
  const totalWorldWidth = rightX - leftX
  const contentWidth = Math.round(totalWorldWidth * PX_PER_UNIT)

  useEffect(() => {
    setEntering(true)
    const t = window.setTimeout(() => setEntering(false), reduceMotion ? 0 : 1500)
    return () => window.clearTimeout(t)
  }, [track, reduceMotion])

  // Measured independently of the WebGL setup effect below so resizing the
  // box (e.g. viewport width change) doesn't tear down/rebuild the scene —
  // it just feeds `stepWorld` above, which reflows points/contentWidth.
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const measure = () => setViewWidth(scrollEl.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollEl)
    return () => observer.disconnect()
  }, [])

  function travelTo(index: number) {
    if (traveling !== null) return
    if (reduceMotion) {
      onSelectModule(index)
      return
    }
    setTraveling(index)
    window.setTimeout(() => onSelectModule(index), 420)
  }

  useEffect(() => {
    const mount = mountRef.current
    const scrollEl = scrollRef.current
    if (!mount || !scrollEl) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = 'constellation__canvas'
    mount.appendChild(renderer.domElement)

    const dpr = renderer.getPixelRatio()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)
    camera.left = leftX
    camera.right = rightX

    const doneColor = new THREE.Color(0xffd66b)
    const currentColor = new THREE.Color(0x6fb3dd)
    const lockedColor = new THREE.Color(0x234952)
    const disposables: { dispose: () => void }[] = []

    const starGeometry = constellationStars(points, new THREE.Color(0xffffff), 9)
    const starMaterial = makeMaterial(dpr, { ambient: 0.5, front: 0.9, rim: 0.6 }, 1)
    const starColors = starGeometry.getAttribute('aColor') as THREE.BufferAttribute
    const starSizes = starGeometry.getAttribute('aSize') as THREE.BufferAttribute
    track.modules.forEach((mod, i) => {
      const c = isModuleComplete(mod.id) ? doneColor : i === currentIndex ? currentColor : lockedColor
      starColors.setXYZ(i, c.r, c.g, c.b)
      starSizes.setX(i, i === currentIndex ? 12 : 9)
    })
    starColors.needsUpdate = true
    starSizes.needsUpdate = true
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
    disposables.push(starGeometry, starMaterial)

    // Ambient dust scattered across the whole row — pure atmosphere, no interaction.
    const rand = seededRandom(track.id * 97 + 13)
    const dustPoints: [number, number, number][] = Array.from({ length: DUST_COUNT }, () => [
      leftX + rand() * totalWorldWidth,
      (rand() - 0.5) * 3.4,
      -1 - rand(),
    ])
    const dustGeometry = constellationStars(dustPoints, new THREE.Color(0x6fb3dd), 2.5)
    const dustMaterial = makeMaterial(dpr, { ambient: 0.4, front: 0.2, rim: 0.2 }, 0.35)
    const dust = new THREE.Points(dustGeometry, dustMaterial)
    scene.add(dust)
    disposables.push(dustGeometry, dustMaterial)

    const layoutCamera = () => {
      const clientHeight = scrollEl.clientHeight
      if (clientHeight === 0) return
      renderer.setSize(contentWidth, clientHeight, false)
      const worldHeight = clientHeight / PX_PER_UNIT
      camera.top = worldHeight / 2
      camera.bottom = -worldHeight / 2
      camera.updateProjectionMatrix()
      starMaterial.uniforms.uScale.value = PX_PER_UNIT * 0.0095
      dustMaterial.uniforms.uScale.value = PX_PER_UNIT * 0.0095
      setViewHeight(clientHeight)
    }
    layoutCamera()

    const observer = new ResizeObserver(layoutCamera)
    observer.observe(scrollEl)

    let visible = true
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    visibility.observe(mount)

    const clock = new THREE.Clock()
    let frame = 0
    const render = () => {
      frame = requestAnimationFrame(render)
      if (!visible || document.hidden) return
      const elapsed = clock.getElapsedTime()
      starMaterial.uniforms.uTime.value = elapsed
      dustMaterial.uniforms.uTime.value = elapsed
      renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      disposables.forEach((item) => item.dispose())
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [track, isModuleComplete, points, contentWidth, leftX, rightX, currentIndex, totalWorldWidth])

  function pxFor(index: number) {
    const point = points[index]
    return {
      x: (point[0] - leftX) * PX_PER_UNIT,
      y: viewHeight / 2 - point[1] * PX_PER_UNIT,
    }
  }

  return (
    <div className={`constellation ${traveling !== null ? 'is-warping' : ''}`} ref={scrollRef}>
      <div className="constellation__content" style={{ width: contentWidth }}>
        <div className="constellation__sky" ref={mountRef} aria-hidden="true" />

        <svg className="constellation__lines" width={contentWidth} height={viewHeight} aria-hidden="true">
          {track.modules.slice(0, -1).map((mod, i) => {
            const a = pxFor(i)
            const b = pxFor(i + 1)
            const done = isModuleComplete(mod.id) && isModuleComplete(track.modules[i + 1].id)
            const leading = isModuleComplete(mod.id) && !isModuleComplete(track.modules[i + 1].id)
            const cls = done ? 'is-done' : leading ? 'is-leading' : 'is-locked'
            const length = Math.hypot(b.x - a.x, b.y - a.y)
            return (
              <line
                key={mod.id}
                className={`constellation__line ${cls} ${entering ? 'is-entering' : ''} ${
                  burstIndex === i ? 'is-flash' : ''
                }`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                style={
                  entering
                    ? ({ '--line-len': length, animationDelay: `${i * 140}ms` } as CSSProperties)
                    : undefined
                }
              />
            )
          })}
        </svg>

        <div className="constellation__hotspots">
          {track.modules.map((mod, i) => {
            const done = isModuleComplete(mod.id)
            const isCurrent = i === currentIndex
            const state = done ? 'is-done' : isCurrent ? 'is-current' : 'is-locked'
            const { x: leftPx, y: topPx } = pxFor(i)
            return (
              <button
                key={mod.id}
                type="button"
                className={`constellation__hotspot ${state} ${hovered === i ? 'is-hovered' : ''} ${
                  traveling === i ? 'is-traveling' : ''
                } ${entering ? 'is-entering' : ''} ${burstIndex === i ? 'is-bursting' : ''}`}
                style={{
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  ...(entering ? { animationDelay: `${i * 140}ms` } : {}),
                }}
                disabled={traveling !== null}
                onClick={() => travelTo(i)}
                onMouseEnter={() => {
                  setHovered(i)
                  hoverActiveRef.current = true
                }}
                onMouseLeave={() => {
                  setHovered(null)
                  hoverActiveRef.current = false
                }}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                aria-label={`${i + 1}. ${mod.title}`}
              >
                <span className="constellation__halo" aria-hidden="true" />
                <span className="constellation__hotspot-num">
                  <span className="constellation__hotspot-mark">{done ? '★' : isCurrent ? '✦' : '○'}</span>
                </span>
                <span className="constellation__hotspot-label">
                  <span className="constellation__hotspot-index">{i + 1}</span>
                  {mod.title}
                </span>
                {traveling === i && <span className="constellation__warp" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
