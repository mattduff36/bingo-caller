document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const intervalInput = document.getElementById('intervalInput');
    const ballDisplay = document.getElementById('ballDisplay'); // Main large ball
    const ballNumberDisplay = document.getElementById('ballNumber'); // Number in main large ball
    const lastCalledMessage = document.getElementById('lastCalledMessage');
    const bingoBoardContainer = document.getElementById('bingoBoardContainer'); // Grid for 90 balls

    let numbersPool = []; // Numbers 1-90 available to be called
    let calledNumbers = []; // Numbers that have been called in the current game
    let callIntervalId = null;
    let currentInterval = 5000; // Default 5 seconds

    function initializeNumbers() {
        numbersPool = [];
        for (let i = 1; i <= 90; i++) {
            numbersPool.push(i);
        }
        calledNumbers = [];
    }

    function getBallColorClass(number) {
        if (number >= 1 && number <= 15) return 'ball-color-1-15';
        if (number >= 16 && number <= 30) return 'ball-color-16-30';
        if (number >= 31 && number <= 45) return 'ball-color-31-45';
        if (number >= 46 && number <= 60) return 'ball-color-46-60';
        if (number >= 61 && number <= 75) return 'ball-color-61-75';
        if (number >= 76 && number <= 90) return 'ball-color-76-90';
        return ''; // Default
    }

    function displayCalledNumber(number) {
        ballNumberDisplay.textContent = number;

        // Remove previous color classes
        ballDisplay.className = 'ball'; // Reset to base class

        // Add new color class
        const colorClass = getBallColorClass(number);
        if (colorClass) {
            ballDisplay.classList.add(colorClass);
        }

        // Animation for the large display ball
        ballDisplay.classList.add('new-call-animation');
        setTimeout(() => {
            ballDisplay.classList.remove('new-call-animation');
        }, 500); // Animation duration should match CSS

        lastCalledMessage.textContent = `Last called: ${number}`;
        speakNumber(number); // Speak the called number
        updateBoardBall(number); // Update the corresponding ball on the grid
    }

    function speakNumber(number) {
        if ('speechSynthesis' in window) {
            // Cancel any previous utterance to prevent overlap if calls are very fast
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(number.toString());
            // utterance.lang = 'en-GB'; // Optional: set language for accent
            speechSynthesis.speak(utterance);
        } else {
            console.log("Speech synthesis not supported by this browser.");
        }
    }

    function updateBoardBall(number) {
        const boardBall = document.getElementById(`board-ball-${number}`);
        if (boardBall) {
            // Ensure we don't re-add classes if somehow called again for the same number, though logic prevents this.
            boardBall.classList.add('called');
            const colorClass = getBallColorClass(number);
            if (colorClass) {
                boardBall.classList.add(colorClass);
            }
        }
    }

    function createBingoBoard() {
        bingoBoardContainer.innerHTML = ''; // Clear previous board
        for (let i = 1; i <= 90; i++) {
            const ball = document.createElement('div');
            ball.classList.add('board-ball');
            ball.id = `board-ball-${i}`;

            const numberSpan = document.createElement('span');
            numberSpan.textContent = i;
            ball.appendChild(numberSpan);

            bingoBoardContainer.appendChild(ball);
        }
    }

    function callNextNumber() {
        if (numbersPool.length === 0) {
            lastCalledMessage.textContent = 'All numbers called!';
            stopCalling();
            return;
        }

        const randomIndex = Math.floor(Math.random() * numbersPool.length);
        const calledNumber = numbersPool.splice(randomIndex, 1)[0];
        calledNumbers.push(calledNumber);
        displayCalledNumber(calledNumber);
    }

    function startCalling() {
        if (callIntervalId !== null) return; // Already running

        currentInterval = parseInt(intervalInput.value, 10) * 1000;
        if (isNaN(currentInterval) || currentInterval < 1000) {
            currentInterval = 5000; // Default to 5s if input is invalid
            intervalInput.value = currentInterval / 1000;
        }

        if (numbersPool.length === 0 || calledNumbers.length === 90) {
            resetGame(); // Reset if game was finished
        }

        lastCalledMessage.textContent = 'Calling started...';
        callNextNumber(); // Call the first number immediately
        callIntervalId = setInterval(callNextNumber, currentInterval);

        startButton.disabled = true;
        stopButton.disabled = false;
        intervalInput.disabled = true;
    }

    function stopCalling() {
        if (callIntervalId !== null) {
            clearInterval(callIntervalId);
            callIntervalId = null;
        }
        if (numbersPool.length > 0) {
            lastCalledMessage.textContent = 'Calling paused. Press Start to resume.';
        }
        startButton.disabled = false;
        stopButton.disabled = true;
        intervalInput.disabled = false;
    }

    function resetGame() {
        stopCalling();
        initializeNumbers(); // Resets numbersPool and calledNumbers
        createBingoBoard(); // Re-creates the board (all balls uncalled)
        ballNumberDisplay.textContent = '--';
        ballDisplay.className = 'ball'; // Reset main display ball color
        lastCalledMessage.textContent = 'Game reset. Waiting to start...';
        startButton.disabled = false;
        stopButton.disabled = true;
        intervalInput.disabled = false;
        // If speech is ongoing, stop it
        if ('speechSynthesis' in window && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
    }

    // Event Listeners
    startButton.addEventListener('click', startCalling);
    stopButton.addEventListener('click', stopCalling);

    // Initial Setup
    createBingoBoard(); // Create the initial 90-ball grid
    initializeNumbers(); // Prepare numbers 1-90 for calling
    stopButton.disabled = true; // Initially stop is disabled
    lastCalledMessage.textContent = 'Welcome! Press Start to begin.';
});
