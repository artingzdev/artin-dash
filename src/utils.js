import { colorChannel } from './colors.js';
import { camera } from './game-variables.js';
import { app } from './main.js';

export const degToRad = deg => deg * Math.PI / 180;
export const radToDeg = rad => rad * 180/Math.PI;

export const dvhToPx = dvh => (dvh/100) * app.screen.height;

export function gridSpacesToPixels(gridSpaces) {
    if (window.innerHeight <= 0) {
        return 0;
    }

    const pixels = 0.093 * window.innerHeight * gridSpaces;
    return pixels;
}

export function pixelsToGridSpaces(pixels) {
    if (window.innerHeight <= 0) {
        return 0;
    }
    
    const pixelsPerGridSpace = 0.093 * window.innerHeight;
    return pixels / pixelsPerGridSpace;
}

export function getRenderedSize(pixels) {
    let renderedSize = 0.093 * window.innerHeight * (pixels / 120);
    return renderedSize;
}

export function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randSign() { return Math.random() < 0.5 ? -1 : 1 }


export function getGamePlayerColor(pUsed) {
    const p1 = colorChannel[1005].colorValue;
    const p2 = colorChannel[1006].colorValue;
    const black = "rgb(0, 0, 0)";

    if (p1 === black & p2 === black) return "rgb(255, 255, 255)";
    else if (pUsed === p1 && p1 === black) return p2;
    else if (pUsed === p2 && p2 === black) return p1;
    else return pUsed;
}

export function setObjectColorChannel(object, channelID) {
    if (!colorChannel[channelID]) return;



    if (channelID === 1005 || channelID === 1006) {
        object.tint = getGamePlayerColor(colorChannel[channelID].colorValue);
    } else {
        object.tint = colorChannel[channelID].colorValue
    }
    object.blendMode = colorChannel[channelID].blending ? 'add' : 'normal';
    object.alpha = colorChannel[channelID].opacity;
}