import { easeOutCubic } from "./easing";
import { gameSettings, speed } from './game-variables.js';
import { jumpHeld } from "./key-states";
import { degToRad, radToDeg } from "./utils";

export let physics = {
    playerY: 0, // in grid spaces
    cubeRotation: 0, // in degrees
    v: 0,
    gCubeBig: 86, // blocks per second

    terminalVCubeBig: 25.9, // blocks per second

    cubeRotationSpeed: 415.8, // deg/s
    cubeSlopeRotationSpeed: null, // coming soon

    cubeRotating: true,
    isJumping: false,
    consecutiveJumps: 0,
    playerOffset: 2.5, // in grid spaces
    rotationResetting: false,

    playerGravity: 1, // 1 = Normal -1 = Upside-down
    
    rotationDirection: 1 // 1 = clockwise -1 = counter-clockwise
} 

let resetStartTime = 0;
let resetDuration = 0.2; // in seconds (500ms)
let resetFrom = 0;
let resetTo = 0;

export let jumpVelocityCubeBig =  Math.sqrt(2 * physics.gCubeBig * speed[gameSettings.gameSpeed].jumpHeightCubeBig[0]);

export function updatePlayerY(dt) {

    physics.v += physics.gCubeBig * physics.playerGravity * dt;
    physics.v = Math.max(-physics.terminalVCubeBig, Math.min(physics.v, physics.terminalVCubeBig));




    // cube rotation direction logic
    if (physics.playerY === 0) { // on the ground
        if (physics.playerGravity === -1) { // if gravity is flipped
            physics.rotationDirection = -1; // ccw
        } else{ // if gravity is normal
            physics.rotationDirection = 1; // cw
        }
    }




    physics.playerY -= physics.v * dt;

    // Ground collision
    if (physics.playerY <= 0) {
        physics.playerY = 0;
        physics.v = 0;
        physics.cubeRotating = false;
        
        if (!physics.isJumping) {
            physics.consecutiveJumps = 0;
        }
        if (!jumpHeld) { // grounded
            if (!physics.rotationResetting) {
                
                resetStartTime = performance.now();
                resetFrom = radToDeg(physics.cubeRotation);
                resetTo = Math.round(resetFrom / 90) * 90;

                if (resetFrom !== resetTo){
                    physics.rotationResetting = true;
                    resetCubeRotation(dt);
                }
            }
            else{
                resetCubeRotation(dt);
            }
        }
    }   
    else if (physics.playerY > 0) {
        physics.cubeRotating = true;
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
    const eased = easeOutCubic(t);

    const angle =
        resetFrom + (resetTo - resetFrom) * eased;

    physics.cubeRotation = degToRad(angle);

    if (t === 1) {
        physics.rotationResetting = false;
        physics.cubeRotation = degToRad(resetTo);
        
    }
}


export function jump() {
    physics.rotationResetting = false;
    if (physics.playerY === 0) {

        if (physics.consecutiveJumps === 0) {
            physics.consecutiveJumps = 1;
        } else if (physics.isJumping) {
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