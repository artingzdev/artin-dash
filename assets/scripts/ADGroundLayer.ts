import { _decorator, Node, Sprite, UITransform, Color, Size, Vec2, SpriteFrame, view, clamp, Vec4, BoxCollider2D, RigidBody2D, ERigidBody2DType, tween } from 'cc';
import { fixSpriteScale, getCachedSpriteFrame, pixelsToUnits, setSpriteBlending, settings } from './utils';
import { CameraController } from './CameraController';
import { GameLayer } from './LayerManager';
import { ADBaseLayer } from './ADBaseLayer';
import { AD } from './AD';
import { ADTileRow } from './ADTileRow';
import { ColorChannelManager } from './ColorChannelManager';
const { ccclass } = _decorator;

@ccclass('GJGroundLayer')
export class ADGroundLayer extends ADBaseLayer {

    public static readonly TILE_WIDTH: number = 512;
    public static readonly TILE_HEIGHT: number = 512;

    public tileWidth: number = ADGroundLayer.TILE_WIDTH;
    public tileHeight: number = ADGroundLayer.TILE_HEIGHT;

    private groundID: number = 1;
    private isCeiling: boolean = false;
    private lineType: number = 1;

    protected shadowLeftNode: Node = null;
    protected shadowRightNode: Node = null;
    protected lineNode: Node = null;
    protected ground01Node: Node = null;
    protected ground02Node: Node = null

    protected groundWidthUnits: number = null!;

    private pendingTextureSwap: any = -1;
    private maxID: number = 22;
    private minSecondaryID = 8; // grounds 8 and onward have both primary AND secondary layers

    private unbindGround01: (() => void) | null = null;
    private unbindGround02: (() => void) | null = null;
    private unbindLine: (() => void) | null = null;

    private isStaticY: boolean = false;
    private screenY: number = 0;

    private static _instance: ADGroundLayer = null!;

    public static get instance(): ADGroundLayer {
        return ADGroundLayer._instance;
    }

    protected onLoad(): void {
        if (this.isCeiling) this.screenY = view.getVisibleSize().height;
        ADGroundLayer._instance = this;
    }

    setup(groundID: number, isCeiling: boolean, lineType: number): void {
        this.groundID = groundID;
        this.isCeiling = isCeiling;
        this.lineType = lineType;
    }

    getScreenY(): number {
        return this.screenY;
    }

    setScreenY(screenY: number): void {
        this.screenY = screenY;
    }

    protected initInternal(): void {
        const visibleSize = view.getVisibleSize();
        const clampedID = clamp(this.groundID, 1, this.maxID);
        const formattedGroundID = clampedID.toString().padStart(2, '0');
        const tiles = (Math.ceil(visibleSize.width / pixelsToUnits(this.tileWidth))) + 5;
        this.groundWidthUnits = tiles * pixelsToUnits(this.tileWidth);

        // create ground 01
        const ground01Frame = getCachedSpriteFrame(`grounds/groundSquare_${formattedGroundID}_001-uhd/spriteFrame`);
        this.ground01Node = AD.createTileRow(this.node, "ground-sprite", ground01Frame, tiles, this.tileWidth, new Vec2(0, 1));
        const ground01Transform = this.ground01Node.getComponent(UITransform)!;
        ground01Transform.setAnchorPoint(new Vec2(0, 1));
        this.ground01Node.setPosition(
            this.ground01Node.position.x,
            pixelsToUnits(ground01Transform.contentSize.height - this.tileHeight)
        )

        // create ground 02
        const ground02Frame = this.groundID >= this.minSecondaryID
            ? getCachedSpriteFrame(`grounds/groundSquare_${formattedGroundID}_2_001-uhd/spriteFrame`)
            : getCachedSpriteFrame('grounds/groundSquare_empty_001-uhd/spriteFrame');

        this.ground02Node = AD.createTileRow(this.node, "ground-sprite", ground02Frame, tiles, this.tileWidth, new Vec2(0, 1));
        const ground02Transform = this.ground02Node.getComponent(UITransform)!;
        ground02Transform.setAnchorPoint(new Vec2(0, 1));

        // create floor line
        const lineFrame = getCachedSpriteFrame(
            `floorLine_${clamp(this.lineType, 1, 2).toString().padStart(2, '0')}_001-uhd/spriteFrame`
        );
        this.lineNode = AD.createSprite(this.node, "line", lineFrame);
        const lineTransform = this.lineNode.getComponent(UITransform)!;

        let lineScaleX: number;

        lineTransform.setAnchorPoint(new Vec2(0.5, 1));
        const clampedLineType = clamp(this.lineType, 1, 3);

        switch(clampedLineType) {
            case 1:
                this.lineNode.setPosition(visibleSize.width / 2, 0.5);
                break;
            case 2:
                this.lineNode.setPosition(visibleSize.width / 2, 0.2);
                lineScaleX = (visibleSize.width + 10) / pixelsToUnits(lineTransform.contentSize.width);
                this.lineNode.setScale(
                    pixelsToUnits(lineScaleX),
                    pixelsToUnits(1),
                    1);
                break;
            case 3:
                this.lineNode.setPosition(visibleSize.width / 2, 0.2);
                lineScaleX = (visibleSize.width + 10) / pixelsToUnits(lineTransform.contentSize.width);
                this.lineNode.setScale(
                    pixelsToUnits(lineScaleX),
                    pixelsToUnits(2),
                1);
                break;
        }

        //create ground shadows
        const shadowLeftFrame = getCachedSpriteFrame("groundSquareShadow_001-uhd/spriteFrame");
        this.shadowLeftNode = AD.createSprite(this.node, "shadow-left", shadowLeftFrame);
        this.shadowLeftNode.getComponent(UITransform).setAnchorPoint(new Vec2(0, 1));
        const shadowLeftScale = this.shadowLeftNode.scale;
        this.shadowLeftNode.setScale(shadowLeftScale.x * 0.7, shadowLeftScale.y, 1);
        this.shadowLeftNode.getComponent(Sprite).color = ColorChannelManager.getColor(255, 255, 255, 100);

        const shadowRightFrame = getCachedSpriteFrame("groundSquareShadow_001-uhd/spriteFrame");
        this.shadowRightNode = AD.createSprite(this.node, "shadow-right", shadowRightFrame);
        this.shadowRightNode.getComponent(UITransform).setAnchorPoint(new Vec2(0, 1));
        const shadowRightScale = this.shadowRightNode.scale;
        this.shadowRightNode.setScale(shadowRightScale.x * -0.7, shadowRightScale.y, 1);
        this.shadowRightNode.getComponent(Sprite).color = ColorChannelManager.getColor(255, 255, 255, 100);
        this.shadowRightNode.setPosition(visibleSize.width, 0, this.shadowRightNode.position.z);

        // flip if it's the ceiling
        if (this.isCeiling) {
            this.node.setScale(this.node.scale.x, this.node.scale.y * -1, this.node.scale.z);
        }

        // set default colors
        this.unbindGround01 = this.bindToChannel01(ColorChannelManager.G1);
        this.unbindGround02 = this.bindToChannel02(ColorChannelManager.G2);
        this.unbindLine = this.bindToChannelLine(ColorChannelManager.LINE);

        // change ground if change was pending
        if (this.pendingTextureSwap > -1) {
                this.swapGround(this.pendingTextureSwap);
                this.pendingTextureSwap = -1;
        }
    }

    public resetFromStaticY(instant: boolean = false): void {
        if (!this.isStaticY) return;
        

        const startScreenY = this.screenY;
        const winHeight = view.getVisibleSize().height;
        const targetScreenY = this.isCeiling
            ? winHeight // ceiling
            : 0; // ground
            
        if (startScreenY == targetScreenY)
        {
            return;
        }

        if (instant) {
            this.screenY = targetScreenY;
            if (this.isCeiling)
            {
                this.setVisible(false);
            }
            return;
        }

        const resetStaticY = () => {
            this.isStaticY = false;
        }

        const state = { sY: startScreenY };
        tween(state)
            .to(0.5, { sY: targetScreenY }, {
                easing: 'quadInOut',
                onUpdate: () => {
                    this.screenY = state.sY;
                }
            })
            .call(() => {
                if (this.isCeiling) this.setVisible(false);
                resetStaticY();
            })
            .start();
    }

    public easeToScreenY(targetScreenY: number, durationSeconds: number, instant: boolean = false, startsOffScreen: boolean): void {
        this.isStaticY = true;

        targetScreenY = Math.max(targetScreenY, 0);
        const startScreenY = this.screenY;
        if (startScreenY == targetScreenY) {
            return;
        }

        if (instant || durationSeconds <= 0) {
            this.node.setPosition(this.node.position.x, targetScreenY);
            return;
        }

        const onUpdate = () => {
            this.screenY = state.sY;
            if (this.isCeiling) {
                this.screenY = state.sY;
                return;
            }

            const reachedCurrentProgress = this.screenY >= state.sY;

            if (startsOffScreen) {
                this.screenY = state.sY;
            }
            else if (reachedCurrentProgress) {
                this.screenY = state.sY;
            }
        }

        const state = { sY: startScreenY };
        tween(state)
            .to(durationSeconds, {sY: targetScreenY} ,{
                easing: 'quadInOut',
                onUpdate: onUpdate
            })
            .start();
    }

    public swapGround(ground: number) {
        if (
                this.ground01Node == null ||
                this.ground02Node == null
        ) {
                this.pendingTextureSwap = ground;
        }

        const clampedID = clamp(ground, 1, this.maxID);
        const formattedID = clampedID.toString().padStart(2, '0');

        const frame01 = getCachedSpriteFrame(`groundSquare_${formattedID}_001-uhd/spriteFrame`);
        const frame02 = ground >= this.minSecondaryID
            ? getCachedSpriteFrame(`grounds/groundSquare_${formattedID}_2_001-uhd/spriteFrame`)
            : getCachedSpriteFrame('grounds/groundSquare_empty_001-uhd/spriteFrame');

        const ground02Height = frame02.height;
        try {
                this.ground01Node.getComponent(ADTileRow)?.setSpriteFrame(frame01);
                const row02 = this.ground02Node.getComponent(ADTileRow);
                row02?.setSpriteFrame(frame02);
                row02?.setUniformHeight(ground02Height);
        } catch(e) {}
    }

    protected bindToChannel01(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    this.changeGround01Color(color);
            });
    }

    protected bindToChannel02(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    this.changeGround02Color(color);
            });
    }

    protected bindToChannelLine(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    const channel = ColorChannelManager.instance.getChannel(id);
                    this.changeLineColor(color, channel?.blending ?? false);
            });
    }

    static getLayer(): GameLayer {
        return GameLayer.G;
    }

    public changeGround01Color(color: Color) {
        const row = this.ground01Node?.getComponent(ADTileRow);
        if (!row) return;
        row.setColor(ColorChannelManager.getColor(color.r, color.g, color.b));
    }

    public changeGround02Color(color: Color) {
        const row = this.ground02Node?.getComponent(ADTileRow);
        if (!row) return;
        row.setColor(ColorChannelManager.getColor(color.r, color.g, color.b));
    }

    public changeLineColor(color: Color, blending: boolean = false) {
        const sprite = this.lineNode.getComponent(Sprite);
        if (!sprite) return;

        const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);
        if (!sprite.color.equals(fixedColor)) {
            sprite.color = fixedColor;
        }
        setSpriteBlending(sprite, blending);
    }

    protected updateShadowPositions(): void {
        // lock ground square shadow to camera X
        this.shadowLeftNode.setPosition(
            CameraController.getCameraLeft() - this.node.position.x,
            this.shadowLeftNode.position.y
        )
        this.shadowRightNode.setPosition(
            CameraController.getCameraRight() - this.node.position.x,
            this.shadowRightNode.position.y
        )
    }

    protected updateLinePosition(): void {
        this.lineNode.setPosition(
            CameraController.getPositionX() - this.node.position.x,
            this.lineNode.position.y
        )
    }

    // infinite scroll logic and screen position calculation
    protected updateGroundPosition(): void {
        const groundWidth = this.groundWidthUnits;
        if (!groundWidth) return;

        const tileWidthUnits = pixelsToUnits(this.tileWidth);

        const cameraLeft = CameraController.getCameraLeft();
        const cameraRight = CameraController.getCameraRight();

        let posX = this.node.position.x;

        const groundRight = posX + groundWidth;
        if (cameraRight > groundRight) {
            const delta = cameraRight - groundRight;
            const steps = Math.floor(delta / tileWidthUnits) + 1;
            posX += steps * tileWidthUnits;
        }

        const groundLeft = posX;
        if (cameraLeft < groundLeft) {
            const delta = groundLeft - cameraLeft;
            const steps = Math.floor(delta / tileWidthUnits) + 1;
            posX -= steps * tileWidthUnits;
        }

        const camBottom = CameraController.getCameraBottom();
        const displacement = CameraController.getPositionY() + settings.defaultCameraOffsetY - CameraController.getHalfHeight();
        if (!this.isCeiling && !this.isStaticY) this.screenY -= displacement;
        const worldY = Math.max(0, camBottom + this.screenY); // convert screen space Y to world position

        this.setPosition(posX, worldY);
    }

    protected lateUpdate(dt: number): void {
        if (!this.initialized) {
            return;
        }

        this.updateGroundPosition();
        this.updateShadowPositions();
        this.updateLinePosition();
    }

    protected onDestroy(): void {
        this.unbindGround01?.();
        this.unbindGround02?.();
        this.unbindLine?.();
    }
}
