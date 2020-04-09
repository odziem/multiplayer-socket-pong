// Canvas Related 
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const socket = io();
const playerId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
let isReferee = false; // referee decides on the position and movement of the ball
let paddleIndex = 0;

let width = 500;
let height = 700;
let screenWidth = window.screen.width;
let canvasPosition = (screenWidth / 2) - (width / 2);

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddle_X = [ 225, 225 ];
let trajectory_X = [ 0, 0 ];
let playerMoved = false;

// Ball
let ball_X = 250;
let ball_Y = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speed_Y = 2;
let speed_X = 0;
let computerSpeed = 4;

// Score 
let score = [ 0, 0 ];

// Create Canvas Element
function createCanvas() {
    canvas.id = 'canvas';
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    renderCanvas();
}

function renderIntro() {
    // Canvas Background
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Intro Text
    context.fillStyle = 'white';
    context.font = "32px Courier New";
    context.fillText("Waiting for opponent...", 20, (canvas.height / 2) - 30);
}

// Render Everything on Canvas
function renderCanvas() {
    // Canvas Background
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Paddle Color
    context.fillStyle = 'white';

    // Paddle 1
    context.fillRect(paddle_X[0], height - 20, paddleWidth, paddleHeight);

    // Paddle 2
    context.fillRect(paddle_X[1], 10, paddleWidth, paddleHeight);

    // Dashed Center Line
    context.beginPath();
    context.setLineDash([4]);
    context.moveTo(0, 350);
    context.lineTo(500, 350);
    context.strokeStyle = 'grey';
    context.stroke();

    // Ball
    context.beginPath();
    context.arc(ball_X, ball_Y, ballRadius, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();

    // Score
    context.font = "32px Courier New";
    context.fillText(score[0], 20, (canvas.height / 2) + 50);
    context.fillText(score[1], 20, (canvas.height / 2) - 30);
}

function ballReset() {
    if (isReferee) {
        ball_X = width / 2;
        ball_Y = height / 2;
        speed_Y = 3;
    
        socket.emit('ballMove', {
            ball_X,
            ball_Y,
            speed_X,
            speed_Y,
            ballDirection,
            score,
        });
    }
}

function ballMove() {
    if (isReferee) {
        // Vertical Speed
        ball_Y += speed_Y * ballDirection;
        // Horizontal Speed
        if (playerMoved) {
            ball_X += speed_X;
        }

        socket.emit('ballMove', {
            ball_X,
            ball_Y,
            speed_X,
            speed_Y,
            ballDirection,
            score,
        });
    }
}

function ballBoundaries() {
    // Bounce off Left Wall
    if (ball_X < 0 && speed_X < 0) {
        speed_X = -speed_X;
    }
    // Bounce off Right Wall
    if (ball_X > width && speed_X > 0) {
        speed_X = -speed_X;
    }
    // Bounce off player paddle (bottom)
    if (ball_Y > height - paddleDiff) {
        if (ball_X > paddle_X[0] && ball_X < paddle_X[0] + paddleWidth) {
            // Add Speed on Hit
            if (playerMoved) {
                speed_Y = speed_Y + 1;
                // Max Speed
                if (speed_Y > 5) {
                    speed_Y = 5;
                    computerSpeed = 6;
                }
            }
            ballDirection = -ballDirection;
            trajectory_X[0] = ball_X - (paddle_X[0] + paddleDiff);
            speed_X = trajectory_X[0] * 0.3;
        } else if (ball_Y > height) {
            // Reset Ball, add to Computer Score
            ballReset();      
            score[1]++;      
        }
    }
    // Bounce off computer paddle (top)
    if (ball_Y < paddleDiff) {
        if (ball_X > paddle_X[1] && ball_X < paddle_X[1] + paddleWidth) {
            // Add Speed on Hit
            if (playerMoved) {
                speed_Y = speed_Y + 1;
                // Max Speed
                if (speed_Y > 5) {
                    speed_Y = 5;
                }
            }
            ballDirection = -ballDirection;
            trajectory_X[1] = ball_X - (paddle_X[1] + paddleDiff);
            speed_X = trajectory_X[1] * 0.3;
        } else if (ball_Y < 0) {
            // Reset Ball, add to Player Score
            ballReset();
            score[0]++;
        }
    }
}

function computerAI() {
    if (playerMoved) {
        if (paddle_X[1] + paddleDiff < ball_X) {
            paddle_X[1] += computerSpeed;
        } else {
            paddle_X[1] -= computerSpeed;
        }
    }
}

function animate() {
    renderCanvas();
    ballMove();
    ballBoundaries();
    // computerAI();
    window.requestAnimationFrame(animate);
}

window.onload = () => {
    createCanvas();
    renderIntro();
    socket.emit('ready', {
        playerId,
    });
    socket.on('startGame', (playerData) => {
        console.log('start game received', playerData);
        isReferee = playerData[playerId].isReferee;
        paddleIndex = isReferee ? 0 : 1;
        window.requestAnimationFrame(animate);
        canvas.addEventListener('mousemove', (e) => {
            playerMoved = true;
            paddle_X[paddleIndex] = (e.clientX - canvasPosition) - paddleDiff;
            if (paddle_X[paddleIndex] < paddleDiff) {
                paddle_X[paddleIndex] = 0;
            } 
            if (paddle_X[paddleIndex] > (width - paddleWidth)) {
                paddle_X[paddleIndex] = width - paddleWidth;
            }
            socket.emit('paddleMove', {
                xPosition: paddle_X[paddleIndex],
            });
            canvas.style.cursor = 'none';
        });
        socket.on('paddleMove', (data) => {
            const opponentPaddleIndex = 1 - paddleIndex; // toggles 1 into 0 and 0 into 1
            paddle_X[opponentPaddleIndex] = data.xPosition;
        });
        socket.on('ballMove', (data) => {
            ({ ball_X, ball_Y, speed_X, speed_Y, ballDirection, score } = data);
        });
    });
}

