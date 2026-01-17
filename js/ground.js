const groundLower = document.getElementById("groundLower");
const groundUpper = document.getElementById("groundUpper");

const groundLowerLine = document.getElementById("groundLowerLine");
const groundUpperLine = document.getElementById("groundUpperLine");

const groundLowerShadowLeft = document.getElementById('groundLowerShadowLeft');
const groundLowerShadowRight = document.getElementById('groundLowerShadowRight');
const groundUpperShadowLeft = document.getElementById('groundUpperShadowLeft');
const groundUpperShadowRight = document.getElementById('groundUpperShadowRight');

const debugTrail = document.getElementById("debug-trail")
let debugTrailOffset = 0; //px


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
  // ground transition easing
  groundLower.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundUpper.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundLowerLine.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundUpperLine.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundLowerShadowLeft.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundLowerShadowRight.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundUpperShadowLeft.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;
  groundUpperShadowRight.style.transition = `transform ${500 / timeWarp}ms ease-in-out`;

  setPlayerPosition();

  let groundTranslateAmount = (0.40 * window.innerHeight) - ((window.innerHeight - gridSpacesToPixels(distGridSpaces)) / 2)

  groundLower.style.transform = `translateY(${pixelsToDvh(groundTranslateAmount)}dvh)`; // set the ground positions based on the area provided in the function parameters
  groundUpper.style.transform = `translateY(-${pixelsToDvh(groundTranslateAmount)}dvh) scaleY(-1)`; // set the ground positions based on the area provided in the function parameters
  
  groundLowerLine.style.transform = `translateY(calc(${pixelsToDvh(groundTranslateAmount)}dvh + 0.3dvh)`; // update line position
  groundUpperLine.style.transform = `translateY(calc(${40 - pixelsToDvh(groundTranslateAmount)}dvh + 0.3dvh)`; // update line position
  
  groundLowerShadowLeft.style.transform = `translateY(calc(${pixelsToDvh(groundTranslateAmount)}dvh)`; // update shadow position
  groundLowerShadowRight.style.transform = `translateY(calc(${pixelsToDvh(groundTranslateAmount)}dvh)) scaleX(-1)`; // update shadow position

  groundUpperShadowLeft.style.transform = `translateY(calc(-${pixelsToDvh(groundTranslateAmount)}dvh)`; // update shadow position
  groundUpperShadowRight.style.transform = `translateY(calc(-${pixelsToDvh(groundTranslateAmount)}dvh)) scaleX(-1)`; // update shadow position

  setPlayerPosition();
}

function resetGrounds() {
  const groundResetTimingFunction = 'cubic-bezier(.16,.62,.35,1)';
  groundLower.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundUpper.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundLowerLine.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundUpperLine.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundLowerShadowLeft.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundLowerShadowRight.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundUpperShadowLeft.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;
  groundUpperShadowRight.style.transition = `transform ${800 / timeWarp}ms ${groundResetTimingFunction}`;

  groundLower.style.transform = `translateY(14dvh)`;
  groundUpper.style.transform = `translateY(-40dvh) scaleY(-1)`;
  
  groundLowerLine.style.transform = `translateY(calc(14dvh + 0.3dvh))`;
  groundUpperLine.style.transform = `translateY(0dvh)`;
  
  groundLowerShadowLeft.style.transform = `translateY(14dvh)`
  groundLowerShadowRight.style.transform = `translateY(14dvh) scaleX(-1)`;

  groundUpperShadowLeft.style.transform = `translateY(-40dvh)`;
  groundUpperShadowRight.style.transform = `translateY(-40dvh) scaleX(-1)`;

  setPlayerPosition();
}

function updateGroundY() {

  groundMatrix = window.getComputedStyle(groundLower).transform;
  const matrixValuesString = groundMatrix.replace('matrix(', '').replace(')', '');
  const matrixArrayStrings = matrixValuesString.split(/,\s*|\s+/); // Splits by commas and/or spaces
  const matrixArray = matrixArrayStrings.map(Number);

  groundUpperMatrix = window.getComputedStyle(groundUpper).transform;
  const matrixValuesStringUpper = groundUpperMatrix.replace('matrix(', '').replace(')', '');
  const matrixArrayStringsUpper = matrixValuesStringUpper.split(/,\s*|\s+/); // Splits by commas and/or spaces
  const matrixArrayUpper = matrixArrayStringsUpper.map(Number);

  groundY = `${40 - (pixelsToDvh(matrixArray[5]))}dvh`;
  groundYUpper = `${(pixelsToDvh(matrixArrayUpper[5]))}dvh`;
  requestAnimationFrame(updateGroundY);
}
requestAnimationFrame(updateGroundY);
resetGrounds();