import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { makeMaterial, ringDisc } from './celestial/particles'

const RING_RADIUS = 2.42
const LOGO_WIDTH = 3.0
const TILT_X = -1.12
const FIT_WIDTH = 6.2
const FIT_HEIGHT = 6.2

export function HeroHalo({ className, paused = false }: { className?: string; paused?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

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
    const dpr = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(dpr)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)

    const logoGeometry = new THREE.PlaneGeometry(1, 1)
    const logoMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
    const logo = new THREE.Mesh(logoGeometry, logoMaterial)
    logo.renderOrder = 0
    logo.visible = false
    scene.add(logo)

    const loader = new THREE.TextureLoader()
    const logoTexture = loader.load('/logo-wordmark.png', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      const image = texture.image as { width: number; height: number }
      const aspect = image.width / image.height
      logo.scale.set(LOGO_WIDTH, LOGO_WIDTH / aspect, 1)
      logoMaterial.map = texture
      logoMaterial.needsUpdate = true
      logo.visible = true
    })

    const halo = new THREE.Group()
    halo.rotation.x = TILT_X
    scene.add(halo)

    const spin = new THREE.Group()
    halo.add(spin)

    const glintGeometry = new THREE.SphereGeometry(0.04, 10, 10)
    const glintMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff6d8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const glint = new THREE.Mesh(glintGeometry, glintMaterial)
    glint.renderOrder = 2
    spin.add(glint)

    const materials: THREE.ShaderMaterial[] = []

    const coreMaterial = makeMaterial(dpr, { ambient: 0.62, front: 0.7, rim: 0.45 }, 1)
    coreMaterial.depthTest = true
    const coreGeometry = ringDisc(14000, 2.3, 2.545, 2.418, 2.442, new THREE.Color(0xf0cf6a))
    const core = new THREE.Points(coreGeometry, coreMaterial)
    core.renderOrder = 1
    spin.add(core)
    materials.push(coreMaterial)

    const veilMaterial = makeMaterial(dpr, { ambient: 0.5, front: 0.6, rim: 0.4 }, 0.34)
    veilMaterial.depthTest = true
    const veilGeometry = ringDisc(3200, 2.56, 2.78, 0, 0, new THREE.Color(0xd8ae52))
    const veil = new THREE.Points(veilGeometry, veilMaterial)
    veil.renderOrder = 1
    spin.add(veil)
    materials.push(veilMaterial)

    const innerMaterial = makeMaterial(dpr, { ambient: 0.5, front: 0.6, rim: 0.4 }, 0.26)
    innerMaterial.depthTest = true
    const innerGeometry = ringDisc(1800, 2.16, 2.29, 0, 0, new THREE.Color(0xf7e7b4))
    const inner = new THREE.Points(innerGeometry, innerMaterial)
    inner.renderOrder = 1
    spin.add(inner)
    materials.push(innerMaterial)

    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 2
      target.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    if (!reduced) window.addEventListener('pointermove', onPointerMove)

    const fovRad = THREE.MathUtils.degToRad(40)
    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      const aspect = width / height
      camera.aspect = aspect
      const distForWidth = FIT_WIDTH / 2 / (Math.tan(fovRad / 2) * aspect)
      const distForHeight = FIT_HEIGHT / 2 / Math.tan(fovRad / 2)
      camera.position.z = Math.max(distForWidth, distForHeight) * 1.04
      camera.updateProjectionMatrix()
      const scale = (height / FIT_HEIGHT) * 0.009
      materials.forEach((material) => {
        material.uniforms.uScale.value = scale
      })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    mount.appendChild(renderer.domElement)

    let visible = true
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    visibility.observe(mount)

    const clock = new THREE.Clock()
    let frame = 0

    const draw = () => {
      const elapsed = clock.getElapsedTime()
      materials.forEach((material) => {
        material.uniforms.uTime.value = elapsed
      })

      spin.rotation.y = elapsed * 0.22
      halo.rotation.x = TILT_X + Math.sin(elapsed * 0.28) * 0.05
      halo.rotation.z = Math.sin(elapsed * 0.19) * 0.03

      const glintAngle = -elapsed * 0.22
      glint.position.set(Math.cos(glintAngle) * RING_RADIUS, 0, Math.sin(glintAngle) * RING_RADIUS)

      pointer.x += (target.x - pointer.x) * 0.04
      pointer.y += (target.y - pointer.y) * 0.04
      camera.position.x = pointer.x * 0.28
      camera.position.y = -pointer.y * 0.16
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    if (reduced) {
      spin.rotation.y = 0.4
      glint.position.set(Math.cos(0.6) * RING_RADIUS, 0, Math.sin(0.6) * RING_RADIUS)
      camera.lookAt(0, 0, 0)
      const paint = () => {
        materials.forEach((material) => {
          material.uniforms.uTime.value = 0
        })
        renderer.render(scene, camera)
      }
      paint()
      logoTexture.addEventListener('dispose', paint)
      setTimeout(paint, 240)
    } else {
      const loop = () => {
        frame = requestAnimationFrame(loop)
        if (!visible || document.hidden || pausedRef.current) return
        draw()
      }
      frame = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      logoGeometry.dispose()
      logoMaterial.dispose()
      logoTexture.dispose()
      glintGeometry.dispose()
      glintMaterial.dispose()
      coreGeometry.dispose()
      coreMaterial.dispose()
      veilGeometry.dispose()
      veilMaterial.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  const classes = ['hero-halo', className, fallback ? 'is-fallback' : ''].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div ref={mountRef} className="hero-halo__stage" aria-hidden="true" />
      {fallback && <img src="/logo-wordmark.png" alt="Halo!" className="hero-halo__fallback" />}
    </div>
  )
}
