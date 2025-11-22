let Imitationmodel;
let Finemodel;

const imitationCheckbox = document.querySelector(".imitation-button");
const fineCheckbox = document.querySelector(".fine-button");

async function loadImitationModel() {
  Imitationmodel = await tf.loadGraphModel('model/2048_imitation_tfjs/model.json');
  console.log("Imitation model loaded");
}
async function loadFineModel() {
  Finemodel = await tf.loadGraphModel('model/2048_fine_tfjs/model.json');
  console.log("Finetuned model loaded");
}

async function predictmove(grid, mode) {
  const log2grid = grid.cells.map(row =>row.map(cell => (cell ? Math.log2(cell.value) : 0)));
  const inputTensor = tf.tensor(log2grid, [4, 4], 'float32').reshape([1, 1, 4, 4]); //reshape for cnn
  var prediction;
  if (mode === "imitation") prediction = Imitationmodel.predict(inputTensor);
  if (mode === "fine") prediction = Finemodel.predict(inputTensor);
  const probs = await prediction.data();
  const rankedMoves = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);  //spread iterable, sort moves by probability
  return rankedMoves; // 0: up, 1: right, 2: down, 3: left
}

async function autoplay(gameManager, mode) {
  if (mode === "imitation" && !imitationCheckbox.checked) return;
  if (mode === "fine" && !fineCheckbox.checked) return;
  const delay =500;
  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const rankedmoves = await predictmove(gameManager.grid, mode);
    for (let move of rankedmoves) {
      gameManager.move(move);
      if (JSON.stringify(gameManager.grid.cells) !== originalGridState) {
        break;
      }
      console.log("model got stuck lmao");
    }
    if (mode === "imitation") setTimeout(() => autoplay(gameManager, "imitation"), delay); //repeat
    if (mode === "fine") setTimeout(() => autoplay(gameManager, "fine"), delay);
  }
}

window.requestAnimationFrame(() => {
  const gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  imitationCheckbox.addEventListener("change", async () => {
    if (imitationCheckbox.checked) {
      if (!Imitationmodel) {
        await loadImitationModel(); // ensure model is loaded
      }
      autoplay(gameManager, "imitation");
    }
  });
  fineCheckbox.addEventListener("change", async () => {
    if (fineCheckbox.checked) {
      if (!Finemodel) {
        await loadFineModel(); // ensure model is loaded
      }
      autoplay(gameManager, "fine");
    }
  });
});