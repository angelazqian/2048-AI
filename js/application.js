let Imitationmodel;
let Finemodel;

const imitationCheckbox = document.querySelector(".imitation-button");
const fineCheckbox = document.querySelector(".fine-button");
const strategyCheckbox = document.querySelector(".strategy-button");
const speedButtons = {
  fast: document.querySelector(".full-speed-button"),
  normal: document.querySelector(".fast-speed-button"),
  slow: document.querySelector(".slow-speed-button"),
};

function rotategrid(grid) {
  const ans = Array(4).fill().map(() => Array(4).fill(0));
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ans[j][3-i] = grid[i][j];
    }
  }
  return ans;
}
function mirrordiag(grid) {
  const ans = Array(4).fill().map(() => Array(4).fill(0));
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ans[3-j][3-i] = grid[i][j];
    }
  }
  return ans;
}
function largestpos(grid) {
  let biggest = 0;  //get coords of top 2 biggest
  let bigger = 0;
  let one = {row: 0, col: 0};
  let two = {row: 0, col: 0};
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i][j] > biggest) {
        biggest = grid[i][j];
        one = {row: i, col: j};
      }
      else if (grid[i][j] > bigger) {
        bigger = grid[i][j];
        two = {row: i, col: j};
      }
    }
  }
  return {one, two};
}

async function loadImitationModel() {
  Imitationmodel = await tf.loadGraphModel('model/2048_imitation_tfjs/model.json');
  console.log("Imitation model loaded");
}
async function loadFineModel() {
  Finemodel = await tf.loadGraphModel('model/2048_fine_tfjs/model.json');
  console.log("Finetuned model loaded");
}
//predict the next move using the model
async function predictImitationMove(grid) {
  let {one, two} = largestpos(grid.cells);
  let rots = 0;
  let mirror = false;
  if (one.row > 1)  //find how many times to rotate
    rots = 2;
  if ((one.col > 1 && one.row > 1) || (one.col < 2 && one.row < 2))
    rots += 1;
  for (let i = 0; i < rots; i++)
    grid.cells = rotategrid(grid.cells);
  ({one, two} = largestpos(grid.cells));
  if (two.row + two.col > 3){
    mirror = true;
    grid.cells = mirrordiag(grid.cells);
  }

  const log2grid = grid.cells.map(row =>row.map(cell => (cell ? Math.log2(cell.value) : 0)));
  const inputTensor = tf.tensor(log2grid, [4, 4], 'float32').reshape([1, 1, 4, 4]); //reshape for cnn
  const prediction = Imitationmodel.predict(inputTensor);
  const probs = await prediction.data();
  let rankedMoves = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);  //spread iterable, sort moves by probability
  if (mirror) {
    rankedMoves = rankedMoves.map(move => (move - 2*(move % 2) + 1)); //mirror moves
    grid.cells = mirrordiag(grid.cells); //mirror grid back
  }
  rankedMoves = rankedMoves.map(move => (move + 4 - rots) % 4);
  for (let i = 0; i < 4 - rots; i++)
    grid.cells = rotategrid(grid.cells); //rotate grid back to original orientation
  return rankedMoves;
}
async function predictFineMove(grid) {
  let {one, two} = largestpos(grid.cells);
  let rots = 0;
  let mirror = false;
  if (one.row > 1)  //find how many times to rotate
    rots = 2;
  if ((one.col > 1 && one.row > 1) || (one.col < 2 && one.row < 2))
    rots += 1;
  for (let i = 0; i < rots; i++)
    grid.cells = rotategrid(grid.cells);
  ({one, two} = largestpos(grid.cells));
  if (two.row + two.col > 3){
    mirror = true;
    grid.cells = mirrordiag(grid.cells);
  }

  const log2grid = grid.cells.map(row =>row.map(cell => (cell ? Math.log2(cell.value) : 0)));
  const inputTensor = tf.tensor(log2grid, [4, 4], 'float32').reshape([1, 1, 4, 4]); //reshape for cnn
  const prediction = Finemodel.predict(inputTensor);
  const probs = await prediction.data();
  const rankedMoves = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);  //spread iterable, sort moves by probability
  if (mirror) {
    rankedMoves = rankedMoves.map(move => (move - 2*(move % 2) + 1)); //mirror moves
    grid.cells = mirrordiag(grid.cells); //mirror grid back
  }
  rankedMoves = rankedMoves.map(move => (move + 4 - rots) % 4);
  for (let i = 0; i < 4 - rots; i++)
    grid.cells = rotategrid(grid.cells); //rotate grid back to original orientation
  return rankedMoves; // 0: up, 1: right, 2: down, 3: left
}

async function autoImitationPlay(gameManager) {
  if (!imitationCheckbox.checked) return;

  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const rankedmoves = await predictImitationMove(gameManager.grid);
    for (let move of rankedmoves) {
      gameManager.move(move);
      if (JSON.stringify(gameManager.grid.cells) !== originalGridState) {
        break;
      }
      console.log("model got stuck lmao");
    }
    let delay = 200; //speed checks
    if (speedButtons.fast.checked) {
      delay = 0;
    } else if (speedButtons.slow.checked) {
      delay = 500;
    }
    setTimeout(() => autoImitationPlay(gameManager), delay); //repeat
  }
}
async function autoFinePlay(gameManager) {
  if (!fineCheckbox.checked) return;

  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const rankedmoves = await predictFineMove(gameManager.grid);
    for (let move of rankedmoves) {
      gameManager.move(move);
      if (JSON.stringify(gameManager.grid.cells) !== originalGridState) {
        break;
      }
      console.log("model got stuck lmao");
    }
    let delay = 200; //speed checks
    if (speedButtons.fast.checked) {
      delay = 0;
    } else if (speedButtons.slow.checked) {
      delay = 500;
    }
    setTimeout(() => autoFinePlay(gameManager), delay); //repeat
  }
}


async function autoStrategyPlay(gameManager) {
  if (!strategyCheckbox.checked) return;

  const strategic = new Strategic(gameManager);
  console.log("Strategic AI checked");
  if (!gameManager.isGameTerminated()) {
    console.log("game not over");
    const move = strategic.nextMove();
    console.log("move moved");
    gameManager.move(move);

    let delay = 200; // Speed checks
    if (speedButtons.fast.checked) {
      delay = 0;
    } else if (speedButtons.slow.checked) {
      delay = 500;
    }

    setTimeout(() => autoStrategyPlay(gameManager), delay); // Repeat
  }
}

window.requestAnimationFrame(() => {
  const gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  imitationCheckbox.addEventListener("change", async () => {
    if (imitationCheckbox.checked) {
      if (!Imitationmodel) {
        await loadImitationModel(); // ensure model is loaded
      }
      autoImitationPlay(gameManager);
    }
  });

  fineCheckbox.addEventListener("change", async () => {
    if (fineCheckbox.checked) {
      if (!Finemodel) {
        await loadFineModel(); // ensure model is loaded
      }
      autoFinePlay(gameManager);
    }
  });

  strategyCheckbox.addEventListener("change", () => {
    if (strategyCheckbox.checked) {
      autoStrategyPlay(gameManager);
    }
  });
});