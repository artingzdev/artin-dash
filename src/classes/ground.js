import { getRenderedSize, getTextureDimensions, setColorChannel, setRenderedSize, unitsToPixels } from "../utils";
import { colorChannel, RGBToTint, tintToRGB } from "../colors";
import { gameState } from "../state/gameState";

export class Ground extends Phaser.GameObjects.Container {
    constructor(scene, isCeiling = false) {
        super(scene, 0, 0);

        this.groundImgHeight = getTextureDimensions(scene, `ground_${gameState.settings.groundID}`).height;
        this.ground2ImgHeight = getTextureDimensions(scene, `ground_${gameState.settings.groundID}_2`).height;
        this.groundTileScale = getRenderedSize(this.groundImgHeight) / this.groundImgHeight;

        this.groundVisualHeight = getRenderedSize(this.groundImgHeight);
        this.groundVisualY = getRenderedSize(512 - this.groundImgHeight);

        this.ground = new Phaser.GameObjects.TileSprite(scene, 0, this.groundVisualY, gameState.screen.width, this.groundVisualHeight, `ground_${gameState.settings.groundID}`);
        this.ground.setOrigin(0, 0);
        this.ground.tileScaleX = this.groundTileScale;
        this.ground.tileScaleY = this.groundTileScale;
        this.ground.scrollFactorX = 0;
        setColorChannel(this.ground, 1001);

        this.ground2 = new Phaser.GameObjects.TileSprite(scene, 0, 0, gameState.screen.width, getRenderedSize(this.ground2ImgHeight), `ground_${gameState.settings.groundID}_2`);
        this.ground2.setOrigin(0, 0);
        this.ground2.tileScaleX = this.groundTileScale;
        this.ground2.tileScaleY = this.groundTileScale;
        setColorChannel(this.ground2, 1009);
        this.ground2.scrollFactorX = 0;
        this.ground2.y = 0;

        this.groundShadowLeft = new Phaser.GameObjects.Image(scene, 0, 0, 'groundSquareShadow');
        this.groundShadowLeft.setOrigin(0, 0);
        this.groundShadowLeft.setDisplaySize(getRenderedSize(512 * 0.7), getRenderedSize(512));
        this.groundShadowLeft.alpha = 100/255;
        this.groundShadowLeft.scrollFactorX = 0;

        this.groundShadowRight = new Phaser.GameObjects.Image(scene, gameState.screen.width, 0, 'groundSquareShadow');
        this.groundShadowRight.setOrigin(1, 0); 
        this.groundShadowRight.alpha = 100/255;
        this.groundShadowRight.scrollFactorX = 0;
        this.groundShadowRight.setFlipX(true);
        this.groundShadowRight.setDisplaySize(getRenderedSize(512 * 0.7), getRenderedSize(512));

        this.line = new Phaser.GameObjects.Image(scene, gameState.screen.width / 2, -getRenderedSize(2), 'floorLine_01');
        this.line.setOrigin(0.5, 0);
        this.line.scrollFactorX = 0;
        setColorChannel(this.line, 1002);
        setRenderedSize(this.line);

        this.add([this.ground, this.ground2, this.line, this.groundShadowLeft, this.groundShadowRight]);
        
        scene.add.existing(this);
        this.hitbox = scene.matter.add.rectangle(
            0,
            gameState.screen.height + getRenderedSize(this.groundImgHeight / 2),
            gameState.screen.width * 10,
            getRenderedSize(this.groundImgHeight),
            {
                isStatic: true,
                friction: 0,
                restitution: 0
            }
        );

    }

    scroll(scene) {
        const camera = scene.cameras.main;
        
        // parallax
        this.ground.tilePositionX = scene.cameras.main.scrollX / this.groundTileScale; // tilePosition is relative to the internal texture
        this.ground2.tilePositionX = scene.cameras.main.scrollX / this.groundTileScale;

        // camera shake immunity on X axis
        const shakeOffsetX = camera.shakeEffect?.offsetX ?? camera.shakeEffect?._offsetX ?? 0;
        this.x = -shakeOffsetX;

        // keep hitbox on screen
        scene.matter.body.setPosition(this.hitbox, {
            x: scene.cameras.main.scrollX,
            y: this.hitbox.position.y
        })
    }

    updateColor() {
        setColorChannel(this.ground, 1001);
        setColorChannel(this.ground2, 1009);
        setColorChannel(this.line, 1002);
    }

    updateTexture(scene) {
        const groundKey = `ground_${gameState.settings.groundID}`;
        const ground2Key = `ground_${gameState.settings.groundID}_2`;

        if (
            this.ground.texture?.key === groundKey &&
            this.ground2.texture?.key === ground2Key
        ) {
            return;
        }

        this.ground.setTexture(groundKey);
        this.ground2.setTexture(ground2Key);
        const ground2Height = getTextureDimensions(scene, ground2Key).height;
        this.ground2.setSize(gameState.screen.width, getRenderedSize(ground2Height));
    }

    changeColor(targetID) {
        const channel = colorChannel[targetID];

        let target = this.ground;
        switch(targetID) {
            case 1001: target = this.ground; break;
            case 1009: target = this.ground2; break;
            case 1002:
                target = this.line;
                if (channel.blending) target.setBlendMode(Phaser.BlendModes.ADD);
                else target.setBlendMode(Phaser.BlendModes.NORMAL);
                break;
        }
        const startRGB = tintToRGB(target.tint);

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

                target.setTint(RGBToTint(r, g, b));
            }
        });
    }
}
