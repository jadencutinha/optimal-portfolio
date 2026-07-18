import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { bandedSphere, coronaCloud, constellationStars, makeMaterial, ringDisc } from './celestial/particles'

export type PlanetKind = 'earth' | 'moon' | 'saturn' | 'neptune'

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
    // Ringed planets span far wider than a bare sphere, so they need a taller
    // world box or their rings fall outside the camera and get clipped.
    const worldHeight = kind === 'saturn' ? 4.6 : kind === 'neptune' ? 4.0 : WORLD_HEIGHT
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)

    const body = new THREE.Group()
    const cloudLayer = new THREE.Group()
    const moonOrbit = new THREE.Group()
    const disposables: { dispose: () => void }[] = []
    const allMaterials: THREE.ShaderMaterial[] = []
    let spin = 0.05
    let glowMat: THREE.ShaderMaterial | null = null
    let baseGlowAlpha = 0
    let cloudSpin = 0

    if (kind === 'earth') {
      body.rotation.z = 0.18
      const mat = makeMaterial(dpr, { ambient: 0.05, front: 1.1, rim: 0.65 }, 0.98)
      const geo = bandedSphere(7000, 0.92, new THREE.Color(0x0a2440), new THREE.Color(0x3fc7a8), 13)
      body.add(new THREE.Points(geo, mat))
      disposables.push(geo, mat)
      allMaterials.push(mat)

      // Patchy cloud shell, drifting independently of the surface.
      const cloudMat = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.5)
      const cloudGeo = coronaCloud(420, 0.955, 0.035, new THREE.Color(0xffffff))
      cloudLayer.add(new THREE.Points(cloudGeo, cloudMat))
      disposables.push(cloudGeo, cloudMat)
      allMaterials.push(cloudMat)
      cloudSpin = 0.09

      // Atmosphere glow — brightens on hover.
      const atmoMat = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.3)
      const atmoGeo = coronaCloud(650, 0.98, 0.14, new THREE.Color(0x6fb3dd))
      body.add(new THREE.Points(atmoGeo, atmoMat))
      disposables.push(atmoGeo, atmoMat)
      allMaterials.push(atmoMat)
      glowMat = atmoMat
      baseGlowAlpha = 0.3
      spin = 0.05
    } else if (kind === 'moon') {
      body.rotation.z = 0.05
      const mat = makeMaterial(dpr, { ambient: 0.05, front: 0.95, rim: 0.4 }, 0.92)
      const geo = bandedSphere(5200, 0.88, new THREE.Color(0x2e2b24), new THREE.Color(0x9a9483), 19)
      body.add(new THREE.Points(geo, mat))
      disposables.push(geo, mat)
      allMaterials.push(mat)

      // Sparse dark crater speckling on the surface.
      const craterMat = makeMaterial(dpr, { ambient: 0.02, front: 0.4, rim: 0.2 }, 0.7)
      const craterGeo = coronaCloud(260, 0.865, 0.02, new THREE.Color(0x17140f))
      body.add(new THREE.Points(craterGeo, craterMat))
      disposables.push(craterGeo, craterMat)
      allMaterials.push(craterMat)

      // Very faint rim glow — brightens on hover, but a moon has no real atmosphere.
      const rimMat = makeMaterial(dpr, { ambient: 0, front: 0, rim: 1 }, 0.1)
      const rimGeo = coronaCloud(200, 0.9, 0.02, new THREE.Color(0xd8d2bc))
      body.add(new THREE.Points(rimGeo, rimMat))
      disposables.push(rimGeo, rimMat)
      allMaterials.push(rimMat)
      glowMat = rimMat
      baseGlowAlpha = 0.1
      spin = 0.025
    } else if (kind === 'neptune') {
      body.rotation.z = 0.3
      const mat = makeMaterial(dpr, { ambient: 0.06, front: 1.05, rim: 0.7 }, 0.97)
      const geo = bandedSphere(7000, 0.9, new THREE.Color(0x0a1a3a), new THREE.Color(0x4fd8e8), 21)
      body.add(new THREE.Points(geo, mat))
      disposables.push(geo, mat)
      allMaterials.push(mat)

      // A ring of individually-placed "readout" points — data being read off the surface.
      const readoutMat = makeMaterial(dpr, { ambient: 0.4, front: 0.9, rim: 0.4 }, 0.9)
      const readoutGeo = constellationStars(
        Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2
          return [Math.cos(a) * 0.94, Math.sin(a) * 0.18, Math.sin(a * 1.7) * 0.3] as [number, number, number]
        }),
        new THREE.Color(0xeafcff),
        3,
      )
      body.add(new THREE.Points(readoutGeo, readoutMat))
      disposables.push(readoutGeo, readoutMat)
      allMaterials.push(readoutMat)

      // Thin analytical scan-ring.
      const ringGeo = ringDisc(3600, 1.18, 1.34, 1.34, 1.34, new THREE.Color(0x8fe9f2))
      const ringMat = makeMaterial(dpr, { ambient: 0.8, front: 0.4, rim: 0.2 }, 0.55)
      body.add(new THREE.Points(ringGeo, ringMat))
      disposables.push(ringGeo, ringMat)
      allMaterials.push(ringMat)

      // Atmosphere glow — brightens on hover.
      const atmoMat = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.32)
      const atmoGeo = coronaCloud(600, 0.97, 0.13, new THREE.Color(0x6fe0ea))
      body.add(new THREE.Points(atmoGeo, atmoMat))
      disposables.push(atmoGeo, atmoMat)
      allMaterials.push(atmoMat)
      glowMat = atmoMat
      baseGlowAlpha = 0.32
      spin = 0.045
    } else {
      body.rotation.z = 0.42
      body.rotation.x = 0.1
      const mat = makeMaterial(dpr, { ambient: 0.05, front: 1.1, rim: 0.65 }, 0.95)
      const geo = bandedSphere(7000, 0.82, new THREE.Color(0x5c3d16), new THREE.Color(0xf0d9a3), 17)
      body.add(new THREE.Points(geo, mat))
      disposables.push(geo, mat)
      allMaterials.push(mat)

      // A "great spot" storm.
      const stormMat = makeMaterial(dpr, { ambient: 0.3, front: 0.8, rim: 0.3 }, 0.85)
      const stormGeo = constellationStars(
        Array.from({ length: 26 }, (_, i) => {
          const t = i / 25
          return [0.6 + t * 0.06, -0.18 + t * 0.03, 0.5 + t * 0.04] as [number, number, number]
        }),
        new THREE.Color(0xc75b3a),
        4,
      )
      body.add(new THREE.Points(stormGeo, stormMat))
      disposables.push(stormGeo, stormMat)
      allMaterials.push(stormMat)

      const ringGeo = ringDisc(5200, 1.1, 1.6, 1.24, 1.33, new THREE.Color(0xf0d9a3))
      body.add(new THREE.Points(ringGeo, mat))
      disposables.push(ringGeo)

      const glowRingMat = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.35)
      const glowRingGeo = coronaCloud(500, 1.05, 0.16, new THREE.Color(0xf0d9a3))
      body.add(new THREE.Points(glowRingGeo, glowRingMat))
      disposables.push(glowRingGeo, glowRingMat)
      allMaterials.push(glowRingMat)
      glowMat = glowRingMat
      baseGlowAlpha = 0.35
      spin = 0.04
    }
    scene.add(body)
    scene.add(cloudLayer)

    // Tiny moons, orbiting quietly — they reveal themselves on hover.
    const satelliteMat = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.12)
    const satelliteGeo = constellationStars(
      [
        [1.55, 0.1, 0],
        [-1.3, -0.25, 0.3],
      ],
      new THREE.Color(0xeaf2f0),
      3.2,
    )
    moonOrbit.add(new THREE.Points(satelliteGeo, satelliteMat))
    scene.add(moonOrbit)
    disposables.push(satelliteGeo, satelliteMat)
    allMaterials.push(satelliteMat)

    let hovered = false
    const onEnter = () => { hovered = true }
    const onLeave = () => { hovered = false }
    mount.addEventListener('mouseenter', onEnter)
    mount.addEventListener('mouseleave', onLeave)

    const layoutCamera = () => {
      const { clientWidth, clientHeight } = mount
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      const aspect = clientWidth / clientHeight
      const worldWidth = worldHeight * aspect
      camera.left = -worldWidth / 2
      camera.right = worldWidth / 2
      camera.top = worldHeight / 2
      camera.bottom = -worldHeight / 2
      camera.updateProjectionMatrix()
      const scale = (clientHeight / worldHeight) * 0.0095
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

      const spinMult = hovered && !reduced ? 2.4 : 1
      if (!reduced) {
        body.rotation.y += delta * spin * spinMult
        cloudLayer.rotation.y += delta * cloudSpin * spinMult
        moonOrbit.rotation.y += delta * (hovered ? 1.1 : 0.22)
      }
      cloudLayer.rotation.z = body.rotation.z
      cloudLayer.rotation.x = body.rotation.x

      if (glowMat) {
        glowMat.uniforms.uAlpha.value = hovered ? baseGlowAlpha * 1.8 : baseGlowAlpha
      }
      satelliteMat.uniforms.uAlpha.value = hovered ? 0.85 : 0.12

      renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      mount.removeEventListener('mouseenter', onEnter)
      mount.removeEventListener('mouseleave', onLeave)
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
