class AlphabetGame {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('alphabet2048-best') || 0;
        this.gameWon = false;
        this.tileIdCounter = 0;
        this.tiles = new Map();
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

    getTilePosition(row, col) {
        return {
            x: col * 90, // 80px width + 10px margin
            y: row * 90  // 80px height + 10px margin
        };
    }

    createTileElement(row, col, value, isNew = false) {
        const tile = document.createElement('div');
        tile.className = `tile letter-${value}`;
        tile.textContent = value;
        tile.id = `tile-${this.tileIdCounter++}`;
        
        const pos = this.getTilePosition(row, col);
        tile.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        
        if (isNew) {
            tile.classList.add('tile-appear');
        }
        
        return tile;
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        
        // Remove all existing tiles
        const existingTiles = gameBoard.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());
        
        // Add tiles for current board state
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col]) {
                    const tile = this.createTileElement(row, col, this.board[row][col]);
                    gameBoard.appendChild(tile);
                }
            }
        }
    }

    animateMove(moves, newTiles, merges) {
        this.animating = true;
        const gameBoard = document.getElementById('game-board');
        
        // Animate existing tiles
        moves.forEach(move => {
            const tile = document.getElementById(move.tileId);
            if (tile) {
                const pos = this.getTilePosition(move.toRow, move.toCol);
                tile.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            }
        });
        
        // Handle merges - remove tiles that were merged
        setTimeout(() => {
            merges.forEach(merge => {
                merge.removedTileIds.forEach(tileId => {
                    const tile = document.getElementById(tileId);
                    if (tile) {
                        tile.remove();
                    }
                });
                
                // Create the merged tile with animation
                const mergedTile = this.createTileElement(merge.row, merge.col, merge.value);
                mergedTile.classList.add('tile-merge');
                gameBoard.appendChild(mergedTile);
            });
            
            // Add new random tiles
            setTimeout(() => {
                newTiles.forEach(newTile => {
                    const tile = this.createTileElement(newTile.row, newTile.col, newTile.value, true);
                    gameBoard.appendChild(tile);
                });
                
                this.animating = false;
            }, 50);
        }, 150);
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
            
            if (this.animating) return; // Prevent moves during animation
            
            const previousBoard = JSON.parse(JSON.stringify(this.board));
            let moveResult = null;

            switch(e.key) {
                case 'ArrowUp':
                    moveResult = this.moveUpWithAnimation();
                    break;
                case 'ArrowDown':
                    moveResult = this.moveDownWithAnimation();
                    break;
                case 'ArrowLeft':
                    moveResult = this.moveLeftWithAnimation();
                    break;
                case 'ArrowRight':
                    moveResult = this.moveRightWithAnimation();
                    break;
            }

            if (moveResult && moveResult.moved) {
                this.updateDisplay();
                
                // Add random tile after animations
                setTimeout(() => {
                    const newTileInfo = this.addRandomLetter();
                    if (newTileInfo) {
                        moveResult.newTiles.push(newTileInfo);
                    }
                    
                    this.animateMove(moveResult.moves, moveResult.newTiles, moveResult.merges);
                    
                    // Check game state after animations complete
                    setTimeout(() => {
                        if (this.checkWin() && !this.gameWon) {
                            this.showGameWon();
                            this.gameWon = true;
                        } else if (this.checkGameOver()) {
                            this.showGameOver();
                        }
                    }, 300);
                }, 50);
            }
        }
    }

    moveLeftWithAnimation() {
        const moves = [];
        const merges = [];
        let moved = false;
        
        // First pass: assign tile IDs to current board state
        const gameBoard = document.getElementById('game-board');
        const tileElements = gameBoard.querySelectorAll('.tile');
        const tileMap = new Map();
        
        tileElements.forEach(tile => {
            const transform = tile.style.transform;
            const matches = transform.match(/translate\((\d+)px, (\d+)px\)/);
            if (matches) {
                const x = parseInt(matches[1]);
                const y = parseInt(matches[2]);
                const col = x / 90;
                const row = y / 90;
                if (this.board[row] && this.board[row][col]) {
                    tileMap.set(`${row}-${col}`, tile.id);
                }
            }
        });
        
        for (let row = 0; row < 4; row++) {
            const rowArray = this.board[row].filter(cell => cell !== null);
            const originalPositions = [];
            
            // Track original positions
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col]) {
                    originalPositions.push({ col, value: this.board[row][col] });
                }
            }
            
            const merged = this.mergeArrayWithTracking(rowArray);
            while (merged.result.length < 4) merged.result.push(null);
            
            // Track movements and merges
            let sourceIndex = 0;
            for (let col = 0; col < 4; col++) {
                const newValue = merged.result[col];
                
                if (newValue !== null) {
                    // Find the source tile(s) for this position
                    if (merged.mergeOccurred.has(col)) {
                        // This is a merged tile
                        const mergedTileIds = [];
                        for (let i = 0; i < 2 && sourceIndex < originalPositions.length; i++) {
                            const sourceCol = originalPositions[sourceIndex].col;
                            const tileId = tileMap.get(`${row}-${sourceCol}`);
                            if (tileId) mergedTileIds.push(tileId);
                            sourceIndex++;
                        }
                        
                        merges.push({
                            row,
                            col,
                            value: newValue,
                            removedTileIds: mergedTileIds
                        });
                    } else {
                        // This is a moved tile
                        if (sourceIndex < originalPositions.length) {
                            const sourceCol = originalPositions[sourceIndex].col;
                            const tileId = tileMap.get(`${row}-${sourceCol}`);
                            
                            if (sourceCol !== col && tileId) {
                                moves.push({
                                    tileId,
                                    fromRow: row,
                                    fromCol: sourceCol,
                                    toRow: row,
                                    toCol: col
                                });
                            }
                            sourceIndex++;
                        }
                    }
                }
            }
            
            // Check if row changed
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] !== merged.result[col]) {
                    moved = true;
                    this.board[row][col] = merged.result[col];
                }
            }
        }
        
        return moved ? { moved: true, moves, merges, newTiles: [] } : { moved: false, moves: [], merges: [], newTiles: [] };
    }

    moveRightWithAnimation() {
        // Similar to moveLeft but in reverse
        const moves = [];
        const merges = [];
        let moved = false;
        
        const gameBoard = document.getElementById('game-board');
        const tileElements = gameBoard.querySelectorAll('.tile');
        const tileMap = new Map();
        
        tileElements.forEach(tile => {
            const transform = tile.style.transform;
            const matches = transform.match(/translate\((\d+)px, (\d+)px\)/);
            if (matches) {
                const x = parseInt(matches[1]);
                const y = parseInt(matches[2]);
                const col = x / 90;
                const row = y / 90;
                if (this.board[row] && this.board[row][col]) {
                    tileMap.set(`${row}-${col}`, tile.id);
                }
            }
        });
        
        for (let row = 0; row < 4; row++) {
            const rowArray = this.board[row].filter(cell => cell !== null);
            const merged = this.mergeArrayWithTracking(rowArray.reverse()).result.reverse();
            while (merged.length < 4) merged.unshift(null);
            
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] !== merged[col]) {
                    moved = true;
                    this.board[row][col] = merged[col];
                }
            }
        }
        
        return moved ? { moved: true, moves, merges, newTiles: [] } : { moved: false, moves: [], merges: [], newTiles: [] };
    }

    moveUpWithAnimation() {
        const moves = [];
        const merges = [];
        let moved = false;
        
        for (let col = 0; col < 4; col++) {
            const colArray = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== null) {
                    colArray.push(this.board[row][col]);
                }
            }
            const merged = this.mergeArrayWithTracking(colArray);
            while (merged.result.length < 4) merged.result.push(null);
            
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== merged.result[row]) {
                    moved = true;
                    this.board[row][col] = merged.result[row];
                }
            }
        }
        
        return moved ? { moved: true, moves, merges, newTiles: [] } : { moved: false, moves: [], merges: [], newTiles: [] };
    }

    moveDownWithAnimation() {
        const moves = [];
        const merges = [];
        let moved = false;
        
        for (let col = 0; col < 4; col++) {
            const colArray = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== null) {
                    colArray.push(this.board[row][col]);
                }
            }
            const merged = this.mergeArrayWithTracking(colArray.reverse()).result.reverse();
            while (merged.length < 4) merged.unshift(null);
            
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== merged[row]) {
                    moved = true;
                    this.board[row][col] = merged[row];
                }
            }
        }
        
        return moved ? { moved: true, moves, merges, newTiles: [] } : { moved: false, moves: [], merges: [], newTiles: [] };
    }

    mergeArrayWithTracking(array) {
        const result = [];
        const mergeOccurred = new Set();
        let i = 0;
        
        while (i < array.length) {
            if (i < array.length - 1 && array[i] === array[i + 1]) {
                // Merge identical letters
                const nextLetter = String.fromCharCode(array[i].charCodeAt(0) + 1);
                result.push(nextLetter);
                mergeOccurred.add(result.length - 1);
                this.score += this.getLetterValue(nextLetter);
                i += 2;
            } else {
                result.push(array[i]);
                i++;
            }
        }
        
        return { result, mergeOccurred };
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
            const value = Math.random() < 0.9 ? 'A' : 'B';
            this.board[randomCell.row][randomCell.col] = value;
            return { row: randomCell.row, col: randomCell.col, value };
        }
        return null;
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        
        // Remove all existing tiles
        const existingTiles = gameBoard.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());
        
        // Add tiles for current board state
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col]) {
                    const tile = this.createTileElement(row, col, this.board[row][col]);
                    gameBoard.appendChild(tile);
                }
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
        this.animating = false;
        this.tileIdCounter = 0;
        
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
