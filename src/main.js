
import { Application } from "pixi.js";
import { scrollSpeed, speed, gameSpeed, speedMultiplier, tickSpeed } from "./game-variables.js";
import { createGroundContainer } from "./ground.js";
import { getRenderedSize, gridSpacesToPixels } from "./utils.js";
import { createBackgroundContainer } from "./background.js";
import { createMiddlegroundContainer } from "./middleground.js";
import { createPlayerContainer } from "./player.js";
import { jump, physics, resetCubeRotation, rotateCube, updateJumpVelocity, updatePlayerY } from "./physics.js";
import { jumpHeld } from "./key-states.js";

export let app = new Application();
export const defaultGroundPositionPercentage = (409/512);
 
(async () => {
  await app.init({
    resizeTo: window,
    antialias: true,
    roundPixels: true
  });

  const container = document.getElementById("pixi-container");
  container.appendChild(app.canvas);


  
  // Create containers
  const groundContainer = await createGroundContainer(app);
  groundContainer.y = app.screen.height - getRenderedSize(512 * defaultGroundPositionPercentage);

  const backgroundContainer = await createBackgroundContainer(app);
  const middlegroundContainer = await createMiddlegroundContainer(app);
  const playerContainer = await createPlayerContainer(app);



  // add the layers in order
  app.stage.addChild(backgroundContainer);
  app.stage.addChild(middlegroundContainer);
  app.stage.addChild(playerContainer);
  app.stage.addChild(groundContainer);
  app.ticker.speed = tickSpeed;

  window.addEventListener('resize', () => {
    app.resizeTo = window;
  })

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000;
    groundContainer.groundSprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game;
    groundContainer.ground2Sprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game;
    backgroundContainer.backgroundSprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game * speedMultiplier.background;
    middlegroundContainer.middlegroundSprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game * speedMultiplier.middlegroundX;
    middlegroundContainer.middleground2Sprite.tilePosition.x -= gridSpacesToPixels(scrollSpeed) * deltaSeconds * speed[gameSpeed].game * speedMultiplier.middlegroundX;

    playerContainer.cubeSprite.y = groundContainer.y - gridSpacesToPixels(0.5) - gridSpacesToPixels(physics.playerY);
    updatePlayerY(deltaSeconds);
    rotateCube(deltaSeconds);
    resetCubeRotation(deltaSeconds);
    updateJumpVelocity()
    playerContainer.cubeSprite.rotation = physics.cubeRotation;

    if (jumpHeld) {jump()}
  });
})(); 