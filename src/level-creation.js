import { colorChannel } from './colors.js';
import { gameSettings } from './game-variables.js';
import { Assets } from 'pixi.js';

function getValueOfFirstArrayWithKey(nestedArray, key) {
  return nestedArray.find(inner => inner[0] === `${key}`)[1];
}
let colorString = "";

export async function loadLevel(fileName) {
try {
        const levelData = await Assets.load(`${fileName}.txt`);

        const sections = levelData.split(';');
        const cleanedSections = sections.filter(section => section.trim() !== '');

        const pairsArray = cleanedSections[0].split(',').reduce((a, v, i) => (i % 2 ? a : [...a, [v]]), [])
                 .map((p, i) => [p[0], cleanedSections[0].split(',')[i * 2 + 1] || '']);

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
            if (key === "kA8") {gameSettings.dualMode = value}
            if (key === "kA11") {gameSettings.flipGravity = value}
            if (key === "kA13") {gameSettings.songOffset = value}
            if (key === "kA15") {gameSettings.fadeIn = value}
            if (key === "kA16") {gameSettings.fadeOut = value}
            if (key === "kA20") {gameSettings.reverseGameplay = value}
            if (key === "kA25") {gameSettings.middleground = `0${value}`}
            if (key === "kA28") {gameSettings.mirrorMode = value}
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

} catch (error) {
    console.error(`Error processing ${fileName}.txt:`, error);
}
}

