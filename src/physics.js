import { easeOutQuad } from "./easing";
import { camera, gameSettings, speed } from './game-variables.js';
import { jumpHeld } from "./key-states";
import { defaultGroundPositionPercentage } from "./main.js";
import { degToRad, getRenderedSize, gridSpacesToPixels, pixelsToGridSpaces, radToDeg } from "./utils";

export let physics = {
    playerY: 0, // in grid spaces
    cubeRotation: 0, // in degrees
    v: 0,
    //gCubeBig: 86, // blocks per second
    gCubeBig: 94.04,

    terminalVCubeBig: 25.9, // blocks per second

    cubeRotationSpeed: 415.8, // deg/s
    cubeSlopeRotationSpeed: null, // coming... not very soon

    cubeRotating: true,
    consecutiveJumps: 0,
    playerOffset: 2.5, // in grid spaces
    rotationResetting: false,

    playerGravity: 1, // 1 = Normal -1 = Upside-down
    
    rotationDirection: 1, // 1 = clockwise -1 = counter-clockwise
    snappingToGround: false,
    isOnABlock: false,
    hitHead: false,

    collidedObjectRenderedTop: null,
    canJump: true
}

export let playerHitboxes = [
    {   // cube

    },
    {   // ship

    },
    {   // ball

    },
    {   // UFO

    },
    {   // wave

    },
    {   // robot

    },
    {   // spider

    },
    {   // swing

    },
]

export function getCollisionSide(player, rect) {

    if (player.right  <= rect.left ||
        player.left   >= rect.right ||
        player.bottom <= rect.top  ||
        player.top    >= rect.bottom) {
        return null;
    }

    const overlapLeft   = player.right  - rect.left;
    const overlapRight  = rect.right - player.left;
    const overlapTop    = player.bottom - rect.top;
    const overlapBottom = rect.bottom - player.top;

    const minOverlap = Math.min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBottom
    );


    if (minOverlap === overlapTop)    return ["bottom", rect.top]; 
    if (minOverlap === overlapBottom) return ["top", rect.bottom];
    if (minOverlap === overlapLeft)   return ["right", rect.left];
    if (minOverlap === overlapRight)  return ["left", rect.right];

    return null;
}

let resetStartTime = 0;
let resetDuration = 0.1; // in seconds (500ms)
let resetFrom = 0;
let resetTo = 0;

export let jumpVelocityCubeBig =  Math.sqrt(2 * physics.gCubeBig * speed[gameSettings.gameSpeed].jumpHeightCubeBig[0]);

export function updatePlayerY(dt) {

    // apply gravity (only affects velocity)
    physics.v += physics.gCubeBig * physics.playerGravity * dt;
    physics.v = Math.max(
        -physics.terminalVCubeBig,
        Math.min(physics.v, physics.terminalVCubeBig)
    );

    // predict next position
    const nextY = physics.playerY - physics.v * dt;

    // landing surface
    let landed = false;
    let surfaceY = null;

    // prioritize block over ground
    if (physics.isOnABlock) {
        if (physics.collidedObjectRenderedTop != null) {
            surfaceY = pixelsToGridSpaces(
                window.innerHeight
                - physics.collidedObjectRenderedTop
                - getRenderedSize(512 * defaultGroundPositionPercentage)
                // + camera.y // fix whatever this is
            );
            landed = true;
        }
    }
    else if (nextY <= 0) {
        surfaceY = 0;
        landed = true;
        physics.isOnABlock = false;
    }

    // resolve position & velocity
    if (landed && physics.v >= 0) {
        physics.canJump = true;
        physics.playerY = surfaceY;
        physics.v = 0;
        physics.cubeRotating = false;

        // rotation direction
        if (physics.playerGravity === -1) {
            physics.rotationDirection = -1;
        }
        else{
            physics.rotationDirection = 1 
            }

        // reset jump state & snap rotation
        if (!jumpHeld) {

            physics.consecutiveJumps = 0;

            if (!physics.rotationResetting) {

                resetStartTime = performance.now();
                resetFrom = radToDeg(physics.cubeRotation);
                resetTo = Math.round(resetFrom / 90) * 90;

                if (resetFrom !== resetTo) {
                    physics.rotationResetting = true;
                }
            }
        }

    } else {
        physics.canJump = physics.isOnABlock ? true : false;
        physics.playerY = nextY;
        physics.cubeRotating = true;

        // leaving a block
        if (physics.v < 0) {
            physics.isOnABlock = false;
        }
    }
}

export function rotateCube(dt) {
    if (physics.cubeRotating) {
        physics.cubeRotation += degToRad(physics.cubeRotationSpeed) * dt * physics.rotationDirection;
    }
}

export function resetCubeRotation() {
    
    if (!physics.rotationResetting) {
        return;
    } 
    
    const elapsed = (performance.now() - resetStartTime) / 1000;
    const t = Math.min(elapsed / resetDuration, 1);
    const eased = easeOutQuad(t);

    const angle = resetFrom + (resetTo - resetFrom) * eased;

    physics.cubeRotation = degToRad(angle);

    if (t === 1) {
        physics.rotationResetting = false;
        physics.cubeRotation = degToRad(resetTo);
        
    }
}


export function jump() {
    physics.rotationResetting = false;
    if (physics.canJump) {

        if (physics.consecutiveJumps === 0) {
            physics.consecutiveJumps = 1;
        } else if (jumpHeld) {
            physics.consecutiveJumps += 1;
        } else {
            physics.consecutiveJumps = 1;
        }
        
        const arrayIndex = (physics.consecutiveJumps >= 2) ? 1 : 0;
        updateJumpVelocity(arrayIndex);

        physics.v = -jumpVelocityCubeBig;
        physics.cubeRotating = true;
    }
}

export function updateJumpVelocity(speedIndex = 0){ // speedIndex = initial jump: 0, second jump: 1 (slightly higher)
    jumpVelocityCubeBig = Math.sqrt(2 * physics.gCubeBig * speed[gameSettings.gameSpeed].jumpHeightCubeBig[speedIndex]);
}