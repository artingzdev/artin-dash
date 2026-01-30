import { app } from './main.js';

export const degToRad = deg => deg * Math.PI / 180;
export const radToDeg = rad => rad * 180/Math.PI;

export const dvhToPx = dvh => (dvh/100) * app.screen.height;

export function gridSpacesToPixels(gridSpaces) {
    let pixels = 0.093 * window.innerHeight * gridSpaces;
    return pixels;

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