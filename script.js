const board = document.getElementById('board');
const rollDiceBtn = document.getElementById('roll-dice');
const diceDisplay = document.getElementById('dice-display');
const messages = document.getElementById('messages');

let playerPos = 1;
let aiPos = 1;
let currentPlayer = 'player'; // 'player' or 'ai'
let gameOver = false;

// Snakes and ladders
const snakes = {
    16: 6,
    47: 26,
    49: 11,
    56: 53,
    62: 19,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    98: 78
};

const ladders = {
    1: 38,
    4: 14,
    9: 31,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    80: 100
};

// Create board in zigzag order
const boardNumbers = [];
for (let row = 1; row <= 10; row++) {
    if (row % 2 === 1) {
        for (let col = 1; col <= 10; col++) {
            boardNumbers.push((row - 1) * 10 + col);
        }
    } else {
        for (let col = 10; col >= 1; col--) {
            boardNumbers.push((row - 1) * 10 + col);
        }
    }
}

function createBoard() {
    for (let num of boardNumbers) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.textContent = num;
        if (snakes[num]) {
            cell.classList.add('snake');
        } else if (ladders[num]) {
            cell.classList.add('ladder');
        }
        board.appendChild(cell);
    }
}

// Get cell position
function getCellPos(num) {
    const cells = document.querySelectorAll('.cell');
    const index = boardNumbers.indexOf(num);
    return cells[index];
}

// Move token
function moveToken(token, from, to, callback) {
    const fromCell = getCellPos(from);
    const toCell = getCellPos(to);
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    token.style.left = (fromRect.left - boardRect.left + 15) + 'px';
    token.style.top = (fromRect.top - boardRect.top + 15) + 'px';

    setTimeout(() => {
        token.style.left = (toRect.left - boardRect.left + 15) + 'px';
        token.style.top = (toRect.top - boardRect.top + 15) + 'px';
        setTimeout(callback, 500);
    }, 100);
}

// Roll dice
function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

// Check win
function checkWin(pos) {
    if (pos == 100) {
        gameOver = true;
        messages.textContent = currentPlayer === 'player' ? 'You win!' : 'AI wins!';
        rollDiceBtn.disabled = true;
        return true;
    }
    return false;
}

// Player turn
function playerTurn() {
    const roll = rollDice();
    diceDisplay.textContent = `Dice: ${roll}`;
    const newPos = playerPos + roll;
    if (newPos > 100) {
        // Stay in place if overshoot
        moveToken(playerToken, playerPos, playerPos, () => {
            currentPlayer = 'ai';
            aiTurn();
        });
        return;
    }
    playerPos = newPos;
    if (snakes[playerPos]) {
        playerPos = snakes[playerPos];
    } else if (ladders[playerPos]) {
        playerPos = ladders[playerPos];
    }
    moveToken(playerToken, playerPos - roll, playerPos, () => {
        if (!checkWin(playerPos)) {
            currentPlayer = 'ai';
            aiTurn();
        }
    });
}

// AI turn
function aiTurn() {
    fetch(`http://localhost:5000/ai_decision?playerPos=${playerPos}&aiPos=${aiPos}`)
        .then(response => response.json())
        .then(data => {
            const roll = data.roll;
            const message = data.message;
            diceDisplay.textContent = `AI Dice: ${roll}`;
            const newPos = aiPos + roll;
            if (newPos > 100) {
                aiTurn(); // retry if over
                return;
            }
            aiPos = newPos;
            if (snakes[aiPos]) {
                aiPos = snakes[aiPos];
            } else if (ladders[aiPos]) {
                aiPos = ladders[aiPos];
            }
            moveToken(aiToken, aiPos - roll, aiPos, () => {
                showChatBubble(message);
                if (!checkWin(aiPos)) {
                    currentPlayer = 'player';
                }
            });
        })
        .catch(err => console.error(err));
}

// Show chat bubble
function showChatBubble(msg) {
    chatBubble.textContent = msg;
    chatBubble.style.display = 'block';
    setTimeout(() => {
        chatBubble.style.display = 'none';
    }, 3000);
}

// Initialize
createBoard();
const playerToken = document.createElement('div');
playerToken.id = 'player-token';
board.appendChild(playerToken);

const aiToken = document.createElement('div');
aiToken.id = 'ai-token';
board.appendChild(aiToken);

const chatBubble = document.createElement('div');
chatBubble.id = 'chat-bubble';
aiToken.appendChild(chatBubble);

// Event listeners
rollDiceBtn.addEventListener('click', () => {
    if (currentPlayer === 'player' && !gameOver) {
        playerTurn();
    }
});
