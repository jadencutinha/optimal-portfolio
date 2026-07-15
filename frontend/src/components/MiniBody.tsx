import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { bandedSphere, coronaCloud, makeCrescentMaterial, makeMaterial, ringDisc } from './celestial/particles'

export type MiniBodyKind = 'rings' | 'globe' | 'moon'

const WORLD_HEIGHT = 2.6
const CAMERA_Z = 6

export function MiniBody({ kind }: { kind: MiniBodyKind }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      setFallback(true)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = 'mini-body__canvas'
    mount.appendChild(renderer.domElement)

    const dpr = renderer.getPixelRatio()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)

    const body = new THREE.Group()
    scene.add(body)

    const disposables: { dispose: () => void }[] = []
    const materials: THREE.ShaderMaterial[] = []
    let spin = 0.16

    if (kind === 'rings') {
      body.rotation.z = 0.46
      body.rotation.x = 0.18
      const material = makeMaterial(dpr, { ambient: 0.08, front: 1.05, rim: 0.7 }, 0.95)
      const sphere = bandedSphere(3600, 0.6, new THREE.Color(0x6b4f22), new THREE.Color(0xe0c98a), 12)
      body.add(new THREE.Points(sphere, material))
      const ring = ringDisc(4200, 0.8, 1.2, 1.0, 1.05, new THREE.Color(0xd8b878))
      body.add(new THREE.Points(ring, material))
      disposables.push(sphere, ring, material)
      materials.push(material)
      spin = 0.13
    } else if (kind === 'globe') {
      body.rotation.z = 0.2
      const material = makeMaterial(dpr, { ambient: 0.07, front: 1.05, rim: 0.75 }, 0.95)
      const sphere = bandedSphere(5200, 0.95, new THREE.Color(0x8a6a1f), new THREE.Color(0xf7e7b4), 8)
      body.add(new THREE.Points(sphere, material))
      const halo = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.26)
      const haloGeometry = coronaCloud(700, 0.95, 0.12, new THREE.Color(0xd4af37))
      body.add(new THREE.Points(haloGeometry, halo))
      disposables.push(sphere, material, haloGeometry, halo)
      materials.push(material, halo)
      spin = 0.2
    } else {
      body.rotation.z = 0.08
      const material = makeCrescentMaterial(
        dpr,
        { ambient: 0.12, front: 1, rim: 0.55 },
        0.95,
        new THREE.Vector3(0.92, 0.12, -0.28),
      )
      const sphere = bandedSphere(4600, 0.92, new THREE.Color(0x5a5c60), new THREE.Color(0xf1ede2), 15)
      body.add(new THREE.Points(sphere, material))
      disposables.push(sphere, material)
      materials.push(material)
      spin = 0.1
    }

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
      const scale = (clientHeight / WORLD_HEIGHT) * 0.017
      materials.forEach((material) => {
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
      materials.forEach((material) => {
        material.uniforms.uTime.value = elapsed
      })
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

  return <div className={fallback ? 'mini-body is-fallback' : 'mini-body'} ref={mountRef} aria-hidden="true" />
}
