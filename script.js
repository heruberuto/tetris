const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextContext = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const statusEl = document.getElementById("status");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_BLOCK = 24;

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(NEXT_BLOCK, NEXT_BLOCK);

const COLORS = {
  0: "#0b1118",
  I: "#4dd2ff",
  J: "#6488ff",
  L: "#ff9f43",
  O: "#feca57",
  S: "#1dd1a1",
  T: "#c56cf0",
  Z: "#ff6b6b",
};

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

const state = {
  arena: createMatrix(COLS, ROWS),
  player: {
    pos: { x: 0, y: 0 },
    matrix: null,
    type: null,
    score: 0,
    lines: 0,
    level: 1,
  },
  nextType: null,
  dropCounter: 0,
  dropInterval: 1000,
  lastTime: 0,
  running: false,
  paused: false,
};

function createMatrix(width, height) {
  const matrix = [];
  for (let y = 0; y < height; y += 1) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  return SHAPES[type].map((row) => row.slice());
}

function drawMatrix(matrix, offset, ctx, ghost = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const color = COLORS[value];
        ctx.fillStyle = ghost ? `${color}80` : color;
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 0.08;
        ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = COLORS[0];
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(state.arena, { x: 0, y: 0 }, context);
  drawGhost();
  drawMatrix(state.player.matrix, state.player.pos, context);

  nextContext.fillStyle = COLORS[0];
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (state.nextType) {
    const nextMatrix = createPiece(state.nextType);
    const offset = {
      x: Math.floor((5 - nextMatrix[0].length) / 2),
      y: Math.floor((5 - nextMatrix.length) / 2),
    };
    drawMatrix(nextMatrix, offset, nextContext);
  }
}

function drawGhost() {
  const ghost = {
    pos: { x: state.player.pos.x, y: state.player.pos.y },
    matrix: state.player.matrix,
  };
  while (!collide(state.arena, ghost)) {
    ghost.pos.y += 1;
  }
  ghost.pos.y -= 1;
  drawMatrix(ghost.matrix, ghost.pos, context, true);
}

function collide(arena, player) {
  const { matrix, pos } = player;
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x] !== 0 && (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  const rotated = matrix.map((row, y) => row.map((_, x) => matrix[x][y]));
  if (dir > 0) {
    rotated.forEach((row) => row.reverse());
  } else {
    rotated.reverse();
  }
  return rotated;
}

function playerReset() {
  if (!state.nextType) {
    state.nextType = randomType();
  }
  state.player.type = state.nextType;
  state.player.matrix = createPiece(state.player.type);
  state.player.pos.y = 0;
  state.player.pos.x = Math.floor(COLS / 2) - Math.floor(state.player.matrix[0].length / 2);
  state.nextType = randomType();

  if (collide(state.arena, state.player)) {
    state.running = false;
    state.paused = false;
    statusEl.textContent = "Game over. Press Reset to try again.";
    pauseButton.disabled = true;
  }
}

function playerDrop() {
  state.player.pos.y += 1;
  if (collide(state.arena, state.player)) {
    state.player.pos.y -= 1;
    merge(state.arena, state.player);
    sweep();
    playerReset();
  }
  state.dropCounter = 0;
}

function hardDrop() {
  while (!collide(state.arena, state.player)) {
    state.player.pos.y += 1;
  }
  state.player.pos.y -= 1;
  merge(state.arena, state.player);
  sweep();
  playerReset();
  state.dropCounter = 0;
}

function sweep() {
  let rowCount = 0;

  for (let y = state.arena.length - 1; y >= 0; y -= 1) {
    if (state.arena[y].every((value) => value !== 0)) {
      const row = state.arena.splice(y, 1)[0].fill(0);
      state.arena.unshift(row);
      rowCount += 1;
      y += 1;
    }
  }

  if (rowCount > 0) {
    const lineScores = [0, 40, 100, 300, 1200];
    state.player.score += lineScores[rowCount] * state.player.level;
    state.player.lines += rowCount;
    const nextLevel = Math.floor(state.player.lines / 10) + 1;
    if (nextLevel !== state.player.level) {
      state.player.level = nextLevel;
      state.dropInterval = Math.max(120, 1000 - (state.player.level - 1) * 80);
    }
  }

  updateScore();
}

function playerMove(dir) {
  state.player.pos.x += dir;
  if (collide(state.arena, state.player)) {
    state.player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const originalMatrix = state.player.matrix;
  state.player.matrix = rotate(state.player.matrix, dir);

  const pos = state.player.pos.x;
  let offset = 1;
  while (collide(state.arena, state.player)) {
    state.player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (Math.abs(offset) > state.player.matrix[0].length) {
      state.player.matrix = originalMatrix;
      state.player.pos.x = pos;
      return;
    }
  }
}

function randomType() {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
}

function updateScore() {
  scoreEl.textContent = state.player.score;
  linesEl.textContent = state.player.lines;
  levelEl.textContent = state.player.level;
}

function update(time = 0) {
  const deltaTime = time - state.lastTime;
  state.lastTime = time;

  if (state.running && !state.paused) {
    state.dropCounter += deltaTime;
    if (state.dropCounter > state.dropInterval) {
      playerDrop();
    }
    draw();
  }

  requestAnimationFrame(update);
}

function resetGame() {
  state.arena = createMatrix(COLS, ROWS);
  state.player.score = 0;
  state.player.lines = 0;
  state.player.level = 1;
  state.dropInterval = 1000;
  state.nextType = null;
  state.running = true;
  state.paused = false;
  statusEl.textContent = "Good luck!";
  pauseButton.disabled = false;
  updateScore();
  playerReset();
}

function togglePause() {
  if (!state.running) {
    return;
  }
  state.paused = !state.paused;
  statusEl.textContent = state.paused ? "Paused" : "Playing";
}

startButton.addEventListener("click", () => {
  if (!state.running) {
    resetGame();
  }
  state.paused = false;
  statusEl.textContent = "Playing";
  pauseButton.disabled = false;
});

pauseButton.addEventListener("click", () => {
  togglePause();
});

resetButton.addEventListener("click", () => {
  resetGame();
});

document.addEventListener("keydown", (event) => {
  if (!state.running || state.paused) {
    if (event.key.toLowerCase() === "p") {
      togglePause();
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    playerMove(-1);
  } else if (event.key === "ArrowRight") {
    playerMove(1);
  } else if (event.key === "ArrowDown") {
    playerDrop();
  } else if (event.key === "ArrowUp") {
    playerRotate(1);
  } else if (event.code === "Space") {
    hardDrop();
  } else if (event.key.toLowerCase() === "p") {
    togglePause();
  }
});

updateScore();
update();
