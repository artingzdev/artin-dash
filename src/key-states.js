import { physics } from "./physics";

// jump input state
export let jumpHeld = false;
export let iHeld = false;
export let kHeld = false;
export let gHeld = false;
export let tHeld = false;

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
    else if (
        e.code === "KeyK"
    ) {
        kHeld = true;
    }
    else if (
        e.code === "KeyI"
    ) {
        iHeld = true;
    }

    if (e.code === "KeyG") {
        gHeld = true;
    }
    else if (e.code === "KeyT") {
        tHeld = true;
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
    else if (
        e.code === "KeyK"
    ) {
        kHeld = false;
    }
    else if (
        e.code === "KeyI"
    ) {
        iHeld = false;
    }
    if (e.code === "KeyG") {
        gHeld = false;
    }
    else if (e.code === "KeyT") {
        tHeld = false;
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