// misc
export let tickSpeed = .1;




// textures
export let ground = "01"; // 01 - 22
export let background = "01"; // 01 - 59
export let middleground = "01"; // 00 - 03



// colors 
export let groundColor = "#07A300"; // default: 0066ff
export let ground2Color = "#0066ff";
export let backgroundColor = "#06FF00";
export let middlegroundColor = "#028600";
export let middleground2Color = "#06FF00";

export let lineBlendingEnabled = true; //floor line blending
export let middlegroundBlendingEnabled = false; // mg 1 blending
export let middleground2BlendingEnabled = false; // mg 2 blending



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

  x: 0,
  targetX: 0,
  velocityX: 0,

  minX: -0.093 * window.innerHeight,      // Leftmost allowed camera X (px)
  minY: 0      // Lowest allowed camera Y (px)
};





// player
export let playerGravity = 1 // 1 = Normal -1 = Upside-down