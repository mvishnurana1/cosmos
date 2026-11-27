const textureRoot = `${import.meta.env.BASE_URL}textures/`;

const texturedBodies = [
  'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'moon', 'europa', 'titan',
];

export const planetTextures: Record<string, string> = Object.fromEntries(
  texturedBodies.map((id) => [id, `${textureRoot}${id}.jpg`]),
);

export const planetPreviews: Record<string, string> = Object.fromEntries(
  texturedBodies.map((id) => [id, `${textureRoot}${id}-preview.webp`]),
);

export const saturnDiscPreview = `${textureRoot}saturn-disc-preview.webp`;
export const ringTexture = `${textureRoot}saturn-ring.png`;
export const starTexture = `${textureRoot}milky-way.jpg`;
export const earthCloudTexture = `${textureRoot}earth-clouds.jpg`;
