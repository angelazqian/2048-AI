let Imitationmodel;
let Finemodel;

const imitationCheckbox = document.querySelector(".imitation-button");
const fineCheckbox = document.querySelector(".fine-button");
const speedSlider = document.getElementById('ai-speed-slider');

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

async function autoImitationPlay(gameManager) {
  if (!imitationCheckbox.checked) return;
  const sliderValue = parseInt(speedSlider.value);
  const delay = Math.max(0, 500 - (sliderValue * 5));
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
    setTimeout(() => autoImitationPlay(gameManager), delay); //repeat
  }
}
async function autoFinePlay(gameManager) {
  if (!fineCheckbox.checked) return;
  const sliderValue = parseInt(speedSlider.value);
  const delay = Math.max(0, 500 - (sliderValue * 5));
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
    setTimeout(() => autoFinePlay(gameManager), delay); //repeat
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
});