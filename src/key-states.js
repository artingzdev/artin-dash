// jump input state
export let jumpHeld = false;

// keyboard input
window.addEventListener("keydown", (e) => {
    if (
        e.code === "KeyW" ||
        e.code === "Space" ||
        e.code === "ArrowUp"
    ) {
        jumpHeld = true;
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    if (
        e.code === "KeyW" ||
        e.code === "Space" ||
        e.code === "ArrowUp"
    ) {
        jumpHeld = false;
        e.preventDefault();
    }
});

// mouse input
window.addEventListener("mousedown", (e) => {
    if (e.button === 0) { // left mouse button
        jumpHeld = true;
    }
});

window.addEventListener("mouseup", () => {
    jumpHeld = false;
});

// mobile touch input
window.addEventListener("touchstart", (e) => {
    jumpHeld = true;
    e.preventDefault();
}, { passive: false });

window.addEventListener("touchend", () => {
    jumpHeld = false;
});

window.addEventListener("touchcancel", () => {
    jumpHeld = false;
});