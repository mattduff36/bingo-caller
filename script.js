document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const resetButton = document.getElementById('resetButton');
    const intervalSelector = document.getElementById('intervalSelector');
    const voiceSelector = document.getElementById('voiceSelector');
    const ballDisplay = document.getElementById('ballDisplay');
    const ballNumberDisplay = document.getElementById('ballNumber');
    const lastCalledMessage = document.getElementById('lastCalledMessage');
    const nicknameExplanationDisplay = document.getElementById('nicknameExplanationDisplay');
    const bingoBoardContainer = document.getElementById('bingoBoardContainer');
    const settingsButton = document.getElementById('settingsButton');
    const closeModalButton = document.getElementById('closeModalButton');
    const settingsModal = document.getElementById('settingsModal');
    const expandedBoardModal = document.getElementById('expandedBoardModal');
    const closeExpandedBoardButton = document.getElementById('closeExpandedBoardButton');
    const addToHomeScreenButton = document.getElementById('addToHomeScreenButton');
    
    // New Universal Install Modal Elements
    const installModal = document.getElementById('installModal');
    const closeInstallModalButton = document.getElementById('closeInstallModalButton');
    const androidInstructions = document.getElementById('android-instructions');
    const iosSafariInstructions = document.getElementById('ios-safari-instructions');
    const iosOtherInstructions = document.getElementById('ios-other-instructions');
    const nativeInstallButton = document.getElementById('native-install-button');

    // --- State Variables ---
    let numbersPool = [];
    let calledNumbers = [];
    let callIntervalId = null;
    let isPaused = true;
    let currentInterval = 5000;
    let voices = [];
    let previousNumber = null;
    let deferredPrompt;

    // --- Core Functions ---
    function initializeNumbers() {
        numbersPool = Array.from({ length: 90 }, (_, i) => i + 1);
        calledNumbers = [];
        previousNumber = null;
    }

    function getBallColorClass(number) {
        if (number >= 1 && number <= 15) return 'ball-color-1-15';
        if (number >= 16 && number <= 30) return 'ball-color-16-30';
        if (number >= 31 && number <= 45) return 'ball-color-31-45';
        if (number >= 46 && number <= 60) return 'ball-color-46-60';
        if (number >= 61 && number <= 75) return 'ball-color-61-75';
        if (number >= 76 && number <= 90) return 'ball-color-76-90';
        return '';
    }

    function populateVoiceList() {
        voices = speechSynthesis.getVoices();
        voiceSelector.innerHTML = '';
        if (voices.length === 0) {
            voiceSelector.innerHTML = '<option>No voices available</option>';
            return;
        }
        const preferredVoiceKeywords = ['Google', 'Microsoft', 'Natural', 'Aria', 'Zira', 'David', 'Mark', 'Guy', 'Jenny', 'Daniel'];
        const englishVoices = voices
            .map((voice, index) => ({ voice, index }))
            .filter(({ voice }) => voice.lang.startsWith('en-'));
        const preferredVoices = englishVoices.filter(({ voice }) => preferredVoiceKeywords.some(kw => voice.name.includes(kw)));
        const otherVoices = englishVoices.filter(v => !preferredVoices.includes(v));
        const curatedVoices = [...preferredVoices, ...otherVoices].slice(0, 15);

        if (curatedVoices.length === 0) {
            voiceSelector.innerHTML = '<option>No English voices found</option>';
            return;
        }

        let defaultVoiceIndex = -1;
        curatedVoices.forEach(({ voice, index }, i) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-voice-index', index);
            voiceSelector.appendChild(option);
            if (voice.name.includes('Daniel') && voice.lang === 'en-GB') {
                defaultVoiceIndex = i;
            }
        });

        if (defaultVoiceIndex !== -1) {
            voiceSelector.selectedIndex = defaultVoiceIndex;
        }
    }

    function displayCalledNumber(number) {
        ballNumberDisplay.textContent = number;
        ballDisplay.className = `ball ${getBallColorClass(number)}`;
        ballDisplay.classList.add('new-call-animation');
        ballDisplay.addEventListener('animationend', () => ballDisplay.classList.remove('new-call-animation'), { once: true });
        nicknameExplanationDisplay.textContent = bingoNicknames[number]?.explanation || "";
        lastCalledMessage.textContent = previousNumber ? `Previous number: ${previousNumber}` : 'First number called!';
        speakNumberWithNickname(number);
        updateBoardBall(number);
    }

    function speakNumberWithNickname(number) {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const nicknameInfo = bingoNicknames[number];
        const textToSpeak = nicknameInfo?.nickname ? `${nicknameInfo.nickname}. Number ${number}.` : `Number ${number}.`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const selectedOption = voiceSelector.selectedOptions[0];
        const voiceIndex = selectedOption.getAttribute('data-voice-index');
        if (voiceIndex) {
            utterance.voice = voices[voiceIndex];
        }
        speechSynthesis.speak(utterance);
    }

    function updateBoardBall(number) {
        const boardBall = document.getElementById(`board-ball-${number}`);
        if (boardBall) {
            boardBall.classList.add('called', getBallColorClass(number));
            const callOrderSpan = document.createElement('span');
            callOrderSpan.className = 'call-order';
            callOrderSpan.textContent = calledNumbers.length;
            boardBall.appendChild(callOrderSpan);
        }
    }

    function createBingoBoard(container) {
        container.innerHTML = '';
        for (let i = 1; i <= 90; i++) {
            const ball = document.createElement('div');
            ball.className = 'board-ball';
            ball.id = `board-ball-${i}`;
            ball.style.animationDelay = `${i * 15}ms`;
            const numberSpan = document.createElement('span');
            numberSpan.textContent = i;
            ball.appendChild(numberSpan);
            container.appendChild(ball);
        }
    }
    
    function updateExpandedBoard() {
        const recentCallsBallsContainer = document.querySelector('.recent-calls-balls');
        recentCallsBallsContainer.innerHTML = '';
        const recent = calledNumbers.slice(-5).reverse();
        if (recent.length > 0) {
            recent.forEach(number => {
                const ball = document.createElement('div');
                ball.className = `board-ball called ${getBallColorClass(number)}`;
                const numberSpan = document.createElement('span');
                numberSpan.textContent = number;
                ball.appendChild(numberSpan);
                recentCallsBallsContainer.appendChild(ball);
            });
            document.getElementById('recentCallsContainer').style.display = 'flex';
        } else {
            document.getElementById('recentCallsContainer').style.display = 'none';
        }
    }

    function callNextNumber() {
        if (numbersPool.length === 0) {
            lastCalledMessage.textContent = 'All numbers called!';
            stopCalling();
            return;
        }
        previousNumber = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
        const randomIndex = Math.floor(Math.random() * numbersPool.length);
        const newNumber = numbersPool.splice(randomIndex, 1)[0];
        calledNumbers.push(newNumber);
        displayCalledNumber(newNumber);
    }

    function startCalling() {
        if (isPaused) {
            isPaused = false;
            ballDisplay.classList.add('in-progress');
            if (calledNumbers.length > 0) { // If resuming, call a number immediately
                callNextNumber();
            }
            callIntervalId = setInterval(callNextNumber, currentInterval);
        }
    }

    function stopCalling() {
        isPaused = true;
        clearInterval(callIntervalId);
        ballDisplay.classList.remove('in-progress');
    }

    function toggleCalling() {
        if (isPaused) {
            startCalling();
        } else {
            stopCalling();
        }
    }

    function resetGame() {
        stopCalling();
        initializeNumbers();
        createBingoBoard(bingoBoardContainer);
        updateExpandedBoard(); // Clears recent calls
        ballNumberDisplay.textContent = '--';
        lastCalledMessage.textContent = 'Game reset. Click the ball to begin.';
        nicknameExplanationDisplay.textContent = '';
        ballDisplay.className = 'ball';
    }

    // --- PWA Installation Functions ---
    function isIos() {
        return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) && !window.MSStream;
    }

    function getBrowserOnIos() {
        const ua = window.navigator.userAgent;
        if (ua.includes('CriOS')) return 'Chrome';
        if (ua.includes('FxiOS')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        return 'Other';
    }

    function showInstallPrompt() {
        androidInstructions.style.display = 'none';
        iosSafariInstructions.style.display = 'none';
        iosOtherInstructions.style.display = 'none';

        if (isIos() && !window.navigator.standalone) {
            const browser = getBrowserOnIos();
            if (browser === 'Safari') {
                iosSafariInstructions.style.display = 'block';
            } else {
                iosOtherInstructions.style.display = 'block';
            }
        } else if (deferredPrompt) {
            androidInstructions.style.display = 'block';
        }

        installModal.style.display = 'flex';
    }

    function hideInstallPrompt() {
        installModal.style.display = 'none';
    }

    // --- Event Listeners ---
    window.addEventListener('load', () => document.body.classList.add('loaded'));

    ballDisplay.addEventListener('click', toggleCalling);
    ballDisplay.addEventListener('keydown', e => (e.key === ' ' || e.key === 'Enter') && toggleCalling());
    resetButton.addEventListener('click', resetGame);
    intervalSelector.addEventListener('change', e => {
        currentInterval = parseInt(e.target.value, 10) * 1000;
        if (!isPaused) {
            stopCalling();
            startCalling();
        }
    });

    settingsButton.addEventListener('click', () => settingsModal.style.display = 'flex');
    closeModalButton.addEventListener('click', () => settingsModal.style.display = 'none');
    bingoBoardContainer.addEventListener('click', () => {
        updateExpandedBoard();
        expandedBoardModal.style.display = 'flex';
    });
    closeExpandedBoardButton.addEventListener('click', () => expandedBoardModal.style.display = 'none');

    window.addEventListener('click', e => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
        if (e.target === expandedBoardModal) expandedBoardModal.style.display = 'none';
        if (e.target === installModal) hideInstallPrompt();
    });

    // PWA Listeners
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        // Only show the button if it's not an iOS device, as iOS is handled on page load.
        if (!isIos()) {
            addToHomeScreenButton.style.display = 'block';
        }
    });

    addToHomeScreenButton.addEventListener('click', () => {
        showInstallPrompt();
    });

    nativeInstallButton.addEventListener('click', async () => {
        hideInstallPrompt();
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            addToHomeScreenButton.style.display = 'none';
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        addToHomeScreenButton.style.display = 'none';
        console.log('PWA was installed');
    });

    closeInstallModalButton.addEventListener('click', hideInstallPrompt);
    
    // --- Initialisation ---
    initializeNumbers();
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    populateVoiceList(); // Call it once directly
    createBingoBoard(bingoBoardContainer);
    lastCalledMessage.textContent = 'Welcome! Click the ball to begin.';
    
    // Show install button on page load if on iOS and not already installed.
    if (isIos() && !window.navigator.standalone) {
        addToHomeScreenButton.style.display = 'block';
    }

    // Register Service Worker for PWA capabilities
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
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
