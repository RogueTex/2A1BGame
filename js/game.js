class AlphabetGame {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('alphabet2048-best') || 0;
        this.gameWon = false;
        this.animating = false;
        
        this.initializeBoard();
        this.bindEvents();
        this.updateDisplay();
        this.addRandomLetter();
        this.addRandomLetter();
        this.renderBoard();
    }

    initializeBoard() {
        this.board = Array(4).fill().map(() => Array(4).fill(null));
        this.setupGameBoard();
    }

    setupGameBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        // Create grid background
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        
        for (let row = 0; row < 4; row++) {
            const gridRow = document.createElement('div');
            gridRow.className = 'grid-row';
            
            for (let col = 0; col < 4; col++) {
                const gridCell = document.createElement('div');
                gridCell.className = 'grid-cell';
                gridRow.appendChild(gridCell);
            }
            
            gridContainer.appendChild(gridRow);
        }
        
        gameBoard.appendChild(gridContainer);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.newGame());
        document.getElementById('continue-btn').addEventListener('click', () => this.hideGameWon());
        document.getElementById('new-game-won-btn').addEventListener('click', () => this.newGame());
        
        // Add touch/swipe support for mobile
        this.addTouchSupport();
    }

    addTouchSupport() {
        let startX = null;
        let startY = null;
        const gameBoard = document.getElementById('game-board');
        
        gameBoard.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: false });
        
        gameBoard.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (startX === null || startY === null) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 50; // Minimum distance for a swipe
            
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.handleMove('right');
                    } else {
                        this.handleMove('left');
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.handleMove('down');
                    } else {
                        this.handleMove('up');
                    }
                }
            }
            
            startX = null;
            startY = null;
        }, { passive: false });
        
        // Prevent default touch behaviors that might interfere
        gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    handleMove(direction) {
        if (this.animating) return;
        
        let moved = false;

        switch(direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        if (moved) {
            this.animating = true;
            
            // Update display and render with animation
            this.updateDisplay();
            this.renderBoardWithAnimation();
            
            setTimeout(() => {
                this.addRandomLetter();
                this.renderBoardWithAnimation();
                this.animating = false;
                
                if (this.checkWin() && !this.gameWon) {
                    this.showGameWon();
                    this.gameWon = true;
                } else if (this.checkGameOver()) {
                    this.showGameOver();
                }
            }, 150);
        }
    }

    handleKeyPress(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            
            let direction;
            switch(e.key) {
                case 'ArrowUp':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                    direction = 'right';
                    break;
            }
            
            this.handleMove(direction);
        }
    }

    moveLeft() {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const rowArray = this.board[row].filter(cell => cell !== null);
            const merged = this.mergeArray(rowArray);
            while (merged.length < 4) merged.push(null);
            
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] !== merged[col]) {
                    moved = true;
                    this.board[row][col] = merged[col];
                }
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const rowArray = this.board[row].filter(cell => cell !== null);
            const merged = this.mergeArray(rowArray.reverse()).reverse();
            while (merged.length < 4) merged.unshift(null);
            
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] !== merged[col]) {
                    moved = true;
                    this.board[row][col] = merged[col];
                }
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            const colArray = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== null) {
                    colArray.push(this.board[row][col]);
                }
            }
            const merged = this.mergeArray(colArray);
            while (merged.length < 4) merged.push(null);
            
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== merged[row]) {
                    moved = true;
                    this.board[row][col] = merged[row];
                }
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            const colArray = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== null) {
                    colArray.push(this.board[row][col]);
                }
            }
            const merged = this.mergeArray(colArray.reverse()).reverse();
            while (merged.length < 4) merged.unshift(null);
            
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== merged[row]) {
                    moved = true;
                    this.board[row][col] = merged[row];
                }
            }
        }
        return moved;
    }

    mergeArray(array) {
        const result = [];
        let i = 0;
        
        while (i < array.length) {
            if (i < array.length - 1 && array[i] === array[i + 1]) {
                const nextLetter = String.fromCharCode(array[i].charCodeAt(0) + 1);
                result.push(nextLetter);
                this.score += this.getLetterValue(nextLetter);
                i += 2;
            } else {
                result.push(array[i]);
                i++;
            }
        }
        
        return result;
    }

    getLetterValue(letter) {
        return Math.pow(2, letter.charCodeAt(0) - 64);
    }

    addRandomLetter() {
        const emptyCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === null) {
                    emptyCells.push({row, col});
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 'A' : 'B';
            this.board[randomCell.row][randomCell.col] = value;
        }
    }

    renderBoard() {
        this.renderBoardWithAnimation();
    }

    renderBoardWithAnimation() {
        const gameBoard = document.getElementById('game-board');
        const existingTiles = gameBoard.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col]) {
                    const tile = this.createTileElement(row, col, this.board[row][col]);
                    gameBoard.appendChild(tile);
                }
            }
        }
    }

    createTileElement(row, col, value) {
        const tile = document.createElement('div');
        tile.className = `tile letter-${value}`;
        tile.textContent = value;
        
        const x = col * 90;
        const y = row * 90;
        tile.style.transform = `translate(${x}px, ${y}px)`;
        
        return tile;
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best').textContent = this.bestScore;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('alphabet2048-best', this.bestScore);
            document.getElementById('best').textContent = this.bestScore;
        }
    }

    checkWin() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 'Z') {
                    return true;
                }
            }
        }
        return false;
    }

    checkGameOver() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === null) {
                    return false;
                }
            }
        }

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const current = this.board[row][col];
                
                if (col < 3 && current === this.board[row][col + 1]) {
                    return false;
                }
                
                if (row < 3 && current === this.board[row + 1][col]) {
                    return false;
                }
            }
        }

        return true;
    }

    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }

    showGameWon() {
        document.getElementById('won-score').textContent = this.score;
        document.getElementById('game-won').classList.remove('hidden');
    }

    hideGameWon() {
        document.getElementById('game-won').classList.add('hidden');
    }

    newGame() {
        this.board = [];
        this.score = 0;
        this.gameWon = false;
        this.animating = false;
        
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-won').classList.add('hidden');
        
        this.initializeBoard();
        this.addRandomLetter();
        this.addRandomLetter();
        this.renderBoard();
        this.updateDisplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AlphabetGame();
});
