import { app } from './main.js';

export const degToRad = deg => deg * Math.PI / 180;
export const radToDeg = rad => rad * 180/Math.PI;
export const dvhToPx = dvh => (dvh/100) * app.screen.height;

export function gridSpacesToPixels(gridSpaces) {
    let pixels = 0;
    try{
        pixels = 0.093 * app.screen.height * gridSpaces;
        return pixels;
    }
    catch(error) {
        pixels = 0.093 * window.innerHeight * gridSpaces;
        return pixels;
    }

}

export function getRenderedSize(pixels) {
    let renderedSize = 0;
    try{
        renderedSize = 0.093 * app.screen.height * (pixels / 120);
        return renderedSize;
    }
    catch(error) {
        renderedSize = 0.093 * window.innerHeight * (pixels / 120);
        return renderedSize;
    }

}