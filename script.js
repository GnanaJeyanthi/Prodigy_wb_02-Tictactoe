document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const state = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 0, // 0 for player 1, 1 for player 2
        gameActive: false,
        againstAI: true,
        aiDifficulty: 'medium',
        winningCombinations: [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ],
        playerMarkers: ['X', 'O'],
        stats: {
            player1Wins: 0,
            player2Wins: 0,
            draws: 0
        }
    };
    
    // Cache DOM elements
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const playAgainBtn = document.getElementById('play-again');
    const newGameBtn = document.getElementById('new-game');
    const resetStatsBtn = document.getElementById('reset-stats');
    const aiOpponentBtn = document.getElementById('ai-opponent');
    const humanOpponentBtn = document.getElementById('human-opponent');
    const difficultyContainer = document.getElementById('difficulty-container');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const player1Markers = document.getElementById('player1-markers');
    const player2Markers = document.getElementById('player2-markers');
    const statsElements = {
        player1Wins: document.getElementById('player1-wins'),
        draws: document.getElementById('draws'),
        player2Wins: document.getElementById('player2-wins')
    };
    
    // Initialize the game
    function initGame() {
        createBoard();
        initializeEventListeners();
        loadStats();
        updateStatsDisplay();
        startNewGame();
    }
    
    // Create the game board
    function createBoard() {
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            const cellContent = document.createElement('div');
            cellContent.className = 'cell-content';
            cell.appendChild(cellContent);
            
            boardElement.appendChild(cell);
        }
    }
    
    // Initialize event listeners
    function initializeEventListeners() {
        // Cell click
        boardElement.addEventListener('click', handleCellClick);
        
        // Game controls
        newGameBtn.addEventListener('click', startNewGame);
        resetStatsBtn.addEventListener('click', resetStats);
        playAgainBtn.addEventListener('click', () => {
            resultModal.classList.remove('active');
            startNewGame();
        });
        
        // Opponent selection
        aiOpponentBtn.addEventListener('click', () => {
            state.againstAI = true;
            aiOpponentBtn.classList.add('selected');
            humanOpponentBtn.classList.remove('selected');
            difficultyContainer.style.display = 'block';
            startNewGame();
        });
        
        humanOpponentBtn.addEventListener('click', () => {
            state.againstAI = false;
            humanOpponentBtn.classList.add('selected');
            aiOpponentBtn.classList.remove('selected');
            difficultyContainer.style.display = 'none';
            startNewGame();
        });
        
        // Difficulty selection
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.aiDifficulty = btn.dataset.level;
                startNewGame();
            });
        });
        
        // Marker selection
        setupMarkerSelection(player1Markers, 0);
        setupMarkerSelection(player2Markers, 1);
    }
    
    // Setup marker selection
    function setupMarkerSelection(container, playerIndex) {
        const options = container.querySelectorAll('.marker-option');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                const selectedMarker = option.dataset.marker;
                
                // Prevent both players from having the same marker
                if (playerIndex === 0 && selectedMarker === state.playerMarkers[1]) {
                    return;
                } else if (playerIndex === 1 && selectedMarker === state.playerMarkers[0]) {
                    return;
                }
                
                // Update selection
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Update state
                state.playerMarkers[playerIndex] = selectedMarker;
                
                // If game is active, update the board display
                if (state.gameActive) {
                    updateBoard();
                }
            });
        });
    }
    
    // Start a new game
    function startNewGame() {
        state.board = ['', '', '', '', '', '', '', '', ''];
        state.currentPlayer = 0;
        state.gameActive = true;
        
        updateBoard();
        updateStatus();
        
        // If against AI and AI goes first (player 2), make AI move
        if (state.againstAI && state.currentPlayer === 1) {
            setTimeout(makeAIMove, 600);
        }
    }
    
    // Handle cell click
    function handleCellClick(event) {
        if (!state.gameActive) return;
        
        const cell = event.target.closest('.cell');
        if (!cell) return;
        
        const index = parseInt(cell.dataset.index);
        
        // Check if cell is already filled
        if (state.board[index] !== '') return;
        
        // Make move
        makeMove(index);
        
        // If the game is still active and it's AI's turn, make AI move
        if (state.gameActive && state.againstAI && state.currentPlayer === 1) {
            setTimeout(makeAIMove, 600);
        }
    }
    
    // Make a move
    function makeMove(index) {
        state.board[index] = state.playerMarkers[state.currentPlayer];
        
        // Update the board display
        updateBoard();
        
        // Check for win or draw
        if (checkWin()) {
            endGame(false);
        } else if (checkDraw()) {
            endGame(true);
        } else {
            // Switch player
            state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
            updateStatus();
        }
    }
    
    // Make AI move
    function makeAIMove() {
        if (!state.gameActive) return;
        
        let index;
        
        switch (state.aiDifficulty) {
            case 'easy':
                index = makeRandomMove();
                break;
            case 'medium':
                index = Math.random() < 0.7 ? makeSmartMove() : makeRandomMove();
                break;
            case 'hard':
                index = makeSmartMove();
                break;
            default:
                index = makeRandomMove();
        }
        
        makeMove(index);
    }
    
    // Make a random move
    function makeRandomMove() {
        const emptyCells = [];
        
        for (let i = 0; i < state.board.length; i++) {
            if (state.board[i] === '') {
                emptyCells.push(i);
            }
        }
        
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
    
    // Make a smart move (uses strategic algorithm)
    function makeSmartMove() {
        // First, check if AI can win in the next move
        for (let i = 0; i < state.board.length; i++) {
            if (state.board[i] === '') {
                state.board[i] = state.playerMarkers[1];
                if (checkWinForPlayer(state.playerMarkers[1])) {
                    state.board[i] = '';
                    return i;
                }
                state.board[i] = '';
            }
        }
        
        // Check if player can win in the next move and block them
        for (let i = 0; i < state.board.length; i++) {
            if (state.board[i] === '') {
                state.board[i] = state.playerMarkers[0];
                if (checkWinForPlayer(state.playerMarkers[0])) {
                    state.board[i] = '';
                    return i;
                }
                state.board[i] = '';
            }
        }
        
        // Take center if available
        if (state.board[4] === '') {
            return 4;
        }
        
        // Take corners if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => state.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7];
        const availableEdges = edges.filter(i => state.board[i] === '');
        if (availableEdges.length > 0) {
            return availableEdges[Math.floor(Math.random() * availableEdges.length)];
        }
        
        // Fallback to random move
        return makeRandomMove();
    }
    
    // Check if a specific player has won
    function checkWinForPlayer(playerMarker) {
        return state.winningCombinations.some(combination => {
            return combination.every(index => {
                return state.board[index] === playerMarker;
            });
        });
    }
    
    // Check for a win
    function checkWin() {
        const currentPlayerMarker = state.playerMarkers[state.currentPlayer];
        const winningCombination = state.winningCombinations.find(combination => {
            return combination.every(index => {
                return state.board[index] === currentPlayerMarker;
            });
        });
        
        if (winningCombination) {
            highlightWinningCombination(winningCombination);
            return true;
        }
        
        return false;
    }
    
    // Highlight winning combination
    function highlightWinningCombination(combination) {
        const cells = document.querySelectorAll('.cell');
        
        combination.forEach(index => {
            cells[index].classList.add('win');
        });
        
        // Draw a line through the winning combination
        const firstCell = cells[combination[0]].getBoundingClientRect();
        const lastCell = cells[combination[combination.length - 1]].getBoundingClientRect();
        const boardRect = boardElement.getBoundingClientRect();
        
        const line = document.createElement('div');
        line.className = 'win-line';
        
        // Calculate line position and angle
        const startX = firstCell.left + firstCell.width / 2 - boardRect.left;
        const startY = firstCell.top + firstCell.height / 2 - boardRect.top;
        const endX = lastCell.left + lastCell.width / 2 - boardRect.left;
        const endY = lastCell.top + lastCell.height / 2 - boardRect.top;
        
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        
        line.style.width = `${length}px`;
        line.style.height = '5px';
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.transform = `rotate(${angle}deg) translateX(0) translateY(-50%)`;
        
        boardElement.appendChild(line);
        
        // Animate the line
        setTimeout(() => {
            line.style.width = `${length}px`;
        }, 50);
    }
    
    // Check for a draw
    function checkDraw() {
        return state.board.every(cell => cell !== '');
    }
    
    // End the game
    function endGame(isDraw) {
        state.gameActive = false;
        
        if (isDraw) {
            state.stats.draws++;
            displayResult('It\'s a draw!');
        } else {
            const winner = state.currentPlayer === 0 ? 'Player 1' : (state.againstAI ? 'AI' : 'Player 2');
            
            if (state.currentPlayer === 0) {
                state.stats.player1Wins++;
            } else {
                state.stats.player2Wins++;
            }
            
            displayResult(`${winner} wins!`);
        }
        
        saveStats();
        updateStatsDisplay();
    }
    
    // Display result
    function displayResult(message) {
        resultMessage.textContent = message;
        resultModal.classList.add('active');
    }
    
    // Update the board display
    function updateBoard() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const cellContent = cell.querySelector('.cell-content');
            cellContent.textContent = state.board[index];
            
            if (state.board[index]) {
                cellContent.classList.add('show');
            } else {
                cellContent.classList.remove('show');
            }
        });
    }
    
    // Update game status
    function updateStatus() {
        const currentPlayerName = state.currentPlayer === 0 ? 'Player 1' : (state.againstAI ? 'AI' : 'Player 2');
        const currentMarker = state.playerMarkers[state.currentPlayer];
        
        statusElement.textContent = `${currentPlayerName}'s turn (${currentMarker})`;
        statusElement.className = 'status';
        
        if (state.currentPlayer === 0 || !state.againstAI) {
            statusElement.classList.add('player-turn');
        }
    }
    
    // Save stats to local storage
    function saveStats() {
        localStorage.setItem('tictactoe_stats', JSON.stringify(state.stats));
    }
    
    // Load stats from local storage
    function loadStats() {
        const savedStats = localStorage.getItem('tictactoe_stats');
        
        if (savedStats) {
            state.stats = JSON.parse(savedStats);
        }
    }
    
    // Update stats display
    function updateStatsDisplay() {
        statsElements.player1Wins.textContent = state.stats.player1Wins;
        statsElements.player2Wins.textContent = state.stats.player2Wins;
        statsElements.draws.textContent = state.stats.draws;
    }
    
    // Reset stats
    function resetStats() {
        state.stats = {
            player1Wins: 0,
            player2Wins: 0,
            draws: 0
        };
        
        saveStats();
        updateStatsDisplay();
    }
    
    // Initialize the game
    initGame();
});