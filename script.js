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
    const installModal = document.getElementById('installModal');
    const closeInstallModalButton = document.getElementById('closeInstallModalButton');
    const nativeInstallButton = document.getElementById('native-install-button');

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
    let currentInterval = 5000;
    let voices = [];
    let previousNumber = null;
    let deferredPrompt;

    // --- Theme Switcher Logic (Define First) ---
    const themes = {
        sunny: {
            name: 'Sunny Day',
            styles: {
                'body': 'bg-[#FFFBEB] text-amber-900',
                '#app-container': 'font-nunito',
                '#logo-text': 'text-amber-600 drop-shadow-md',
                '#controls-container': 'bg-white rounded-2xl border-amber-200',
                '#settingsButton': 'text-amber-600 hover:text-amber-700 hover:bg-amber-100',
                '#resetButton': 'text-amber-600 hover:text-amber-700 hover:bg-amber-100',
                '#speed-controls-container': 'bg-amber-100',
                '#speed-fast': 'text-amber-800',
                '#speed-medium': 'text-white bg-amber-500',
                '#speed-slow': 'text-amber-800',
                '#called-ball-display-container': 'bg-white rounded-2xl border-amber-200',
                '#ballDisplay': 'bg-gradient-to-br from-amber-400 to-orange-500 border-white',
                '#ballNumber': 'font-poppins text-white',
                '#lastCalledMessage': 'text-orange-800/90',
                '#nicknameExplanationDisplay': 'font-poppins text-teal-600',
                '#right-panel': 'bg-white rounded-2xl border-amber-200',
                '#addToHomeScreenButton': 'bg-teal-500 hover:bg-teal-600',
                '#expandedBoardModal': 'bg-black/40 backdrop-blur-sm',
                '#expanded-board-content': 'bg-yellow-50 border-amber-300',
                '#expanded-board-title': 'font-poppins text-amber-600',
                '#settingsModal': 'bg-black/40 backdrop-blur-sm',
                '#settings-modal-content': 'bg-yellow-50 border-amber-300',
                '#settings-title': 'font-poppins text-amber-600',
                '#voiceSelector': 'border-amber-300 bg-white text-amber-800',
                '.theme-button[data-theme="sunny"]': 'border-amber-500 ring-2 ring-amber-500',
                '#installModal': 'bg-black/40 backdrop-blur-sm',
                '#install-modal-content': 'bg-yellow-50 border-amber-300 text-amber-900/80',
                '#install-title': 'font-poppins text-amber-800',
                '#native-install-button': 'bg-amber-500 text-white hover:bg-amber-600',
                '#closeInstallModalButton': 'text-gray-500 hover:text-gray-800'
            }
        },
        bubblegum: {
            name: 'Bubblegum Pop',
            styles: {
                'body': 'bg-[#FEF2F2] text-gray-800',
                '#app-container': 'font-open-sans',
                '#logo-text': 'text-pink-500 drop-shadow-md',
                '#controls-container': 'bg-orange-100 rounded-full border-transparent',
                '#settingsButton': 'text-orange-600 hover:text-orange-700 hover:bg-orange-200',
                '#resetButton': 'text-orange-600 hover:text-orange-700 hover:bg-orange-200',
                '#speed-controls-container': 'bg-transparent',
                '#speed-fast': 'text-orange-800 bg-orange-200',
                '#speed-medium': 'text-white bg-orange-400',
                '#speed-slow': 'text-orange-800 bg-orange-200',
                '#called-ball-display-container': 'bg-white/70 backdrop-blur-sm rounded-3xl border-transparent',
                '#ballDisplay': 'bg-white border-orange-300',
                '#ballNumber': 'font-fredoka text-orange-500',
                '#lastCalledMessage': 'text-orange-900/80',
                '#nicknameExplanationDisplay': 'font-fredoka text-pink-500',
                '#right-panel': 'bg-white/70 backdrop-blur-sm rounded-3xl border-transparent',
                '#addToHomeScreenButton': 'bg-pink-500 hover:bg-pink-600',
                '#expandedBoardModal': 'bg-black/50',
                '#expanded-board-content': 'bg-pink-50 rounded-3xl border-transparent',
                '#expanded-board-title': 'font-fredoka text-pink-500',
                '#settingsModal': 'bg-black/50',
                '#settings-modal-content': 'bg-pink-50 rounded-3xl border-transparent',
                '#settings-title': 'font-fredoka text-pink-500',
                '#voiceSelector': 'border-orange-200 bg-white text-gray-800',
                '.theme-button[data-theme="bubblegum"]': 'border-pink-500 ring-2 ring-pink-500',
                '#installModal': 'bg-black/50',
                '#install-modal-content': 'bg-pink-50 rounded-3xl border-transparent text-gray-700',
                '#install-title': 'font-fredoka text-pink-500',
                '#native-install-button': 'bg-pink-500 text-white hover:bg-pink-600',
                '#closeInstallModalButton': 'text-gray-500 hover:text-gray-800'
            }
        },
        cosmic: {
            name: 'Cosmic Bingo',
            styles: {
                'body': 'bg-[#1a1a2e] text-slate-300',
                '#app-container': 'font-roboto',
                '#logo-text': 'text-purple-300 text-glow-purple-subtle',
                '#controls-container': 'bg-gray-900/50 rounded-full border-purple-400/30',
                '#settingsButton': 'text-purple-300 hover:text-purple-200',
                '#resetButton': 'text-purple-300 hover:text-purple-200',
                '#speed-controls-container': 'bg-transparent',
                '#speed-fast': 'text-purple-300 bg-gray-800 hover:bg-gray-700',
                '#speed-medium': 'text-white bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]',
                '#speed-slow': 'text-purple-300 bg-gray-800 hover:bg-gray-700',
                '#called-ball-display-container': 'bg-black/30 backdrop-blur-md rounded-2xl border-purple-500/50',
                '#ballDisplay': 'bg-gray-900 border-purple-400',
                '#ballNumber': 'font-orbitron text-orange-300 text-glow-bright-orange',
                '#lastCalledMessage': 'text-slate-400',
                '#nicknameExplanationDisplay': 'font-orbitron text-purple-300 text-glow-purple-subtle',
                '#right-panel': 'bg-black/30 backdrop-blur-md rounded-2xl border-purple-500/50',
                '.board-ball': 'text-slate-300',
                '#addToHomeScreenButton': 'bg-purple-600 hover:bg-purple-700',
                '#expandedBoardModal': 'bg-black/80 backdrop-blur-sm',
                '#expanded-board-content': 'bg-[#1a1a2e] border-cyan-400/50',
                '#expanded-board-title': 'font-orbitron text-purple-300 text-glow-purple-subtle',
                '#settingsModal': 'bg-black/80 backdrop-blur-sm',
                '#settings-modal-content': 'bg-[#1a1a2e] border-purple-400/50 text-slate-300',
                '#settings-title': 'font-orbitron text-purple-300',
                '#voiceSelector': 'border-purple-600 bg-gray-900 text-slate-200',
                '.theme-button[data-theme="cosmic"]': 'border-purple-400 ring-2 ring-purple-400',
                '#installModal': 'bg-black/80 backdrop-blur-sm',
                '#install-modal-content': 'bg-[#1a1a2e] border-gray-600',
                '#install-modal-body': 'text-slate-300',
                '#install-modal-body strong': 'text-cyan-400',
                '#install-title': 'font-orbitron text-slate-200',
                '#native-install-button': 'bg-purple-600 text-white hover:bg-purple-700',
                '#closeInstallModalButton': 'text-gray-500 hover:text-gray-300'
            }
        }
    };
    let currentTheme = localStorage.getItem('bingoTheme') || 'sunny';

    function applyTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) return;

        const allSelectors = new Set();
        Object.values(themes).forEach(t => Object.keys(t.styles).forEach(s => allSelectors.add(s)));

        allSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                Object.values(themes).forEach(t => {
                    if (t.styles[selector]) el.classList.remove(...t.styles[selector].split(' '));
                });
            });
        });

        Object.entries(theme.styles).forEach(([selector, classes]) => {
            document.querySelectorAll(selector).forEach(el => el.classList.add(...classes.split(' ')));
        });

        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            let color = '#F59E0B'; // Default sunny
            if (themeName === 'bubblegum') color = '#FB923C';
            else if (themeName === 'cosmic') color = '#1a1a2e';
            themeColorMeta.setAttribute('content', color);
        }

        localStorage.setItem('bingoTheme', themeName);
        currentTheme = themeName;
    }

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

        const voiceMap = new Map();
        voices.filter(v => v.lang.startsWith('en-')).forEach(v => {
            if (!voiceMap.has(v.name) || v.voiceURI.includes('Google')) {
                voiceMap.set(v.name, v);
            }
        });
        
        const uniqueVoices = Array.from(voiceMap.values());
        const danielVoice = uniqueVoices.find(v => v.name.includes('Daniel') && v.lang === 'en-GB');
        const preferredVoices = uniqueVoices.filter(v => v !== danielVoice && ['Google', 'Microsoft', 'Natural'].some(kw => v.name.includes(kw)));
        const remainingVoices = uniqueVoices.filter(v => v !== danielVoice && !preferredVoices.includes(v));
        
        const curatedVoices = [danielVoice, ...preferredVoices, ...remainingVoices].filter(Boolean).slice(0, 10);

        curatedVoices.forEach((voice, i) => {
            const originalIndex = voices.findIndex(v => v.voiceURI === voice.voiceURI);
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-voice-index', originalIndex);
            voiceSelector.appendChild(option);
            if (voice === danielVoice) voiceSelector.selectedIndex = i;
        });
    }

    function displayCalledNumber(number) {
        ballNumberDisplay.textContent = number;
        // ballDisplay classes are managed by the theme engine
        nicknameExplanationDisplay.textContent = bingoNicknames[number]?.explanation || "";
        lastCalledMessage.textContent = previousNumber ? `Previous number: ${previousNumber}` : 'First number called!';
        speakNumberWithNickname(number);
        updateBoardBall(number);
        updateExpandedBoard();
    }

    function speakNumberWithNickname(number) {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const nicknameInfo = bingoNicknames[number];
        const textToSpeak = nicknameInfo?.nickname ? `${nicknameInfo.nickname}. Number ${number}.` : `Number ${number}.`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const selectedOption = voiceSelector.selectedOptions[0];
        if (selectedOption) {
            const voiceIndex = selectedOption.getAttribute('data-voice-index');
            if (voiceIndex) utterance.voice = voices[voiceIndex];
        }
        speechSynthesis.speak(utterance);
    }

    function updateBoardBall(number) {
        const boardBall = document.getElementById(`board-ball-${number}`);
        if (boardBall) boardBall.classList.add('called', getBallColorClass(number));
    }

    function createBingoBoard(container) {
        container.innerHTML = '';
        for (let i = 1; i <= 90; i++) {
            const ball = document.createElement('div');
            ball.className = 'board-ball';
            ball.id = `board-ball-${i}`;
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
        
        recent.forEach(number => {
            const ball = document.createElement('div');
            ball.className = `recent-ball called ${getBallColorClass(number)}`;
            const numberSpan = document.createElement('span');
            numberSpan.textContent = number;
            ball.appendChild(numberSpan);
            recentCallsBallsContainer.appendChild(ball);
        });
        document.getElementById('recentCallsContainer').style.display = recent.length > 0 ? 'block' : 'none';
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
            callNextNumber();
            callIntervalId = setInterval(callNextNumber, currentInterval);
        }
    }

    function stopCalling() {
        isPaused = true;
        clearInterval(callIntervalId);
        ballDisplay.classList.remove('in-progress');
        if (numbersPool.length > 0 && calledNumbers.length > 0) {
            lastCalledMessage.textContent = 'Calling paused.';
        }
    }

    function toggleCalling() {
        isPaused ? startCalling() : stopCalling();
    }

    function resetGame() {
        stopCalling();
        initializeNumbers();
        createBingoBoard(bingoBoardContainer);
        updateExpandedBoard();
        ballNumberDisplay.textContent = '--';
        lastCalledMessage.textContent = 'Game reset. Click the ball to begin.';
        nicknameExplanationDisplay.textContent = '';
        applyTheme(currentTheme); // Re-apply theme to reset styles
    }

    // --- PWA & Modal Functions ---
    function isIos() {
        return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) && !window.MSStream;
    }

    function showInstallPrompt() {
        const instructions = {
            'ios-safari': document.getElementById('ios-safari-instructions'),
            'ios-other': document.getElementById('ios-other-instructions'),
            'android': document.getElementById('android-instructions')
        };
        Object.values(instructions).forEach(el => el && (el.style.display = 'none'));

        if (isIos()) {
            const browser = /CriOS|FxiOS/.test(navigator.userAgent) ? 'ios-other' : 'ios-safari';
            if(instructions[browser]) instructions[browser].style.display = 'block';
        } else if (deferredPrompt) {
            if(instructions.android) instructions.android.style.display = 'block';
        }
        installModal.style.display = 'flex';
    }
    
    function setupModal(modalId, contentSelector) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const content = modal.querySelector(contentSelector);
        modal.addEventListener('click', (e) => {
            if (e.target === modal && content && !content.contains(e.target)) {
                modal.style.display = 'none';
            }
        });
        const closeButton = modal.querySelector('.close-button, #closeInstallModalButton');
        if(closeButton) closeButton.addEventListener('click', () => modal.style.display = 'none');
    }

    // --- Initialisation ---
    function init() {
        applyTheme(currentTheme);
        initializeNumbers();
        createBingoBoard(bingoBoardContainer);
        populateVoiceList();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        setupModal('settingsModal', '#settings-modal-content');
        setupModal('expandedBoardModal', '#expanded-board-content');
        setupModal('installModal', '#install-modal-content');

        settingsButton.addEventListener('click', () => settingsModal.style.display = 'flex');
        bingoBoardContainer.addEventListener('click', () => {
            expandedBoardModal.style.display = 'flex';
            updateExpandedBoard();
        });
        ballDisplay.addEventListener('click', toggleCalling);
        resetButton.addEventListener('click', resetGame);
        
        const installTrigger = document.getElementById('addToHomeScreenButton');
        if (installTrigger) {
            installTrigger.addEventListener('click', showInstallPrompt);
        }
        if (nativeInstallButton) {
            nativeInstallButton.addEventListener('click', () => {
                if(deferredPrompt) deferredPrompt.prompt();
            });
        }

        document.querySelectorAll('.theme-button').forEach(button => {
            button.addEventListener('click', (e) => {
                applyTheme(e.currentTarget.dataset.theme);
            });
        });

        speedButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentInterval = parseInt(button.dataset.speed, 10);
                speedButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if (!isPaused) {
                    clearInterval(callIntervalId);
                    callIntervalId = setInterval(callNextNumber, currentInterval);
                }
            });
        });

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (!isIos()) addToHomeScreenButton.style.display = 'block';
        });

        if (isIos() && !navigator.standalone) {
             addToHomeScreenButton.style.display = 'block';
        }
    }

    init();
});
