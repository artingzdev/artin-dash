// ground.js
import { Container, Assets, TilingSprite, Sprite } from "pixi.js";
import { ground, groundColor, ground2Color, lineBlendingEnabled } from "./game-variables.js";  // adjust path if needed
import { getRenderedSize } from "./utils.js";

export async function createGroundContainer(app) {

  const groundContainer = new Container();
  groundContainer.height = getRenderedSize(512);




    // load textures
  const groundTexture = await Assets.load(`/assets/grounds/groundSquare_${ground}_001-uhd.png`);
  const ground2Texture = await Assets.load(`/assets/grounds/groundSquare_${ground}_2_001-uhd.png`);
  const groundSquareShadowLeftTexture = await Assets.load(`/assets/groundSquareShadow_001.png`);
  const groundSquareShadowRightTexture = await Assets.load(`/assets/groundSquareShadow_2_001.png`);
  const floorLineTexture = await Assets.load("/assets/floorLine_01_001-uhd.png");


  const groundTileScale = (getRenderedSize(512)) / 512;

  // create sprites
  const groundSprite = new TilingSprite({
    texture: groundTexture,
    width: app.screen.width,
    height: getRenderedSize(groundTexture.height),
    tint: groundColor,
    tileScale: groundTileScale
  });

  const ground2Sprite = new TilingSprite({
    texture: ground2Texture,
    width: app.screen.width,
    height: getRenderedSize(ground2Texture.height),
    tint: ground2Color,
    tileScale: groundTileScale
  });

  const groundSquareShadowLeftSprite = new Sprite({
    texture: groundSquareShadowLeftTexture,
    width: getRenderedSize(0.7 * groundSquareShadowLeftTexture.width),
    height: getRenderedSize(512),
    alpha: 0.39
  });

  const groundSquareShadowRightSprite = new Sprite({
    texture: groundSquareShadowRightTexture,
    width: getRenderedSize(0.7 * groundSquareShadowRightTexture.width),
    height: getRenderedSize(512),
    alpha: 0.39,
    x: app.screen.width
  });

  const floorLineSprite = new Sprite({
    texture: floorLineTexture,
    width: 0.5656 * app.screen.width, // to be changed
    height: getRenderedSize(floorLineTexture.height),
  }) 

  floorLineSprite.blendMode = lineBlendingEnabled ? 'add' : 'normal';


  // add to container
  groundContainer.addChild(groundSprite);
  groundContainer.addChild(ground2Sprite);
  groundContainer.addChild(groundSquareShadowLeftSprite);
  groundContainer.addChild(groundSquareShadowRightSprite);
  groundContainer.addChild(floorLineSprite);


  groundSprite.anchor.set(0, 0);
  groundSprite.y = 0;


  ground2Sprite.anchor.set(0, 0);
  ground2Sprite.y = 0;


  groundSquareShadowRightSprite.anchor.x = 1;


  floorLineSprite.anchor = 0.5;
  floorLineSprite.x = app.screen.width / 2;


  groundContainer.groundSprite  = groundSprite;
  groundContainer.ground2Sprite = ground2Sprite;

  return groundContainer;
}