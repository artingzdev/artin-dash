import { colorChannel } from './colors.js';
import { gameSettings } from './game-variables.js';
import { Assets, Sprite } from 'pixi.js';
import { groundY } from './main.js';
import { playerX } from './player.js';
import { degToRad, getRenderedSize, gridSpacesToPixels, randInt } from './utils.js';


const levelObjects = [ // example below
    // {
    //     id: 1,
    //     x: 45,
    //     y: 15
    // },
]



function getValueOfFirstArrayWithKey(nestedArray, key) {
  return nestedArray.find(inner => inner[0] === `${key}`)[1];
}
let colorString = "";











export async function createLevelObjects(b5Container, b4Container, b3Container, b2Container, b1Container, t1Container, t2Container, t3Container, t4Container) {
    const jsonIDs = await Assets.load('json/objects.json');
    // const zLayers = {

    // }

    // -5: B5
    // -3: B4
    // -1: B3
    //  1: B2
    //  3: B1

    //  5: T1
    //  7: T2
    //  9: T3
    // 11: T4    do this future Artin!

    for (const object of levelObjects) {
        if (jsonIDs[object.id]) {
            if (jsonIDs[object.id].frame !== "none") {
                //const objectNames = jsonIDs[object.id].name;
                //const glowNames = jsonIDs[object.id].glow;
                //const color1 = jsonIDs[object.id].c1;

                let objectTexture = await Assets.load(`assets/objects/${jsonIDs[object.id].frame}`);
                console.log(object.id, objectTexture)
                let secondaryTexture = null;
                if (jsonIDs[object.id].children) {
                    secondaryTexture = await Assets.load(`assets/objects/${jsonIDs[object.id].children[0].frame}`);
                }
                let glowTexture = null;

                const objectSprite = new Sprite();
                const secondarySprite = new Sprite();
                const glowSprite = new Sprite();

                // if (objectNames.length === 1) {
                //     objectTexture = await Assets.load(`assets/objects/${objectNames[0]}.png`);
                // } else {
                //     const randomIndex = randInt(0, objectNames.length - 1);
                //     objectTexture = await Assets.load(`assets/objects/${objectNames[randomIndex]}.png`);
                // }
                // if (glowNames) {
                //     if (glowNames.length === 1) {
                //         glowTexture = await Assets.load(`assets/objects/${glowNames[0]}.png`);
                //     }     
                //     glowSprite.texture = glowTexture;

                //     glowSprite.x = playerX + gridSpacesToPixels(object.x / 30);
                //     glowSprite.y = groundY + gridSpacesToPixels(-object.y / 30);
                    
                //     glowSprite.anchor.set (0.5, 0.5)

                //     glowSprite.width = getRenderedSize(glowTexture.width);
                //     glowSprite.height = getRenderedSize(glowTexture.height);  
                    
                //     if (object.r) {glowSprite.rotation = object.r}
                //     if (object.flipH) {glowSprite.scale.x = -1}
                // }



                objectSprite.texture = objectTexture;

                objectSprite.x = playerX + gridSpacesToPixels(object.x / 30);
                objectSprite.y = groundY + gridSpacesToPixels(-object.y / 30);
                
                objectSprite.anchor.set (0.5, 0.5)

                objectSprite.width = getRenderedSize(objectTexture.width);
                objectSprite.height = getRenderedSize(objectTexture.height);

                if (object.r) {objectSprite.rotation = object.r}
                if (object.flipH) {objectSprite.scale.x = -1}
                if (object.flipV) {objectSprite.scale.y = -1}
                if (object.c1 && colorChannel[object.c1]) {objectSprite.tint = colorChannel[object.c1].colorValue}
                if (jsonIDs[object.id].color_channel) {
                    const channelID = parseInt(jsonIDs[object.id].color_channel);
                    objectSprite.tint = colorChannel[channelID].colorValue
                    objectSprite.blendMode = colorChannel[channelID].blending ? 'add' : 'normal';
                    objectSprite.alpha = colorChannel[channelID].opacity;
                }
                else if (jsonIDs[object.id].default_base_color_channel) {
                    const channelID = parseInt(jsonIDs[object.id].default_base_color_channel)
                    objectSprite.tint = colorChannel[channelID].colorValue
                    objectSprite.blendMode = colorChannel[channelID].blending ? 'add' : 'normal';
                    objectSprite.alpha = colorChannel[channelID].opacity;
                }









                if (jsonIDs[object.id].children) {
                    secondarySprite.texture = secondaryTexture;

                    secondarySprite.x = playerX + gridSpacesToPixels((object.x + jsonIDs[object.id].children[0].x) / 30);
                    secondarySprite.y = groundY + gridSpacesToPixels(-(object.y + jsonIDs[object.id].children[0].y) / 30);

                    secondarySprite.anchor.set(0.5, 0.5)
                    secondarySprite.zIndex = jsonIDs[object.id].children[0].z;

                    if (colorChannel[jsonIDs[object.id].children[0].color_channel]) {secondarySprite.tint = colorChannel[jsonIDs[object.id].children[0].color_channel].colorValue;}
                    if (object.c2) {secondarySprite.tint = colorChannel[object.c2].colorValue}

                    if (jsonIDs[object.id].children[0].flip_x) {secondarySprite.scale.x = -1}
                    if (jsonIDs[object.id].children[0].flip_y) {secondarySprite.scale.y = -1}

                    secondarySprite.rotation = degToRad(jsonIDs[object.id].children[0].rot);

                    if (object.r) {secondarySprite.rotation = object.r}
                    if (object.flipH) {secondarySprite.scale.x = -1}
                    if (object.flipV) {secondarySprite.scale.y = -1}
                }








            

                if (jsonIDs[object.id].default_z_layer === -5) {              b5Container.addChild(glowSprite);    b5Container.addChild(objectSprite);  b5Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === -3) {              b4Container.addChild(glowSprite);    b4Container.addChild(objectSprite);  b4Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === -1) {              b3Container.addChild(glowSprite);    b3Container.addChild(objectSprite);  b3Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === 1) {              b2Container.addChild(glowSprite);    b2Container.addChild(objectSprite);  b2Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === 3) {              b1Container.addChild(glowSprite);    b1Container.addChild(objectSprite);  b1Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === 5) {              t1Container.addChild(glowSprite);    t1Container.addChild(objectSprite);  t1Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === 7) {              t2Container.addChild(glowSprite);    t2Container.addChild(objectSprite);  t2Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === 9) {              t3Container.addChild(glowSprite);    t3Container.addChild(objectSprite);  t3Container.addChild(secondarySprite)    }
                if (jsonIDs[object.id].default_z_layer === 11) {              t4Container.addChild(glowSprite);    t4Container.addChild(objectSprite);  t4Container.addChild(secondarySprite)    }

                if (object.zLayer === -5) {              b5Container.addChild(glowSprite);    b5Container.addChild(objectSprite);  b5Container.addChild(secondarySprite)    }
                if (object.zLayer === -3) {              b4Container.addChild(glowSprite);    b4Container.addChild(objectSprite);  b4Container.addChild(secondarySprite)    }
                if (object.zLayer === -1) {              b3Container.addChild(glowSprite);    b3Container.addChild(objectSprite);  b3Container.addChild(secondarySprite)    }
                if (object.zLayer === 1) {              b2Container.addChild(glowSprite);    b2Container.addChild(objectSprite);  b2Container.addChild(secondarySprite)    }
                if (object.zLayer === 3) {              b1Container.addChild(glowSprite);    b1Container.addChild(objectSprite);  b1Container.addChild(secondarySprite)    }
                if (object.zLayer === 5) {              t1Container.addChild(glowSprite);    t1Container.addChild(objectSprite);  t1Container.addChild(secondarySprite)    }
                if (object.zLayer === 7) {              t2Container.addChild(glowSprite);    t2Container.addChild(objectSprite);  t2Container.addChild(secondarySprite)    }
                if (object.zLayer === 9) {              t3Container.addChild(glowSprite);    t3Container.addChild(objectSprite);  t3Container.addChild(secondarySprite)    }
                if (object.zLayer === 11) {              t4Container.addChild(glowSprite);    t4Container.addChild(objectSprite);  t4Container.addChild(secondarySprite)    }                
            }

        }
    }
}












export async function loadLevel(fileName) {
try {
        const levelData = await Assets.load(`levels/${fileName}.txt`);
        //console.log(levelData);

        const sections = levelData.split(';');
        const cleanedSections = sections.filter(section => section.trim() !== '');

        const pairsArray = cleanedSections[0].split(',').reduce((a, v, i) => (i % 2 ? a : [...a, [v]]), [])
                 .map((p, i) => [p[0], cleanedSections[0].split(',')[i * 2 + 1] || '']);
        const objectArray = cleanedSections.splice(1);

        pairsArray.forEach(([key, value]) => {
            
            if (key === "kA2") {gameSettings.gamemode = value}
            if (key === "kA6") {
                if (value < 10) {gameSettings.background = `0${value}`}
                else{gameSettings.background = value}
            }
            if (key === "kA7") {
                if (value < 10) {
                    gameSettings.ground = `0${value}`
                }
                else{
                    gameSettings.ground = value
                }
            }
            if (key === "kA3") {gameSettings.miniMode = value}
            if (key === "kA4") {
                if (value === "0") {gameSettings.gameSpeed = 1}
                else if (value === "1") {gameSettings.gameSpeed = 0}
                else {gameSettings.gameSpeed = value}
            }
            if (key === "kA8") {gameSettings.dualMode = Boolean(value)}
            if (key === "kA11") {gameSettings.flipGravity = Boolean(value)}
            if (key === "kA13") {gameSettings.songOffset = value}
            if (key === "kA15") {gameSettings.fadeIn = Boolean(value)}
            if (key === "kA16") {gameSettings.fadeOut = Boolean(value)}
            if (key === "kA20") {gameSettings.reverseGameplay = Boolean(value)}
            if (key === "kA25") {gameSettings.middleground = `0${value}`}
            if (key === "kA28") {gameSettings.mirrorMode = Boolean(value)}
            if (key === "kS38") {colorString = value}
        });

        const colorsArray = colorString
            .split('|')
            .filter(Boolean)
            .map(ch => 
                ch.split('_')
                .reduce((acc, v, i) => {
                    if (i % 2 === 0) acc.push([v]);
                    else acc[acc.length - 1].push(v);
                    return acc;
                }, [])
            );

        colorsArray.forEach((channel) => {
            channel.forEach(([key, value]) => {
                if (key === "6") {
                    if (!["1005", "1006"].includes(value)) {

                        colorChannel[value] = {};
                        colorChannel[value].colorValue = `rgb(${getValueOfFirstArrayWithKey(channel, 1)}, ${getValueOfFirstArrayWithKey(channel, 2)}, ${getValueOfFirstArrayWithKey(channel, 3)})`;
                        try {
                            if (getValueOfFirstArrayWithKey(channel, 5) === "1") {colorChannel[value].blending = true}
                            else {colorChannel[value].blending = false}  
                        }
                        catch (error) {
                            colorChannel[value].blending = false;
                        }
                        colorChannel[value].opacity = parseFloat(getValueOfFirstArrayWithKey(channel, 7));
                    }   
                }
            });
        });








        // object creation
        objectArray.forEach((object) => {
            const objectProperties = object.split(",");
            const newObject = {};
            for (let i = 0; i < objectProperties.length; i++) {
                if (i % 2 === 0) {
                    if (objectProperties[i] === '1') {  newObject.id = parseInt(objectProperties[i + 1])    }
                    if (objectProperties[i] === '2') {  newObject.x = parseInt(objectProperties[i + 1])    }
                    if (objectProperties[i] === '3') {  newObject.y = parseInt(objectProperties[i + 1])    }
                    if (objectProperties[i] === '4') {  newObject.flipH = true    }
                    if (objectProperties[i] === '5') {  newObject.flipV = true    }
                    if (objectProperties[i] === '6') {  newObject.r = degToRad(parseInt(objectProperties[i + 1]))    }
                    if (objectProperties[i] === '21') {  newObject.c1 = parseInt(objectProperties[i + 1])    }
                    if (objectProperties[i] === '22') {  newObject.c2 = parseInt(objectProperties[i + 1])    }
                    if (objectProperties[i] === '24') {  newObject.zLayer = parseInt(objectProperties[i + 1])     }
                    if (objectProperties[i] === '25') {  newObject.zOrder = parseInt(objectProperties[i + 1])     }
                }
            }
            levelObjects.push(newObject);
        })

} catch (error) {
    console.error(`Error processing ${fileName}.txt:`, error);
}
}

