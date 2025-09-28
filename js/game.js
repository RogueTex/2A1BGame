class AlphabetGame {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('alphabet2048-best') || 0;
        this.gameWon = false;
        
        this.initializeBoard();
        this.bindEvents();
        this.updateDisplay();
        this.addRandomLetter();
        this.addRandomLetter();
        this.renderBoard();
    }

    initializeBoard() {
        this.board = Array(4).fill().map(() => Array(4).fill(null));
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.newGame());
        document.getElementById('continue-btn').addEventListener('click', () => this.hideGameWon());
        document.getElementById('new-game-won-btn').addEventListener('click', () => this.newGame());
    }

    handleKeyPress(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            
            const previousBoard = JSON.parse(JSON.stringify(this.board));
            let moved = false;

            switch(e.key) {
                case 'ArrowUp':
                    moved = this.moveUp();
                    break;
                case 'ArrowDown':
                    moved = this.moveDown();
                    break;
                case 'ArrowLeft':
                    moved = this.moveLeft();
                    break;
                case 'ArrowRight':
                    moved = this.moveRight();
                    break;
            }

            if (moved) {
                this.addRandomLetter();
                this.renderBoard();
                this.updateDisplay();
                
                if (this.checkWin() && !this.gameWon) {
                    this.showGameWon();
                    this.gameWon = true;
                } else if (this.checkGameOver()) {
                    this.showGameOver();
                }
            }
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
                // Merge identical letters
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
        return Math.pow(2, letter.charCodeAt(0) - 64); // A=2, B=4, C=8, etc.
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
            // 90% chance for 'A', 10% chance for 'B'
            this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 'A' : 'B';
        }
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (this.board[row][col]) {
                    cell.textContent = this.board[row][col];
                    cell.classList.add(`letter-${this.board[row][col]}`);
                }
                
                gameBoard.appendChild(cell);
            }
        }
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
        // Check for empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === null) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const current = this.board[row][col];
                
                // Check right
                if (col < 3 && current === this.board[row][col + 1]) {
                    return false;
                }
                
                // Check down
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
        
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-won').classList.add('hidden');
        
        this.initializeBoard();
        this.addRandomLetter();
        this.addRandomLetter();
        this.renderBoard();
        this.updateDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AlphabetGame();
});
