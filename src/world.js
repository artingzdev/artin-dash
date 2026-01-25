import { Assets, Container, Sprite } from "pixi.js";
import { camera } from "./game-variables";
import { getRenderedSize, gridSpacesToPixels } from "./utils";
import { groundY } from "./main";
import { playerX } from "./player";

// create world layers
export async function createB5Container(app) {
    const b5Container = new Container();
    b5Container.width = app.screen.width;
    b5Container.height = app.screen.height;

    return b5Container;
}

export async function createB4Container(app) {
    const b4Container = new Container();
    b4Container.width = app.screen.width;
    b4Container.height = app.screen.height;

    return b4Container;
}

export async function createB3Container(app) {
    const b3Container = new Container();
    b3Container.width = app.screen.width;
    b3Container.height = app.screen.height;

    return b3Container;
}

export async function createB2Container(app) {
    const b2Container = new Container();
    b2Container.width = app.screen.width;
    b2Container.height = app.screen.height;

    return b2Container;
}

export async function createB1Container(app) {
    const b1Container = new Container();
    b1Container.width = app.screen.width;
    b1Container.height = app.screen.height;

    return b1Container;
}

export async function createT1Container(app) {
    const t1Container = new Container();
    t1Container.width = app.screen.width;
    t1Container.height = app.screen.height;

    const spikeTexture = await Assets.load('assets/objects/spike_02_001.png');
    const spikeSprite = new Sprite({
        texture: spikeTexture,
        width: getRenderedSize(spikeTexture.width),
        height: getRenderedSize(spikeTexture.height),
        y: groundY,
        x: playerX + gridSpacesToPixels(30) // the second part is the object's X position relative to the start of the level 
    })

    spikeSprite.anchor.y = 1;
    spikeSprite.anchor.x = 0.5;

    t1Container.addChild(spikeSprite);

    return t1Container;
}

export async function createT2Container(app) {
    const t2Container = new Container();
    t2Container.width = app.screen.width;
    t2Container.height = app.screen.height;

    return t2Container;
}

export async function createT3Container(app) {
    const t3Container = new Container();
    t3Container.width = app.screen.width;
    t3Container.height = app.screen.height;

    return t3Container;
}

export async function createT4Container(app) {
    const t4Container = new Container();
    t4Container.width = app.screen.width;
    t4Container.height = app.screen.height;

    return t4Container;
}








function clampCameraTargets() {
  camera.targetY = Math.max(camera.minY, camera.targetY);
}

export function updateCamera(dt) {
  clampCameraTargets();

  const stiffnessY = 100;
  const dampingY = 0.8;

  let dy = camera.targetY - camera.y;
  camera.velocityY += dy * stiffnessY * dt;
  camera.velocityY *= dampingY;
  camera.y += camera.velocityY * dt;

  camera.y = Math.max(camera.minY, camera.y);
}