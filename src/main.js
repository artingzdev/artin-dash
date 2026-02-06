import { Application, Assets, Graphics, Particle, ParticleContainer, Rectangle, TilingSprite } from "pixi.js";
import { speed, speedMultiplier, camera, gameSettings } from "./game-variables.js";
import { createGroundContainer, updateGround } from "./ground.js";
import { degToRad, getRenderedSize, gridSpacesToPixels, randSign } from "./utils.js";
import { createBackgroundContainer, updateBackground } from "./background.js";
import { createMiddlegroundContainer, updateMiddleground } from "./middleground.js";
import { createPlayerContainer, playerX } from "./player.js";
import { getCollisionSide, jump, physics, playerHitboxes, resetCubeRotation, rotateCube, updateJumpVelocity, updatePlayerY, } from "./physics.js";
import { gHeld, iHeld, jumpHeld, kHeld, tHeld } from "./key-states.js";
import { createB1Container, createB2Container, createB3Container, createB4Container, createB5Container, createPortalBackContainer, createT1Container, createT2Container, createT3Container, createT4Container, updateCamera } from "./world.js";
import { createPlayerDragEffect } from "./particles.js";
import { createLevelObjects, levelObjects, loadLevel, rotatingObjects } from "./level-creation.js";
import { loadObjectTextures } from "./objects.js";

export const viewportRatio = window.innerWidth / window.innerHeight;

window.__ARTIN_GEN__ = (window.__ARTIN_GEN__ || 0) + 1;
const currentGen = window.__ARTIN_GEN__;

export let app = new Application();
export const defaultGroundPositionPercentage = (409 / 512);
export let groundY = window.innerHeight - getRenderedSize(512 * defaultGroundPositionPercentage);
let middlegroundInitialY = null;

export let gameState = {
  changeLevel: true
};

export function setLevel(levelName) {
  gameState.changeLevel = true
  loadLevel(levelName);
}

(async () => {
  await app.init({
    resizeTo: window,
    antialias: false,
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

  groundY = groundContainer.y;

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

  middlegroundInitialY = middlegroundContainer.y;

  const playerContainer = await createPlayerContainer(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const b5Container = await createB5Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const b4Container = await createB4Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const b3Container = await createB3Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const b2Container = await createB2Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const b1Container = await createB1Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const t1Container = await createT1Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const t2Container = await createT2Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const t3Container = await createT3Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const t4Container = await createT4Container(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }

  const portalBackContainer = await createPortalBackContainer(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }





  const spriteSheets = [
    'assets/GJ_GameSheet-uhd.json',
    'assets/GJ_GameSheet02-uhd.json',
    'assets/GJ_GameSheetGlow-uhd.json'
  ];

await Assets.load(spriteSheets);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }




  const particleContainer = new ParticleContainer({
    boundsArea: new Rectangle(0, 0, app.renderer.width, app.renderer.height),
  }); // v8-style container using Particle API

  particleContainer.x = app.screen.width / 2;
  particleContainer.y = app.screen.height / 2;
  

  const particleTexture = await Assets.load('assets/objects/particles/particle_04_001.png');

  const particles = [];
  const maxParticles = 30 ;

  function spawnParticle() {
    if (particles.length >= maxParticles) return;

    //const angle = Math.random() * Math.PI * 2;
    const angle = -90;
    const angleVariance = 90
    const a = Math.floor(Math.random() * (90 - (-90) + 1)) + (-90);;
    const speed = 50 + Math.random() * 100; // pixels per second
    const life = 1 + Math.random() * 0.5;   // seconds
    

    const p = new Particle({
      texture: particleTexture,
      alpha: 1,
      width: getRenderedSize(particleTexture.width),
      height: getRenderedSize(particleTexture.height)
    }); // basic particle properties supported by v8 Particle

    p.scaleX = 0.2;
    p.scaleY = p.scaleX;
    p.blendMode = 'add';
    p.anchorX = 0.5;
    p.anchorY = 0.5;

    p.vx = Math.cos(a) * speed;
    p.vy = Math.sin(a) * speed;
    p.life = life;
    p.age = 0;

    particleContainer.addParticle(p);
    particles.push(p);
  }











 const playerDragEffect = await createPlayerDragEffect(app);
  if (window.__ARTIN_GEN__ !== currentGen) { app.destroy(true); return; }




  // add the layers in order
  app.stage.addChild(backgroundContainer);
  app.stage.addChild(middlegroundContainer);

  app.stage.addChild(b5Container);
  app.stage.addChild(b4Container);
  app.stage.addChild(b3Container);
  app.stage.addChild(b2Container);
  app.stage.addChild(b1Container);
  app.stage.addChild(portalBackContainer); // only for portals

  //app.stage.addChild(playerDragEffect);
  app.stage.addChild(playerContainer);

  app.stage.addChild(t1Container);
  app.stage.addChild(t2Container);
  app.stage.addChild(t3Container);
  app.stage.addChild(t4Container);

  app.stage.addChild(groundContainer);

  let levelLayers = [
    b5Container,
    b4Container,
    b3Container,
    b2Container,
    b1Container,
    t1Container,
    t2Container,
    t3Container,
    t4Container
  ]
  

  // window.addEventListener("resize", () => {
  //   if (window.__ARTIN_GEN__ === currentGen) {
  //     app.resizeTo = window;
  //   }
  // });

  if (physics.playerY >= 0.5){
    camera.targetY = gridSpacesToPixels(physics.playerY);
  }

  let lastPlayerY = physics.playerY;
  let scrolled = 0; // px

  function drawHitboxCorners(graphics, hitbox, color = 0xff0000) {
  const size = 4; // pixel size of point

  graphics.beginFill(color);

  // top-left
  graphics.drawRect(hitbox.left - size / 2, hitbox.top - size / 2, size, size);

  // top-right
  graphics.drawRect(hitbox.right - size / 2, hitbox.top - size / 2, size, size);

  // bottom-right
  graphics.drawRect(hitbox.right - size / 2, hitbox.bottom - size / 2, size, size);

  // bottom-left
  graphics.drawRect(hitbox.left - size / 2, hitbox.bottom - size / 2, size, size);

  graphics.endFill();
}


  const hitboxDebugGraphics = new Graphics();
  app.stage.addChild(hitboxDebugGraphics);

  loadLevel("test"); 
  createLevelObjects(b5Container, b4Container, b3Container, b2Container, b1Container, t1Container, t2Container, t3Container, t4Container, portalBackContainer, app);

  app.ticker.add((ticker) => {
    if (window.__ARTIN_GEN__ !== currentGen) {
      app.ticker.stop();
      app.destroy(true);
      return;
    }
    app.ticker.speed = gameSettings.tickSpeed;
    const deltaSeconds = ticker.deltaMS / 1000;
    let scrollAmount = gridSpacesToPixels(gameSettings.scrollSpeed) * deltaSeconds * speed[gameSettings.gameSpeed].game;

    const deltaPlayerY = physics.playerY - lastPlayerY; // player height difference since last tick (grid spaces)
    lastPlayerY = physics.playerY;

    groundContainer.groundSprite.tilePosition.x -= scrollAmount;
    groundContainer.ground2Sprite.tilePosition.x -= scrollAmount;
    backgroundContainer.backgroundSprite.tilePosition.x -= scrollAmount * speedMultiplier.background;
    middlegroundContainer.middlegroundSprite.tilePosition.x -= scrollAmount * speedMultiplier.middlegroundX;
    middlegroundContainer.middleground2Sprite.tilePosition.x -= scrollAmount * speedMultiplier.middlegroundX;

    updateCamera(deltaSeconds);
    updatePlayerY(deltaSeconds);
    rotateCube(deltaSeconds);
    resetCubeRotation(deltaSeconds);
    updateJumpVelocity();
    playerContainer.cubeSprite.rotation = physics.cubeRotation;

    b5Container.x -= scrollAmount;
    b4Container.x -= scrollAmount;
    b3Container.x -= scrollAmount;
    b2Container.x -= scrollAmount;
    b1Container.x -= scrollAmount;

    t1Container.x -= scrollAmount;
    t2Container.x -= scrollAmount;
    t3Container.x -= scrollAmount;
    t4Container.x -= scrollAmount;
    portalBackContainer.x -= scrollAmount;

    b5Container.y = camera.y;
    b4Container.y = camera.y;
    b3Container.y = camera.y;
    b2Container.y = camera.y;
    b1Container.y = camera.y;

    t1Container.y = camera.y;
    t2Container.y = camera.y;
    t3Container.y = camera.y;
    t4Container.y = camera.y;
    portalBackContainer.y = camera.y;

    scrolled -= scrollAmount;

    for (const objectInfo of rotatingObjects) {
      let object = objectInfo[0];
      let rotationSpeed = objectInfo[1];
      object.rotation += degToRad(rotationSpeed) * deltaSeconds;
    }

    groundContainer.y = groundY + camera.y;
    middlegroundContainer.y = middlegroundInitialY + camera.y * speedMultiplier.middlegroundY;
    backgroundContainer.backgroundSprite.tilePosition.y = camera.y * speedMultiplier.background;
    playerContainer.cubeSprite.y = groundContainer.y - gridSpacesToPixels(0.5) - gridSpacesToPixels(physics.playerY);



    // update player hitboxes
    const cubeYPos = playerContainer.cubeSprite.y;
    const cubeXPos = playerContainer.cubeSprite.x

    if (gameSettings.gamemode != 4 && gameSettings.gamemode != 6) { // every hitbox is the same except for spider and wave
      playerHitboxes[gameSettings.gamemode].top = cubeYPos - gridSpacesToPixels(.5);
      playerHitboxes[gameSettings.gamemode].bottom = cubeYPos + gridSpacesToPixels(.5);
      playerHitboxes[gameSettings.gamemode].left = cubeXPos - gridSpacesToPixels(.5);
      playerHitboxes[gameSettings.gamemode].right = cubeXPos + gridSpacesToPixels(.5);      
    }

    hitboxDebugGraphics.clear();
    const playerHitbox = playerHitboxes[gameSettings.gamemode];

    if (playerHitbox && gameSettings.showDebugCorners) {
      drawHitboxCorners(hitboxDebugGraphics, playerHitbox, 0x00ffff);
    }

    physics.isOnABlock = false;
    for (const layer of levelLayers) {
      let objectContainers = layer.children;
      for (let i = 0; i < objectContainers.length; i ++) {

        if (objectContainers[i].type === 0) {



          const objTop = objectContainers[i].top + camera.y;
          const objBottom = objectContainers[i].bottom + camera.y;
          const objLeft = (objectContainers[i].left -= scrollAmount) - gridSpacesToPixels(0.97);
          const objRight = (objectContainers[i].right -= scrollAmount) - gridSpacesToPixels(0.97);

          // const objTop = objectContainers[i].getBounds().top + camera.y;
          // const objBottom =  objectContainers[i].getBounds().bottom + camera.y;
          // const objLeft =  objectContainers[i].getBounds().left - scrollAmount;
          // const objRight =  objectContainers[i].getBounds().right - scrollAmount;

          if (gameSettings.showDebugCorners) {drawHitboxCorners(hitboxDebugGraphics, 
            {
              top: objTop,
              bottom: objBottom,
              left: objLeft,
              right: objRight
            }
            , 0xff0000);
          }

          const collision = getCollisionSide(
            playerHitboxes[gameSettings.gamemode],
            {
              top: objTop,
              bottom: objBottom,
              left: objLeft,
              right: objRight
            }
          );

          if (collision) {
            if (collision[0] === "bottom") {
              physics.collidedObjectRenderedTop = objTop;
              physics.isOnABlock = true;
            }
            else if (collision[0] === "right" || collision[0] === "left") {
              console.log("t'as die")
            }
          }   
                 
        }

      }
    } 









    if (jumpHeld) {
      jump();
    }

    

    if (physics.playerY <= 0 && camera.targetY !== 0) {
      camera.targetY = 0;
      physics.snappingToGround = true;
    }
    else if (
      playerContainer.cubeSprite.y <= window.innerHeight / 2 * camera.padding
    ) {
      camera.targetY += gridSpacesToPixels(deltaPlayerY);
    }
    else if (
      playerContainer.cubeSprite.y >= window.innerHeight - (window.innerHeight / 2 * camera.padding)
    ) {
      camera.targetY += gridSpacesToPixels(deltaPlayerY);
    }



    if (tHeld) {
      if (physics.playerGravity > -1){physics.playerGravity = -1}
    }
    else {
      if (physics.playerGravity < 1){physics.playerGravity = 1}
      physics.gCubeBig = 86;
    }

    if (gameState.changeLevel) {
      createLevelObjects(b5Container, b4Container, b3Container, b2Container, b1Container, t1Container, t2Container, t3Container, t4Container, portalBackContainer, app);
      b5Container.removeChildren().forEach(child => {
      child.destroy({ children: true, texture: true, baseTexture: true });
      });
            b4Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            b3Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            b2Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            b1Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            portalBackContainer.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            t1Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            t2Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            t3Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
            t4Container.removeChildren().forEach(child => {
        child.destroy({ children: true, texture: true, baseTexture: true });
      });
      gameState.changeLevel = false;
    }






    // emit a few particles each frame
    for (let i = 0; i < 30; i++) spawnParticle();

    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += deltaSeconds;
      const t = p.age / p.life;

      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;

      // fade out over life
      p.alpha = 1 - t;
      p.scaleY = p.scaleX;

      if (t >= 1) {
        particleContainer.removeParticle(p);
        particles.splice(i, 1);
      }
    }









    updateGround(groundContainer);
    updateBackground(backgroundContainer);
    updateMiddleground(middlegroundContainer);

  });
})();

// if (import.meta.hot) {
//   import.meta.hot.accept();
// }
