import { colorChannel } from './colors.js';
import { gameSettings } from './game-variables.js';
import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { groundY } from './main.js';
import { playerX } from './player.js';
import { degToRad, getGamePlayerColor, getRenderedSize, gridSpacesToPixels, randInt, randSign, setObjectColorChannel } from './utils.js';


let levelObjects = [ // example below
    // {
    //     id: 1707,
    //     x: 15,
    //     y: 15,
    //     // c1: 9998,
    //     // c2: 9999,
    //     r: 0,
    //     flipH: false,
    //     flipV: false,
    //     zLayer: 5
    // },
]

export let rotatingObjects = []; // list of rotating decorations in the level along with their rotation speeds

/*  --- OBJECT TYPES ---------
    0: solid
    2: hazard
    3: inverse gravity portal
    4: normal gravity portal
    5: ship portal
    6: cube portal
    7: decoration
    8: yellow jump pad
    9: pink jump pad
    10: gravity pad
    11: yellow jump ring
    12: pink jump ring
    13: gravity ring
    14: inverse mirror portal
    15: normal mirror portal
    16: ball portal
    17: regular size portal
    18: mini size portal
    19: ufo portal
    20: modifier
    21: breakable
    22: secret coin
    23: dual portal
    24: dual off portal
    25: slope
    26: wave portal
    27: robot portal
    28: teleport portal
    29: green ring
    30: collectible
    31: user coin
    32: drop ring
    33: spider portal
    34: red jump pad
    35: red jump ring
    36: custom ring
    37: dash ring
    38: gravity dash ring
    39: collision object
    40: special
    41: swing portal
    42: gravity toggle portal
    43: spider portal
    44: spider pad
    45: enter effect object
    46: teleport orb
    47: animated hazard
*/


function getValueOfFirstArrayWithKey(nestedArray, key) {
  return nestedArray.find(inner => inner[0] === `${key}`)[1];
}
let colorString = "";









export async function createLevelObjects(b5Container, b4Container, b3Container, b2Container, b1Container, t1Container, t2Container, t3Container, t4Container, portalBackContainer) {
    rotatingObjects = [];
    const jsonIDs = await Assets.load('json/objects.json');





    
    for (const object of levelObjects) {

        // --------- BASE OBJECT --------------
        const data = jsonIDs[object.id];
        if (!data || data.frame === "none") continue;
        if (data.frame.startsWith('edit')) continue; // hide editor-only objects

        const scaleX = object.flipH ? -1 : 1;
        const scaleY = object.flipV ? -1 : 1;

        const objectContainer = new Container();
        const portalBackObjectContainer = new Container();

        const objectTexture = Texture.from(data.frame);

        const objectSprite = new Sprite(objectTexture);
        if (data.anchor_x || data.anchor_y) {
            objectSprite.anchor.set(0.5 + data.anchor_x, 0.5 + data.anchor_y);
        } else {
            objectSprite.anchor.set(0.5);
        }
    
        objectSprite.cullable = true;

        objectSprite.width  = getRenderedSize(objectTexture.width);
        objectSprite.height = getRenderedSize(objectTexture.height);

        if (data.rot) objectSprite.rotation = degToRad(data.rot);
        if (object.r) objectSprite.rotation += degToRad(object.r);


        if (data.default_base_color_channel) {
            setObjectColorChannel(objectSprite, data.default_base_color_channel);
        }
        if (data.color_channel) {
            setObjectColorChannel(objectSprite, data.color_channel);
        }
        if (data.color_layer === "1") {
            if (object.c1 && data.colorable) {
                setObjectColorChannel(objectSprite, object.c1);
            }            
        } else if (data.color_layer === "2") {
            if (object.c2 && data.colorable) {
                setObjectColorChannel(objectSprite, object.c2);
            }   
        } else {
            if (object.c1 && data.colorable) {
                setObjectColorChannel(objectSprite, object.c1);
            }   
        }

        // --------- CHILDREN OBJECTS --------------
        let childrenSprites = [];

        if (data.children) {  // create the child objects if they exist
            for (const child of data.children) {
                let childSprite = null;
                //const child = data.children[i];
                const childTexture = Texture.from(child.frame);

                childSprite = new Sprite(childTexture);
                childSprite.cullable = true;

                childSprite.width  = getRenderedSize(childTexture.width);
                childSprite.height = getRenderedSize(childTexture.height);

                childSprite.anchor.x = child.anchor_x + 0.5;
                childSprite.anchor.y = child.anchor_y + 0.5;

                childSprite.zIndex = child.z;
                if (child.y) childSprite.y -= gridSpacesToPixels(child.y / 30);
                if (child.x) childSprite.x += gridSpacesToPixels(child.x / 30);

                if (child.flip_x) childSprite.scale.x *= -1;
                if (child.flip_y) childSprite.scale.y *= -1;

                if (object.r) childSprite.rotation = degToRad(child.rot + object.r);
                else childSprite.rotation = degToRad(child.rot);
                
                if (child.default_color_channel) {
                    setObjectColorChannel(childSprite, child.default_color_channel);
                }

                if (colorChannel[child.color_channel]) {
                    childSprite.tint = colorChannel[child.color_channel].colorValue;
                }
                if (child.color_layer === "1") {
                    if (object.c1 && child.colorable) {
                        setObjectColorChannel(childSprite, object.c1);
                    }
                } else {
                    if (object.c2 && child.colorable) {
                        setObjectColorChannel(childSprite, object.c2);
                    }
                }
                if (child.isglow) {
                    if (child.color_layer === "1" && object.c1) {
                        childSprite.tint = colorChannel[object.c1].colorValue;
                    }
                    else if (child.color_layer === "2" && object.c2) {
                        childSprite.tint = colorChannel[object.c2].colorValue;
                    }
                    else {
                        if (child.tint) childSprite.tint = child.tint;
                        else childSprite.tint = "#FFFFFF";
                    }
                    childSprite.alpha = 0.7;
                    childSprite.blendMode = 'add';   
                }
                const frameName = data.frame;
                if (frameName.startsWith("portal")) {
                    portalBackObjectContainer.addChild(childSprite);
                } else{
                    childrenSprites.push(childSprite);              
                }
            }
        }

        // ------------ HITBOXES ----------------------
        let hitboxContainer = new Container();
        if (gameSettings.showHitboxes) {
            if (data.object_type === 0) { // solids
                const hitboxWidth = gridSpacesToPixels(data.hitbox.size.width / 30);
                const hitboxHeight = gridSpacesToPixels(data.hitbox.size.height / 30);

                const hitbox = new Graphics()
                .rect(-hitboxWidth / 2, -hitboxHeight / 2, hitboxWidth, hitboxHeight)
                .stroke({
                    color: 0x0000ff,
                    width: getRenderedSize(gameSettings.hitboxWidth)
                })

                hitbox.zIndex = 999;
                hitboxContainer.addChild(hitbox);
            }
            else if (data.object_type === 2) { // hazards
                const hitboxWidth = gridSpacesToPixels(data.hitbox.size.width / 30);
                const hitboxHeight = gridSpacesToPixels(data.hitbox.size.height / 30);

                const hitbox = new Graphics()
                .rect(-hitboxWidth / 2, -hitboxHeight / 2, hitboxWidth, hitboxHeight)
                .stroke({
                    color: 0xff0000,
                    width: getRenderedSize(gameSettings.hitboxWidth)
                })

                hitbox.zIndex = 999;
                hitboxContainer.addChild(hitbox);
            }
        }
        

        const targetLayer = object.zLayer ?? data.default_z_layer;

        const layerMap = {
            "-5": b5Container,
            "-3": b4Container,
            "-1": b3Container,
             "1": b2Container,
             "3": b1Container,
             "5": t1Container,
             "7": t2Container,
             "9": t3Container,
            "11": t4Container
        };

        const container = layerMap[targetLayer];

        if (objectContainer) {
            if (childrenSprites) {
                childrenSprites.forEach((childSprite) => {
                    objectContainer.addChild(childSprite);
                })
            }
            objectContainer.addChild(objectSprite);
            objectContainer.addChild(hitboxContainer);
        }

        portalBackObjectContainer.x = playerX + gridSpacesToPixels(object.x / 30);
        portalBackObjectContainer.y = groundY + gridSpacesToPixels(-object.y / 30);
        if (object.zOrder) portalBackObjectContainer.zIndex = object.zOrder;
        portalBackObjectContainer.scale.set(scaleX, scaleY);


        objectContainer.x = playerX + gridSpacesToPixels(object.x / 30);
        objectContainer.y = groundY + gridSpacesToPixels(-object.y / 30);
        if (object.zOrder) objectContainer.zIndex = object.zOrder;
        objectContainer.scale.set(scaleX, scaleY);


        // ---------- ROTATING OBJECTS -------------------
        if (data.rot_speed) {
            let objectInfo = [];
            objectInfo.push(objectContainer, data.rot_speed * randSign());
            rotatingObjects.push(objectInfo);
        }


        if (container) {
            const frameName = data.frame;
            if (frameName.startsWith("portal")) {
                t1Container.addChild(objectContainer);
                portalBackContainer.addChild(portalBackObjectContainer);
            } else {
                container.addChild(objectContainer);
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
                    if (!["1005", "1006", "1010", "1011"].includes(value)) {

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
        levelObjects = [];
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
                    if (objectProperties[i] === '6') {  newObject.r = parseInt(objectProperties[i + 1])    }
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

