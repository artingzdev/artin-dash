
const keysPressed = {};
let leftMouseDown = false;
let isGroundDouble = false;

// ── Keyboard controls ───────────────────────────────────────
document.addEventListener('keydown', (event) => {
    keysPressed[event.code] = true;
    keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.code] = false;
    keysPressed[event.key] = false;
    
    // Reset jump state when jump keys are released
    if (event.code === 'Space' || event.key === 'ArrowUp' || event.key === 'w') {
        isJumping = false;
    }

    if (event.key === 'd') {
        drawDebugTrail = !drawDebugTrail;
    }

    if (event.key === '0') {gameSpeed = 0}
    if (event.key === '1') {gameSpeed = 1}
    if (event.key === '2') {gameSpeed = 2}
    if (event.key === '3') {gameSpeed = 3}
    if (event.key === '4') {gameSpeed = 4}

    if (event.key === 'y') {
        isSlowModeEnabled = !isSlowModeEnabled;
    }

    if (event.key == 'Escape') {
        resetGrounds();
    }
});

window.addEventListener("blur", () => {
    Object.keys(keysPressed).forEach(key => keysPressed[key] = false);
    leftMouseDown = false;
});

// ── Mouse controls) ─────────────────────
document.addEventListener('mousedown', (e) => {
    if (e.button === 0) leftMouseDown = true;
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) leftMouseDown = false;
});

// ── Mobile touch support ────────────────────────────────────
document.addEventListener('touchstart', (e) => {
    
    isJumping = true;
    jump();
}, { passive: false });

document.addEventListener('touchend', () => {
    isJumping = false;
});

// ── Main input check ──
let lastInputCheck = performance.now();

function checkInput(currentTime) {
    const dt = (currentTime - lastInputCheck) / 1000;
    lastInputCheck = currentTime;

    const jumpInputActive = 
        keysPressed['Space'] || 
        keysPressed['ArrowUp'] || 
        keysPressed['KeyW'] || 
        leftMouseDown;

    if (jumpInputActive) {
        isJumping = true;
        jump();
    } else {

        if (!('ontouchstart' in window)) {
            isJumping = false;
        }
    }

    if (keysPressed['Enter']) {
        setGroundsDistance(10);
    }

    requestAnimationFrame(checkInput);
}

requestAnimationFrame(checkInput);