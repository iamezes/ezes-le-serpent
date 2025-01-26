const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const levelElement = document.getElementById('levelValue');
const levelObjective = document.getElementById('levelObjective');
const menu = document.getElementById('menu');
const gameArea = document.getElementById('gameArea');
const instructions = document.getElementById('instructions');
const highScores = document.getElementById('highScores');
const scoresList = document.getElementById('scoresList');
const levelSelect = document.getElementById('levelSelect');
const levelGrid = document.getElementById('levelGrid');

// Boutons
const playButton = document.getElementById('playButton');
const levelSelectButton = document.getElementById('levelSelectButton');
const instructionsButton = document.getElementById('instructionsButton');
const highScoresButton = document.getElementById('highScoresButton');
const backToMenuButton = document.getElementById('backToMenu');
const backButtons = document.querySelectorAll('.back-button');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let obstacles = [];
let movingObstacles = [];
let direction = 'right';
let score = 0;
let gameLoop;
let gameSpeed = 100;
let currentLevel = 0;
let isClassicMode = true;
let highScoresList = JSON.parse(localStorage.getItem('highScores')) || [];
let unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels')) || [1];

const levels = [
    {
        name: "Niveau 1",
        speed: 100,
        objective: "Score 50 points pour débloquer le niveau 2",
        targetScore: 50,
        obstacles: [],
        setup: () => {}
    },
    {
        name: "Niveau 2",
        speed: 85,
        objective: "Score 100 points en évitant les obstacles",
        targetScore: 100,
        obstacles: [
            { x: 10, y: 10, width: 3, height: 1 },
            { x: 7, y: 15, width: 1, height: 3 }
        ],
        setup: () => {
            createStaticObstacles(levels[1].obstacles);
        }
    },
    {
        name: "Niveau 3",
        speed: 70,
        objective: "Score 150 points avec obstacles mobiles",
        targetScore: 150,
        obstacles: [],
        setup: () => {
            createMovingObstacles(2);
        }
    },
    {
        name: "Niveau 4",
        speed: 60,
        objective: "Score 200 points dans le labyrinthe",
        targetScore: 200,
        obstacles: [
            { x: 5, y: 5, width: 10, height: 1 },
            { x: 5, y: 5, width: 1, height: 10 },
            { x: 15, y: 5, width: 1, height: 10 },
            { x: 5, y: 15, width: 11, height: 1 }
        ],
        setup: () => {
            createStaticObstacles(levels[3].obstacles);
        }
    },
    {
        name: "Niveau 5",
        speed: 50,
        objective: "Score 300 points en mode expert",
        targetScore: 300,
        obstacles: [],
        setup: () => {
            createMovingObstacles(3);
            createStaticObstacles([
                { x: 8, y: 8, width: 4, height: 1 },
                { x: 8, y: 12, width: 4, height: 1 }
            ]);
        }
    }
];

function createLevelButtons() {
    levelGrid.innerHTML = '';
    for (let i = 0; i < levels.length; i++) {
        const levelNum = i + 1;
        const button = document.createElement('button');
        button.className = 'level-button';
        if (!unlockedLevels.includes(levelNum)) {
            button.classList.add('locked');
        } else if (levelNum < Math.max(...unlockedLevels)) {
            button.classList.add('completed');
        }
        button.textContent = `Niveau ${levelNum}`;
        button.addEventListener('click', () => {
            if (unlockedLevels.includes(levelNum)) {
                startLevel(levelNum);
            }
        });
        levelGrid.appendChild(button);
    }
}

function createStaticObstacles(obstaclesList) {
    obstacles = obstaclesList.map(obs => ({
        x: obs.x * gridSize,
        y: obs.y * gridSize,
        width: obs.width * gridSize,
        height: obs.height * gridSize
    }));
}

function createMovingObstacles(count) {
    movingObstacles = [];
    for (let i = 0; i < count; i++) {
        movingObstacles.push({
            x: Math.floor(Math.random() * (tileCount - 2)) + 1,
            y: Math.floor(Math.random() * (tileCount - 2)) + 1,
            dx: (Math.random() > 0.5 ? 1 : -1) * 0.2,
            dy: (Math.random() > 0.5 ? 1 : -1) * 0.2
        });
    }
}

function updateMovingObstacles() {
    movingObstacles.forEach(obs => {
        obs.x += obs.dx;
        obs.y += obs.dy;
        
        if (obs.x <= 0 || obs.x >= tileCount - 1) obs.dx *= -1;
        if (obs.y <= 0 || obs.y >= tileCount - 1) obs.dy *= -1;
    });
}

function checkObstacleCollision(x, y) {
    // Vérifier les obstacles statiques
    for (let obs of obstacles) {
        const obsGridX = obs.x / gridSize;
        const obsGridY = obs.y / gridSize;
        const obsGridWidth = obs.width / gridSize;
        const obsGridHeight = obs.height / gridSize;
        
        if (x >= obsGridX && x < obsGridX + obsGridWidth &&
            y >= obsGridY && y < obsGridY + obsGridHeight) {
            return true;
        }
    }
    
    // Vérifier les obstacles mobiles
    for (let obs of movingObstacles) {
        const distance = Math.sqrt(
            Math.pow(x - obs.x, 2) + Math.pow(y - obs.y, 2)
        );
        if (distance < 1) {
            return true;
        }
    }
    
    return false;
}

function drawObstacles() {
    ctx.fillStyle = '#ff4444';
    
    // Dessiner les obstacles statiques
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
    
    // Dessiner les obstacles mobiles
    movingObstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x * gridSize + gridSize/2, obs.y * gridSize + gridSize/2, 
                gridSize/2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function startLevel(level) {
    currentLevel = level;
    isClassicMode = false;
    gameSpeed = levels[level-1].speed;
    levelElement.textContent = level;
    levelObjective.textContent = levels[level-1].objective;
    obstacles = [];
    movingObstacles = [];
    levels[level-1].setup();
    showScreen('gameArea');
    startGame();
}

function unlockNextLevel() {
    const nextLevel = currentLevel + 1;
    if (nextLevel <= levels.length && !unlockedLevels.includes(nextLevel)) {
        unlockedLevels.push(nextLevel);
        localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
        alert(`Félicitations ! Vous avez débloqué le niveau ${nextLevel} !`);
    }
}

function initGame() {
    snake = [{ x: 5, y: 5 }];
    direction = 'right';
    score = 0;
    scoreElement.textContent = score;
    if (isClassicMode) {
        levelElement.textContent = '-';
        levelObjective.textContent = '';
    }
    spawnFood();
}

function moveSnake() {
    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Traversée des murs
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // Vérifier les collisions avec le serpent
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Vérifier les collisions avec les obstacles
    if (!isClassicMode && checkObstacleCollision(head.x, head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Vérifier si le serpent mange la nourriture
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // Vérifier l'objectif du niveau
        if (!isClassicMode && score >= levels[currentLevel-1].targetScore) {
            unlockNextLevel();
        }
        
        spawnFood();
        // Augmenter la vitesse en mode classique
        if (isClassicMode && gameSpeed > 50) {
            gameSpeed -= 2;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }
    } else {
        snake.pop();
    }
}

function drawGame() {
    // Effacer le canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner les obstacles
    if (!isClassicMode) {
        drawObstacles();
    }

    // Dessiner le serpent
    ctx.fillStyle = '#4CAF50';
    for (let segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    }

    // Dessiner la nourriture
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function gameStep() {
    if (!isClassicMode) {
        updateMovingObstacles();
    }
    moveSnake();
    drawGame();
}

function gameOver() {
    clearInterval(gameLoop);
    updateHighScores();
    setTimeout(() => {
        alert('Game Over! Score: ' + score);
        showScreen('menu');
    }, 100);
}

function startGame() {
    initGame();
    gameLoop = setInterval(gameStep, gameSpeed);
}

// Event Listeners
playButton.addEventListener('click', () => {
    isClassicMode = true;
    gameSpeed = 100;
    showScreen('gameArea');
    startGame();
});

levelSelectButton.addEventListener('click', () => {
    createLevelButtons();
    showScreen('levelSelect');
});

// Gestion du menu
function showScreen(screenId) {
    [menu, gameArea, instructions, highScores, levelSelect].forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function updateHighScores() {
    if (score > 0) {
        highScoresList.push(score);
        highScoresList.sort((a, b) => b - a);
        highScoresList = highScoresList.slice(0, 5); // Garder les 5 meilleurs scores
        localStorage.setItem('highScores', JSON.stringify(highScoresList));
    }
    displayHighScores();
}

function displayHighScores() {
    scoresList.innerHTML = highScoresList.length > 0
        ? highScoresList.map((score, index) => `<p>${index + 1}. ${score} points</p>`).join('')
        : '<p>Aucun score enregistré</p>';
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Éviter que la nourriture apparaisse sur le serpent
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            spawnFood();
        }
    }
}

// Contrôles
document.addEventListener('keydown', (event) => {
    if (!gameArea.classList.contains('hidden')) {
        switch (event.key) {
            case 'ArrowUp':
                if (direction !== 'down') direction = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') direction = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') direction = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') direction = 'right';
                break;
        }
    }
});

// Afficher le menu au démarrage
showScreen('menu');
