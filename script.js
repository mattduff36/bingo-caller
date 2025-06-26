document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('resetButton');
    const intervalSelector = document.getElementById('intervalSelector');
    const voiceSelector = document.getElementById('voiceSelector');
    const ballDisplay = document.getElementById('ballDisplay'); // Main large ball
    const ballNumberDisplay = document.getElementById('ballNumber'); // Number in main large ball
    const lastCalledMessage = document.getElementById('lastCalledMessage');
    const nicknameExplanationDisplay = document.getElementById('nicknameExplanationDisplay'); // For nickname explanation
    const bingoBoardContainer = document.getElementById('bingoBoardContainer'); // Grid for 90 balls

    // Modal elements
    const settingsButton = document.getElementById('settingsButton');
    const closeModalButton = document.getElementById('closeModalButton');
    const settingsModal = document.getElementById('settingsModal');
    const expandedBoardModal = document.getElementById('expandedBoardModal');
    const closeExpandedBoardButton = document.getElementById('closeExpandedBoardButton');

    let numbersPool = []; // Numbers 1-90 available to be called
    let calledNumbers = []; // Numbers that have been called in the current game
    let callIntervalId = null;
    let isPaused = true; // Game state tracker
    let currentInterval = 5000; // Default 5 seconds
    let voices = []; // To store available speech synthesis voices
    let previousNumber = null; // To store the previously called number

    function initializeNumbers() {
        numbersPool = [];
        for (let i = 1; i <= 90; i++) {
            numbersPool.push(i);
        }
        calledNumbers = [];
        previousNumber = null; // Reset on initialization
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

    function populateVoiceList() {
        voices = speechSynthesis.getVoices();
        voiceSelector.innerHTML = ''; // Clear any previous options
    
        if (voices.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No voices available';
            voiceSelector.appendChild(option);
            return;
        }
        
        const preferredVoiceKeywords = ['Google', 'Microsoft', 'Natural', 'Aria', 'Zira', 'David', 'Mark', 'Guy', 'Jenny'];

        // Filter for English voices, separating preferred from others
        const englishVoices = voices
            .map((voice, index) => ({ voice, index }))
            .filter(({ voice }) => voice.lang.startsWith('en-'));

        const preferredVoices = [];
        const otherVoices = [];

        englishVoices.forEach(item => {
            const isPreferred = preferredVoiceKeywords.some(keyword => item.voice.name.includes(keyword));
            if (isPreferred) {
                preferredVoices.push(item);
            } else {
                otherVoices.push(item);
            }
        });

        // Create a final list, prioritizing preferred voices, and limit the count
        let curatedVoices = [...preferredVoices, ...otherVoices].slice(0, 8);
    
        if (curatedVoices.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No English voices found';
            voiceSelector.appendChild(option);
            return;
        }

        let defaultVoiceIndex = -1; // To store the index of the default voice
    
        curatedVoices.forEach(({ voice, index }, i) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-voice-index', index);
            voiceSelector.appendChild(option);

            // Check if this voice is the desired default
            if (voice.name.includes('Daniel') && voice.lang === 'en-GB') {
                defaultVoiceIndex = i;
            }
        });

        // Set the default selection
        if (defaultVoiceIndex !== -1) {
            voiceSelector.selectedIndex = defaultVoiceIndex;
        }
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

        const nicknameInfo = bingoNicknames[number];
        let explanationText = "";
        if (nicknameInfo && nicknameInfo.explanation) {
            explanationText = nicknameInfo.explanation;
        }
        nicknameExplanationDisplay.textContent = explanationText;
        
        if (previousNumber) {
            lastCalledMessage.textContent = `Previous number: ${previousNumber}`;
        } else {
            lastCalledMessage.textContent = 'First number called!';
        }

        speakNumberWithNickname(number);
        updateBoardBall(number); // Update the corresponding ball on the grid
    }

    function speakNumberWithNickname(number) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel(); // Clear queue

            const nicknameInfo = bingoNicknames[number];
            let textToSpeak;

            if (nicknameInfo && nicknameInfo.nickname) {
                textToSpeak = `${nicknameInfo.nickname}. Number ${number}.`;
            } else {
                textToSpeak = `Number ${number}.`;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            const selectedOption = voiceSelector.selectedOptions[0];
            const voiceIndex = selectedOption.getAttribute('data-voice-index');
            if (voiceIndex) {
                utterance.voice = voices[voiceIndex];
            }

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

    function createBingoBoard(container) {
        container.innerHTML = ''; // Clear previous board

        for (let i = 1; i <= 90; i++) {
            const ball = document.createElement('div');
            ball.classList.add('board-ball');
            ball.id = `board-ball-${i}`;

            const numberSpan = document.createElement('span');
            numberSpan.textContent = i;
            ball.appendChild(numberSpan);
            
            container.appendChild(ball);
        }
    }

    function updateExpandedBoard() {
        // This function now only updates the recent calls display.
        const recentCallsBallsContainer = document.querySelector('.recent-calls-balls');
        const recentCallsContainer = document.getElementById('recentCallsContainer');
        recentCallsBallsContainer.innerHTML = ''; // Clear previous balls
        const recent = calledNumbers.slice(-5).reverse();
        
        if (recent.length > 0) {
            recentCallsContainer.style.display = 'flex'; // Make sure the container is visible
            recent.forEach(number => {
                const ball = document.createElement('div');
                ball.classList.add('board-ball', 'called');
                
                const colorClass = getBallColorClass(number);
                if (colorClass) {
                    ball.classList.add(colorClass);
                }
                
                const numberSpan = document.createElement('span');
                numberSpan.textContent = number;
                ball.appendChild(numberSpan);

                recentCallsBallsContainer.appendChild(ball);
            });
        } else {
             recentCallsContainer.style.display = 'none'; // Hide if no numbers are called
        }
    }

    function callNextNumber() {
        if (numbersPool.length === 0) {
            lastCalledMessage.textContent = 'All numbers called!';
            stopCalling();
            return;
        }

        const currentNumber = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
        if (currentNumber) {
            previousNumber = currentNumber;
        }

        const randomIndex = Math.floor(Math.random() * numbersPool.length);
        const calledNumber = numbersPool.splice(randomIndex, 1)[0];
        calledNumbers.push(calledNumber);
        displayCalledNumber(calledNumber);
    }

    function startCalling() {
        isPaused = false;
        lastCalledMessage.textContent = 'Calling...';

        currentInterval = parseInt(intervalSelector.value, 10) * 1000;
        if (isNaN(currentInterval) || currentInterval < 2000) {
            currentInterval = 5000; // Default to 5s if value is invalid
            intervalSelector.value = "5";
        }

        // Immediately call the next number when resuming or starting.
        callNextNumber();

        // Then set the interval for subsequent calls.
        callIntervalId = setInterval(callNextNumber, currentInterval);
        intervalSelector.disabled = true;
    }

    function stopCalling() {
        if (callIntervalId) {
            clearInterval(callIntervalId);
            callIntervalId = null;
        }
        isPaused = true;
        lastCalledMessage.textContent = 'Paused. Click the ball to resume.';
        intervalSelector.disabled = false;
    }
    
    function toggleCalling() {
        if (numbersPool.length === 0) {
            lastCalledMessage.textContent = 'All numbers called! Reset to play again.';
            return; // Don't do anything if game is over
        }
        
        if (isPaused) {
            startCalling();
            // Disable interval changing while calling is active
            intervalSelector.disabled = true;
        } else {
            stopCalling();
        }
    }

    function resetGame() {
        stopCalling();
        initializeNumbers();
        isPaused = true;
        previousNumber = null; // Also reset previous number here

        // Reset UI elements
        ballNumberDisplay.textContent = '...';
        ballDisplay.className = 'ball'; // Reset main display ball color
        lastCalledMessage.textContent = 'Game reset. Click the ball to start.';
        nicknameExplanationDisplay.textContent = ''; // Clear explanation on reset
        intervalSelector.disabled = false;
        // If speech is ongoing, stop it
        if ('speechSynthesis' in window && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
    }

    // Event Listeners
    ballDisplay.addEventListener('click', toggleCalling);
    ballDisplay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleCalling();
        }
    });
    resetButton.addEventListener('click', resetGame);

    // Modal event listeners
    settingsButton.addEventListener('click', () => {
        settingsModal.classList.add('visible');
    });

    closeModalButton.addEventListener('click', () => {
        settingsModal.classList.remove('visible');
    });

    // Close modal if user clicks outside of the modal content
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('visible');
        }
    });

    // Expanded board modal listeners
    bingoBoardContainer.addEventListener('click', () => {
        updateExpandedBoard();
        expandedBoardModal.classList.add('visible');
    });

    closeExpandedBoardButton.addEventListener('click', () => {
        expandedBoardModal.classList.remove('visible');
    });

    expandedBoardModal.addEventListener('click', (e) => {
        if (e.target === expandedBoardModal) {
            expandedBoardModal.classList.remove('visible');
        }
    });

    // Initial Setup
    // Voices are loaded asynchronously. We need to listen for when they are ready.
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    createBingoBoard(bingoBoardContainer); // Create the initial 90-ball grid
    initializeNumbers(); // Prepare numbers 1-90 for calling
    lastCalledMessage.textContent = 'Welcome! Click the ball to begin.';

    // Register Service Worker for PWA capabilities
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { // Use window.load to ensure page is fully loaded
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});
