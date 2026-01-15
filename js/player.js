const cubeGlow = document.querySelector('#cube img:first-child')

const cubeGlowScale = 128/120;

function setPlayerGlow(){
    cubeGlow.style.width = `${gridSpacesToPixels(cubeGlowScale)}px`;
    cubeGlow.style.height = `${gridSpacesToPixels(cubeGlowScale)}px`;   
    requestAnimationFrame(setPlayerGlow);
}
requestAnimationFrame(setPlayerGlow);

function setPlayerDimensions() {
    player.style.width = `${gridSpacesToPixels(1)}px`;
    player.style.height = `${gridSpacesToPixels(1)}px`;
    requestAnimationFrame(setPlayerDimensions);
}
requestAnimationFrame(setPlayerDimensions);