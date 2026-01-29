import { Application, Assets, Particle, ParticleContainer, Rectangle, TilingSprite } from "pixi.js";
import { speed, speedMultiplier, camera, gameSettings } from "./game-variables.js";
import { createGroundContainer, updateGround } from "./ground.js";
import { degToRad, getRenderedSize, gridSpacesToPixels } from "./utils.js";
import { createBackgroundContainer, updateBackground } from "./background.js";
import { createMiddlegroundContainer, updateMiddleground } from "./middleground.js";
import { createPlayerContainer } from "./player.js";
import { jump, physics, resetCubeRotation, rotateCube, updateJumpVelocity, updatePlayerY, } from "./physics.js";
import { gHeld, iHeld, jumpHeld, kHeld, tHeld } from "./key-states.js";
import { createB1Container, createB2Container, createB3Container, createB4Container, createB5Container, createT1Container, createT2Container, createT3Container, createT4Container, updateCamera } from "./world.js";
import { createPlayerDragEffect } from "./particles.js";
import { loadLevel } from "./level-creation.js";

export const viewportRatio = window.innerWidth / window.innerHeight;

window.__ARTIN_GEN__ = (window.__ARTIN_GEN__ || 0) + 1;
const currentGen = window.__ARTIN_GEN__;

export let app = new Application();
export const defaultGroundPositionPercentage = (409 / 512);
export let groundY = window.innerHeight - getRenderedSize(512 * defaultGroundPositionPercentage);
let middlegroundInitialY = null;

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




  loadLevel("stereo-madness"); 




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

  //app.stage.addChild(playerDragEffect);
  app.stage.addChild(playerContainer);

  app.stage.addChild(t1Container);
  app.stage.addChild(t2Container);
  app.stage.addChild(t3Container);
  app.stage.addChild(t4Container);

  app.stage.addChild(groundContainer);
  app.ticker.speed = gameSettings.tickSpeed;

  // window.addEventListener("resize", () => {
  //   if (window.__ARTIN_GEN__ === currentGen) {
  //     app.resizeTo = window;
  //   }
  // });

  if (physics.playerY >= 0.5){
    camera.targetY = gridSpacesToPixels(physics.playerY);
  }








  app.ticker.add((ticker) => {
    if (window.__ARTIN_GEN__ !== currentGen) {
      app.ticker.stop();
      app.destroy(true);
      return;
    }
    const deltaSeconds = ticker.deltaMS / 1000;
    let scrollAmount = gridSpacesToPixels(gameSettings.scrollSpeed) * deltaSeconds * speed[gameSettings.gameSpeed].game;

    groundContainer.groundSprite.tilePosition.x -= scrollAmount;
    groundContainer.ground2Sprite.tilePosition.x -= scrollAmount;
    backgroundContainer.backgroundSprite.tilePosition.x -= scrollAmount * speedMultiplier.background;
    middlegroundContainer.middlegroundSprite.tilePosition.x -= scrollAmount * speedMultiplier.middlegroundX;
    middlegroundContainer.middleground2Sprite.tilePosition.x -= scrollAmount * speedMultiplier.middlegroundX;

    //playerContainer.cubeSprite.y = groundY - gridSpacesToPixels(0.5) - gridSpacesToPixels(physics.playerY) + camera.y;
    // playerContainer.cubeSprite.y = camera.y;
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

    b5Container.y = camera.y;
    b4Container.y = camera.y;
    b3Container.y = camera.y;
    b2Container.y = camera.y;
    b1Container.y = camera.y;

    t1Container.y = camera.y;
    t2Container.y = camera.y;
    t3Container.y = camera.y;
    t4Container.y = camera.y;

    groundContainer.y = groundY + camera.y;
    middlegroundContainer.y = middlegroundInitialY + camera.y * speedMultiplier.middlegroundY;
    backgroundContainer.backgroundSprite.tilePosition.y = camera.y * speedMultiplier.background;
    playerContainer.cubeSprite.y = groundContainer.y - gridSpacesToPixels(0.5) - gridSpacesToPixels(physics.playerY);

    if (jumpHeld) {
      jump();
    }

    // if (iHeld) {
    //   camera.targetY += 2000 * deltaSeconds;
    // }
    // if (kHeld) {
    //   camera.targetY -= 2000 * deltaSeconds;
    // }

    if (
      playerContainer.cubeSprite.y <= window.innerHeight / 2 * camera.padding // upper bounds
    ) { camera.targetY = gridSpacesToPixels(physics.playerY) }
    else if (
      playerContainer.cubeSprite.y >= window.innerHeight - (window.innerHeight / 2 * camera.padding) // lower bounds
    ) { camera.targetY = gridSpacesToPixels(physics.playerY) - gridSpacesToPixels(2.9) }


    if (tHeld) {
      if (physics.playerGravity > -1){physics.playerGravity = -1}
      //physics.gCubeBig = -86;
    }
    else {
      if (physics.playerGravity < 1){physics.playerGravity = 1}
      physics.gCubeBig = 86;
    }

    // if (gHeld) {
    //   if (physics.playerGravity < 1){physics.playerGravity = 1}
    //   //physics.gCubeBig = 86;
    // }









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

if (import.meta.hot) {
  import.meta.hot.accept();
}
