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
    
    const formattedResult = `rgb(${result.r}, ${result.g}, ${result.b})`

    colorChannel[1007].colorValue = formattedResult;
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

export const colorChannel = {
    1000: {                                   // background
        colorValue: "rgb(40, 125, 255)",
        blending: false,
        opacity: 1,
    },         
    1001: {                                   // ground 1
        colorValue: "rgb(0, 102, 255)",
        blending: false,
        opacity: 1,
    },
    1002: {                                   // line
        colorValue: "rgb(255, 255, 255)",
        blending: false,
        opacity: 1,
    },
    1003: {                                   // 3D line
        colorValue: "rgb(255, 255, 255)",
        blending: false,
        opacity: 1,
    },
    1004: {                                   // obj
        colorValue: "rgb(255, 255, 255)",
        blending: false,
        opacity: 1,
    },           
    1005: {                                   // player 1
        colorValue: "rgb(125, 255, 0)",
        blending: false,
        opacity: 1,
    },
    1006: {                                   // player 2
        colorValue: "rgb(0, 255, 255)",
        blending: false,
        opacity: 1,
    },
    1007: {                                   // light background
        blending: true,
        opacity: 1
    },                                 
    1009: {                                   
        colorValue: "rgb(0, 102, 255)",    // ground 2
        blending: false,
        opacity: 1,
    },
    1010: {                                  // black
        colorValue: "rgb(0, 0, 0)",
        blending: false,
        opacity: 1,
    },
    1011: {                                 // white
        colorValue: "rgb(255, 255, 255)",
        blending: false,
        opacity: 1,
    },
    1012: {                                 // lighter
        colorValue: "rgb(255, 255, 255)",
        blending: false,
        opacity: 1,
    },
    1013: {                                 // middleground 1
        colorValue: "rgb(40, 125, 255)",
        //colorValue: "rgb(0, 255, 98)",
        blending: false,
        opacity: 1,
    },
    1014: {                                 // middleground 2
        colorValue: "rgb(40, 125, 255)",
        //colorValue: "rgb(255, 40, 40)",
        blending: false,
        opacity: 1,
    },
}