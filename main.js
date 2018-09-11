// Get the canvas element
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const scoreboardElement = document.querySelector("#scoreboard");

// Add a key listener to the canvas
canvas.addEventListener("keydown", doKeyDown, false);
canvas.addEventListener("keyup", doKeyUp, false);

// Key events
let left = false;
let right = false;

// Sounds
let wallSound = new Audio("sounds/wall.mp3");
let paddleSound = new Audio("sounds/paddle.mp3");
let winSound = new Audio("sounds/win.mp3");
let failSound = new Audio("sounds/fail.mp3");

function doKeyDown (e) {
    if (e.keyCode == 37) {
        left = true;
    }else if (e.keyCode == 39) {
        right = true;
    }
}

function doKeyUp (e) {
    if (e.keyCode == 37) {
        left = false;
    }else if (e.keyCode == 39) {
        right = false;
    }
}

// Set the canvas properties
canvas.width = 360;
canvas.height = 480;

const gameObject = (posX, posY, sizeX, sizeY, style, draw) => ({
    posX,
    posY,
    sizeX,
    sizeY,
    deltaX: 0,
    deltaY: 0,
    style,
    draw
});

// Game settings
let ballSpeed = 270;
let paddleSpeed = 200;
let paddleWidth = 100;

// Score counters
let playerScore = 0;
let cpuScore = 0;

// Function for drawing rects
function drawRect (ctx) {
    ctx.fillStyle = this.style;
    ctx.fillRect(this.posX - this.sizeX / 2, this.posY - this.sizeY / 2,
        this.sizeX, this.sizeY);
    ctx.fill();
}

// Function for drawing circles
function drawCircle (ctx) {
    ctx.beginPath();
    ctx.arc(this.posX, this.posY, this.sizeX / 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.style;
    ctx.fill();
}

// Create the objects
let player = gameObject(0, 0, paddleWidth, 10, "#00ff00", drawRect);
let cpu = gameObject(0, 0, paddleWidth, 10, "#ff0000", drawRect);
let ball = gameObject(0, 0, 16, 16, "#ffffff", drawCircle);

let objs = [player, cpu, ball];

function setupGame () {
    // Set the position of the objects
    ball.posX = canvas.width / 2;
    ball.posY = canvas.height / 2;

    player.posX = canvas.width / 2;
    player.posY = canvas.height - player.sizeY * 2;

    cpu.posX = canvas.width / 2;
    cpu.posY = cpu.sizeY * 2;

    ball.deltaX = 0;
    ball.deltaY = 0;

    setTimeout(launchBall, 2000);
}

function launchBall () {
    // Apply a random direction to the ball
    if (Math.random() >= 0.5) {
        ball.deltaX = -1;
    }else{
        ball.deltaX = 1;
    }

    if (Math.random() >= 0.5)
        ball.deltaY = -1;
    else
        ball.deltaY = 1;
}

function update (progress) {
    // Move the ball
    ball.posX += ball.deltaX * ballSpeed * progress;
    ball.posY += ball.deltaY * ballSpeed * progress;

    // Test the ball for collisions
    if (ball.posX >= canvas.width - ball.sizeX / 2) {
        ball.deltaX = -Math.abs(ball.deltaX);
        wallSound.play();
    }else if (ball.posX <= ball.sizeX / 2) {
        ball.deltaX = Math.abs(ball.deltaX);
        wallSound.play();
    }

    if (ball.posY >= canvas.height - player.sizeY * 2.5 - ball.sizeY / 2) {
        if (ball.posX >= player.posX - player.sizeX / 2 - ball.sizeX / 2 &&
            ball.posX <= player.posX + player.sizeX / 2 + ball.sizeX / 2) {
            // Determine how much sideways velocity to give the ball
            let xVel = 1.0 / (player.sizeX / 2) * (ball.posX - player.posX);
            ball.deltaX = xVel;
            
            ball.deltaY = -(1.5 - Math.abs(xVel));
            paddleSound.play();
        }
    }

    if (ball.posY <= cpu.sizeY * 2.5 + ball.sizeY / 2) {
        if (ball.posX >= cpu.posX - cpu.sizeX / 2 - ball.sizeX / 2 &&
            ball.posX <= cpu.posX + cpu.sizeX / 2 + ball.sizeX / 2) {
            let xVel = 1.0 / (cpu.sizeX / 2) * (ball.posX - cpu.posX);
            ball.deltaX = xVel;
            
            ball.deltaY = (1.5 - Math.abs(xVel));
            paddleSound.play();
        }
    }

    // Detect scoring
    if (ball.posY <= ball.sizeY / 2) {
        countScore(true);
        winSound.play();
    }else if (ball.posY >= canvas.height - ball.sizeY / 2) {
        countScore(false);
        failSound.play();
    }

    // Move the CPU player
    if (ball.posX > cpu.posX) {
        cpu.deltaX = 1;
    }else if (ball.posX < cpu.posX) {
        cpu.deltaX = -1;
    }
    cpu.posX += cpu.deltaX * paddleSpeed * progress;

    // Move the HUMAN player
    if (left && !right) player.deltaX = -1;
    if (!left && right) player.deltaX = 1;
    if ((!left && !right) || (left && right)) player.deltaX = 0;
    player.posX += player.deltaX * paddleSpeed * progress;

    // Clamp the paddle positions
    cpu.posX = Math.min(Math.max(cpu.posX, cpu.sizeX / 2),
        canvas.width - cpu.sizeX / 2);
    player.posX = Math.min(Math.max(player.posX, player.sizeX / 2),
        canvas.width - player.sizeX / 2);
}

function countScore (human) {
    if (human)
        playerScore ++;
    else
        cpuScore ++;
    
    // Update the score board
    scoreboardElement.innerHTML = "Player: " + playerScore.toString() + " - CPU: " +
        cpuScore.toString();
    
    // TODO: detect winning

    // Reset the game
    setupGame();
}

function draw () {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    // Draw each object
    for (let i = 0; i < objs.length; i++) {
        let obj = objs[i];

        obj.draw(ctx);
    }
}

function loop (timestamp) {
    var progress = (timestamp - lastRender) / 1000.0;

    update(progress);
    draw();

    lastRender = timestamp;
    window.requestAnimationFrame(loop);
}

setupGame();

let lastRender = 0;
window.requestAnimationFrame(loop);