import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { bandedSphere, coronaCloud, makeMaterial, ringDisc } from './celestial/particles'

export type PlanetKind = 'earth' | 'moon' | 'saturn'

interface Props {
  kind: PlanetKind
  progress: number
}

const WORLD_HEIGHT = 2.3
const CAMERA_Z = 6

export function TrackPlanet({ kind, progress }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = 'track-planet__canvas'
    mount.appendChild(renderer.domElement)

    const dpr = renderer.getPixelRatio()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)

    const body = new THREE.Group()
    const disposables: { dispose: () => void }[] = []
    const allMaterials: THREE.ShaderMaterial[] = []
    let spin = 0.05

    if (kind === 'earth') {
      body.rotation.z = 0.18
      const mat = makeMaterial(dpr, { ambient: 0.06, front: 1.05, rim: 0.7 }, 0.95)
      const geo = bandedSphere(6000, 0.92, new THREE.Color(0x0c2c47), new THREE.Color(0x4fd1c5), 8)
      body.add(new THREE.Points(geo, mat))
      const atmoMat = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.28)
      const atmoGeo = coronaCloud(700, 0.94, 0.1, new THREE.Color(0x6fb3dd))
      body.add(new THREE.Points(atmoGeo, atmoMat))
      disposables.push(geo, mat, atmoGeo, atmoMat)
      allMaterials.push(mat, atmoMat)
      spin = 0.05
    } else if (kind === 'moon') {
      body.rotation.z = 0.05
      const mat = makeMaterial(dpr, { ambient: 0.1, front: 1, rim: 0.55 }, 0.92)
      const geo = bandedSphere(5200, 0.88, new THREE.Color(0x5c574a), new THREE.Color(0xd8d2bc), 15)
      body.add(new THREE.Points(geo, mat))
      disposables.push(geo, mat)
      allMaterials.push(mat)
      spin = 0.03
    } else {
      body.rotation.z = 0.42
      body.rotation.x = 0.1
      const mat = makeMaterial(dpr, { ambient: 0.07, front: 1.05, rim: 0.7 }, 0.9)
      const geo = bandedSphere(6000, 0.82, new THREE.Color(0x6b4f22), new THREE.Color(0xe8c98a), 10)
      body.add(new THREE.Points(geo, mat))
      const ringGeo = ringDisc(4500, 1.12, 1.55, 1.26, 1.34, new THREE.Color(0xe8c98a))
      body.add(new THREE.Points(ringGeo, mat))
      disposables.push(geo, ringGeo, mat)
      allMaterials.push(mat)
      spin = 0.045
    }
    scene.add(body)

    const layoutCamera = () => {
      const { clientWidth, clientHeight } = mount
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      const aspect = clientWidth / clientHeight
      const worldWidth = WORLD_HEIGHT * aspect
      camera.left = -worldWidth / 2
      camera.right = worldWidth / 2
      camera.top = WORLD_HEIGHT / 2
      camera.bottom = -WORLD_HEIGHT / 2
      camera.updateProjectionMatrix()
      const scale = (clientHeight / WORLD_HEIGHT) * 0.0095
      allMaterials.forEach((m) => { m.uniforms.uScale.value = scale })
    }
    layoutCamera()

    const observer = new ResizeObserver(layoutCamera)
    observer.observe(mount)

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
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
      allMaterials.forEach((m) => { m.uniforms.uTime.value = elapsed })
      if (!reduced) body.rotation.y += delta * spin
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
  }, [kind])

  const clamped = Math.max(0, Math.min(100, progress))
  const arcLength = (clamped / 100) * 100
  const angle = (clamped / 100) * Math.PI * 2 - Math.PI / 2
  const satX = 50 + 46 * Math.cos(angle)
  const satY = 50 + 46 * Math.sin(angle)

  return (
    <div className={`track-planet track-planet--${kind}`}>
      <svg className="track-planet__orbit" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        {clamped > 0 && (
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#ffd66b"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${arcLength} 100`}
            transform="rotate(-90 50 50)"
          />
        )}
        {clamped > 0 && clamped < 100 && <circle cx={satX} cy={satY} r="2.2" fill="#eaf2f0" />}
      </svg>
      <div className="track-planet__sky" ref={mountRef} aria-hidden="true" />
    </div>
  )
}
