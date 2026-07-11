import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  gain?: number
  className?: string
}

interface Exchange {
  name: string
  lat: number
  lon: number
}

const EXCHANGES: Exchange[] = [
  { name: 'New York', lat: 40.71, lon: -74.01 },
  { name: 'Toronto', lat: 43.65, lon: -79.38 },
  { name: 'Sao Paulo', lat: -23.55, lon: -46.63 },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Frankfurt', lat: 50.11, lon: 8.68 },
  { name: 'Zurich', lat: 47.37, lon: 8.54 },
  { name: 'Johannesburg', lat: -26.2, lon: 28.05 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  { name: 'Hong Kong', lat: 22.32, lon: 114.17 },
  { name: 'Tokyo', lat: 35.68, lon: 139.65 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Sydney', lat: -33.87, lon: 151.21 },
]

const DOT_COUNT = 44000
const RADIUS = 1
const LAND_MASK_URL = '/land-mask.png'
const LAND_THRESHOLD = 200
const OCEAN_KEEP = 0.3

function sampleLandMask(image: HTMLImageElement): ((phi: number, theta: number) => boolean) | null {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0)

  let pixels: Uint8ClampedArray
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  } catch {
    return null
  }

  const { width, height } = canvas
  return (phi: number, theta: number) => {
    const u = theta / (Math.PI * 2)
    const v = phi / Math.PI
    const x = Math.min(Math.max(Math.round(u * (width - 1)), 0), width - 1)
    const y = Math.min(Math.max(Math.round(v * (height - 1)), 0), height - 1)
    const index = (y * width + x) * 4
    return Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) >= LAND_THRESHOLD
  }
}

function loadLandMask(): Promise<((phi: number, theta: number) => boolean) | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(sampleLandMask(image))
    image.onerror = () => resolve(null)
    image.src = LAND_MASK_URL
  })
}

function toVector(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

const VERTEX = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aLand;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vFacing;
  varying float vTwinkle;
  varying float vLand;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 dir = normalize((modelViewMatrix * vec4(position, 0.0)).xyz);
    vFacing = dir.z;
    vLand = aLand;
    vTwinkle = 0.8 + 0.2 * sin(uTime * 1.4 + aSeed * 6.283);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uScale * (2.6 / max(-mv.z, 0.001));
  }
`

const FRAGMENT = `
  uniform vec3 uColor;
  uniform vec3 uLandColor;
  uniform vec3 uRimColor;
  uniform float uAlpha;
  varying float vFacing;
  varying float vTwinkle;
  varying float vLand;

  void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float dist = dot(offset, offset);
    if (dist > 0.25) discard;

    float disc = smoothstep(0.25, 0.03, dist);
    float front = smoothstep(-0.1, 0.8, vFacing);
    float rim = pow(1.0 - abs(vFacing), 5.0);

    vec3 base = mix(uColor, uLandColor, vLand);
    vec3 color = mix(base, uRimColor, clamp(rim, 0.0, 1.0));

    float weight = mix(0.55, 1.6, vLand);
    float alpha = disc * vTwinkle * (front * weight + rim * 0.5) * uAlpha;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
  }
`

export function InvestGlobe({ gain = 0, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const gainRef = useRef(gain)
  gainRef.current = gain

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

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 3.2)

    const globe = new THREE.Group()
    globe.rotation.z = -0.36
    globe.rotation.y = -1.83
    scene.add(globe)

    const buildSphere = (isLand: ((phi: number, theta: number) => boolean) | null) => {
      const positions: number[] = []
      const sizes: number[] = []
      const seeds: number[] = []
      const lands: number[] = []
      const golden = Math.PI * (3 - Math.sqrt(5))

      for (let i = 0; i < DOT_COUNT; i += 1) {
        const y = 1 - (i / (DOT_COUNT - 1)) * 2
        const ring = Math.sqrt(Math.max(1 - y * y, 0))
        const spiral = golden * i
        const x = Math.cos(spiral) * ring
        const z = Math.sin(spiral) * ring

        const phi = Math.acos(Math.min(Math.max(y, -1), 1))
        let theta = Math.atan2(z, -x)
        if (theta < 0) theta += Math.PI * 2

        const land = isLand ? isLand(phi, theta) : true
        if (!land && Math.random() > OCEAN_KEEP) continue

        const jitter = (Math.random() - 0.5) * 0.05
        const spun = spiral + jitter
        const wobble = 1 + (Math.random() - 0.5) * 0.012
        positions.push(
          Math.cos(spun) * ring * RADIUS * wobble,
          y * RADIUS * wobble,
          Math.sin(spun) * ring * RADIUS * wobble,
        )
        sizes.push(land ? 2.3 + Math.random() * 1.2 : 1.7 + Math.random() * 0.9)
        seeds.push(Math.random())
        lands.push(land ? 1 : 0)
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(positions), 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(Float32Array.from(sizes), 1))
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from(seeds), 1))
      geometry.setAttribute('aLand', new THREE.BufferAttribute(Float32Array.from(lands), 1))
      return geometry
    }

    const uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uScale: { value: 1 },
      uAlpha: { value: 1 },
      uColor: { value: new THREE.Color(0x2f6ac4) },
      uLandColor: { value: new THREE.Color(0x6fb4ff) },
      uRimColor: { value: new THREE.Color(0xd6ecff) },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    let geometry = buildSphere(null)
    const sphere = new THREE.Points(geometry, material)
    globe.add(sphere)

    let disposed = false
    loadLandMask().then((isLand) => {
      if (disposed || !isLand) return
      const next = buildSphere(isLand)
      sphere.geometry = next
      geometry.dispose()
      geometry = next
    })

    const nodePositions = new Float32Array(EXCHANGES.length * 3)
    const nodeSizes = new Float32Array(EXCHANGES.length)
    const nodeSeeds = new Float32Array(EXCHANGES.length)
    const nodeLands = new Float32Array(EXCHANGES.length)
    EXCHANGES.forEach((exchange, index) => {
      const point = toVector(exchange.lat, exchange.lon, RADIUS * 1.012)
      nodePositions[index * 3] = point.x
      nodePositions[index * 3 + 1] = point.y
      nodePositions[index * 3 + 2] = point.z
      nodeSizes[index] = 5.2
      nodeSeeds[index] = index / EXCHANGES.length
      nodeLands[index] = 1
    })

    const nodeGeometry = new THREE.BufferGeometry()
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    nodeGeometry.setAttribute('aSize', new THREE.BufferAttribute(nodeSizes, 1))
    nodeGeometry.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeeds, 1))
    nodeGeometry.setAttribute('aLand', new THREE.BufferAttribute(nodeLands, 1))

    const nodeUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uScale: { value: 1 },
      uAlpha: { value: 2.4 },
      uColor: { value: new THREE.Color(0xbcdcff) },
      uLandColor: { value: new THREE.Color(0xe8f4ff) },
      uRimColor: { value: new THREE.Color(0xffffff) },
    }
    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: nodeUniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    globe.add(new THREE.Points(nodeGeometry, nodeMaterial))

    mount.appendChild(renderer.domElement)

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      const scale = Math.min(clientHeight, clientWidth) / 620
      uniforms.uScale.value = scale
      nodeUniforms.uScale.value = scale
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    let visible = true
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    visibility.observe(mount)

    const clock = new THREE.Clock()
    let frame = 0

    const baseLand = new THREE.Color(0x6fb4ff)
    const up = new THREE.Color(0x4ce3b4)
    const down = new THREE.Color(0xff7b7b)

    const render = () => {
      frame = requestAnimationFrame(render)
      const delta = clock.getDelta()
      if (!visible || document.hidden) return

      const elapsed = clock.getElapsedTime()
      uniforms.uTime.value = elapsed
      nodeUniforms.uTime.value = elapsed * 2.2

      const strength = Math.min(Math.abs(gainRef.current) * 12, 1)
      const target = gainRef.current >= 0 ? up : down
      uniforms.uLandColor.value.copy(baseLand).lerp(target, strength * 0.55)

      if (!reduced) globe.rotation.y += delta * 0.055

      renderer.render(scene, camera)
    }
    render()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      geometry.dispose()
      material.dispose()
      nodeGeometry.dispose()
      nodeMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div className={className ? `globe ${className}` : 'globe'} ref={mountRef} aria-hidden="true" />
}
