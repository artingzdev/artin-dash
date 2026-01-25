// misc
export let tickSpeed = 1;




// textures
export let ground = "01"; // 01 - 22
export let background = "01"; // 01 - 59
export let middleground = "01"; // 00 - 03



// colors 
export let groundColor = "#0066ff"; // default: 0066ff
export let ground2Color = "#0066ff";
export let backgroundColor = "#287DFF";
export let middlegroundColor = "#287DFF";
export let middleground2Color = "#287DFF";

export let lineBlendingEnabled = true; //floor line blending
export let middlegroundBlendingEnabled = false; // mg 1 blending
export let middleground2BlendingEnabled = true; // mg 2 blending



// speed chart
export let gameSpeed = 1; // 0, 1, 2, 3, 4
export const scrollSpeed = 10.3854448; // grid spaces per second
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
  padding: 0.5      // Lowest allowed camera Y (px)
};