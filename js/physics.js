const player = document.getElementById('player');
const cube = document.getElementById('cube');   

let groundY = '26dvh';

let playerY = gridSpacesToPixels(0);
let v = 0;
//const gCubeBig = 0.45;
let gCubeBig = gridSpacesToPixels(87);

function updateGravity(){
    gCubeBig = gridSpacesToPixels(87);
    requestAnimationFrame(updateGravity);
}
requestAnimationFrame(updateGravity);

let jumpVelocityCubeBig = Math.sqrt(2 * gCubeBig * gridSpacesToPixels(speed[gameSpeed].jumpHeightCubeBig[0]));

let terminalVCubeBig = gridSpacesToPixels(25.9);

function updateTerminalVelocity(){
    terminalVCubeBig = gridSpacesToPixels(25.9);
    requestAnimationFrame(updateTerminalVelocity);
}
requestAnimationFrame(updateTerminalVelocity);

const cubeRotationSpeed = 415; // deg/s
const cubeSlopeRotationSpeed = null; // coming soon

let cubeRotating = true;
let isJumping = false;
let consecutiveJumps = 0; // start at 0

let lastTimePlayer = performance.now();
let lastTimeRotate = performance.now();
let lastTimeResetRotate = performance.now();

function updatePlayer(currentTime) {
    // compute delta time
    const dt = Math.min((currentTime - lastTimePlayer) / 1000, 0.05);  // Cap ~50ms for lag spikes
    lastTimePlayer = currentTime;
    
    // terminal velocity
    if (v < terminalVCubeBig) {
        v += gCubeBig * dt * timeWarp;
    }

    playerY -= v  * dt * timeWarp * playerGravity;

    if (playerY < 0) {
        
        playerY = 0;
        v = 0;
        cubeRotating = false;
        
        if (!isJumping) {
            consecutiveJumps = 0;
        }
    }

    requestAnimationFrame(updatePlayer);
}
requestAnimationFrame(updatePlayer);


function rotateCube(currentTime) {
    if (cubeRotating) {
        const dt = Math.min((currentTime - lastTimeRotate) / 1000, 0.05);  // Cap ~50ms for lag spikes
        lastTimeRotate = currentTime;

        let playerStyle = window.getComputedStyle(cube);
        let currentRotation = parseFloat(playerStyle.rotate);
        currentRotation += cubeRotationSpeed * dt * timeWarp * playerGravity;

        cube.style.rotate = currentRotation + "deg";
    }
    
    requestAnimationFrame(rotateCube);        
}
requestAnimationFrame(rotateCube);


function resetCubeRotation(currentTime){
    if (cubeRotating === false && playerY <= 0 && isJumping == false){
        const dt = Math.min((currentTime - lastTimeResetRotate) / 1000, 0.05);  // Cap ~50ms for lag spikes
        lastTimeResetRotate = currentTime;

        let playerStyle = window.getComputedStyle(cube);
        let currentRotation = parseFloat(playerStyle.rotate);

        let closestRotation = Math.round(currentRotation/90) * 90

        if (currentRotation == closestRotation) {
            cube.style.transition = "bottom 500ms ease-in-out";
        }
        else{
            cube.style.transition = `bottom 500ms ease-in-out, ${100 / timeWarp}ms cubic-bezier(0,.44,.44,1)`;
            cube.style.rotate = closestRotation + "deg";            
        }

    }
    requestAnimationFrame(resetCubeRotation);
}
requestAnimationFrame(resetCubeRotation);

function jump() {
  if (playerY === 0) {

    if (consecutiveJumps === 0) {
        consecutiveJumps = 1;
    } else if (isJumping) {
        consecutiveJumps += 1;
    } else {
        consecutiveJumps = 1;
    }
    
    const arrayIndex = (consecutiveJumps >= 2) ? 1 : 0;
    updateJumpVelocity(arrayIndex)

    v = -jumpVelocityCubeBig;
    cube.style.transition = "bottom 500ms ease-in-out";
    cubeRotating = true;
  }
}

function updateJumpVelocity(speedIndex = 0){
    jumpVelocityCubeBig = Math.sqrt(2 * gCubeBig * gridSpacesToPixels(speed[gameSpeed].jumpHeightCubeBig[speedIndex]));
    requestAnimationFrame(updateJumpVelocity);
}
requestAnimationFrame(updateJumpVelocity);

function setPlayerPosition() {
    player.style.bottom = `calc(${groundY} + ${playerY}px)`
    requestAnimationFrame(setPlayerPosition)
}
requestAnimationFrame(setPlayerPosition)