import { colorChannel, RGBToTint, tintToRGB } from "../colors";
import { gameState } from "../state/gameState";
import { getRenderedSize, getTextureDimensions, gridSpacesToPixels, setColorChannel } from "../utils";

export class Background extends Phaser.GameObjects.Container{
    constructor(scene) {
        super(scene, 0, 0);

        this.textureName = `background_${gameState.settings.backgroundID}`;
        this.backgroundImgHeight = getTextureDimensions(scene, this.textureName).height;
        this.backgroundTileScale = getRenderedSize(this.backgroundImgHeight) / this.backgroundImgHeight * 1.592;
        this.backgroundOffset = this.backgroundImgHeight - gameState.screen.height / this.backgroundTileScale;

        this.background = new Phaser.GameObjects.TileSprite(scene, 0, 0 , gameState.screen.width, gameState.screen.height, this.textureName);
        this.background.setOrigin(0, 0);
        this.background.setScrollFactor(0, 0);
        this.background.tilePositionY = this.backgroundOffset;
        this.background.setTileScale(this.backgroundTileScale, this.backgroundTileScale);
        setColorChannel(this.background, 1000)
        
        this.add([this.background]);
        scene.add.existing(this);
    }

    scroll(scene) {
        const camera = scene.cameras.main;
        // parallax
        this.background.tilePositionX = (camera.scrollX * gameState.settings.backgroundSpeed) / this.backgroundTileScale;
        this.background.tilePositionY = this.backgroundOffset + (camera.scrollY - gridSpacesToPixels(3)) * gameState.settings.backgroundSpeed / this.backgroundTileScale;

        // camera shake immunity
        const shakeOffsetX = camera.shakeEffect?.offsetX ?? camera.shakeEffect?._offsetX ?? 0;
        const shakeOffsetY = camera.shakeEffect?.offsetY ?? camera.shakeEffect?._offsetY ?? 0;
        this.background.x = -shakeOffsetX;
        this.background.y = -shakeOffsetY;
    }

    updateColor() {
        setColorChannel(this.background, 1000)
    }

    updateTexture(scene) {
        const backgroundKey = `background_${gameState.settings.backgroundID}`;
        if (this.background.texture?.key === backgroundKey) return;
        this.background.setTexture(backgroundKey);
    }

    changeColor() {
        const channel = colorChannel[1000];

        const startRGB = tintToRGB(this.background.tint);

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: channel.duration,
            ease: channel.easing,

            onUpdate: tween => {
                const t = tween.getValue();

                const r = Math.round(
                    Phaser.Math.Linear(startRGB.r, channel.toR, t)
                );
                const g = Math.round(
                    Phaser.Math.Linear(startRGB.g, channel.toG, t)
                );
                const b = Math.round(
                    Phaser.Math.Linear(startRGB.b, channel.toB, t)
                );

                this.background.setTint(RGBToTint(r, g, b));
            }
        });
    }
}
