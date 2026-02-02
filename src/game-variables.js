import { colorChannel } from "./colors";

export const gameSettings = {
    // misc
    tickSpeed: 1, // for testing purposes only
    songOffset: 0, // seconds 
    showHitboxes: false,
    hitboxWidth: 3,
    // 0 = cube
    // 1 = ship
    // 2 = ball
    // 3 = ufo
    // 4 = wave
    // 5 = robot
    // 6 = spider
    // 7 = swing
    gamemode: 0,

    // bools
    miniMode: false,
    dualMode: false,
    flipGravity: false,
    fadeIn: false,
    fadeOut: false,
    reverseGameplay: false,
    mirrorMode: false,


    // textures
    ground: "01", // 01 - 22
    background: "01", // 01 - 59
    middleground: "00", // 00 - 03



    // colors 
    groundColor: colorChannel[1001].colorValue, // default: 0066ff
    ground2Color: colorChannel[1009].colorValue,
    backgroundColor: colorChannel[1000].colorValue,
    middlegroundColor: colorChannel[1013].colorValue,
    middleground2Color: colorChannel[1014].colorValue,

    gameSpeed: 1, // 0, 1, 2, 3, 4
    scrollSpeed: 10.3854448 // grid spaces per second
}





// speed chart
export const speed = [
    {// half speed ↓
        game: 0.806,
        jumpHeightCubeBig: [1.946, 2.003]
    }, 
    {// 1x speed ↓
        game: 1,
        jumpHeightCubeBig: [2.126, 2.206]
    }, 
    {// 2x speed ↓
        game: 1.243,
        jumpHeightCubeBig: [2.232, 2.316]
    }, 
    {// 3x speed ↓
        game: 1.502,
        jumpHeightCubeBig: [2.146, 2.227]
    }, 
    {// 4x speed ↓
        game: 1.849,
        jumpHeightCubeBig: [2.146, 2.227]

    }
];

export const speedMultiplier = {
    background: 0.1,
    middlegroundX: 0.3,
    middlegroundY: 0.5
};



// camera
export const camera = {
  y: 0,
  targetY: 0,
  velocityY: 0,

  minY: 0,
  padding: 0.5
};