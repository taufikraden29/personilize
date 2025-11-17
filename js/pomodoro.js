// Enhanced pomodoro timer functionality
const Pomodoro = {
    timer: null,
    timeLeft: 25 * 60,
    isRunning: false,
    isPaused: false,
    currentMode: 'focus',
    sessionCount: 0,
    totalMinutes: 0,
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
        volume: 0.5
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
        longestStreak: 0
    },

    init() {
        this.loadSettings();
        this.loadStatistics();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateDisplay();
        this.updateStats();
        this.setupAudioContext();
    },

    loadSettings() {
        const savedPomodoro = Storage.get('pomodoro');
        if (savedPomodoro) {
            this.sessionCount = savedPomodoro.sessionCount || 0;
            this.totalMinutes = savedPomodoro.totalMinutes || 0;
            this.settings = { ...this.settings, ...savedPomodoro.settings };
        }

        // Update UI with saved settings
        this.updateSettingsUI();
    },

    loadStatistics() {
        const savedStats = Storage.get('pomodoroStats');
        if (savedStats) {
            this.statistics = { ...this.statistics, ...savedStats };
        }
    },

    updateSettingsUI() {
        document.getElementById('pomodoro-focus-time').value = this.settings.focusTime;
        document.getElementById('pomodoro-short-break').value = this.settings.shortBreakTime;
        document.getElementById('pomodoro-long-break').value = this.settings.longBreakTime;

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
                } else {
                    this.currentMode = 'shortBreak';
                    this.timeLeft = this.settings.shortBreakTime * 60;
                }
                break;
            case 'shortBreak':
            case 'longBreak':
                this.currentMode = 'focus';
                this.timeLeft = this.settings.focusTime * 60;
                break;
        }

        this.updateDisplay();
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
                break;
            case 'shortBreak':
                statusDisplay.textContent = 'Istirahat Pendek';
                progressBar.style.stroke = '#10b981';
                break;
            case 'longBreak':
                statusDisplay.textContent = 'Istirahat Panjang';
                progressBar.style.stroke = '#3b82f6';
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
        ctx.strokeStyle = this.currentMode === 'focus' ? '#6366f1' : '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Update favicon
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = canvas.toDataURL();
        document.getElementsByTagName('head')[0].appendChild(link);
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

        // Remove any references to DOM elements
        // The setupEventListeners function doesn't store references, so no cleanup needed here
        // for dynamically added listeners since they're tied to DOM elements that will be removed
    }
};