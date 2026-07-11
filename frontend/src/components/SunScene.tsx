import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { coronaCloud, makeMaterial, star } from './celestial/particles'

const CAMERA_Z = 10
const WORLD_HEIGHT = 3.2

export function SunScene() {
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
    renderer.domElement.className = 'sunscene__canvas'
    mount.appendChild(renderer.domElement)

    const dpr = renderer.getPixelRatio()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 0, CAMERA_Z)

    const sun = new THREE.Group()
    scene.add(sun)

    const sunMaterial = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.52)
    const sunGeometry = star(15000, 1, new THREE.Color(0xfff4cf), new THREE.Color(0xff8c1f))
    sun.add(new THREE.Points(sunGeometry, sunMaterial))

    const coronaMaterial = makeMaterial(dpr, { ambient: 1, front: 0, rim: 0 }, 0.3)
    const coronaGeometry = coronaCloud(3000, 0.95, 0.6, new THREE.Color(0xffb457))
    sun.add(new THREE.Points(coronaGeometry, coronaMaterial))

    const materials = [sunMaterial, coronaMaterial]

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

      const scale = (clientHeight / WORLD_HEIGHT) * 0.0095
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
      // A slow breath, so the star feels alive without pulling focus from the form.
      sunMaterial.uniforms.uAlpha.value = 0.52 + Math.sin(elapsed * 0.7) * 0.05
      if (!reduced) sun.rotation.y += delta * 0.03

      renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      sunGeometry.dispose()
      sunMaterial.dispose()
      coronaGeometry.dispose()
      coronaMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="sunscene" ref={mountRef} aria-hidden="true" />
}
