const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const livesDisplay = document.getElementById('lives');
const tallBg = document.getElementById('tall-bg');
const message = document.getElementById('message');

const baseBottom = 300;
let lives = 5;
let playerX = 300;
let playerY = baseBottom;
let spawnInterval = 5000;

const gameWidth = 700;
const gameHeight = 900;
const maxVerticalOffset = 200;
const playerSize = 100;
const obstacleSize = 160;
const moveSpeed = 20;
const obstacleSpeed = 10;

let stageActive = true;

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

function launchObstacle() {
    const obstacle = document.createElement('img');
    obstacle.src = "badGuy.gif";
    obstacle.classList.add("obstacle");

    const obstacleY = Math.random() * (gameHeight - obstacleSize);
    obstacle.dataset.left = gameWidth;
    obstacle.dataset.bottom = obstacleY;

    obstacle.style.left = `${gameWidth}px`;
    obstacle.style.bottom = `${obstacleY}px`;

    gameArea.appendChild(obstacle);

    setTimeout(() => obstacle.remove(), 8000);
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    );
}

function gameLoop() {
    tallBg.style.transition = "top 0s linear"
    tallBg.style.top = "-6000px"
    tallBg.style.transition = "top 90s linear"
    tallBg.style.top = "1000px"
    player.style.bottom = `${playerY}px`;

    const obstacles = document.querySelectorAll('img.obstacle');

    obstacles.forEach(obs => {
        let obsLeft = parseFloat(obs.dataset.left);
        let obsBottom = parseFloat(obs.dataset.bottom);

        obsLeft -= obstacleSpeed;
        obs.dataset.left = obsLeft;
        obs.style.left = `${obsLeft}px`;
        const playerTop = gameHeight - (playerY + playerSize);
        const obstacleTop = gameHeight - (obsBottom + obstacleSize);
        if (checkCollision(playerX, playerTop, playerSize, playerSize, obsLeft, obstacleTop, obstacleSize, obstacleSize)) {
            lives--;
            livesDisplay.textContent = lives;
            obs.remove();

            if (lives <= 0) {
                alert('Game Over!');
                window.location.reload();
                return;
            } else {
                stageActive = false;
                resetStage();
            }
        }

        if (obsLeft + obstacleSize < 0) obs.remove();
    });

    if (playerY + playerSize >= gameHeight) {
        spawnInterval = Math.max(2000, 5000 - 3 * 1000);
        document.querySelectorAll('.obstacle').forEach(el => el.remove());
        playerY = baseBottom;
        player.style.bottom = `${playerY}px`;

        // Scroll background
    }

    if (playerY <= 0) {
        lives--;
        livesDisplay.textContent = lives;
        if (lives <= 0) {
            alert('Game Over!');
            window.location.reload();
            return;
        } else {
            stageActive = false;
            resetStage();
        }
    }

    if (stageActive) requestAnimationFrame(gameLoop);
    else setTimeout(() => requestAnimationFrame(gameLoop), 100);
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
    setTimeout(startSpawningObstacles, spawnInterval);
}

window.addEventListener('keydown', movePlayer);

setTimeout(() => {
    message.style.display = 'none';
    startSpawningObstacles();
    requestAnimationFrame(gameLoop);
}, 2000);
