import { _decorator, Color, Component, Node, Size, Sprite, SpriteFrame, SpriteFrameEvent, UITransform, Vec2 } from 'cc';
import { fixSpriteScale, pixelsToUnits, setSpriteBlending } from './utils';
import { ColorChannelManager } from './ColorChannelManager';

const { ccclass } = _decorator;

@ccclass('ADTileRow')
export class ADTileRow extends Component {
    private segmentSprites: Sprite[] = [];

    build(tileCount: number, tileWidthPx: number, frame: SpriteFrame, segmentAnchor: Vec2): void {
        this.node.removeAllChildren();
        this.segmentSprites = [];

        if (tileCount < 1 || tileWidthPx < 1 || !frame) {
            return;
        }

        const segW = pixelsToUnits(tileWidthPx);

        for (let i = 0; i < tileCount; i++) {
            const child = new Node(`seg_${i}`);
            const ut = child.addComponent(UITransform);
            const sp = child.addComponent(Sprite);
            sp.type = Sprite.Type.SIMPLE;
            sp.spriteFrame = frame;
            fixSpriteScale(child, 1);
            ut.setContentSize(new Size(frame.width, frame.height));
            ut.setAnchorPoint(segmentAnchor);
            child.setPosition(i * segW, 0, 0);
            this.node.addChild(child);
            this.segmentSprites.push(sp);
        }

        const rootUt = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
        rootUt.setContentSize(new Size(tileWidthPx * tileCount, frame.height));
    }

    getSegmentSprites(): readonly Sprite[] {
        return this.segmentSprites;
    }

    setSpriteFrame(frame: SpriteFrame): void {
        for (const sp of this.segmentSprites) {
            if (!sp || !sp.isValid) continue;
            sp.spriteFrame = frame;
            const ut = sp.node.getComponent(UITransform);
            if (ut && frame) {
                ut.setContentSize(new Size(frame.width, frame.height));
            }
        }
        const rootUt = this.node.getComponent(UITransform);
        if (rootUt && frame && this.segmentSprites.length > 0) {
            const tileWidthPx = frame.width;
            rootUt.setContentSize(new Size(tileWidthPx * this.segmentSprites.length, frame.height));
        }
    }

    setColor(color: Color): void {
        const fixed = ColorChannelManager.getColor(color.r, color.g, color.b, color.a);
        for (const sp of this.segmentSprites) {
            if (!sp || !sp.isValid) continue;
            if (!sp.color.equals(fixed)) {
                sp.color = fixed;
            }
        }
    }

    setUniformHeight(heightPixels: number): void {
        for (const sp of this.segmentSprites) {
            if (!sp || !sp.isValid) continue;
            const ut = sp.node.getComponent(UITransform);
            if (ut) {
                ut.setContentSize(new Size(ut.contentSize.width, heightPixels));
            }
        }
        const rootUt = this.node.getComponent(UITransform);
        if (rootUt) {
            rootUt.setContentSize(new Size(rootUt.contentSize.width, heightPixels));
        }
    }

    setBlending(blending: boolean): void {
        for (const sp of this.segmentSprites) {
            if (!sp || !sp.isValid) continue;
            setSpriteBlending(sp, blending);
        }
    }
}
