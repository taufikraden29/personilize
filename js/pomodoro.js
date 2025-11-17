// Enhanced pomodoro timer functionality
const Pomodoro = {
    timer: null,
    timeLeft: 25 * 60,
    isRunning: false,
    isPaused: false,
    currentMode: 'focus',
    sessionCount: 0,
    totalMinutes: 0,
    currentSession: null,
    sessionHistory: [],
    goals: {
        dailyTarget: 4,
        weeklyTarget: 20
    },
    settings: {
        focusTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        soundEnabled: true,
        notificationEnabled: true,
        tickSound: false,
        volume: 0.5,
        darkMode: false,
        breakReminder: false,
        breakReminderInterval: 60 // minutes
    },
    statistics: {
        dailySessions: [],
        weeklySessions: [],
        monthlySessions: [],
        totalSessions: 0,
        totalFocusTime: 0,
        averageSessionLength: 0,
        bestDay: null,
        currentStreak: 0,
        longestStreak: 0,
        sessionsToday: 0
    },
    charts: {
        weeklyChart: null,
        distributionChart: null
    },
    musicPlayer: null,
    currentMusic: null,

    init() {
        this.loadSettings();
        this.loadStatistics();
        this.loadSessionHistory();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateDisplay();
        this.updateStats();
        this.setupAudioContext();
        this.setupCharts();
        this.setupFocusMusic();
        this.setupTabs();
        this.updateTheme();
        this.updateReports();
        this.setupBreakReminder();

        // Set up periodic check for scheduled sessions (every minute)
        setInterval(() => {
            this.checkScheduledSessions();
        }, 60000); // Check every minute

        // Initial check for scheduled sessions
        this.checkScheduledSessions();
    },

    loadSettings() {
        const savedPomodoro = Storage.get('pomodoro');
        if (savedPomodoro) {
            this.sessionCount = savedPomodoro.sessionCount || 0;
            this.totalMinutes = savedPomodoro.totalMinutes || 0;
            this.settings = { ...this.settings, ...savedPomodoro.settings };
            this.goals = { ...this.goals, ...savedPomodoro.goals };
        }

        // Update UI with saved settings
        this.updateSettingsUI();
    },

    loadStatistics() {
        const savedStats = Storage.get('pomodoroStats');
        if (savedStats) {
            this.statistics = { ...this.statistics, ...savedStats };
        }

        // Calculate sessions for today
        this.calculateSessionsToday();
    },

    loadSessionHistory() {
        const savedHistory = Storage.get('pomodoroHistory');
        if (savedHistory) {
            this.sessionHistory = savedHistory;
        }
    },

    updateSettingsUI() {
        document.getElementById('pomodoro-focus-time').value = this.settings.focusTime;
        document.getElementById('pomodoro-short-break').value = this.settings.shortBreakTime;
        document.getElementById('pomodoro-long-break').value = this.settings.longBreakTime;
        document.getElementById('daily-target').value = this.goals.dailyTarget;
        document.getElementById('weekly-target').value = this.goals.weeklyTarget;

        // Update additional settings if elements exist
        const autoStartBreaks = document.getElementById('auto-start-breaks');
        if (autoStartBreaks) autoStartBreaks.checked = this.settings.autoStartBreaks;

        const autoStartPomodoros = document.getElementById('auto-start-pomodoros');
        if (autoStartPomodoros) autoStartPomodoros.checked = this.settings.autoStartPomodoros;

        const soundEnabled = document.getElementById('sound-enabled');
        if (soundEnabled) soundEnabled.checked = this.settings.soundEnabled;

        const notificationEnabled = document.getElementById('notification-enabled');
        if (notificationEnabled) notificationEnabled.checked = this.settings.notificationEnabled;

        const tickSound = document.getElementById('tick-sound');
        if (tickSound) tickSound.checked = this.settings.tickSound;

        const volume = document.getElementById('volume');
        if (volume) volume.value = this.settings.volume;
    },

    setupEventListeners() {
        // Control buttons
        const startBtn = document.getElementById('pomodoro-start');
        const pauseBtn = document.getElementById('pomodoro-pause');
        const resetBtn = document.getElementById('pomodoro-reset');
        const skipBtn = document.getElementById('pomodoro-skip');

        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (skipBtn) skipBtn.addEventListener('click', () => this.skip());

        // Mode selection buttons
        const focusModeBtn = document.getElementById('focus-mode-btn');
        const shortBreakBtn = document.getElementById('short-break-btn');
        const longBreakBtn = document.getElementById('long-break-btn');

        if (focusModeBtn) focusModeBtn.addEventListener('click', () => this.switchToMode('focus'));
        if (shortBreakBtn) shortBreakBtn.addEventListener('click', () => this.switchToMode('shortBreak'));
        if (longBreakBtn) longBreakBtn.addEventListener('click', () => this.switchToMode('longBreak'));

        // Settings inputs
        const focusTimeInput = document.getElementById('pomodoro-focus-time');
        const shortBreakInput = document.getElementById('pomodoro-short-break');
        const longBreakInput = document.getElementById('pomodoro-long-break');

        if (focusTimeInput) {
            focusTimeInput.addEventListener('change', () => {
                this.settings.focusTime = parseInt(focusTimeInput.value);
                if (this.currentMode === 'focus' && !this.isRunning) {
                    this.timeLeft = this.settings.focusTime * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        if (shortBreakInput) {
            shortBreakInput.addEventListener('change', () => {
                this.settings.shortBreakTime = parseInt(shortBreakInput.value);
                if (this.currentMode === 'shortBreak' && !this.isRunning) {
                    this.timeLeft = this.settings.shortBreakTime * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        if (longBreakInput) {
            longBreakInput.addEventListener('change', () => {
                this.settings.longBreakTime = parseInt(longBreakInput.value);
                if (this.currentMode === 'longBreak' && !this.isRunning) {
                    this.timeLeft = this.settings.longBreakTime * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        // Additional settings
        this.setupAdditionalSettings();

        // Preset buttons
        this.setupPresetButtons();

        // Theme toggle
        const themeToggle = document.getElementById('pomodoro-theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Settings accordion
        const settingsHeader = document.getElementById('pomodoro-settings-header');
        const settingsContent = document.getElementById('pomodoro-settings-content');
        if (settingsHeader && settingsContent) {
            settingsHeader.addEventListener('click', () => {
                settingsContent.classList.toggle('hidden');
                const icon = settingsHeader.querySelector('i');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            });
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('export-pomodoro-data');
        const importBtn = document.getElementById('import-pomodoro-data');
        const resetStatsBtn = document.getElementById('reset-pomodoro-stats');

        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
        if (importBtn) importBtn.addEventListener('click', () => this.importData());
        if (resetStatsBtn) resetStatsBtn.addEventListener('click', () => this.resetStatistics());

        // Goal setting inputs
        const dailyTarget = document.getElementById('daily-target');
        const weeklyTarget = document.getElementById('weekly-target');

        if (dailyTarget) {
            dailyTarget.addEventListener('change', () => {
                this.goals.dailyTarget = parseInt(dailyTarget.value);
                this.saveSettings();
            });
        }

        if (weeklyTarget) {
            weeklyTarget.addEventListener('change', () => {
                this.goals.weeklyTarget = parseInt(weeklyTarget.value);
                this.saveSettings();
            });
        }
    },

    setupAdditionalSettings() {
        const autoStartBreaks = document.getElementById('auto-start-breaks');
        const autoStartPomodoros = document.getElementById('auto-start-pomodoros');
        const soundEnabled = document.getElementById('sound-enabled');
        const notificationEnabled = document.getElementById('notification-enabled');
        const tickSound = document.getElementById('tick-sound');
        const volume = document.getElementById('volume');

        if (autoStartBreaks) {
            autoStartBreaks.addEventListener('change', () => {
                this.settings.autoStartBreaks = autoStartBreaks.checked;
                this.saveSettings();
            });
        }

        if (autoStartPomodoros) {
            autoStartPomodoros.addEventListener('change', () => {
                this.settings.autoStartPomodoros = autoStartPomodoros.checked;
                this.saveSettings();
            });
        }

        if (soundEnabled) {
            soundEnabled.addEventListener('change', () => {
                this.settings.soundEnabled = soundEnabled.checked;
                this.saveSettings();
            });
        }

        if (notificationEnabled) {
            notificationEnabled.addEventListener('change', () => {
                this.settings.notificationEnabled = notificationEnabled.checked;
                this.saveSettings();
            });
        }

        if (tickSound) {
            tickSound.addEventListener('change', () => {
                this.settings.tickSound = tickSound.checked;
                this.saveSettings();
            });
        }

        if (volume) {
            volume.addEventListener('input', () => {
                this.settings.volume = parseFloat(volume.value);
                this.saveSettings();
            });
        }
    },

    setupPresetButtons() {
        const preset25 = document.getElementById('preset-25');
        const preset50 = document.getElementById('preset-50');
        const preset90 = document.getElementById('preset-90');
        const preset5min = document.getElementById('preset-5min');
        const preset15min = document.getElementById('preset-15min');

        if (preset25) {
            preset25.addEventListener('click', () => {
                this.settings.focusTime = 25;
                document.getElementById('pomodoro-focus-time').value = 25;
                if (this.currentMode === 'focus' && !this.isRunning) {
                    this.timeLeft = 25 * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        if (preset50) {
            preset50.addEventListener('click', () => {
                this.settings.focusTime = 50;
                document.getElementById('pomodoro-focus-time').value = 50;
                if (this.currentMode === 'focus' && !this.isRunning) {
                    this.timeLeft = 50 * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        if (preset90) {
            preset90.addEventListener('click', () => {
                this.settings.focusTime = 90;
                document.getElementById('pomodoro-focus-time').value = 90;
                if (this.currentMode === 'focus' && !this.isRunning) {
                    this.timeLeft = 90 * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        if (preset5min) {
            preset5min.addEventListener('click', () => {
                this.settings.shortBreakTime = 5;
                document.getElementById('pomodoro-short-break').value = 5;
                if (this.currentMode === 'shortBreak' && !this.isRunning) {
                    this.timeLeft = 5 * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }

        if (preset15min) {
            preset15min.addEventListener('click', () => {
                this.settings.longBreakTime = 15;
                document.getElementById('pomodoro-long-break').value = 15;
                if (this.currentMode === 'longBreak' && !this.isRunning) {
                    this.timeLeft = 15 * 60;
                    this.updateDisplay();
                }
                this.saveSettings();
            });
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Space: Start/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            }

            // R: Reset
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.reset();
            }

            // S: Skip
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.skip();
            }
        });
    },

    setupAudioContext() {
        // Create audio context for sounds
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.tickSoundBuffer = null;
        this.completeSoundBuffer = null;
        this.breakStartSoundBuffer = null;

        // Load sounds
        this.loadSounds();
    },

    loadSounds() {
        // Create tick sound
        this.createTickSound();

        // Create completion sound
        this.createCompletionSound();

        // Create break start sound
        this.createBreakStartSound();
    },

    createTickSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            data[i] = Math.sin(2 * Math.PI * 1000 * i / sampleRate) * 0.1;
        }

        this.tickSoundBuffer = buffer;
    },

    createCompletionSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 5) * 0.3;
        }

        this.completeSoundBuffer = buffer;
    },

    createBreakStartSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 3) * 0.2;
        }

        this.breakStartSoundBuffer = buffer;
    },

    playSound(buffer) {
        if (!this.settings.soundEnabled || !buffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        gainNode.gain.value = this.settings.volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Space: Start/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            }

            // R: Reset
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.reset();
            }

            // S: Skip
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.skip();
            }
        });
    },

    setupAudioContext() {
        // Create audio context for sounds
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.tickSoundBuffer = null;
        this.completeSoundBuffer = null;

        // Load sounds
        this.loadSounds();
    },

    loadSounds() {
        // Create tick sound
        this.createTickSound();

        // Create completion sound
        this.createCompletionSound();
    },

    createTickSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            data[i] = Math.sin(2 * Math.PI * 1000 * i / sampleRate) * 0.1;
        }

        this.tickSoundBuffer = buffer;
    },

    createCompletionSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 5) * 0.3;
        }

        this.completeSoundBuffer = buffer;
    },

    playSound(buffer) {
        if (!this.settings.soundEnabled || !buffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        gainNode.gain.value = this.settings.volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();
    },

    start() {
        if (this.isRunning && !this.isPaused) return;

        this.isRunning = true;
        this.isPaused = false;

        // Add active class to timer
        const timerContainer = document.querySelector('.relative');
        if (timerContainer) {
            timerContainer.classList.add('pomodoro-active');
        }

        // Start timer
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            // Play tick sound if enabled
            if (this.settings.tickSound && this.timeLeft % 60 === 0 && this.timeLeft > 0) {
                this.playSound(this.tickSoundBuffer);
            }

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);

        // Update button states
        this.updateButtonStates();

        // Track session start
        this.trackSessionStart();
    },

    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        clearInterval(this.timer);

        // Remove active class
        const timerContainer = document.querySelector('.relative');
        if (timerContainer) {
            timerContainer.classList.remove('pomodoro-active');
        }

        // Update button states
        this.updateButtonStates();

        // Track session pause
        this.trackSessionPause();
    },

    reset() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        // Reset time based on current mode
        switch (this.currentMode) {
            case 'focus':
                this.timeLeft = this.settings.focusTime * 60;
                break;
            case 'shortBreak':
                this.timeLeft = this.settings.shortBreakTime * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.settings.longBreakTime * 60;
                break;
        }

        this.updateDisplay();
        this.updateButtonStates();

        // Remove active class
        const timerContainer = document.querySelector('.relative');
        if (timerContainer) {
            timerContainer.classList.remove('pomodoro-active');
        }
    },

    skip() {
        if (!this.isRunning) return;

        this.completeSession();
    },

    completeSession() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        // Play completion sound
        this.playSound(this.completeSoundBuffer);

        // Show notification
        this.showCompletionNotification();

        // Update statistics
        if (this.currentMode === 'focus') {
            this.sessionCount++;
            this.totalMinutes += this.settings.focusTime;
            this.updateStatistics();
        }

        // Add to session history
        this.updateSessionHistory();

        // Save stats
        this.saveStats();
        this.saveSettings();

        // Update display
        this.updateStats();
        this.updateButtonStates();

        // Remove active class
        const timerContainer = document.querySelector('.relative');
        if (timerContainer) {
            timerContainer.classList.remove('pomodoro-active');
        }

        // Check achievements
        this.checkAchievements();

        // Switch to next mode
        this.switchMode();

        // Auto-start next session if enabled
        this.autoStartNextSession();
    },

    switchMode() {
        switch (this.currentMode) {
            case 'focus':
                if (this.sessionCount % this.settings.longBreakInterval === 0) {
                    this.currentMode = 'longBreak';
                    this.timeLeft = this.settings.longBreakTime * 60;
                    // Play break start sound
                    this.playSound(this.breakStartSoundBuffer);
                } else {
                    this.currentMode = 'shortBreak';
                    this.timeLeft = this.settings.shortBreakTime * 60;
                    // Play break start sound
                    this.playSound(this.breakStartSoundBuffer);
                }
                break;
            case 'shortBreak':
            case 'longBreak':
                this.currentMode = 'focus';
                this.timeLeft = this.settings.focusTime * 60;
                // Play focus start sound
                this.playSound(this.breakStartSoundBuffer);
                break;
        }

        this.updateDisplay();
        this.updateModeButtons();
    },

    autoStartNextSession() {
        const shouldAutoStart =
            (this.currentMode === 'shortBreak' || this.currentMode === 'longBreak')
                ? this.settings.autoStartPomodoros
                : this.settings.autoStartBreaks;

        if (shouldAutoStart) {
            setTimeout(() => {
                this.start();
            }, 3000); // Wait 3 seconds before auto-starting
        }
    },

    updateDisplay() {
        const timerDisplay = document.getElementById('pomodoro-timer');
        const statusDisplay = document.getElementById('pomodoro-status');
        const progressBar = document.getElementById('pomodoro-progress');
        const modeIndicator = document.getElementById('pomodoro-mode-indicator');

        if (!timerDisplay || !statusDisplay || !progressBar) return;

        // Format time
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update status
        switch (this.currentMode) {
            case 'focus':
                statusDisplay.textContent = 'Fokus';
                progressBar.style.stroke = '#6366f1';
                if (modeIndicator) {
                    modeIndicator.className = 'w-4 h-4 rounded-full bg-indigo-500 mt-2 animate-pulse';
                }
                break;
            case 'shortBreak':
                statusDisplay.textContent = 'Istirahat Pendek';
                progressBar.style.stroke = '#10b981';
                if (modeIndicator) {
                    modeIndicator.className = 'w-4 h-4 rounded-full bg-green-500 mt-2 animate-pulse';
                }
                break;
            case 'longBreak':
                statusDisplay.textContent = 'Istirahat Panjang';
                progressBar.style.stroke = '#3b82f6';
                if (modeIndicator) {
                    modeIndicator.className = 'w-4 h-4 rounded-full bg-blue-500 mt-2 animate-pulse';
                }
                break;
        }

        // Update progress bar
        let totalTime;
        switch (this.currentMode) {
            case 'focus':
                totalTime = this.settings.focusTime * 60;
                break;
            case 'shortBreak':
                totalTime = this.settings.shortBreakTime * 60;
                break;
            case 'longBreak':
                totalTime = this.settings.longBreakTime * 60;
                break;
        }

        const progress = (totalTime - this.timeLeft) / totalTime;
        const circumference = 2 * Math.PI * 120;
        const offset = circumference - (progress * circumference);
        progressBar.style.strokeDashoffset = offset;

        // Update page title
        this.updatePageTitle(minutes, seconds);

        // Update favicon
        this.updateFavicon(progress);
    },

    updateButtonStates() {
        const startBtn = document.getElementById('pomodoro-start');
        const pauseBtn = document.getElementById('pomodoro-pause');
        const resetBtn = document.getElementById('pomodoro-reset');
        const skipBtn = document.getElementById('pomodoro-skip');

        if (startBtn) {
            startBtn.disabled = this.isRunning && !this.isPaused;
            startBtn.textContent = this.isPaused ? 'Lanjutkan' : 'Mulai';
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isRunning || this.isPaused;
        }

        if (resetBtn) {
            resetBtn.disabled = !this.isRunning && this.timeLeft === this.settings.focusTime * 60;
        }

        if (skipBtn) {
            skipBtn.disabled = !this.isRunning;
        }
    },

    updatePageTitle(minutes, seconds) {
        const status = this.currentMode === 'focus' ? 'Fokus' : 'Istirahat';
        document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - ${status} | My Personal App`;
    },

    updateFavicon(progress) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Draw progress circle
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#e5e7eb';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(16, 16, 14, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress));
        ctx.strokeStyle = this.getModeColor();
        ctx.lineWidth = 3;
        ctx.stroke();

        // Update favicon
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = canvas.toDataURL();
        document.getElementsByTagName('head')[0].appendChild(link);
    },

    getModeColor() {
        switch (this.currentMode) {
            case 'focus':
                return '#6366f1';
            case 'shortBreak':
                return '#10b981';
            case 'longBreak':
                return '#3b82f6';
            default:
                return '#6366f1';
        }
    },

    switchToMode(mode) {
        this.reset();
        this.currentMode = mode;

        switch (mode) {
            case 'focus':
                this.timeLeft = this.settings.focusTime * 60;
                break;
            case 'shortBreak':
                this.timeLeft = this.settings.shortBreakTime * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.settings.longBreakTime * 60;
                break;
        }

        this.updateDisplay();
        this.updateButtonStates();

        // Update mode buttons
        this.updateModeButtons();
    },

    updateModeButtons() {
        const focusBtn = document.getElementById('focus-mode-btn');
        const shortBreakBtn = document.getElementById('short-break-btn');
        const longBreakBtn = document.getElementById('long-break-btn');

        if (focusBtn) {
            focusBtn.classList.toggle('bg-indigo-600', this.currentMode === 'focus');
            focusBtn.classList.toggle('text-white', this.currentMode === 'focus');
            focusBtn.classList.toggle('hover:bg-gray-100', this.currentMode !== 'focus');
        }

        if (shortBreakBtn) {
            shortBreakBtn.classList.toggle('bg-indigo-600', this.currentMode === 'shortBreak');
            shortBreakBtn.classList.toggle('text-white', this.currentMode === 'shortBreak');
            shortBreakBtn.classList.toggle('hover:bg-gray-100', this.currentMode !== 'shortBreak');
        }

        if (longBreakBtn) {
            longBreakBtn.classList.toggle('bg-indigo-600', this.currentMode === 'longBreak');
            longBreakBtn.classList.toggle('text-white', this.currentMode === 'longBreak');
            longBreakBtn.classList.toggle('hover:bg-gray-100', this.currentMode !== 'longBreak');
        }
    },

    calculateSessionsToday() {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.statistics.dailySessions.filter(s => s.date === today);
        this.statistics.sessionsToday = todaySessions.length;

        // Update UI
        const sessionsTodayDisplay = document.getElementById('pomodoro-sessions-today');
        if (sessionsTodayDisplay) {
            sessionsTodayDisplay.textContent = this.statistics.sessionsToday;
        }
    },

    updateStats() {
        const sessionsDisplay = document.getElementById('pomodoro-sessions');
        const totalTimeDisplay = document.getElementById('pomodoro-total-time');
        const sessionsTodayDisplay = document.getElementById('pomodoro-sessions-today');
        const streakDisplay = document.getElementById('pomodoro-streak');

        if (sessionsDisplay) {
            sessionsDisplay.textContent = this.sessionCount;
        }

        if (totalTimeDisplay) {
            const hours = Math.floor(this.totalMinutes / 60);
            const minutes = this.totalMinutes % 60;

            if (hours > 0) {
                totalTimeDisplay.textContent = `${hours}j ${minutes}m`;
            } else {
                totalTimeDisplay.textContent = `${minutes}m`;
            }
        }

        if (sessionsTodayDisplay) {
            sessionsTodayDisplay.textContent = this.statistics.sessionsToday;
        }

        if (streakDisplay) {
            streakDisplay.textContent = this.statistics.currentStreak;
        }
    },

    updateTheme() {
        const themeToggle = document.getElementById('pomodoro-theme-toggle');
        if (themeToggle) {
            if (this.settings.darkMode) {
                themeToggle.innerHTML = '<i class="fas fa-sun mr-1" aria-hidden="true"></i> Terang';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon mr-1" aria-hidden="true"></i> Gelap';
            }
        }
    },

    toggleTheme() {
        this.settings.darkMode = !this.settings.darkMode;
        this.updateTheme();
        this.saveSettings();

        // Apply theme to the page
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    setupCharts() {
        const weeklyCtx = document.getElementById('pomodoro-weekly-chart');
        const distributionCtx = document.getElementById('pomodoro-distribution-chart');

        // Destroy existing charts if they exist
        if (this.charts.weeklyChart) {
            this.charts.weeklyChart.destroy();
        }

        if (this.charts.distributionChart) {
            this.charts.distributionChart.destroy();
        }

        if (weeklyCtx) {
            this.charts.weeklyChart = new Chart(weeklyCtx, {
                type: 'line',
                data: {
                    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                    datasets: [{
                        label: 'Sesi Fokus',
                        data: [2, 3, 1, 4, 3, 0, 2],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        if (distributionCtx) {
            this.charts.distributionChart = new Chart(distributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Fokus', 'Istirahat Pendek', 'Istirahat Panjang'],
                    datasets: [{
                        data: [60, 30, 10],
                        backgroundColor: [
                            '#6366f1',
                            '#10b981',
                            '#3b82f6'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    },

    updateCharts() {
        if (this.charts.weeklyChart) {
            // Calculate weekly data
            const today = new Date();
            const weekData = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const daySessions = this.statistics.dailySessions.filter(s => s.date === dateStr);
                weekData.unshift(daySessions.length);
            }

            this.charts.weeklyChart.data.datasets[0].data = weekData;
            this.charts.weeklyChart.update();
        }

        if (this.charts.distributionChart) {
            // Calculate distribution data
            let focusCount = 0, shortBreakCount = 0, longBreakCount = 0;

            this.sessionHistory.forEach(session => {
                if (session.mode === 'focus') focusCount++;
                if (session.mode === 'shortBreak') shortBreakCount++;
                if (session.mode === 'longBreak') longBreakCount++;
            });

            this.charts.distributionChart.data.datasets[0].data = [focusCount, shortBreakCount, longBreakCount];
            this.charts.distributionChart.update();
        }
    },

    setupFocusMusic() {
        this.musicPlayer = document.getElementById('focus-music-player');

        // Setup music buttons
        const musicButtons = document.querySelectorAll('[data-music]');
        musicButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playFocusMusic(btn.dataset.music);
            });
        });

        // Setup volume control
        const volumeSlider = document.getElementById('music-volume');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                if (this.musicPlayer) {
                    this.musicPlayer.volume = e.target.value;
                }
            });
        }
    },

    playFocusMusic(musicType) {
        // In a real implementation, this would load actual music
        // For now, we'll just simulate it
        if (this.currentMusic === musicType) {
            // Toggle pause/play
            if (!this.musicPlayer.paused) {
                this.musicPlayer.pause();
                this.currentMusic = null;
            } else {
                this.musicPlayer.play();
                this.currentMusic = musicType;
            }
        } else {
            // Play new music
            this.currentMusic = musicType;
            // In a real implementation, set the src to the actual music file
            this.musicPlayer.play();
        }
    },

    setupTabs() {
        const historyTab = document.getElementById('history-tab');
        const analyticsTab = document.getElementById('analytics-tab');
        const reportsTab = document.getElementById('reports-tab');

        const historyContent = document.getElementById('history-content');
        const analyticsContent = document.getElementById('analytics-content');
        const reportsContent = document.getElementById('reports-content');

        if (historyTab) {
            historyTab.addEventListener('click', () => {
                this.showTab('history');
            });
        }

        if (analyticsTab) {
            analyticsTab.addEventListener('click', () => {
                this.showTab('analytics');
            });
        }

        if (reportsTab) {
            reportsTab.addEventListener('click', () => {
                this.showTab('reports');
            });
        }
    },

    showTab(tabName) {
        const historyContent = document.getElementById('history-content');
        const analyticsContent = document.getElementById('analytics-content');
        const reportsContent = document.getElementById('reports-content');

        // Hide all content
        if (historyContent) historyContent.classList.add('hidden');
        if (analyticsContent) analyticsContent.classList.add('hidden');
        if (reportsContent) reportsContent.classList.add('hidden');

        // Show selected content
        if (tabName === 'history' && historyContent) {
            historyContent.classList.remove('hidden');
        } else if (tabName === 'analytics' && analyticsContent) {
            analyticsContent.classList.remove('hidden');
        } else if (tabName === 'reports' && reportsContent) {
            reportsContent.classList.remove('hidden');
        }

        // Update active tab buttons
        const tabs = ['history', 'analytics', 'reports'];
        tabs.forEach(tab => {
            const tabBtn = document.getElementById(`${tab}-tab`);
            if (tabBtn) {
                if (tab === tabName) {
                    tabBtn.classList.add('bg-gray-100');
                } else {
                    tabBtn.classList.remove('bg-gray-100');
                }
            }
        });
    },

    updateSessionHistory() {
        if (this.currentSession) {
            // Add completed session to history
            this.sessionHistory.push({
                ...this.currentSession,
                completed: true,
                endTime: new Date().toISOString(),
                actualDuration: this.getTimeForCurrentMode()
            });

            // Keep only last 50 sessions
            if (this.sessionHistory.length > 50) {
                this.sessionHistory = this.sessionHistory.slice(-50);
            }

            // Update UI
            this.renderSessionHistory();

            // Save to storage
            this.saveSessionHistory();
        }
    },

    renderSessionHistory() {
        const historyList = document.getElementById('session-history-list');
        if (!historyList) return;

        historyList.innerHTML = '';

        if (this.sessionHistory.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada riwayat sesi</p>';
            return;
        }

        // Show last 10 sessions
        const recentSessions = this.sessionHistory.slice(-10).reverse();

        recentSessions.forEach((session, index) => {
            const sessionEl = document.createElement('div');
            sessionEl.className = 'p-3 border-b border-gray-200 flex justify-between items-center';

            const startTime = new Date(session.startTime).toLocaleTimeString();
            const duration = session.duration;
            const mode = session.mode === 'focus' ? 'Fokus' : session.mode === 'shortBreak' ? 'Istirahat Pendek' : 'Istirahat Panjang';

            sessionEl.innerHTML = `
                <div>
                    <div class="font-medium">${mode}</div>
                    <div class="text-sm text-gray-600">${startTime} - ${duration} menit</div>
                </div>
                <div class="text-sm text-gray-500">${new Date(session.startTime).toLocaleDateString()}</div>
            `;

            historyList.appendChild(sessionEl);
        });
    },

    saveSessionHistory() {
        Storage.set('pomodoroHistory', this.sessionHistory);
    },

    generateWeeklyReport() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start from Sunday

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End on Saturday

        // Calculate weekly stats
        let weeklyFocusSessions = 0;
        let weeklyBreakSessions = 0;
        let weeklyFocusTime = 0;

        this.statistics.dailySessions.forEach(session => {
            const sessionDate = new Date(session.date);
            if (sessionDate >= weekStart && sessionDate <= weekEnd) {
                weeklyFocusSessions += session.sessions;
                weeklyFocusTime += session.focusTime;
            }
        });

        // Calculate break sessions from history
        this.sessionHistory.forEach(session => {
            const sessionDate = new Date(session.startTime);
            if (sessionDate >= weekStart && sessionDate <= weekEnd) {
                if (session.mode !== 'focus') {
                    weeklyBreakSessions++;
                }
            }
        });

        // Generate report HTML
        const reportHTML = `
            <div class="mb-4">
                <h5 class="font-semibold text-gray-700 mb-2">Periode: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}</h5>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <p class="text-sm text-blue-700">Sesi Fokus</p>
                        <p class="text-xl font-bold text-blue-800">${weeklyFocusSessions}</p>
                    </div>
                    <div class="bg-green-50 p-3 rounded-lg">
                        <p class="text-sm text-green-700">Sesi Istirahat</p>
                        <p class="text-xl font-bold text-green-800">${weeklyBreakSessions}</p>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg">
                        <p class="text-sm text-purple-700">Waktu Fokus</p>
                        <p class="text-xl font-bold text-purple-800">${weeklyFocusTime}m</p>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded-lg">
                        <p class="text-sm text-yellow-700">Rata-rata Harian</p>
                        <p class="text-xl font-bold text-yellow-800">${Math.round(weeklyFocusSessions / 7)} sesi</p>
                    </div>
                </div>
            </div>
        `;

        // Update the weekly report display
        const weeklyReportEl = document.getElementById('weekly-report');
        if (weeklyReportEl) {
            weeklyReportEl.innerHTML = reportHTML;
        }
    },

    generateMonthlyReport() {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month

        // Calculate monthly stats
        let monthlyFocusSessions = 0;
        let monthlyBreakSessions = 0;
        let monthlyFocusTime = 0;

        this.statistics.dailySessions.forEach(session => {
            const sessionDate = new Date(session.date);
            if (sessionDate >= monthStart && sessionDate <= monthEnd) {
                monthlyFocusSessions += session.sessions;
                monthlyFocusTime += session.focusTime;
            }
        });

        // Calculate break sessions from history
        this.sessionHistory.forEach(session => {
            const sessionDate = new Date(session.startTime);
            if (sessionDate >= monthStart && sessionDate <= monthEnd) {
                if (session.mode !== 'focus') {
                    monthlyBreakSessions++;
                }
            }
        });

        // Generate report HTML
        const reportHTML = `
            <div class="mb-4">
                <h5 class="font-semibold text-gray-700 mb-2">Periode: ${monthStart.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}</h5>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <p class="text-sm text-blue-700">Sesi Fokus</p>
                        <p class="text-xl font-bold text-blue-800">${monthlyFocusSessions}</p>
                    </div>
                    <div class="bg-green-50 p-3 rounded-lg">
                        <p class="text-sm text-green-700">Sesi Istirahat</p>
                        <p class="text-xl font-bold text-green-800">${monthlyBreakSessions}</p>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg">
                        <p class="text-sm text-purple-700">Waktu Fokus</p>
                        <p class="text-xl font-bold text-purple-800">${monthlyFocusTime}m</p>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded-lg">
                        <p class="text-sm text-yellow-700">Rata-rata Harian</p>
                        <p class="text-xl font-bold text-yellow-800">${Math.round(monthlyFocusSessions / monthEnd.getDate())} sesi</p>
                    </div>
                </div>
            </div>
        `;

        // Update the monthly report display
        const monthlyReportEl = document.getElementById('monthly-report');
        if (monthlyReportEl) {
            monthlyReportEl.innerHTML = reportHTML;
        }
    },

    exportData() {
        const data = {
            settings: this.settings,
            statistics: this.statistics,
            sessionHistory: this.sessionHistory,
            goals: this.goals,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `pomodoro-data-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    updateReports() {
        this.generateWeeklyReport();
        this.generateMonthlyReport();
    },

    setupBreakReminder() {
        if (this.settings.breakReminder) {
            // Set up a timer to remind the user to take a break after specified interval
            this.breakReminderInterval = setInterval(() => {
                if (this.currentMode === 'focus' && !this.isPaused) {
                    // Check if enough time has passed since last break
                    if (this.timeLeft <= (this.settings.focusTime * 60) - (this.settings.breakReminderInterval * 60)) {
                        this.showBreakReminder();
                    }
                }
            }, 60000); // Check every minute
        }
    },

    showBreakReminder() {
        if (this.settings.breakReminder) {
            const message = `Waktunya istirahat sejenak! Sudah ${this.settings.breakReminderInterval} menit fokus.`;

            // Show in-app notification
            if (typeof App !== 'undefined' && App.showNotification) {
                App.showNotification(message, 'info');
            }

            // Show browser notification if enabled and permitted
            if (this.settings.notificationEnabled && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification('Pengingat Istirahat', {
                        body: message,
                        icon: '/favicon.ico'
                    });
                }
            }
        }
    },

    schedulePomodoroSession(date, time, duration = 25) {
        // Create a scheduled Pomodoro session
        const scheduledSession = {
            id: Date.now().toString(),
            date: date,
            time: time,
            duration: duration,
            type: 'focus',
            title: `Sesi Pomodoro ${duration} menit`,
            createdAt: new Date().toISOString()
        };

        // Save to storage
        let scheduledSessions = Storage.get('pomodoroScheduled') || [];
        scheduledSessions.push(scheduledSession);
        Storage.set('pomodoroScheduled', scheduledSessions);

        // Show notification
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(`Sesi Pomodoro telah dijadwalkan pada ${date} ${time}`, 'success');
        }

        return scheduledSession;
    },

    getScheduledSessions(date = null) {
        let scheduledSessions = Storage.get('pomodoroScheduled') || [];

        if (date) {
            // Filter by date
            scheduledSessions = scheduledSessions.filter(session =>
                session.date === date
            );
        }

        return scheduledSessions;
    },

    removeScheduledSession(sessionId) {
        let scheduledSessions = Storage.get('pomodoroScheduled') || [];
        scheduledSessions = scheduledSessions.filter(session => session.id !== sessionId);
        Storage.set('pomodoroScheduled', scheduledSessions);
    },

    checkScheduledSessions() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

        const scheduledSessions = this.getScheduledSessions(today);

        scheduledSessions.forEach(session => {
            if (session.time <= currentTime && !session.executed) {
                // Start the scheduled session
                this.startScheduledSession(session);

                // Mark as executed
                this.markSessionAsExecuted(session.id);
            }
        });
    },

    startScheduledSession(session) {
        // Set the timer to the scheduled session duration
        this.settings.focusTime = session.duration;
        document.getElementById('pomodoro-focus-time').value = session.duration;

        // Switch to focus mode
        this.switchToMode('focus');

        // Start the timer
        this.start();
    },

    markSessionAsExecuted(sessionId) {
        let scheduledSessions = Storage.get('pomodoroScheduled') || [];
        scheduledSessions = scheduledSessions.map(session => {
            if (session.id === sessionId) {
                return { ...session, executed: true, executedAt: new Date().toISOString() };
            }
            return session;
        });
        Storage.set('pomodoroScheduled', scheduledSessions);
    },

    importData() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                    }

                    if (data.statistics) {
                        this.statistics = { ...this.statistics, ...data.statistics };
                    }

                    if (data.sessionHistory) {
                        this.sessionHistory = data.sessionHistory;
                    }

                    if (data.goals) {
                        this.goals = { ...this.goals, ...data.goals };
                    }

                    this.updateSettingsUI();
                    this.updateStats();
                    this.updateSessionHistory();
                    this.calculateSessionsToday();
                    this.updateTheme();
                    this.saveSettings();
                    this.saveStats();
                    this.saveSessionHistory();

                    if (typeof App !== 'undefined' && App.showNotification) {
                        App.showNotification('Data Pomodoro berhasil diimpor', 'success');
                    }
                } catch (error) {
                    if (typeof App !== 'undefined' && App.showNotification) {
                        App.showNotification('Gagal mengimpor data Pomodoro', 'error');
                    }
                }
            };

            reader.readAsText(file);
        };

        fileInput.click();
    },

    resetStatistics() {
        if (confirm('Apakah Anda yakin ingin mereset semua statistik Pomodoro?')) {
            this.statistics = {
                dailySessions: [],
                weeklySessions: [],
                monthlySessions: [],
                totalSessions: 0,
                totalFocusTime: 0,
                averageSessionLength: 0,
                bestDay: null,
                currentStreak: 0,
                longestStreak: 0,
                sessionsToday: 0
            };

            this.sessionHistory = [];
            this.sessionCount = 0;
            this.totalMinutes = 0;

            this.saveStats();
            this.saveSessionHistory();

            this.updateStats();
            this.renderSessionHistory();

            if (typeof App !== 'undefined' && App.showNotification) {
                App.showNotification('Statistik Pomodoro telah direset', 'success');
            }
        }
    },

    updateStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const todayStats = this.statistics.dailySessions.find(s => s.date === today);

        if (todayStats) {
            todayStats.sessions++;
            todayStats.focusTime += this.settings.focusTime;
        } else {
            this.statistics.dailySessions.push({
                date: today,
                sessions: 1,
                focusTime: this.settings.focusTime
            });
        }

        // Update weekly and monthly stats
        this.updateWeeklyStats();
        this.updateMonthlyStats();

        // Update overall stats
        this.statistics.totalSessions++;
        this.statistics.totalFocusTime += this.settings.focusTime;
        this.statistics.averageSessionLength = this.settings.focusTime;

        // Update streak
        this.updateStreak();

        // Find best day
        this.findBestDay();

        // Update sessions today
        this.calculateSessionsToday();

        // Update charts
        this.updateCharts();
    },

    updateWeeklyStats() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const weekSessions = this.statistics.dailySessions.filter(s =>
            new Date(s.date) >= weekStart
        );

        this.statistics.weeklySessions = weekSessions;
    },

    updateMonthlyStats() {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const monthSessions = this.statistics.dailySessions.filter(s =>
            new Date(s.date) >= monthStart
        );

        this.statistics.monthlySessions = monthSessions;
    },

    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const todayIndex = this.statistics.dailySessions.findIndex(s => s.date === today);

        if (todayIndex > 0) {
            const yesterday = this.statistics.dailySessions[todayIndex - 1];
            if (yesterday.sessions > 0) {
                this.statistics.currentStreak++;
            } else {
                this.statistics.currentStreak = 1;
            }
        } else {
            this.statistics.currentStreak = 1;
        }

        if (this.statistics.currentStreak > this.statistics.longestStreak) {
            this.statistics.longestStreak = this.statistics.currentStreak;
        }
    },

    findBestDay() {
        if (this.statistics.dailySessions.length === 0) return;

        const bestDay = this.statistics.dailySessions.reduce((best, current) =>
            current.sessions > best.sessions ? current : best
        );

        this.statistics.bestDay = bestDay;
    },

    showCompletionNotification() {
        let message = '';
        switch (this.currentMode) {
            case 'focus':
                message = 'Sesi fokus selesai! Waktu untuk istirahat.';
                break;
            case 'shortBreak':
                message = 'Istirahat pendek selesai! Waktu untuk fokus kembali.';
                break;
            case 'longBreak':
                message = 'Istirahat panjang selesai! Waktu untuk fokus kembali.';
                break;
        }

        // Show in-app notification
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, 'success');
        }

        // Show browser notification if enabled and permitted
        if (this.settings.notificationEnabled && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Pomodoro Timer', {
                    body: message,
                    icon: '/favicon.ico'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    },

    updateStats() {
        const sessionsDisplay = document.getElementById('pomodoro-sessions');
        const totalTimeDisplay = document.getElementById('pomodoro-total-time');

        if (sessionsDisplay) {
            sessionsDisplay.textContent = this.sessionCount;
        }

        if (totalTimeDisplay) {
            const hours = Math.floor(this.totalMinutes / 60);
            const minutes = this.totalMinutes % 60;

            if (hours > 0) {
                totalTimeDisplay.textContent = `${hours}j ${minutes}m`;
            } else {
                totalTimeDisplay.textContent = `${minutes}m`;
            }
        }
    },

    saveSettings() {
        const pomodoroData = Storage.get('pomodoro') || {};
        pomodoroData.settings = this.settings;
        pomodoroData.goals = this.goals;
        Storage.set('pomodoro', pomodoroData);
    },

    saveStats() {
        Storage.set('pomodoroStats', this.statistics);
    },

    checkAchievements() {
        const data = {
            totalSessions: this.sessionCount
        };

        Achievements.checkAchievements(data);
    },

    trackSessionStart() {
        const session = {
            startTime: new Date().toISOString(),
            mode: this.currentMode,
            duration: this.getTimeForCurrentMode()
        };

        // Save current session
        this.currentSession = session;
    },

    trackSessionPause() {
        if (this.currentSession) {
            this.currentSession.pausedAt = new Date().toISOString();
            this.currentSession.actualDuration = Math.floor(
                (new Date() - new Date(this.currentSession.startTime)) / 60000
            );
        }
    },

    getTimeForCurrentMode() {
        switch (this.currentMode) {
            case 'focus':
                return this.settings.focusTime;
            case 'shortBreak':
                return this.settings.shortBreakTime;
            case 'longBreak':
                return this.settings.longBreakTime;
            default:
                return 0;
        }
    },

    getStatistics() {
        return this.statistics;
    },

    exportStatistics() {
        const data = {
            statistics: this.statistics,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `pomodoro-statistics-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    resetStatistics() {
        if (confirm('Apakah Anda yakin ingin mereset semua statistik Pomodoro?')) {
            this.statistics = {
                dailySessions: [],
                weeklySessions: [],
                monthlySessions: [],
                totalSessions: 0,
                totalFocusTime: 0,
                averageSessionLength: 0,
                bestDay: null,
                currentStreak: 0,
                longestStreak: 0
            };

            this.saveStats();

            if (typeof App !== 'undefined' && App.showNotification) {
                App.showNotification('Statistik Pomodoro telah direset', 'success');
            }
        }
    },

    // Clean up resources to prevent memory leaks
    destroy() {
        // Clear the active timer interval
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Destroy chart instances to prevent memory leaks
        if (this.charts.weeklyChart) {
            this.charts.weeklyChart.destroy();
            this.charts.weeklyChart = null;
        }

        if (this.charts.distributionChart) {
            this.charts.distributionChart.destroy();
            this.charts.distributionChart = null;
        }

        // Remove any references to DOM elements
        // The setupEventListeners function doesn't store references, so no cleanup needed here
        // for dynamically added listeners since they're tied to DOM elements that will be removed
    }
};