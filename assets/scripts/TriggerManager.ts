import { _decorator, Color, Component } from 'cc';
import { ColorChannelManager } from './ColorChannelManager';
import { PlayLayer } from './PlayLayer';
import { EnterEffect, EnterEffectManager } from './EnterEffectManager';
const { ccclass, property } = _decorator;

enum Trigger {
    COLOR_BG = 29,
    COLOR_G1 = 30,
    COLOR_OBJ = 105,
    COLOR_3DL = 744,
    COLOR_G2 = 900,
    COLOR_LINE = 915,
    COLOR = 899,

    ENTER_NONE = 22,
    ENTER_SCALE_UP = 27,
    ENTER_FLY_BOTTOM = 23,
    ENTER_FLY_TOP = 24
}

interface ActiveColorTransition {
    channelID: number;
    startColor: Color;
    targetColor: Color;
    duration: number;
    elapsed: number;
    blending: boolean;
}

@ccclass('TriggerManager')
export class TriggerManager extends Component {

    public static colorTriggers:[channelID: number, x: number, duration: number, color: Color, blending: boolean][] = [];
    public static allColorTriggers:[channelID: number, x: number, duration: number, color: Color, blending: boolean][] = [];

    public static enterEffectTriggers:[type: EnterEffect, x: number][] = [];
    public static allEnterEffectTriggers:[type: EnterEffect, x: number][] = [];

    // tracks all currently-running color transitions
    private static activeTransitions: ActiveColorTransition[] = [];

    private static toChannelAlpha(opacity: number | undefined): number {
        const normalizedOpacity = opacity ?? 1;
        return Math.round(normalizedOpacity * 255);
    }

    private static cloneColorTrigger(
        [channelID, x, duration, color, blending]: [number, number, number, Color, boolean]
    ): [number, number, number, Color, boolean] {
        return [channelID, x, duration, new Color(color.r, color.g, color.b, color.a), blending];
    }

    public static clearTriggersArray(): void {
        TriggerManager.colorTriggers.length = 0;
        TriggerManager.allColorTriggers.length = 0;

        TriggerManager.enterEffectTriggers.length = 0;
        TriggerManager.allEnterEffectTriggers.length = 0;


        TriggerManager.activeTransitions.length = 0;
    }

    public static resetTriggers(): void {
        TriggerManager.colorTriggers = TriggerManager.allColorTriggers
            .map((trigger) => TriggerManager.cloneColorTrigger(trigger));
        TriggerManager.enterEffectTriggers = TriggerManager.allEnterEffectTriggers
            .map(([type, x]) => [type, x]);
        
        TriggerManager.activeTransitions.length = 0;
        EnterEffectManager.currentEnterEffect = EnterEffect.NONE;
    }

    public static playColorChange(
        channelID: number,
        duration: number,
        targetColor: Color,
        blending: boolean = false
    ): void {
        // snapshot the channel's current color right now
        const currentColor = ColorChannelManager.instance.getChannel(channelID);
        const startColor = new Color(currentColor.r, currentColor.g, currentColor.b, currentColor.a); // clone it

        TriggerManager.activeTransitions = TriggerManager.activeTransitions
            .filter(t => t.channelID !== channelID);

        if (duration <= 0) {
            ColorChannelManager.instance.setChannel(channelID, targetColor.r, targetColor.g, targetColor.b, targetColor.a, blending);
            return;
        }

        TriggerManager.activeTransitions.push({
            channelID,
            startColor,
            targetColor: new Color(targetColor),
            duration,
            elapsed: 0,
            blending
        });
    }

    public static tickTransitions(dt: number): void {
        const finished: ActiveColorTransition[] = [];

        for (const t of TriggerManager.activeTransitions) {
            t.elapsed += dt;
            const progress = Math.min(t.elapsed / t.duration, 1);

            // lerp each channel
            const r = Math.round(t.startColor.r + (t.targetColor.r - t.startColor.r) * progress);
            const g = Math.round(t.startColor.g + (t.targetColor.g - t.startColor.g) * progress);
            const b = Math.round(t.startColor.b + (t.targetColor.b - t.startColor.b) * progress);
            const a = Math.round(t.startColor.a + (t.targetColor.a - t.startColor.a) * progress);

            ColorChannelManager.instance.setChannel(t.channelID, r, g, b, a, t.blending);

            if (progress >= 1) finished.push(t);
        }

        // remove completed transitions
        TriggerManager.activeTransitions = TriggerManager.activeTransitions
            .filter(t => !finished.includes(t));
    }

    public static runTriggerCheck(objectData: Record<string, any>): void {
        const colorTriggers = TriggerManager.colorTriggers;
        const allColorTriggers = TriggerManager.allColorTriggers;

        let color: Color;
        let colorTrigger: [number, number, number, Color, boolean];
        let enterEffectTrigger: [EnterEffect, number];

        switch (objectData.objectId) {
            case Trigger.COLOR:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    objectData.targetColorId,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;

            case Trigger.COLOR_BG:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    ColorChannelManager.BG,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;

            case Trigger.COLOR_G1:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    ColorChannelManager.G1,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;

            case Trigger.COLOR_OBJ:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    ColorChannelManager.OBJ,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;

            case Trigger.COLOR_3DL:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    ColorChannelManager._3DL,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;

            case Trigger.COLOR_G2:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    ColorChannelManager.G2,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;

            case Trigger.COLOR_LINE:
                color = new Color(
                    objectData.red,
                    objectData.green,
                    objectData.blue,
                    TriggerManager.toChannelAlpha(objectData.opacity)
                );
                colorTrigger = [
                    ColorChannelManager.LINE,
                    objectData.x,
                    objectData.duration,
                    color,
                    objectData.blending
                ];
                colorTriggers.push(colorTrigger);
                allColorTriggers.push(colorTrigger);
                break;
            
            case Trigger.ENTER_SCALE_UP:
            case Trigger.ENTER_FLY_BOTTOM:
            case Trigger.ENTER_FLY_TOP:
            case Trigger.ENTER_NONE:

                const matchedName: string = Trigger[objectData.objectId];
                const key: string = matchedName.replace(/^ENTER_/, "");
                
                enterEffectTrigger = [
                    EnterEffect[key as keyof typeof EnterEffect],
                    objectData.x
                ];

                this.enterEffectTriggers.push(enterEffectTrigger);
                this.allEnterEffectTriggers.push(enterEffectTrigger);
                break;
        }
    }

    protected lateUpdate(dt: number): void {
        const px = PlayLayer.player1.getPositionX();
        const sessionColorTriggers = TriggerManager.colorTriggers;
        const sessionEnterEffectTriggers = TriggerManager.enterEffectTriggers;
        
        for (let i = sessionColorTriggers.length - 1; i >= 0; i--) {
            const [channelID, x, duration, color, blending] = sessionColorTriggers[i];
            if (px >= x) {
                TriggerManager.playColorChange(channelID, duration, color, blending);
                sessionColorTriggers.splice(i, 1);
            }
        }

        for (let i = sessionEnterEffectTriggers.length - 1; i >= 0; i--) {
            const [type, x] = sessionEnterEffectTriggers[i];
            if (px >= x) {
                EnterEffectManager.currentEnterEffect = type;
                sessionEnterEffectTriggers.splice(i, 1);
            }
        }

        TriggerManager.tickTransitions(dt);
    }
}
