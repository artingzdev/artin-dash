import { colorChannel } from './colors.js';
import { gameState } from './state/gameState.js';

export function clampMinMax(num, min, max) {
    num = Math.max(Math.min(num, max), min);
}

export function gridSpacesToPixels(gridSpaces) {
    if (gameState.screen.height <= 0 || gameState.screen.height === null) {
        return 0;
    }

    return Math.round(gameState.screen.height / (320 / (gridSpaces * 30)));
}

export function unitsToPixels(units, round = true) {
    if (gameState.screen.height <= 0 || gameState.screen.height === null) {
        return 0;
    }

    if (round == false) {
        return gameState.screen.height / (320 / units);
    }
    else {
        return Math.round(gameState.screen.height / (320 / units));
    }
    
}

export function getRenderedSize(pixels, round = true) {
    if (gameState.screen.height <= 0 || gameState.screen.height === null) {
        return 0;
    }

    if (round == false) return gameState.screen.height / (320 / (pixels / 4));
    else return Math.round(gameState.screen.height / (320 / (pixels / 4)));
    
}

export function getTextureDimensions(scene, textureName, frameName) {
    if (frameName) {
        try {
            const frame = scene.textures.get(textureName).get(frameName);
            return {
                width: frame.data.sourceSize.w,
                height: frame.data.sourceSize.h
            };
        } catch(error) { console.error(`Error when getting texture dimensions of frame "${frameName}" in atlas "${textureName}": ${error}`) }
    } else {
        const texture = scene.textures.get(textureName);
        try {
            const texWidth = texture.source[0].image.width;
            const texHeight = texture.source[0].image.height;
            return {
                width: texWidth,
                height: texHeight
            };
        } catch(error) { console.error(`Error when getting texture dimensions of "${textureName}": ${error}`) }       
    }
}

export function setRenderedSize(gameObject) {
    const width = gameObject.frame.source.width;
    const height = gameObject.frame.source.height;

    gameObject.setDisplaySize(getRenderedSize(width), getRenderedSize(height));
}

export function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randSign() { return Math.random() < 0.5 ? -1 : 1 }

export function computeJumpDist(g, h, vx) {
    return 2 * vx * Math.sqrt(2 * h / g);
}

export function computeVelX(g, h, D) {
    return D / 2 * Math.sqrt(g / (2 * h));
}

export function computeJumpVelocity(g, h) {
    return Math.sqrt(2 * g * h);
}

export function computeVelXFromLandingCoords(g, h, x, y) {
    /*
     used to calculate the horizontal velocity of the player
     on special jumps (4x1, 3x2, 2x2, and 4x2)
     */
    const numerator = x * g;

    const term1 = Math.sqrt(2 * g * h);
    const term2 = Math.sqrt(2 * g * (h - y));

    const denominator = term1 + term2;

    return numerator / denominator;
}

export function computeVelXFromLandingCoordsDiscrete(g, h, x, y, dt, maxSteps = 10000) {
    /*
     Computes horizontal speed that lands on a target using the same
     per-step integration model used by Player.update().
     y is specified as "blocks up" distance in positive units.
     */
    const jumpVelocity = computeJumpVelocity(g, h);
    const targetY = -Math.abs(y);

    let velocityY = -jumpVelocity;
    let posY = 0;

    for (let i = 1; i <= maxSteps; i++) {
        velocityY += g * dt;
        posY += velocityY * dt;

        if (velocityY > 0 && posY >= targetY) {
            const flightTime = i * dt;
            return x / flightTime;
        }
    }

    return computeVelXFromLandingCoords(g, h, x, y);
}

export function computeAcceleration(velX, h, D) {
    return (8 * velX * velX * h) / (D * D);
}

export function RGBStringToTint(string) {
    const trimmedString = string.replace(" ", "");
    const stringArray = trimmedString.split("(")[1].split(")")[0].split(",");
    const numArray = stringArray.map(Number);
    
    return (numArray[0] << 16) | (numArray[1] << 8) | numArray[2];
}

export function getGamePlayerColor(pUsedChannel) {
    const p1 = colorChannel[1005].toRGBString();
    const p2 = colorChannel[1006].toRGBString();
    const pUsed = colorChannel[pUsedChannel].toRGBString();
    const black = "rgb(0, 0, 0)";

    if (p1 === black & p2 === black) return RGBStringToTint("rgb(255, 255, 255)");
    else if (pUsed === p1 && p1 === black) return RGBStringToTint(p2);
    else if (pUsed === p2 && p2 === black) return RGBStringToTint(p1);
    else return RGBStringToTint(pUsed);
}

export function setColorChannel(gameObject, colorChannelID) {
    if ([1005, 1006].includes(colorChannelID)) {
        gameObject.tint = getGamePlayerColor(colorChannelID);
    } else gameObject.tint = colorChannel[colorChannelID].toTint();

    gameObject.alpha = colorChannel[colorChannelID].fromOpacity;
    if (colorChannel[colorChannelID].blending || [1005, 1006].includes(colorChannelID)) {
        gameObject.setBlendMode(Phaser.BlendModes.ADD);
    }
    else 
    {
        gameObject.setBlendMode(Phaser.BlendModes.NORMAL);
    }
}

export function setZOrder(parentContainer, child, z) {
    if (!child) return;
    child._z = z;
}

export function sortContainerByZ(parentContainer) {
    if (!parentContainer) return;

    parentContainer.list.forEach(obj => {
        if (obj._z === undefined) obj._z = 0;
    });

    parentContainer.list.sort((a, b) => a._z - b._z);

    parentContainer.list.forEach(obj => {
        parentContainer.bringToTop(obj);
    });
}

export function getParticleScale(scene, texture, frame, size) {
    if (!frame) return;
    return (unitsToPixels(1, false) / scene.textures.get(texture).get(frame).width) * size;
}
