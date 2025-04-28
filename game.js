class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score');
        this.previousScore = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.init();
        this.setupEventListeners();
    }

    init() {
        // Initialize empty grid
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.previousScore = this.score;
        this.score = 0;
        this.updateScoreDisplay();
        
        // Clear game board
        this.gameBoard.innerHTML = '';
        
        // Create grid cells with fade-in animation
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell aspect-square';
            cell.style.animation = `fadeIn 0.5s ease-out ${i * 0.05}s both`;
            this.gameBoard.appendChild(cell);
        }

        // Add initial tiles
        setTimeout(() => {
            this.addRandomTile();
            this.addRandomTile();
            this.updateDisplay();
        }, 500); // Wait for grid animation
    }

    updateScoreDisplay() {
        // Animate score change
        if (this.score > this.previousScore) {
            const difference = this.score - this.previousScore;
            const scorePopup = document.createElement('div');
            scorePopup.className = 'score-popup';
            scorePopup.textContent = '+' + difference;
            this.scoreDisplay.parentElement.appendChild(scorePopup);
            
            setTimeout(() => scorePopup.remove(), 1000);
        }

        this.scoreDisplay.textContent = this.score;
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ x: i, y: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
            
            // Add special animation for 4 tiles
            if (this.grid[x][y] === 4) {
                const cell = this.gameBoard.children[x * this.size + y];
                cell.classList.add('special-spawn');
                setTimeout(() => cell.classList.remove('special-spawn'), 500);
            }
            return true;
        }
        return false;
    }

    updateDisplay(direction = null) {
        const cells = this.gameBoard.children;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.grid[i][j];
                const cell = cells[i * this.size + j];
                cell.innerHTML = '';

                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    
                    // Add movement animation class based on direction
                    if (direction) {
                        tile.classList.add(`tile-move-${direction}`);
                    }
                    
                    tile.textContent = value;
                    
                    // Add floating animation for higher value tiles
                    if (value >= 128) {
                        tile.classList.add('floating');
                    }
                    
                    cell.appendChild(tile);
                }
            }
        }
    }

    move(direction) {
        let moved = false;
        const directionMap = {
            'up': { x: -1, y: 0 },
            'down': { x: 1, y: 0 },
            'left': { x: 0, y: -1 },
            'right': { x: 0, y: 1 }
        };

        const vector = directionMap[direction];
        const traversals = this.buildTraversals(vector);

        // Remember current state
        const previousGrid = this.grid.map(row => [...row]);

        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const cell = { x, y };
                const tile = this.grid[x][y];

                if (tile) {
                    const positions = this.findFarthestPosition(cell, vector);
                    const next = this.grid[positions.next.x]?.[positions.next.y];

                    if (next === tile) {
                        // Merge tiles
                        const merged = tile * 2;
                        this.grid[positions.next.x][positions.next.y] = merged;
                        this.grid[x][y] = 0;
                        this.score += merged;
                        moved = true;
                    } else if (positions.farthest.x !== x || positions.farthest.y !== y) {
                        // Move tile
                        this.grid[positions.farthest.x][positions.farthest.y] = tile;
                        this.grid[x][y] = 0;
                        moved = true;
                    }
                }
            });
        });

        if (moved) {
            // Update display with movement animation
            this.updateDisplay(direction);
            
            // Add new tile and update score after a short delay
            setTimeout(() => {
                this.addRandomTile();
                this.updateDisplay();
                this.updateScoreDisplay();
                
                if (this.isGameOver()) {
                    this.showGameOver();
                }
            }, 150); // Match the animation duration
        }
    }

    buildTraversals(vector) {
        const traversals = {
            x: Array.from({ length: this.size }, (_, i) => i),
            y: Array.from({ length: this.size }, (_, i) => i)
        };

        if (vector.x === 1) traversals.x.reverse();
        if (vector.y === 1) traversals.y.reverse();

        return traversals;
    }

    findFarthestPosition(cell, vector) {
        let previous;
        let current = cell;

        do {
            previous = current;
            current = {
                x: previous.x + vector.x,
                y: previous.y + vector.y
            };
        } while (
            this.isWithinBounds(current) &&
            this.grid[current.x][current.y] === 0
        );

        return {
            farthest: previous,
            next: current
        };
    }

    isWithinBounds(position) {
        return position.x >= 0 && position.x < this.size &&
               position.y >= 0 && position.y < this.size;
    }

    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for possible merges
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.grid[i][j];
                const directions = [
                    { x: 0, y: 1 },  // right
                    { x: 1, y: 0 }   // down
                ];

                for (const dir of directions) {
                    const newX = i + dir.x;
                    const newY = j + dir.y;
                    if (newX < this.size && newY < this.size) {
                        if (this.grid[newX][newY] === current) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    showGameOver() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <h2 class="text-5xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">Game Over!</h2>
            <div class="space-y-4 mb-6">
                <p class="text-2xl">Final Score: <span class="font-bold text-pink-400">${this.score}</span></p>
                <p class="text-xl">Best Score: <span class="font-bold text-violet-400">${this.bestScore}</span></p>
            </div>
            <button class="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                <i class="fas fa-redo-alt mr-2"></i>Try Again
            </button>
        `;
        
        this.gameBoard.appendChild(overlay);
        overlay.querySelector('button').addEventListener('click', () => {
            this.init();
        });
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });

        // Mobile controls
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(button => {
            button.addEventListener('click', () => {
                const direction = button.dataset.direction;
                this.move(direction);
            });
        });

        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.gameBoard.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    this.move('right');
                } else {
                    this.move('left');
                }
            } else {
                if (deltaY > 0) {
                    this.move('down');
                } else {
                    this.move('up');
                }
            }
        });

        // New game button
        document.getElementById('new-game').addEventListener('click', () => {
            this.init();
        });
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
