let Imitationmodel;
let Finemodel;
// let RLmodel;
// const reinforcementCheckbox = document.querySelector(".rl-button");
const imitationCheckbox = document.querySelector(".imitation-button");
const fineCheckbox = document.querySelector(".fine-button");
const strategyCheckbox = document.querySelector(".strategy-button");
const speedButtons = {
  fast: document.querySelector(".full-speed-button"),
  normal: document.querySelector(".fast-speed-button"),
  slow: document.querySelector(".slow-speed-button"),
};

async function loadImitationModel() {
  Imitationmodel = await tf.loadGraphModel('imitation-learn/2048_imitation_tfjs/model.json');
  console.log("Imitation model loaded");
}
async function loadFineModel() {
  Finemodel = await tf.loadGraphModel('full-model/2048_fine_tfjs/model.json');
  console.log("Finetuned model loaded");
}
// async function loadRLModel() {
//   RLmodel = await tf.loadGraphModel('reinforcement-learn/2048_rl_tfjs/model.json');
//   console.log("Reinforcement model loaded");
// }

//predict the next move using the model
async function predictImitationMove(grid) {
  const log2grid = grid.cells.map(row =>row.map(cell => (cell ? Math.log2(cell.value) : 0)));
  const inputTensor = tf.tensor(log2grid, [4, 4], 'float32').reshape([1, 1, 4, 4]); //reshape for cnn
  const prediction = Imitationmodel.predict(inputTensor);
  const probs = await prediction.data();
  const rankedMoves = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);  //spread iterable, sort moves by probability
  return rankedMoves; // 0: up, 1: right, 2: down, 3: left
}
async function predictFineMove(grid) {
  const log2grid = grid.cells.map(row =>row.map(cell => (cell ? Math.log2(cell.value) : 0)));
  const inputTensor = tf.tensor(log2grid, [4, 4], 'float32').reshape([1, 1, 4, 4]); //reshape for cnn
  const prediction = Finemodel.predict(inputTensor);
  const probs = await prediction.data();
  const rankedMoves = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);  //spread iterable, sort moves by probability
  return rankedMoves; // 0: up, 1: right, 2: down, 3: left
}

// async function predictRLMove(grid) {
//   const flattenedGrid = grid.cells.flat().map(cell => (cell ? cell.value : 0));
//   const inputTensor = tf.tensor([flattenedGrid], [1, 16], 'float32');
//   const prediction = RLmodel.predict(inputTensor);
//   const moveIndex = prediction.argMax(-1).dataSync()[0]; //get the index of the best move
//   return moveIndex; // 0: up, 1: right, 2: down, 3: left
// }

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

// async function autoRLPlay(gameManager) {
//   if (!reinforcementCheckbox.checked) return;

//   if (!gameManager.isGameTerminated()) {
//     const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
//     const move = await predictRLMove(gameManager.grid);
//     gameManager.move(move);
//     while (JSON.stringify(gameManager.grid.cells) === originalGridState) {
//       console.log("Model got stuck, picking a random move...");
//       gameManager.move(Math.floor(Math.random() * 4));
//     }
//     let delay = 200; //speed checks
//     if (speedButtons.fast.checked) {
//       delay = 0;
//     } else if (speedButtons.slow.checked) {
//       delay = 500;
//     }
//     setTimeout(() => autoRLPlay(gameManager), delay); //repeat
//   }
// }

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
  // reinforcementCheckbox.addEventListener("change", async () => {
  //   if (reinforcementCheckbox.checked) {
  //     if (!RLmodel) {
  //       await loadRLModel(); // ensure model is loaded
  //     }
  //     autonRLlay(gameManager);
  //   }
  // });
  strategyCheckbox.addEventListener("change", () => {
    if (strategyCheckbox.checked) {
      autoStrategyPlay(gameManager);
    }
  });
});