import { _decorator, clamp, Component } from 'cc';
import { GameObject } from './GameObject';
const { ccclass, property } = _decorator;

export enum EnterEffect {
    NONE,
    SCALE_UP,
    FLY_BOTTOM,
    FLY_TOP
}

@ccclass('EnterEffectManager')
export class EnterEffectManager extends Component {

    public static enterLength: number = 60;
    public static flyLength: number = 100;

    public static enterEffectsEnabled: boolean = true;
    public static enterFadeEnabled: boolean = true;
    public static currentEnterEffect: EnterEffect = EnterEffect.NONE;

    private static applyEnterEffectToObjectInternal(object: GameObject, cameraLeft: number, cameraRight: number): void {
        if (!this.enterEffectsEnabled) return;

        const posX = object.getPositionX();

        if (
            posX < cameraLeft - this.enterLength ||
            posX > cameraRight + this.enterLength ||
            (posX > cameraLeft + this.enterLength && posX < cameraRight - this.enterLength)
        ) {
            object.setOpacity(255);
            object.setScaleXY(object.baseScaleX, object.baseScaleY, true);
            object.setPosition(object.baseX, object.baseY);
            return; // skip if not in range of screen edges
        } 

        const objScreenX = posX - cameraLeft;
        const screenWidth = cameraRight - cameraLeft;
        let value: number = 1;

        value = objScreenX < screenWidth / 2
            ? clamp(objScreenX, 0, this.enterLength) / this.enterLength
            : (screenWidth - clamp(objScreenX, screenWidth - this.enterLength, screenWidth)) / this.enterLength;

        if (this.enterFadeEnabled) object.setOpacity(value * 255);

        // apply the corresponding enter effect on the object
        let moveAmountY: number;
        let newY: number
        switch(this.currentEnterEffect) {
            case EnterEffect.SCALE_UP:
                const baseScaleX = object.baseScaleX;
                const baseScaleY = object.baseScaleY;
                
                const newScaleX = baseScaleX * value;
                const newScaleY = baseScaleY * value;

                object.setScaleXY(newScaleX, newScaleY, true, false);
                break;

            case EnterEffect.FLY_BOTTOM:
                moveAmountY = (1 - value) * this.flyLength;
                newY = object.baseY - moveAmountY;

                object.setPositionY(newY, false);

                break;

            case EnterEffect.FLY_TOP:
                moveAmountY = (1 - value) * this.flyLength;
                newY = object.baseY + moveAmountY;

                object.setPositionY(newY, false);

                break;

            case EnterEffect.NONE:
                object.setScaleXY(object.baseScaleX, object.baseScaleY, true);
                if (!this.enterFadeEnabled) object.setOpacity(255);
                break;
        }
    }

    // needs to be called on every object visible on screen:
    public static updateEnterEffects(object: GameObject, cameraLeft: number, cameraRight: number): void {
        this.applyEnterEffectToObjectInternal(object, cameraLeft, cameraRight);
    }
}