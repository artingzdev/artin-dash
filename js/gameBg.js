let gameBgTexture = "07"; // 01 - 59
let gameBgColor = '#000564';

const gameBg = document.getElementById('gameBg');

let lastTimeGameBg = 0;

function updateGameBg() {
    gameBg.style.backgroundImage = `url('resources/backgrounds/game_bg_${gameBgTexture}_001-uhd.png')`;
    r.style.setProperty('--game-bg-color', gameBgColor);
}

updateGameBg();

let scrollXGameBg = 0;

function moveGameBg(timestamp) {
  if (!lastTimeGameBg) lastTimeGameBg = timestamp;
  const deltaTime = (timestamp - lastTimeGameBg) / 1000; // seconds
  lastTimeGameBg = timestamp;

  const speedPerSecond = gridSpacesToPixels(1) * speed[gameSpeed].game * 10.3854448 * gameBgSpeed * timeWarp;
  const deltaPixels = speedPerSecond * deltaTime;

  scrollXGameBg -= deltaPixels;
  gameBg.style.backgroundPositionX = scrollXGameBg + "px";
  requestAnimationFrame(moveGameBg);
}
requestAnimationFrame(moveGameBg)