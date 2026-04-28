import { _decorator, BoxCollider2D, clamp, Color, EventKeyboard, EventMouse, EventTouch, find, Game, Graphics, Input, input, KeyCode, MotionStreak, Node, ParticleAsset, ParticleSystem2D, Rect, Size, Sprite, SpriteFrame, sys, tween, UIOpacity, Vec2, view } from 'cc';
import { GameObject, ObjectType } from './GameObject';
import { GameLayer, LayerManager } from './LayerManager';
import { drawPolygon, getCachedPlist, getCachedSpriteFrameFromAtlas, setGraphicsBlending, settings, slerp2D } from './utils';
import { AD } from './AD';
import { CameraController } from './CameraController';
import { ColorChannelManager } from './ColorChannelManager';
import { LevelManager } from './LevelManager';
import { TriggerManager } from './TriggerManager';
import { GravityEffectSprite } from './GravityEffectSprite';
import { PlayerStreak } from './PlayerStreak';
import { CollisionRect } from './CollisionRect';
import { PlayLayer } from './PlayLayer';
const { ccclass } = _decorator;

export enum Gamemode {
        CUBE,
        SHIP,
        BALL,
        BIRD,
        DART,
        ROBOT,
        SPIDER,
        SWING
}

const enum CollisionSide {
    NONE = 0,
    BOTTOM = 1,
    TOP = 2,
    LEFT = 3,
    RIGHT = 4,
}

const enum RingType {
        YELLOW,
        PINK,
        RED,
        GREEN,
        GRAVITY,
        DROP,
        DASH,
        DASH_GRAVITY,
        SPIDER
}

const enum PadType {
        YELLOW,
        PINK,
        RED,
        GRAVITY,
        SPIDER
}

@ccclass('PlayerObject')
export class PlayerObject extends GameObject {
        private unbindPrimary: (() => void) | null = null;
        private unbindSecondary: (() => void) | null = null;
        private unbindGlow: (() => void) | null = null;
        private particleColor: Color = new Color(255, 255, 255, 255);

        // **PlayerObject members**---------------------
        // current icons
        public cubeID: number = 1;
        public shipID: number = 1;
        public ballID: number = 1;
        public birdID: number = 1;
        public dartID: number = 1;
        public robotID: number = 1;
        public spiderID: number = 1;
        public swingID: number = 1;

        // player physics
        public yVelocity: number = 0; // units/sec
        public static xVelocity: number = 0; //units/sec
        //public gravity: number = 0;
        public gravity: number = 0; // units/sec^2
        public jumpVelocity: number = 0; // units/sec
        public playerSpeed: number = 0.9; // mirrors m_playerSpeed
        public speedMultiplier: number = 5.77000189;
        private rotationDir: number = 1;

        // player state
        public static canStartPlaying = false;
        public isUpsideDown: boolean = false;
        public isMini: boolean = false;
        public hasGlow: boolean = true;
        public isGrounded: boolean = false;
        public jumpHeld: boolean = false;
        public attemptCount: number = 1
        public dragEffectRunning: boolean = false;
        public hasLanded: boolean = false;
        public isFixedMode: boolean = false; // every gamemode except robot and cube (the ones with ceilings)
        public isRespawning: boolean = false;
        public static isDead: boolean = false;
        private canRingJump: boolean = true;
        private shouldApplyTerminalVel: boolean = true; // boolean that controls whether or not terminal velocity should be applied
        private gravityEffectsPlaying: number = 0;
        private playerStreakActive: boolean = false;
        private canDieFromHitHead: boolean = true;

        // physics constants & state
        private accumulator: number = 0;
        private static readonly TPS: number = 240;
        private readonly FIXED_DT: number = 1/PlayerObject.TPS;
        private readonly MAX_PHYSICS_STEPS: number = 8;
        
        // gamemode
        public gamemode: Gamemode = Gamemode.CUBE;

        // other
        public dragEffect: ParticleSystem2D = null;
        private playerParticles: ParticleSystem2D[] = [];
        private spawnBlinkDuration: number = 0.4; // seconds
        private spawnBlinkCount: number = 4;
        private blinkTimer: number | null = null;
        private respawnDelay: number = 1; // seconds
        private maxGravityEffects: number = 4;

        // hitbox/collision related
        public hitboxOuter: Size = new Size(30, 30);
        public hitboxInner: Size = new Size(9, 9);

        private readonly collisionPlayerRectOuter: Rect = new Rect();
        private readonly collisionPlayerRectInner: Rect = new Rect();
        private readonly collisionBlockRect: Rect = new Rect();
        private currentRingOverlaps: Set<CollisionRect> = new Set();
        private prevRingOverlaps: Set<CollisionRect> = new Set();

        // delta position tracking
        private lastX: number = 0;
        private lastY: number = 15;
        public static deltaPos: Vec2 = new Vec2(0, 0);

        // visual branches
        private visualRoot: Node = null;
        private particleRoot: Node = null;
        private deathEffectRoot: Node = null;

        // gamemode nodes
        public cubePrimaryNode: Node = null;
        public cubeSecondaryNode: Node = null;
        public cubeGlowNode: Node = null;

        // game layer nodes
        public static t1Node: Node | null = null;

        onLoad() {
                PlayerObject.t1Node = find('WorldCanvas/RenderLayers/T1');
        }

        private static resolveT1Layer(): Node | null {
                const cached = this.t1Node;
                if (cached && cached.isValid) {
                        return cached;
                }
                const found = find('WorldCanvas/RenderLayers/T1');
                this.t1Node = found ?? null;
                return this.t1Node;
        }

        ensureInitialized(): void {
                if (this.initialized || !this.started) {
                        return;
                }

                this.initInternal();
                this.initialized = true;
                
        }

        start(): void {
                this.started = true;
                this.ensureInitialized();
        }

        onEnable(): void {
                input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
                input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
                if (sys.isMobile) {
                        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
                        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
                        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
                } else {
                        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
                        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
                }
        }

        onDisable(): void {
                input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
                input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
                if (sys.isMobile) {
                        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
                        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
                        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
                } else {
                        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
                        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
                }
        }

        //----------------------------------------------------------------------------------
        // input handling

        private onKeyDown(event: EventKeyboard): void {
                if (
                        event.keyCode === KeyCode.SPACE ||
                        event.keyCode === KeyCode.ARROW_UP ||
                        event.keyCode === KeyCode.KEY_W
                ) {
                        this.jumpHeld = true;
                        this.jump();
                }
                else if (event.keyCode == KeyCode.KEY_R && !PlayerObject.isDead) {
                        this.respawnPlayer();
                        this.jumpHeld = false;
                        this.canRingJump = true;
                }
        }

        private onKeyUp(event: EventKeyboard): void {
                if (
                        event.keyCode === KeyCode.SPACE ||
                        event.keyCode === KeyCode.ARROW_UP ||
                        event.keyCode === KeyCode.KEY_W
                ) {
                        this.jumpHeld = false;
                        this.canRingJump = true;
                }
        }

        private onTouchStart(_event: EventTouch): void {
                this.jumpHeld = true;
                this.jump();
        }

        private onTouchEnd(_event: EventTouch): void {
                this.jumpHeld = false;
                this.canRingJump = true;
        }
        
        private onMouseDown(event: EventMouse): void {
                if (event.getButton() == EventMouse.BUTTON_LEFT) {
                        this.jumpHeld = true;
                        this.jump();
                }
        }

        private onMouseUp(event: EventMouse): void {
                if (event.getButton() == EventMouse.BUTTON_LEFT) {
                        this.jumpHeld = false;
                        this.canRingJump = true;
                }
        }

        private handleInput(): void {
                this.jump();
        }
        //----------------------------------------------------------------------------------


        protected initInternal(): void {
                // initialize some variables
                this.lastX = this.node.position.x;
                this.lastY = this.node.position.y;

                // setup player particles
                this.particleRoot = new Node("particle-root");
                this.node.addChild(this.particleRoot);
                
                const dragEffectNode = new Node("drag-effect");
                this.dragEffect = dragEffectNode.addComponent(ParticleSystem2D);
                this.dragEffect.file = getCachedPlist("dragEffect");
                dragEffectNode.setPosition(-10, -13);
                this.particleRoot.addChild(dragEffectNode);

                // setup visual root
                this.visualRoot = new Node("visual-root");
                this.visualRoot.addComponent(UIOpacity);
                this.node.addChild(this.visualRoot);

                // setup death effect root
                this.deathEffectRoot = new Node("death-effect-root");
                this.node.addChild(this.deathEffectRoot);
                

                // CUBE MODE
                const formattedCubeID = this.cubeID.toString().padStart(2, '0');
                const cubeSecondaryFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeID}-uhd`, `player_${formattedCubeID}_2_001`);
                this.cubeSecondaryNode = AD.createSprite(this.visualRoot, "player-sprite", cubeSecondaryFrame);

                const cubePrimaryFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeID}-uhd`, `player_${formattedCubeID}_001`);
                this.cubePrimaryNode = AD.createSprite(this.visualRoot, "player-sprite", cubePrimaryFrame);

                const cubeGlowFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeID}-uhd`, `player_${formattedCubeID}_glow_001`);
                this.cubeGlowNode = AD.createSprite(this.visualRoot, "player-sprite", cubeGlowFrame);  

                this.cubeGlowNode.active = this.hasGlow; // disable if player glow is turned off

                // const cubeExtraFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeID}-uhd`, `player_${formattedCubeID}_extra_001`);
                // const cubeExtraNode = ADNode.createSprite(this.visualRoot, "player-sprite", cubeExtraFrame);

                // SHIP MODE (COMING SOONNNN)


                // bind colors
                this.unbindPrimary = this.bindToChannelPrimary(ColorChannelManager.P1);
                this.unbindSecondary = this.bindToChannelSecondary(ColorChannelManager.P2);
                this.unbindGlow = this.bindToChannelGlow(ColorChannelManager.PGLOW);
        }

        protected bindToChannelPrimary(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    this.changePrimaryColor(color);
            });
        }

        protected bindToChannelSecondary(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    this.changeSecondaryColor(color);
            });
        }

        protected bindToChannelGlow(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    this.changeGlowColor(color);
            });
        }

        public changePrimaryColor(color: Color): void {
                const cubePrimarySprite = this.cubePrimaryNode.getComponent(Sprite)!;
                
                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

                if (cubePrimarySprite) cubePrimarySprite.color = fixedColor;
                this.particleColor = ColorChannelManager.getColor(color.r, color.g, color.b, color.a);
                this.applyColorToPlayerParticles(this.particleColor);
        }

        public changeSecondaryColor(color: Color): void {
                const cubeSecondarySprite = this.cubeSecondaryNode.getComponent(Sprite)!;

                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

                if (cubeSecondarySprite) cubeSecondarySprite.color = fixedColor;
        }

        public changeGlowColor(color: Color): void {
                const cubeGlowSprite = this.cubeGlowNode.getComponent(Sprite)!;

                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

                if (cubeGlowSprite) cubeGlowSprite.color = fixedColor;
        }

        static create(): PlayerObject {

                const node = new Node(this.name);
                const obj = node.addComponent(this) as PlayerObject;
                LayerManager.addToLayer(node, GameLayer.P);

                return obj;
        }

        public enableGlow(): void {
                this.cubeGlowNode.active = true;
                this.hasGlow = true;
        }

        public disableGlow(): void {
                this.cubeGlowNode.active = false;
                this.hasGlow = false;
        }

        private updateTimeMod(): void {
                const flipDir = this.isUpsideDown ? -1 : 1;
                switch(this.playerSpeed) {
                        case 0.7:
                                this.jumpVelocity = 573.482;
                                this.gravity = 2765.36 * flipDir;
                                PlayerObject.xVelocity = 251.1601;
                                break;
                        case 0.9:
                                this.jumpVelocity = 603.72;
                                this.gravity = 2765.36 * flipDir;
                                PlayerObject.xVelocity = 311.5801;
                                break;
                        case 1.1:
                                this.jumpVelocity = 616.682;
                                this.gravity = 2765.36 * flipDir;
                                PlayerObject.xVelocity = 387.4201;
                                break;
                        case 1.3:
                                this.jumpVelocity = 606.422;
                                this.gravity = 2765.36 * flipDir;
                                PlayerObject.xVelocity = 468.0001;
                                break;
                        case 1.6:
                                this.jumpVelocity = 606.422;
                                this.gravity = 2765.36 * flipDir;
                                PlayerObject.xVelocity = 576.0002;
                                break;
                        default:
                                this.jumpVelocity = 603.722;
                                this.gravity = 2765.36 * flipDir;
                                PlayerObject.xVelocity = 311.5801;
                                break;
                }
        }

        private incrementRotation(rotation: number): void {
                this.setVisualRotation(this.getVisualRotation() + rotation);
        }

        private convertToClosestRotation(currentRotation: number, targetRotation: number): number {
                if (this.gamemode !== Gamemode.CUBE) return targetRotation;

                const currentMod = Math.trunc(currentRotation) % 360;

                // Find the nearest multiple of 90 below and above currentMod
                const lo = Math.floor(currentMod / 90) * 90;
                const hi = lo + 90;

                // Return whichever is closer
                return (currentMod - lo) <= (hi - currentMod) ? lo : hi;
        }

        private updateRotationSnap(): void {
                const interpFactor = 0.3;

                const rotationDegrees = this.getVisualRotation();
                const targetRot = this.convertToClosestRotation(
                        rotationDegrees,
                        Math.round(rotationDegrees / 90) * 90
                )
                let rotSpeed = this.playerSpeed * 0.175;
                const gamemode = this.gamemode;

                if (gamemode == Gamemode.SHIP) {
                        rotSpeed *= 0.5;
                }
                else if (
                        gamemode != Gamemode.BIRD &&
                        gamemode != Gamemode.DART &&
                        gamemode != Gamemode.SWING &&
                        gamemode != Gamemode.BALL &&
                        this.isGrounded
                ) {
                        rotSpeed *= 3.0;
                }

                const t = (rotSpeed * interpFactor <= interpFactor) ? interpFactor * interpFactor : interpFactor;

                const slerpResult = slerp2D(
                        rotationDegrees * 0.017453292,   // deg → rad
                        targetRot        * 0.017453292,   // deg → rad
                        t
                ) * 57.29578; // back to deg

                this.setVisualRotation(slerpResult);
        }

        private updateRotationAirborne(dt: number): void {
                // continuous cube rotation
                const gamemode = this.gamemode;
                const isCubeMode = gamemode == Gamemode.CUBE;
                const shouldRotate = isCubeMode && !this.isGrounded;

                if (shouldRotate) {
                        const baseRotationSpeed = 180 * this.rotationDir;
                        const sizeFactor = this.isMini ? 0.33333334 : 0.43333334;
                        const finalSpeed = baseRotationSpeed / sizeFactor;

                        this.incrementRotation(finalSpeed * dt);
                }
        }

        private setYVelocity(yVelocity: number): void {
                this.yVelocity = yVelocity;
        }

        protected setVisualRotation(degrees: number): void {
                this.visualRoot.angle = -degrees;
        }

        protected getVisualRotation(): number {
                return -this.visualRoot.angle;
        }

        private clampTerminalVelocity(): void {
                if (!this.shouldApplyTerminalVel) return;

                let terminal = 810;
                const gamemode = this.gamemode;

                switch (gamemode) {
                        case Gamemode.SHIP:
                                terminal = 345.6; break;
                        case Gamemode.BIRD:
                                terminal = 345.6; break;
                }

                const clamped = clamp(this.yVelocity, -terminal, terminal);
                this.setYVelocity(clamped);
        }

        /**
         * Get which side of the player collided with a given Rect.
         * @param the player Rect. 
         * @param the object to test collision against. 
         * @returns a string indicating which side of the player had the smallest collision.
         */
        private getCollisionSide(player: Rect, block: Rect): number {
                // Find how much they overlap on each axis
                const overlapLeft   = (player.xMax) - (block.xMin);
                const overlapRight  = (block.xMax)  - (player.xMin);
                const overlapTop    = (block.yMax)  - (player.yMin);
                const overlapBottom = (player.yMax) - (block.yMin);

                // The smallest overlap is the axis/side the collision came from
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                const epsilon = 0.001; // small margin of error for floating point precision issues
                if (Math.abs(minOverlap - overlapLeft)   < epsilon) return CollisionSide.RIGHT;
                if (Math.abs(minOverlap - overlapRight)  < epsilon) return CollisionSide.LEFT;
                if (Math.abs(minOverlap - overlapTop)    < epsilon) return CollisionSide.BOTTOM;
                if (Math.abs(minOverlap - overlapBottom) < epsilon) return CollisionSide.TOP;
                return CollisionSide.NONE;
        }

        private getActiveCollision(): number {
                if (PlayerObject.isDead) return;
                const nearbyObjects = LevelManager.getNearbySectionObjects(this.node.position.x);

                // loop through nearby objects and check for a collision
                if (nearbyObjects.length === 0) return CollisionSide.NONE;

                const px = this.node.position.x;
                const py = this.node.position.y;

                const halfWOuter = this.hitboxOuter.width * 0.5;
                const halfHOuter = this.hitboxOuter.height * 0.5;
                const playerRectOuter = this.collisionPlayerRectOuter;
                playerRectOuter.x = px - halfWOuter;
                playerRectOuter.y = py - halfHOuter;
                playerRectOuter.width = this.hitboxOuter.width;
                playerRectOuter.height = this.hitboxOuter.height;

                const halfWInner = this.hitboxInner.width * 0.5;
                const halfHInner = this.hitboxInner.height * 0.5;
                const playerRectInner = this.collisionPlayerRectInner;
                playerRectInner.x = px - halfWInner;
                playerRectInner.y = py - halfHInner;
                playerRectInner.width = this.hitboxInner.width;
                playerRectInner.height = this.hitboxInner.height;

                const objRect = this.collisionBlockRect;

                let solidCollisionResult: number = CollisionSide.NONE;

                this.currentRingOverlaps.clear()

                for (let i = 0; i < nearbyObjects.length; i++) {
                        const isMovingDown = this.yVelocity <=0;
                        const isMovingUp = this.yVelocity >=0;

                        const object = nearbyObjects[i];

                        objRect.x = object.x - object.w * 0.5;
                        objRect.y = object.y - object.h * 0.5;
                        objRect.width = object.w;
                        objRect.height = object.h;

                        switch(object.type) {
                                case ObjectType.SOLID:

                                        const isCollidingOuter: boolean = playerRectOuter.intersects(objRect);
                                        const isCollidingInner: boolean = playerRectInner.intersects(objRect);

                                        let collisionSide: CollisionSide;

                                        if (isCollidingInner) { // inner player hitbox
                                                
                                                collisionSide = this.getCollisionSide(playerRectInner, objRect);

                                                switch(collisionSide) {
                                                        case CollisionSide.BOTTOM:
                                                                if (this.canDieFromHitHead) this.destroyPlayer();
                                                                solidCollisionResult = CollisionSide.BOTTOM;
                                                                break;
                                                        case CollisionSide.TOP:
                                                                if (this.canDieFromHitHead) this.destroyPlayer();
                                                                solidCollisionResult = CollisionSide.TOP;
                                                                break;
                                                        case CollisionSide.RIGHT:
                                                                this.destroyPlayer();
                                                                solidCollisionResult = CollisionSide.RIGHT;
                                                                break;
                                                }
                                                break;
                                        }
                                        else if (isCollidingOuter) { // outer player hitbox
                                                collisionSide = this.getCollisionSide(playerRectOuter, objRect);
                                                switch(collisionSide) {
                                                        case CollisionSide.BOTTOM: 
                                                                if (this.isUpsideDown || !isMovingDown) break;

                                                                this.onLanded(objRect.yMax + halfHOuter);
                                                                solidCollisionResult = CollisionSide.BOTTOM;
                                                                break;
                                                        case CollisionSide.TOP:
                                                                if (!this.isUpsideDown || !isMovingUp) break;

                                                                this.onLanded(objRect.yMin - halfHOuter);
                                                                solidCollisionResult = CollisionSide.TOP;
                                                                break;
                                                        case CollisionSide.RIGHT:
                                                                // snap the player to the block if close enough
                                                                if (!this.isGrounded) {
                                                                        if (!this.isUpsideDown && isMovingDown) {
                                                                                if (playerRectInner.yMin >= objRect.yMax) {
                                                                                        this.onLanded(objRect.yMax + halfHOuter);
                                                                                        solidCollisionResult = CollisionSide.BOTTOM;
                                                                                }
                                                                        }
                                                                        else if (this.isUpsideDown && isMovingUp) {
                                                                                if (playerRectInner.yMax <= objRect.yMin) {
                                                                                        this.onLanded(objRect.yMin - halfHOuter);
                                                                                        solidCollisionResult = CollisionSide.BOTTOM;
                                                                                }
                                                                        }                                                                        
                                                                }
                                                                break;
                                                }
                                        }
                                        break; 
                                        
                                case ObjectType.HAZARD:
                                        if (!AD.isColliding(playerRectOuter, objRect, object.rotation)) break;

                                        this.destroyPlayer();
                                        break;

                                case ObjectType.JUMP_RING_YELLOW:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation)) {
                                                if (!object.activated && this.jumpHeld && this.canRingJump) {
                                                        this.ringJump(RingType.YELLOW);
                                                        object.activated = true;
                                                        this.canRingJump = false;
                                                        LevelManager.activatedObjects.push(object);

                                                        this.playRingEffect(object, object.layer, object.x, object.y, {r: 255, g: 255, b: 0});
                                                        
                                                }
                                                if (!this.prevRingOverlaps.has(object)) {
                                                        this.spawnRingHitEffect(object.layer, object.x, object.y);
                                                        
                                                }
                                                this.currentRingOverlaps.add(object);
                                        }
                                        break;

                                case ObjectType.JUMP_RING_PINK:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation)) {
                                                if (!object.activated && this.jumpHeld && this.canRingJump) {
                                                        this.ringJump(RingType.PINK);
                                                        object.activated = true;
                                                        this.canRingJump = false;
                                                        LevelManager.activatedObjects.push(object);

                                                        this.playRingEffect(object, object.layer, object.x, object.y, {r: 255, g: 0, b: 255});
                                                }
                                                if (!this.prevRingOverlaps.has(object)) {
                                                        this.spawnRingHitEffect(object.layer, object.x, object.y);
                                                        
                                                }
                                                this.currentRingOverlaps.add(object);
                                        }
                                        break;
                                
                                case ObjectType.JUMP_RING_RED:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation)) {
                                                if (!object.activated && this.jumpHeld && this.canRingJump) {
                                                        this.ringJump(RingType.RED);
                                                        object.activated = true;
                                                        this.canRingJump = false;
                                                        LevelManager.activatedObjects.push(object);

                                                        this.playRingEffect(object, object.layer, object.x, object.y, {r: 255, g: 0, b: 0});
                                                }
                                                if (!this.prevRingOverlaps.has(object)) {
                                                        this.spawnRingHitEffect(object.layer, object.x, object.y);
                                                        
                                                }
                                                this.currentRingOverlaps.add(object);
                                        }
                                        break;
                                
                                case ObjectType.JUMP_PAD_YELLOW:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation) && !object.activated) {
                                                this.padJump(PadType.YELLOW, object.layer, {x: object.x, y: object.y});
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);
                                        }
                                        break;

                                case ObjectType.JUMP_PAD_PINK:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation) && !object.activated) {
                                                this.padJump(PadType.PINK, object.layer, {x: object.x, y: object.y});
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);
                                        }
                                        break;

                                case ObjectType.JUMP_PAD_RED:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation) && !object.activated) {
                                                this.padJump(PadType.RED, object.layer, {x: object.x, y: object.y});
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);
                                        }
                                        break;

                                case ObjectType.GRAVITY_PORTAL_NORMAL:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation) && !object.activated) {
                                                this.flipGravity(false);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);

                                                this.playPortalEffect(1, object.x, object.y, {r: 0, g: 255, b: 255}, object.rotation);
                                        }
                                        break;

                                case ObjectType.GRAVITY_PORTAL_INVERSE:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation) && !object.activated) {
                                                this.flipGravity(true);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);

                                                this.playPortalEffect(1, object.x, object.y, {r: 255, g: 255, b: 0}, object.rotation);
                                        }
                                        break;

                                case ObjectType.GRAVITY_PORTAL_TOGGLE:

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation) && !object.activated) {
                                                this.flipGravity(!this.isUpsideDown);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);
                                        }
                                        break;
                        }

                }

                const prevRingCopy = this.prevRingOverlaps;
                this.prevRingOverlaps = this.currentRingOverlaps;
                this.currentRingOverlaps = prevRingCopy;

                if (solidCollisionResult === CollisionSide.NONE) {
                        this.isGrounded = false;
                }

                return solidCollisionResult;
        }

        private onLanded(snapY: number | null = null) {
                
                this.isGrounded = true;
                this.shouldApplyTerminalVel = true;
                this.setYVelocity(0);
                this.updateRotationSnap();
                this.playerStreakActive = false;
                PlayerStreak.get().setAttached(false);

                if (snapY !== null) {
                        this.setPositionY(snapY);
                }

                this.rotationDir = this.isUpsideDown ? -1 : 1;
        }

        private playPortalEffect(portalNumber: number, x: number, y: number, circleColor: {r: number, g: number, b: number}, rotation: number = 0): void {
                const portalCircle = this.createCircleWave(45, 10, 0.3, circleColor, true, 'in');
                LayerManager.addToLayer(portalCircle, GameLayer.T1);
                portalCircle.setPosition(x, y);

                const t1Layer = PlayerObject.resolveT1Layer();
                const formattedPortalNum = portalNumber.toString().padStart(2, '0');

                const portalShineFrontFrame = getCachedSpriteFrameFromAtlas("GJ_GameSheet04-uhd", `portalshine_${formattedPortalNum}_front_001/spriteFrame`);
                const portalShineBackFrame = getCachedSpriteFrameFromAtlas("GJ_GameSheet04-uhd", `portalshine_${formattedPortalNum}_back_001/spriteFrame`);

                const portalShineFrontSprite = AD.createSprite(t1Layer, "portal-shine", portalShineFrontFrame);
                portalShineFrontSprite.setPosition(x, y);
                const portalShineFrontUIOpacity = portalShineFrontSprite.addComponent(UIOpacity);
                portalShineFrontUIOpacity.opacity = 0;

                const portalShineBackSprite = AD.createSprite(t1Layer, "portal-shine", portalShineBackFrame);
                portalShineBackSprite.setPosition(x, y);
                const portalShineBackUIOpacity = portalShineBackSprite.addComponent(UIOpacity);
                portalShineBackUIOpacity.opacity = 0;
                
                if (rotation) {
                        portalShineFrontSprite.angle = -rotation;
                        portalShineBackSprite.angle = -rotation;
                }

                const state = {opacity: 0}

                const onUpdate = () => {
                        portalShineFrontUIOpacity.opacity = state.opacity;
                        portalShineBackUIOpacity.opacity = state.opacity;
                };

                tween(state)
                        .to(0.2, { opacity: 255 }, { onUpdate })
                        .to(0.38, { opacity: 0 }, { onUpdate })
                        .call(() => portalShineFrontSprite.destroy())
                        .start();
        }

        private playRingEffect(collisionRect: CollisionRect, layer: GameLayer, x: number, y: number, color: {r: number, g: number, b: number}): void {
                const ringJumpEffect = this.createCircleWave(30, 5.5, 0.5, color, true, 'in');
                LayerManager.addToLayer(ringJumpEffect, layer);
                ringJumpEffect.setPosition(x, y);

                const ringObj = collisionRect.object;
                const startScale = 0.8;
                const endScaleFactor = 1.875;
                const scaleState = { s: startScale };

                tween(scaleState)
                        .to(0.1, { s: startScale * endScaleFactor }, {
                                onUpdate: () => ringObj.setScale(scaleState.s, true),
                                easing: 'quadOut',
                        })
                        .to(0.2, { s: startScale }, {
                                onUpdate: () => ringObj.setScale(scaleState.s, true),
                                easing: 'quadIn',
                        })
                        .start();
        }

        private spawnRingHitEffect(layer: GameLayer, x: number, y: number): void {
                const ringHitEffect = this.createCircleWave(10, 60, .25, {r: 255, g: 255, b: 255}, false);
                LayerManager.addToLayer(ringHitEffect, layer);
                ringHitEffect.setPosition(x, y);
        }

        private playGravityEffect(flip: boolean): void {
                if (this.gravityEffectsPlaying > this.maxGravityEffects) return;
                this.gravityEffectsPlaying++;
                const gravityEffect = GravityEffectSprite.create();

                gravityEffect.runAnimation(flip);

                this.scheduleOnce(() => {

                        gravityEffect.stopAnimation();
                        this.gravityEffectsPlaying--;

                }, gravityEffect.slideTime)
        }

        private flipGravity(flip: boolean, noEffects: boolean = false): void {
                if (this.isUpsideDown == flip) return; // exit early if already upside down or right-side up

                this.isUpsideDown = flip;
                this.yVelocity *= 0.5;
                if (!noEffects) {
                     this.playGravityEffect(flip);   

                     let reset = false;
                     if (!this.playerStreakActive) reset = true;

                     PlayerStreak.get().setAttached(true, reset);
                     this.playerStreakActive = true;
                }

                this.canDieFromHitHead = false;
                this.scheduleOnce(() => {
                        this.canDieFromHitHead = true;
                }, 0.2)
        }

        private padJump(padType: PadType, effectLayer: GameLayer, objectPosition: {x: number, y: number}): void {
                this.shouldApplyTerminalVel = false;

                let yVel = this.yVelocity;
                let padEffectColor = {r: 255, g: 255, b: 0};

                switch(padType) {
                        case PadType.YELLOW:
                                yVel = 846;
                                break;
                        case PadType.PINK:
                                yVel = 561.6;
                                padEffectColor = {r: 255, g: 0, b: 255};
                                break;
                        case PadType.RED:
                                padEffectColor = {r: 255, g: 0, b: 0};
                                yVel = 1080;
                                break;
                }

                this.setYVelocity(
                        this.isUpsideDown
                                ? -yVel
                                : yVel
                );
                let reset = false;
                if (!this.playerStreakActive) reset = true;

                PlayerStreak.get().setAttached(true, reset);
                this.playerStreakActive = true;

                if (effectLayer) {
                        const padEffect = this.createCircleWave(10, 40, .25, padEffectColor);
                        LayerManager.addToLayer(padEffect, effectLayer);
                        padEffect.setPosition(objectPosition.x, objectPosition.y);
                }

                this.rotationDir = this.isUpsideDown ? -1 : 1;
        }

        private ringJump(ringType: RingType): void {
                this.shouldApplyTerminalVel = false;
                let ringMult = 1;

                switch(ringType) {
                        case RingType.YELLOW: ringMult = 1; break;
                        case RingType.PINK: ringMult = 0.71; break;
                        case RingType.RED: ringMult = 1.38; break;
                }

                this.setYVelocity(
                        this.isUpsideDown
                                ? -this.jumpVelocity * ringMult
                                : this.jumpVelocity * ringMult
                );
                let reset = false;
                if (!this.playerStreakActive) reset = true;

                PlayerStreak.get().setAttached(true, reset);
                this.playerStreakActive = true;

                this.rotationDir = this.isUpsideDown ? -1 : 1;
        }

        private jump(): void
        {
                switch(this.gamemode)
                {
                        case Gamemode.CUBE:
                                if (this.jumpHeld && this.isGrounded)
                                {
                                        this.isGrounded = false;
                                        this.canRingJump = false;
                                        this.setYVelocity(
                                                this.isUpsideDown
                                                        ? -this.jumpVelocity
                                                        : this.jumpVelocity
                                
                                        );
                                        
                                        this.rotationDir = this.isUpsideDown ? -1 : 1;                        
                                }                                
                                break;

                        default: break;
                }
        }

        public spawnPlayerRipple(startRadius: number, endRadius: number, duration: number): void {
                const rippleNode = new Node('ripple');
                this.particleRoot.addChild(rippleNode);

                const gfx = rippleNode.addComponent(Graphics);
                setGraphicsBlending(gfx, true);
                gfx.lineWidth = 1;
                const c = ColorChannelManager.instance.getChannel(ColorChannelManager.P1);
                gfx.strokeColor = ColorChannelManager.getColor(c.r, c.g, c.b, 255);
                

                const midRadius = (startRadius + endRadius) / 2;
                const state = { radius: startRadius, opacity: 0 };

                const onUpdate = () => {
                        gfx.strokeColor = ColorChannelManager.getColor(c.r, c.g, c.b, state.opacity);
                        gfx.clear();
                        drawPolygon(gfx, state.radius, 22);
                        gfx.stroke();
                };

                tween(state)
                        .to(duration * 0.5, { radius: midRadius, opacity: 255 }, { onUpdate })
                        .to(duration * 0.5, { radius: endRadius, opacity: 0 }, { onUpdate })
                        .call(() => rippleNode.destroy())
                        .start();
        }

        private playSpawnEffect(): void {

                this.stopBlink();
                this.startBlink(this.spawnBlinkDuration, this.spawnBlinkCount);

                for (let i = 0; i < 4; i++) {
                        this.scheduleOnce(() => this.spawnPlayerRipple(70, 2, 0.3), i * 0.1);
                }
        }

        private startBlink(duration: number, blinks: number): void {
                const uiOpacity = this.visualRoot.getComponent(UIOpacity)!;

                const step = duration / (blinks * 2); // time per half-blink
                let count = 0;
                const totalSteps = blinks * 2;

                this.blinkTimer = setInterval(() => {
                        count++;
                        // alternate between invisible and visible
                        uiOpacity.opacity = (count % 2 === 0) ? 255 : 0;

                        if (count >= totalSteps) {
                                this.stopBlink();
                                uiOpacity.opacity = 255; // ensure visible at the end
                        }
                }, step * 1000);
        }

        private stopBlink(): void {
                if (this.blinkTimer !== null) {
                        clearInterval(this.blinkTimer);
                        this.blinkTimer = null;
                }

                // restore visibility when stopping
                const uiOpacity = this.node.getComponent(UIOpacity)!;
                if (uiOpacity) uiOpacity.opacity = 255;
        }

        protected respawnPlayer(): void {
                this.isRespawning = true;
                this.flipGravity(false, true);
                this.setDead(false);
                PlayerObject.deltaPos.set(0, 0);

                PlayerStreak.get().setAttached(false);
                PlayerStreak.get().getComponent(MotionStreak).reset();
                this.rotationDir = 1;

                const cameraY = CameraController.getHalfHeight() - settings.defaultCameraOffsetY;
                CameraController.setPosition(CameraController.LOOK_AHEAD, cameraY);
                CameraController.rawTargetY = cameraY;
                CameraController.logicalY = cameraY;
                
                this.setPosition(0, this.hitboxOuter.height * 0.5);
                this.setVisualRotation(0);

                this.isGrounded = true;
                this.attemptCount++;

                this.setYVelocity(0);
                PlayerObject.xVelocity = 0;

                this.playSpawnEffect();

                TriggerManager.resetTriggers();
                LevelManager.deactivateObjects();

                // reset starting color channels in level
                const levelDefaultColors = LevelManager.levelDefaultSettings.defaultChannelColors;
                if (levelDefaultColors && levelDefaultColors.length > 0) {
                        for (let i = 0; i < levelDefaultColors.length; i++) {
                                const c = levelDefaultColors[i];
                                ColorChannelManager.instance.setChannel(c[0], c[1], c[2], c[3], c[4], c[5]);
                        }
                }

                PlayLayer.get().playMusic();
        }

        private setDead(dead: boolean) {
                PlayerObject.isDead = dead;
        }

        private createCircleWave(
                startRadius: number,
                endRadius: number,
                duration: number,
                color: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 },
                fill: boolean = true,
                fade: 'in' | 'out' | 'none' = 'out'
        ): Node {
                const fxNode = new Node('circle-wave');
                fxNode.setPosition(0, 0);

                const gfx = fxNode.addComponent(Graphics);
                setGraphicsBlending(gfx, true);

                const initialOpacity = fade === 'in' ? 0 : 255;
                const targetOpacity  = fade === 'in' ? 255 : fade === 'out' ? 0 : 255;

                const state = { radius: startRadius, opacity: initialOpacity };

                const onUpdate = () => {
                        const { r, g, b } = color;

                        if (fill) {
                                gfx.fillColor = ColorChannelManager.getColor(r, g, b, state.opacity);
                        } else {
                                gfx.lineWidth = 1;
                                gfx.strokeColor = ColorChannelManager.getColor(r, g, b, state.opacity);
                        }

                        gfx.clear();
                        drawPolygon(gfx, state.radius, 22);
                        if (fill) gfx.fill();
                        else gfx.stroke();
                };

                const activeTween = tween(state)
                        .to(duration, { radius: endRadius, opacity: targetOpacity }, { onUpdate })
                        .call(() => {
                                if (fxNode.isValid) fxNode.destroy();
                        })
                        .start();

                fxNode.on(Node.EventType.NODE_DESTROYED, () => activeTween.stop(), this);

                return fxNode;
        }

        private spawnDeathCircle() {
                const deathCircleNode = new Node('death-circle');
                this.deathEffectRoot.addChild(deathCircleNode);

                const gfx = deathCircleNode.addComponent(Graphics);
                setGraphicsBlending(gfx, true);
                const c = ColorChannelManager.instance.getChannel(ColorChannelManager.P1);
                gfx.fillColor = ColorChannelManager.getColor(c.r, c.g, c.b, 255);
                
                const duration = 0.5; // ik its 0.6 but 0.5 just feels better
                const startRadius = 15;
                const endRadius = 110;

                const state = { radius: startRadius, opacity: 255 };

                const onUpdate = () => {
                        gfx.fillColor = ColorChannelManager.getColor(c.r, c.g, c.b, state.opacity);
                        gfx.clear();
                        drawPolygon(gfx, state.radius, 22);
                        gfx.fill();
                };

                tween(state)
                        .to(duration, { radius: endRadius, opacity: 0 }, { onUpdate })
                        .call(() => deathCircleNode.destroy())
                        .start();
        }

        private playDeathEffect(): void {
                this.spawnDeathCircle();
                this.spawnParticleEffect(
                        getCachedPlist("explodeEffect"),
                        this.node.position.x,
                        this.node.position.y,
                        this.deathEffectRoot
                )
                tween(this.visualRoot.getComponent(UIOpacity))
                        .to(0.05, { opacity: 0 })
                        .start();
                
                CameraController.get().shakeCamera(0.15, 2, 0);
        }

        protected destroyPlayer(): void {
                if (PlayerObject.isDead) return;

                this.setDead(true);
                PlayLayer.get().stopMusic();
                PlayLayer.get().playDeathSound();
                this.playDeathEffect();

                this.scheduleOnce(() => {
                        this.respawnPlayer();
                }, this.respawnDelay);
        }

        private spawnParticleEffect(file: ParticleAsset, x: number, y: number, parent: Node): ParticleSystem2D {
                const effectNode = new Node("particle-effect");

                const effect = effectNode.addComponent(ParticleSystem2D);
                effect.file = file;
                effectNode.setWorldPosition(x, y, effectNode.position.z);
                parent.addChild(effectNode);

                LayerManager.addToLayer(effectNode, GameLayer.P);
                effectNode.setSiblingIndex(0);
                this.playerParticles.push(effect);
                this.applyColorToParticleSystem(effect, this.particleColor);
                
                effect.resetSystem();
                const lifetime = effect.life + effect.lifeVar;
                const buffer = .5;

                this.scheduleOnce(() => {
                        const index = this.playerParticles.indexOf(effect);
                        if (index >= 0) {
                                this.playerParticles.splice(index, 1);
                        }
                        if (effectNode && effectNode.isValid) {
                                effectNode.destroy();
                        }
                }, lifetime + buffer)
                return effect;
        }

        private applyColorToPlayerParticles(color: Color): void {
                if (this.dragEffect) {
                        this.applyColorToParticleSystem(this.dragEffect, color);
                }

                for (const particle of this.playerParticles) {
                        if (particle && particle.isValid) {
                                this.applyColorToParticleSystem(particle, color);
                        }
                }
        }

        private applyColorToParticleSystem(particle: ParticleSystem2D, color: Color): void {
                if (!particle) {
                        return;
                }

                const startColor = particle.startColor;
                const endColor = particle.endColor;

                if (startColor) {
                        startColor.r = color.r;
                        startColor.g = color.g;
                        startColor.b = color.b;
                        startColor.a = color.a;
                        particle.startColor = startColor;
                }

                if (endColor) {
                        endColor.r = Math.round(color.r * 0.25);
                        endColor.g = Math.round(color.g * 0.25);
                        endColor.b = Math.round(color.b * 0.25);
                        endColor.a = color.a;
                        particle.endColor = endColor;
                }
        }

        private updateCollisionStatus(dt: number) {
                const collisionSide = this.getActiveCollision();
                if (PlayerObject.isDead) return;

                // collision states
                const hitGround = collisionSide == CollisionSide.BOTTOM;
                const hitHead = collisionSide == CollisionSide.TOP;
                const hitWall = collisionSide == CollisionSide.LEFT || collisionSide == CollisionSide.RIGHT;

                // no collision occured this tick
                const noCollision = !hitGround && !hitHead && !hitWall;

                // compute Y velocity for the next tick
                const nextYVelocity = (noCollision && !this.isGrounded)
                        ? this.yVelocity - this.gravity * dt
                        : this.yVelocity;
                const groundHalfH = this.hitboxOuter.height * 0.5;
                const nextY = this.node.position.y + nextYVelocity * dt;
                const isOnRealGround = nextY <= groundHalfH;
                
                if (!collisionSide && isOnRealGround) { // is on the real ground
                        if (this.isUpsideDown) {
                                if (this.canDieFromHitHead) this.destroyPlayer();
                                this.onLanded(groundHalfH);
                                return;
                        }
                        this.onLanded(groundHalfH);
                }
                else if (noCollision && !isOnRealGround && !this.isGrounded) { // airborne
                        this.setYVelocity(nextYVelocity);
                        this.updateRotationAirborne(dt);
                }
                else this.updateRotationSnap();
        }

        private updateDragEffect(): void {
                if (PlayerObject.isDead) {
                        this.dragEffect.stopSystem();
                        this.dragEffectRunning = false;
                        return;
                }
                if (this.isGrounded) {
                        if (!this.dragEffectRunning) {
                                // run once when drag effect started
                                this.isUpsideDown
                                        ? this.dragEffect.node.setPosition(-10, 13)
                                        : this.dragEffect.node.setPosition(-10, -13);
                                this.dragEffect.resetSystem();
                                this.dragEffectRunning = true;
                                
                                const gravityY = this.isUpsideDown ? 300 : -300;
                                const rotation = this.isUpsideDown ? 180 : 0;

                                this.dragEffect.node.angle = -rotation;
                                this.dragEffect.gravity.y = gravityY;
                        }
                } else {
                        this.dragEffect.stopSystem();
                        this.dragEffectRunning = false;
                }
        }

        private updateLandEffect(): void {
                const halfH = this.hitboxOuter.height * 0.5;
                const yOffset = this.isUpsideDown ? halfH : -halfH;
                if (this.hasLanded) {
                        const landEffect = this.spawnParticleEffect(
                                getCachedPlist("landEffect"),
                                this.node.position.x,
                                this.node.position.y + yOffset,
                                this.particleRoot
                        )

                        const gravityY = this.isUpsideDown ? 500 : -500;
                        const rotation = this.isUpsideDown ? 180 : 0;

                        landEffect.node.angle = -rotation;
                        landEffect.gravity.y = gravityY;

                        this.applyColorToParticleSystem(landEffect,
                                ColorChannelManager.getColor(
                                        ColorChannelManager.instance.getChannel(ColorChannelManager.P1).r,
                                        ColorChannelManager.instance.getChannel(ColorChannelManager.P1).g,
                                        ColorChannelManager.instance.getChannel(ColorChannelManager.P1).b,
                                        255
                                )
                        )
                }
        }

        private fixedUpdate(dt: number): void { // run fixed timestep physics
                if (
                        !LevelManager.levelLoadingFinished ||
                        PlayerObject.isDead ||
                        !PlayerObject.canStartPlaying
                ) return;

                this.updateTimeMod();
                this.handleInput();

                const wasGrounded = this.isGrounded;

                this.updateCollisionStatus(dt); // contents might be moved back to fixedUpdate in the future (maybe)

                this.hasLanded = !wasGrounded && this.isGrounded; // true only a single frame

                // clamp terminal velocity
                if (this.yVelocity < 0) this.shouldApplyTerminalVel = true;
                this.clampTerminalVelocity();
                
                this.updateDragEffect();

                AD.moveBy(
                        this.node,
                        PlayerObject.xVelocity * dt,
                        this.yVelocity * dt
                );

                this.updateLandEffect();
        }

        protected update(dt: number): void {
                if (!this.initialized) {
                    return;
                }

                if (this.isRespawning) this.isRespawning = false;

                // fixed timestep update
                let steps = 0;
                this.accumulator += dt;
                while (this.accumulator >= this.FIXED_DT && steps < this.MAX_PHYSICS_STEPS) {
                        this.fixedUpdate(this.FIXED_DT);
                        this.accumulator -= this.FIXED_DT;
                        steps++;
                }
                if (steps === this.MAX_PHYSICS_STEPS) {
                        this.accumulator = 0;
                }

                // compute delta x and y
                const deltaPos = PlayerObject.deltaPos;
                PlayerObject.deltaPos.x = this.node.position.x - this.lastX;
                PlayerObject.deltaPos.y = this.node.position.y - this.lastY;
                this.lastX = this.node.position.x;
                this.lastY = this.node.position.y;

                // update camera follow
                const followThreshold =
                        CameraController.getPositionX()
                        - CameraController.LOOK_AHEAD;

                if (this.node.position.x >= followThreshold || this.attemptCount > 1) {
                        CameraController.isFollowingPlayer = true;
                }
                else CameraController.isFollowingPlayer = false;
        }

        protected onDestroy(): void {
                this.unbindGlow?.();
                this.unbindPrimary?.();
                this.unbindSecondary?.();
        }
}
