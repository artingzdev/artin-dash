import { _decorator, BoxCollider2D, Collider, color, Color, Component, ERigidBody2DType, Node, ParticleSystem2D, RigidBody2D, Size, Sprite, SpriteFrame, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
import { getCachedJson, getCachedPlist, getCachedSpriteFrameFromAtlas, setParticleBlending, setSpriteBlending, settings } from './utils';
import { AD } from './AD';
import { GameLayer, LayerManager } from './LayerManager';
import { ColorChannelManager } from './ColorChannelManager';
import { CollisionRect } from './CollisionRect';
const { ccclass } = _decorator;

export enum ObjectType {
        SOLID = 0,
        HAZARD = 2,
        
        JUMP_RING_YELLOW = 11,
        JUMP_RING_PINK = 12,
        JUMP_RING_RED = 35,
        JUMP_RING_GRAVITY = 13,

        JUMP_PAD_YELLOW = 8,
        JUMP_PAD_PINK = 9,
        JUMP_PAD_RED = 34,
        JUMP_PAD_GRAVITY = 10,
        JUMP_PAD_SPIDER = 44,

        GRAVITY_PORTAL_NORMAL = 4,
        GRAVITY_PORTAL_INVERSE = 3,
        GRAVITY_PORTAL_TOGGLE = 42
}

// this is the base class for all objects in a level, including the player
@ccclass('GameObject')
export class GameObject extends Component {

        protected initialized: boolean = false;
        protected started: boolean = false;

        // default values
        private objectID: number = 1;
        private assignedLayer: GameLayer | null = null;
        private renderParts: Array<{ node: Node; offset: Vec2 }> = [];

        protected mainSprite: Sprite = null;
        protected baseSprites: [Sprite, boolean, boolean][] = [];
        protected detailSprites: [Sprite, boolean, boolean][] = [];

        private pendingBaseColorChange: [Color, boolean] = [null, null];
        private pendingDetailColorChange: [Color, boolean] = [null, null];

        private unbindBase: (() => void) | null = null;
        private unbindDetail: (() => void) | null = null;

        private pendingFlipX: number = 0;
        private pendingFlipY: number = 0;
        private pendingRotation: number = 0;
        private pendingVisible: boolean = true;
        private pendingOpacity: number = -1;
        private pendingScale: number | null = null;
        private pendingScaleX: number | null = null;
        private pendingScaleY: number | null = null;

        private objectType: ObjectType | null = null;
        private objectParticle: ParticleSystem2D | null = null;
        private objectParticleRunning: boolean = false;
        private flipXDir: number = 1;
        private flipYDir: number = 1;

        public baseColliderSize: Size = new Size(0, 0);
        public collider: CollisionRect | null = null;

        public baseScaleX: number = 1;
        public baseScaleY: number = 1;
        public baseX: number = 0;
        public baseY: number = 0;

        private static readonly OBJECT_PARTICLE_MAP = new Map<ObjectType, [string, Color | null]>([
                [ObjectType.JUMP_PAD_YELLOW, ["bumpEffect", new Color(255, 255, 0, 255)]],
                [ObjectType.JUMP_PAD_PINK, ["bumpEffect", new Color(255, 0, 255, 255)]],
                [ObjectType.JUMP_PAD_RED, ["bumpEffect", new Color(255, 0, 0, 255)]],
                [ObjectType.JUMP_RING_YELLOW, ["ringEffect", new Color(255, 255, 0, 255)]],
                [ObjectType.JUMP_RING_PINK, ["ringEffect", new Color(255, 0, 255, 255)]],
                [ObjectType.JUMP_RING_RED, ["ringEffect", new Color(255, 0, 0, 255)]],
                [ObjectType.GRAVITY_PORTAL_NORMAL, ["portalEffect01", null]],
                [ObjectType.GRAVITY_PORTAL_INVERSE, ["portalEffect02", null]]
        ]);

        setup(objectID: number): void {
                this.objectID = objectID;
        }

        start(): void {
                this.started = true;
                this.ensureInitialized();
        }

        protected initInternal(): void {
                const objectList = getCachedJson('objects').json as Record<string, any>;
                const object = objectList[this.objectID];

                if (!object) return;

                const baseZIndex = 1;
                const objectIsColorable = object.colorable ?? true;
                const hasBaseChannel = typeof object.default_base_color_channel === 'number' && object.default_base_color_channel >= 0;
                const hasDetailChannel = typeof object.default_detail_color_channel === 'number' && object.default_detail_color_channel >= 0;
                const renderEntries: Array<{ order: number; z: number; create: () => void }> = [
                        {
                                order: 0,
                                z: baseZIndex,
                                create: () => {
                                        const baseFrame = getCachedSpriteFrameFromAtlas(object.spritesheet, object.frame);
                                        this.createRenderPart(baseFrame, object.spritesheet, baseZIndex, false, Vec2.ZERO, false, false, object.color_layer, hasBaseChannel, hasDetailChannel, objectIsColorable);
                                }
                        }
                ];

                // create children sprites if they exist
                if (object.children !== undefined && object.children !== null) {
                        for (let i = 0; i < object.children.length; i++) {
                                const child = object.children[i];

                                renderEntries.push({
                                        order: i + 1,
                                        z: child.z ?? 0,
                                        create: () => {
                                                let atlasName = object.spritesheet;
                                                if (child.isglow) atlasName = 'GJ_GameSheetGlow-uhd';
                                                const frameName = child.frame;
                                                const childFrame = getCachedSpriteFrameFromAtlas(atlasName, frameName);
                                                const childOffset = new Vec2(child.x ?? 0, child.y ?? 0);
                                                const childIsColorable = child.colorable != undefined
                                                        ? child.colorable
                                                        : child.isglow == true
                                                                ? false
                                                                : objectIsColorable
                                                const childNode = this.createRenderPart(childFrame, atlasName, child.z ?? 0, !!child.isglow, childOffset, true, !!child.isglow, child.color_layer, hasBaseChannel, hasDetailChannel, childIsColorable);
                                                const childXForm = childNode.getComponent(UITransform)!;

                                                // child properties
                                                if (child.anchor_x !== undefined && child.anchor_y !== undefined) {
                                                        childXForm.setAnchorPoint(child.anchor_x + 0.5, child.anchor_y + 0.5);
                                                }
                                                if (child.flip_x) AD.flipX(childNode);
                                                if (child.flip_y) AD.flipY(childNode);
                                                if (child.rot) childNode.setRotation(child.rot);

                                                // extra glow only properties
                                                if (child.isglow) {
                                                        childNode.getComponent(Sprite).color.set(255, 255, 255, 130);
                                                        setSpriteBlending(childNode.getComponent(Sprite), true);
                                                }
                                                else {
                                                        // fallback color
                                                        if (!childIsColorable) {
                                                                const fb = ColorChannelManager.instance.getChannel(child.color_channel);
                                                                const childNodeSprite = childNode.getComponent(Sprite);
                                                                if (childNodeSprite && fb) {
                                                                        childNodeSprite.color.set(ColorChannelManager.getColor(fb.r, fb.g, fb.b, fb.a))
                                                                        setSpriteBlending(childNodeSprite, fb.blending);
                                                                }
                                                        }                         
                                                }
                                        }
                                });
                        }
                }

                this.objectType = object.object_type as ObjectType;
                this.tryCreateObjectParticle();

                renderEntries.sort((a, b) => a.z - b.z || a.order - b.order);
                for (let i = 0; i < renderEntries.length; i++) {
                        renderEntries[i].create();
                }

                this.syncRenderParts();
                this.applyPendingTransforms();
                this.baseX = this.node.position.x;
                this.baseY = this.node.position.y;

                if (!this.pendingVisible) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                this.renderParts[i].node.active = false;
                        }
                }

                if (this.pendingOpacity != -1) {
                        this.setOpacity(this.pendingOpacity);
                }

                if (!objectIsColorable && object.color_channel) {
                        const fb = ColorChannelManager.instance.getChannel(object.color_channel); // create a fallback channel
                        this.unbindBase = this.bindToChannelBase(object.color_channel, ColorChannelManager.getColor(fb.r, fb.g, fb.b, fb.a));
                }
                else {
                        if (hasBaseChannel) {
                                this.unbindBase = objectIsColorable
                                        ? this.bindToChannelBase(object.default_base_color_channel)
                                        : this.bindToChannelBase(object.color_channel);
                        }
                        if (hasDetailChannel) {
                                this.unbindDetail = this.bindToChannelDetail(object.default_detail_color_channel);
                        }
                }
                
                // run color change again if called when array wasn't ready
                if (this.pendingBaseColorChange[0] != null) {
                        this.changeBaseColor(
                                this.pendingBaseColorChange[0],
                                this.pendingBaseColorChange[1]
                        );
                }
                if (this.pendingDetailColorChange[0] != null) {
                        this.changeDetailColor(
                                this.pendingDetailColorChange[0],
                                this.pendingDetailColorChange[1]
                        );
                }
        }

        protected bindToChannelBase(id: number, fallbackColor: Color = null): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    const channel = ColorChannelManager.instance.getChannel(id);
                    this.changeBaseColor(color, channel?.blending ?? false, fallbackColor);
            });
        }

        protected bindToChannelDetail(id: number, fallbackColor: Color = null): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    const channel = ColorChannelManager.instance.getChannel(id);
                    this.changeDetailColor(color, channel?.blending ?? false, fallbackColor);
            });
        }

        public changeBaseColor(color: Color, blending: boolean = false, fallbackColor: Color = null): void {
                const baseSprites = this.baseSprites;
                if (!baseSprites) return;
                if (baseSprites.length < 1) {
                        this.pendingBaseColorChange = [color, blending];
                        return;
                }

                for (let i = 0; i < baseSprites.length; i++) {
                        const sprite = baseSprites[i][0];
                        const isGlow = baseSprites[i][1];
                        const isColorable = baseSprites[i][2];

                        if (!isColorable) {
                                if (fallbackColor) {
                                        sprite.color = fallbackColor;
                                }
                                continue;
                        }

                        if (!sprite.color.equals(color)) {
                                if (!isGlow) {
                                        sprite.color = color;
                                        setSpriteBlending(sprite, blending);                                        
                                }
                                else {
                                        sprite.color.set(color.r, color.g, color.b, 130);
                                        //sprite.color = new Color(color.r, color.g, color.b, 130);
                                }                                
                        }

                }
                this.pendingBaseColorChange = [null, null];
        }

        public changeDetailColor(color: Color, blending: boolean = false, fallbackColor: Color = null): void {
                const detailSprites = this.detailSprites;
                if (!detailSprites) return;
                if (detailSprites.length < 1) {
                        this.pendingDetailColorChange = [color, blending];
                        return;
                }

                for (let i = 0; i < detailSprites.length; i++) {
                        const sprite = detailSprites[i][0];
                        const isGlow = detailSprites[i][1];
                        const isColorable = detailSprites[i][2];

                        if (!isColorable) {
                                if (fallbackColor) {
                                        sprite.color = fallbackColor;
                                }
                                continue;
                        }

                        if (!sprite.color.equals(color) && !isGlow) {
                                sprite.color = color;
                                setSpriteBlending(sprite, blending);
                        }
                }
                this.pendingDetailColorChange = [null, null];
        }

        private tryCreateObjectParticle(): void {
                if (this.objectParticle || this.objectType == null) return;

                const particleDef = GameObject.OBJECT_PARTICLE_MAP.get(this.objectType);
                if (!particleDef) return;

                const [plistName, particleColor] = particleDef;

                const fxNode = new Node('object-particle');
                this.node.addChild(fxNode);

                // object particle in the file has positionType = GROUPED
                const fx = fxNode.addComponent(ParticleSystem2D);
                fx.file = getCachedPlist(plistName);

                if (particleColor != null) {
                        const sc = fx.startColor;
                        sc.set(particleColor);
                        fx.startColor = sc;

                        const ec = fx.endColor;
                        ec.set(particleColor);
                        fx.endColor = ec;                        
                }

                fx.stopSystem();
                this.objectParticle = fx;
                this.objectParticleRunning = false;
                
                setParticleBlending(fx, true);
        }

        static createWithKey(objectID: number): GameObject {
                // exit if invalid object ID
                if (objectID % 1 != 0 || objectID < 0) return; 

                const node = new Node(this.name);
                const obj = node.addComponent(this) as GameObject;
                obj.setup(objectID);

                return obj;
        }

        setPosition(x: number, y: number, affectBasePos: boolean = true): void {
                this.node.setPosition(x, y);
                if (affectBasePos) {
                        this.baseX = x;
                        this.baseY = y;
                }
                this.syncRenderParts();
        }

        setPositionX(x: number, affectBaseX: boolean = true): void {
                this.node.setPosition(x, this.node.position.y);
                if (affectBaseX) this.baseX = x;
                this.syncRenderParts();
        }

        setPositionY(y: number, affectBaseY: boolean = true): void {
                this.node.setPosition(this.node.position.x, y);
                if (affectBaseY) this.baseY = y;
                this.syncRenderParts();
        }

        setRotation(degrees: number): void {
                this.node.angle = -degrees;
                if (this.renderParts.length > 0) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                AD.rotateBy(this.renderParts[i].node, degrees);
                        }
                        const fx = this.objectParticle;
                        if (fx && degrees == 180) {
                                fx.angle -= 180;
                        }
                } else {
                        this.pendingRotation = degrees;
                }
        }

        setOpacity(opacity: number): void {
                const oComp = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
                oComp.opacity = opacity;
                if (this.renderParts.length > 0) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                const node = this.renderParts[i].node;
                                const nodeOComp = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
                                nodeOComp.opacity = opacity;
                        }
                        this.pendingOpacity = -1;
                } else {
                        this.pendingOpacity = opacity;
                }
        }

        getRotation(): number {
                return -this.node.angle;
        }

        getPosition() {
                return this.node.position;
        }

        getPositionX(): number {
                return this.node.position.x;
        }

        getPositionY(): number {
                return this.node.position.y;
        }

        getScaleX(): number {
                if (this.renderParts.length < 1) return 1;
                return this.renderParts[0].node.scale.x * settings.contentScaleFactor;
        }

        getScaleY(): number {
                if (this.renderParts.length < 1) return 1;
                return this.renderParts[0].node.scale.y * settings.contentScaleFactor;
        }

        setScale(scale: number, visualOnly: boolean = false, affectBaseScale: boolean = true): void {
                AD.setScale(this.node, scale, this.flipXDir, this.flipYDir);
                if (this.renderParts.length > 0) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                AD.setScale(this.renderParts[i].node, scale, this.flipXDir, this.flipYDir);
                        }
                        if (!visualOnly && this.collider && this.baseColliderSize.width && this.baseColliderSize.height) {
                                this.collider.w = this.baseColliderSize.width * scale;
                                this.collider.h = this.baseColliderSize.height * scale;
                        }
                        this.pendingScale = null;
                        if (affectBaseScale) {
                                this.baseScaleX = scale;
                                this.baseScaleY = scale;
                        }
                } else {
                        this.pendingScale = scale;
                }
        }

        setScaleXY(scaleX: number, scaleY: number, visualOnly: boolean = false, affectBaseScale: boolean = true): void {
                AD.setScaleXY(this.node, scaleX, scaleY, this.flipXDir, this.flipYDir);
                if (this.renderParts.length > 0) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                AD.setScaleXY(this.renderParts[i].node, scaleX, scaleY, this.flipXDir, this.flipYDir);
                        }
                        if (!visualOnly && this.collider && this.baseColliderSize.width && this.baseColliderSize.height) {
                                this.collider.w = this.baseColliderSize.width * scaleX;
                                this.collider.h = this.baseColliderSize.height * scaleY;
                        }
                        this.pendingScaleX = null;
                        this.pendingScaleY = null;
                        if (affectBaseScale) {
                                this.baseScaleX = scaleX;
                                this.baseScaleY = scaleY;
                        }
                } else {
                        this.pendingScaleX = scaleX;
                        this.pendingScaleY = scaleY;
                }
        }

        flipX(): void {
                this.node.setScale(this.node.scale.x * -1, this.node.scale.y);
                if (this.renderParts.length > 0) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                AD.flipX(this.renderParts[i].node);
                        }
                        this.flipXDir = this.flipXDir == 1 ? -1 : 1;
                } else {
                        this.pendingFlipX ^= 1;
                }
        }

        flipY(): void {
                this.node.setScale(this.node.scale.x, this.node.scale.y * -1);
                if (this.renderParts.length > 0) {
                        for (let i = 0; i < this.renderParts.length; i++) {
                                AD.flipY(this.renderParts[i].node);
                        }
                        const fx = this.objectParticle;
                        if (fx) fx.angle -= 180;

                        this.flipYDir = this.flipYDir == 1 ? -1 : 1;
                } else {
                        this.pendingFlipY ^= 1;
                }
        }

        private applyPendingTransforms(): void {
                if (this.pendingFlipX) {
                        this.flipX();
                        this.pendingFlipX = 0;
                }
                if (this.pendingFlipY) {
                        this.flipY();
                        this.pendingFlipY = 0;
                }
                if (this.pendingRotation != 0) {
                        this.setRotation(this.pendingRotation);
                        this.pendingRotation = 0;
                }
                if (this.pendingScale != null) {
                        this.setScale(this.pendingScale);
                        this.pendingScale = null;
                }
                if (this.pendingScaleX != null && this.pendingScaleY != null) {
                        this.setScaleXY(this.pendingScaleX, this.pendingScaleY);
                        this.pendingScaleX = null;
                        this.pendingScaleY = null;
                }
        }

        addToZLayer(layerID: number): void {
                let layer = GameLayer.T1;
                switch(layerID) {
                        case -5:
                                layer = GameLayer.B5; break;
                        case -3:
                                layer = GameLayer.B4; break;
                        case -1:
                                layer = GameLayer.B3; break;
                        case 1:
                                layer = GameLayer.B2; break;
                        case 3:
                                layer = GameLayer.B1; break;
                        case 5:
                                layer = GameLayer.T1; break;
                        case 7:
                                layer = GameLayer.T2; break;
                        case 9:
                                layer = GameLayer.T3; break;
                        case 11:
                                layer = GameLayer.T4; break;
                        case 100:
                                layer = GameLayer.PB; break;
                }
                this.assignedLayer = layer;
                LayerManager.addToLayer(this.node, layer);
                this.ensureInitialized();
        }

        setVisible(visible: boolean): void {
                const wasVisible = this.pendingVisible;
                this.pendingVisible = visible;
                for (let i = 0; i < this.renderParts.length; i++) {
                        this.renderParts[i].node.active = visible;
                }
                const fx = this.objectParticle;
                if (!fx) return;
                fx.node.active = visible;
                if (!visible) {
                        if (this.objectParticleRunning) {
                        fx.stopSystem();
                        this.objectParticleRunning = false;
                        }
                        return;
                }
                if (!wasVisible && !this.objectParticleRunning) {
                        fx.resetSystem();
                        this.objectParticleRunning = true;
                }
        }

        protected onDestroy(): void {
                for (let i = 0; i < this.renderParts.length; i++) {
                        this.renderParts[i].node.destroy();
                }

                this.renderParts.length = 0;

                this.unbindBase?.();
                this.unbindDetail?.();

                this.objectParticle = null;
                this.objectParticleRunning = false;
        }

        protected ensureInitialized(): void {
                if (this.initialized || !this.started || this.assignedLayer === null) {
                        return;
                }

                this.initInternal();
                this.initialized = true;
        }

        private createRenderPart(frame: SpriteFrame, atlasName: string, z: number, blending: boolean, offset: Vec2, isChild: boolean, isGlow: boolean, colorLayer: string, hasBaseChannel: boolean, hasDetailChannel: boolean, isColorable: boolean): Node {
                if (this.assignedLayer === null) {
                        throw new Error(`GameObject ${this.objectID} cannot render before being assigned to a layer`);
                }

                const stateKey = blending ? `${atlasName}:blend` : `${atlasName}:normal`;
                const renderLayer =
                        isChild && /portal_\d{2}_back/.test(frame.name ?? '')
                                ? GameLayer.PB
                                : this.assignedLayer;
                const bucket = LayerManager.getOrCreateRenderBucket(renderLayer, z, stateKey);
                const partNode = AD.createSprite(bucket, 'object-sprite', frame);
                const partNodeSprite = partNode.getComponent(Sprite);

                const isBaseLayer = colorLayer == "1" || (colorLayer == null && hasBaseChannel && !hasDetailChannel);

                if (isChild) {
                        if (isGlow || isBaseLayer) {
                                this.baseSprites.push([partNodeSprite, true, isColorable]);
                        }
                        else {
                                this.detailSprites.push([partNodeSprite, false, isColorable]);
                        }
                }
                else if (isBaseLayer) {
                        this.mainSprite = partNodeSprite;
                        this.baseSprites.push([partNodeSprite, false, isColorable]);
                }
                else {
                        this.mainSprite = partNodeSprite;
                        this.detailSprites.push([partNodeSprite, false, isColorable]);
                }

                this.renderParts.push({
                        node: partNode,
                        offset: offset.clone(),
                });

                return partNode;
        }

        private syncRenderParts(): void {
                const bx = this.node.position.x;
                const by = this.node.position.y;

                for (let i = 0; i < this.renderParts.length; i++) {
                        const renderPart = this.renderParts[i];
                        renderPart.node.setPosition(
                                bx + renderPart.offset.x,
                                by + renderPart.offset.y
                        );
                }
        }
}
