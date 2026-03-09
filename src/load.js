

import { GameObject } from "./classes/object";
import { Color, colorChannel, defaultLevelChannel, resetColorChannels } from "./colors";
import { gameState } from "./state/gameState";
import { sortContainerByZ } from "./utils";

const LEVEL_BUILD_BATCH_SIZE = 200;

function sortObjectLayers(scene) {
    const layers = [
        scene.b5Layer, scene.b4Layer, scene.b3Layer,
        scene.b2Layer, scene.b1Layer,
        scene.t1Layer, scene.t2Layer, scene.t3Layer, scene.t4Layer
    ];

    layers.forEach(sortContainerByZ);
}

function createLevelObjectsInBatches(scene, objects, objectDefs, onComplete) {
    let index = 0;
    const total = objects.length;

    const createNextBatch = () => {
        const endIndex = Math.min(index + LEVEL_BUILD_BATCH_SIZE, total);

        for (; index < endIndex; index++) {
            new GameObject(scene, objects[index], objectDefs);
        }

        if (typeof scene.updateStaticObjectCulling === "function") {
            scene.updateStaticObjectCulling(true);
        }

        if (index < total) {
            scene.time.delayedCall(0, createNextBatch);
            return;
        }

        sortObjectLayers(scene);
        if (typeof scene.updateStaticObjectCulling === "function") {
            scene.updateStaticObjectCulling(true);
        }

        onComplete();
    };

    createNextBatch();
}

function queueMissingLevelVisualTextures(scene) {
    const textureRequests = [
        {
            key: `background_${gameState.settings.backgroundID}`,
            path: `assets/backgrounds/game_bg_${gameState.settings.backgroundID}_001-uhd.png`
        },
        {
            key: `ground_${gameState.settings.groundID}`,
            path: `assets/grounds/groundSquare_${gameState.settings.groundID}_001-uhd.png`
        },
        {
            key: `ground_${gameState.settings.groundID}_2`,
            path: `assets/grounds/groundSquare_${gameState.settings.groundID}_2_001-uhd.png`
        },
        {
            key: `middleground_${gameState.settings.middlegroundID}`,
            path: `assets/middlegrounds/fg_${gameState.settings.middlegroundID}_001-uhd.png`
        },
        {
            key: `middleground_${gameState.settings.middlegroundID}_2`,
            path: `assets/middlegrounds/fg_${gameState.settings.middlegroundID}_2_001-uhd.png`
        }
    ];

    let queuedCount = 0;
    textureRequests.forEach(({ key, path }) => {
        if (!scene.textures.exists(key)) {
            scene.load.image(key, path);
            queuedCount++;
        }
    });

    return queuedCount;
}

function queueTriggerVisualTextures(scene, objects) {
    if (!Array.isArray(objects) || objects.length === 0) {
        return 0;
    }

    const requests = new Map();

    const addRequest = (key, path) => {
        if (!key || !path || requests.has(key)) return;
        requests.set(key, path);
    };

    objects.forEach((object) => {
        if (!object) return;
        if (object.changeID === undefined || object.changeID === null) return;
        const changeID = String(object.changeID ?? "").padStart(2, "0");

        switch (object.objectId) {
            case 3029: { // change background trigger
                addRequest(
                    `background_${changeID}`,
                    `assets/backgrounds/game_bg_${changeID}_001-uhd.png`
                );
                break;
            }
            case 3030: { // change ground trigger
                addRequest(
                    `ground_${changeID}`,
                    `assets/grounds/groundSquare_${changeID}_001-uhd.png`
                );
                addRequest(
                    `ground_${changeID}_2`,
                    `assets/grounds/groundSquare_${changeID}_2_001-uhd.png`
                );
                break;
            }
            case 3031: { // change middleground trigger
                addRequest(
                    `middleground_${changeID}`,
                    `assets/middlegrounds/fg_${changeID}_001-uhd.png`
                );
                addRequest(
                    `middleground_${changeID}_2`,
                    `assets/middlegrounds/fg_${changeID}_2_001-uhd.png`
                );
                break;
            }
        }
    });

    let queuedCount = 0;
    requests.forEach((path, key) => {
        if (!scene.textures.exists(key)) {
            scene.load.image(key, path);
            queuedCount++;
        }
    });

    return queuedCount;
}

function applyLevelVisualState(scene) {
    const bg = scene.backgroundLayerRef;
    const mg = scene.middlegroundLayerRef;
    const ground = scene.groundLayerRef;
    const ceiling = scene.ceilingLayerRef;

    if (bg) {
        bg.updateColor();
        bg.updateTexture(scene);
    }
    if (mg) {
        mg.updateColor();
        mg.updateTexture(scene);
    }
    if (ground) {
        ground.updateColor();
        ground.updateTexture(scene);
    }
    if (ceiling) {
        ceiling.updateColor();
        ceiling.updateTexture(scene);
    }
}

export function loadLevel(scene, key, url, callback) {
    scene.load.json(key, url);

    scene.load.once(`filecomplete-json-${key}`, () => {
        const data = scene.cache.json.get(key);
        const objectDefs = scene.cache.json.get('objects');

        const header = data.header;
        const objects = data.objects;

        gameState.triggers = []; // reset existing level trigger values

        // header
        if (header.gamemode !== undefined) {
            gameState.player.gamemode = header.gamemode;
            gameState.levelDefaults.player.gamemode = header.gamemode;
        }  else {
            gameState.player.gamemode = 0;
            gameState.levelDefaults.player.gamemode = 0; // do these for the rest of them (update level defaults if exists)
        } 
        if (header.backgroundTextureId !== undefined) {
            gameState.settings.backgroundID = header.backgroundTextureId === 0 ? "01" : String(header.backgroundTextureId).padStart(2, "0");
            gameState.levelDefaults.settings.backgroundID = header.backgroundTextureId === 0 ? "01" : String(header.backgroundTextureId).padStart(2, "0");
        } else {
            gameState.settings.backgroundID = "01";
            gameState.levelDefaults.settings.backgroundID = "01";
        } 
        if (header.groundTextureId !== undefined)
            gameState.settings.groundID =
                header.groundTextureId === 0
                    ? "01"
                    : String(header.groundTextureId).padStart(2, "0"); else gameState.settings.groundID = "01";
        if (gameState.levelDefaults) {
            if (header.groundTextureId !== undefined)
                gameState.levelDefaults.settings.groundID =
                    header.groundTextureId === 0
                        ? "01"
                        : String(header.groundTextureId).padStart(2, "0"); else gameState.levelDefaults.settings.groundID = "01";
        }
        if (header.miniMode !== undefined) gameState.player.miniMode = header.miniMode; else gameState.player.miniMode = false;
        if (gameState.levelDefaults) {
            if (header.miniMode !== undefined) gameState.levelDefaults.player.miniMode = header.miniMode; else gameState.levelDefaults.player.miniMode = false;
        }
        if (header.speed !== undefined)
            gameState.settings.gameSpeed =
                header.speed === 0 ? 1 :
                header.speed === 1 ? 0 :
                header.speed; else gameState.settings.gameSpeed = 1;
        if (gameState.levelDefaults) {
            if (header.speed !== undefined)
                gameState.levelDefaults.settings.gameSpeed =
                    header.speed === 0 ? 1 :
                    header.speed === 1 ? 0 :
                    header.speed; else gameState.levelDefaults.settings.gameSpeed = 1;
        }
        if (header.dualMode !== undefined) gameState.player.dualMode = header.dualMode; else gameState.player.dualMode = false;
        if (gameState.levelDefaults) {
            if (header.dualMode !== undefined) gameState.levelDefaults.player.dualMode = header.dualMode; else gameState.levelDefaults.player.dualMode = false;
        }
        if (header.flipGravity !== undefined) gameState.player.flipGravity = header.flipGravity; else gameState.settings.flipGravity = false;
        if (gameState.levelDefaults) {
            if (header.flipGravity !== undefined) gameState.levelDefaults.player.flipGravity = header.flipGravity; else gameState.levelDefaults.settings.flipGravity = false;
        }
        if (header.songOffset !== undefined) gameState.settings.songOffset = header.songOffset; else gameState.settings.songOffset = 0;
        if (gameState.levelDefaults) {
            if (header.songOffset !== undefined) gameState.levelDefaults.settings.songOffset = header.songOffset; else gameState.levelDefaults.settings.songOffset = 0;
        }
        if (header.fadeIn !== undefined) gameState.settings.fadeIn = header.fadeIn; else gameState.settings.fadeIn = false;
        if (gameState.levelDefaults) {
            if (header.fadeIn !== undefined) gameState.levelDefaults.settings.fadeIn = header.fadeIn; else gameState.levelDefaults.settings.fadeIn = false;
        }
        if (header.fadeOut !== undefined) gameState.settings.fadeOut = header.fadeOut; else gameState.settings.fadeOut = false;
        if (gameState.levelDefaults) {
            if (header.fadeOut !== undefined) gameState.levelDefaults.settings.fadeOut = header.fadeOut; else gameState.levelDefaults.settings.fadeOut = false;
        }
        if (header.reverseGameplay !== undefined) gameState.settings.reverseGameplay = header.reverseGameplay; else gameState.settings.reverseGameplay = false;
        if (gameState.levelDefaults) {
            if (header.reverseGameplay !== undefined) gameState.levelDefaults.settings.reverseGameplay = header.reverseGameplay; else gameState.levelDefaults.settings.reverseGameplay = false;
        }
        if (header.middlegroundTextureId !== undefined) gameState.settings.middlegroundID = String(header.middlegroundTextureId).padStart(2, "0"); else gameState.settings.middlegroundID = "00";
        if (gameState.levelDefaults) {
            if (header.middlegroundTextureId !== undefined) gameState.levelDefaults.settings.middlegroundID = String(header.middlegroundTextureId).padStart(2, "0"); else gameState.levelDefaults.settings.middlegroundID = "00";
        }
        if (header.mirrorMode !== undefined) gameState.settings.mirrorMode = header.mirrorMode; else gameState.settings.mirrorMode = false;
        if (gameState.levelDefaults) {
            if (header.mirrorMode !== undefined) gameState.levelDefaults.settings.mirrorMode = header.mirrorMode; else gameState.levelDefaults.settings.mirrorMode = false;
        }



        // color channels
        resetColorChannels(); // reset before loading a new level
        if (header.color && Array.isArray(header.color)) {

            header.color.forEach(channel => {

                const channelID = Number(channel["6"]);

                if (["1005", "1006", "1010", "1011"].includes(String(channelID)))
                    return;

                const fromR = Number(channel["1"] ?? 0);
                const fromG = Number(channel["2"] ?? 0);
                const fromB = Number(channel["3"] ?? 0);

                const blending = Boolean(Number(channel["5"] ?? 0));

                const fromOpacity = Number(channel["7"] ?? 1);

                const toR = Number(channel["11"] ?? fromR);
                const toG = Number(channel["12"] ?? fromG);
                const toB = Number(channel["13"] ?? fromB);

                const toOpacity = Number(channel["15"] ?? fromOpacity);
                const duration = Number(channel["16"] ?? 0);

                colorChannel[channelID] = new Color(
                    fromR, fromG, fromB,
                    fromOpacity,
                    blending,
                    toR, toG, toB,
                    toOpacity,
                    duration
                );

                defaultLevelChannel[channelID] = new Color(
                    fromR, fromG, fromB,
                    fromOpacity,
                    blending,
                    toR, toG, toB,
                    toOpacity,
                    duration
                );
            });
        }

        // objects
        if (Array.isArray(scene.staticObjects)) {
            scene.staticObjects.length = 0;
        }
        if (Array.isArray(scene.dynamicObjects)) {
            scene.dynamicObjects.length = 0;
        }

        const beginObjectBuild = () => {
            applyLevelVisualState(scene);
            createLevelObjectsInBatches(scene, objects, objectDefs, callback);
        };

        const queuedVisualTextures =
            queueMissingLevelVisualTextures(scene) +
            queueTriggerVisualTextures(scene, objects);

        if (queuedVisualTextures > 0) {
            scene.load.once('complete', beginObjectBuild);
            return;
        }

        beginObjectBuild();
    });

    scene.load.start();
}
