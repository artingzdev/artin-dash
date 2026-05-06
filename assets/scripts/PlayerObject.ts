import { _decorator, BoxCollider2D, Camera, clamp, Color, EventKeyboard, EventMouse, EventTouch, find, Game, Graphics, Input, input, KeyCode, MotionStreak, Node, ParticleAsset, ParticleSystem2D, Rect, Size, sp, Sprite, SpriteFrame, sys, tween, UIOpacity, Vec2, view } from 'cc';
import { GameObject, ObjectType } from './GameObject';
import { GameLayer, LayerManager } from './LayerManager';
import { drawPolygon, getCachedMaterial, getCachedPlist, getCachedSpriteFrameFromAtlas, setGraphicsBlending, setParticleBlending, settings, slerpAngle, toDeg, toRad } from './utils';
import { AD } from './AD';
import { CameraController } from './CameraController';
import { ColorChannelManager } from './ColorChannelManager';
import { LevelManager } from './LevelManager';
import { TriggerManager } from './TriggerManager';
import { GravityEffectSprite } from './GravityEffectSprite';
import { PlayerStreak } from './PlayerStreak';
import { CollisionRect } from './CollisionRect';
import { PlayLayer } from './PlayLayer';
import { GhostTrailEffect } from './GhostTrailEffect';
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
    NONE,
    BOTTOM,
    TOP,
    LEFT,
    RIGHT,
//     GROUND,
//     CEILING
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
        private static _instance: PlayerObject = null;

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
        public xVelocity: number = 0; //units/sec
        public gravity: number = 0; // units/sec^2
        public jumpVelocity: number = 0; // units/sec
        public playerSpeed: number = 0.9; // mirrors m_playerSpeed
        public speedMultiplier: number = 5.770002;
        private rotationDir: number = 1; // 1/-1
        private gravityDir: number = 1; // direction gravity is going. Used in gamemodes like the ship or wave.
        private forceMult: number = 1;

        // player state
        public canStartPlaying = false;
        public isUpsideDown: boolean = false;
        public isMini: boolean = false;
        public glowEnabled: boolean = false;
        public isOnSurface: boolean = true;
        public jumpHeld: boolean = false;
        public attemptCount: number = 1
        public dragEffectRunning: boolean = false;
        public shipDragEffectRunning: boolean = false;
        public hasLanded: boolean = false;
        public isFixedMode: boolean = false; // every gamemode except robot and cube (the ones with ceilings)
        public isRespawning: boolean = false;
        public isDead: boolean = false;
        private canRingJump: boolean = true;
        private shouldApplyTerminalVel: boolean = true; // boolean that controls whether or not terminal velocity should be applied
        private gravityEffectsPlaying: number = 0;
        private playerStreakActive: boolean = false;
        private canDieFromHitHead: boolean = true;
        private isOnSlope: boolean = false;
        private isDashing: boolean = false;
        private isMirrored: boolean = false;
        private becameShipThisTick: boolean = false;
        private isAccelerating: boolean = false;
        private curCollisionSide: CollisionSide = CollisionSide.NONE;
        

        // physics constants & state
        private accumulator: number = 0;
        private readonly TPS: number = 240;
        private readonly FIXED_DT: number = 1/this.TPS;
        private readonly MAX_PHYSICS_STEPS: number = 8;
        private fixedUpdateScale: number = 1;
        
        // gamemode
        public gamemode: Gamemode = Gamemode.CUBE;

        // miscellaneous
        public dragEffect: ParticleSystem2D = null;
        public shipDragEffect: ParticleSystem2D = null;
        public shipFireEffect: ParticleSystem2D = null;
        private playerParticles: ParticleSystem2D[] = [];
        private spawnBlinkDuration: number = 0.4; // seconds
        private spawnBlinkCount: number = 4;
        private blinkTimer: number | null = null;
        private respawnDelay: number = 1; // seconds
        private maxGravityEffects: number = 4;
        public playerMainFrame: SpriteFrame | null = null;

        // hitbox/collision related
        public hitboxOuter: Size = new Size(30, 30);
        public hitboxInner: Size = new Size(9, 9);
        private readonly collisionPlayerRectOuter: Rect = new Rect();
        private readonly collisionPlayerRectInner: Rect = new Rect();
        private readonly collisionBlockRect: Rect = new Rect();
        private currentRingOverlaps: Set<CollisionRect> = new Set();
        private prevRingOverlaps: Set<CollisionRect> = new Set();
        private worldGroundY: number = 0;
        private worldCeilingY: number | null = null; 

        // node/transform related
        public playerRotation: number = 0;

        // delta position tracking
        private lastX: number = 0;
        private lastY: number = 15;
        public deltaPos: Vec2 = new Vec2(0, 0);
        private lastPosition: Vec2 = new Vec2(0, 0);
        private curPosition: Vec2 = new Vec2(0, 0);

        // visual branches
        private visualRoot: Node = null;
        private particleRootLower: Node = null;
        private particleRootUpper: Node = null;

        // gamemode nodes -----------------------------

        public cubeRoot: Node = null;
        public cubePrimaryNode: Node = null;
        public cubeSecondaryNode: Node = null;
        public cubeGlowNode: Node = null;

        public shipRoot: Node = null;
        public shipPrimaryNode: Node = null;
        public shipSecondaryNode: Node = null;
        public shipGlowNode: Node = null;

        // vehicle (small cube inside gamemodes like ship and ufo)
        public vehicleRoot: Node = null;
        public vehiclePrimaryNode: Node = null;
        public vehicleSecondaryNode: Node = null;
        public vehicleGlowNode: Node = null;

        //---------------------------------------------

        // configs ------------------------------------

        private readonly RING_CONFIG = {
                [ObjectType.JUMP_RING_YELLOW]: { type: RingType.YELLOW, color: { r: 255, g: 255, b: 0 } },
                [ObjectType.JUMP_RING_PINK]:   { type: RingType.PINK,   color: { r: 255, g: 0,   b: 255 } },
                [ObjectType.JUMP_RING_RED]:    { type: RingType.RED,    color: { r: 255, g: 0,   b: 0 } }
        };

        private readonly PAD_CONFIG = {
                [ObjectType.JUMP_PAD_YELLOW]: { type: PadType.YELLOW},
                [ObjectType.JUMP_PAD_PINK]:   { type: PadType.PINK},
                [ObjectType.JUMP_PAD_RED]:    { type: PadType.RED}
        };

        // --------------------------------------------

        // game layer node references
        public t1Node: Node | null = null;

        public static get instance(): PlayerObject {
                return PlayerObject._instance;
        }

        onLoad() {
                this.t1Node = find('WorldCanvas/RenderLayers/T1');
                PlayerObject._instance = this;
        }

        private resolveT1Layer(): Node | null {
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
                        this.onButtonPressed();
                }
                else if (event.keyCode === KeyCode.KEY_R && !this.isDead) {
                        this.respawnPlayer();
                        this.jumpHeld = false;
                        this.canRingJump = true;
                        this.onButtonReleased();
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
                        this.onButtonReleased();
                }
        }

        private onTouchStart(_event: EventTouch): void {
                this.jumpHeld = true;
                this.onButtonPressed();
        }

        private onTouchEnd(_event: EventTouch): void {
                this.jumpHeld = false;
                this.canRingJump = true;
                this.onButtonReleased();
        }
        
        private onMouseDown(event: EventMouse): void {
                if (event.getButton() === EventMouse.BUTTON_LEFT) {
                        this.jumpHeld = true;
                        this.onButtonPressed();
                }
        }

        private onMouseUp(event: EventMouse): void {
                if (event.getButton() === EventMouse.BUTTON_LEFT) {
                        this.jumpHeld = false;
                        this.canRingJump = true;
                }
                this.onButtonReleased();
        }

        private handleInput(): void {
                if (this.jumpHeld) {
                        this.onButtonPressed();
                } else {
                        this.onButtonReleased();
                }
        }
        //----------------------------------------------------------------------------------


        protected initInternal(): void {
                // initialize some variables
                this.lastX = this.node.position.x;
                this.lastY = this.node.position.y;
                this.lastPosition.set(this.node.position.x, this.node.position.y);

                // setup player particle root
                this.particleRootLower = new Node("particle-root");
                this.node.addChild(this.particleRootLower);

                // setup visual root
                this.visualRoot = new Node("visual-root");
                this.visualRoot.addComponent(UIOpacity);
                this.node.addChild(this.visualRoot);

                // setup upper particle root (above the player)
                this.particleRootUpper = new Node("death-effect-root");
                this.node.addChild(this.particleRootUpper);
                
                // setup player particle systems ----------------------------------------

                const dragEffectNode = new Node("drag-effect");
                this.dragEffect = dragEffectNode.addComponent(ParticleSystem2D);
                this.dragEffect.file = getCachedPlist("dragEffect");
                dragEffectNode.setPosition(-10, -13);
                this.particleRootLower.addChild(dragEffectNode);

                const shipDragEffectNode = new Node("ship-drag-effect");
                this.shipDragEffect = shipDragEffectNode.addComponent(ParticleSystem2D);
                this.shipDragEffect.file = getCachedPlist("shipDragEffect");
                shipDragEffectNode.setPosition(1, -15);
                this.particleRootUpper.addChild(shipDragEffectNode);
                this.shipDragEffect.stopSystem();
                setParticleBlending(this.shipDragEffect, true);

                const shipFireEffectNode = new Node("ship-fire-effect");
                this.shipFireEffect = shipFireEffectNode.addComponent(ParticleSystem2D);
                this.shipFireEffect.file = getCachedPlist("shipFireEffect");
                shipFireEffectNode.setPosition(-5, -7.5);
                this.particleRootLower.addChild(shipFireEffectNode);
                setParticleBlending(this.shipFireEffect, true);
                this.shipFireEffect.stopSystem();
                this.shipFireEffect.playOnLoad = false;

                //-----------------------------------------------------------------------
                





                // CUBE MODE ------------------------------------------------------------------------------------------------------------------
                this.cubeRoot = new Node("cube-frame");

                const formattedCubeId = this.cubeID.toString().padStart(2, '0');
                const cubeSecondaryFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeId}-uhd`, `player_${formattedCubeId}_2_001`);
                const cubePrimaryFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeId}-uhd`, `player_${formattedCubeId}_001`);
                const cubeGlowFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeId}-uhd`, `player_${formattedCubeId}_glow_001`);
                const cubeExtraFrame = getCachedSpriteFrameFromAtlas(`icons/player_${formattedCubeId}-uhd`, `player_${formattedCubeId}_extra_001`);

                this.cubeSecondaryNode = AD.createSprite(this.cubeRoot, "player-sprite", cubeSecondaryFrame);
                this.cubePrimaryNode = AD.createSprite(this.cubeRoot, "player-sprite", cubePrimaryFrame);
                this.cubeGlowNode = AD.createSprite(this.cubeRoot, "player-sprite", cubeGlowFrame); 
                const cubeExtraNode = AD.createSprite(this.cubeRoot, "player-sprite", cubeExtraFrame);


                this.cubeGlowNode.active = this.glowEnabled; // disable if player glow is turned off
                //------------------------------------------------------------------------------------------------------------------------------


                // SHIP MODE -------------------------------------------------------------------------------------------------------------------
                this.shipRoot = new Node("ship-frame");

                const formattedShipId = this.shipID.toString().padStart(2, '0');
                const shipSecondaryFrame = getCachedSpriteFrameFromAtlas(`icons/ship_${formattedShipId}-uhd`, `ship_${formattedShipId}_2_001`);
                const shipPrimaryFrame = getCachedSpriteFrameFromAtlas(`icons/ship_${formattedShipId}-uhd`, `ship_${formattedShipId}_001`);
                const shipGlowFrame = getCachedSpriteFrameFromAtlas(`icons/ship_${formattedShipId}-uhd`, `ship_${formattedShipId}_glow_001`);
                const shipExtraFrame = getCachedSpriteFrameFromAtlas(`icons/ship_${formattedShipId}-uhd`, `ship_${formattedShipId}_extra_001`);
                
                this.shipSecondaryNode = AD.createSprite(this.shipRoot, "ship-sprite", shipSecondaryFrame);
                this.shipPrimaryNode = AD.createSprite(this.shipRoot, "ship-sprite", shipPrimaryFrame);
                this.shipGlowNode = AD.createSprite(this.shipRoot, "ship-sprite", shipGlowFrame);
                const shipExtraNode = AD.createSprite(this.shipRoot, "ship-sprite", shipExtraFrame);

                this.shipGlowNode.active = this.glowEnabled;

                AD.moveBy(this.shipRoot, 0, -5);
                //------------------------------------------------------------------------------------------------------------------------------


                // PLAYER VEHICLE ICON ---------------------------------------------------------------------------------------------------------
                this.vehicleRoot = new Node("vehicle-sprite-frame");

                this.vehicleSecondaryNode = AD.createSprite(this.vehicleRoot, "vehicle-sprite", cubeSecondaryFrame);
                this.vehiclePrimaryNode = AD.createSprite(this.vehicleRoot, "vehicle-sprite", cubePrimaryFrame);
                this.vehicleGlowNode = AD.createSprite(this.vehicleRoot, "vehicle-sprite", cubeGlowFrame);
                const vehicleExtraNode = AD.createSprite(this.vehicleRoot, "vehicle-sprite", cubeExtraFrame);

                this.vehicleGlowNode.active = this.glowEnabled;
                AD.moveBy(this.vehicleRoot, 0, 5);
                AD.scaleBy(this.vehicleRoot, 0.55);
                // -----------------------------------------------------------------------------------------------------------------------------





                // add the layers in order
                this.visualRoot.addChild(this.cubeRoot);
                this.visualRoot.addChild(this.vehicleRoot);
                this.visualRoot.addChild(this.shipRoot);

                // hide layers except cube by default
                AD.setVisible(this.vehicleRoot, false);
                AD.setVisible(this.shipRoot, false);

                // bind colors
                this.unbindPrimary = this.bindToChannelPrimary(ColorChannelManager.P1);
                this.unbindSecondary = this.bindToChannelSecondary(ColorChannelManager.P2);
                this.unbindGlow = this.bindToChannelGlow(ColorChannelManager.PGLOW);

                // set the gamemode sprite frame for the ghost trail effect
                switch(this.gamemode) {
                        case Gamemode.CUBE:
                                this.playerMainFrame = cubePrimaryFrame;
                                break;
                        default:
                                break;
                }
                GhostTrailEffect.instance.updateGhostTrailIcon();
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
                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

                const cube = this.cubePrimaryNode.getComponent(Sprite)!;
                if (cube) cube.color = fixedColor;
                const ship = this.shipPrimaryNode.getComponent(Sprite)!
                if (ship) ship.color = fixedColor;
                const vehicle = this.vehiclePrimaryNode.getComponent(Sprite)!;
                if (vehicle) vehicle.color = fixedColor;

                this.particleColor = ColorChannelManager.getColor(color.r, color.g, color.b, color.a);
                this.applyColorToPlayerParticles(this.particleColor);
        }

        public changeSecondaryColor(color: Color): void {

                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

                const cube = this.cubeSecondaryNode.getComponent(Sprite)!;
                if (cube) cube.color = fixedColor;
                const ship = this.shipSecondaryNode.getComponent(Sprite)!
                if (ship) ship.color = fixedColor;
                const vehicle = this.vehicleSecondaryNode.getComponent(Sprite)!;
                if (vehicle) vehicle.color = fixedColor;
        }

        public changeGlowColor(color: Color): void {

                const fixedColor = ColorChannelManager.getColor(color.r, color.g, color.b);

                const cube = this.cubeGlowNode.getComponent(Sprite)!;
                if (cube) cube.color = fixedColor;
                const ship = this.shipGlowNode.getComponent(Sprite)!
                if (ship) ship.color = fixedColor;
                const vehicle = this.vehicleGlowNode.getComponent(Sprite)!;
                if (vehicle) vehicle.color = fixedColor;
        }

        static create(): PlayerObject {

                const node = new Node(this.name);
                const obj = node.addComponent(this) as PlayerObject;
                LayerManager.addToLayer(node, GameLayer.P);

                return obj;
        }

        public enableGlow(): void {
                this.cubeGlowNode.active = true;
                this.glowEnabled = true;
        }

        public disableGlow(): void {
                this.cubeGlowNode.active = false;
                this.glowEnabled = false;
        }

        public updateTimeMod(): void {
                switch(this.playerSpeed) {
                        case 0.7:
                                this.jumpVelocity = 573.482;
                                this.gravity = 2799.36;
                                this.xVelocity = 251.1601;
                                break;
                        case 0.9:
                                this.jumpVelocity = 603.72;
                                this.gravity = 2799.36;
                                this.xVelocity = 311.5801;
                                break;
                        case 1.1:
                                this.jumpVelocity = 616.682;
                                this.gravity = 2786.4;
                                this.xVelocity = 387.4201;
                                break;
                        case 1.3:
                                this.jumpVelocity = 606.422;
                                this.gravity = 2799.36;
                                this.xVelocity = 468.0001;
                                break;
                        case 1.6:
                                this.jumpVelocity = 606.422;
                                this.gravity = 2799.36;
                                this.xVelocity = 576.0002;
                                break;
                        default:
                                this.jumpVelocity = 603.722;
                                this.gravity = 2799.36;
                                this.xVelocity = 311.5801;
                                break;
                }
        }

        private incrementRotation(rotation: number): void {
                this.playerRotation += rotation;
        }

        private convertToClosestRotation(currentRotation: number, targetRotation: number): number {
                if (this.gamemode !== Gamemode.CUBE) return targetRotation;

                const currentMod = Math.trunc(currentRotation) % 360;

                // find the nearest multiple of 90 below and above currentMod
                const lo = Math.floor(currentMod / 90) * 90;
                const hi = lo + 90;

                // return whichever is closer
                return (currentMod - lo) <= (hi - currentMod) ? lo : hi;
        }

        private updateFlyRotation(dt: number) {
                if (this.isOnSlope || this.isDashing || this.becameShipThisTick) {
                        this.playerRotation = 0;
                        return;
                }

                const curPos = this.curPosition;
                const lastPos = this.lastPosition;
                const speed = dt * 0.45 / this.fixedUpdateScale; // slightly damped speed to match rotation speed of real GD

                let dx: number;
                let dy: number;

                if (this.isFlyingMode() && this.isMirrored)
                        dx = Math.abs(curPos.x -lastPos.x);
                else
                        dx = curPos.x - lastPos.x;

                dy = -(curPos.y - lastPos.y);

                const distSq = dx * dx + dy * dy;
                const minAngle = -54.2 * 0.017453292;
                const maxAngle = 47.96 * 0.017453292;

                if (distSq > dt * 1.2 /*|| (m_isPlatformer && (m_isShip || m_isBird))*/) {
                        let targetAngle  = Math.atan2(dy, dx);
                        targetAngle = clamp(targetAngle, minAngle, maxAngle);
                        const currentAngle = this.playerRotation * 0.017453292;
                        let newAngle = slerpAngle(currentAngle, targetAngle, speed); 
                        newAngle = clamp(newAngle, minAngle, maxAngle);
                        this.playerRotation = newAngle * 57.29578;
                }
        }

        private playerIsFalling(): boolean {
                return this.yVelocity < 0;
        }

        private playerIsRising(): boolean {
                return this.yVelocity > 0;
        }

        private playerIsFallingPastGravity(): boolean {
                const baseGravity = 0.958199;
                const threshold = -2 * baseGravity;
                return this.yVelocity < threshold;
        }

        private isFlyingMode(): boolean {
                return     this.gamemode === Gamemode.BIRD
                        || this.gamemode === Gamemode.SHIP
                        || this.gamemode === Gamemode.SWING
                        || this.gamemode === Gamemode.DART
        }

        private updateRotationSnap(dt: number) {

                if (this.isDashing) return;

                const curRotationDeg = this.playerRotation;
                let targetRot: number;
                if (this.gamemode === Gamemode.SHIP) targetRot = 0;
                else {
                        targetRot = this.convertToClosestRotation(
                                curRotationDeg,
                                Math.round(curRotationDeg / 90) * 90
                        )                        
                }

                let speed = this.playerSpeed * 0.175;

                switch (this.gamemode) {
                        case Gamemode.CUBE:
                                speed *= 3.5;
                                break;
                        case Gamemode.SHIP:
                                speed *= 0.7;
                                break;
                        default:
                                break;
                }

                const t = clamp(speed * dt, 0, 1);

                let result = slerpAngle(
                        curRotationDeg * toRad,
                        targetRot * toRad,
                        t
                ) * toDeg;

                this.playerRotation = result;
        }

        private updateRotationAirborne(dt: number): void {
                // continuous cube rotation
                const gamemode = this.gamemode;
                const isCubeMode = gamemode === Gamemode.CUBE;
                const shouldRotate = isCubeMode && !this.isOnSurface;

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

        public getVisualRotation(): number {
                return -this.visualRoot.angle;
        }

        private clampTerminalVelocity(): void {
                if (!this.shouldApplyTerminalVel) return;

                let terminalUp = 0;
                let terminalDown = 0
                const gamemode = this.gamemode;

                switch (gamemode) {
                        case Gamemode.CUBE:
                        case Gamemode.BALL:
                        case Gamemode.ROBOT:
                        case Gamemode.SPIDER:
                                terminalUp = 810;
                                terminalDown = -810;
                                break;
                        case Gamemode.SHIP:
                        case Gamemode.BIRD:
                                terminalUp = 432;
                                terminalDown = -345.6;
                                break;
                        case Gamemode.SWING:
                                terminalUp = 432;
                                terminalDown = -432;
                                break;
                        case Gamemode.DART:
                                terminalUp = this.xVelocity;
                                terminalDown = -this.xVelocity;
                                break;
                        default:
                                terminalUp = 810;
                                terminalDown = -810;
                                break;
                }

                if (!terminalDown || !terminalUp) return;
                const clamped = clamp(this.yVelocity, terminalDown, terminalUp);
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

        private resolveGroundCollisionsInternal(curSolidCollisionResult: CollisionSide, playerRectOuter: Rect, halfHOuter: number): CollisionSide {
                
                const collidingGround = playerRectOuter.yMin <= this.worldGroundY;
                let landY: number;
                if (collidingGround) {
                        landY = this.worldGroundY + halfHOuter;
                        curSolidCollisionResult = CollisionSide.BOTTOM;

                        switch(this.gamemode) {
                                case Gamemode.CUBE:
                                        if (this.isUpsideDown && this.canDieFromHitHead) {
                                                this.destroyPlayer();
                                                break;
                                        }
                                        this.onSurfaceContact(landY);
                                        break;
                                case Gamemode.SHIP:
                                        this.onSurfaceContact(landY);
                                        break;
                        }
                }
                const collidingCeiling = this.worldCeilingY != null && playerRectOuter.yMax >= this.worldCeilingY;
                        
                if (collidingCeiling) {
                        landY = this.worldCeilingY - halfHOuter;
                        curSolidCollisionResult = CollisionSide.TOP;

                        switch(this.gamemode) {
                                case Gamemode.CUBE:
                                        if (!this.isUpsideDown && this.canDieFromHitHead) {
                                                this.destroyPlayer();
                                                break;
                                        }
                                        this.onSurfaceContact(landY);
                                        break;
                                case Gamemode.SHIP:
                                        this.onSurfaceContact(landY);
                                        break;
                        }
                }
                return curSolidCollisionResult;
        }

        private resolveSolidCollisionsInternal(curSolidCollisionResult: CollisionSide, playerRectOuter: Rect, playerRectInner: Rect, objRect: Rect): CollisionSide {
                const isCollidingOuter: boolean = playerRectOuter.intersects(objRect);
                const isCollidingInner: boolean = playerRectInner.intersects(objRect);

                let collisionSide: CollisionSide;

                if (isCollidingInner) { // inner player hitbox
                        
                        collisionSide = this.getCollisionSide(playerRectInner, objRect);

                        switch(collisionSide) {
                                case CollisionSide.BOTTOM:
                                        if (this.canDieFromHitHead) this.destroyPlayer();
                                        curSolidCollisionResult = CollisionSide.BOTTOM;
                                        break;
                                case CollisionSide.TOP:
                                        if (this.canDieFromHitHead) this.destroyPlayer();
                                        curSolidCollisionResult = CollisionSide.TOP;
                                        break;
                                case CollisionSide.RIGHT:
                                        this.destroyPlayer();
                                        curSolidCollisionResult = CollisionSide.RIGHT;
                                        break;
                        }
                }
                else if (isCollidingOuter) { // outer player hitbox
                        const halfHOuter = playerRectOuter.height * 0.5;

                        collisionSide = this.getCollisionSide(playerRectOuter, objRect);
                        switch(collisionSide) {
                                case CollisionSide.BOTTOM: 
                                        switch(this.gamemode) {
                                                case Gamemode.CUBE:
                                                        if (!this.isUpsideDown && this.playerIsFalling()) {
                                                                this.onSurfaceContact(objRect.yMax + halfHOuter);
                                                                curSolidCollisionResult = CollisionSide.BOTTOM;
                                                        }
                                                        break;
                                                case Gamemode.SHIP:
                                                        this.onSurfaceContact(objRect.yMax + halfHOuter);
                                                        curSolidCollisionResult = CollisionSide.BOTTOM;
                                                        break;
                                        }
                                        break;

                                case CollisionSide.TOP:
                                        switch(this.gamemode) {
                                                case Gamemode.CUBE:
                                                        if (this.isUpsideDown && this.playerIsRising()) {
                                                                this.onSurfaceContact(objRect.yMin - halfHOuter);
                                                                curSolidCollisionResult = CollisionSide.TOP; 
                                                        }
                                                        break;
                                                case Gamemode.SHIP:
                                                        this.onSurfaceContact(objRect.yMin - halfHOuter);
                                                        curSolidCollisionResult = CollisionSide.TOP; 
                                                        break;
                                        } 
                                        break;
                                case CollisionSide.RIGHT:
                                        if (this.isOnSurface) break;
                                        // snap the player to the block if close enough

                                        if (!this.isUpsideDown && this.playerIsFalling()) {
                                                if (playerRectInner.yMin >= objRect.yMax) {
                                                        this.onSurfaceContact(objRect.yMax + halfHOuter);
                                                        curSolidCollisionResult = CollisionSide.BOTTOM;
                                                }
                                        }
                                        else if (this.isUpsideDown && this.playerIsRising()) {
                                                if (playerRectInner.yMax <= objRect.yMin) {
                                                        this.onSurfaceContact(objRect.yMin - halfHOuter);
                                                        curSolidCollisionResult = CollisionSide.BOTTOM;
                                                }
                                        }       

                                        break;
                        }
                }

                return curSolidCollisionResult;
        }

        private checkCollisions(): CollisionSide {
                if (this.isDead) return;
                const nearbyObjects = LevelManager.getNearbySectionObjects(this.node.position.x);
                const loopLen = nearbyObjects.length + 1; // add one for world ceiling and ground check

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

                let solidCollisionResult: CollisionSide = CollisionSide.NONE;

                this.currentRingOverlaps.clear();

                // loop through nearby objects and check for a collision
                for (let i = 0; i < loopLen; i++) {
                        // resolve ground and ceiling cases first
                        if (i === 0) {
                                solidCollisionResult = this.resolveGroundCollisionsInternal(solidCollisionResult, playerRectOuter, halfHOuter);
                                continue;
                        }

                        // now move on to objects once ground and ceiling collisions are resolved

                        const object = nearbyObjects[i - 1]; // subtract 1 to account for the first check being ground and ceiling

                        objRect.x = object.x - object.w * 0.5;
                        objRect.y = object.y - object.h * 0.5;
                        objRect.width = object.w;
                        objRect.height = object.h;

                        let config: any;

                        const collidingSensorAndDeactivated = 
                                object.type != ObjectType.SOLID
                                && !object.activated
                                && AD.isColliding(playerRectOuter, objRect, object.rotation);

                        switch(object.type) {
                                case ObjectType.SOLID:
                                        solidCollisionResult = this.resolveSolidCollisionsInternal(solidCollisionResult, playerRectOuter, playerRectInner, objRect);
                                        break; 
                                        
                                case ObjectType.HAZARD:
                                        if (!AD.isColliding(playerRectOuter, objRect, object.rotation)) break;

                                        this.destroyPlayer();
                                        break;

                                case ObjectType.JUMP_RING_YELLOW:
                                case ObjectType.JUMP_RING_PINK:
                                case ObjectType.JUMP_RING_RED:
                                        config = this.RING_CONFIG[object.type];

                                        if (AD.isColliding(playerRectOuter, objRect, object.rotation)) {
                                                if (!object.activated && this.jumpHeld && this.canRingJump) {
                                                        this.ringJump(config.type);
                                                        object.activated = true;
                                                        this.canRingJump = false;
                                                        LevelManager.activatedObjects.push(object);

                                                        this.playRingEffect(object, object.layer, object.x, object.y, config.color);
                                                }
                                                if (!this.prevRingOverlaps.has(object)) {
                                                        this.spawnRingHitEffect(object.layer, object.x, object.y);
                                                        
                                                }
                                                this.currentRingOverlaps.add(object);
                                        }
                                        break;
                                
                                case ObjectType.JUMP_PAD_YELLOW:
                                case ObjectType.JUMP_PAD_PINK:
                                case ObjectType.JUMP_PAD_RED:
                                        config = this.PAD_CONFIG[object.type];

                                        if (collidingSensorAndDeactivated)
                                        {
                                                this.padJump(config.type, object.layer, {x: object.x, y: object.y});
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);
                                        }
                                        break;

                                case ObjectType.GRAVITY_PORTAL_NORMAL:

                                        if (collidingSensorAndDeactivated)
                                        {
                                                this.flipGravity(false);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);

                                                this.playPortalEffect(1, object.x, object.y, {r: 0, g: 255, b: 255}, object.rotation);
                                        }
                                        break;

                                case ObjectType.GRAVITY_PORTAL_INVERSE:

                                        if (collidingSensorAndDeactivated)
                                        {
                                                this.flipGravity(true);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);

                                                this.playPortalEffect(1, object.x, object.y, {r: 255, g: 255, b: 0}, object.rotation);
                                        }
                                        break;

                                case ObjectType.GRAVITY_PORTAL_TOGGLE:

                                        if (collidingSensorAndDeactivated)
                                        {
                                                this.flipGravity(!this.isUpsideDown);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);
                                        }
                                        break;

                                case ObjectType.PORTAL_SHIP:

                                        if (collidingSensorAndDeactivated)
                                        {
                                                this.playPortalEffect(2, object.x, object.y, {r: 255, g: 0, b: 255}, object.rotation);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);

                                                this.switchToShipMode(object.y);
                                        }
                                        break;

                                case ObjectType.PORTAL_CUBE:

                                        if (collidingSensorAndDeactivated)
                                        {
                                                this.playPortalEffect(2, object.x, object.y, {r: 0, g: 255, b: 0}, object.rotation);
                                                object.activated = true;
                                                LevelManager.activatedObjects.push(object);

                                                this.switchToCubeMode();
                                        }
                                        break;
                                
                                default:
                                        break;
                        }

                }

                const prevRingCopy = this.prevRingOverlaps;
                this.prevRingOverlaps = this.currentRingOverlaps;
                this.currentRingOverlaps = prevRingCopy;

                if (solidCollisionResult === CollisionSide.NONE) {
                        this.isOnSurface = false;
                }

                return solidCollisionResult;
        }

        private onSurfaceContact(snapY: number | null = null): void {
                this.isOnSurface = true;
                this.shouldApplyTerminalVel = true;
                this.setYVelocity(0);
                this.curPosition.set(
                        this.node.position.x + this.xVelocity * this.FIXED_DT,
                        this.node.position.y
                )

                switch(this.gamemode) {
                        case Gamemode.CUBE:
                                this.updateRotationSnap(this.FIXED_DT * 60);

                                PlayerStreak.instance.setAttached(false);
                                this.playerStreakActive = false;
                                
                                break;
                        case Gamemode.SHIP:
                                this.updateRotationSnap(this.FIXED_DT * 60);
                                break;
                        default:
                                break;
                }

                if (snapY !== null) {
                        this.setPositionY(snapY);
                }

                this.rotationDir = this.isUpsideDown ? -1 : 1;
        }

        private changeGamemodeIcon(gamemode: Gamemode): void {
                if (this.visualRoot.children.length < 1) return;

                // set all to false
                for (let i = 0; i < this.visualRoot.children.length; i ++) {
                        const gamemodeRoot = this.visualRoot.children[i];
                        AD.setVisible(gamemodeRoot as Node, false);
                }

                // show the desired gamemode
                switch (gamemode) {
                        case Gamemode.CUBE:
                                AD.setVisible(this.cubeRoot, true);
                                break;
                        case Gamemode.SHIP:
                                AD.setVisible(this.shipRoot, true);
                                AD.setVisible(this.vehicleRoot, true);
                                break;
                
                        default:
                                break;
                }
        }

        private switchToShipMode(portalY: number): void {
                if (this.gamemode === Gamemode.SHIP) return;
                this.gamemode = Gamemode.SHIP;
                
                this.becameShipThisTick = true;

                this.gravityDir = 1;
                this.isAccelerating = false;
                this.changeGamemodeIcon(this.gamemode); // set sprites visibility to match gamemode
                this.playerRotation = 0;
                this.yVelocity *= 0.5;
                
                const reset = this.playerStreakActive ? false : true;
                PlayerStreak.instance.setAttached(true, reset);
                PlayerStreak.instance.offsetY = -7.5;
                PlayerStreak.instance.offsetX = -5;
                this.playerStreakActive = true;

                this.shipFireEffect.resetSystem();
                PlayLayer.instance.activateGlitterEffect();

                // run ceiling anim and fix collision bounds
                if (!portalY) portalY = 300;
                this.activateFixedMode(portalY, 300);
        }

        private switchToCubeMode(instant: boolean = false): void {
                if (this.gamemode === Gamemode.CUBE) return;
                this.gamemode = Gamemode.CUBE;

                this.changeGamemodeIcon(this.gamemode);
                this.gravityDir = 1;
                this.playerRotation = 0;
                PlayerStreak.instance.offsetY = 0;
                PlayerStreak.instance.offsetX = 0;

                this.shipDragEffect.stopSystem();
                this.shipDragEffectRunning = false;

                this.playerStreakActive = false;
                PlayerStreak.instance.setAttached(false);

                this.shipFireEffect.stopSystem();
                PlayLayer.instance.deactivateGlitterEffect();

                // reset dual grounds to single ground
                this.deactivateFixedMode(instant);

                this.rotationDir = this.isUpsideDown ? -1 : 1;
        }

        /**
         * Activate static camera and ease grounds into view for gamemodes such as ship, ball, ufo, spider, wave, or swing.
         */
        private activateFixedMode(portalY: number, gameplayHeight: number): void {
                this.isFixedMode = true;
                
                const halfHeight = gameplayHeight * 0.5;
                let lowerY = Math.floor((portalY - halfHeight) / 30) * 30;
                lowerY = Math.max(lowerY, 0);

                const upperY = lowerY + gameplayHeight;

                this.worldGroundY = lowerY;
                this.worldCeilingY = upperY;

                // center camera to the play area
                const cameraCenterY = (upperY + lowerY) / 2;
                CameraController.instance.enterStaticY(cameraCenterY, 0.5);

                // ease the two grounds
                const ceiling = PlayLayer.instance.ceilingLayer;
                const ground = PlayLayer.instance.groundLayer;

                ceiling.setVisible(true);
                ground.setVisible(true);

                const winHeight = view.getVisibleSize().height;

                const visibleGroundHeight = (winHeight - gameplayHeight) * 0.5;
                const targetTop = winHeight - visibleGroundHeight;
                const targetBottom = visibleGroundHeight;

                const ceilingIsOffScreen = ceiling.getScreenY() >= winHeight;
                const groundIsOffScreen = ground.getScreenY() <= 0;

                if (ceilingIsOffScreen) {
                        ceiling.setScreenY(winHeight);
                }
                ceiling.easeToScreenY(targetTop, 0.5, false, ceilingIsOffScreen);

                if (groundIsOffScreen) {
                        ground.setScreenY(0);
                }
                ground.easeToScreenY(targetBottom, 0.5, false, groundIsOffScreen);
        }

        private deactivateFixedMode(instant: boolean = false): void {
                this.isFixedMode = false;
                CameraController.instance.exitStatic();
                CameraController.rawTargetY = CameraController.getPositionY() - CameraController.getHalfHeight();

                const ceiling = PlayLayer.instance.ceilingLayer;
                const ground = PlayLayer.instance.groundLayer;

                ground.resetFromStaticY(instant);
                ceiling.resetFromStaticY(instant);

                this.worldGroundY = 0;
                this.worldCeilingY = null;
        }

        public enableGhostTrail(): void {
                GhostTrailEffect.instance.ghostTrailEnabled = true;
        }

        public disableGhostTrail(): void {
                GhostTrailEffect.instance.ghostTrailEnabled = false;
        }

        private playPortalEffect(portalShineNumber: number, x: number, y: number, circleColor: {r: number, g: number, b: number}, rotation: number = 0): void {
                const portalCircle = this.createCircleWave(45, 10, 0.3, circleColor, true, 'both');
                LayerManager.addToLayer(portalCircle, GameLayer.T1);
                portalCircle.setPosition(x, y);

                const t1Layer = this.resolveT1Layer();
                const formattedPortalNum = portalShineNumber.toString().padStart(2, '0');

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
                        .call(() => {
                                portalShineFrontSprite.destroy();
                                portalShineBackSprite.destroy();
                        })
                        .start();
        }

        private playRingEffect(collisionRect: CollisionRect, layer: GameLayer, x: number, y: number, color: {r: number, g: number, b: number}): void {
                const ringJumpEffect = this.createCircleWave(40, 5.5, 0.5, color, true, 'in');
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
                if (this.isUpsideDown === flip) return; // exit early if already upside down or right-side up

                this.isUpsideDown = flip;
                this.yVelocity *= 0.5;
                if (!noEffects) {
                     this.playGravityEffect(flip);   

                     let reset = false;
                     if (!this.playerStreakActive) reset = true;

                     PlayerStreak.instance.setAttached(true, reset);
                     this.playerStreakActive = true;
                }

                if (this.gamemode === Gamemode.SHIP) {


                        this.shipRoot.setScale(
                                this.shipRoot.scale.x,
                                this.shipRoot.scale.y * -1
                        )

                        this.shipRoot.setPosition(0, -this.shipRoot.position.y);

                        this.vehicleRoot.setScale(
                                this.vehicleRoot.scale.x,
                                this.vehicleRoot.scale.y * -1
                        )

                        this.vehicleRoot.setPosition(0, -this.vehicleRoot.position.y);

                        PlayerStreak.instance.offsetY = -PlayerStreak.instance.offsetY;

                        this.shipFireEffect.node.setPosition(
                                this.shipFireEffect.node.position.x,
                                this.shipFireEffect.node.position.y * -1
                        )
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
                                //yVel = 846;
                                yVel = 870;
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

                PlayerStreak.instance.setAttached(true, reset);
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

                PlayerStreak.instance.setAttached(true, reset);
                this.playerStreakActive = true;

                this.rotationDir = this.isUpsideDown ? -1 : 1;
        }

        private updateShipPhysics(buttonHeld: boolean | null = null): void {
                if (this.gamemode != Gamemode.SHIP) return;

                const yv = this.yVelocity;

                // neutral zone detection
                if (!this.isUpsideDown) {
                        if ((yv >= 0 && yv < 432) || (yv <= 0 && yv > -345.6))
                        this.isAccelerating = false;
                } else {
                        if ((yv <= 0 && yv > -432) || (yv >= 0 && yv < 345.6))
                        this.isAccelerating = false;
                }

                // --- gravDirMult determination --------------------------------
                let gravDirMult: number;
                const bigMult = this.isUpsideDown ? 0.8 : 1.2;
                const smallMult = this.isUpsideDown ? 1.2 : 0.8;
                const negMult = -1.0;

                const holding = buttonHeld ? buttonHeld : this.jumpHeld;

                if (holding) {
                        if (!this.isAccelerating) {
                                gravDirMult = negMult;
                        }
                        else {
                                const movingWrongWay = !this.isUpsideDown
                                        ? (yv <= 0 && yv !== 0)
                                        : (yv > 0);
                                gravDirMult = movingWrongWay ? negMult : smallMult;
                        }
                }
                else {
                        if (!this.isAccelerating) {
                                gravDirMult = this.playerIsFalling() ? smallMult : bigMult;
                        }
                        else {
                                const movingWrongWay = !this.isUpsideDown
                                        ? (yv <= 0 && yv !== 0)
                                        : (yv > 0);
                                if (movingWrongWay) {
                                        gravDirMult = negMult;
                                }
                                else {
                                        gravDirMult = this.playerIsFalling() ? smallMult : bigMult;
                                }
                        }
                }

                const accelFactor = (holding && this.playerIsFalling())
                        ? 0.5
                        : 0.4;

                const newGravityDir = gravDirMult < 0 ? -1 : 1;
                this.gravityDir = newGravityDir;

                this.forceMult = Math.abs(gravDirMult) * accelFactor;
        }

        private onButtonPressed(): void {
                switch(this.gamemode) {
                        case Gamemode.CUBE:
                                const canJump = 
                                        (!this.isUpsideDown && this.curCollisionSide === CollisionSide.BOTTOM) ||
                                        (this.isUpsideDown && this.curCollisionSide === CollisionSide.TOP);

                                if (canJump) {
                                        this.isOnSurface = false;
                                        this.canRingJump = false;
                                        this.setYVelocity(
                                                this.isUpsideDown
                                                        ? -this.jumpVelocity
                                                        : this.jumpVelocity
                                
                                        );
                                        
                                        this.rotationDir = this.isUpsideDown ? -1 : 1;                        
                                }                                
                                break;
                        case Gamemode.SHIP:
                                this.updateShipPhysics(true);
                                break;

                        default:
                                break;
                }
        }

        private onButtonReleased(): void {
                switch(this.gamemode) {
                        case Gamemode.SHIP:
                                this.updateShipPhysics(false);
                                break;
                        default:
                                break;
                }
        }

        public spawnPlayerRipple(startRadius: number, endRadius: number, duration: number): void {
                const rippleNode = new Node('ripple');
                this.particleRootLower.addChild(rippleNode);

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
                this.deltaPos.set(0, 0);
                this.gravityDir = 1;

                PlayerStreak.instance.setAttached(false);
                PlayerStreak.instance.getComponent(MotionStreak).reset();
                this.disableGhostTrail();
                this.rotationDir = 1;

                const cameraY = CameraController.getHalfHeight() - settings.defaultCameraOffsetY;
                const staticEaseTween = CameraController.instance.staticEaseTween;
                if (staticEaseTween != null) staticEaseTween.stop();
                CameraController.setPosition(CameraController.LOOK_AHEAD, cameraY);
                CameraController.rawTargetY = cameraY;
                CameraController.logicalY = cameraY;
                CameraController.instance.exitStatic();
                this.switchToCubeMode(true);
                
                this.setPosition(0, this.hitboxOuter.height * 0.5);
                this.lastPosition.set(this.node.position.x, this.node.position.y);
                this.playerRotation = 0;

                this.isOnSurface = true;
                this.attemptCount++;

                this.setYVelocity(0);
                this.xVelocity = 0;

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

                PlayLayer.instance.playMusic();
                this.updateTimeMod();
                this.playerRotation = 0;
        }

        private setDead(dead: boolean) {
                this.isDead = dead;
        }

        private createCircleWave(
                startRadius: number,
                endRadius: number,
                duration: number,
                color: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 },
                fill: boolean = true,
                fade: 'in' | 'out' | 'none' | 'both' = 'out'
        ): Node {
                const fxNode = new Node('circle-wave');
                fxNode.setPosition(0, 0);

                const gfx = fxNode.addComponent(Graphics);
                setGraphicsBlending(gfx, true);

                const state = { radius: startRadius, opacity: fade === 'in' || fade === 'both' ? 0 : 255 };

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

                let activeTween: any;
                
                if (fade === 'both') {
                        // For 'both', fade in then fade out
                        const halfDuration = duration / 2;
                        activeTween = tween(state)
                                .to(halfDuration, { radius: startRadius + (endRadius - startRadius) / 2, opacity: 255 }, { onUpdate })
                                .to(halfDuration, { radius: endRadius, opacity: 0 }, { onUpdate })
                                .call(() => {
                                        if (fxNode.isValid) fxNode.destroy();
                                })
                                .start();
                } else {
                        const targetOpacity = fade === 'in'
                                ? 255
                                : fade === 'out'
                                        ? 0
                                        : 255; // fade === 'none'

                        activeTween = tween(state)
                                .to(duration, { radius: endRadius, opacity: targetOpacity }, { onUpdate })
                                .call(() => {
                                        if (fxNode.isValid) fxNode.destroy();
                                })
                                .start();
                }

                fxNode.on(Node.EventType.NODE_DESTROYED, () => activeTween.stop(), this);

                return fxNode;
        }

        private spawnDeathCircle() {
                const deathCircleNode = new Node('death-circle');
                this.particleRootUpper.addChild(deathCircleNode);

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
                        this.particleRootUpper
                )
                tween(this.visualRoot.getComponent(UIOpacity))
                        .to(0.05, { opacity: 0 })
                        .start();
                
                CameraController.instance.shakeCamera(0.15, 2, 0);
        }

        protected destroyPlayer(): void {
                if (this.isDead) return;

                this.setDead(true);
                PlayLayer.instance.stopMusic();
                PlayLayer.instance.playDeathSound();
                this.disableGhostTrail();
                this.playDeathEffect();
                this.shipFireEffect.stopSystem();

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

        private updatePlayerPhysics(dt: number): CollisionSide {
                if (this.isDead) return;

                 // force multipliers
                switch(this.gamemode) {
                        case Gamemode.CUBE: this.forceMult = 1; break;
                        case Gamemode.SHIP: this.updateShipPhysics(); break;
                        case Gamemode.BIRD: this.forceMult = 0.58; break;
                        case Gamemode.SWING: this.forceMult = 0.4; break;
                        case Gamemode.BALL: this.forceMult = 0.6; break;
                        case Gamemode.SPIDER: this.forceMult = 0.6; break;
                        case Gamemode.ROBOT: this.forceMult = 0.9; break;
                        default: break; 
                }

                const collisionSide = this.checkCollisions();
                this.curCollisionSide = collisionSide;
                const airborne = collisionSide === CollisionSide.NONE; // no collision occured this tick

                const flipDir = this.isUpsideDown ? -1 : 1;

                const nextYVelocity = this.yVelocity - (this.gravity * flipDir * this.gravityDir * this.forceMult * dt);

                const nextX = this.node.position.x + this.xVelocity * dt;
                const nextY = this.node.position.y + nextYVelocity * dt;

                this.setYVelocity(nextYVelocity);
                
                this.curPosition.set(nextX, nextY);

                // run gamemode-specific actions when in the air
                if (airborne) {
                        switch(this.gamemode) {
                                case Gamemode.CUBE:
                                        this.updateRotationAirborne(dt);
                                        break;
                                case Gamemode.SHIP:
                                case Gamemode.BIRD:
                                case Gamemode.DART:
                                case Gamemode.SWING:
                                        this.updateFlyRotation(this.FIXED_DT * 60);
                                        break;
                                default:
                                        break;
                        }
                }

                return collisionSide;
        }

        private updateCubeDragEffect(): void {
                if (this.isDead || this.gamemode != Gamemode.CUBE) {
                        this.dragEffect.stopSystem();
                        this.dragEffectRunning = false;
                        return;
                }
                if (this.isOnSurface) {
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

        private updateShipDragEffect(): void {
                if (this.isDead || this.gamemode != Gamemode.SHIP) {
                        this.shipDragEffect.stopSystem();
                        this.shipDragEffectRunning = false;
                        return;
                }
                if (this.isOnSurface) {
                        if (!this.shipDragEffectRunning) {
                                // run once when drag effect started
                                this.isUpsideDown
                                        ? this.shipDragEffect.node.setPosition(1, 15)
                                        : this.shipDragEffect.node.setPosition(1, -15);
                                this.shipDragEffect.resetSystem();
                                this.shipDragEffectRunning = true;
                                
                                const gravityY = this.isUpsideDown ? 300 : -300;
                                const rotation = this.isUpsideDown ? 180 : 0;

                                this.shipDragEffect.node.angle = -rotation;
                                this.shipDragEffect.gravity.y = gravityY;
                        }
                } else {
                        this.shipDragEffect.stopSystem();
                        this.shipDragEffectRunning = false;
                }
        }

        private updateLandEffect(): void {
                const noLandEffect = this.isFlyingMode();
                if (noLandEffect) return;

                const halfH = this.hitboxOuter.height * 0.5;
                const yOffset = this.isUpsideDown ? halfH : -halfH;
                if (this.hasLanded) {
                        this.hasLanded = false;
                        const landEffect = this.spawnParticleEffect(
                                getCachedPlist("landEffect"),
                                this.node.position.x,
                                this.node.position.y + yOffset,
                                this.particleRootLower
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

        private updatePlayerDragEffect(collisionSide: CollisionSide): void {
                if (
                        (collisionSide === CollisionSide.BOTTOM && this.isUpsideDown) ||
                        (collisionSide === CollisionSide.TOP && !this.isUpsideDown)
                ) return;

                switch(this.gamemode) {
                        case Gamemode.CUBE: this.updateCubeDragEffect(); break;
                        case Gamemode.SHIP: this.updateShipDragEffect(); break;
                        default: break;
                }
        }

        private resetVariables(): void {
                this.becameShipThisTick = false;
                this.hasLanded = false;
        }

        private fixedUpdate(dt: number): void { // run fixed timestep physics
                if (
                        !LevelManager.levelLoadingFinished ||
                        this.isDead ||
                        !this.canStartPlaying
                ) return;

                this.resetVariables();

                const wasOnSurface = this.isOnSurface;

                const collisionResult = this.updatePlayerPhysics(dt);

                this.hasLanded = !wasOnSurface && this.isOnSurface; // true only a single frame

                this.handleInput();

                // clamp terminal velocity
                if (this.playerIsFalling()) this.shouldApplyTerminalVel = true;
                this.clampTerminalVelocity();
                
                this.updatePlayerDragEffect(collisionResult);
                this.updateLandEffect();
                
                AD.moveBy(
                        this.node,
                        this.xVelocity * dt,
                        this.yVelocity * dt
                );

                
                this.lastPosition.x = this.node.position.x;
                this.lastPosition.y = this.node.position.y;
        }

        protected update(dt: number): void {
                if (!this.initialized) {
                    return;
                }

                // fixed timestep update
                this.fixedUpdateScale = this.TPS * dt;
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
                const deltaPos = this.deltaPos;
                deltaPos.x = this.node.position.x - this.lastX;
                deltaPos.y = this.node.position.y - this.lastY;
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

                // update player's rotation
                if (this.isRespawning) this.playerRotation = 0;
                this.setVisualRotation(this.playerRotation);

                this.isRespawning = false;
        }

        protected onDestroy(): void {
                this.unbindGlow?.();
                this.unbindPrimary?.();
                this.unbindSecondary?.();
        }
}
