let Imitationmodel;
let RLmodel;
const reinforcementCheckbox = document.querySelector(".rl-button");
const imitationCheckbox = document.querySelector(".imitation-button");
// const strategyCheckbox = document.querySelector(".strategy-button");
const speedButtons = {
  fast: document.querySelector(".full-speed-button"),
  normal: document.querySelector(".fast-speed-button"),
  slow: document.querySelector(".slow-speed-button"),
};

async function loadImitationModel() {
  Imitationmodel = await tf.loadGraphModel('imitation-learn/2048_imitation_tfjs/model.json');
  console.log("Imitation model loaded");
}
async function loadRLModel() {
  RLmodel = await tf.loadGraphModel('reinforcement-learn/2048_rl_tfjs/model.json');
  console.log("Reinforcement model loaded");
}

//predict the next move using the model
async function predictImitationMove(grid) {
  const flattenedGrid = grid.cells.flat().map(cell => (cell ? Math.log2(cell.value) : 0));
  const inputTensor = tf.tensor([flattenedGrid], [1, 16], 'float32');
  const prediction = Imitationmodel.predict(inputTensor);
  const moveIndex = prediction.argMax(-1).dataSync()[0]; //get the index of the best move
  return moveIndex; // 0: up, 1: right, 2: down, 3: left
}
async function predictRLMove(grid) {
  const flattenedGrid = grid.cells.flat().map(cell => (cell ? cell.value : 0));
  const inputTensor = tf.tensor([flattenedGrid], [1, 16], 'float32');
  const prediction = RLmodel.predict(inputTensor);
  const moveIndex = prediction.argMax(-1).dataSync()[0]; //get the index of the best move
  return moveIndex; // 0: up, 1: right, 2: down, 3: left
}

// async function autoStrategyPlay(gameManager) {
//   if (!strategyCheckbox.checked) return;

//   const strategic = new Strategic(gameManager);
//   console.log("Strategic AI checked");
//   if (!gameManager.isGameTerminated()) {
//     console.log("game not over");
//     const move = strategic.nextMove();
//     console.log("move moved");
//     gameManager.move(move);

//     let delay = 200; // Speed checks
//     if (speedButtons.fast.checked) {
//       delay = 0;
//     } else if (speedButtons.slow.checked) {
//       delay = 500;
//     }

//     setTimeout(() => autoStrategyPlay(gameManager), delay); // Repeat
//   }
// }

async function autoImitationPlay(gameManager) {
  if (!imitationCheckbox.checked) return;

  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const move = await predictImitationMove(gameManager.grid);
    gameManager.move(move);
    rot = 0;
    order = [0,1,3,2];
    while (JSON.stringify(gameManager.grid.cells) === originalGridState) {
      console.log("Model got stuck, going through move rotation...");
      gameManager.move(order[rot]);
      rot++;
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
async function autoRLPlay(gameManager) {
  if (!reinforcementCheckbox.checked) return;

  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const move = await predictRLMove(gameManager.grid);
    gameManager.move(move);
    while (JSON.stringify(gameManager.grid.cells) === originalGridState) {
      console.log("Model got stuck, picking a random move...");
      gameManager.move(Math.floor(Math.random() * 4));
    }
    let delay = 200; //speed checks
    if (speedButtons.fast.checked) {
      delay = 0;
    } else if (speedButtons.slow.checked) {
      delay = 500;
    }
    setTimeout(() => autoRLPlay(gameManager), delay); //repeat
  }
}


window.requestAnimationFrame(() => {
  const gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  // strategyCheckbox.addEventListener("change", () => {
  //   if (strategyCheckbox.checked) {
  //     autoStrategyPlay(gameManager);
  //   }
  // });
  imitationCheckbox.addEventListener("change", () => {
    if (imitationCheckbox.checked) {
      autoImitationPlay(gameManager);
    }
  });
  reinforcementCheckbox.addEventListener("change", () => {
    if (reinforcementCheckbox.checked) {
      autoRLPlay(gameManager);
    }
  });
  loadImitationModel();
  loadRLModel();
});