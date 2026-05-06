import { AudioClip, Graphics, JsonAsset, Material, Node, ParticleAsset, ParticleSystem2D, resources, Sprite, SpriteAtlas, SpriteFrame, tween, Tween } from 'cc';

export const settings = {
        contentScaleFactor: 4,

        defaultCameraOffsetY: 90,
        defaultCameraX: 15
}

export function pixelsToUnits(pixels: number) {
        return pixels / settings.contentScaleFactor;
}

const atlasCache = new Map<string, SpriteAtlas>();
const materialCache = new Map<string, Material>();
const jsonCache = new Map<string, JsonAsset>();
const plistCache = new Map<string, ParticleAsset>();
const mp3Cache = new Map<string, AudioClip>();
const spriteFrameCache = new Map<string, SpriteFrame>();

export function preloadAtlas(atlasPath: string): Promise<SpriteAtlas> {
        const cached = atlasCache.get(atlasPath);
        if (cached) {
                return Promise.resolve(cached);
        }

        return new Promise((resolve, reject) => {
                resources.load(atlasPath, SpriteAtlas, (err, atlas) => {
                        if (err || !atlas) {
                                reject(new Error(`Failed to load atlas "${atlasPath}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        atlasCache.set(atlasPath, atlas);
                        resolve(atlas);
                });
        });
}

export async function preloadAtlases(atlasPaths: string[]): Promise<void> {
        await Promise.all(atlasPaths.map(preloadAtlas));
}

export function preloadAtlasesInDir(dir: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
                resources.loadDir(dir, SpriteAtlas, (completed, total) => {
                        onProgress?.(completed, total);
                }, (err, atlases) => {
                        if (err || !atlases) {
                                reject(new Error(`Failed to load atlases in "${dir}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        for (const atlas of atlases) {
                                const path = dir ? `${dir}/${atlas.name}` : atlas.name;
                                atlasCache.set(path, atlas);
                        }

                        resolve();
                });
        });
}

export function getCachedSpriteFrameFromAtlas(atlasPath: string, frameName: string): SpriteFrame {
        const atlas = atlasCache.get(atlasPath);
        if (!atlas) {
                throw new Error(`Atlas "${atlasPath}" is not preloaded`);
        }

        const normalizedFrameName = frameName.endsWith('/spriteFrame')
                ? frameName.slice(0, -'/spriteFrame'.length)
                : frameName;
        const extensionlessFrameName = normalizedFrameName.replace(/\.[^/.]+$/, '');

        const frame = atlas.getSpriteFrame(normalizedFrameName)
                ?? atlas.getSpriteFrame(extensionlessFrameName);
        if (!frame) {
                throw new Error(`Sprite frame "${frameName}" was not found in atlas "${atlasPath}"`);
        }

        return frame;
}

export function preloadMaterialsInDir(dir: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
                resources.loadDir(dir, Material, (completed, total) => {
                        onProgress?.(completed, total);
                }, (err, materials) => {
                        if (err || !materials) {
                                reject(new Error(`Failed to load materials in "${dir}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        for (const material of materials) {
                                const path = dir ? `${dir}/${material.name}` : material.name;
                                materialCache.set(path, material);
                        }

                        resolve();
                });
        });
}

export function preloadJsonInDir(dir: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
                resources.loadDir(dir, JsonAsset, (completed, total) => {
                        onProgress?.(completed, total);
                }, (err, jsonAssets) => {
                        if (err || !jsonAssets) {
                                reject(new Error(`Failed to load JSON assets in "${dir}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        for (const jsonAsset of jsonAssets) {
                                const path = dir ? `${dir}/${jsonAsset.name}` : jsonAsset.name;
                                jsonCache.set(path, jsonAsset);
                        }

                        resolve();
                });
        });
}

export function preloadPlistsInDir(dir: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
                resources.loadDir(dir, ParticleAsset, (completed, total) => {
                        onProgress?.(completed, total);
                }, (err, plistAssets) => {
                        if (err || !plistAssets) {
                                reject(new Error(`Failed to load plists in "${dir}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        for (const plistAsset of plistAssets) {
                                const path = dir ? `${dir}/${plistAsset.name}` : plistAsset.name;
                                plistCache.set(path, plistAsset);
                        }

                        resolve();
                });
        });
}

export function preloadMp3InDir(dir: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
                resources.loadDir(dir, AudioClip, (completed, total) => {
                        onProgress?.(completed, total);
                }, (err, audioClips) => {
                        if (err || !audioClips) {
                                reject(new Error(`Failed to load mp3s in "${dir}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        for (const audioClip of audioClips) {
                                const path = dir ? `${dir}/${audioClip.name}` : audioClip.name;
                                mp3Cache.set(path, audioClip);
                        }

                        resolve();
                });
        });
}

export function getCachedJson(path: string): JsonAsset {
        const jsonAsset = jsonCache.get(path);
        if (!jsonAsset) {
                throw new Error(`JSON asset "${path}" is not preloaded`);
        }

        return jsonAsset;
}

export function getCachedPlist(path: string): ParticleAsset {
        const plistAsset = plistCache.get(path);
        if (!plistAsset) {
                throw new Error(`Plist "${path}" is not preloaded`);
        }

        return plistAsset;
}

export function getCachedMp3(path: string): AudioClip {
        const audioClip = mp3Cache.get(path);
        if (!audioClip) {
                throw new Error(`MP3 "${path}" is not preloaded`);
        }

        return audioClip;
}

export function getCachedMaterial(path: string): Material {
        const material = materialCache.get(path);
        if (!material) {
                throw new Error(`Material "${path}" is not preloaded`);
        }

        return material;
}

export function preloadSpriteFrame(path: string): Promise<SpriteFrame> {
        const cached = spriteFrameCache.get(path);
        if (cached) {
                return Promise.resolve(cached);
        }

        return new Promise((resolve, reject) => {
                resources.load(path, SpriteFrame, (err, frame) => {
                        if (err || !frame) {
                                reject(new Error(`Failed to load sprite frame at "${path}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        spriteFrameCache.set(path, frame);
                        resolve(frame);
                });
        });
}

export function preloadSpriteFramesInDir(dir: string, onProgress?: (completed: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
                resources.loadDir(dir, SpriteFrame, (completed, total) => {
                        onProgress?.(completed, total);
                }, (err, frames) => {
                        if (err || !frames) {
                                reject(new Error(`Failed to load sprite frames in "${dir}": ${err?.message ?? 'Unknown error'}`));
                                return;
                        }

                        for (const frame of frames) {
                                const path = dir ? `${dir}/${frame.name}/spriteFrame` : `${frame.name}/spriteFrame`;
                                spriteFrameCache.set(path, frame);
                        }

                        resolve();
                });
        });
}

export function getCachedSpriteFrame(path: string): SpriteFrame {
        const frame = spriteFrameCache.get(path);
        if (!frame) {
                throw new Error(`Sprite frame "${path}" is not preloaded`);
        }

        return frame;
}

export const roundToTarget = (num: number, target: number): number => {
  return Math.round(num / target) * target;
};

// sets the given sprite's blend mode to additive if true, normal if false
export function setSpriteBlending(sprite: Sprite, blending: boolean): void {
        if (!sprite) return;

        const targetMaterial = blending ? getCachedMaterial("blendMat") : null;
        if (sprite.customMaterial === targetMaterial) return;

        sprite.customMaterial = targetMaterial;
}

export function setParticleBlending(particleComponent: ParticleSystem2D, blending: boolean): void {
        if (!particleComponent) return;

        const targetMaterial = blending ? getCachedMaterial("blendMat") : null;
        if (particleComponent.customMaterial === targetMaterial) return;

        particleComponent.customMaterial = targetMaterial;
}

export function setGraphicsBlending(graphics: Graphics, blending: boolean): void {
        if (!graphics) return;

        const targetMaterial = blending ? getCachedMaterial("graphicsBlendMat") : null;
        if (graphics.customMaterial === targetMaterial) return;

        graphics.customMaterial = targetMaterial;
}

export function fixSpriteScale(node: Node, multiplier: number): void {
        node.setScale(
                node.scale.x / settings.contentScaleFactor * multiplier,
                node.scale.y / settings.contentScaleFactor * multiplier,
        );
}

export function slerpAngle(angle1: number, angle2: number, t: number): number {
    t = Math.max(0, Math.min(1, t));
    if (t <= 0) return angle1;
    if (t >= 1) return angle2;

    const cos1 = Math.cos(angle1 * 0.5);
    const sin1 = Math.sin(angle1 * 0.5);
    let cos2 = Math.cos(angle2 * 0.5);
    let sin2 = Math.sin(angle2 * 0.5);

    let dot = sin2 * sin1 + cos2 * cos1;
    if (dot < 0.0) {
        dot = -dot;
        sin2 = -sin2;
        cos2 = -cos2;
    }

    dot = Math.max(-1, Math.min(1, dot));

    let scale0 = 1.0 - t;
    let scale1 = t;
    if (0.0001 < 1.0 - dot) {
        const theta = Math.acos(dot);
        const sinTheta = Math.sin(theta);

        if (Math.abs(sinTheta) > 0.000001) {
            scale0 = Math.sin((1.0 - t) * theta) / sinTheta;
            scale1 = Math.sin(t * theta) / sinTheta;
        }
    }

    return Math.atan2(
        sin1 * scale0 + scale1 * sin2,
        cos1 * scale0 + scale1 * cos2
    ) * 2.0;
}

export function drawPolygon(gfx: Graphics, radius: number, sides: number): void {
    const step = (Math.PI * 2) / sides;
    gfx.moveTo(radius, 0);
    for (let i = 1; i <= sides; i++) {
        const angle = step * i;
        gfx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
}

export const sinDeg = (deg: number) => Math.sin(deg * Math.PI / 180);
export const cosDeg = (deg: number) => Math.cos(deg * Math.PI / 180);
export const toRad = Math.fround(0.017453292);
export const toDeg = Math.fround(57.29578);
