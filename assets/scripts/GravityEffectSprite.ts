import { _decorator, Color, Component, Node, sp, Sprite, UIOpacity, view } from 'cc';
import { GameLayer, LayerManager } from './LayerManager';
import { CameraController } from './CameraController';
import { AD } from './AD';
import { getCachedSpriteFrame, setSpriteBlending } from './utils';
import { ColorChannelManager } from './ColorChannelManager';
const { ccclass } = _decorator;

@ccclass('GravityEffectSprite')
export class GravityEffectSprite extends Component {

        protected initialized: boolean = false;

        private lineCount: number = 22;
        public slideTime: number = 0.4; // sec

        private timeElapsed: number = 0;
        private logicalY: number = -999; // start off-screen
        //private padding: number = 95;
        private padding: number = 150;

        private running: boolean = false;
        private movementDir: number = 1;

        private pendingColorChange: Color | null = null;

        start() {
                if (this.initialized) {
                        return;
                }

                this.initInternal();
                this.initialized = true;
        }

        protected initInternal(): void {
                const screenWidth = view.getVisibleSize().width;
                const segmentWidth = (screenWidth - 60) / this.lineCount;

                for (let i = 0; i < this.lineCount; i++) {
                        const lineNode = AD.createSprite(
                                this.node,
                                "gravity-line",
                                getCachedSpriteFrame("gravityLine_001/spriteFrame")
                        )

                        const x = Math.random() * segmentWidth
                                + (30 - screenWidth * 0.5)
                                + i * segmentWidth;
                        const y = (Math.random() * 2 - 1) * 10;
                        lineNode.setPosition(x, y);

                        const scaleX = (Math.random() * 4 + 2) * (480 / screenWidth);
                        const scaleY = (Math.random() + 2);
                        lineNode.setScale(scaleX, scaleY);
                        
                        const opacity = (Math.random() * 130 + 15);
                        const lineSprite = lineNode.getComponent(Sprite)!;
                        lineSprite.color = ColorChannelManager.getColor(255, 255, 255, opacity);

                        setSpriteBlending(lineSprite, true);

                        const uiOpacity = this.getComponent(UIOpacity) ?? this.addComponent(UIOpacity);
                        uiOpacity.opacity = 180;
                }
                
                
                if (this.pendingColorChange != null) {
                        const c = this.pendingColorChange;
                        this.updateSpritesColor(c.r, c.g, c.b);
                        this.pendingColorChange = null;
                }
        }

        static create(): GravityEffectSprite {
                const node = new Node(this.name);
                const obj = node.addComponent(this) as GravityEffectSprite;
                LayerManager.addToLayer(node, GameLayer.MAX);
                return obj;
        }

        private updateSpritesColor(r: number, g: number, b: number): void {
                const children = this.node.children;
                if (!children || children.length != this.lineCount) {
                        this.pendingColorChange = new Color(r, g, b, 255);
                        return;
                };

                for (let i = 0; i < children.length; i++) {
                        const childSprite = children[i].getComponent(Sprite);
                        if (childSprite) {
                                childSprite.color = ColorChannelManager.getColor(r, g, b, childSprite.color.a);
                        }
                }
        }

        public runAnimation(up: boolean): void {
                this.running = true;

                const c = up
                        ? ColorChannelManager.getColor(255, 255, 0, 255)
                        : ColorChannelManager.getColor(0, 255, 255, 255);

                this.updateSpritesColor(c.r, c.g, c.b);
                this.logicalY = up ? -this.padding : view.getVisibleSize().height + this.padding;
                this.movementDir = up ? 1 : -1;
        }

        public stopAnimation(): void {
                this.node.destroy();
        }

        private updatePosition(dt: number): void {
                if (this.running && this.timeElapsed <= this.slideTime) {
                        this.timeElapsed += dt;
                        const speed = (view.getVisibleSize().height + this.padding * 2) / this.slideTime;
                        this.logicalY += speed * this.movementDir * dt;
                }

                this.node.setPosition(
                        CameraController.getPositionX(),
                        CameraController.getCameraBottom() + this.logicalY
                );
        }

        protected lateUpdate(dt: number): void {
                if (!this.initialized) {
                        return;
                }

                this.updatePosition(dt);
        }
}
