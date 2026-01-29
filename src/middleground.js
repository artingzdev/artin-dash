import { Assets, Container, TilingSprite } from "pixi.js";
import { getRenderedSize } from "./utils";
import { gameSettings } from './game-variables.js';
import { defaultGroundPositionPercentage } from "./main";
import { colorChannel } from "./colors.js";

export async function createMiddlegroundContainer(app) {
    const middlegroundContainer = new Container();


    // load textures
    const middlegroundTexture = await Assets.load(`assets/middlegrounds/fg_${gameSettings.middleground}_001-uhd.png`);
    const middleground2Texture = await Assets.load(`assets/middlegrounds/fg_${gameSettings.middleground}_2_001-uhd.png`);

    middlegroundContainer.height = getRenderedSize(Math.max(middlegroundTexture.height, middleground2Texture.height));
    middlegroundContainer.width = app.screen.width;


    const middlegroundTileScale = getRenderedSize(middlegroundTexture.width) / middlegroundTexture.width;

    // create middleground sprites
    const middlegroundSprite = new TilingSprite({
        texture: middlegroundTexture,
        width: app.screen.width,
        height: getRenderedSize(middlegroundTexture.height),
        tileScale: middlegroundTileScale,
        tint: gameSettings.middlegroundColor
    });
    const middleground2Sprite = new TilingSprite({
        texture: middleground2Texture,
        width: app.screen.width,
        height: getRenderedSize(middleground2Texture.height),
        tileScale: middlegroundTileScale,
        tint: gameSettings.middleground2Color
    });

    middlegroundSprite.roundPixels = true;
    middleground2Sprite.roundPixels = true;

    middlegroundSprite.anchor.y = 0;
    middleground2Sprite.anchor.y = 0;

    middlegroundSprite.blendMode  = colorChannel[1013].blending  ? 'add' : 'normal';
    middleground2Sprite.blendMode = colorChannel[1014].blending ? 'add' : 'normal';

    middlegroundSprite.y = app.screen.height - getRenderedSize(512 * defaultGroundPositionPercentage + 140);
    middleground2Sprite.y = app.screen.height - getRenderedSize(512 * defaultGroundPositionPercentage + 140);

    middlegroundContainer.middlegroundSprite = middlegroundSprite;
    middlegroundContainer.middleground2Sprite = middleground2Sprite;

    middlegroundContainer.addChild(middlegroundSprite);
    middlegroundContainer.addChild(middleground2Sprite);
    return middlegroundContainer;
}

export async function updateMiddleground(middlegroundContainer) {
  middlegroundContainer.middlegroundSprite.tint = colorChannel[1013].colorValue;
  middlegroundContainer.middleground2Sprite.tint = colorChannel[1014].colorValue;

  middlegroundContainer.middlegroundSprite.texture = await Assets.load(`assets/middlegrounds/fg_${gameSettings.middleground}_001-uhd.png`);
  middlegroundContainer.middleground2Sprite.texture = await Assets.load(`assets/middlegrounds/fg_${gameSettings.middleground}_2_001-uhd.png`);
  
  middlegroundContainer.middlegroundSprite.blendMode  = colorChannel[1013].blending ? 'add' : 'normal';
  middlegroundContainer.middleground2Sprite.blendMode = colorChannel[1014].blending ? 'add' : 'normal';

  middlegroundContainer.middlegroundSprite.alpha = colorChannel[1013].opacity;
  middlegroundContainer.middleground2Sprite.alpha = colorChannel[1014].opacity;
}