import Phaser from "phaser";
import { colorChannel, tintToRGB, RGBToTint } from "../colors";
import { gameState } from "../state/gameState";
import { getRenderedSize, getTextureDimensions, gridSpacesToPixels, setColorChannel, unitsToPixels } from "../utils";

export class Middleground extends Phaser.GameObjects.Container{
    constructor(scene) {
        super(scene, 0, 0);

        this.middlegroundTextureName = `middleground_${gameState.settings.middlegroundID}`;
        this.middlegroundImgHeight = getTextureDimensions(scene, this.middlegroundTextureName).height;
        this.middlegroundTileScale = getRenderedSize(this.middlegroundImgHeight) / this.middlegroundImgHeight;

        this.middleground2TextureName = `middleground_${gameState.settings.middlegroundID}_2`;
        this.middleground2ImgHeight = getTextureDimensions(scene, this.middleground2TextureName).height;
        this.middleground2TileScale = getRenderedSize(this.middleground2ImgHeight) / this.middleground2ImgHeight;

        this.middlegroundTotalHeight = Math.max(this.middlegroundImgHeight, this.middleground2ImgHeight);
        
        switch(gameState.settings.middlegroundID) {
            case "00":
                this.middlegroundOffset = 35; // units
                break;
            case "01":
                this.middlegroundOffset = 35; // units
                break;
            case "02":
                this.middlegroundOffset = 45;
                break;
            case "03":
                this.middlegroundOffset = 45;
                break;
        }

        this.middlegroundY = gameState.screen.height - getRenderedSize(this.middlegroundTotalHeight) - unitsToPixels(this.middlegroundOffset);


        this.middleground = new Phaser.GameObjects.TileSprite(scene, 0, this.middlegroundY, gameState.screen.width, getRenderedSize(this.middlegroundImgHeight), this.middlegroundTextureName);
        this.middleground.setOrigin(0, 0);
        this.middleground.setScrollFactor(0, 0);
        this.middleground.setTileScale(this.middlegroundTileScale, this.middlegroundTileScale);
        setColorChannel(this.middleground, 1013);

        this.middleground2 = new Phaser.GameObjects.TileSprite(scene, 0, this.middlegroundY, gameState.screen.width, getRenderedSize(this.middlegroundImgHeight), this.middleground2TextureName);
        this.middleground2.setOrigin(0, 0);
        this.middleground2.setScrollFactor(0, 0);
        this.middleground2.setTileScale(this.middlegroundTileScale, this.middlegroundTileScale);
        setColorChannel(this.middleground2, 1014);
        
        this.add([this.middleground, this.middleground2]);
        scene.add.existing(this);
    }

    scroll(scene) {

        this.middleground.tilePositionX = scene.cameras.main.scrollX * gameState.settings.middlegroundSpeedX;
        this.middleground2.tilePositionX = scene.cameras.main.scrollX * gameState.settings.middlegroundSpeedX;

        this.middleground.y = this.middlegroundY - (scene.cameras.main.scrollY - gridSpacesToPixels(3)) * gameState.settings.middlegroundSpeedY;
        this.middleground2.y = this.middlegroundY - (scene.cameras.main.scrollY - gridSpacesToPixels(3)) * gameState.settings.middlegroundSpeedY;
    }

    updateColor() {

        setColorChannel(this.middleground, 1013);
        setColorChannel(this.middleground2, 1014);
    }

    updateTexture(scene) {
        const middlegroundKey = `middleground_${gameState.settings.middlegroundID}`;
        const middleground2Key = `middleground_${gameState.settings.middlegroundID}_2`;

        this.middleground.setTexture(middlegroundKey);
        this.middleground2.setTexture(middleground2Key);
    }

    changeColor(targetID) {
        const channel = colorChannel[targetID];

        let target = this.middleground;
        switch(targetID) {
            case 1013: target = this.middleground; break;
            case 1014: target = this.middleground2; break;
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

        target.blendMode = channel.blending ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL;
    }
}