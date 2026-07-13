import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { bandedSphere, coronaCloud, makeMaterial, ringDisc, star } from './celestial/particles'

interface Props {
  active: number
}

const COUNT = 3
const CAMERA_Z = 10
const WORLD_HEIGHT = 2.6
const BASE_SPACING = 2.35
const SIDE_SCALE = 0.3
const SIDE_EXTENT = 1.6 * SIDE_SCALE
const ARROW_ZONE_PX = 74
const COMPACT_PX = 620
const ACTIVE_SCALE = 1.1

export function CelestialBodies({ active }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      // No WebGL. Fall back to a CSS orb rather than rendering nothing at all.
      setFallback(true)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = 'cosmos__canvas'
    mount.appendChild(renderer.domElement)

    const dpr = renderer.getPixelRatio()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)

    const groups: THREE.Group[] = []
    const bodyMaterials: THREE.ShaderMaterial[] = []
    const allMaterials: THREE.ShaderMaterial[] = []
    const disposables: { dispose: () => void }[] = []
    const baseAlpha: number[] = []

    const neptune = new THREE.Group()
    neptune.rotation.z = 0.24
    const neptuneMaterial = makeMaterial(dpr, { ambient: 0.04, front: 1.05, rim: 0.75 }, 0.82)
    const neptuneGeometry = bandedSphere(10000, 0.95, new THREE.Color(0x1d3f9e), new THREE.Color(0x5fa8ff), 9)
    neptune.add(new THREE.Points(neptuneGeometry, neptuneMaterial))
    disposables.push(neptuneGeometry, neptuneMaterial)
    groups.push(neptune)
    bodyMaterials.push(neptuneMaterial)
    allMaterials.push(neptuneMaterial)
    baseAlpha.push(0.82)
    scene.add(neptune)

    const saturn = new THREE.Group()
    saturn.rotation.z = 0.47
    saturn.rotation.x = 0.12
    const saturnMaterial = makeMaterial(dpr, { ambient: 0.05, front: 1.05, rim: 0.7 }, 0.78)
    const saturnGeometry = bandedSphere(9000, 0.72, new THREE.Color(0x176b45), new THREE.Color(0x76f2b4), 12)
    saturn.add(new THREE.Points(saturnGeometry, saturnMaterial))
    const saturnRing = ringDisc(8000, 0.98, 1.6, 1.34, 1.41, new THREE.Color(0xbdf3d6))
    saturn.add(new THREE.Points(saturnRing, saturnMaterial))
    disposables.push(saturnGeometry, saturnRing, saturnMaterial)
    groups.push(saturn)
    bodyMaterials.push(saturnMaterial)
    allMaterials.push(saturnMaterial)
    baseAlpha.push(0.78)
    scene.add(saturn)

    const sun = new THREE.Group()
    const sunMaterial = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.52)
    const sunGeometry = star(15000, 1, new THREE.Color(0xfff4cf), new THREE.Color(0xff8c1f))
    sun.add(new THREE.Points(sunGeometry, sunMaterial))
    const coronaMaterial = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.3)
    const coronaGeometry = coronaCloud(2600, 0.95, 0.5, new THREE.Color(0xffb457))
    sun.add(new THREE.Points(coronaGeometry, coronaMaterial))
    disposables.push(sunGeometry, sunMaterial, coronaGeometry, coronaMaterial)
    groups.push(sun)
    bodyMaterials.push(sunMaterial)
    allMaterials.push(sunMaterial, coronaMaterial)
    baseAlpha.push(0.52)
    scene.add(sun)

    const CORONA_BASE = 0.3
    const spins = [0.05, 0.042, 0.028]
    const state = groups.map(() => ({ x: 0, scale: SIDE_SCALE, weight: 0 }))
    let spacing = BASE_SPACING
    let compact = false

    const layout = () => {
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

      // Keep the idle bodies clear of both the canvas edge and the arrow buttons.
      const pxPerWorld = clientHeight / WORLD_HEIGHT
      const columnWidth = mount.parentElement?.clientWidth ?? clientWidth
      const arrowInner = Math.max(columnWidth / 2 - ARROW_ZONE_PX, 0) / pxPerWorld
      spacing = Math.min(BASE_SPACING, arrowInner - SIDE_EXTENT, worldWidth / 2 - SIDE_EXTENT - 0.12)

      // On a phone there is no room to flank the active body, so show it alone.
      compact = clientWidth < COMPACT_PX

      const scale = (clientHeight / WORLD_HEIGHT) * 0.0095
      allMaterials.forEach((material) => {
        material.uniforms.uScale.value = scale
      })
    }
    layout()

    const observer = new ResizeObserver(layout)
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
      const delta = clock.getDelta()
      if (!visible || document.hidden) return

      const elapsed = clock.getElapsedTime()
      allMaterials.forEach((material) => {
        material.uniforms.uTime.value = elapsed
      })

      const ease = Math.min(delta * 5, 1)

      groups.forEach((group, index) => {
        if (!reduced) group.rotation.y += delta * spins[index]

        let offset = (index - activeRef.current) % COUNT
        if (offset > COUNT / 2) offset -= COUNT
        if (offset < -COUNT / 2) offset += COUNT

        const isActive = offset === 0
        const item = state[index]
        const targetScale = isActive ? ACTIVE_SCALE : compact ? 0.001 : SIDE_SCALE
        item.x += ((compact ? 0 : offset * spacing) - item.x) * ease
        item.scale += (targetScale - item.scale) * ease
        item.weight += ((isActive ? 1 : 0) - item.weight) * ease

        group.position.x = item.x
        group.scale.setScalar(item.scale)

        const dim = compact ? item.weight : 0.42 + item.weight * 0.58
        bodyMaterials[index].uniforms.uAlpha.value = baseAlpha[index] * dim
        if (index === 2) coronaMaterial.uniforms.uAlpha.value = CORONA_BASE * dim
      })

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
  }, [])

  return <div className={fallback ? 'cosmos__sky is-fallback' : 'cosmos__sky'} ref={mountRef} aria-hidden="true" />
}
