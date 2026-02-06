import { Assets, Container, Sprite } from "pixi.js";
import { camera } from "./game-variables";
import { getRenderedSize, gridSpacesToPixels } from "./utils";
import { groundY } from "./main";
import { playerX } from "./player";
import { easeInOut } from "./easing";
import { physics } from "./physics";

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

export async function createPortalBackContainer(app) {
    const portalBackContainer = new Container();
    portalBackContainer.width = app.screen.width;
    portalBackContainer.height = app.screen.height;

    return portalBackContainer;
}






function clampCameraTargets() {
  camera.targetY = Math.max(camera.minY, camera.targetY);
}

let cameraT = 1;
let cameraStartY = camera.y;
let cameraEndY = camera.targetY;

export function updateCamera(dt) {
  clampCameraTargets();

  // ---- SNAP TO GROUND ----
  if (physics.snappingToGround) {
    if (cameraEndY !== camera.targetY) {
      cameraStartY = camera.y;
      cameraEndY = camera.targetY;
      cameraT = 0;
    }

    if (cameraT < 1) {
      cameraT += dt / camera.easeDuration;
      cameraT = Math.min(cameraT, 1);

      camera.y = easeInOut(
        cameraStartY,
        cameraEndY,
        cameraT,
        2
      );
    }

    // Stop snapping once finished
    if (cameraT === 1) {
      physics.snappingToGround = false;
    }
  }

  // ---- PLAYER FOLLOW ----
  else {
    camera.y +=
      (camera.targetY - camera.y) *
      (1 - Math.exp(-camera.followSpeed * dt));
  }

  camera.y = Math.max(camera.minY, camera.y);
}
