import { Container, Sprite, Assets } from "pixi.js";
import { degToRad, getRenderedSize, gridSpacesToPixels } from "./utils";
import { physics } from "./physics";

export let playerX = window.innerWidth / 2 - gridSpacesToPixels(physics.playerOffset);;

export async function createPlayerContainer(app) {
    const playerContainer =  new Container();
    
    const cubeTexture = await Assets.load('assets/icons/cube.png');
    const cubeSprite = new Sprite({
        texture: cubeTexture,
        width: getRenderedSize(cubeTexture.width),
        height: getRenderedSize(cubeTexture.height),
    })

    cubeSprite.anchor.set(0.5);
    cubeSprite.x = playerX;
    playerContainer.cubeSprite = cubeSprite;

    playerContainer.addChild(cubeSprite);

    return playerContainer;
}