import { colorChannel } from './colors.js';
import { gameSettings } from './game-variables.js';
import { getRenderedSize, gridSpacesToPixels } from "./utils";
import { Container, Assets, TilingSprite } from "pixi.js";

export async function createBackgroundContainer(app) {
    const backgroundContainer = new Container();
    backgroundContainer.height = app.screen.height;




    // load texture
    const backgroundTexture = await Assets.load(`assets/backgrounds/game_bg_${gameSettings.background}_001-uhd.png`);


    const backgroundTileScale = 1.592 * getRenderedSize(backgroundTexture.height) / backgroundTexture.height;

    // create background sprite
    const backgroundSprite = new TilingSprite({
        texture: backgroundTexture,
        height: getRenderedSize(backgroundTexture.height) * 1.592,
        width: app.screen.width,
        tint: gameSettings.backgroundColor,
        tileScale: backgroundTileScale
    })

    backgroundSprite.anchor.set(0, 1);
    backgroundContainer.y = app.screen.height;
    backgroundSprite.tilePosition.x = gridSpacesToPixels(-16.6195) // value ripped from the game directly using Geode DevTools
    backgroundContainer.backgroundSprite = backgroundSprite;


    // add background sprite to its container
    backgroundContainer.addChild(backgroundSprite);
    return backgroundContainer;
}

export async function updateBackground(backgroundContainer) {
  backgroundContainer.backgroundSprite.tint = colorChannel[1000].colorValue;
  backgroundContainer.backgroundSprite.texture = await Assets.load(`assets/backgrounds/game_bg_${gameSettings.background}_001-uhd.png`);
}