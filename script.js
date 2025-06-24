document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const intervalInput = document.getElementById('intervalInput');
    const ballDisplay = document.getElementById('ballDisplay');
    const ballNumberDisplay = document.getElementById('ballNumber');
    const lastCalledMessage = document.getElementById('lastCalledMessage');
    const historyContainer = document.getElementById('historyContainer');

    let numbersPool = [];
    let calledNumbers = [];
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

        // Animation
        ballDisplay.classList.add('new-call-animation');
        setTimeout(() => {
            ballDisplay.classList.remove('new-call-animation');
        }, 500); // Animation duration should match CSS

        lastCalledMessage.textContent = `Last called: ${number}`;
        addNumberToHistory(number);
    }

    function addNumberToHistory(number) {
        const historyBall = document.createElement('div');
        historyBall.classList.add('history-ball');
        const colorClass = getBallColorClass(number);
        if (colorClass) {
            historyBall.classList.add(colorClass);
        }
        historyBall.textContent = number;
        historyContainer.appendChild(historyBall);
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
        initializeNumbers();
        historyContainer.innerHTML = '';
        ballNumberDisplay.textContent = '--';
        ballDisplay.className = 'ball'; // Reset ball color
        lastCalledMessage.textContent = 'Waiting to start...';
        startButton.disabled = false;
        stopButton.disabled = true;
        intervalInput.disabled = false;
    }

    // Event Listeners
    startButton.addEventListener('click', startCalling);
    stopButton.addEventListener('click', stopCalling);

    // Initialize
    initializeNumbers();
    stopButton.disabled = true; // Initially stop is disabled
});
