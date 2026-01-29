import { ParticleContainer, Particle, Assets } from "pixi.js";

export async function createPlayerDragEffect() {
    
const texture = await Assets.load('assets/objects/particles/particle_00_001.png');
    const container = new ParticleContainer({
    dynamicProperties: {
        position: true, // default
        vertex: false,
        rotation: false,
        color: false,
    },
    });

    for (let i = 0; i < 100000; i++) {
    const particle = new Particle({
        texture,
        x: Math.random() * 800,
        y: Math.random() * 600,
    });

    container.addParticle(particle);
    }

    return container;
}