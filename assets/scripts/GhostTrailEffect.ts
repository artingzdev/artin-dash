import { _decorator, Color, Component, sp, Sprite, SpriteFrame, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { PlayLayer } from './PlayLayer';
import { AD } from './AD';
import { ColorChannelManager } from './ColorChannelManager';
import { setSpriteBlending } from './utils';
import { PlayerObject } from './PlayerObject';
const { ccclass, property } = _decorator;

@ccclass('GhostTrailEffect')
export class GhostTrailEffect extends Component {

    @property
    private interval: number = 0.05;

    @property
    private duration: number = 0.35; // real value: 0.4
    
    @property
    private startOpacity: number = 200;

    @property
    private endOpacity: number = 0;

    @property
    private startScale: number = 1;

    @property
    private endScale: number = 0.6;

    private timer = 0;
    private index = 0;

    private tempScale = new Vec3();
    private targetScale = new Vec3();

    public ghostTrailEnabled: boolean = false;
    
    private unbind: (() => void) | null = null;
    private static _instance: GhostTrailEffect = null;

    public static get instance(): GhostTrailEffect {
        return GhostTrailEffect._instance;
    }

    protected onLoad(): void {
        GhostTrailEffect._instance = this;

        // bind it to the player primary color
        this.unbind = this.bindToChannel(ColorChannelManager.P1);
    }

    protected bindToChannel(id: number): () => void {
        return ColorChannelManager.instance.bindTo(id, (color) => {
            this.changeGhostTrailColor(color);
        });
    }

    private changeGhostTrailColor(color: Color): void {
        const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

        for (let i = 0; i < this.node.children.length; i++) {
            const ghostSpriteNode = this.node.children[i];
            const sprite = ghostSpriteNode.getComponent(Sprite);

            if (!sprite) continue;
            sprite.color = fixedColor;
            ghostSpriteNode.getComponent(UIOpacity).opacity = 0;
            setSpriteBlending(sprite, true);
        }
    }

    public updateGhostTrailIcon() {
        for (let i = 0; i < this.node.children.length; i++) {
            const ghostSpriteNode = this.node.children[i];

            const playerFrame = PlayerObject.instance.playerMainFrame;

            const spriteComponent = ghostSpriteNode.getComponent(Sprite);
            if (playerFrame && spriteComponent) {
                spriteComponent.spriteFrame = playerFrame as SpriteFrame;
            }
        }
    }

    private trailSnapShot(): void {
        const ghostSprite = this.node.children[this.index];
        this.index = (this.index + 1) % this.node.children.length;

        const p1 = PlayLayer.player1;
        const opacity = ghostSprite.getComponent(UIOpacity)!;

        // stop previous tweens before reusing this ghost
        Tween.stopAllByTarget(ghostSprite);
        Tween.stopAllByTarget(opacity);

        // snapshot transform
        ghostSprite.setWorldPosition(p1.getPosition());
        ghostSprite.angle = -p1.getVisualRotation();
        ghostSprite.setScale(this.startScale, this.startScale, 1);
        opacity.opacity = this.startOpacity;

        ghostSprite.getScale(this.tempScale);

        this.targetScale.set(
            this.tempScale.x * this.endScale,
            this.tempScale.y * this.endScale,
            this.tempScale.z
        );

        // scale tween
        tween(ghostSprite)
            .to(this.duration, {
                scale: this.targetScale.clone()
            })
            .start();

        // fade tween
        tween(opacity)
            .to(this.duration, {
                opacity: this.endOpacity
            })
            .start();
    }

    protected lateUpdate(dt: number) {
        if (!this.ghostTrailEnabled) return;

        this.timer += dt;

        while (this.timer >= this.interval) {
            this.timer -= this.interval;
            this.trailSnapShot();
        }
    }

    protected onDestroy(): void {
        this.unbind?.();
    }
}