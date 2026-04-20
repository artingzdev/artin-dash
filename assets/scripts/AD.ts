import { _decorator, clamp, Component, Node, Rect, Size, Sprite, SpriteFrame, UITransform, Vec2 } from 'cc';
import { fixSpriteScale, settings as gameSettings } from './utils';
import { ADTileRow } from './ADTileRow';
import { CollisionRect } from './CollisionRect';
const { ccclass, property } = _decorator;

@ccclass('AD')
export class AD extends Component {

    public static createSprite(parent: Node, name: string, frame: SpriteFrame): Node {
        const spriteNode = new Node(name);
        const transform = spriteNode.addComponent(UITransform);
        const sprite = spriteNode.addComponent(Sprite);

        sprite.spriteFrame = frame;
        fixSpriteScale(spriteNode, 1);
        transform.setAnchorPoint(new Vec2(0.5, 0.5));

        parent.addChild(spriteNode);

        return spriteNode;
    }

    public static createTileSprite(parent: Node, name: string, frame: SpriteFrame, tileCount: number, tileWidth: number) {
        const spriteNode = new Node(name);
        const transform = spriteNode.addComponent(UITransform);
        const sprite = spriteNode.addComponent(Sprite);

        sprite.spriteFrame = frame;
        fixSpriteScale(spriteNode, 1);
        transform.setAnchorPoint(new Vec2(0.5, 0.5));

        if (tileWidth > 0 && tileCount > 0) {
            sprite.type = Sprite.Type.TILED;
            transform.setContentSize(new Size(tileWidth * tileCount, transform.contentSize.height));            
        }

        parent.addChild(spriteNode);

        return spriteNode;
    }

    /**
     * Row of simple sprites (one tile per segment). Prefer over createTileSprite for large strips (avoids huge TILED VB).
     * @param segmentAnchor UITransform anchor per segment: e.g. (0,1) for ground strips, (0,0) for BG/MG.
     */
    public static createTileRow(
        parent: Node,
        name: string,
        frame: SpriteFrame,
        tileCount: number,
        tileWidth: number,
        segmentAnchor: Vec2,
    ): Node {
        const stripRoot = new Node(name);
        parent.addChild(stripRoot);
        const row = stripRoot.addComponent(ADTileRow);
        row.build(tileCount, tileWidth, frame, segmentAnchor);
        return stripRoot;
    }

    public static scaleBy(node: Node, factor: number): void {
            if (!node) return;

            node.setScale(
                    node.scale.x * factor,
                    node.scale.y * factor
            );
    }

    /**
     * Custom helper used to respect content scale when scaling a node.
     */
    public static setScale(node: Node, scale: number, flipXDir: number = 1, flipYDir: number = 1): void {
        if (!node || scale == null || isNaN(scale)) return;

        const clampedFlipXDir = Math.sign(flipXDir) || 1;
        const clampedFlipYDir = Math.sign(flipYDir) || 1;

        const s = scale / gameSettings.contentScaleFactor;
        node.setScale(
            s * clampedFlipXDir,
            s * clampedFlipYDir,
            1
        );
    }

    public static setScaleXY(node: Node, scaleX: number, scaleY: number, flipXDir: number = 1, flipYDir: number = 1): void {
        if (!node || scaleX == null || isNaN(scaleX) || scaleY == null || isNaN(scaleY)) return;

        const clampedFlipXDir = Math.sign(flipXDir) || 1;
        const clampedFlipYDir = Math.sign(flipYDir) || 1;

        const sx = scaleX / gameSettings.contentScaleFactor;
        const sy = scaleX / gameSettings.contentScaleFactor;
        node.setScale(
            sx * clampedFlipXDir,
            sy * clampedFlipYDir,
            1
        );
    }

    public static flipX(node: Node): void {
            if (!node) return;

            node.setScale(
                    node.scale.x * -1,
                    node.scale.y,
                    1
            );
    }

    public static flipY(node: Node): void {
            if (!node) return;

            node.setScale(
                    node.scale.x,
                    node.scale.y * -1,
                    1
            );
    }

    public static moveBy(node: Node, x: number, y: number) {
            node.setPosition(
                    node.position.x + x,
                    node.position.y + y
            )
    }

    public static anchor00(node: Node) {
        const XForm = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        XForm.setAnchorPoint(0, 0);
    }

    public static rotateBy(node: Node, rotation: number) {
        const invRot = -rotation;
        node.angle += invRot;
    }

    public static rectIntersectsRotatedRect(playerRect: Rect, objRect: Rect, objRotation: number): boolean {
        const cos = Math.cos(objRotation), sin = Math.sin(objRotation);

        const ax = playerRect.x + playerRect.width  * 0.5;
        const ay = playerRect.y + playerRect.height * 0.5;
        const bx = objRect.x   + objRect.width      * 0.5;
        const by = objRect.y   + objRect.height      * 0.5;

        const aHW = playerRect.width  * 0.5, aHH = playerRect.height * 0.5;
        const bHW = objRect.width     * 0.5, bHH = objRect.height    * 0.5;

        const axes = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: cos, y: sin },
            { x: -sin, y: cos },
        ];

        const dx = bx - ax, dy = by - ay;

        for (const axis of axes) {
            const projA = Math.abs(aHW * axis.x) + Math.abs(aHH * axis.y);
            const projB = Math.abs(bHW * (cos * axis.x + sin * axis.y)) +
                        Math.abs(bHH * (-sin * axis.x + cos * axis.y));

            const dist = Math.abs(dx * axis.x + dy * axis.y);

            if (dist > projA + projB) return false;
        }

        return true;
    }

    public static isColliding(playerRect: Rect, objectRect: Rect, objectRot: number): boolean {

        if (objectRot % 90 === 0) {
            return playerRect.intersects(objectRect);
        }

        return AD.rectIntersectsRotatedRect(playerRect, objectRect, objectRot);
    }
}


