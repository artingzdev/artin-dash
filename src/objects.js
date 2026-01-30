import { Assets } from 'pixi.js';

const images = import.meta.glob(
  '/assets/objects/spike_01_001.png?url',
  { eager: true, query: '?url', import: 'default' }
);

export async function loadObjectTextures() {
  const assets = [];

  for (const path in images) {
    const url = images[path];

    const name = path
      .split('/')
      .pop()
      .replace('.png', '');

    assets.push({ alias: name, src: url });
  }

  await Assets.load(assets);
}
