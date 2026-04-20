import { _decorator, clamp, Color, Node, UITransform, Vec2, view } from 'cc';
import { ADBaseLayer } from './ADBaseLayer';
import { GameLayer } from './LayerManager';
import { getCachedSpriteFrame, pixelsToUnits } from './utils';
import { AD } from './AD';
import { ADTileRow } from './ADTileRow';
import { CameraController } from './CameraController';
import { ColorChannelManager } from './ColorChannelManager';
const { ccclass } = _decorator;

@ccclass('ADBackgroundLayer')
export class ADBackgroundLayer extends ADBaseLayer {

        public static readonly TILE_WIDTH: number = 2048;
        public static readonly TILE_HEIGHT: number = 2048;

        protected backgroundScale: number = 1.592;
        protected backgroundSpeed: number = 0.1;
        public tileWidth: number = ADBackgroundLayer.TILE_WIDTH;
        public tileHeight: number = ADBackgroundLayer.TILE_HEIGHT;
        protected tileCountX: number = 1;
        protected tileCountY: number = 3;

        private _backgroundID: number = 1;

        public backgroundLower01Node: Node = null;
        public backgroundLower02Node: Node = null;
        public backgroundUpperNode: Node = null;

        private _wrapOffsetX: number = 0;
        private _wrapOffsetY: number = 0;

        private pendingTextureSwap: any = -1;
        private maxID: number = 59;

        private unbind: (() => void) | null = null;

        setup(backgroundID: number): void {
                this._backgroundID = backgroundID;
        }

        protected initInternal(): void {
                this.tileCountX = Math.ceil(view.getVisibleSize().width / pixelsToUnits(this.tileWidth)) + 1;

                const clampedID = clamp(this._backgroundID, 1, this.maxID);
                const formattedBackgroundID = clampedID.toString().padStart(2, '0');

                // create the lower backgrounds
                const backgroundLower01Frame = getCachedSpriteFrame(`game_bg_${formattedBackgroundID}_001-uhd/spriteFrame`);
                this.backgroundLower01Node = AD.createTileRow(this.node, "background-sprite", backgroundLower01Frame, this.tileCountX, this.tileWidth, new Vec2(0, 0));
                const backgroundLower01XForm = this.backgroundLower01Node.getComponent(UITransform)!;
                backgroundLower01XForm.setAnchorPoint(0, 0);
                AD.scaleBy(this.backgroundLower01Node, this.backgroundScale);

                const backgroundLower02Frame = getCachedSpriteFrame(`game_bg_${formattedBackgroundID}_001-uhd/spriteFrame`);
                this.backgroundLower02Node = AD.createTileRow(this.node, "background-sprite", backgroundLower02Frame, this.tileCountX, this.tileWidth, new Vec2(0, 0));
                const backgroundLower02XForm = this.backgroundLower02Node.getComponent(UITransform)!;
                backgroundLower02XForm.setAnchorPoint(0, 0);
                AD.scaleBy(this.backgroundLower02Node, this.backgroundScale);
                this.backgroundLower02Node.setPosition(0, 2 * pixelsToUnits(this.tileHeight) * this.backgroundScale);


                // create the upper backgrounds (mirrored)
                const backgroundUpperFrame = getCachedSpriteFrame(`game_bg_${formattedBackgroundID}_001-uhd/spriteFrame`);
                this.backgroundUpperNode = AD.createTileRow(this.node, "background-sprite", backgroundLower01Frame, this.tileCountX, this.tileWidth, new Vec2(0, 0));
                const backgroundUpperXForm = this.backgroundUpperNode.getComponent(UITransform)!;
                backgroundUpperXForm.setAnchorPoint(0, 1);
                AD.scaleBy(this.backgroundUpperNode, this.backgroundScale);
                AD.flipY(this.backgroundUpperNode);


                this.backgroundLower01Node.setPosition(0, 0);
                this.backgroundUpperNode.setPosition(
                        0,
                        pixelsToUnits(this.tileHeight * this.backgroundScale)
                );

                // set the default colors
                this.unbind = this.bindToChannel(ColorChannelManager.BG);

                // change background if change was pending
                if (this.pendingTextureSwap > -1) {
                        this.swapBackground(this.pendingTextureSwap);
                        this.pendingTextureSwap = -1;
                }
        }

        static getLayer(): GameLayer {
                return GameLayer.BG;
        }

        protected bindToChannel(id: number): () => void {
                return ColorChannelManager.instance.bindTo(id, (color) => {
                        this.changeBackgroundColor(color);
                });
        }

        public changeBackgroundColor(color: Color): void {
                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);
                this.backgroundLower01Node?.getComponent(ADTileRow)?.setColor(fixedColor);
                this.backgroundLower02Node?.getComponent(ADTileRow)?.setColor(fixedColor);
                this.backgroundUpperNode?.getComponent(ADTileRow)?.setColor(fixedColor);
        }

        public swapBackground(background: number) {
                if (
                        this.backgroundLower01Node == null ||
                        this.backgroundLower02Node == null ||
                        this.backgroundUpperNode == null
                ) {
                        this.pendingTextureSwap = background;
                }

                const clampedID = clamp(background, 1, this.maxID);
                const formattedID = clampedID.toString().padStart(2, '0');

                const frame = getCachedSpriteFrame(`game_bg_${formattedID}_001-uhd/spriteFrame`);
                try {
                        this.backgroundLower01Node.getComponent(ADTileRow)?.setSpriteFrame(frame);
                        this.backgroundLower02Node.getComponent(ADTileRow)?.setSpriteFrame(frame);
                        this.backgroundUpperNode.getComponent(ADTileRow)?.setSpriteFrame(frame);
                } catch(e) {}
        }

        // move with parallax and infinite scroll effect
        private updatePosition(): void {
                const tileWidthUnits = pixelsToUnits(this.tileWidth) * this.backgroundScale;
                const tileHeightUnits = pixelsToUnits(this.tileHeight) * this.backgroundScale;

                const backgroundWidth = pixelsToUnits(this.tileWidth) * this.tileCountX * this.backgroundScale;
                const backgroundHeight = pixelsToUnits(this.tileHeight) * this.tileCountY * this.backgroundScale;

                const cameraLeft = CameraController.getCameraLeft();
                const cameraRight = CameraController.getCameraRight();
                const cameraTop = CameraController.getCameraTop();
                const cameraBottom = CameraController.getCameraBottom();

                const baseX = cameraLeft - cameraLeft * this.backgroundSpeed;
                const baseY = cameraBottom - cameraBottom * this.backgroundSpeed;

                const posX = baseX + this._wrapOffsetX;
                const posY = baseY + this._wrapOffsetY;

                const thresholdY: number = 128;

                const backgroundRight = posX + backgroundWidth;
                if (cameraRight > backgroundRight) {
                    const delta = cameraRight - backgroundRight;
                    const steps = Math.floor(delta / tileWidthUnits) + 1;
                    this._wrapOffsetX += steps * tileWidthUnits;
                }

                const backgroundLeft = posX;
                if (cameraLeft < backgroundLeft) {
                    const delta =  backgroundLeft - cameraLeft;
                    const steps = Math.floor(delta / tileWidthUnits) + 1;
                    this._wrapOffsetX -= steps * tileWidthUnits;
                }

                const backgroundTop = posY + backgroundHeight - thresholdY;
                if (cameraTop > backgroundTop) {
                    const delta = cameraTop - backgroundTop;
                    const steps = Math.floor(delta / tileHeightUnits) + 2;
                    this._wrapOffsetY += steps * tileHeightUnits;
                }

                const backgroundBottom = posY + thresholdY;
                if (cameraBottom < backgroundBottom) {
                    const delta = backgroundBottom - cameraBottom;
                    const steps = Math.floor(delta / tileHeightUnits) + 2;
                    this._wrapOffsetY -= steps * tileHeightUnits;
                }
                
                this.setPosition(
                        baseX + this._wrapOffsetX,
                        baseY + this._wrapOffsetY
                );
        }

        protected lateUpdate(dt: number): void {
                if (!this.initialized) {
                    return;
                }

                this.updatePosition();
        }

        protected onDestroy(): void {
                this.unbind?.();
        }
}
