document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const resetButton = document.getElementById('resetButton');
    const voiceSelector = document.getElementById('voiceSelector');
    const ballDisplay = document.getElementById('ballDisplay');
    const ballNumberDisplay = document.getElementById('ballNumber');
    const lastCalledMessage = document.getElementById('lastCalledMessage');
    const nicknameExplanationDisplay = document.getElementById('nicknameExplanationDisplay');
    const bingoBoardContainer = document.getElementById('bingoBoardContainer');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const expandedBoardModal = document.getElementById('expandedBoardModal');
    const addToHomeScreenButton = document.getElementById('addToHomeScreenButton');
    
    // New Universal Install Modal Elements
    const installModal = document.getElementById('installModal');
    const closeInstallModalButton = document.getElementById('closeInstallModalButton');
    const androidInstructions = document.getElementById('android-instructions');
    const iosSafariInstructions = document.getElementById('ios-safari-instructions');
    const iosOtherInstructions = document.getElementById('ios-other-instructions');
    const nativeInstallButton = document.getElementById('native-install-button');

    // Speed control buttons
    const speedButtons = [
        document.getElementById('speed-fast'),
        document.getElementById('speed-medium'),
        document.getElementById('speed-slow')
    ];

    // --- State Variables ---
    let numbersPool = [];
    let calledNumbers = [];
    let callIntervalId = null;
    let isPaused = true;
    let currentInterval = 5000; // Default interval to 5 seconds (Medium)
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

        // Use a Map to get unique voices by name, preferring Google-backed voices if names are identical
        const voiceMap = new Map();
        for (const voice of voices) {
            if (!voice.lang.startsWith('en-')) continue;

            const existing = voiceMap.get(voice.name);
            // Prioritize Google voices as they are often higher quality
            if (!existing || (existing && !existing.voiceURI.includes('Google') && voice.voiceURI.includes('Google'))) {
                voiceMap.set(voice.name, voice);
            }
        }
        const uniqueVoices = Array.from(voiceMap.values());
        
        // Find the preferred Daniel voice
        const danielVoice = uniqueVoices.find(v => v.name.includes('Daniel') && v.lang === 'en-GB');

        // Get other preferred voices
        const preferredKeywords = ['Google', 'Microsoft', 'Natural'];
        const otherPreferredVoices = uniqueVoices.filter(v => 
            v !== danielVoice && preferredKeywords.some(kw => v.name.includes(kw))
        );

        // Combine and build the final list
        let curatedVoices = [];
        if (danielVoice) {
            curatedVoices.push(danielVoice);
        }
        curatedVoices.push(...otherPreferredVoices);
        
        // Add other voices if we still have space, up to 5
        const remainingVoices = uniqueVoices.filter(v => !curatedVoices.includes(v));
        curatedVoices.push(...remainingVoices);
        
        curatedVoices = curatedVoices.slice(0, 5);

        if (curatedVoices.length === 0) {
            voiceSelector.innerHTML = '<option>No English voices found</option>';
            return;
        }

        let defaultVoiceIndex = -1;
        curatedVoices.forEach((voice, i) => {
            const originalIndex = voices.findIndex(v => v.voiceURI === voice.voiceURI);
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-voice-index', originalIndex);
            voiceSelector.appendChild(option);
            if (voice === danielVoice) {
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
        updateExpandedBoard(); // Update the "last 5" display in real-time
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
            recent.forEach((number, index) => {
                const ball = document.createElement('div');
                ball.className = `recent-ball called ${getBallColorClass(number)}`;
                
                const numberSpan = document.createElement('span');
                numberSpan.textContent = number;
                ball.appendChild(numberSpan);

                // Add animation to the newest ball only
                if (index === 0 && calledNumbers.length > 1) {
                    ball.classList.add('new-recent-ball');
                }

                recentCallsBallsContainer.appendChild(ball);
            });
            document.getElementById('recentCallsContainer').style.display = 'block';
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
            callNextNumber(); // Call the first number immediately
            callIntervalId = setInterval(callNextNumber, currentInterval);
        }
    }

    function stopCalling() {
        isPaused = true;
        clearInterval(callIntervalId);
        ballDisplay.classList.remove('in-progress');
        // Only show "paused" if the game is not over and there are called numbers
        if (numbersPool.length > 0 && calledNumbers.length > 0) {
            lastCalledMessage.textContent = 'Calling paused.';
        }
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
        updateExpandedBoard(); // Clears recent calls display
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
    
    speedButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            speedButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Update the interval
            const newInterval = parseInt(button.dataset.speed, 10);
            if (currentInterval !== newInterval) {
                currentInterval = newInterval;
                // If the game is running, restart the interval
                if (!isPaused) {
                    stopCalling();
                    startCalling();
                }
            }
        });
    });

    settingsButton.addEventListener('click', () => settingsModal.style.display = 'flex');
    bingoBoardContainer.addEventListener('click', () => {
        // Just show the modal, content is updated in real-time
        updateExpandedBoard();
        expandedBoardModal.style.display = 'flex';
    });

    // --- Modal Closing Logic ---
    function setupModal(modalId, modalContentClass) {
        const modal = document.getElementById(modalId);
        const modalContent = modal.querySelector(modalContentClass);

        if (!modal || !modalContent) return;

        // Close modal when background is clicked
        modal.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Prevent clicks on modal content from closing the modal
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    setupModal('settingsModal', '.modal-content');
    setupModal('expandedBoardModal', '.modal-content');
    setupModal('installModal', '.modal-content');

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

    nativeInstallButton.addEventListener('click', () => {
        if(deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
                hideInstallPrompt();
            });
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        addToHomeScreenButton.style.display = 'none';
        console.log('PWA was installed');
    });

    closeInstallModalButton.addEventListener('click', hideInstallPrompt);
    
    // --- Initialisation ---
    function init() {
        initializeNumbers();
        createBingoBoard(bingoBoardContainer);
        lastCalledMessage.textContent = 'Welcome! Click the ball to begin.';
        
        // Voices may load asynchronously. We need to handle that.
        populateVoiceList();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    }
    
    init();

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
