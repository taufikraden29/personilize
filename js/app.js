
const App = {
    currentTab: 'dashboard',
    settings: {
        userName: '',
        theme: 'light',
        notifications: false
    },

    // Initialize application
    init() {
        // Load settings
        this.loadSettings();

        // Initialize all modules
        Todo.init();
        Notes.init();
        Pomodoro.init();
        Habits.init();
        Achievements.init();
        // Dashboard will be initialized when the tab is shown

        // Initialize new modules
        Calendar.init();
        Journal.init();
        Goals.init();
        Analytics.init();
        Weather.init();
        Quotes.init();
        QuickCapture.init();

        // Setup event listeners
        this.setupEventListeners();

        // Set initial tab
        this.switchTab('dashboard');

        // Update user name
        this.updateUserName();

        // Check for consecutive days usage
        this.checkConsecutiveDays();
    },

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = Storage.get('settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };

            // Apply theme
            if (this.settings.theme === 'dark') {
                document.body.classList.add('dark-theme');
            }
        } else {
            Storage.set('settings', this.settings);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Settings modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsBtn = document.getElementById('close-settings');
        const saveSettingsBtn = document.getElementById('save-settings');

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('hidden');

                // Populate settings form
                document.getElementById('user-name-input').value = this.settings.userName;
                document.getElementById('theme-select').value = this.settings.theme;
                document.getElementById('notification-toggle').checked = this.settings.notifications;
            });
        }

        if (closeSettingsBtn && settingsModal) {
            closeSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('hidden');
            });
        }

        if (saveSettingsBtn && settingsModal) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
                settingsModal.classList.add('hidden');
            });
        }

        // Export data button
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                Storage.exportData();
                this.showNotification('Data berhasil diekspor');
            });
        }

        // Clear data button
        const clearDataBtn = document.getElementById('clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
                    Storage.clear();
                    location.reload();
                }
            });
        }

        // Theme select
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', () => {
                if (themeSelect.value === 'dark') {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
            });
        }
    },

    // Switch tab
    switchTab(tabName) {
        // Clean up previous tab if necessary
        if (this.currentTab !== tabName) {
            if (this.currentTab === 'dashboard' && typeof Dashboard.destroy === 'function') {
                Dashboard.destroy();
            } else if (this.currentTab === 'analytics' && typeof Analytics.destroy === 'function') {
                Analytics.destroy();
            } else if (this.currentTab === 'todo' && typeof Todo.destroy === 'function') {
                Todo.destroy();
            } else if (this.currentTab === 'notes' && typeof Notes.destroy === 'function') {
                Notes.destroy();
            } else if (this.currentTab === 'journal' && typeof Journal.destroy === 'function') {
                Journal.destroy();
            } else if (this.currentTab === 'goals' && typeof Goals.destroy === 'function') {
                Goals.destroy();
            } else if (this.currentTab === 'pomodoro' && typeof Pomodoro.destroy === 'function') {
                Pomodoro.destroy();
            } else if (this.currentTab === 'habits' && typeof Habits.destroy === 'function') {
                Habits.destroy();
            } else if (this.currentTab === 'calendar' && typeof Calendar.destroy === 'function') {
                Calendar.destroy();
            } else if (this.currentTab === 'achievements' && typeof Achievements.destroy === 'function') {
                Achievements.destroy();
            }
        }

        // Update tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (content.id === tabName) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        this.currentTab = tabName;

        // Update specific tab content
        switch (tabName) {
            case 'dashboard':
                if (typeof Dashboard.init === 'function') {
                    Dashboard.init();
                } else {
                    Dashboard.updateDashboard();
                    Dashboard.setupCharts();
                }
                break;
            case 'todo':
                Todo.render();
                break;
            case 'notes':
                Notes.render();
                break;
            case 'pomodoro':
                Pomodoro.updateDisplay();
                break;
            case 'habits':
                Habits.render();
                break;
            case 'achievements':
                Achievements.render();
                break;
            case 'calendar':
                Calendar.render();
                break;
            case 'journal':
                Journal.render();
                break;
            case 'goals':
                Goals.render();
                break;
            case 'analytics':
                Analytics.render();
                break;
        }
    },

    // Save settings
    saveSettings() {
        this.settings.userName = Utils.sanitizeHTML(document.getElementById('user-name-input').value);
        this.settings.theme = document.getElementById('theme-select').value;
        this.settings.notifications = document.getElementById('notification-toggle').checked;

        Storage.set('settings', this.settings);

        // Apply theme
        if (this.settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Update user name
        this.updateUserName();

        this.showNotification('Pengaturan berhasil disimpan');
    },

    // Update user name in header
    updateUserName() {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = this.settings.userName || 'Pengguna';
        }
    },

    // Check for consecutive days usage
    checkConsecutiveDays() {
        const lastUsage = Storage.get('lastUsage');
        const today = new Date().toISOString().split('T')[0];

        let consecutiveDays = 0;

        if (lastUsage) {
            const lastDate = new Date(lastUsage);
            const todayDate = new Date(today);

            // Calculate days difference
            const timeDiff = todayDate - lastDate;
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
                // Used yesterday, increment consecutive days
                consecutiveDays = Storage.get('consecutiveDays') || 0;
                consecutiveDays++;
            } else if (daysDiff === 0) {
                // Used today already, get existing consecutive days
                consecutiveDays = Storage.get('consecutiveDays') || 0;
            } else {
                // More than a day passed, reset consecutive days
                consecutiveDays = 1;
            }
        } else {
            // First time using the app
            consecutiveDays = 1;
        }

        // Save today's usage
        Storage.set('lastUsage', today);
        Storage.set('consecutiveDays', consecutiveDays);

        // Check for achievement
        const data = {
            consecutiveDays
        };

        Achievements.checkAchievements(data);
    },

    // Check if the user is typing in an input field
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement.tagName === 'INPUT' ||
               activeElement.tagName === 'TEXTAREA' ||
               activeElement.tagName === 'SELECT' ||
               activeElement.hasAttribute('contenteditable');
    },

    // Show notification
    showNotification(message) {
        try {
            const notification = document.getElementById('notification-toast');
            const messageEl = document.getElementById('notification-message');

            if (notification && messageEl) {
                messageEl.textContent = message;
                notification.classList.remove('translate-y-full');

                setTimeout(() => {
                    notification.classList.add('translate-y-full');
                }, 3000);
            } else {
                // Fallback to console if notification elements are not found
                console.log(`Notification: ${message}`);
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});