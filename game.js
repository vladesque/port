const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const statusEl = document.getElementById("status");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");

const GAME_STATES = {
  START: "start",
  RUNNING: "running",
  PAUSED: "paused",
  GAME_OVER: "game-over"
};

const STORAGE_KEY = "dodge_the_deadlines_high_score";

const game = {
  state: GAME_STATES.START,
  score: 0,
  highScore: Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10),
  spawnTimer: 0,
  spawnInterval: 850,
  speed: 2.4,
  objects: [],
  lastFrame: performance.now(),
  keys: {
    left: false,
    right: false
  },
  player: {
    width: 56,
    height: 78,
    x: canvas.width / 2 - 28,
    y: canvas.height - 92,
    velocityX: 0,
    moveSpeed: 5.5
  }
};

highScoreEl.textContent = String(game.highScore);

function resetRound() {
  game.score = 0;
  game.objects = [];
  game.speed = 2.4;
  game.spawnInterval = 850;
  game.spawnTimer = 0;
  game.player.x = canvas.width / 2 - game.player.width / 2;
  game.player.velocityX = 0;
  scoreEl.textContent = "0";
}

function startGame() {
  resetRound();
  game.state = GAME_STATES.RUNNING;
  statusEl.textContent = "Running";
}

function setPaused(paused) {
  if (paused && game.state === GAME_STATES.RUNNING) {
    game.state = GAME_STATES.PAUSED;
    statusEl.textContent = "Paused";
  } else if (!paused && game.state === GAME_STATES.PAUSED) {
    game.state = GAME_STATES.RUNNING;
    statusEl.textContent = "Running";
  }
}

function endGame() {
  game.state = GAME_STATES.GAME_OVER;
  statusEl.textContent = "Game Over";

  if (game.score > game.highScore) {
    game.highScore = game.score;
    localStorage.setItem(STORAGE_KEY, String(game.highScore));
    highScoreEl.textContent = String(game.highScore);
  }
}

function updatePlayer() {
  if (game.keys.left) {
    game.player.velocityX = -game.player.moveSpeed;
  } else if (game.keys.right) {
    game.player.velocityX = game.player.moveSpeed;
  } else {
    game.player.velocityX = 0;
  }

  game.player.x += game.player.velocityX;
  game.player.x = Math.max(0, Math.min(canvas.width - game.player.width, game.player.x));
}

function spawnDeadline() {
  const width = 110;
  const height = 46;
  const x = Math.random() * (canvas.width - width);
  game.objects.push({ x, y: -height - 10, width, height });
}

function updateDeadlines(deltaMs) {
  game.spawnTimer += deltaMs;
  if (game.spawnTimer >= game.spawnInterval) {
    spawnDeadline();
    game.spawnTimer = 0;
  }

  const step = game.speed;
  for (const item of game.objects) {
    item.y += step;

    const collides =
      item.x < game.player.x + game.player.width &&
      item.x + item.width > game.player.x &&
      item.y < game.player.y + game.player.height &&
      item.y + item.height > game.player.y;

    if (collides) {
      endGame();
      return;
    }
  }

  const survived = game.objects.filter((item) => item.y < canvas.height + item.height);
  const escapedCount = game.objects.length - survived.length;

  if (escapedCount > 0) {
    game.score += escapedCount;
    scoreEl.textContent = String(game.score);
    game.speed = Math.min(8, game.speed + escapedCount * 0.05);
    game.spawnInterval = Math.max(360, game.spawnInterval - escapedCount * 4);
  }

  game.objects = survived;
}

function drawPlayer() {
  const { x, y, width, height } = game.player;

  ctx.save();
  ctx.translate(x, y);

  // body
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(12, 28, width - 24, height - 28);

  // head
  ctx.fillStyle = "#f3d4b0";
  ctx.beginPath();
  ctx.arc(width / 2, 22, 12, 0, Math.PI * 2);
  ctx.fill();

  // hat top
  ctx.fillStyle = "#111827";
  ctx.fillRect(width / 2 - 14, 5, 28, 10);
  // brim
  ctx.fillRect(width / 2 - 20, 13, 40, 5);

  // legs
  ctx.fillStyle = "#334155";
  ctx.fillRect(15, height - 12, 10, 12);
  ctx.fillRect(width - 25, height - 12, 10, 12);

  ctx.restore();
}

function drawDeadlines() {
  for (const item of game.objects) {
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(item.x, item.y, item.width, item.height);
    ctx.strokeStyle = "#7f1d1d";
    ctx.strokeRect(item.x, item.y, item.width, item.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DEADLINE", item.x + item.width / 2, item.y + item.height / 2);
  }
}

function drawOverlay(text, subtext) {
  ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "center";
  ctx.font = "bold 44px system-ui";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "22px system-ui";
  ctx.fillStyle = "#93c5fd";
  ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 30);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // floor line
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.beginPath();
  ctx.moveTo(0, game.player.y + game.player.height);
  ctx.lineTo(canvas.width, game.player.y + game.player.height);
  ctx.stroke();

  drawPlayer();
  drawDeadlines();

  if (game.state === GAME_STATES.START) {
    drawOverlay("Dodge the Deadlines", "Press Space to Start");
  }

  if (game.state === GAME_STATES.PAUSED) {
    drawOverlay("Paused", "Press P to Resume");
  }

  if (game.state === GAME_STATES.GAME_OVER) {
    drawOverlay("Game Over", "Press Space to Restart");
  }
}

function gameLoop(timestamp) {
  const deltaMs = Math.min(40, timestamp - game.lastFrame);
  game.lastFrame = timestamp;

  if (game.state === GAME_STATES.RUNNING) {
    updatePlayer();
    updateDeadlines(deltaMs);
  }

  drawScene();
  requestAnimationFrame(gameLoop);
}

function keyDownHandler(event) {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") {
    game.keys.left = true;
  }

  if (key === "arrowright" || key === "d") {
    game.keys.right = true;
  }

  if (key === " ") {
    if (game.state === GAME_STATES.START || game.state === GAME_STATES.GAME_OVER) {
      startGame();
    }
  }

  if (key === "p") {
    if (game.state === GAME_STATES.RUNNING) {
      setPaused(true);
    } else if (game.state === GAME_STATES.PAUSED) {
      setPaused(false);
    }
  }
}

function keyUpHandler(event) {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") {
    game.keys.left = false;
  }

  if (key === "arrowright" || key === "d") {
    game.keys.right = false;
  }
}

function holdButton(button, direction) {
  const activate = () => {
    if (direction === "left") {
      game.keys.left = true;
    } else {
      game.keys.right = true;
    }
  };

  const deactivate = () => {
    if (direction === "left") {
      game.keys.left = false;
    } else {
      game.keys.right = false;
    }
  };

  button.addEventListener("touchstart", (e) => {
    e.preventDefault();
    activate();
  });
  button.addEventListener("touchend", deactivate);
  button.addEventListener("touchcancel", deactivate);
  button.addEventListener("mousedown", activate);
  button.addEventListener("mouseup", deactivate);
  button.addEventListener("mouseleave", deactivate);
}

window.addEventListener("keydown", keyDownHandler);
window.addEventListener("keyup", keyUpHandler);
holdButton(leftBtn, "left");
holdButton(rightBtn, "right");

drawScene();
requestAnimationFrame(gameLoop);
