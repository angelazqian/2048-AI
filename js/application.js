const MODEL_REGISTRY = [
  {
    key: "imitation",
    label: "Imitation",
    title: "Trained off real games!",
    modelPath: "model/2048_imitation_tfjs/model.json",
    buttonClass: "imitation-button",
  },
  {
    key: "fine",
    label: "Finetuned Imitation",
    title: "Finetuned through self-play",
    modelPath: "model/2048_fine_tfjs/model.json",
    buttonClass: "fine-button",
  },
  {
    key: "dqn",
    label: "Reinforcement",
    title: "Trained through self-play wiith RL",
    modelPath: "model/2048_dqn_tfjs/model.json",
    buttonClass: "dqn-button",
  },
];

const loadedModels = {};
const checkboxes   = {};
const speedSlider = document.getElementById('ai-speed-slider');

async function loadModel(entry) {
  if (!loadedModels[entry.key]) {
    loadedModels[entry.key] = await tf.loadGraphModel(entry.modelPath);
    console.log(entry.label + " model loaded");
  }
  return loadedModels[entry.key];
}

async function predictmove(grid, key) {
  const log2grid = grid.cells.map(row => row.map(cell => (cell ? Math.log2(cell.value) : 0)));
  const inputTensor = tf.tensor(log2grid, [4, 4], 'float32').reshape([1, 1, 4, 4]); //reshape for cnn
  const prediction = loadedModels[key].predict(inputTensor);
  const probs = await prediction.data();
  const rankedMoves = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);  //spread iterable, sort moves by probability
  return rankedMoves; // 0: up, 1: right, 2: down, 3: left
}

async function autoplay(gameManager, key) {
  if (!checkboxes[key].checked) return;
  const sliderValue = parseInt(speedSlider.value);
  const delay = Math.max(0, 500 - (sliderValue * 5));
  if (!gameManager.isGameTerminated()) {
    const originalGridState = JSON.stringify(gameManager.grid.cells); // save current grid state
    const rankedmoves = await predictmove(gameManager.grid, key);
    for (let move of rankedmoves) {
      gameManager.move(move);
      if (JSON.stringify(gameManager.grid.cells) !== originalGridState) {
        break;
      }
      console.log("model got stuck lmao");
    }
    setTimeout(() => autoplay(gameManager, key), delay); //repeat
  }
}

window.requestAnimationFrame(() => {
  const gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);

  const aiPanel = document.querySelector(".ai-panel");
  const speedHeader = aiPanel.querySelector(".ai-panel-header:nth-of-type(2)"); // "Speed:" header

  MODEL_REGISTRY.forEach(entry => {
    const label = document.createElement("label");
    label.title = entry.title;
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "ai-mode";
    radio.className = entry.buttonClass;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(entry.label));
    aiPanel.insertBefore(label, speedHeader);
    aiPanel.insertBefore(document.createElement("br"), speedHeader);
    checkboxes[entry.key] = radio;
    radio.addEventListener("change", async () => {
      if (radio.checked) {
        await loadModel(entry);
        autoplay(gameManager, entry.key);
      }
    });
  });
});