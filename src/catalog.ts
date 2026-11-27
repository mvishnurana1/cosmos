export interface Body {
  id: string;
  name: string;
  kind: 'star' | 'planet' | 'moon';
  classification: string;
  color: string;
  diameterKm: number;
  gravity: number;
  orbitPeriodDays?: number;
  semiMajorAxisAu?: number;
  eccentricity?: number;
  radius: number;
  description: string;
  fact: string;
  source: string;
  parentId?: string;
}

// Mean diameters and equatorial gravity use JPL's planetary physical parameters.
// https://ssd.jpl.nasa.gov/planets/phys_par.html
// Planetary axes and eccentricities use JPL's J2000 Keplerian elements.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
// The display radius is an independent cinematic scale, in scene units.
export const sun: Body = {
  id: 'sun',
  name: 'Sun',
  kind: 'star',
  classification: 'G-type main-sequence star',
  color: '#ffbd72',
  diameterKm: 1_391_400,
  gravity: 274,
  radius: 3.5,
  description: 'Our nearest star is a sphere of hot plasma. Fusion in its core produces the light and heat that reach every planet in the solar system.',
  fact: 'The Sun contains about 99.8% of the mass in the solar system.',
  source: 'https://science.nasa.gov/sun/facts/',
};

export const planets: Body[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    kind: 'planet',
    classification: 'Terrestrial planet',
    color: '#b8aaa0',
    diameterKm: 4_879,
    gravity: 3.7,
    orbitPeriodDays: 87.97,
    semiMajorAxisAu: 0.38709927,
    eccentricity: 0.20563593,
    radius: 0.48,
    description: 'Mercury is a small, cratered world with a large metallic core. Its elongated orbit brings it closer to the Sun than any other planet.',
    fact: 'From sunrise to sunrise on Mercury, about 176 Earth days pass. That’s twice the length of a Mercurian year.',
    source: 'https://science.nasa.gov/mercury/facts/',
  },
  {
    id: 'venus',
    name: 'Venus',
    kind: 'planet',
    classification: 'Terrestrial planet',
    color: '#dfb984',
    diameterKm: 12_104,
    gravity: 8.87,
    orbitPeriodDays: 224.7,
    semiMajorAxisAu: 0.72333566,
    eccentricity: 0.00677672,
    radius: 0.7,
    description: 'Beneath its sulfuric acid clouds, Venus has volcanic plains and mountains. Its dense carbon dioxide atmosphere traps heat in a runaway greenhouse effect.',
    fact: 'Venus is the hottest planet. Its surface is hot enough to melt lead.',
    source: 'https://science.nasa.gov/venus/venus-facts/',
  },
  {
    id: 'earth',
    name: 'Earth',
    kind: 'planet',
    classification: 'Terrestrial planet',
    color: '#69a9ea',
    diameterKm: 12_742,
    gravity: 9.8,
    orbitPeriodDays: 365.26,
    semiMajorAxisAu: 1.00000261,
    eccentricity: 0.01671123,
    radius: 0.73,
    description: 'From orbit, Earth’s oceans and shifting clouds dominate the view. Liquid water and an atmosphere rich in nitrogen and oxygen help sustain life on the surface.',
    fact: 'Earth is the only world we know of that supports life.',
    source: 'https://science.nasa.gov/earth/facts/',
  },
  {
    id: 'mars',
    name: 'Mars',
    kind: 'planet',
    classification: 'Terrestrial planet',
    color: '#df8863',
    diameterKm: 6_779,
    gravity: 3.71,
    orbitPeriodDays: 686.98,
    semiMajorAxisAu: 1.52371034,
    eccentricity: 0.0933941,
    radius: 0.57,
    description: 'Iron-rich dust colors the surface of Mars. Ancient riverbeds and deltas record a time when liquid water flowed across parts of the planet.',
    fact: 'Mars is home to Olympus Mons, the largest volcano in the solar system.',
    source: 'https://science.nasa.gov/mars/facts/',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    kind: 'planet',
    classification: 'Gas giant',
    color: '#dba987',
    diameterKm: 139_822,
    gravity: 24.79,
    orbitPeriodDays: 4_332.82,
    semiMajorAxisAu: 5.202887,
    eccentricity: 0.04838624,
    radius: 2.6,
    description: 'Strong jet streams divide Jupiter’s clouds into bright zones and darker belts. The largest planet is composed mainly of hydrogen and helium.',
    fact: 'Jupiter’s Great Red Spot is a storm larger than Earth that astronomers have observed for centuries.',
    source: 'https://science.nasa.gov/jupiter/jupiter-facts/',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    kind: 'planet',
    classification: 'Gas giant',
    color: '#e1bd89',
    diameterKm: 116_460,
    gravity: 10.44,
    orbitPeriodDays: 10_755.7,
    semiMajorAxisAu: 9.53667594,
    eccentricity: 0.05386179,
    radius: 2.2,
    description: 'Saturn’s rings are made of billions of pieces of ice and rock. Their bright arcs and dark gaps span a vast distance around the pale gas giant.',
    fact: 'Saturn’s average density is lower than that of water.',
    source: 'https://science.nasa.gov/saturn/facts/',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    kind: 'planet',
    classification: 'Ice giant',
    color: '#89cbd0',
    diameterKm: 50_724,
    gravity: 8.87,
    orbitPeriodDays: 30_687.15,
    semiMajorAxisAu: 19.18916464,
    eccentricity: 0.04725744,
    radius: 1.38,
    description: 'Uranus’s methane-bearing atmosphere gives it a blue-green tint. Narrow rings encircle the planet, whose interior contains water, methane, and ammonia.',
    fact: 'Uranus rolls around the Sun with an axial tilt of nearly 98°, creating decades-long seasons.',
    source: 'https://science.nasa.gov/uranus/facts/',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    kind: 'planet',
    classification: 'Ice giant',
    color: '#668dda',
    diameterKm: 49_244,
    gravity: 11.15,
    orbitPeriodDays: 60_190.03,
    semiMajorAxisAu: 30.06992276,
    eccentricity: 0.00859048,
    radius: 1.3,
    description: 'Neptune is the outermost planet, about 30 times as far from the Sun as Earth. Clouds of frozen methane move through its cold upper atmosphere.',
    fact: 'Neptune’s winds can exceed 2,000 kilometers per hour, the fastest in the solar system.',
    source: 'https://science.nasa.gov/neptune/neptune-facts/',
  },
];

// Moon orbital distances are relative to the parent. Surface gravity is GM / r².
// https://ssd.jpl.nasa.gov/sats/phys_par/ and https://ssd.jpl.nasa.gov/sats/elem/
export const moons: Body[] = [
  {
    id: 'moon',
    name: 'Moon',
    kind: 'moon',
    classification: 'Natural satellite',
    parentId: 'earth',
    color: '#c0bbc1',
    diameterKm: 3_475,
    gravity: 1.62,
    orbitPeriodDays: 27.322,
    semiMajorAxisAu: 0.00256956,
    eccentricity: 0.0554,
    radius: 0.25,
    description: 'A fine layer of dust blankets Earth’s rocky companion. Its craters and dark volcanic plains preserve a long history of impacts and eruptions.',
    fact: 'The Moon takes as long to spin as it takes to orbit Earth, so the same hemisphere faces us as it travels.',
    source: 'https://science.nasa.gov/moon/facts/',
  },
  {
    id: 'europa',
    name: 'Europa',
    kind: 'moon',
    classification: 'Icy moon',
    parentId: 'jupiter',
    color: '#d2b6a6',
    diameterKm: 3_122,
    gravity: 1.31,
    orbitPeriodDays: 3.551,
    semiMajorAxisAu: 0.00448603,
    eccentricity: 0.009,
    radius: 0.25,
    description: 'Reddish fractures cross Europa’s bright ice shell. As the moon orbits Jupiter, tidal forces flex its interior and help keep it warm.',
    fact: 'Evidence suggests Europa’s hidden ocean could hold more than twice the water in all of Earth’s oceans.',
    source: 'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/',
  },
  {
    id: 'titan',
    name: 'Titan',
    kind: 'moon',
    classification: 'Icy moon',
    parentId: 'saturn',
    color: '#d4a86c',
    diameterKm: 5_150,
    gravity: 1.35,
    orbitPeriodDays: 15.945448,
    semiMajorAxisAu: 0.0081679,
    eccentricity: 0.029,
    radius: 0.37,
    description: 'A thick nitrogen atmosphere hides the surface of Saturn’s largest moon. Below the orange haze, hydrocarbon rain feeds rivers, lakes, and seas.',
    fact: 'Titan is wider than Mercury and has lakes of liquid methane and ethane.',
    source: 'https://science.nasa.gov/saturn/moons/titan/facts/',
  },
];

export const catalog = [sun, ...planets, ...moons];
export const bodyById = new Map(catalog.map((body) => [body.id, body]));
