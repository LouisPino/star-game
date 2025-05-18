const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');

let lives = 5;
let playerX = 492;
let playerY = 100;
let obstacleCount = 0;
let risingSpeed = 0.33; // 20px/sec ≈ 0.33px/frame (assuming 60fps)
let moveSpeed = 5;
let spawnInterval = 5000;
let gameWidth = 1000;
let gameHeight = 800;
let stageActive = true;
let level = 1;



function movePlayer(e) {
    if (e.key === "ArrowLeft") {
        playerX -= moveSpeed;
    } else if (e.key === "ArrowRight") {
        playerX += moveSpeed;
    }

    // Clamp within game area
    playerX = Math.max(0, Math.min(gameWidth - 16, playerX));
    player.style.left = `${playerX}px`;
}

function createObstaclePair() {
    const gapWidth = 40;
    const gapStart = Math.random() * (gameWidth - gapWidth);

    const left = document.createElement('div');
    const right = document.createElement('div');
    left.className = right.className = 'obstacle';

    left.style.width = `${gapStart}px`;
    left.style.left = `0px`;
    left.style.top = `0px`;

    right.style.width = `${gameWidth - gapStart - gapWidth}px`;
    right.style.left = `${gapStart + gapWidth}px`;
    right.style.top = `0px`;

    gameArea.appendChild(left);
    gameArea.appendChild(right);

    // Increment obstacle count and increase speeds every 3 pairs
    obstacleCount++;
    if (obstacleCount % 3 === 0) {
        risingSpeed += 1 / 60; // ~1px/sec faster
        moveSpeed += 1;
    }
}


function checkCollision(r1, r2) {
    return !(
        r1.bottom < r2.top ||
        r1.top > r2.bottom ||
        r1.right < r2.left ||
        r1.left > r2.right
    );
}

function gameLoop() {
    playerY += risingSpeed;
    player.style.bottom = `${playerY}px`;

    const playerRect = player.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();

    const obstacles = document.querySelectorAll('.obstacle');
    obstacles.forEach(obs => {
        // Move obstacle upward
        const currentTop = parseFloat(obs.style.top);
        obs.style.top = `${currentTop + risingSpeed}px`;

        const obsRect = obs.getBoundingClientRect();
        if (checkCollision(playerRect, obsRect)) {
            // Push the player down by 3px per frame during collision
            playerY -= 3;
            player.style.bottom = `${playerY}px`;
        }

        // Remove if off screen
        if (currentTop > gameHeight) obs.remove();
        if (playerY + 16 >= gameHeight) {  // Player reached top
            level++;

            spawnInterval = Math.max(2000, 5000 - (level - 1) * 1000);
            levelDisplay.textContent = `Level: ${level}`;

            // Clear existing obstacles
            document.querySelectorAll('.obstacle').forEach(el => el.remove());

            // Reset player position to bottom start
            playerY = 100;
            player.style.bottom = `${playerY}px`;

            console.log(`Level up! Level: ${level}, spawnInterval: ${spawnInterval}ms`);
        }

    });

    // Check if player hits bottom
    if (playerY <= 0) {
        lives--;
        livesDisplay.textContent = lives;

        if (lives <= 0) {
            alert('Game Over!');
            window.location.reload();
        } else {
            stageActive = false;
            resetStage();
        }
    }

    if (stageActive) requestAnimationFrame(gameLoop);
    else setTimeout(() => requestAnimationFrame(gameLoop), 100); // keep checking when paused
}

function startSpawningObstacles() {
    createObstaclePair();
    setTimeout(startSpawningObstacles, spawnInterval);
}


window.addEventListener('keydown', movePlayer);
setTimeout(() => {
    document.getElementById('message').style.display = 'none';
    startSpawningObstacles();
    if (stageActive) requestAnimationFrame(gameLoop);
    else setTimeout(() => requestAnimationFrame(gameLoop), 100); // keep checking when paused
}, 2000);


function resetStage() {
    // Reset player position
    playerX = 492;
    playerY = 100;
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;

    // Remove all existing obstacles
    document.querySelectorAll('.obstacle').forEach(el => el.remove());

    // Pause and show message
    document.getElementById('message').style.display = 'block';

    // Restart after delay
    setTimeout(() => {
        document.getElementById('message').style.display = 'none';
        stageActive = true;
    }, 2000);
}
