const groundLower = document.getElementById("groundLower");
const groundUpper = document.getElementById("groundUpper");

const groundLowerLine = document.getElementById("groundLowerLine");
const groundUpperLine = document.getElementById("groundUpperLine");

const groundLowerShadowLeft = document.getElementById('groundLowerShadowLeft');
const groundLowerShadowRight = document.getElementById('groundLowerShadowRight');
const groundUpperShadowLeft = document.getElementById('groundUpperrShadowLeft');
const groundUpperShadowRight = document.getElementById('groundUpperShadowRight');
 
let groundTexture = "04"; // 01 - 07
let groundColor = '#000137';
let lineColor = '#009DFF';
let lineBlendingEnabled = 'true';

function updateGround() {
    groundLower.style.backgroundImage = `url('resources/grounds/groundSquare_${groundTexture}_001-uhd.png')`;
    groundUpper.style.backgroundImage = `url('resources/grounds/groundSquare_${groundTexture}_001-uhd.png')`;
    r.style.setProperty('--ground-color', groundColor);
    groundLowerLine.style.backgroundImage = `linear-gradient(to right, rgba(255, 255, 255, 0), ${lineColor}, rgba(255, 255, 255, 0))`;
    groundUpperLine.style.backgroundImage = `linear-gradient(to right, rgba(255, 255, 255, 0), ${lineColor}, rgba(255, 255, 255, 0))`;
    if (lineBlendingEnabled) {
      groundLowerLine.style.mixBlendMode = 'plus-lighter';
      groundUpperLine.style.mixBlendMode = 'plus-lighter';
    }
    else {
      groundLowerLine.style.mixBlendMode = 'normal';
      groundUpperLine.style.mixBlendMode = 'normal';
    }
    requestAnimationFrame(updateGround);
}
requestAnimationFrame(updateGround);

let scrollX = 0;
let lastTimeGround = 0;

function moveGround(timestamp) {
  if (!lastTimeGround) lastTimeGround = timestamp;
  const deltaTime = (timestamp - lastTimeGround) / 1000; // seconds since last frame
  lastTimeGround = timestamp;

  const speedPerSecond = gridSpacesToPixels(1) * speed[gameSpeed].game * 10.3854448 * timeWarp;
  const deltaPixels = speedPerSecond * deltaTime;

  scrollX -= deltaPixels;
  groundLower.style.backgroundPositionX = scrollX + "px";
  groundUpper.style.backgroundPositionX = scrollX + "px";

  requestAnimationFrame(moveGround);
}

requestAnimationFrame(moveGround);

function setGroundsDistance(distGridSpaces) {
  groundLower.style.display = 'block';
  groundLowerLine.style.display = 'block';
  groundLowerShadowLeft.display = 'block';
  groundLowerShadowRight.display = 'block';
  // ground transition easing
  groundLower.style.transition = 'transform 500ms ease-in-out';
  groundUpper.style.transition = 'transform 500ms ease-in-out';
  groundLowerLine.style.transition = 'transform 500ms ease-in-out';
  groundUpperLine.style.transition = 'transform 500ms ease-in-out';
  //player.style.transition = 'bottom 500ms ease-in-out';

  let groundTranslateAmount = (0.40 * window.innerHeight) - ((window.innerHeight - gridSpacesToPixels(distGridSpaces)) / 2)
  groundLower.style.transform = `translateY(${pixelsToDvh(groundTranslateAmount)}dvh)`; // set the ground positions based on the area provided in the function parameters
  groundUpper.style.transform = `translateY(-${pixelsToDvh(groundTranslateAmount)}dvh) scaleY(-1)`; // set the ground positions based on the area provided in the function parameters
  groundLowerLine.style.transform = `translateY(calc(${pixelsToDvh(groundTranslateAmount)}dvh + 0.3dvh)`; // update line position
  groundUpperLine.style.transform = `translateY(calc(${pixelsToDvh(groundTranslateAmount) / 2}dvh - 0.6dvh)`; // update line position
  //groundY = `${pixelsToDvh((window.innerHeight - gridSpacesToPixels(distGridSpaces)) / 2)}dvh`;
}

function resetGrounds() {
  
}

function updateGroundY() {
  groundMatrix = window.getComputedStyle(groundLower).transform;
  const matrixValuesString = groundMatrix.replace('matrix(', '').replace(')', '');
  const matrixArrayStrings = matrixValuesString.split(/,\s*|\s+/); // Splits by commas and/or spaces
  const matrixArray = matrixArrayStrings.map(Number);
  groundY = `${40 - (pixelsToDvh(matrixArray[5]))}dvh`;
  requestAnimationFrame(updateGroundY);
}
requestAnimationFrame(updateGroundY);
//setGroundsDistance(8);