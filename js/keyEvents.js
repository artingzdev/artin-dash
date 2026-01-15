const keysPressed = {};
let leftMouseDown = false;

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
});

window.addEventListener("blur", () => {
    Object.keys(keysPressed).forEach(key => keysPressed[key] = false);
    leftMouseDown = false;
});

// ── Mouse controls (mainly for desktop) ─────────────────────
document.addEventListener('mousedown', (e) => {
    if (e.button === 0) leftMouseDown = true;
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) leftMouseDown = false;
});

// ── Mobile touch support ────────────────────────────────────
document.addEventListener('touchstart', (e) => {
    // Prevent scrolling/zooming on some mobile browsers
    // e.preventDefault();   ← uncomment only if needed (can break scrolling elsewhere)
    
    isJumping = true;
    jump();
}, { passive: false });   // passive: false needed if you use preventDefault()

document.addEventListener('touchend', () => {
    isJumping = false;
});

// ── Main input check (still useful for holding jump on desktop) ──
let lastInputCheck = performance.now();

function checkInput(currentTime) {
    const dt = (currentTime - lastInputCheck) / 1000;
    lastInputCheck = currentTime;

    // Desktop/keyboard/mouse jump (hold to jump or continuous check)
    const jumpInputActive = 
        keysPressed['Space'] || 
        keysPressed['ArrowUp'] || 
        keysPressed['KeyW'] || 
        leftMouseDown;

    if (jumpInputActive) {
        isJumping = true;
        jump();
    } else {
        // Only reset on desktop input release (mobile uses touchend)
        if (!('ontouchstart' in window)) {
            isJumping = false;
        }
    }

    if (keysPressed['Enter']) {
        setGroundsDistance(8);
    }

    // console.log(groundY); // ← uncomment for debugging

    requestAnimationFrame(checkInput);
}

requestAnimationFrame(checkInput);