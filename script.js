// script.js
document.addEventListener('DOMContentLoaded', () => {
    let isDrawing = false;
    let currentLanguage = 'en';
    let penSize = 1;
    let currentMode = 'fill'; // 'fill' or 'erase'
    let isRightMouseDown = false;
    let isLeftMouseDown = false;

    const gridContainer = document.getElementById('grid-container');
    const generateGridButton = document.getElementById('generate-grid');
    const generateCodeButton = document.getElementById('generate-code');
    const langSwitchButton = document.getElementById('lang-switch');
    const messageContainer = document.getElementById('message-container');
    const cppCodeContainer = document.getElementById('cpp-code-container');
    const cppCodeElement = document.getElementById('cpp-code');
    const penSizeSlider = document.getElementById('pen-size');
    const penSizeValue = document.getElementById('pen-size-value');
    const modeFillButton = document.getElementById('mode-fill');
    const modeEraseButton = document.getElementById('mode-erase');
    const generateBitmapButton = document.getElementById('generate-bitmap');
    const helpButton = document.getElementById('help-button');
    const invertColorsButton = document.getElementById('invert-colors');
    const importBitmapButton = document.getElementById('import-bitmap');
    const clearGridButton = document.getElementById('clear-grid');
    const helpModal = document.getElementById('help-modal');
    const importModal = document.getElementById('import-modal');
    const copySuccessModal = document.getElementById('copy-success-modal');
    const messageModal = document.getElementById('message-modal');
    const messageModalTitle = document.getElementById('message-modal-title');
    const messageModalText = document.getElementById('message-modal-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const closeButtons = document.querySelectorAll('.close-button');
    const importTextarea = document.getElementById('import-textarea');
    const importConfirmButton = document.getElementById('import-confirm');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');

    let gridWidth = 16;
    let gridHeight = 16;

    // Event Listeners
    generateGridButton.addEventListener('click', createGrid);
    penSizeSlider.addEventListener('input', updatePenSize);
    modeFillButton.addEventListener('click', () => setMode('fill'));
    modeEraseButton.addEventListener('click', () => setMode('erase'));
    generateCodeButton.addEventListener('click', generateCppCode);
    langSwitchButton.addEventListener('click', toggleLanguage);
    generateBitmapButton.addEventListener('click', generateBitmap);
    helpButton.addEventListener('click', openHelpModal);
    invertColorsButton.addEventListener('click', invertColors);
    importBitmapButton.addEventListener('click', openImportModal);
    importConfirmButton.addEventListener('click', importBitmap);
    clearGridButton.addEventListener('click', clearGrid);
    messageOkButton.addEventListener('click', () => closeModal(messageModal));
    closeButtons.forEach(button => {
        button.addEventListener('click', () => closeModal(button.parentElement.parentElement));
    });
    window.addEventListener('click', (e) => {
        if (e.target == helpModal) {
            closeModal(helpModal);
        }
        if (e.target == copySuccessModal) {
            closeModal(copySuccessModal);
        }
        if (e.target == importModal) {
            closeModal(importModal);
        }
        if (e.target == messageModal) {
            closeModal(messageModal);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Hotkeys for 'D' and 'E' keys, independent of keyboard layout
        if (e.code === 'KeyD') {
            setMode('fill');
        }
        if (e.code === 'KeyE') {
            setMode('erase');
        }

        if (e.key === 'Enter') {
            if (document.activeElement === widthInput || document.activeElement === heightInput) {
                createGrid();
            }
        }

        if (e.key === 'Escape') {
            // Close all open modals
            if (helpModal.style.display === 'block') {
                closeModal(helpModal);
            }
            if (copySuccessModal.style.display === 'block') {
                closeModal(copySuccessModal);
            }
            if (importModal.style.display === 'block') {
                closeModal(importModal);
            }
            if (messageModal.style.display === 'block') {
                closeModal(messageModal);
            }
        }
    });

    // Prevent default context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Adjust pen size with mouse wheel on canvas or slider
    gridContainer.addEventListener('wheel', handleWheel);
    penSizeSlider.addEventListener('wheel', handleWheel);

    function handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            // Scroll up - increase pen size
            if (penSize < 10) {
                penSize += 1;
                penSizeSlider.value = penSize;
                penSizeValue.textContent = penSize;
            }
        } else {
            // Scroll down - decrease pen size
            if (penSize > 1) {
                penSize -= 1;
                penSizeSlider.value = penSize;
                penSizeValue.textContent = penSize;
            }
        }
    }

    // Added wheel event listeners for inputs
    widthInput.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        let newValue = parseInt(widthInput.value) + delta;
        if (newValue >= parseInt(widthInput.min) && newValue <= parseInt(widthInput.max)) {
            widthInput.value = newValue;
            gridWidth = newValue;
            createGrid();
        }
    });

    heightInput.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        let newValue = parseInt(heightInput.value) + delta;
        if (newValue >= parseInt(heightInput.min) && newValue <= parseInt(heightInput.max)) {
            heightInput.value = newValue;
            gridHeight = newValue;
            createGrid();
        }
    });

    // Mouse events for drawing
    gridContainer.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('cell')) {
            if (e.button === 0) { // Left mouse button
                isLeftMouseDown = true;
                isDrawing = true;
                handleDrawing(e.target, 'left');
            } else if (e.button === 2) { // Right mouse button
                isRightMouseDown = true;
                isDrawing = true;
                handleDrawing(e.target, 'right');
            }
        }
    });

    gridContainer.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isLeftMouseDown = false;
        } else if (e.button === 2) {
            isRightMouseDown = false;
        }
        if (!isLeftMouseDown && !isRightMouseDown) {
            isDrawing = false;
        }
    });

    gridContainer.addEventListener('mouseover', (e) => {
        if (isDrawing && e.target.classList.contains('cell')) {
            if (isLeftMouseDown) {
                handleDrawing(e.target, 'left');
            } else if (isRightMouseDown) {
                handleDrawing(e.target, 'right');
            }
        }
    });

    function handleDrawing(cell, button) {
        if (currentMode === 'fill') {
            if (button === 'left') {
                fillCells(cell);
            } else if (button === 'right') {
                eraseCells(cell);
            }
        } else if (currentMode === 'erase') {
            if (button === 'left') {
                eraseCells(cell);
            } else if (button === 'right') {
                fillCells(cell);
            }
        }
    }

    function createGrid() {
        gridWidth = parseInt(widthInput.value);
        gridHeight = parseInt(heightInput.value);
        penSize = parseInt(penSizeSlider.value);
        penSizeValue.textContent = penSize;

        if (gridWidth <= 0 || gridHeight <= 0 || isNaN(gridWidth) || isNaN(gridHeight)) {
            showMessage(currentLanguage === 'en' ? 'Grid size must be positive numbers.' : 'Размер сетки должен быть положительным числом.');
            return;
        } else if (gridWidth > 128 || gridHeight > 128) {
            showMessage(currentLanguage === 'en' ? 'Grid size is too big (max 128x128).' : 'Размер сетки слишком большой (макс 128x128).');
            return;
        } else {
            clearMessage();
        }

        // Store current grid data
        const currentGridData = new Map();
        const currentCells = gridContainer.getElementsByClassName('cell');
        for (let cell of currentCells) {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const key = `${x},${y}`;
            const isActive = cell.classList.contains('active');
            currentGridData.set(key, isActive);
        }

        gridContainer.innerHTML = '';

        // Calculate cell size to fit within screen
        const maxWidth = window.innerWidth * 0.9; // Use 90% of window width
        const maxHeight = window.innerHeight * 0.6; // Use 60% of window height

        const cellSizeX = Math.floor(maxWidth / gridWidth);
        const cellSizeY = Math.floor(maxHeight / gridHeight);
        const cellSize = Math.min(cellSizeX, cellSizeY);

        gridContainer.style.width = (gridWidth * cellSize) + 'px';
        gridContainer.style.height = (gridHeight * cellSize) + 'px';

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.width = cell.style.height = cellSize + 'px';

                const key = `${x},${y}`;
                if (currentGridData.has(key) && currentGridData.get(key)) {
                    cell.classList.add('active');
                }

                gridContainer.appendChild(cell);
            }
        }

        // Hide the generated code when creating a new grid
        cppCodeContainer.style.display = 'none';
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
                    if (targetCell && !targetCell.classList.contains('active')) {
                        targetCell.classList.add('active');
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
                    if (targetCell && targetCell.classList.contains('active')) {
                        targetCell.classList.remove('active');
                    }
                }
            }
        }
    }

    function updatePenSize() {
        penSize = parseInt(penSizeSlider.value);
        penSizeValue.textContent = penSize;
    }

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'fill') {
            modeFillButton.classList.add('active');
            modeEraseButton.classList.remove('active');
        } else if (mode === 'erase') {
            modeEraseButton.classList.add('active');
            modeFillButton.classList.remove('active');
        }
    }

    function generateCppCode() {
        const cells = gridContainer.getElementsByClassName('cell');
        let cppArray = [];
        for (let y = 0; y < gridHeight; y++) {
            let byte = 0;
            let bitCount = 0;
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x;
                const cell = cells[index];
                const isActive = cell.classList.contains('active') ? 1 : 0;
                byte = (byte << 1) | isActive;
                bitCount++;

                if (bitCount === 8 || x === gridWidth - 1) {
                    if (bitCount < 8) {
                        byte = byte << (8 - bitCount);
                    }
                    cppArray.push('0x' + byte.toString(16).padStart(2, '0'));
                    byte = 0;
                    bitCount = 0;
                }
            }
        }
        const cppCode = 'uint8_t bitmap[] = {\n    ' + cppArray.join(', ') + '\n};';
        cppCodeElement.textContent = cppCode;
        cppCodeContainer.style.display = 'block';
    }

    function generateBitmap() {
        const code = cppCodeElement.textContent;
        if (!code) {
            showMessage(currentLanguage === 'en' ? 'No code to copy. Please generate the C++ code first.' : 'Нет кода для копирования. Пожалуйста, сначала сгенерируйте C++ код.');
            return;
        }
        navigator.clipboard.writeText(code).then(() => {
            showCopySuccess();
        }).catch(err => {
            alert(currentLanguage === 'en' ? 'Failed to copy code.' : 'Не удалось скопировать код.');
        });
    }

    function invertColors() {
        const cells = gridContainer.getElementsByClassName('cell');
        for (let cell of cells) {
            cell.classList.toggle('active');
        }
    }

    function clearGrid() {
        const cells = gridContainer.getElementsByClassName('cell');
        for (let cell of cells) {
            cell.classList.remove('active');
        }
        // Hide the generated code when grid is cleared
        cppCodeContainer.style.display = 'none';
    }

    function showCopySuccess() {
        copySuccessModal.style.display = 'block';
    }

    function toggleLanguage() {
        if (currentLanguage === 'en') {
            switchToRussian();
            currentLanguage = 'ru';
        } else {
            switchToEnglish();
            currentLanguage = 'en';
        }
    }

    function switchToRussian() {
        document.getElementById('title').textContent = '🖼️ Easy Bitmap Maker 🖼️';
        document.getElementById('width-label').textContent = 'Ширина:';
        document.getElementById('height-label').textContent = 'Высота:';
        document.getElementById('pen-size-label').textContent = 'Размер пера:';
        generateGridButton.textContent = '🪄 Создать сетку';
        generateCodeButton.textContent = '💾 Сгенерировать C++ код';
        langSwitchButton.innerHTML = '🇷🇺 Русский';
        modeFillButton.textContent = '🖌️ Рисование';
        modeEraseButton.textContent = '🧹 Стирание';
        helpButton.textContent = '❓ Справка';
        invertColorsButton.textContent = '🔄 Инвертировать цвета';
        importBitmapButton.textContent = '📥 Импортировать Bitmap';
        clearGridButton.textContent = '🗑️ Очистить сетку';
        document.querySelectorAll('#links a')[0].textContent = '✈️ Телеграм';
        document.querySelectorAll('#links a')[1].textContent = '🐙 Гитхаб';
        document.querySelectorAll('#links a')[2].textContent = '📹 Ютуб';
        document.getElementById('cpp-code-title').textContent = '📄 Сгенерированный C++ код';
        generateBitmapButton.textContent = '📋 Копировать код';
        document.getElementById('star-github').innerHTML = '⭐ Если вам понравился проект, пожалуйста, <a href="https://github.com/rokokol/easy-bitmap.github.io" target="_blank">поставьте звёздочку на GitHub</a>!';

        // Update Help Modal Content to Russian
        const modalContent = helpModal.querySelector('.modal-content');
        modalContent.querySelector('h2').textContent = '📖 Справка';
        modalContent.querySelector('p').textContent = 'Добро пожаловать в Easy Bitmap Maker! Вот как использовать инструмент:';
        const listItems = modalContent.querySelectorAll('ul li');
        listItems[0].innerHTML = '🪄 <strong>Создать сетку:</strong> Установите ширину и высоту (до 128) и нажмите для создания сетки';
        listItems[1].innerHTML = '🖌️ <strong>Рисование:</strong> ЛКМ рисует пиксели, ПКМ стирает пиксели';
        listItems[2].innerHTML = '🧹 <strong>Стирание:</strong> ЛКМ стирает пиксели, ПКМ рисует пиксели';
        listItems[3].innerHTML = '🎨 <strong>Размер пера:</strong> Регулируйте размер пера с помощью ползунка для больших или меньших штрихов';
        listItems[4].innerHTML = '📥 <strong>Импортировать Bitmap:</strong> Нажмите, чтобы импортировать битмап из C++ кода';
        listItems[5].innerHTML = '💾 <strong>Сгенерировать C++ код:</strong> Нажмите, чтобы сгенерировать и просмотреть массив байтов C++, представляющий ваш битмап';
        listItems[6].innerHTML = '📋 <strong>Копировать код:</strong> Нажмите, чтобы скопировать сгенерированный C++ код в буфер обмена';
        listItems[7].innerHTML = '🔄 <strong>Инвертировать цвета:</strong> Нажмите, чтобы инвертировать цвета всех пикселей';
        listItems[8].innerHTML = '🗑️ <strong>Очистить сетку:</strong> Нажмите, чтобы очистить все пиксели в сетке';
        listItems[9].innerHTML = '🔑 <strong>Горячие клавиши:</strong> Нажмите <strong>В</strong> для режима рисования и <strong>Е</strong> для режима стирания';
        listItems[10].innerHTML = '❓ <strong>Справка:</strong> Нажмите кнопку Справка, чтобы просмотреть эти инструкции';
        listItems[11].innerHTML = '🌐 <strong>Язык:</strong> Переключайтесь между английским и русским языками с помощью кнопки в правом верхнем углу';
        listItems[12].innerHTML = '⭐ <strong>Поддержка:</strong> Если вам понравился проект, пожалуйста, поставьте звёздочку на GitHub';

        // Update Import Modal Content to Russian
        const importModalContent = importModal.querySelector('.modal-content');
        importModalContent.querySelector('h2').textContent = '📥 Импортировать Bitmap';
        importModalContent.querySelector('p').textContent = 'Вставьте ваш C++ код битмапа или содержимое массива ниже:';
        importConfirmButton.textContent = '📥 Импортировать';

        // Update Copy Success Modal Content to Russian
        const copyModalContent = copySuccessModal.querySelector('.modal-content');
        copyModalContent.querySelector('h2').textContent = '✅ Успех';
        copyModalContent.querySelector('p').textContent = 'Код скопирован в буфер обмена!';

        // Update Message Modal Button Text to Russian
        messageOkButton.textContent = 'ОК';

        clearMessage();
    }

    function switchToEnglish() {
        document.getElementById('title').textContent = '🖼️ Easy Bitmap Maker 🖼️';
        document.getElementById('width-label').textContent = 'Width:';
        document.getElementById('height-label').textContent = 'Height:';
        document.getElementById('pen-size-label').textContent = 'Pen Size:';
        generateGridButton.textContent = '🪄 Create Grid';
        generateCodeButton.textContent = '💾 Generate C++ Code';
        langSwitchButton.innerHTML = '🇺🇸 English';
        modeFillButton.textContent = '🖌️ Fill';
        modeEraseButton.textContent = '🧹 Erase';
        helpButton.textContent = '❓ Help';
        invertColorsButton.textContent = '🔄 Invert Colors';
        importBitmapButton.textContent = '📥 Import Bitmap';
        clearGridButton.textContent = '🗑️ Clear Grid';
        document.querySelectorAll('#links a')[0].textContent = '✈️ Telegram';
        document.querySelectorAll('#links a')[1].textContent = '🐙 GitHub';
        document.querySelectorAll('#links a')[2].textContent = '📹 YouTube';
        document.getElementById('cpp-code-title').textContent = '📄 Generated C++ Code';
        generateBitmapButton.textContent = '📋 Copy Code';
        document.getElementById('star-github').innerHTML = '⭐ If you like this project, please <a href="https://github.com/rokokol/easy-bitmap.github.io" target="_blank">star it on GitHub</a>!';

        // Update Help Modal Content to English
        const modalContent = helpModal.querySelector('.modal-content');
        modalContent.querySelector('h2').textContent = '📖 Help';
        modalContent.querySelector('p').textContent = "Welcome to the Easy Bitmap Maker! Here's how to use the tool:";
        const listItems = modalContent.querySelectorAll('ul li');
        listItems[0].innerHTML = '🪄 <strong>Create Grid:</strong> Set the width and height (up to 128) and click to generate the grid';
        listItems[1].innerHTML = '🖌️ <strong>Fill Mode:</strong> LMB draws pixels, RMB erases pixels';
        listItems[2].innerHTML = '🧹 <strong>Erase Mode:</strong> LMB erases pixels, RMB draws pixels';
        listItems[3].innerHTML = '🎨 <strong>Pen Size:</strong> Adjust the pen size using the slider for larger or smaller brush strokes';
        listItems[4].innerHTML = '📥 <strong>Import Bitmap:</strong> Click to import a bitmap from C++ code';
        listItems[5].innerHTML = '💾 <strong>Generate C++ Code:</strong> Click to generate and view the C++ byte array representing your bitmap';
        listItems[6].innerHTML = '📋 <strong>Copy Code:</strong> Click to copy the generated C++ code to your clipboard';
        listItems[7].innerHTML = '🔄 <strong>Invert Colors:</strong> Click to invert the colors of all pixels';
        listItems[8].innerHTML = '🗑️ <strong>Clear Grid:</strong> Click to clear all pixels in the grid';
        listItems[9].innerHTML = '🔑 <strong>Hotkeys:</strong> Press <strong>D</strong> for Fill mode and <strong>E</strong> for Erase mode';
        listItems[10].innerHTML = '❓ <strong>Help:</strong> Click the Help button to view these instructions';
        listItems[11].innerHTML = '🌐 <strong>Language:</strong> Toggle between English and Russian using the button in the top-right corner';
        listItems[12].innerHTML = '⭐ <strong>Support:</strong> If you like this project, please star it on GitHub';

        // Update Import Modal Content to English
        const importModalContent = importModal.querySelector('.modal-content');
        importModalContent.querySelector('h2').textContent = '📥 Import Bitmap';
        importModalContent.querySelector('p').textContent = 'Paste your C++ bitmap code or array content below:';
        importConfirmButton.textContent = '📥 Import';

        // Update Copy Success Modal Content to English
        const copyModalContent = copySuccessModal.querySelector('.modal-content');
        copyModalContent.querySelector('h2').textContent = '✅ Success';
        copyModalContent.querySelector('p').textContent = 'Code copied to clipboard!';

        // Update Message Modal Button Text to English
        messageOkButton.textContent = 'OK';

        clearMessage();
    }

    function showMessage(message) {
        messageContainer.textContent = message;
    }

    function clearMessage() {
        messageContainer.textContent = '';
    }

    // Functions for opening and closing modals
    function openHelpModal() {
        helpModal.style.display = 'block';
    }

    function openImportModal() {
        importTextarea.value = '';
        importModal.style.display = 'block';
    }

    function closeModal(modal) {
        // Add classes for closing animation
        modal.classList.add('fade-out');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.classList.add('slide-out');

        // After animation ends, hide the modal
        modal.addEventListener('animationend', function handler() {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
            modalContent.classList.remove('slide-out');
            modal.removeEventListener('animationend', handler);
        });
    }

    function importBitmap() {
        const input = importTextarea.value.trim();
        if (!input) {
            showMessageModal(
                currentLanguage === 'en' ? 'Error' : 'Ошибка',
                currentLanguage === 'en' ? 'Please enter the bitmap code.' : 'Пожалуйста, введите код битмапа.'
            );
            return;
        }

        // Extract array content from code
        let code = input;
        const arrayMatch = input.match(/\{([\s\S]*?)\}/);
        if (arrayMatch) {
            code = arrayMatch[1];
        }

        // Split code into elements
        let bytes = code.split(',').map(b => b.trim());

        // Check if the number of bytes matches the grid size
        const expectedBytes = Math.ceil((gridWidth * gridHeight) / 8);
        if (bytes.length !== expectedBytes) {
            // Show pop-up with green "OK" button
            showMessageModal(
                currentLanguage === 'en' ? 'Size Mismatch' : 'Несоответствие размеров',
                currentLanguage === 'en' ? 
                    'The imported bitmap size does not match the current grid size. The bitmap will be adjusted accordingly.' : 
                    'Размер импортированного битмапа не соответствует текущему размеру сетки. Битмап будет скорректирован соответственно.'
            );
            // Adjust grid size based on bitmap
            const totalBits = bytes.length * 8;
            const newHeight = Math.ceil(totalBits / gridWidth);
            gridHeight = newHeight;
            heightInput.value = gridHeight;
            createGrid();
        }

        // Fill the grid based on imported data
        const cells = gridContainer.getElementsByClassName('cell');
        let bitIndex = 0;
        for (let byte of bytes) {
            byte = byte.replace(/0x/i, '');
            let byteValue = parseInt(byte, 16);
            for (let i = 7; i >= 0; i--) {
                if (bitIndex >= cells.length) break;
                const cell = cells[bitIndex];
                const isActive = (byteValue >> i) & 1;
                if (isActive) {
                    cell.classList.add('active');
                } else {
                    cell.classList.remove('active');
                }
                bitIndex++;
            }
        }

        closeModal(importModal);
        showMessageModal(
            currentLanguage === 'en' ? 'Success' : 'Успех',
            currentLanguage === 'en' ? 'Bitmap imported successfully!' : 'Битмап успешно импортирован!'
        );
    }

    function showMessageModal(title, text) {
        messageModalTitle.textContent = title;
        messageModalText.textContent = text;
        messageModal.style.display = 'block';

        // If the message is about size mismatch, change the OK button to green
        if (title === 'Size Mismatch' || title === 'Несоответствие размеров') {
            messageOkButton.style.backgroundColor = '#28a745'; // Green
            messageOkButton.style.color = '#fff';
        } else {
            // Default styling for OK button
            messageOkButton.style.backgroundColor = '#007acc'; // Blue
            messageOkButton.style.color = '#fff';
        }
    }

    // Initialize grid on page load
    createGrid();
});

