// Browsers only allow fullscreen from a user gesture, never on page load,
// so arm it on the first click/keypress and again when the game starts.
function goFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    const el = document.documentElement;
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!request) return;
    const result = request.call(el, { navigationUI: "hide" });
    if (result && result.catch) result.catch(() => { });
}

window.addEventListener("pointerdown", goFullscreen, { once: true });
window.addEventListener("keydown", goFullscreen, { once: true });

const gameArea = document.getElementById('game-area');
const lifeCounter = document.getElementById('life-counter');
const player = document.getElementById('player');
const livesDisplay = document.getElementById('lives');
const tallBg = document.getElementById('tall-bg');
const message = document.getElementById('message');
const replayBtns = document.querySelectorAll('.replay-button')
const winModal = document.getElementById('win-modal')
const loseModal = document.getElementById('lose-modal')
const wishInput = document.getElementById('wish')
const startScreen = document.getElementById('start-screen')

// Replaying reloaded the page, which dropped fullscreen. Reset in place instead.
replayBtns.forEach(btn => btn.addEventListener("click", () => {
    goFullscreen(); // a click is a user gesture, so this recovers if Esc was hit
    resetGame();
}))

// The play field is authored at a fixed 900x900. Scale it to whatever the screen
// can actually fit -- up on big monitors, down on laptops -- so it always fills
// the height with the life counter still visible underneath.
const designSize = 900;
const fitPadding = 16;

function fitGameToScreen() {
    const available = window.innerHeight - lifeCounter.offsetHeight - fitPadding;
    const scale = Math.max(
        0.2,
        Math.min(available / designSize, window.innerWidth / designSize)
    );
    document.documentElement.style.setProperty("--game-scale", scale);
}

// Viewport metrics aren't final on the same tick as a fullscreen or monitor
// change, and the counter's height depends on a webfont that loads late, so
// re-measure on the next frame too.
function scheduleFit() {
    fitGameToScreen();
    requestAnimationFrame(fitGameToScreen);
}

window.addEventListener("resize", scheduleFit);
window.addEventListener("load", scheduleFit);
document.addEventListener("fullscreenchange", scheduleFit);
document.addEventListener("webkitfullscreenchange", scheduleFit);
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitGameToScreen);
}
fitGameToScreen();

const baseBottom = 400;
let lives = 3;
const maxTime = 75; //75
const endBuffer = 5;
let playerX = 300;
let playerY = baseBottom;
let spawnInterval = 5000;

const gameWidth = 900;
const gameHeight = 900;
const maxVerticalOffset = 400;
const playerSize = 200;
const obstacleSize = 280;
const moveSpeed = 30;
const obstacleSpeedMax = 1;

let stageActive = true;
let timePassed = 0

// Handles for everything a run leaves behind, so a replay can tear it all down
// instead of relying on a page reload.
let running = false;
let gameTimer = null;
let loopId = null;
let flashInterval = null;
let pendingTimeouts = [];

function later(fn, ms) {
    const id = setTimeout(fn, ms);
    pendingTimeouts.push(id);
    return id;
}

function stopRun() {
    running = false;
    if (loopId !== null) {
        cancelAnimationFrame(loopId);
        loopId = null;
    }
    if (gameTimer !== null) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    if (flashInterval !== null) {
        clearInterval(flashInterval);
        flashInterval = null;
    }
    pendingTimeouts.forEach(clearTimeout);
    pendingTimeouts = [];
}
function movePlayer(e) {
    if (e.key === "ArrowLeft") playerX -= moveSpeed;
    if (e.key === "ArrowRight") playerX += moveSpeed;
    if (e.key === "ArrowUp") playerY += moveSpeed;
    if (e.key === "ArrowDown") playerY -= moveSpeed;

    playerX = Math.max(0, Math.min(gameWidth - playerSize, playerX));
    const minY = baseBottom - maxVerticalOffset;
    const maxY = baseBottom + maxVerticalOffset;
    playerY = Math.max(minY, Math.min(maxY, playerY));

    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
}

const rightFacing = ["1A", "1B", "2A", "2B", "2C", "4B", "5A"]
const leftFacing = ["4A", "3B"]
const typePng = ["4B", "1B", "3B"]

function launchObstacle() {
    spawnInterval = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
    let fileType = ""
    let guyId = `${Math.min(5, Math.floor(timePassed / (maxTime / 5)) + 1)}${Math.random() >= .5 ? "A" : "B"}`
    if (guyId[0] === "2") {
        guyId = Math.random() >= .66 ? guyId : "2C"
    }
    if (guyId === "3A") {
        guyId = "3B"
    }
    if (typePng.includes(guyId)) {
        fileType = ".png"
    } else {
        fileType = ".gif"
    }
    let fullSrc = `badGuy${guyId}${fileType}`
    const obstacle = document.createElement('img');
    obstacle.src = fullSrc;
    // obstacle.style.filter = `hue-rotate(${Math.random() >= .5 ? "0" : "180"}deg)`
    obstacle.classList.add("obstacle");
    const dirNum = Math.floor(Math.random() * 2)
    if (dirNum == 0 && rightFacing.includes(guyId)) {
        obstacle.style.transform = "rotateY(180deg)"
    }
    if (dirNum == 1 && leftFacing.includes(guyId)) {
        obstacle.style.transform = "rotateY(180deg)"
    }
    const obstacleY = Math.floor(Math.random() * (500)) + 100;
    obstacle.dataset.bottom = obstacleY;
    obstacle.style.bottom = `${obstacleY}px`;
    obstacle.style.left = dirNum ? `${-obstacleSize}px` : `${gameWidth}px`;
    obstacle.dataset.direction = dirNum ? "right" : "left";
    gameArea.appendChild(obstacle);

    later(() => obstacle.remove(), 10000);
}

const safeZone = 120

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 < x2 + w2 - safeZone &&
        x1 + w1 > x2 + safeZone &&
        y1 < y2 + h2 - safeZone &&
        y1 + h1 > y2 + safeZone
    );
}

// Restarting the scroll needs a forced reflow between the reset and the target,
// otherwise the browser collapses both style writes into one frame and the
// transition never re-runs (the background would sit still on a replay).
function startBackgroundScroll() {
    tallBg.style.transition = "none";
    tallBg.style.top = "-6000px";
    void tallBg.offsetHeight;
    tallBg.style.transition = `top ${maxTime}s linear`;
    tallBg.style.top = "0px";
}

function gameLoop() {
    player.style.bottom = `${playerY}px`;
    let visible = true;
    const interval = 150; // ms
    const duration = 2000; // 2 seconds
    const obstacles = document.querySelectorAll('img.obstacle');

    obstacles.forEach(obs => {
        let obsLeft = parseFloat(obs.style.left);
        let obsBottom = parseFloat(obs.dataset.bottom);
        const direction = obs.dataset.direction;
        const speed = Math.floor(Math.random() * obstacleSpeedMax) + 2
        obsLeft += direction === "right" ? speed : -speed;
        obs.style.left = `${obsLeft}px`;

        const playerTop = gameHeight - (playerY + playerSize);
        const obstacleTop = gameHeight - (obsBottom + obstacleSize);

        if (checkCollision(playerX, playerTop, playerSize, playerSize, obsLeft, obstacleTop, obstacleSize, obstacleSize)) {
            lives--;
            livesDisplay.textContent = lives;
            obs.remove();

            if (lives <= 0) {
                gameOver();
                return;
            } else {
                clearInterval(flashInterval);
                flashInterval = setInterval(() => {
                    player.style.visibility = visible ? 'hidden' : 'visible';
                    visible = !visible;
                }, interval);

                setTimeout(() => {
                    clearInterval(flashInterval);
                    player.style.visibility = 'visible';
                }, duration);
            }
        }

        if (obsLeft < -obstacleSize || obsLeft > gameWidth + obstacleSize) {
            obs.remove();
        }
    });


    // Checked after the obstacle pass, since a collision there can end the run.
    if (running) loopId = requestAnimationFrame(gameLoop);
}

function resetStage() {
    tallBg.style.transition = "top 0s linear"
    tallBg.style.top = "-6000px"
    tallBg.style.transition = "top 90s linear"
    tallBg.style.top = "1000px"
    playerX = 300;
    playerY = baseBottom;
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;

    document.querySelectorAll('.obstacle').forEach(el => el.remove());
    message.style.display = 'block';

    setTimeout(() => {
        message.style.display = 'none';
        stageActive = true;
    }, 2000);
}

function startSpawningObstacles() {
    launchObstacle();
    if (timePassed < maxTime - endBuffer - spawnInterval / 1000) {
        later(startSpawningObstacles, spawnInterval);
    }
}

window.addEventListener('keydown', movePlayer);

document.getElementById("message").style.display = "none";

function startGame() {
    if (wishInput.value === "") {
        alert("Type a wish first!")
        return
    }
    goFullscreen();
    stopRun(); // never let a previous run's timers or loop survive into this one
    running = true;
    scheduleFit(); // fullscreen may have just changed the viewport
    startScreen.style.display = "none";
    message.style.display = "block";
    livesDisplay.textContent = lives;
    startBackgroundScroll();
    later(() => {
        message.style.display = 'none';
        livesDisplay.style.visibilty = "visible"
        later(startSpawningObstacles, 1000)
    }, 3000)
    loopId = requestAnimationFrame(gameLoop);

    // Start game timer
    gameTimer = setInterval(() => {
        timePassed++;
        if (timePassed >= maxTime) {
            later(gameWin, 3000)
        }
    }, 1000);
}

document.getElementById("start-button").addEventListener("click", startGame);



function gameOver() {
    stopRun(); // otherwise obstacles keep spawning and the clock keeps running
    setTimeout(() => {
        loseModal.style.top = "15vh"
    }, 100);
}
let gameAlreadyWon = false;

function gameWin() {
    if (gameAlreadyWon) return; // prevent running more than once
    gameAlreadyWon = true;

    StarTransport.send(wishInput.value)
    stopRun();

    setTimeout(() => {
        winModal.style.top = "15vh"
    }, 100);
}

// Put everything back to its pre-game state without touching the document, so
// the fullscreen session survives into the next round.
function resetGame() {
    stopRun();

    lives = 3;
    timePassed = 0;
    spawnInterval = 5000;
    gameAlreadyWon = false;
    playerX = 300;
    playerY = baseBottom;

    livesDisplay.textContent = lives;
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
    player.style.visibility = "visible";

    document.querySelectorAll('.obstacle').forEach(el => el.remove());

    tallBg.style.transition = "none";
    tallBg.style.top = "-6000px";

    message.style.display = "none";
    winModal.style.top = "120vh";
    loseModal.style.top = "120vh";

    wishInput.value = "";
    startScreen.style.display = "";
    wishInput.focus();
}

resetGame();
