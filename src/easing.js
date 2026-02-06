export function easeOutQuad(t) { // to learn
    return 1 - Math.pow(1 - t, 2);
}

export function lerp(a, b, t) {
    return a + (b - a) * t
}

export function easeInOut(a, b, t, e) {
    t *= 2
    
    let eased;

    if (t < 1) {
        eased = Math.pow(t, e) / 2
    } else {
        eased = 1 - Math.pow(2 - t, e) / 2
    }

    return a + (b - a) * eased;
}