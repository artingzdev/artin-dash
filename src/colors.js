export class Color {
    constructor(fromR = 0, fromG = 0, fromB = 0, fromOpacity = 1, blending = false, toR = fromR, toG = fromG, toB = fromB, toOpacity = fromOpacity, duration = 0, easing = 'Linear') {
        this.fromR = fromR;
        this.fromG = fromG;
        this.fromB = fromB;
        this.blending = blending;
        this.fromOpacity = fromOpacity;        

        this.toR = toR !== null && toR !== undefined ? toR : fromR;
        this.toG = toG !== null && toG !== undefined ? toG : fromG;
        this.toB = toB !== null && toB !== undefined ? toB : fromB;
        this.toOpacity = toOpacity !== null && toOpacity !== undefined ? toOpacity : fromOpacity;
        if (duration !== null && duration !== undefined && duration !== undefined) {
            this.duration = 0
        } else {
            this.duration = duration;
        }
        this.easing = easing !== null && easing !== undefined ? easing : 'Linear';
    }

    toTint() {
        return (this.fromR << 16) | (this.fromG << 8) | this.fromB;
    }

    toRGBString() {
        return `rgb(${this.fromR}, ${this.fromG}, ${this.fromB})`;
    }

    setTarget(r, g, b, duration = 0, easing = 'Linear') {
        this.toR = r;
        this.toG = g;
        this.toB = b;
        this.duration = duration;
        this.easing = easing;
    }
}

export function RGBToTint(r, g, b) {
    return (r << 16) | (g << 8) | b;
}

export function tintToRGB(tint) {
    return {
        r: (tint >> 16) & 0xFF,
        g: (tint >> 8) & 0xFF,
        b: tint & 0xFF
    };
}

export function setLightBg(bg, p1) {

    let bgRgb;
    
    if (typeof bg === 'string' && bg.startsWith('rgb(')) {
        bgRgb = parseRgbString(bg);
    } else if (bg && typeof bg === 'object' && 'r' in bg && 'g' in bg && 'b' in bg) {
        bgRgb = bg;
    } else {
        throw new Error('bg must be either {r,g,b} object or "rgb(r,g,b)" string');
    }


    if (!p1 || typeof p1 !== 'object' || !('r' in p1)) {
        throw new Error('p1 must be {r,g,b} object');
    }

    const hsv = rgbToHsv(bgRgb.r, bgRgb.g, bgRgb.b);
    

    hsv.s = Math.max(0, hsv.s - 20);
    
    const lightened = hsvToRgb(hsv.h, hsv.s, hsv.v);
    

    const mix = hsv.v / 100;
    
    const result = {
        r: Math.round(p1.r * (1 - mix) + lightened.r * mix),
        g: Math.round(p1.g * (1 - mix) + lightened.g * mix),
        b: Math.round(p1.b * (1 - mix) + lightened.b * mix)
    };

    colorChannel[1007].fromR = result.r;
    colorChannel[1007].fromG = result.g;
    colorChannel[1007].fromB = result.b;
}

export function parseRgbString(str) {
    const match = str.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
    if (!match) {
        throw new Error('Invalid rgb string format. Use: rgb(r, g, b)');
    }
    
    const [, r, g, b] = match;
    return {
        r: Math.min(255, Math.max(0, parseInt(r, 10))),
        g: Math.min(255, Math.max(0, parseInt(g, 10))),
        b: Math.min(255, Math.max(0, parseInt(b, 10)))
    };
}

// RGB(0-255) → HSV (h:0-360, s:0-100, v:0-100)
export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    const v = max * 100;
    const s = max === 0 ? 0 : (delta / max) * 100;
    
    if (delta !== 0) {
        switch (max) {
            case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: h = (b - r) / delta + 2; break;
            case b: h = (r - g) / delta + 4; break;
        }
        h *= 60;
    }
    
    return { h, s, v };
}

export function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    const sector = Math.floor(h / 60);
    
    switch (sector) {
        case 0:  r = c; g = x; b = 0; break;
        case 1:  r = x; g = c; b = 0; break;
        case 2:  r = 0; g = c; b = x; break;
        case 3:  r = 0; g = x; b = c; break;
        case 4:  r = x; g = 0; b = c; break;
        case 5:  r = c; g = 0; b = x; break;
    }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

export function cssToObject(color){

    const r = color.split("(")[1].split(")")[0].split(",")[0]
    const g = color.split("(")[1].split(")")[0].split(",")[1]
    const b = color.split("(")[1].split(")")[0].split(",")[2]

    return {
        r,
        g,
        b
    }
}
 
export let colorChannelDefault = {
    1000: new Color(166, 166, 166, 1, false),  // background
    1001: new Color(166, 166, 166, 1, false),   // ground 1
    1002: new Color(255, 255, 255, 1, false), // line
    1003: new Color(255, 255, 255, 1, false), // 3D line
    1004: new Color(255, 255, 255, 1, false), // obj
    1005: new Color(255, 255, 0, 1, true),    // player 1
    1006: new Color(0, 255, 255, 1, true),    // player 2
    1007: new Color(125, 125, 125, 1, true),  // light background
    1009: new Color(166, 166, 166, 1, false),   // ground 2
    1010: new Color(0, 0, 0, 1, false),       // black
    1011: new Color(255, 255, 255, 1, false), // white
    1012: new Color(125, 125, 125, 1, true),  // lighter
    1013: new Color(166, 166, 166, 1, false),   // middleground 1
    1014: new Color(166, 166, 166, 1, false),   // middleground 2
    10000: new Color(255, 255, 255, 1, false)  // player glow (custom)
}

export let colorChannel = colorChannelDefault;
export let defaultLevelChannel = colorChannelDefault;

export const resetColorChannels = () => {
  colorChannel = colorChannelDefault;
  defaultLevelChannel = colorChannelDefault;
};

export const resetLevelChannels = (scene) => {
    colorChannel = defaultLevelChannel;

    scene.backgroundLayerRef.updateColor();
    scene.groundLayerRef.updateColor();
    scene.middlegroundLayerRef.updateColor();
}   