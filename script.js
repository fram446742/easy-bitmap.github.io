document.addEventListener('DOMContentLoaded', () => {
    let isDrawing = false
    let currentLanguage = 'en'
    let penSize = 1
    let currentMode = 'fill'
    let isRightMouseDown = false
    let isLeftMouseDown = false

    const gridContainer = document.getElementById('grid-container')
    const generateCodeButton = document.getElementById('generate-code')
    const langSwitchButton = document.getElementById('lang-switch')
    const messageContainer = document.getElementById('message-container')
    const cppCodeContainer = document.getElementById('cpp-code-container')
    const cppCodeElement = document.getElementById('cpp-code')
    const penSizeSlider = document.getElementById('pen-size')
    const penSizeValue = document.getElementById('pen-size-value')
    const modeFillButton = document.getElementById('mode-fill')
    const modeEraseButton = document.getElementById('mode-erase')
    const generateBitmapButton = document.getElementById('generate-bitmap')
    const helpButton = document.getElementById('help-button')
    const invertColorsButton = document.getElementById('invert-colors')
    const importBitmapButton = document.getElementById('import-bitmap')
    const clearGridButton = document.getElementById('clear-grid')
    const rotateButton = document.getElementById('rotate-90')
    const flipHorizontalButton = document.getElementById('flip-horizontal')
    const flipVerticalButton = document.getElementById('flip-vertical')
    const helpModal = document.getElementById('help-modal')
    const importModal = document.getElementById('import-modal')
    const copySuccessModal = document.getElementById('copy-success-modal')
    const messageModal = document.getElementById('message-modal')
    const messageModalTitle = document.getElementById('message-modal-title')
    const messageModalText = document.getElementById('message-modal-text')
    const messageOkButton = document.getElementById('message-ok-button')
    const closeButtons = document.querySelectorAll('.close-button')
    const importTextarea = document.getElementById('import-textarea')
    const bitmapTypeSelect = document.getElementById('bitmap-type')

    let gridWidth = 8
    let gridHeight = 8
    const undoStack = []
    let currentAction = null

    penSizeSlider.addEventListener('input', updatePenSize)
    modeFillButton.addEventListener('click', () => setMode('fill'))
    modeEraseButton.addEventListener('click', () => setMode('erase'))
    generateCodeButton.addEventListener('click', generateCppCode)
    langSwitchButton.addEventListener('click', toggleLanguage)
    generateBitmapButton.addEventListener('click', generateBitmap)
    helpButton.addEventListener('click', openHelpModal)
    invertColorsButton.addEventListener('click', invertColors)
    importBitmapButton.addEventListener('click', openImportModal)
    clearGridButton.addEventListener('click', clearGrid)
    messageOkButton.addEventListener('click', () => closeModal(messageModal))
    closeButtons.forEach(button => {
        button.addEventListener('click', () => closeModal(button.parentElement.parentElement))
    })
    window.addEventListener('click', (e) => {
        if (e.target == helpModal) closeModal(helpModal)
        if (e.target == copySuccessModal) closeModal(copySuccessModal)
        if (e.target == importModal) closeModal(importModal)
        if (e.target == messageModal) closeModal(messageModal)
    })

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyD') setMode('fill')
        if (e.code === 'KeyE') setMode('erase')
        if (e.key === 'Escape') {
            if (helpModal.style.display === 'block') closeModal(helpModal)
            if (copySuccessModal.style.display === 'block') closeModal(copySuccessModal)
            if (importModal.style.display === 'block') closeModal(importModal)
            if (messageModal.style.display === 'block') closeModal(messageModal)
        }
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
            e.preventDefault()
            undo()
        }
    })

    document.addEventListener('contextmenu', (e) => e.preventDefault())
    gridContainer.addEventListener('wheel', handleWheel)
    penSizeSlider.addEventListener('wheel', handleWheel)

    function handleWheel(e) {
        e.preventDefault()
        if (e.deltaY < 0) {
            if (penSize < 10) {
                penSize += 1
                penSizeSlider.value = penSize
                penSizeValue.textContent = penSize
            }
        } else {
            if (penSize > 1) {
                penSize -= 1
                penSizeSlider.value = penSize
                penSizeValue.textContent = penSize
            }
        }
    }

    function recordChange(cell, previousState) {
        if (!currentAction) return
        const cellKey = `${cell.dataset.x},${cell.dataset.y}`
        if (!currentAction.changes.has(cellKey)) currentAction.changes.set(cellKey, previousState)
    }

    function fillCells(cell) {
        const x = parseInt(cell.dataset.x)
        const y = parseInt(cell.dataset.y)
        const halfPen = Math.floor(penSize / 2)
        for (let dy = -halfPen; dy <= halfPen; dy++) {
            for (let dx = -halfPen; dx <= halfPen; dx++) {
                const nx = x + dx
                const ny = y + dy
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    const index = ny * gridWidth + nx
                    const targetCell = gridContainer.children[index]
                    if (targetCell && !targetCell.classList.contains('active')) {
                        recordChange(targetCell, false)
                        targetCell.classList.add('active')
                    }
                }
            }
        }
    }

    function eraseCells(cell) {
        const x = parseInt(cell.dataset.x)
        const y = parseInt(cell.dataset.y)
        const halfPen = Math.floor(penSize / 2)
        for (let dy = -halfPen; dy <= halfPen; dy++) {
            for (let dx = -halfPen; dx <= halfPen; dx++) {
                const nx = x + dx
                const ny = y + dy
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    const index = ny * gridWidth + nx
                    const targetCell = gridContainer.children[index]
                    if (targetCell && targetCell.classList.contains('active')) {
                        recordChange(targetCell, true)
                        targetCell.classList.remove('active')
                    }
                }
            }
        }
    }

    function getDimensionsForType(type) {
        switch(type) {
            case 'uint8_t': return [8,8]
            case 'uint16_t': return [16,16]
            case 'uint32_t': return [32,32]
            case 'uint64_t': return [64,64]
            default: return [8,8]
        }
    }

    function getTypeForBits(totalBits) {
        if (totalBits === 64) return 'uint8_t'
        if (totalBits === 256) return 'uint16_t'
        if (totalBits === 1024) return 'uint32_t'
        if (totalBits === 4096) return 'uint64_t'
        return null
    }

    function createGrid() {
        [gridWidth, gridHeight] = getDimensionsForType(bitmapTypeSelect.value)
        penSize = parseInt(penSizeSlider.value)
        penSizeValue.textContent = penSize
        gridContainer.innerHTML = ''

        const maxWidth = window.innerWidth * 0.9 
        const maxHeight = window.innerHeight * 0.6 
        const cellSizeX = Math.floor(maxWidth / gridWidth)
        const cellSizeY = Math.floor(maxHeight / gridHeight)
        const cellSize = Math.min(cellSizeX, cellSizeY)
        gridContainer.style.width = (gridWidth * cellSize) + 'px'
        gridContainer.style.height = (gridHeight * cellSize) + 'px'

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = document.createElement('div')
                cell.classList.add('cell')
                cell.dataset.x = x
                cell.dataset.y = y
                cell.style.width = cell.style.height = cellSize + 'px'
                gridContainer.appendChild(cell)
            }
        }

        cppCodeContainer.style.display = 'none'
    }

    function updatePenSize() {
        penSize = parseInt(penSizeSlider.value)
        penSizeValue.textContent = penSize
    }

    function setMode(mode) {
        currentMode = mode
        if (mode === 'fill') {
            modeFillButton.classList.add('active')
            modeEraseButton.classList.remove('active')
        } else {
            modeEraseButton.classList.add('active')
            modeFillButton.classList.remove('active')
        }
    }

    function generateCppCode() {
        const cells = gridContainer.getElementsByClassName('cell')
        let cppArray = []
        for (let y = 0; y < gridHeight; y++) {
            let byte = 0
            let bitCount = 0
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x
                const cell = cells[index]
                const isActive = cell.classList.contains('active') ? 1 : 0
                byte = (byte << 1) | isActive
                bitCount++
                if (bitCount === 8 || x === gridWidth - 1) {
                    if (bitCount < 8) byte = byte << (8 - bitCount)
                    cppArray.push('0x' + byte.toString(16).padStart(2, '0'))
                    byte = 0
                    bitCount = 0
                }
            }
        }
        const type = bitmapTypeSelect.value
        const cppCode = type + ' bitmap[] = {\n    ' + cppArray.join(', ') + '\n};'
        cppCodeElement.textContent = cppCode
        cppCodeContainer.style.display = 'block'
    }

    function generateBitmap() {
        const code = cppCodeElement.textContent
        if (!code) {
            showMessage(currentLanguage === 'en' ? 'No code to copy. Please generate the C++ code first.' : 'Нет кода для копирования. Пожалуйста, сначала сгенерируйте C++ код.')
            return
        }
        navigator.clipboard.writeText(code).then(() => {
            showCopySuccess()
        }).catch(err => {
            alert(currentLanguage === 'en' ? 'Failed to copy code.' : 'Не удалось скопировать код.')
        })
    }

    function invertColors() {
        const cells = gridContainer.getElementsByClassName('cell')
        for (let cell of cells) {
            recordChange(cell, cell.classList.contains('active'))
            cell.classList.toggle('active')
        }
    }

    function clearGrid() {
        const cells = gridContainer.getElementsByClassName('cell')
        for (let cell of cells) {
            if (cell.classList.contains('active')) {
                recordChange(cell, true)
                cell.classList.remove('active')
            }
        }
        cppCodeContainer.style.display = 'none'
    }

    function showCopySuccess() {
        copySuccessModal.style.display = 'block'
    }

    function toggleLanguage() {
        if (currentLanguage === 'en') {
            switchToRussian()
            currentLanguage = 'ru'
        } else {
            switchToEnglish()
            currentLanguage = 'en'
        }
    }

    function switchToRussian() {
        document.getElementById('title').textContent = '🖼️ Easy Bitmap Maker 🖼️'
        document.getElementById('bitmap-type-label').textContent = 'Тип битмапа:'
        document.getElementById('pen-size-label').textContent = 'Размер пера:'
        langSwitchButton.innerHTML = '🇷🇺 Русский'
        modeFillButton.textContent = '🖌️ Рисование'
        modeEraseButton.textContent = '🧹 Стирание'
        helpButton.textContent = '❓ Справка'
        invertColorsButton.textContent = '🔄 Инвертировать'
        importBitmapButton.textContent = '📥 Импортировать Bitmap'
        clearGridButton.textContent = '🗑️ Очистить'
        document.querySelectorAll('#links a')[0].textContent = '✈️ Телеграм'
        document.querySelectorAll('#links a')[1].textContent = '🐙 Гитхаб'
        document.querySelectorAll('#links a')[2].textContent = '📹 Ютуб'
        document.getElementById('cpp-code-title').textContent = '📄 Сгенерированный C++ код'
        generateBitmapButton.textContent = '📋 Копировать код'
        document.getElementById('star-github').innerHTML = '⭐ Если вам понравился проект, пожалуйста, <a href="https://github.com/rokokol/easy-bitmap.github.io" target="_blank">поставьте звёздочку на GitHub</a>!'

        rotateButton.textContent = '↩️ Повернуть 90°'
        flipHorizontalButton.textContent = '↔️ Отразить по горизонтали'
        flipVerticalButton.textContent = '↕️ Отразить по вертикали'

        document.getElementById('help-intro').textContent = 'Добро пожаловать в Easy Bitmap Maker! Вот как использовать инструмент:'
        document.querySelector('.help-fill-mode').innerHTML = '🖌️ <strong>Рисование:</strong> ЛКМ рисует, ПКМ стирает'
        document.querySelector('.help-erase-mode').innerHTML = '🧹 <strong>Стирание:</strong> ЛКМ стирает, ПКМ рисует'
        document.querySelector('.help-pen-size').innerHTML = '🎨 <strong>Размер пера:</strong> Регулируйте ползунком'
        document.querySelector('.help-import-bitmap').innerHTML = '📥 <strong>Импорт битмапа:</strong> Вставьте C++ код. Если размер не совпадает, будет попытка автонастройки.'
        document.querySelector('.help-generate-code').innerHTML = '💾 <strong>Сгенерировать C++ код:</strong> Посмотреть массив байт'
        document.querySelector('.help-copy-code').innerHTML = '📋 <strong>Копировать код:</strong> Скопировать сгенерированный код'
        document.querySelector('.help-invert-colors').innerHTML = '🔄 <strong>Инвертировать:</strong> Инвертировать все пиксели'
        document.querySelector('.help-clear-grid').innerHTML = '🗑️ <strong>Очистить:</strong> Очистить все пиксели'
        document.querySelector('.help-hotkeys').innerHTML = '🔑 <strong>Горячие клавиши:</strong> <strong>В</strong> для рисования, <strong>T</strong> для стирания'
        document.querySelector('.help-rotate').innerHTML = '↩️ <strong>Повернуть 90°:</strong> Повернуть изображение на 90°'
        document.querySelector('.help-flip-h').innerHTML = '↔️ <strong>Отразить по горизонтали:</strong> Отразить изображение'
        document.querySelector('.help-flip-v').innerHTML = '↕️ <strong>Отразить по вертикали:</strong> Отразить изображение'
        document.querySelector('.help-language').innerHTML = '🌐 <strong>Язык:</strong> Переключение между Английским и Русским'
        document.querySelector('.help-support').innerHTML = '⭐ <strong>Поддержка:</strong> Если вам нравится проект, поставьте звёздочку на GitHub'
        document.getElementById('help-outro').textContent = 'Приятного творчества!'

        document.getElementById('import-title').textContent = '📥 Импортировать Bitmap'
        document.getElementById('import-instr').textContent = 'Вставьте ваш C++ код или содержимое массива:'

        document.getElementById('copy-success-title').textContent = '✅ Успех'
        document.getElementById('copy-success-text').textContent = 'Код скопирован!'

        clearMessage()
    }

    function switchToEnglish() {
        document.getElementById('title').textContent = '🖼️ Easy Bitmap Maker 🖼️'
        document.getElementById('bitmap-type-label').textContent = 'Bitmap Type:'
        document.getElementById('pen-size-label').textContent = 'Pen Size:'
        langSwitchButton.innerHTML = '🇺🇸 English'
        modeFillButton.textContent = '🖌️ Fill'
        modeEraseButton.textContent = '🧹 Erase'
        helpButton.textContent = '❓ Help'
        invertColorsButton.textContent = '🔄 Invert Colors'
        importBitmapButton.textContent = '📥 Import Bitmap'
        clearGridButton.textContent = '🗑️ Clear Grid'
        document.querySelectorAll('#links a')[0].textContent = '✈️ Telegram'
        document.querySelectorAll('#links a')[1].textContent = '🐙 GitHub'
        document.querySelectorAll('#links a')[2].textContent = '📹 YouTube'
        document.getElementById('cpp-code-title').textContent = '📄 Generated C++ Code'
        generateBitmapButton.textContent = '📋 Copy Code'
        document.getElementById('star-github').innerHTML = '⭐ If you like this project, please <a href="https://github.com/rokokol/easy-bitmap.github.io" target="_blank">star it on GitHub</a>!'

        rotateButton.textContent = '↩️ Rotate 90°'
        flipHorizontalButton.textContent = '↔️ Flip Horizontal'
        flipVerticalButton.textContent = '↕️ Flip Vertical'

        document.getElementById('help-intro').textContent = "Welcome to the Easy Bitmap Maker! Here's how to use the tool:"
        document.querySelector('.help-fill-mode').innerHTML = '🖌️ <strong>Fill Mode:</strong> LMB draws pixels, RMB erases pixels'
        document.querySelector('.help-erase-mode').innerHTML = '🧹 <strong>Erase Mode:</strong> LMB erases pixels, RMB draws pixels'
        document.querySelector('.help-pen-size').innerHTML = '🎨 <strong>Pen Size:</strong> Adjust the pen size using the slider'
        document.querySelector('.help-import-bitmap').innerHTML = '📥 <strong>Import Bitmap:</strong> Import from C++ code. If size differs, it tries to adjust automatically.'
        document.querySelector('.help-generate-code').innerHTML = '💾 <strong>Generate C++ Code:</strong> View the C++ array'
        document.querySelector('.help-copy-code').innerHTML = '📋 <strong>Copy Code:</strong> Copy the generated code'
        document.querySelector('.help-invert-colors').innerHTML = '🔄 <strong>Invert Colors:</strong> Invert all pixels'
        document.querySelector('.help-clear-grid').innerHTML = '🗑️ <strong>Clear Grid:</strong> Clear all pixels'
        document.querySelector('.help-hotkeys').innerHTML = '🔑 <strong>Hotkeys:</strong> <strong>D</strong> for Fill, <strong>E</strong> for Erase'
        document.querySelector('.help-rotate').innerHTML = '↩️ <strong>Rotate 90°:</strong> Rotate the bitmap by 90 degrees clockwise'
        document.querySelector('.help-flip-h').innerHTML = '↔️ <strong>Flip Horizontal:</strong> Flip horizontally'
        document.querySelector('.help-flip-v').innerHTML = '↕️ <strong>Flip Vertical:</strong> Flip vertically'
        document.querySelector('.help-language').innerHTML = '🌐 <strong>Language:</strong> Toggle between English and Russian'
        document.querySelector('.help-support').innerHTML = '⭐ <strong>Support:</strong> If you like this project, star it on GitHub'
        document.getElementById('help-outro').textContent = 'Happy creating!'

        document.getElementById('import-title').textContent = '📥 Import Bitmap'
        document.getElementById('import-instr').textContent = 'Paste your C++ bitmap code or array content below:'

        document.getElementById('copy-success-title').textContent = '✅ Success'
        document.getElementById('copy-success-text').textContent = 'Code copied to clipboard!'

        clearMessage()
    }

    function showMessage(message) {
        messageContainer.textContent = message
    }

    function clearMessage() {
        messageContainer.textContent = ''
    }

    function openHelpModal() {
        helpModal.style.display = 'block'
    }

    function openImportModal() {
        importTextarea.value = ''
        importModal.style.display = 'block'
    }

    function closeModal(modal) {
        modal.classList.add('fade-out')
        const modalContent = modal.querySelector('.modal-content')
        modalContent.classList.add('slide-out')
        modal.addEventListener('animationend', function handler() {
            modal.style.display = 'none'
            modal.classList.remove('fade-out')
            modalContent.classList.remove('slide-out')
            modal.removeEventListener('animationend', handler)
        })
    }

    function importBitmap() {
        const input = importTextarea.value.trim()
        if (!input) {
            showMessageModal(
                currentLanguage === 'en' ? 'Error' : 'Ошибка',
                currentLanguage === 'en' ? 'Please enter the bitmap code.' : 'Пожалуйста, введите код битмапа.'
            )
            return
        }
        let code = input
        const arrayMatch = input.match(/\{([\s\S]*?)\}/)
        if (arrayMatch) code = arrayMatch[1]
        let bytes = code.split(',').map(b => b.trim()).filter(b=>b!=='')
        const totalBits = bytes.length * 8
        const expectedType = getTypeForBits(totalBits)
        if (!expectedType) {
            showMessageModal(
                currentLanguage === 'en' ? 'Error' : 'Ошибка',
                currentLanguage === 'en' ? 'Cannot adjust bitmap size automatically.' : 'Невозможно автоматически определить размер.'
            )
            return
        }
        bitmapTypeSelect.value = expectedType
        createGrid()
        const cells = gridContainer.getElementsByClassName('cell')
        let bitIndex = 0
        for (let byte of bytes) {
            byte = byte.replace(/0x/i, '')
            let byteValue = parseInt(byte, 16)
            for (let i = 7; i >= 0; i--) {
                if (bitIndex >= cells.length) break
                const cell = cells[bitIndex]
                const isActive = (byteValue >> i) & 1
                if (isActive) {
                    recordChange(cell, false)
                    cell.classList.add('active')
                } else {
                    recordChange(cell, true)
                    cell.classList.remove('active')
                }
                bitIndex++
            }
        }
        closeModal(importModal)
        showMessageModal(
            currentLanguage === 'en' ? 'Success' : 'Успех',
            currentLanguage === 'en' ? 'Bitmap imported successfully!' : 'Битмап успешно импортирован!'
        )
    }

    function showMessageModal(title, text) {
        messageModalTitle.textContent = title
        messageModalText.textContent = text
        messageModal.style.display = 'block'
        if (title === 'Size Mismatch' || title === 'Несоответствие размеров') {
            messageOkButton.style.backgroundColor = '#28a745'
            messageOkButton.style.color = '#fff'
        } else {
            messageOkButton.style.backgroundColor = '#007acc'
            messageOkButton.style.color = '#fff'
        }
    }

    function undo() {
        if (undoStack.length === 0) return
        const lastAction = undoStack.pop()
        for (let [key, prevState] of lastAction.changes.entries()) {
            const [x, y] = key.split(',').map(Number)
            const index = y * gridWidth + x
            const cell = gridContainer.children[index]
            if (cell) {
                if (prevState) cell.classList.add('active')
                else cell.classList.remove('active')
            }
        }
    }

    function rotate90() {
        const cells = Array.from(gridContainer.children)
        const oldWidth = gridWidth
        const oldHeight = gridHeight
        let matrix = []
        for (let y = 0; y < oldHeight; y++) {
            let row = []
            for (let x = 0; x < oldWidth; x++) {
                const index = y * oldWidth + x
                const cell = cells[index]
                row.push(cell.classList.contains('active'))
            }
            matrix.push(row)
        }

        let rotated = []
        for (let x = 0; x < oldWidth; x++) {
            let row = []
            for (let y = oldHeight - 1; y >= 0; y--) {
                row.push(matrix[y][x])
            }
            rotated.push(row)
        }

        const newCells = gridContainer.children
        for (let i = 0; i < newCells.length; i++) newCells[i].classList.remove('active')
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x
                if (rotated[y][x]) newCells[index].classList.add('active')
            }
        }
    }

    function flipHorizontal() {
        const cells = Array.from(gridContainer.children)
        let matrix = []
        for (let y = 0; y < gridHeight; y++) {
            let row = []
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x
                row.push(cells[index].classList.contains('active'))
            }
            matrix.push(row)
        }

        let flipped = []
        for (let y = 0; y < gridHeight; y++) {
            let row = []
            for (let x = 0; x < gridWidth; x++) {
                row.push(matrix[y][gridWidth - 1 - x])
            }
            flipped.push(row)
        }

        const newCells = gridContainer.children
        for (let i = 0; i < newCells.length; i++) newCells[i].classList.remove('active')
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x
                if (flipped[y][x]) newCells[index].classList.add('active')
            }
        }
    }

    function flipVertical() {
        const cells = Array.from(gridContainer.children)
        let matrix = []
        for (let y = 0; y < gridHeight; y++) {
            let row = []
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x
                row.push(cells[index].classList.contains('active'))
            }
            matrix.push(row)
        }

        let flipped = []
        for (let y = 0; y < gridHeight; y++) {
            flipped.push(matrix[gridHeight - 1 - y])
        }

        const newCells = gridContainer.children
        for (let i = 0; i < newCells.length; i++) newCells[i].classList.remove('active')
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const index = y * gridWidth + x
                if (flipped[y][x]) newCells[index].classList.add('active')
            }
        }
    }

    rotateButton.addEventListener('click', rotate90)
    flipHorizontalButton.addEventListener('click', flipHorizontal)
    flipVerticalButton.addEventListener('click', flipVertical)
    bitmapTypeSelect.addEventListener('change', createGrid)
    document.getElementById('import-confirm').addEventListener('click', importBitmap)

    createGrid()
    gridContainer.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('cell')) {
            if (e.button === 0) {
                isLeftMouseDown = true
                isDrawing = true
                currentAction = { changes: new Map() }
                handleDrawing(e.target, 'left')
            } else if (e.button === 2) {
                isRightMouseDown = true
                isDrawing = true
                currentAction = { changes: new Map() }
                handleDrawing(e.target, 'right')
            }
        }
    })

    gridContainer.addEventListener('mouseup', (e) => {
        if (e.button === 0) isLeftMouseDown = false
        else if (e.button === 2) isRightMouseDown = false
        if (!isLeftMouseDown && !isRightMouseDown) {
            isDrawing = false
            if (currentAction && currentAction.changes.size > 0) {
                undoStack.push(currentAction)
                if (undoStack.length > 100) undoStack.shift()
                currentAction = null
            }
        }
    })

    gridContainer.addEventListener('mouseover', (e) => {
        if (isDrawing && e.target.classList.contains('cell')) {
            if (isLeftMouseDown) handleDrawing(e.target, 'left')
            else if (isRightMouseDown) handleDrawing(e.target, 'right')
        }
    })

    function handleDrawing(cell, button) {
        if (currentMode === 'fill') {
            if (button === 'left') fillCells(cell)
            else if (button === 'right') eraseCells(cell)
        } else {
            if (button === 'left') eraseCells(cell)
            else if (button === 'right') fillCells(cell)
        }
    }
});

