import { backgroundColor } from "./game-variables";
import { getRenderedSize } from "./utils";
import { Container, Assets, TilingSprite } from "pixi.js";

export async function createBackgroundContainer(app) {
    const backgroundContainer = new Container();
    backgroundContainer.height = app.screen.height;




    // load texture
    const backgroundTexture = await Assets.load(`assets/backgrounds/game_bg_01_001-uhd.png`);


    const backgroundTileScale = 1.7 * getRenderedSize(backgroundTexture.height) / backgroundTexture.height;

    // create background sprite
    const backgroundSprite = new TilingSprite({
        texture: backgroundTexture,
        height: getRenderedSize(backgroundTexture.height) * 1.7,
        width: app.screen.width,
        tint: backgroundColor,
        tileScale: backgroundTileScale
    })

    backgroundSprite.anchor.y = 1;
    backgroundContainer.y = app.screen.height + getRenderedSize(240);
    backgroundContainer.backgroundSprite = backgroundSprite;


    // add background sprite to its container
    backgroundContainer.addChild(backgroundSprite);
    return backgroundContainer;
}