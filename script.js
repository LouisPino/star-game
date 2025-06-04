document.addEventListener("DOMContentLoaded", function () {
    initializeWebSocket(location.hostname);
    function initializeWebSocket(ip) {
        socket = new WebSocket(`ws://${ip}:8000/display`);
        // Confirm connection success
        socket.onopen = function (e) {
            console.log("WebSocket connection established!");
        };

        // Run when message is received from server (Max -> Server -> Client)
        socket.onmessage = function (event) {
            let msg = JSON.parse(event.data);
            switch (msg.type) {
                case `initialFileServe`:
                    break;
                case "newStar":
                    handleNewStar(msg.data)
                    break;
            }
        };
    }
});





const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const livesDisplay = document.getElementById('lives');
const tallBg = document.getElementById('tall-bg');
const message = document.getElementById('message');

const baseBottom = 300;
let lives = 5;
const maxTime = 15;
let playerX = 300;
let playerY = baseBottom;
let spawnInterval = 5000;

const gameWidth = 700;
const gameHeight = 900;
const maxVerticalOffset = 200;
const playerSize = 100;
const obstacleSize = 160;
const moveSpeed = 30;
const obstacleSpeedMax = 4;

let stageActive = true;
let timePassed = 0
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
    spawnInterval = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;
    const obstacle = document.createElement('img');
    obstacle.src = `badGuy${Math.min(5, Math.floor(timePassed / (maxTime / 5)) + 1)}${Math.random() >= .5 ? "A" : "B"}.jpg`;
    obstacle.classList.add("obstacle");

    const fromLeft = Math.random() < 0.5;
    const obstacleY = Math.floor(Math.random() * (400)) + 20;

    obstacle.dataset.bottom = obstacleY;
    obstacle.style.bottom = `${obstacleY}px`;
    obstacle.style.left = fromLeft ? `${-obstacleSize}px` : `${gameWidth}px`;
    obstacle.dataset.direction = fromLeft ? "right" : "left";

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
    tallBg.style.transition = `top ${maxTime}s linear`
    tallBg.style.top = "1000px"
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
                const flashInterval = setInterval(() => {
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

document.getElementById("message").style.display = "none";

function startGame() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("message").style.display = "block";
    setTimeout(() => {
        message.style.display = 'none';
        setTimeout(startSpawningObstacles, 1000)
    }, 3000)
    requestAnimationFrame(gameLoop);

    // Start game timer
    gameTimer = setInterval(() => {
        timePassed++;
        if (timePassed >= maxTime) {
            gameWin();
        }
    }, 1000);
}

document.getElementById("start-button").addEventListener("click", startGame);



function gameOver() {
    alert("you suck")
    window.location.reload();
}
let gameAlreadyWon = false;

function gameWin() {
    if (gameAlreadyWon) return; // prevent running more than once
    gameAlreadyWon = true;

    sendToServer({ type: "win", val: document.getElementById("wish").value })

    setTimeout(() => {
        alert("you win");
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }, 100);
}


function sendToServer(msg) {
    socket.send(JSON.stringify(msg));
}
