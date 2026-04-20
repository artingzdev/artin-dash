import { _decorator, view, Node, Color, Vec2, clamp } from 'cc';
import { ADBaseLayer } from './ADBaseLayer';
import { GameLayer } from './LayerManager';
import { getCachedSpriteFrame, pixelsToUnits, settings } from './utils';
import { AD } from './AD';
import { ADTileRow } from './ADTileRow';
import { CameraController } from './CameraController';
import { ColorChannelManager } from './ColorChannelManager';
const { ccclass } = _decorator;

@ccclass('ADMGLayer')
export class ADMGLayer extends ADBaseLayer {

        private _middlegroundID: number = 0;
        public static readonly TILE_WIDTH: number = 1024;
        public mgScale: number = 1.2;
        protected tileWidth: number = ADMGLayer.TILE_WIDTH;
        
        private mg01Node: Node = null;
        private mg02Node: Node = null;
        private mgPosY: number = 25;
        private wrapOffsetX: number = 0;

        public mgSpeedX: number = 0.3;
        public mgSpeedY: number = 0.5;

        protected tileCount: number = 1;

        private unbindMg01: (() => void) | null = null;
        private unbindMg02: (() => void) | null = null;

        private pendingTextureSwap: any = -1;
        private maxID: number = 3;

        setup(middlegroundID: number): void {
                this._middlegroundID = middlegroundID;
        }

        protected initInternal(): void {
                this.tileCount = Math.ceil(view.getVisibleSize().width / pixelsToUnits(this.tileWidth)) + 1;

                const formattedMgID = this._middlegroundID.toString().padStart(2, '0');
                
                // create primary middleground
                const mg01Frame = this._middlegroundID > 0
                        ? getCachedSpriteFrame(`fg_${formattedMgID}_001-uhd/spriteFrame`)
                        : getCachedSpriteFrame('fg_empty_001-uhd/spriteFrame');
                this.mg01Node = AD.createTileRow(this.node, "middleground-sprite", mg01Frame, this.tileCount, this.tileWidth, new Vec2(0, 0));
                AD.anchor00(this.mg01Node);
                AD.scaleBy(this.mg01Node, this.mgScale);

                // create secondary middleground
                const mg02Frame = this._middlegroundID > 0
                        ? getCachedSpriteFrame(`fg_${formattedMgID}_2_001-uhd/spriteFrame`)
                        : getCachedSpriteFrame('fg_empty_001-uhd/spriteFrame');
                this.mg02Node = AD.createTileRow(this.node, "middleground-sprite", mg02Frame, this.tileCount, this.tileWidth, new Vec2(0, 0));
                AD.anchor00(this.mg02Node);
                AD.scaleBy(this.mg02Node, this.mgScale);

                // move them
                let deltaHeight = 40;
                switch(this._middlegroundID) {
                        case 1:
                                this.mgPosY = 25;
                                deltaHeight = 40;
                                break;
                        case 2:
                                this.mgPosY = 30;
                                deltaHeight = 0;
                                break;
                        case 3:
                                this.mgPosY = 30;
                                deltaHeight = -2;
                                break;
                }
                AD.moveBy(this.mg02Node, 0, pixelsToUnits(deltaHeight * this.mgScale));

                // bind to corresponding color channels
                this.unbindMg01 = this.bindToChannel01(ColorChannelManager.MG1);
                this.unbindMg02 = this.bindToChannel02(ColorChannelManager.MG2);

                // change middleground if change was pending
                if (this.pendingTextureSwap > -1) {
                        this.swapMiddleground(this.pendingTextureSwap);
                        this.pendingTextureSwap = -1;
                }
        }

        public swapMiddleground(middleground: number) {
                if (
                        this.mg01Node == null ||
                        this.mg02Node == null
                ) {
                        this.pendingTextureSwap = middleground;
                }

                const clampedID = clamp(middleground, 1, this.maxID);
                const formattedID = clampedID.toString().padStart(2, '0');

                const frame01 = getCachedSpriteFrame(`fg_${formattedID}_001-uhd/spriteFrame`);
                const frame02 = getCachedSpriteFrame(`fg_${formattedID}_2_001-uhd/spriteFrame`);

                const mg01Height = frame01.height;
                const mg02Height = frame02.height;
                try {
                        const row01 = this.mg01Node.getComponent(ADTileRow);
                        const row02 = this.mg02Node.getComponent(ADTileRow);
                        row01?.setSpriteFrame(frame01);
                        row02?.setSpriteFrame(frame02);
                        row01?.setUniformHeight(mg01Height);
                        row02?.setUniformHeight(mg02Height);

                        let deltaHeight = 40;
                        switch(clampedID) {
                                case 1:
                                        this.mgPosY = 25;
                                        deltaHeight = 40;
                                        break;
                                case 2:
                                        this.mgPosY = 30;
                                        deltaHeight = 0;
                                        break;
                                case 3:
                                        this.mgPosY = 30;
                                        deltaHeight = -2;
                                        break;
                        }
                        this.mg02Node.setPosition(this.mg02Node.position.x, pixelsToUnits(deltaHeight * this.mgScale));
                } catch(e) {}
        }

        protected bindToChannel01(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    const channel = ColorChannelManager.instance.getChannel(id);
                    this.changeMg01Color(color, channel?.blending ?? false);
            });
        }

        protected bindToChannel02(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    const channel = ColorChannelManager.instance.getChannel(id);
                    this.changeMg02Color(color, channel?.blending ?? false);
            });
        }

        public changeMg01Color(color: Color, blending: boolean = false): void {
                const row = this.mg01Node?.getComponent(ADTileRow);
                if (!row) return;
                row.setColor(color);
                row.setBlending(blending);
        }

        public changeMg02Color(color: Color, blending: boolean = false): void {
                const row = this.mg02Node?.getComponent(ADTileRow);
                if (!row) return;
                row.setColor(color);
                row.setBlending(blending);
        }

        static getLayer(): GameLayer {
                return GameLayer.MG;
        }

        // move with parallax and infinite scroll effect
        private updatePosition(): void {
                const tileWidthUnits = pixelsToUnits(this.tileWidth) * this.mgScale;
                const mgWidth = pixelsToUnits(this.tileWidth) * this.tileCount * this.mgScale;

                const cameraLeft = CameraController.getCameraLeft();
                const cameraRight = CameraController.getCameraRight();
                const cameraBottom = CameraController.getCameraBottom();

                const baseX = cameraLeft - cameraLeft * this.mgSpeedX;
                const baseY = 
                        cameraBottom -
                        (cameraBottom + settings.defaultCameraOffsetY)
                        * this.mgSpeedY
                        + this.mgPosY;

                const posX = baseX + this.wrapOffsetX;

                const mgRight = posX + mgWidth;
                if (cameraRight > mgRight) {
                    const delta = cameraRight - mgRight;
                    const steps = Math.floor(delta / tileWidthUnits) + 1;
                    this.wrapOffsetX += steps * tileWidthUnits;
                }

                const mgLeft = posX;
                if (cameraLeft < mgLeft) {
                    const delta =  mgLeft - cameraLeft;
                    const steps = Math.floor(delta / tileWidthUnits) + 1;
                    this.wrapOffsetX -= steps * tileWidthUnits;
                }
                
                this.setPosition(
                        baseX + this.wrapOffsetX,
                        baseY
                );
        }

        protected lateUpdate(dt: number): void {
                if (!this.initialized) {
                    return;
                }

                this.updatePosition();
        }

        protected onDestroy(): void {
                this.unbindMg01?.();
                this.unbindMg02?.();
        }
}
