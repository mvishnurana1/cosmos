import { Vector3 } from 'three'
import { planets, type Body } from './catalog'

export type OrbitScale = 'cinematic' | 'scientific'

export const simulationDaysPerSecond = 18
export const worldUnitsPerAu = 35 / 30.05
const kilometersPerAu = 149_597_870.7
const fullTurn = 2 * Math.PI
const radians = Math.PI / 180
const cinematicAxes = [5.3, 7.2, 9.2, 11.7, 17, 23, 29, 35]
const startingAngles = [32, 143, 302, 214, 320, 155, 258, 24]
const perihelia = [77, 132, 103, 336, 15, 93, 171, 45]
const inclinations = [7, 3.4, 0, 1.85, 1.3, 2.49, 0.77, 1.77]

export interface Orbit {
  axis: number
  eccentricity: number
  periodDays: number
  phase: number
  angle: number
  tilt: number
}

export const planetOrbits = Object.fromEntries(planets.map((planet, index) => [planet.id, {
  axis: planet.semiMajorAxisAu ?? 1,
  eccentricity: planet.eccentricity ?? 0,
  periodDays: planet.orbitPeriodDays ?? 365.25,
  phase: (startingAngles[index] - perihelia[index]) * radians,
  angle: perihelia[index] * radians,
  tilt: inclinations[index] * radians,
}]))

export function getOrbit(planet: Body, scale: OrbitScale): Orbit {
  const orbit = planetOrbits[planet.id]
  const index = planets.indexOf(planet)
  return {
    ...orbit,
    axis: scale === 'scientific' ? orbit.axis * worldUnitsPerAu : cinematicAxes[index],
  }
}

export function getDisplayRadius(body: Body, scale: OrbitScale): number {
  return scale === 'scientific'
    ? body.diameterKm * worldUnitsPerAu / (2 * kilometersPerAu)
    : body.radius
}

export function positionOnEllipse(orbit: Orbit, eccentricAnomaly: number, target: Vector3): Vector3 {
  const x = orbit.axis * (Math.cos(eccentricAnomaly) - orbit.eccentricity)
  const z = orbit.axis * Math.sqrt(1 - orbit.eccentricity ** 2) * Math.sin(eccentricAnomaly)
  const tiltedZ = z * Math.cos(orbit.tilt)
  return target.set(
    x * Math.cos(orbit.angle) - tiltedZ * Math.sin(orbit.angle),
    z * Math.sin(orbit.tilt),
    x * Math.sin(orbit.angle) + tiltedZ * Math.cos(orbit.angle),
  )
}

export function orbitalPosition(orbit: Orbit, elapsedDays: number, target: Vector3): Vector3 {
  const meanAnomaly = (orbit.phase + elapsedDays / orbit.periodDays * fullTurn) % fullTurn
  let eccentricAnomaly = meanAnomaly

  // Newton's method solves Kepler's equation, so bodies move faster near perihelion.
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const residual = eccentricAnomaly - orbit.eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly
    eccentricAnomaly -= residual / (1 - orbit.eccentricity * Math.cos(eccentricAnomaly))
  }

  return positionOnEllipse(orbit, eccentricAnomaly, target)
}

export function orbitPath(orbit: Orbit, samples = 180): Float32Array {
  const point = new Vector3()
  const positions = new Float32Array(samples * 3)
  for (let index = 0; index < samples; index += 1) {
    positionOnEllipse(orbit, index / samples * fullTurn, point).toArray(positions, index * 3)
  }
  return positions
}
