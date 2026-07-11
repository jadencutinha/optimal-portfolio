import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  active: number
}

const COUNT = 3
const CAMERA_Z = 10
const WORLD_HEIGHT = 2.6
const BASE_SPACING = 2.35
const SIDE_SCALE = 0.3
const ACTIVE_SCALE = 1.1
// Saturn's rings are the widest thing a side body can carry.
const SIDE_EXTENT = 1.6 * SIDE_SCALE
const ARROW_ZONE_PX = 74

const VERTEX = `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  varying vec3 vColor;
  varying float vFacing;
  varying float vTwinkle;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 dir = normalize((modelViewMatrix * vec4(normalize(position), 0.0)).xyz);
    vFacing = dir.z;
    vColor = aColor;
    vTwinkle = 0.78 + 0.22 * sin(uTime * 1.6 + aSeed * 6.283);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uScale;
  }
`

const FRAGMENT = `
  uniform float uAlpha;
  uniform float uAmbient;
  uniform float uFront;
  uniform float uRim;
  varying vec3 vColor;
  varying float vFacing;
  varying float vTwinkle;

  void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float dist = dot(offset, offset);
    if (dist > 0.25) discard;

    float disc = smoothstep(0.25, 0.03, dist);
    float front = smoothstep(-0.15, 0.8, vFacing);
    float rim = pow(1.0 - abs(vFacing), 5.0);

    float shade = uAmbient + front * uFront + rim * uRim;
    float alpha = disc * vTwinkle * shade * uAlpha;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(vColor, alpha);
  }
`

interface Shade {
  ambient: number
  front: number
  rim: number
}

function makeMaterial(pixelRatio: number, shade: Shade, alpha: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uScale: { value: 1 },
      uAlpha: { value: alpha },
      uAmbient: { value: shade.ambient },
      uFront: { value: shade.front },
      uRim: { value: shade.rim },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
}

interface Particle {
  position: [number, number, number]
  color: THREE.Color
  size: number
}

function toGeometry(particles: Particle[]) {
  const count = particles.length
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const seeds = new Float32Array(count)

  particles.forEach((particle, i) => {
    positions[i * 3] = particle.position[0]
    positions[i * 3 + 1] = particle.position[1]
    positions[i * 3 + 2] = particle.position[2]
    colors[i * 3] = particle.color.r
    colors[i * 3 + 1] = particle.color.g
    colors[i * 3 + 2] = particle.color.b
    sizes[i] = particle.size
    seeds[i] = Math.random()
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  return geometry
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

function bandedSphere(count: number, radius: number, dark: THREE.Color, light: THREE.Color, frequency: number) {
  const particles: Particle[] = []
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2
    const ringRadius = Math.sqrt(Math.max(1 - y * y, 0))
    const theta = GOLDEN * i + (Math.random() - 0.5) * 0.05
    const wobble = 1 + (Math.random() - 0.5) * 0.014
    const band = 0.5 + 0.5 * Math.sin(y * frequency + Math.sin(y * frequency * 2.3) * 0.8)
    particles.push({
      position: [
        Math.cos(theta) * ringRadius * radius * wobble,
        y * radius * wobble,
        Math.sin(theta) * ringRadius * radius * wobble,
      ],
      color: dark.clone().lerp(light, band * 0.8 + Math.random() * 0.14),
      size: 2.1 + Math.random() * 1.2,
    })
  }
  return toGeometry(particles)
}

function star(count: number, radius: number, core: THREE.Color, edge: THREE.Color) {
  const particles: Particle[] = []
  for (let i = 0; i < count; i += 1) {
    const depth = Math.cbrt(Math.random())
    const u = Math.random() * 2 - 1
    const angle = Math.random() * Math.PI * 2
    const ringRadius = Math.sqrt(Math.max(1 - u * u, 0))
    const r = depth * radius
    particles.push({
      position: [Math.cos(angle) * ringRadius * r, u * r, Math.sin(angle) * ringRadius * r],
      color: core.clone().lerp(edge, Math.pow(depth, 3)),
      size: 1.7 + Math.random() * 1.5,
    })
  }
  return toGeometry(particles)
}

function ringDisc(count: number, inner: number, outer: number, gapFrom: number, gapTo: number, tint: THREE.Color) {
  const particles: Particle[] = []
  let guard = 0
  while (particles.length < count && guard < count * 8) {
    guard += 1
    const radius = inner + Math.random() * (outer - inner)
    if (radius > gapFrom && radius < gapTo) continue

    const angle = Math.random() * Math.PI * 2
    const t = (radius - inner) / (outer - inner)
    const shade = Math.min(0.55 + Math.sin(t * 9) * 0.2 + t * 0.25, 1)
    particles.push({
      position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 0.012, Math.sin(angle) * radius],
      color: tint.clone().multiplyScalar(shade),
      size: 1.5 + Math.random() * 1.1,
    })
  }
  return toGeometry(particles)
}

function coronaCloud(count: number, from: number, span: number, tint: THREE.Color) {
  const particles: Particle[] = []
  for (let i = 0; i < count; i += 1) {
    const radius = from + Math.pow(Math.random(), 2.4) * span
    const u = Math.random() * 2 - 1
    const angle = Math.random() * Math.PI * 2
    const ringRadius = Math.sqrt(Math.max(1 - u * u, 0))
    const fade = 1 - (radius - from) / span
    particles.push({
      position: [Math.cos(angle) * ringRadius * radius, u * radius, Math.sin(angle) * ringRadius * radius],
      color: tint.clone().multiplyScalar(fade),
      size: 1.6 + Math.random() * 2.2,
    })
  }
  return toGeometry(particles)
}

export function CelestialBodies({ active }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active

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
        item.x += (offset * spacing - item.x) * ease
        item.scale += ((isActive ? ACTIVE_SCALE : SIDE_SCALE) - item.scale) * ease
        item.weight += ((isActive ? 1 : 0) - item.weight) * ease

        group.position.x = item.x
        group.scale.setScalar(item.scale)

        const dim = 0.42 + item.weight * 0.58
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

  return <div className="cosmos__sky" ref={mountRef} aria-hidden="true" />
}
