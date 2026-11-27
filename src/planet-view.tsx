import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Component, type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AdditiveBlending, BackSide, DoubleSide, Group, Mesh, SRGBColorSpace, Texture, TextureLoader } from 'three'
import type { Body } from './catalog'
import { earthCloudTexture, planetPreviews, planetTextures, ringTexture } from './textures'

const light = [-3.6, 3, 4.2] as const
const planetTilts: Record<string, number> = { earth: .14, mars: .15, saturn: .2, uranus: -.2 }

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useSurface(url?: string, isColor = true) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    if (!url) return

    let active = true
    const map = new TextureLoader().load(url, loaded => {
      if (!active) return
      if (isColor) loaded.colorSpace = SRGBColorSpace
      loaded.anisotropy = 4
      setTexture(loaded)
    }, undefined, () => {})

    return () => {
      active = false
      map.dispose()
    }
  }, [isColor, url])

  return texture
}

const ringVertex = `
  varying vec2 disk;
  varying vec3 worldPosition;
  void main() {
    disk = position.xy;
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragment = `
  varying vec2 disk;
  varying vec3 worldPosition;
  uniform sampler2D ringMap;
  uniform bool hasRingMap;
  void main() {
    float r = length(disk);
    float c = smoothstep(1.28, 1.51, r);
    float b = smoothstep(1.52, 1.59, r);
    float division = smoothstep(1.938, 1.951, r) * (1.0 - smoothstep(1.99, 2.014, r));
    float outer = smoothstep(2.28, 2.34, r);
    float band = sin(r * 31.0) * .075 + sin(r * 150.0) * .05 + sin(r * 355.0) * .045;
    float grain = fract(sin(dot(disk, vec2(127.1, 311.7))) * 43758.5453);
    vec3 color = mix(vec3(.27, .20, .16), vec3(.83, .70, .53), c);
    color = mix(color, vec3(.9, .80, .65), b * (1.0 - smoothstep(1.89, 1.98, r)));
    color *= .84 + band + grain * .045 - .14 * smoothstep(2.02, 2.14, r);
    vec3 ray = normalize(vec3(-3.6, 3.0, 4.2));
    float projection = dot(worldPosition, ray);
    float separation = length(worldPosition - ray * projection);
    float shadow = step(projection, 0.0) * (1.0 - smoothstep(.94, 1.06, separation));
    color *= 1.0 - shadow * .92;
    float alpha = (.16 + c * .66 + b * .12) * (1.0 - division * .97) * (1.0 - outer);
    if (hasRingMap) {
      vec4 mapped = texture2D(ringMap, vec2((r - 1.28) / 1.06, .5));
      color = mix(color, mapped.rgb * (.92 - shadow * .87), .48);
      alpha *= .42 + mapped.a * .58;
    }
    gl_FragColor = vec4(color, alpha);
  }
`

const atmosphereVertex = `
  varying vec3 normalDirection;
  varying vec3 eyeDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    normalDirection = normalize(normalMatrix * normal);
    eyeDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`

const atmosphereFragment = `
  varying vec3 normalDirection;
  varying vec3 eyeDirection;
  uniform vec3 tint;
  void main() {
    vec3 normal = normalize(normalDirection);
    float edge = pow(1.0 - abs(dot(normal, normalize(eyeDirection))), 4.4);
    float light = max(0.0, dot(normal, normalize(vec3(-.8, .7, .7))));
    gl_FragColor = vec4(tint, edge * (.04 + light * .57));
  }
`

function PlanetModel({ body, speed, zoom, orientation, reducedMotion, onReady }: {
  body: Body
  speed: number
  zoom: number
  orientation: React.RefObject<{ pitch: number; yaw: number }>
  reducedMotion: boolean
  onReady: () => void
}) {
  const sphere = useRef<Mesh>(null)
  const group = useRef<Group>(null)
  const entered = useRef(0)
  const surface = useSurface(planetTextures[body.id])
  const { camera, size } = useThree()
  const saturn = body.id === 'saturn'
  const rings = useSurface(saturn ? ringTexture : undefined, false)
  const clouds = useSurface(body.id === 'earth' ? earthCloudTexture : undefined, false)
  const ringUniforms = useMemo(() => ({
    ringMap: { value: rings },
    hasRingMap: { value: !!rings },
  }), [rings])
  const atmosphere = body.kind === 'star' || ['venus', 'earth', 'jupiter', 'saturn', 'uranus', 'neptune', 'titan'].includes(body.id)
  const tint = useMemo(() => ({
    tint: { value: body.id === 'earth' ? [.21, .48, .88] : [.96, .73, .43] },
  }), [body.id])
  const distance = Math.max(saturn ? 4.15 : 3.85, (saturn ? 7.7 : 3.8) / (size.width / Math.max(1, size.height))) / zoom

  useEffect(() => {
    if (!planetTextures[body.id] || surface) onReady()
  }, [body.id, surface, onReady])

  useFrame((_, delta) => {
    if (!sphere.current || !group.current) return
    const blend = reducedMotion ? 1 : 1 - Math.exp(-8 * delta)
    if (entered.current === 0) camera.position.set(0, 0, distance)
    camera.position.z += (distance - camera.position.z) * blend
    group.current.rotation.x += (orientation.current.pitch - group.current.rotation.x) * blend
    group.current.rotation.y += (orientation.current.yaw - group.current.rotation.y) * blend
    entered.current += (1 - entered.current) * blend
    group.current.scale.setScalar(.86 + entered.current * .14)
    sphere.current.rotation.y += Math.min(delta, .05) * speed * .06
  })

  return <>
    <ambientLight intensity={.13} color="#b3acc9" />
    <directionalLight position={light} intensity={2.05} color="#fff0db" />
    <group ref={group}>
      <group rotation={[-.16, 0, planetTilts[body.id] ?? .04]}>
        <mesh ref={sphere} scale={[1, saturn ? .91 : 1, 1]}>
          <sphereGeometry args={[1, 72, 56]} />
          {body.kind === 'star'
            ? <meshBasicMaterial key={surface?.uuid} color={surface ? '#ffc06a' : body.color} map={surface} />
            : <meshStandardMaterial key={surface?.uuid} color={surface ? '#ffffff' : body.color} map={surface} roughness={1} />}
          {clouds && <mesh scale={1.009}>
            <sphereGeometry args={[1, 64, 48]} />
            <meshStandardMaterial color="#eaf2ff" alphaMap={clouds} opacity={.69} transparent depthWrite={false} roughness={1} />
          </mesh>}
        </mesh>
        {atmosphere && <mesh scale={[1.019, saturn ? .93 : 1.019, 1.019]}>
          <sphereGeometry args={[1, 48, 40]} />
          <shaderMaterial vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment} uniforms={tint}
            side={BackSide} blending={AdditiveBlending} transparent depthWrite={false} />
        </mesh>}
        {saturn && <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.28, 2.34, 160, 3]} />
          <shaderMaterial vertexShader={ringVertex} fragmentShader={ringFragment} uniforms={ringUniforms} side={DoubleSide}
            transparent depthWrite={false} />
        </mesh>}
      </group>
    </group>
  </>
}

export function BodyImage({ body, className = '' }: { body: Body; className?: string }) {
  const preview = planetPreviews[body.id]
  if (preview) return <img className={`body-image ${className}`} src={preview} alt="" draggable={false} />
  return <span aria-hidden="true" className={`body-image fallback-disc ${className}`}
    style={{ '--body-color': body.color, '--body-map': planetTextures[body.id] ? `url("${planetTextures[body.id]}")` : 'none' } as CSSProperties} />
}

export function PlanetView({ body, speed, zoom, reducedMotion, onZoom }: {
  body: Body
  speed: number
  zoom: number
  reducedMotion: boolean
  onZoom: (amount: number) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const orientation = useRef({ pitch: body.id === 'saturn' ? .51 : -.12, yaw: .13 })
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [dragging, setDragging] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    const element = container.current
    if (!element) return
    const zoomWithWheel = (event: WheelEvent) => {
      if (!event.deltaY) return
      event.preventDefault()
      onZoom(event.deltaY < 0 ? .1 : -.1)
    }
    element.addEventListener('wheel', zoomWithWheel, { passive: false })
    return () => element.removeEventListener('wheel', zoomWithWheel)
  }, [onZoom])

  return <div ref={container} className={`planet-view ${ready ? 'is-ready' : ''} ${dragging ? 'is-dragging' : ''}`}
    onPointerDown={event => {
      if (!ready || event.button !== 0) return
      pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }}
    onPointerMove={event => {
      const active = pointer.current
      if (!active || event.pointerId !== active.id) return
      orientation.current.yaw += (event.clientX - active.x) * .008
      orientation.current.pitch = Math.max(-1.35, Math.min(1.35, orientation.current.pitch + (event.clientY - active.y) * .008))
      active.x = event.clientX
      active.y = event.clientY
    }}
    onLostPointerCapture={() => {
      pointer.current = null
      setDragging(false)
    }}>
    <div className={`planet-poster planet-poster--${body.id}`} style={{ scale: zoom }}>
      <BodyImage body={body} />
    </div>
    <div className="planet-render" aria-hidden="true">
      <SceneBoundary>
        <Canvas camera={{ fov: 41, near: .1, far: 100 }} dpr={[1, 1.6]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }} fallback={null}>
          <PlanetModel body={body} speed={speed} zoom={zoom} orientation={orientation} reducedMotion={reducedMotion}
            onReady={handleReady} />
        </Canvas>
      </SceneBoundary>
    </div>
  </div>
}
