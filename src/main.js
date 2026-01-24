import { Application } from "pixi.js";
import { scrollSpeed, speed, gameSpeed, speedMultiplier, tickSpeed } from "./game-variables.js";
import { createGroundContainer } from "./ground.js";
import { getRenderedSize, gridSpacesToPixels } from "./utils.js";
import { createBackgroundContainer } from "./background.js";
import { createMiddlegroundContainer } from "./middleground.js";
import { createPlayerContainer } from "./player.js";
import { jump, physics, resetCubeRotation, rotateCube, updateJumpVelocity, updatePlayerY, } from "./physics.js";
import { jumpHeld } from "./key-states.js";


window.__ARTIN_GEN__ = (window.__ARTIN_GEN__ || 0) + 1;
const currentGen = window.__ARTIN_GEN__;

export let app = new Application();
export const defaultGroundPositionPercentage = 409 / 512;

(async () => {
  await app.init({
    resizeTo: window,
    antialias: true,
    roundPixels: true,
  });

  // if a newer generation started while awaiting, abort this one
  if (window.__ARTIN_GEN__ !== currentGen) {
    app.destroy(true);
    return;
  }

  const container = document.getElementById("pixi-container");
  // remove any leftover canvases from previous instances
  container.replaceChildren();
  container.appendChild(app.canvas);

  // create containers
  const groundContainer = await createGroundContainer(app);
  if (window.__ARTIN_GEN__ !== currentGen) {
    app.destroy(true);
    return;
  }

  groundContainer.y =
    app.screen.height - getRenderedSize(512 * defaultGroundPositionPercentage);

  const backgroundContainer = await createBackgroundContainer(app);
  if (window.__ARTIN_GEN__ !== currentGen) {
    app.destroy(true);
    return;
  }

  const middlegroundContainer = await createMiddlegroundContainer(app);
  if (window.__ARTIN_GEN__ !== currentGen) {
    app.destroy(true);
    return;
  }

  const playerContainer = await createPlayerContainer(app);
  if (window.__ARTIN_GEN__ !== currentGen) {
    app.destroy(true);
    return;
  }

  // add the layers in order
  app.stage.addChild(backgroundContainer);
  app.stage.addChild(middlegroundContainer);
  app.stage.addChild(playerContainer);
  app.stage.addChild(groundContainer);
  app.ticker.speed = tickSpeed;

  window.addEventListener("resize", () => {
    if (window.__ARTIN_GEN__ === currentGen) {
      app.resizeTo = window;
    }
  });

  app.ticker.add((ticker) => {
    if (window.__ARTIN_GEN__ !== currentGen) {
      app.ticker.stop();
      app.destroy(true);
      return;
    }

    const deltaSeconds = ticker.deltaMS / 1000;

    groundContainer.groundSprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game;
    groundContainer.ground2Sprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game;
    backgroundContainer.backgroundSprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game * speedMultiplier.background;
    middlegroundContainer.middlegroundSprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game * speedMultiplier.middlegroundX;
    middlegroundContainer.middleground2Sprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game * speedMultiplier.middlegroundX;

    playerContainer.cubeSprite.y = groundContainer.y - gridSpacesToPixels(0.5) - gridSpacesToPixels(physics.playerY); updatePlayerY(deltaSeconds);
    rotateCube(deltaSeconds);
    resetCubeRotation(deltaSeconds);
    updateJumpVelocity();
    playerContainer.cubeSprite.rotation = physics.cubeRotation;

    if (jumpHeld) {
      jump();
    }
  });
})();

if (import.meta.hot) {
  import.meta.hot.accept();
}
