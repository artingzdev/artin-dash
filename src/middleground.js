import { Assets, Container, TilingSprite } from "pixi.js";
import { getRenderedSize } from "./utils";
import { middlegroundColor, middleground, middleground2Color, middlegroundBlendingEnabled, middleground2BlendingEnabled} from "./game-variables";
import { defaultGroundPositionPercentage } from "./main";

export async function createMiddlegroundContainer(app) {
    const middlegroundContainer = new Container();


    // load textures
    const middlegroundTexture = await Assets.load(`/assets/middlegrounds/fg_${middleground}_001-uhd.png`);
    const middleground2Texture = await Assets.load(`/assets/middlegrounds/fg_${middleground}_2_001-uhd.png`);

    middlegroundContainer.height = getRenderedSize(Math.max(middlegroundTexture.height, middleground2Texture.height));
    middlegroundContainer.width = app.screen.width;


    const middlegroundTileScale = getRenderedSize(middlegroundTexture.width) / middlegroundTexture.width;

    // create middleground sprites
    const middlegroundSprite = new TilingSprite({
        texture: middlegroundTexture,
        width: app.screen.width,
        height: getRenderedSize(middlegroundTexture.height),
        tileScale: middlegroundTileScale,
        tint: middlegroundColor
    });
    const middleground2Sprite = new TilingSprite({
        texture: middleground2Texture,
        width: app.screen.width,
        height: getRenderedSize(middleground2Texture.height),
        tileScale: middlegroundTileScale,
        tint: middleground2Color
    });

    // middlegroundSprite.in

    middlegroundSprite.anchor.y = 0;
    middleground2Sprite.anchor.y = 0;

    middlegroundSprite.blendMode  = middlegroundBlendingEnabled  ? 'add' : 'normal';
    middleground2Sprite.blendMode = middleground2BlendingEnabled ? 'add' : 'normal';

    middlegroundSprite.y = app.screen.height - getRenderedSize(512 * defaultGroundPositionPercentage + 140);
    middleground2Sprite.y = app.screen.height - getRenderedSize(512 * defaultGroundPositionPercentage + 140);

    middlegroundContainer.middlegroundSprite = middlegroundSprite;
    middlegroundContainer.middleground2Sprite = middleground2Sprite;

    middlegroundContainer.addChild(middlegroundSprite);
    middlegroundContainer.addChild(middleground2Sprite);
    return middlegroundContainer;
}