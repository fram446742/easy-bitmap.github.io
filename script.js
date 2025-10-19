document.addEventListener("DOMContentLoaded", () => {
  let isDrawing = false;
  let currentLanguage = "en";
  let penSize = 1;
  let currentMode = "fill";
  let isRightMouseDown = false;
  let isLeftMouseDown = false;

  const gridContainer = document.getElementById("grid-container");
  const generateCodeButton = document.getElementById("generate-code");
  const langSwitchButton = document.getElementById("lang-switch");
  const messageContainer = document.getElementById("message-container");
  const cppCodeContainer = document.getElementById("cpp-code-container");
  const cppCodeElement = document.getElementById("cpp-code");
  const penSizeSlider = document.getElementById("pen-size");
  const penSizeValue = document.getElementById("pen-size-value");
  const modeFillButton = document.getElementById("mode-fill");
  const modeEraseButton = document.getElementById("mode-erase");
  const generateBitmapButton = document.getElementById("generate-bitmap");
  const helpButton = document.getElementById("help-button");
  const invertColorsButton = document.getElementById("invert-colors");
  const importBitmapButton = document.getElementById("import-bitmap");
  const clearGridButton = document.getElementById("clear-grid");
  const rotateButton = document.getElementById("rotate-90");
  const flipHorizontalButton = document.getElementById("flip-horizontal");
  const flipVerticalButton = document.getElementById("flip-vertical");
  const outputFormatSelect = document.getElementById("output-format");
  const helpModal = document.getElementById("help-modal");
  const importModal = document.getElementById("import-modal");
  const copySuccessModal = document.getElementById("copy-success-modal");
  const messageModal = document.getElementById("message-modal");
  const messageModalTitle = document.getElementById("message-modal-title");
  const messageModalText = document.getElementById("message-modal-text");
  const messageOkButton = document.getElementById("message-ok-button");
  const closeButtons = document.querySelectorAll(".close-button");
  const importTextarea = document.getElementById("import-textarea");
  const bitmapWidthInput = document.getElementById("bitmap-width");
  const bitmapHeightInput = document.getElementById("bitmap-height");

  let gridWidth = 8;
  let gridHeight = 8;
  const undoStack = [];
  let currentAction = null;

  penSizeSlider.addEventListener("input", updatePenSize);
  modeFillButton.addEventListener("click", () => setMode("fill"));
  modeEraseButton.addEventListener("click", () => setMode("erase"));
  generateCodeButton.addEventListener("click", generateCppCode);
  langSwitchButton.addEventListener("change", (e) => {
    setLanguage(e.target.value);
  });
  generateBitmapButton.addEventListener("click", generateBitmap);
  helpButton.addEventListener("click", openHelpModal);
  invertColorsButton.addEventListener("click", invertColors);
  importBitmapButton.addEventListener("click", openImportModal);
  clearGridButton.addEventListener("click", clearGrid);
  messageOkButton.addEventListener("click", () => closeModal(messageModal));
  closeButtons.forEach((button) => {
    button.addEventListener("click", () =>
      closeModal(button.parentElement.parentElement)
    );
  });
  window.addEventListener("click", (e) => {
    if (e.target == helpModal) closeModal(helpModal);
    if (e.target == copySuccessModal) closeModal(copySuccessModal);
    if (e.target == importModal) closeModal(importModal);
    if (e.target == messageModal) closeModal(messageModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      if (helpModal.style.display === "block") closeModal(helpModal);
      if (copySuccessModal.style.display === "block")
        closeModal(copySuccessModal);
      if (importModal.style.display === "block") closeModal(importModal);
      if (messageModal.style.display === "block") closeModal(messageModal);
    }
    if (
      e.key.toLowerCase() === strings[currentLanguage].hotkeyFill.toLowerCase()
    )
      setMode("fill");
    if (
      e.key.toLowerCase() === strings[currentLanguage].hotkeyErase.toLowerCase()
    )
      setMode("erase");
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
      e.preventDefault();
      undo();
    }
  });

  document.addEventListener("contextmenu", (e) => e.preventDefault());
  gridContainer.addEventListener("wheel", handleWheel);
  penSizeSlider.addEventListener("wheel", handleWheel);

  function handleWheel(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
      if (penSize < 10) {
        penSize += 1;
        penSizeSlider.value = penSize;
        penSizeValue.textContent = penSize;
      }
    } else {
      if (penSize > 1) {
        penSize -= 1;
        penSizeSlider.value = penSize;
        penSizeValue.textContent = penSize;
      }
    }
  }

  function recordChange(cell, previousState) {
    if (!currentAction) return;
    const cellKey = `${cell.dataset.x},${cell.dataset.y}`;
    if (!currentAction.changes.has(cellKey))
      currentAction.changes.set(cellKey, previousState);
  }

  function fillCells(cell) {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const halfPen = Math.floor(penSize / 2);
    for (let dy = -halfPen; dy <= halfPen; dy++) {
      for (let dx = -halfPen; dx <= halfPen; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const index = ny * gridWidth + nx;
          const targetCell = gridContainer.children[index];
          if (targetCell && !targetCell.classList.contains("active")) {
            recordChange(targetCell, false);
            targetCell.classList.add("active");
          }
        }
      }
    }
  }

  function eraseCells(cell) {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const halfPen = Math.floor(penSize / 2);
    for (let dy = -halfPen; dy <= halfPen; dy++) {
      for (let dx = -halfPen; dx <= halfPen; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const index = ny * gridWidth + nx;
          const targetCell = gridContainer.children[index];
          if (targetCell && targetCell.classList.contains("active")) {
            recordChange(targetCell, true);
            targetCell.classList.remove("active");
          }
        }
      }
    }
  }

  function createGrid() {
    gridWidth = Math.min(parseInt(bitmapWidthInput.value), 128);
    gridHeight = Math.min(parseInt(bitmapHeightInput.value), 128);
    bitmapWidthInput.value = gridWidth;
    bitmapHeightInput.value = gridHeight;
    penSize = parseInt(penSizeSlider.value);
    penSizeValue.textContent = penSize;
    gridContainer.innerHTML = "";

    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.75;
    const cellSizeX = Math.floor(maxWidth / gridWidth);
    const cellSizeY = Math.floor(maxHeight / gridHeight);
    const cellSize = Math.max(Math.min(cellSizeX, cellSizeY), 1);
    gridContainer.style.width = gridWidth * cellSize + "px";
    gridContainer.style.height = gridHeight * cellSize + "px";

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.style.width = cell.style.height = cellSize + "px";
        gridContainer.appendChild(cell);
      }
    }

    cppCodeContainer.style.display = "none";
  }

  function updatePenSize() {
    penSize = parseInt(penSizeSlider.value);
    penSizeValue.textContent = penSize;
  }

  function setMode(mode) {
    currentMode = mode;
    if (mode === "fill") {
      modeFillButton.classList.add("active");
      modeEraseButton.classList.remove("active");
    } else {
      modeEraseButton.classList.add("active");
      modeFillButton.classList.remove("active");
    }
  }

  function generateCppCode() {
    const cells = gridContainer.getElementsByClassName("cell");
    const format = outputFormatSelect.value;
    let cppArray = [];
    for (let y = 0; y < gridHeight; y++) {
      let byte = 0;
      let bitCount = 0;
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        const cell = cells[index];
        const isActive = cell.classList.contains("active") ? 1 : 0;
        byte = (byte << 1) | isActive;
        bitCount++;
        if (bitCount === 8 || x === gridWidth - 1) {
          if (bitCount < 8) byte = byte << (8 - bitCount);
          if (format === "binary") {
            cppArray.push("B" + byte.toString(2).padStart(8, "0"));
          } else {
            cppArray.push("0x" + byte.toString(16).padStart(2, "0"));
          }
          byte = 0;
          bitCount = 0;
        }
      }
    }
    const cppCode = "uint8_t bitmap[] = {\n    " + cppArray.join(", ") + "\n};";
    cppCodeElement.textContent = cppCode;
    cppCodeContainer.style.display = "block";
  }

  function generateBitmap() {
    const code = cppCodeElement.textContent;
    if (!code) {
      showMessage(
        currentLanguage === "en"
          ? "No code to copy. Please generate the C++ code first."
          : "Нет кода для копирования. Пожалуйста, сначала сгенерируйте C++ код."
      );
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => {
        showCopySuccess();
      })
      .catch((err) => {
        alert(
          currentLanguage === "en"
            ? "Failed to copy code."
            : "Не удалось скопировать код."
        );
      });
  }

  function invertColors() {
    const cells = gridContainer.getElementsByClassName("cell");
    for (let cell of cells) {
      recordChange(cell, cell.classList.contains("active"));
      cell.classList.toggle("active");
    }
  }

  function clearGrid() {
    const cells = gridContainer.getElementsByClassName("cell");
    for (let cell of cells) {
      if (cell.classList.contains("active")) {
        recordChange(cell, true);
        cell.classList.remove("active");
      }
    }
    cppCodeContainer.style.display = "none";
  }

  function showCopySuccess() {
    copySuccessModal.style.display = "block";
  }

  function setLanguage(lang) {
    currentLanguage = lang;
    const s = strings[lang];
    document.getElementById("title").textContent = s.title;
    document.getElementById("bitmap-width-label").textContent = s.widthLabel;
    document.getElementById("bitmap-height-label").textContent = s.heightLabel;
    document.getElementById("pen-size-label").textContent = s.penSizeLabel;
    document.getElementById("output-format-label").textContent =
      s.outputFormatLabel;
    langSwitchButton.value = lang;
    modeFillButton.textContent = s.modeFill;
    modeEraseButton.textContent = s.modeErase;
    helpButton.textContent = s.helpButton;
    invertColorsButton.textContent = s.invertColors;
    importBitmapButton.textContent = s.importBitmap;
    clearGridButton.textContent = s.clearGrid;
    document.querySelectorAll("#links a")[0].textContent = s.github;
    document.getElementById("cpp-code-title").textContent = s.cppCodeTitle;
    generateBitmapButton.textContent = s.copyCode;
    document.getElementById("star-github").innerHTML = s.starGithub;

    rotateButton.textContent = s.rotate90;
    flipHorizontalButton.textContent = s.flipHorizontal;
    flipVerticalButton.textContent = s.flipVertical;

    document.getElementById("help-intro").textContent = s.helpIntro;
    document.querySelector(".help-fill-mode").innerHTML = s.helpFillMode;
    document.querySelector(".help-erase-mode").innerHTML = s.helpEraseMode;
    document.querySelector(".help-pen-size").innerHTML = s.helpPenSize;
    document.querySelector(".help-import-bitmap").innerHTML =
      s.helpImportBitmap;
    document.querySelector(".help-generate-code").innerHTML =
      s.helpGenerateCode;
    document.querySelector(".help-copy-code").innerHTML = s.helpCopyCode;
    document.querySelector(".help-invert-colors").innerHTML =
      s.helpInvertColors;
    document.querySelector(".help-clear-grid").innerHTML = s.helpClearGrid;
    document.querySelector(".help-hotkeys").innerHTML = s.helpHotkeys
      .replace("{fill}", s.hotkeyFill)
      .replace("{erase}", s.hotkeyErase);
    document.querySelector(".help-rotate").innerHTML = s.helpRotate;
    document.querySelector(".help-flip-h").innerHTML = s.helpFlipH;
    document.querySelector(".help-flip-v").innerHTML = s.helpFlipV;
    document.querySelector(".help-language").innerHTML = s.helpLanguage;
    document.querySelector(".help-support").innerHTML = s.helpSupport;
    document.getElementById("help-outro").textContent = s.helpOutro;

    document.getElementById("import-title").textContent = s.importTitle;
    document.getElementById("import-instr").textContent = s.importInstr;

    document.getElementById("copy-success-title").textContent =
      s.copySuccessTitle;
    document.getElementById("copy-success-text").textContent =
      s.copySuccessText;

    clearMessage();
  }

  function showMessage(message) {
    messageContainer.textContent = message;
  }

  function clearMessage() {
    messageContainer.textContent = "";
  }

  function openHelpModal() {
    helpModal.style.display = "block";
  }

  function openImportModal() {
    importTextarea.value = "";
    importModal.style.display = "block";
  }

  function closeModal(modal) {
    modal.style.display = "none";
  }

  function importBitmap() {
    const input = importTextarea.value.trim();
    if (!input) {
      showMessageModal(
        strings[currentLanguage].error,
        strings[currentLanguage].enterBitmapCode
      );
      return;
    }
    let code = input;
    const arrayMatch = input.match(/\{([\s\S]*?)\}/);
    if (arrayMatch) code = arrayMatch[1];
    let bytes = code
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b !== "");
    if (bytes.length > 0 && bytes[0].startsWith("B")) {
      bytes = bytes.map((b) => {
        const bin = b.substring(1);
        const value = parseInt(bin, 2);
        return "0x" + value.toString(16).padStart(2, "0");
      });
    }
    const totalBits = bytes.length * 8;
    if (totalBits !== gridWidth * gridHeight) {
      showMessageModal(
        strings[currentLanguage].error,
        strings[currentLanguage].sizeMismatch
          .replace("{expected}", gridWidth * gridHeight)
          .replace("{got}", totalBits)
      );
      return;
    }
    const cells = gridContainer.getElementsByClassName("cell");
    let bitIndex = 0;
    for (let byte of bytes) {
      byte = byte.replace(/0x/i, "");
      let byteValue = parseInt(byte, 16);
      for (let i = 7; i >= 0; i--) {
        if (bitIndex >= cells.length) break;
        const cell = cells[bitIndex];
        const isActive = (byteValue >> i) & 1;
        if (isActive) {
          recordChange(cell, false);
          cell.classList.add("active");
        } else {
          recordChange(cell, true);
          cell.classList.remove("active");
        }
        bitIndex++;
      }
    }
    closeModal(importModal);
    showMessageModal(
      strings[currentLanguage].success,
      strings[currentLanguage].bitmapImported
    );
  }

  function showMessageModal(title, text) {
    messageModalTitle.textContent = title;
    messageModalText.textContent = text;
    messageModal.style.display = "block";
    if (title === strings[currentLanguage].error) {
      messageOkButton.style.backgroundColor = "#28a745";
      messageOkButton.style.color = "#fff";
    } else {
      messageOkButton.style.backgroundColor = "#007acc";
      messageOkButton.style.color = "#fff";
    }
  }

  function undo() {
    if (undoStack.length === 0) return;
    const lastAction = undoStack.pop();
    for (let [key, prevState] of lastAction.changes.entries()) {
      const [x, y] = key.split(",").map(Number);
      const index = y * gridWidth + x;
      const cell = gridContainer.children[index];
      if (cell) {
        if (prevState) cell.classList.add("active");
        else cell.classList.remove("active");
      }
    }
  }

  function rotate90() {
    const cells = Array.from(gridContainer.children);
    const oldWidth = gridWidth;
    const oldHeight = gridHeight;
    let matrix = [];
    for (let y = 0; y < oldHeight; y++) {
      let row = [];
      for (let x = 0; x < oldWidth; x++) {
        const index = y * oldWidth + x;
        const cell = cells[index];
        row.push(cell.classList.contains("active"));
      }
      matrix.push(row);
    }

    let rotated = [];
    for (let x = 0; x < oldWidth; x++) {
      let row = [];
      for (let y = oldHeight - 1; y >= 0; y--) {
        row.push(matrix[y][x]);
      }
      rotated.push(row);
    }

    const newCells = gridContainer.children;
    for (let i = 0; i < newCells.length; i++)
      newCells[i].classList.remove("active");
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        if (rotated[y][x]) newCells[index].classList.add("active");
      }
    }
  }

  function flipHorizontal() {
    const cells = Array.from(gridContainer.children);
    let matrix = [];
    for (let y = 0; y < gridHeight; y++) {
      let row = [];
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        row.push(cells[index].classList.contains("active"));
      }
      matrix.push(row);
    }

    let flipped = [];
    for (let y = 0; y < gridHeight; y++) {
      let row = [];
      for (let x = 0; x < gridWidth; x++) {
        row.push(matrix[y][gridWidth - 1 - x]);
      }
      flipped.push(row);
    }

    const newCells = gridContainer.children;
    for (let i = 0; i < newCells.length; i++)
      newCells[i].classList.remove("active");
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        if (flipped[y][x]) newCells[index].classList.add("active");
      }
    }
  }

  function flipVertical() {
    const cells = Array.from(gridContainer.children);
    let matrix = [];
    for (let y = 0; y < gridHeight; y++) {
      let row = [];
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        row.push(cells[index].classList.contains("active"));
      }
      matrix.push(row);
    }

    let flipped = [];
    for (let y = 0; y < gridHeight; y++) {
      flipped.push(matrix[gridHeight - 1 - y]);
    }

    const newCells = gridContainer.children;
    for (let i = 0; i < newCells.length; i++)
      newCells[i].classList.remove("active");
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        if (flipped[y][x]) newCells[index].classList.add("active");
      }
    }
  }

  rotateButton.addEventListener("click", rotate90);
  flipHorizontalButton.addEventListener("click", flipHorizontal);
  flipVerticalButton.addEventListener("click", flipVertical);
  bitmapWidthInput.addEventListener("change", createGrid);
  bitmapHeightInput.addEventListener("change", createGrid);
  document
    .getElementById("import-confirm")
    .addEventListener("click", importBitmap);

  createGrid();
  setLanguage("en");
  gridContainer.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("cell")) {
      if (e.button === 0) {
        isLeftMouseDown = true;
        isDrawing = true;
        currentAction = { changes: new Map() };
        handleDrawing(e.target, "left");
      } else if (e.button === 2) {
        isRightMouseDown = true;
        isDrawing = true;
        currentAction = { changes: new Map() };
        handleDrawing(e.target, "right");
      }
    }
  });

  gridContainer.addEventListener("mouseup", (e) => {
    if (e.button === 0) isLeftMouseDown = false;
    else if (e.button === 2) isRightMouseDown = false;
    if (!isLeftMouseDown && !isRightMouseDown) {
      isDrawing = false;
      if (currentAction && currentAction.changes.size > 0) {
        undoStack.push(currentAction);
        if (undoStack.length > 100) undoStack.shift();
        currentAction = null;
      }
    }
  });

  gridContainer.addEventListener("mouseover", (e) => {
    if (isDrawing && e.target.classList.contains("cell")) {
      if (isLeftMouseDown) handleDrawing(e.target, "left");
      else if (isRightMouseDown) handleDrawing(e.target, "right");
    }
  });

  function handleDrawing(cell, button) {
    if (currentMode === "fill") {
      if (button === "left") fillCells(cell);
      else if (button === "right") eraseCells(cell);
    } else {
      if (button === "left") eraseCells(cell);
      else if (button === "right") fillCells(cell);
    }
  }
});
