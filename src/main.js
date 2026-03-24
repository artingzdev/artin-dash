import './style.css';
import Phaser from "phaser";
import { computeAcceleration, computeVelXFromLandingCoordsDiscrete, gridSpacesToPixels, unitsToPixels } from './utils.js';
import { Ground } from './classes/ground.js';
import { gameState } from './state/gameState.js';
import gpp from './data/gameplayParameters.json';
import { Background } from './classes/background.js';
import { Middleground } from './classes/middleground.js';
import { Player } from './classes/player.js';
import { loadLevel } from './load.js';

let groundLayer;
let ceilingLayer;
let backgroundLayer;
let middlegroundLayer;
export let playerObject;

class playScene extends Phaser.Scene
{
    preload ()
    {
        this.load.json('objects', 'objectData/objects.json');

        this.load.image('empty', 'assets/empty.png');
        this.load.atlas(`player_${gameState.settings.cubeID}`, `assets/icons/player_${gameState.settings.cubeID}-uhd.png`, `assets/icons/player_${gameState.settings.cubeID}-uhd.json`);
        this.load.atlas('particleSheet', 'assets/AD_ParticleSheet-uhd.png', 'assets/AD_ParticleSheet-uhd.json');

        this.load.atlas('GJ_GameSheet-uhd', 'assets/GJ_GameSheet-uhd.png', 'assets/GJ_GameSheet-uhd.json');
        this.load.atlas('GJ_GameSheet02-uhd', 'assets/GJ_GameSheet02-uhd.png', 'assets/GJ_GameSheet02-uhd.json');
        this.load.atlas('GJ_GameSheetGlow-uhd', 'assets/GJ_GameSheetGlow-uhd.png', 'assets/GJ_GameSheetGlow-uhd.json');
        //this.load.atlas('PixelSheet_01-uhd', 'assets/PixelSheet_01-uhd.png', 'assets/PixelSheet_01-uhd.json');

        this.load.image(`ground_${gameState.settings.groundID}`, `assets/grounds/groundSquare_${gameState.settings.groundID}_001-uhd.png`);
        this.load.image(`ground_${gameState.settings.groundID}_2`, `assets/grounds/groundSquare_${gameState.settings.groundID}_2_001-uhd.png`);
        this.load.image('groundSquareShadow', 'assets/groundSquareShadow_001.png');
        this.load.image('floorLine_01', 'assets/floorLine_01_001-uhd.png');

        this.load.image(`background_${gameState.settings.backgroundID}`, `assets/backgrounds/game_bg_${gameState.settings.backgroundID}_001-uhd.png`);

        this.load.image(`middleground_${gameState.settings.middlegroundID}`, `assets/middlegrounds/fg_${gameState.settings.middlegroundID}_001-uhd.png`);
        this.load.image(`middleground_${gameState.settings.middlegroundID}_2`, `assets/middlegrounds/fg_${gameState.settings.middlegroundID}_2_001-uhd.png`);
    }

    handleKeyPresses() {
        // this.input.keyboard.on('keyup-D', () => {
        //     playerObject.spawnDeathEffect(this);
        // });
    }

    create() {
        // shortcut keys
        this.respawnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // jump keys
        this.jumpHeld = false;
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

        gameState.screen = {
            width: this.scale.width,
            height: this.scale.height
        }

        // add the layers in order
        backgroundLayer = new Background(this);
        middlegroundLayer = new Middleground(this);
        this.b5Layer = this.add.container(0, 0);
        this.b4Layer = this.add.container(0, 0);
        this.b3Layer = this.add.container(0, 0);
        this.b2Layer = this.add.container(0, 0);
        this.b1Layer = this.add.container(0, 0);
        playerObject = new Player(this);
        this.t1Layer = this.add.container(0, 0);
        this.t2Layer = this.add.container(0, 0);
        this.t3Layer = this.add.container(0, 0);
        this.t4Layer = this.add.container(0, 0);



        this.staticObjects = [];
        this.dynamicObjects = [];
        this.pendingVisualTextureChanges = [];
        this.objectCullPaddingX = unitsToPixels(120);
        this.objectCullPaddingY = unitsToPixels(90);
        this.lastCullView = null;
        groundLayer = new Ground(this);
        ceilingLayer = new Ground(this, true);
        this.backgroundLayerRef = backgroundLayer;
        this.middlegroundLayerRef = middlegroundLayer;
        this.groundLayerRef = groundLayer;
        this.ceilingLayerRef = ceilingLayer;

        // change some settings
        groundLayer.y = gameState.screen.height;
        ceilingLayer.scrollFactorY = 0;
        ceilingLayer.setScale(1, -1);
        ceilingLayer.alpha = 0;

        loadLevel(this, 'level', 'levels/dryOut.json', () => {});

        gameState.camera.minY = unitsToPixels(90);
        this.cameras.main.scrollY = gameState.camera.minY;
        this.handleKeyPresses();

        // player collision resolution runs in Player.update()

        this.physicsStep = 1 / 240;
        this.physicsAccumulator = 0;
        this.maxPhysicsSubsteps = 12;

        // pre-calculate horizontal velocity (player move speed) for special jumps (in array → 0 = initial jump, 1 = buffered jumps)
        this.velXSpecial = {
            _4x1:
                [
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[1].jumpHeightCubeBig[0], 120, 30, this.physicsStep),
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[1].jumpHeightCubeBig[1], 120, 30, this.physicsStep)
                ],
            _3x2:
                [
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[1].jumpHeightCubeBig[0], 90, 60, this.physicsStep),
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[1].jumpHeightCubeBig[1], 90, 60, this.physicsStep)
                ],
            _2x2:
                [
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[0].jumpHeightCubeBig[0], 60, 60, this.physicsStep),
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[0].jumpHeightCubeBig[1], 60, 60, this.physicsStep)
                ],
            _4x2:
                [
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[2].jumpHeightCubeBig[0], 120, 60, this.physicsStep),
                    computeVelXFromLandingCoordsDiscrete(gameState.player.cube.big.acceleration, gpp.speeds[2].jumpHeightCubeBig[1], 120, 60, this.physicsStep)
                ],
        }

        gameState.camera.toY = this.cameras.main.scrollY;
        this.cameraEaseStartTime = null;
        this.cameraFromY = null;

        this.cameras.main.roundPixels = false;
        this.cameras.main.scrollX = gridSpacesToPixels(0.5);
    }

    updateStaticObjectCulling(force = false) {
        const hasStatic = Array.isArray(this.staticObjects) && this.staticObjects.length > 0;
        const hasDynamic = Array.isArray(this.dynamicObjects) && this.dynamicObjects.length > 0;
        if (!hasStatic && !hasDynamic) return;

        const view = this.cameras.main.worldView;
        if (!view) return;

        if (
            !force &&
            !hasDynamic &&
            this.lastCullView &&
            this.lastCullView.x === view.x &&
            this.lastCullView.y === view.y
        ) {
            return;
        }

        const minX = view.x - this.objectCullPaddingX;
        const maxX = view.right + this.objectCullPaddingX;
        const minY = view.y - this.objectCullPaddingY;
        const maxY = view.bottom + this.objectCullPaddingY;

        const applyVisibility = (obj, refreshBounds = false) => {
            if (!obj) return;
            if (refreshBounds && typeof obj._updateCullBounds === "function") {
                obj._updateCullBounds();
            }
            const bounds = obj._cullBounds;
            if (!bounds) return;

            const isVisible =
                bounds.maxX >= minX &&
                bounds.minX <= maxX &&
                bounds.maxY >= minY &&
                bounds.minY <= maxY;

            if (obj.visible !== isVisible) {
                obj.setVisible(isVisible);
            }
        };

        if (hasStatic) {
            for (let i = 0; i < this.staticObjects.length; i++) {
                applyVisibility(this.staticObjects[i], false);
            }
        }

        if (hasDynamic) {
            for (let i = 0; i < this.dynamicObjects.length; i++) {
                applyVisibility(this.dynamicObjects[i], true);
            }
        }

        this.lastCullView = { x: view.x, y: view.y };
    }

    updateCameraY() {
        const player = gameState.player; // player state alias
        const camera = gameState.camera; // camera state alias
        const h = gameState.screen.height; 
        const boundsTop = h * (gameState.camera.padding / 2) + this.cameras.main.scrollY;
        const boundsBottom = h - (gameState.camera.padding / 2 * h) + this.cameras.main.scrollY;

        // follow player (spring-like easing that adapts to target changes)
        this.cameras.main.scrollY += (camera.toY - this.cameras.main.scrollY) * (1 - Math.exp(-camera.followSpeed * this.dt));

        if (playerObject.grounded && camera.minY != null && Math.round(camera.toY) != camera.minY) {
            // set the target Y to the ground when the player is grounded
            camera.toY = camera.minY;
        }
        else if (player.y <= boundsTop) camera.toY -= Math.abs(playerObject.deltaY); // player above upper bounds and NOT grounded
        else if (player.y >= boundsBottom) camera.toY += Math.abs(playerObject.deltaY); // player below lower bounds and NOT grounded
    }

    update(time, delta) {
        this.dt = Math.min(delta / 1000, 0.05);
        this.scrollSpeedAmount = gpp.speeds[gameState.settings.gameSpeed].velX;
        const camera = gameState.camera; // camera state alias

        //this.scrollSpeedAmount = this.velXSpecial._4x1[gameState.player.cube.jumpIndex];

        const pointer = this.input.activePointer;
        const keyboardJumpHeld = this.wKey.isDown || this.spaceKey.isDown || this.upKey.isDown;
        const pointerJumpHeld = pointer.leftButtonDown();
        this.jumpHeld = keyboardJumpHeld || pointerJumpHeld;

        if (!gameState.player.isDead) {

            const frameStartX = gameState.player.x;
            const frameStartY = gameState.player.y;
            this.physicsAccumulator += this.dt;
            let substeps = 0;
            while (this.physicsAccumulator >= this.physicsStep && substeps < this.maxPhysicsSubsteps) {
                playerObject.update(this, this.physicsStep);
                playerObject.checkTriggers(this); // check oncoming triggers and run them when passed
                if (this.jumpHeld) playerObject.jump(this);
                this.physicsAccumulator -= this.physicsStep;
                substeps++;
            }

            if (substeps === this.maxPhysicsSubsteps && this.physicsAccumulator >= this.physicsStep) {
                this.physicsAccumulator = 0;
            }

            // Camera logic expects frame-level displacement, not per-substep displacement.
            playerObject.deltaX = gameState.player.x - frameStartX;
            playerObject.deltaY = gameState.player.y - frameStartY;

            // make camera follow player after threshold (screen width / 2 - 75 units by default)
            const followThresholdX = Math.round(gameState.screen.width / 2 - unitsToPixels(camera.offset));

            const playerScreenX = playerObject.x - this.cameras.main.scrollX;
            if (!playerObject.isFollowedByCamera && playerScreenX >= followThresholdX) {
                playerObject.isFollowedByCamera = true;
            }
            if (playerObject.isFollowedByCamera) {
                this.cameras.main.scrollX = playerObject.x - followThresholdX;
            }
        } else {
            playerObject.ghostTrailOn = false;
            playerObject.dragEffect.stop();
            playerObject.isDragEffectRunning = false;
            this.physicsAccumulator = 0;
        }

        if (this.pendingVisualTextureChanges.length > 0) {
            const nextVisualChange = this.pendingVisualTextureChanges.shift();
            switch (nextVisualChange.type) {
                case 'changeBg':
                    this.backgroundLayerRef.updateTexture(this);
                    break;
                case 'changeG':
                    this.groundLayerRef.updateTexture(this);
                    break;
                case 'changeMg':
                    this.middlegroundLayerRef.updateTexture(this);
                    break;
            }
        }

        this.updateCameraY();
        gameState.camera.toY = Math.min(gameState.camera.toY, gameState.camera.minY) // clamp camera target Y to the ground

        // make them move with the camera
        groundLayer.scroll(this);
        ceilingLayer.scroll(this);
        backgroundLayer.scroll(this);
        middlegroundLayer.scroll(this);
        this.updateStaticObjectCulling();

        // handle key events
        if (Phaser.Input.Keyboard.JustDown(this.respawnKey)) playerObject.respawn(this);
    }
}

const closestHeight = Math.round(window.innerHeight / 320) * 320;
const closestWidth = Math.round(closestHeight * window.innerWidth / window.innerHeight);

const config = {
    type: Phaser.AUTO,
    scene: playScene,
    height: closestHeight,
    width: closestWidth,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            debug: {
                showBody: false,
                showStaticBody: false,
                lineThickness: 3, // default is 1
                lineColor: 0xff0000,
                lineOpacity: 1
            }
        }
    },
    pixelArt: false,
    antialias: true,
    roundPixels: false
};

if (!window.__GAME__) {
    window.__GAME__ = new Phaser.Game(config);
}

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
})