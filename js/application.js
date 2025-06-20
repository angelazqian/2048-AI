let RLmodel;
const reinforcementCheckbox = document.querySelector(".rl-button");
const speedButtons = {
  fast: document.querySelector(".full-speed-button"),
  normal: document.querySelector(".fast-speed-button"),
  slow: document.querySelector(".slow-speed-button"),
};

async function loadRLModel() {
  RLmodel = await tf.loadGraphModel('reinforcement-learn/2048_rl_tfjs/model.json');
  console.log("Reinforcement model loaded");
}

//predict the next move using the model
async function predictMove(grid) {
  const flattenedGrid = grid.cells.flat().map(cell => (cell ? cell.value : 0));
  const inputTensor = tf.tensor([flattenedGrid], [1, 16], 'float32');
  const prediction = RLmodel.predict(inputTensor);
  const moveIndex = prediction.argMax(-1).dataSync()[0]; //get the index of the best move
  return moveIndex; // 0: up, 1: right, 2: down, 3: left
}

async function autoRLPlay(gameManager) {
  if (!reinforcementCheckbox.checked) return;

  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const move = await predictMove(gameManager.grid);
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

  reinforcementCheckbox.addEventListener("change", () => {
    if (reinforcementCheckbox.checked) {
      autoRLPlay(gameManager);
    }
  });

  loadRLModel();
});