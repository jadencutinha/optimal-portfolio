import * as THREE from 'three'

export const VERTEX = `
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

export const FRAGMENT = `
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

export interface Shade {
  ambient: number
  front: number
  rim: number
}

export function makeMaterial(pixelRatio: number, shade: Shade, alpha: number) {
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

export function bandedSphere(
  count: number,
  radius: number,
  dark: THREE.Color,
  light: THREE.Color,
  frequency: number,
) {
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

export function star(count: number, radius: number, core: THREE.Color, edge: THREE.Color) {
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

export function ringDisc(
  count: number,
  inner: number,
  outer: number,
  gapFrom: number,
  gapTo: number,
  tint: THREE.Color,
) {
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

export function coronaCloud(count: number, from: number, span: number, tint: THREE.Color) {
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

// A handful of individually-positioned bright stars (not a random cloud) — for
// constellation nodes where each point has to stay at a caller-chosen spot.
export function constellationStars(positions: [number, number, number][], color: THREE.Color, size = 6) {
  const particles: Particle[] = positions.map((position) => ({ position, color, size }))
  return toGeometry(particles)
}

