import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CanvasTexture,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
  type OrthographicCamera,
  type Sprite,
  type Texture,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { planets, sun, type Body } from './catalog'
import {
  getDisplayRadius,
  getOrbit,
  orbitalPosition,
  orbitPath,
  simulationDaysPerSecond,
  worldUnitsPerAu,
  type Orbit,
  type OrbitScale,
} from './orbits'
import { planetTextures } from './textures'

export { simulationDaysPerSecond, type OrbitScale }

interface OrreryProps {
  selectedId: string
  onSelect: (id: string) => void
  speed: number
  scale: OrbitScale
  reducedMotion?: boolean
  zoom?: number
  elapsed: Clock
}

interface Clock {
  current: number
}

const noRaycast = () => undefined

function CameraRig({ zoom, reducedMotion }: { zoom: number; reducedMotion: boolean }) {
  const { camera, gl, size } = useThree()
  const controls = useRef<OrbitControls>(null)
  const previousZoom = useRef(zoom)
  const previousFit = useRef(0)
  const projection = camera as OrthographicCamera
  const fit = Math.min(size.width / 76, size.height / 54)

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement)
    orbit.enablePan = false
    orbit.minPolarAngle = 0.08
    orbit.maxPolarAngle = Math.PI * 0.44
    orbit.rotateSpeed = 0.65
    orbit.zoomSpeed = 0.72
    orbit.mouseButtons.RIGHT = orbit.mouseButtons.LEFT
    orbit.update()
    controls.current = orbit

    return () => {
      orbit.dispose()
      controls.current = null
    }
  }, [camera, gl])

  useEffect(() => {
    const orbit = controls.current
    if (orbit) orbit.enableDamping = !reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit || !fit) return

    orbit.minZoom = fit * 0.55
    orbit.maxZoom = fit * 4
    const nextZoom = previousFit.current
      ? projection.zoom * fit / previousFit.current * zoom / previousZoom.current
      : fit * zoom

    projection.zoom = Math.min(orbit.maxZoom, Math.max(orbit.minZoom, nextZoom))
    projection.updateProjectionMatrix()
    previousFit.current = fit
    previousZoom.current = zoom
    orbit.update()
  }, [fit, projection, zoom])

  useFrame(() => controls.current?.update())
  return null
}

function useTexture(id: string) {
  const [texture, setTexture] = useState<Texture>()

  useEffect(() => {
    const url = planetTextures[id]
    if (!url) return

    let cancelled = false
    const pending = new TextureLoader().load(url, (loaded) => {
      if (!cancelled) {
        loaded.colorSpace = SRGBColorSpace
        setTexture(loaded)
      }
    })

    return () => {
      cancelled = true
      pending.dispose()
    }
  }, [id])

  return texture
}

function useDiscTexture(type: 'glow' | 'marker' | 'selection') {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 96
    const context = canvas.getContext('2d')

    if (context && type === 'selection') {
      context.strokeStyle = '#ffad76'
      context.lineWidth = 1.5
      context.setLineDash([7, 5])
      context.beginPath()
      context.arc(48, 48, 41, 0, Math.PI * 2)
      context.stroke()
    } else if (context) {
      const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48)
      gradient.addColorStop(0, '#fff')
      gradient.addColorStop(0.2, type === 'glow' ? '#ffcc85' : '#fff')
      gradient.addColorStop(0.5, type === 'glow' ? '#ec7e3770' : '#ffffff70')
      gradient.addColorStop(1, '#fff0')
      context.fillStyle = gradient
      context.fillRect(0, 0, 96, 96)
    }

    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [type])

  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function BodyLabel({ body, radius, selected }: { body: Body; radius: number; selected: boolean }) {
  const sprite = useRef<Sprite>(null)
  const label = useMemo(() => {
    const font = '600 28px "IBM Plex Mono", Consolas, monospace'
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      context.font = font
      canvas.width = Math.ceil(context.measureText(body.name).width) + 24
      canvas.height = 52
      context.font = font
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = selected ? '#ffbe97' : '#c8d3e5'
      context.shadowColor = '#060914'
      context.shadowBlur = 7
      context.shadowOffsetY = 2
      context.fillText(body.name, canvas.width / 2, canvas.height / 2)
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return { texture, width: canvas.width, height: canvas.height }
  }, [body.name, selected])

  useEffect(() => () => label.texture.dispose(), [label])
  useFrame(({ camera }) => {
    if (!sprite.current) return
    const factor = 0.42 / (camera as OrthographicCamera).zoom
    sprite.current.scale.set(label.width * factor, label.height * factor, 1)
    sprite.current.position.y = radius + factor * 32
  })

  return (
    <sprite ref={sprite} renderOrder={6} raycast={noRaycast}>
      <spriteMaterial map={label.texture} depthTest={false} depthWrite={false} toneMapped={false} transparent />
    </sprite>
  )
}

function BodyMarker({
  body,
  radius,
  selected,
  scientific,
  marker,
  selection,
}: {
  body: Body
  radius: number
  selected: boolean
  scientific: boolean
  marker: Texture
  selection: Texture
}) {
  const dot = useRef<Sprite>(null)
  const halo = useRef<Sprite>(null)
  useFrame(({ camera }) => {
    const zoom = (camera as OrthographicCamera).zoom
    const markerSize = (body.kind === 'star' ? 12 : 7) / zoom
    dot.current?.scale.set(markerSize, markerSize, 1)
    const haloSize = Math.max(radius * (body.id === 'saturn' ? 3.6 : 2.6), 20 / zoom)
    halo.current?.scale.set(haloSize, haloSize, 1)
  })

  return (
    <>
      {scientific && (
        <sprite ref={dot} raycast={noRaycast}>
          <spriteMaterial map={marker} color={body.color} depthWrite={false} toneMapped={false} transparent />
        </sprite>
      )}
      {selected && (
        <sprite ref={halo} renderOrder={5} raycast={noRaycast}>
          <spriteMaterial map={selection} depthTest={false} depthWrite={false} toneMapped={false} transparent />
        </sprite>
      )}
    </>
  )
}

function CelestialBody({
  body,
  orbit,
  elapsed,
  scale,
  selected,
  onSelect,
  marker,
  selection,
  glow,
}: {
  body: Body
  orbit?: Orbit
  elapsed: Clock
  scale: OrbitScale
  selected: boolean
  onSelect: OrreryProps['onSelect']
  marker: Texture
  selection: Texture
  glow: Texture
}) {
  const group = useRef<Group>(null)
  const surface = useRef<Group>(null)
  const texture = useTexture(body.id)
  const canvas = useThree(({ gl }) => gl.domElement)
  const radius = getDisplayRadius(body, scale)
  const scientific = scale === 'scientific'
  const isSun = body.kind === 'star'

  useFrame(() => {
    if (group.current && orbit) orbitalPosition(orbit, elapsed.current, group.current.position)
    if (surface.current) surface.current.rotation.y = (elapsed.current * 0.047) % (Math.PI * 2)
  })

  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    if (event.delta < 5) onSelect(body.id)
  }

  return (
    <group ref={group}>
      {isSun && !scientific && (
        <sprite scale={radius * 4.2} renderOrder={2} raycast={noRaycast}>
          <spriteMaterial map={glow} depthWrite={false} toneMapped={false} transparent opacity={0.78} />
        </sprite>
      )}
      <group ref={surface}>
        <mesh onClick={select} onPointerOver={() => { canvas.style.cursor = 'pointer' }}
          onPointerOut={() => { canvas.style.cursor = '' }}>
          <sphereGeometry args={[radius, 36, 24]} />
          {isSun ? (
            <meshBasicMaterial key={texture?.uuid} map={texture} color={texture ? '#ffd9a0' : body.color} toneMapped={false} />
          ) : (
            <meshStandardMaterial key={texture?.uuid} map={texture} color={texture ? '#ffffff' : body.color} roughness={1} />
          )}
        </mesh>
      </group>
      {body.id === 'saturn' && (
        <mesh rotation={[-Math.PI / 2 - 0.23, -0.27, 0]} raycast={noRaycast}>
          <ringGeometry args={[radius * 1.28, radius * 1.98, 96]} />
          <meshBasicMaterial color="#be9e7c" opacity={0.63} transparent side={2} toneMapped={false} />
        </mesh>
      )}
      {(scientific || radius < 0.6) && (
        <mesh onClick={select}>
          <sphereGeometry args={[Math.max(radius, scientific ? 0.2 : 0.65), 12, 10]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      <BodyMarker body={body} radius={radius} selected={selected} scientific={scientific} marker={marker} selection={selection} />
      {(!scientific || selected || isSun || (body.semiMajorAxisAu ?? 0) > 4) && (
        <BodyLabel body={body} radius={radius} selected={selected} />
      )}
    </group>
  )
}

function OrbitTrack({ orbit, selected = false, icy = false }: { orbit: Orbit; selected?: boolean; icy?: boolean }) {
  const positions = useMemo(() => orbitPath(orbit), [orbit])
  const color = selected ? '#ffae7e' : icy ? '#7ea8bb' : '#758298'

  return (
    <lineLoop key={orbit.axis} raycast={noRaycast}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} depthWrite={false} transparent toneMapped={false} opacity={selected ? 0.75 : icy ? 0.13 : 0.39} />
    </lineLoop>
  )
}

function AsteroidBelt({ scientific, elapsed, marker }: { scientific: boolean; elapsed: Clock; marker: Texture }) {
  const belt = useRef<Group>(null)
  const positions = useMemo(() => {
    const minimum = scientific ? 2.12 * worldUnitsPerAu : 13.1
    const maximum = scientific ? 3.38 * worldUnitsPerAu : 15.4
    let seed = 32184
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 0x100000000
    }

    const positions = new Float32Array(1700 * 3)
    for (let index = 0; index < positions.length; index += 3) {
      const radius = Math.sqrt(minimum ** 2 + random() * (maximum ** 2 - minimum ** 2))
      const angle = random() * Math.PI * 2
      positions[index] = radius * Math.cos(angle)
      positions[index + 1] = (random() - 0.5) * (maximum - minimum) * 0.3
      positions[index + 2] = radius * Math.sin(angle)
    }
    return positions
  }, [scientific])

  useFrame(() => {
    if (belt.current) belt.current.rotation.y = -elapsed.current * 0.0042
  })

  return (
    <group ref={belt}>
      <points raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial map={marker} color="#b8a08d" size={0.074} opacity={0.53} transparent depthWrite={false} toneMapped={false} />
      </points>
    </group>
  )
}

function Comet({ scientific, elapsed, marker }: { scientific: boolean; elapsed: Clock; marker: Texture }) {
  const body = useRef<Group>(null)
  const orbit = useMemo<Orbit>(() => ({
    axis: scientific ? 17.8 * worldUnitsPerAu : 19.6,
    eccentricity: 0.74,
    periodDays: 27_500,
    angle: 1.3,
    tilt: 0.41,
    phase: 1.7,
  }), [scientific])
  const trail = useMemo(() => Float32Array.from({ length: 26 * 3 }, (_, index) => {
    const offset = Math.floor(index / 3) / 26
    return [offset * 3.5, offset ** 2 * 0.3, offset ** 2 * -0.48][index % 3]
  }), [])

  useFrame(() => {
    if (!body.current) return
    const position = orbitalPosition(orbit, elapsed.current, body.current.position)
    body.current.rotation.y = -Math.atan2(position.z, position.x)
  })

  return (
    <>
      <OrbitTrack orbit={orbit} icy />
      <group ref={body}>
        <sprite scale={[0.45, 0.45, 1]} raycast={noRaycast}>
          <spriteMaterial map={marker} color="#cff9ff" depthWrite={false} toneMapped={false} transparent />
        </sprite>
        <points raycast={noRaycast}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[trail, 3]} />
          </bufferGeometry>
          <pointsMaterial map={marker} color="#a6e8ff" size={0.18} opacity={0.45} transparent depthWrite={false} toneMapped={false} />
        </points>
      </group>
    </>
  )
}

function SolarScene({
  selectedId,
  onSelect,
  speed,
  scale,
  reducedMotion = false,
  zoom = 1,
  elapsed,
}: OrreryProps) {
  const marker = useDiscTexture('marker')
  const selection = useDiscTexture('selection')
  const glow = useDiscTexture('glow')
  const orbits = useMemo(() => planets.map((planet) => getOrbit(planet, scale)), [scale])

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05) * speed * simulationDaysPerSecond
  }, -1)

  return (
    <>
      <CameraRig zoom={zoom} reducedMotion={reducedMotion} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[16, 30, 12]} intensity={0.68} />
      <pointLight position={[0, 0, 0]} color="#ffd1a2" intensity={145} decay={2} />
      <CelestialBody body={sun} elapsed={elapsed} scale={scale} selected={selectedId === sun.id} onSelect={onSelect} marker={marker} selection={selection} glow={glow} />
      <AsteroidBelt scientific={scale === 'scientific'} elapsed={elapsed} marker={marker} />
      <Comet scientific={scale === 'scientific'} elapsed={elapsed} marker={marker} />
      {planets.map((body, index) => (
        <group key={body.id}>
          <OrbitTrack orbit={orbits[index]} selected={selectedId === body.id} />
          <CelestialBody body={body} orbit={orbits[index]} elapsed={elapsed} scale={scale} selected={selectedId === body.id} onSelect={onSelect} marker={marker} selection={selection} glow={glow} />
        </group>
      ))}
    </>
  )
}

function SolarFallback({ selectedId, onSelect, speed, scale, zoom = 1, elapsed }: OrreryProps) {
  const chart = useRef<HTMLCanvasElement>(null)
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})
  const bodies = useMemo(() => [sun, ...planets], [])

  useEffect(() => {
    const canvas = chart.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    const tracks = planets.map((body) => {
      const orbit = getOrbit(body, scale)
      return { body, orbit, path: orbitPath(orbit, 100) }
    })
    const position = new Vector3()
    let previous = performance.now()
    let frame = 0

    function render(now: number) {
      if (!canvas) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const ratio = Math.min(1.75, window.devicePixelRatio || 1)
      const fit = Math.min(width / 76, height / 52) * zoom
      const x = (value: number) => width / 2 + value * fit
      const y = (vertical: number, depth: number) => height / 2 + (depth * 0.62 - vertical * 0.78) * fit

      elapsed.current += Math.min((now - previous) / 1000, 0.05) * speed * simulationDaysPerSecond
      previous = now
      const pixelWidth = Math.round(width * ratio)
      const pixelHeight = Math.round(height * ratio)
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      context?.setTransform(ratio, 0, 0, ratio, 0, 0)
      context?.clearRect(0, 0, width, height)

      function place(body: Body, point: Vector3) {
        const button = buttons.current[body.id]
        if (!button) return
        const diameter = Math.max(body.kind === 'star' ? 12 : 6, getDisplayRadius(body, scale) * fit * 2)
        button.style.left = x(point.x) + 'px'
        button.style.top = y(point.y, point.z) + 'px'
        button.style.setProperty('--body-diameter', diameter + 'px')
      }
      place(sun, position.set(0, 0, 0))

      for (const { body, orbit, path } of tracks) {
        place(body, orbitalPosition(orbit, elapsed.current, position))
        if (!context) continue
        context.beginPath()
        context.moveTo(x(path[0]), y(path[1], path[2]))
        for (let index = 3; index < path.length; index += 3) {
          context.lineTo(x(path[index]), y(path[index + 1], path[index + 2]))
        }
        context.closePath()
        context.strokeStyle = selectedId === body.id ? '#ffad76' : '#64748b88'
        context.stroke()
      }
    }

    function tick(now: number) {
      render(now)
      frame = requestAnimationFrame(tick)
    }
    const observer = new ResizeObserver(() => { render(performance.now()) })
    observer.observe(canvas)

    render(previous)
    if (speed !== 0) frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [elapsed, scale, selectedId, speed, zoom])

  return (
    <div aria-label="Solar system diagram" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas aria-hidden ref={chart} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      {bodies.map((body) => (
        <button
          key={body.id}
          ref={(node) => { buttons.current[body.id] = node }}
          type="button"
          aria-label={body.name}
          aria-pressed={selectedId === body.id}
          title={body.name}
          onClick={() => onSelect(body.id)}
          style={{
            position: 'absolute',
            width: 'max(24px, var(--body-diameter, 8px))',
            height: 'max(24px, var(--body-diameter, 8px))',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'grid',
            placeItems: 'center',
            zIndex: selectedId === body.id ? 2 : 1,
            border: 0,
            cursor: 'pointer',
            padding: 0,
            borderRadius: '50%',
            background: 'transparent',
          }}
        >
          <span aria-hidden style={{
            borderRadius: '50%',
            width: 'var(--body-diameter, 8px)',
            height: 'var(--body-diameter, 8px)',
            outline: selectedId === body.id ? '1px dashed #ffad76' : undefined,
            outlineOffset: 4,
            boxShadow: body.kind === 'star' ? '0 0 32px #ff7628b0' : undefined,
            background: 'radial-gradient(circle at 30% 28%, ' + body.color + ', #181923)',
          }} />
        </button>
      ))}
    </div>
  )
}

class OrreryBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function Orrery(props: OrreryProps) {
  const fallback = <SolarFallback {...props} />

  return (
    <OrreryBoundary fallback={fallback}>
      <Canvas
        aria-label="Interactive 3D solar system"
        orthographic
        camera={{ position: [0, 46, 64], near: 0.1, far: 220 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={fallback}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <SolarScene {...props} />
      </Canvas>
    </OrreryBoundary>
  )
}
