// Enhanced dashboard functionality with Tailwind CSS styling and interactive elements
const Dashboard = {
    charts: {},
    widgets: {},
    dragStartIndex: null,
    isFocusMode: false,
    theme: 'light',
    layout: [],
    isDragging: false,
    dragSource: null,

    init() {
        this.loadSettings();
        this.initializeWidgets();
        this.updateDashboard();
        this.setupCharts();
        this.setupRealTimeUpdates();
        this.setupKeyboardShortcuts();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadDashboardLayout();
        this.setupTooltips();
        this.setupCollapsibleSections();
        this.setupDashboardCustomization();
        this.setupQuickActions();
        this.setupDashboardSharing();
        this.setupDataBackupRestore();
        this.setupFocusMode();
        this.setupThemeToggle();
        this.setupProductivityAnalytics();
        this.setupRecommendations();
        this.setupDashboardShortcuts();
        this.setupGoalsTracking();
        this.setupLoadingAnimations();
    },

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        this.theme = settings.theme || 'light';
        this.applyTheme();
    },

    applyTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    },

    initializeWidgets() {
        // Initialize quick stats widget
        this.widgets.quickStats = {
            todos: { element: document.getElementById('today-todos-count'), value: 0 },
            notes: { element: document.getElementById('notes-count'), value: 0 },
            habits: { element: document.getElementById('active-habits-count'), value: 0 },
            achievements: { element: document.getElementById('achievements-count'), value: 0 },
            longestStreak: { element: document.getElementById('longest-streak'), value: 0 },
            unlockedAchievements: { element: document.getElementById('unlocked-achievements'), value: 0 },
            totalTodosCount: { element: document.getElementById('total-todos-count'), value: 0 }
        };

        // Initialize productivity widget
        this.widgets.productivity = {
            element: document.getElementById('productivity-score'),
            value: 0
        };

        // Initialize time tracking widget
        this.widgets.timeTracking = {
            element: document.getElementById('time-tracking'),
            today: 0,
            week: 0,
            month: 0
        };

        // Initialize new dashboard elements
        this.widgets.dashboard = {
            userName: document.getElementById('dashboard-user-name'),
            focusHours: document.getElementById('focus-hours-today'),
            completedTodos: document.getElementById('completed-todos-today'),
            currentStreak: document.getElementById('current-streak'),
            goalProgress: document.getElementById('goal-progress'),
            recentJournals: document.getElementById('recent-journals'),
            recentAchievements: document.getElementById('recent-achievements'),
            upcomingDeadlines: document.getElementById('upcoming-deadlines'),
            pomodoroSessions: document.getElementById('pomodoro-sessions-today'),
            pomodoroStreak: document.getElementById('pomodoro-streak')
        };
    },

    setupEventListeners() {
        // Focus mode toggle
        const focusToggle = document.getElementById('focus-mode-toggle');
        if (focusToggle) {
            focusToggle.addEventListener('click', () => this.toggleFocusMode());
        }

        // Quick add button
        const quickAddBtn = document.getElementById('quick-add-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.showQuickAddModal());
        }

        // Dashboard settings button
        const settingsBtn = document.getElementById('dashboard-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showDashboardSettings());
        }

        // Quick action buttons
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                switch(index) {
                    case 0: // Add Todo
                        App.switchTab('todo');
                        break;
                    case 1: // Add Note
                        App.switchTab('notes');
                        break;
                    case 2: // Add Habit
                        App.switchTab('habits');
                        break;
                    case 3: // Add Journal
                        App.switchTab('journal');
                        break;
                }
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Widget refresh buttons
        const refreshBtns = document.querySelectorAll('.widget-refresh');
        refreshBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const widgetId = btn.closest('.widget').id;
                this.refreshWidget(widgetId);
            });
        });

        // Widget collapse/expand buttons
        const collapseBtns = document.querySelectorAll('.widget-collapse');
        collapseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const widget = btn.closest('.widget');
                this.toggleWidgetCollapse(widget);
            });
        });

        // Widget close buttons
        const closeBtns = document.querySelectorAll('.widget-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const widget = btn.closest('.widget');
                this.closeWidget(widget);
            });
        });
    },

    updateDashboard() {
        this.updateQuickStats();
        this.updatePriorityTodos();
        this.updateTodayHabits();
        this.updateUpcomingDeadlines();
        this.updateRecentActivity();
        this.updateMotivationalQuote();
        this.updateWeatherWidget();
        this.updateProductivityScore();
        this.updatePersonalizedGreeting();
        this.updateProductivityInsights();
        this.updateAchievementShowcase();
        this.updateGoalProgress();
        this.updateJournalHighlights();
        this.updatePomodoroSummary();
        this.updateCalendarIntegration();
        this.updateRecommendations();
        this.updateFocusModeIndicator();
    },

    updatePersonalizedGreeting() {
        const user = JSON.parse(localStorage.getItem('user')) || { name: 'User' };
        if (this.widgets.dashboard.userName) {
            this.widgets.dashboard.userName.textContent = user.name;
        }
    },

    updateQuickStats() {
        // Update todos
        const today = new Date().toISOString().split('T')[0];
        const todayTodos = Todo.todos.filter(t => t.date === today);
        const completedToday = todayTodos.filter(t => t.completed).length;

        if (this.widgets.quickStats.todos.element) {
            this.widgets.quickStats.todos.element.textContent = `${completedToday}/${todayTodos.length}`;
            this.widgets.quickStats.todos.value = completedToday;

            // Add animation
            this.animateCounter(this.widgets.quickStats.todos.element, completedToday);
        }

        if (this.widgets.quickStats.totalTodosCount.element) {
            this.widgets.quickStats.totalTodosCount.element.textContent = Todo.todos.length;
        }

        // Update notes
        if (this.widgets.quickStats.notes.element) {
            this.widgets.quickStats.notes.element.textContent = Notes.notes.length;
            this.widgets.quickStats.notes.value = Notes.notes.length;

            // Add animation
            this.animateCounter(this.widgets.quickStats.notes.element, Notes.notes.length);
        }

        // Update habits
        const activeHabits = Habits.habits.length;
        if (this.widgets.quickStats.habits.element) {
            this.widgets.quickStats.habits.element.textContent = activeHabits;
            this.widgets.quickStats.habits.value = activeHabits;

            // Add animation
            this.animateCounter(this.widgets.quickStats.habits.element, activeHabits);
        }

        // Update achievements
        const unlockedAchievements = Achievements.getUnlockedCount();
        if (this.widgets.quickStats.achievements.element) {
            this.widgets.quickStats.achievements.element.textContent = unlockedAchievements;
            this.widgets.quickStats.achievements.value = unlockedAchievements;

            // Add animation
            this.animateCounter(this.widgets.quickStats.achievements.element, unlockedAchievements);
        }

        // Update longest streak
        if (this.widgets.quickStats.longestStreak.element) {
            const longestStreak = this.getLongestHabitStreak();
            this.widgets.quickStats.longestStreak.element.textContent = longestStreak;

            // Add animation
            this.animateCounter(this.widgets.quickStats.longestStreak.element, longestStreak);
        }

        // Update unlocked achievements
        if (this.widgets.quickStats.unlockedAchievements.element) {
            this.widgets.quickStats.unlockedAchievements.element.textContent = unlockedAchievements;

            // Add animation
            this.animateCounter(this.widgets.quickStats.unlockedAchievements.element, unlockedAchievements);
        }
    },

    animateCounter(element, to) {
        const from = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(from + (to - from) * progress);

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    updateProductivityInsights() {
        // Update focus hours today
        if (this.widgets.dashboard.focusHours) {
            const focusHours = this.getFocusHoursToday();
            this.widgets.dashboard.focusHours.textContent = `${focusHours}h`;
        }

        // Update completed todos today
        if (this.widgets.dashboard.completedTodos) {
            const today = new Date().toISOString().split('T')[0];
            const completedToday = Todo.todos.filter(t => t.date === today && t.completed).length;
            this.widgets.dashboard.completedTodos.textContent = completedToday;
        }

        // Update current streak
        if (this.widgets.dashboard.currentStreak) {
            const currentStreak = this.getCurrentStreak();
            this.widgets.dashboard.currentStreak.textContent = currentStreak;
        }

        // Update productivity trend chart
        this.setupProductivityTrend();
    },

    updateAchievementShowcase() {
        const achievementsEl = this.widgets.dashboard.recentAchievements;
        if (!achievementsEl) return;

        const recentAchievements = this.getRecentAchievements(5);
        if (recentAchievements.length === 0) {
            achievementsEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-trophy text-5xl text-purple-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Belum ada pencapaian terbaru</p>
                </div>
            `;
            return;
        }

        achievementsEl.innerHTML = '';
        recentAchievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = 'flex items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 mb-3 transition-all duration-300 hover:shadow-md cursor-pointer';
            achievementEl.innerHTML = `
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white mr-4">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="flex-grow">
                    <p class="font-semibold text-purple-800 dark:text-purple-200">${achievement.name}</p>
                    <p class="text-sm text-purple-600 dark:text-purple-300">${achievement.description}</p>
                </div>
                <span class="text-xs text-purple-500 dark:text-purple-400">${this.formatTimeAgo(achievement.unlockedAt)}</span>
            `;
            achievementsEl.appendChild(achievementEl);
        });
    },

    updateGoalProgress() {
        const goalProgressEl = this.widgets.dashboard.goalProgress;
        if (!goalProgressEl) return;

        const activeGoals = Goals.goals.filter(goal => !goal.completed);
        if (activeGoals.length === 0) {
            goalProgressEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-bullseye text-5xl text-indigo-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Tidak ada tujuan aktif</p>
                </div>
            `;
            return;
        }

        goalProgressEl.innerHTML = '';
        activeGoals.slice(0, 3).forEach(goal => {
            const progress = goal.target ? Math.round((goal.current / goal.target) * 100) : 0;
            const goalEl = document.createElement('div');
            goalEl.className = 'mb-4 last:mb-0';
            goalEl.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium text-gray-800 dark:text-gray-200 truncate">${goal.title}</span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${progress}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" style="width: ${progress}%"></div>
                </div>
            `;
            goalProgressEl.appendChild(goalEl);
        });
    },

    updateJournalHighlights() {
        const journalEl = this.widgets.dashboard.recentJournals;
        if (!journalEl) return;

        const recentJournals = this.getRecentJournals(3);
        if (recentJournals.length === 0) {
            journalEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-book text-5xl text-purple-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Belum ada journal hari ini</p>
                </div>
            `;
            return;
        }

        journalEl.innerHTML = '';
        recentJournals.forEach(entry => {
            const journalEl = document.createElement('div');
            journalEl.className = 'p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 mb-3 transition-all duration-300 hover:shadow-md cursor-pointer';
            const date = new Date(entry.date);
            journalEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <p class="font-semibold text-purple-800 dark:text-purple-200 truncate">${entry.title || 'Tanpa Judul'}</p>
                        <p class="text-sm text-purple-600 dark:text-purple-300 mt-1">${entry.content.substring(0, 80)}${entry.content.length > 80 ? '...' : ''}</p>
                    </div>
                    <span class="text-xs text-purple-500 dark:text-purple-400 whitespace-nowrap">${date.toLocaleDateString('id-ID')}</span>
                </div>
            `;
            journalEl.appendChild(journalEl);
        });
    },

    updatePomodoroSummary() {
        // Update Pomodoro sessions today
        if (this.widgets.dashboard.pomodoroSessions) {
            const sessionsToday = this.getPomodoroSessionsToday();
            this.widgets.dashboard.pomodoroSessions.textContent = sessionsToday;
        }

        // Update Pomodoro streak
        if (this.widgets.dashboard.pomodoroStreak) {
            const streak = this.getPomodoroStreak();
            this.widgets.dashboard.pomodoroStreak.textContent = streak;
        }

        // Update Pomodoro weekly chart
        this.setupPomodoroWeeklyChart();
    },

    updateCalendarIntegration() {
        const calendarEl = this.widgets.dashboard.upcomingDeadlines;
        if (!calendarEl) return;

        const upcomingDeadlines = this.getUpcomingDeadlines();
        if (upcomingDeadlines.length === 0) {
            calendarEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-calendar-alt text-5xl text-blue-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Tidak ada deadline mendatang</p>
                </div>
            `;
            return;
        }

        calendarEl.innerHTML = '';
        upcomingDeadlines.forEach(item => {
            const deadlineEl = document.createElement('div');
            deadlineEl.className = 'flex items-center justify-between p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 cursor-pointer';
            const daysLeft = this.calculateDaysLeft(item.date);
            const urgencyClass = daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-gray-600';

            deadlineEl.innerHTML = `
                <div class="flex items-center">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                        <i class="fas fa-calendar-alt text-blue-500"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800 dark:text-gray-200">${item.title}</p>
                        <p class="text-sm ${urgencyClass}">${daysLeft} hari lagi</p>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-gray-400 dark:text-gray-500"></i>
            `;

            calendarEl.appendChild(deadlineEl);
        });
    },

    getPriorityTodos() {
        const today = new Date().toISOString().split('T')[0];
        return Todo.todos
            .filter(todo => !todo.completed && new Date(todo.date) >= new Date(today))
            .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, 5); // Ambil 5 todo prioritas tertinggi
    },

    getLongestHabitStreak() {
        if (!Habits.habits || Habits.habits.length === 0) return 0;
        return Math.max(...Habits.habits.map(habit => habit.streak), 0);
    },

    getFocusHoursToday() {
        // This would integrate with Pomodoro data
        // For now, returning a placeholder
        return Pomodoro ? Math.floor((Pomodoro.sessionCount || 0) / 4) : 0;
    },

    getCurrentStreak() {
        // Calculate current streak based on consecutive days of activity
        // For now, returning a placeholder
        return 5; // Placeholder
    },

    getRecentAchievements(limit) {
        // Get unlocked achievements sorted by unlock date
        const allAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
        return allAchievements
            .filter(achievement => achievement.unlocked)
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .slice(0, limit);
    },

    getRecentJournals(limit) {
        // Get recent journal entries
        if (typeof Journal !== 'undefined' && Journal.entries) {
            return Journal.entries
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, limit);
        }
        return [];
    },

    getPomodoroSessionsToday() {
        // Get Pomodoro sessions completed today
        if (typeof Pomodoro !== 'undefined' && Pomodoro.sessionHistory) {
            const today = new Date().toISOString().split('T')[0];
            return Pomodoro.sessionHistory.filter(session =>
                session.date === today && session.completed
            ).length;
        }
        return 0;
    },

    getPomodoroStreak() {
        // Get current Pomodoro streak
        if (typeof Pomodoro !== 'undefined' && Pomodoro.streak) {
            return Pomodoro.streak;
        }
        return 0;
    },

    setupPomodoroWeeklyChart() {
        const ctx = document.getElementById('dashboard-pomodoro-weekly-chart');
        if (!ctx) return;

        const data = this.getPomodoroWeeklyData();

        if (this.charts.pomodoroWeekly) {
            this.charts.pomodoroWeekly.destroy();
        }

        this.charts.pomodoroWeekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Sesi Pomodoro',
                    data: data.values,
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Sesi: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    getPomodoroWeeklyData() {
        const labels = [];
        const values = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });

            labels.push(dayName);

            // Count pomodoro sessions for this day
            let sessionCount = 0;
            if (typeof Pomodoro !== 'undefined' && Pomodoro.sessionHistory) {
                sessionCount = Pomodoro.sessionHistory.filter(session =>
                    session.date === dateStr && session.completed
                ).length;
            }

            values.push(sessionCount);
        }

        return { labels, values };
    },

    toggleFocusMode() {
        this.isFocusMode = !this.isFocusMode;
        const focusToggle = document.getElementById('focus-mode-toggle');

        if (this.isFocusMode) {
            focusToggle.innerHTML = '<i class="fas fa-sun mr-2"></i> Fokus Aktif';
            focusToggle.classList.remove('bg-indigo-100', 'text-indigo-700');
            focusToggle.classList.add('bg-indigo-600', 'text-white');
            this.enterFocusMode();
        } else {
            focusToggle.innerHTML = '<i class="fas fa-moon mr-2"></i> Fokus';
            focusToggle.classList.remove('bg-indigo-600', 'text-white');
            focusToggle.classList.add('bg-indigo-100', 'text-indigo-700');
            this.exitFocusMode();
        }
    },

    enterFocusMode() {
        document.body.classList.add('focus-mode');
        // Hide non-essential UI elements
        const elementsToHide = document.querySelectorAll('.nav-item, .header-user-info, #quick-capture');
        elementsToHide.forEach(el => el.style.display = 'none');
    },

    exitFocusMode() {
        document.body.classList.remove('focus-mode');
        // Show all UI elements
        const elementsToHide = document.querySelectorAll('.nav-item, .header-user-info, #quick-capture');
        elementsToHide.forEach(el => el.style.display = '');
    },

    showQuickAddModal() {
        // Show quick add modal or trigger quick add functionality
        // For now, just switch to the most relevant tab based on context
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            App.switchTab('todo'); // Morning - focus on tasks
        } else if (currentHour < 18) {
            App.switchTab('habits'); // Afternoon - check habits
        } else {
            App.switchTab('journal'); // Evening - reflect in journal
        }
    },

    showDashboardSettings() {
        // Show dashboard customization settings
        // This could open a modal or navigate to settings
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Pengaturan Dashboard</h2>
                    <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" id="close-settings-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tema</label>
                        <select id="dashboard-theme" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                            <option value="light">Terang</option>
                            <option value="dark">Gelap</option>
                            <option value="auto">Otomatis</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tampilan Widget</label>
                        <select id="dashboard-layout" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                            <option value="compact">Ringkas</option>
                        </select>
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" id="show-animations" class="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500">
                        <label for="show-animations" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Tampilkan Animasi</label>
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" id="auto-refresh" class="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500">
                        <label for="auto-refresh" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Refresh Otomatis</label>
                    </div>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                    <button id="cancel-settings" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Batal
                    </button>
                    <button id="save-settings" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Simpan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('close-settings-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('cancel-settings').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveDashboardSettings();
            document.body.removeChild(modal);
        });
    },

    saveDashboardSettings() {
        const settings = {
            theme: document.getElementById('dashboard-theme').value,
            layout: document.getElementById('dashboard-layout').value,
            showAnimations: document.getElementById('show-animations').checked,
            autoRefresh: document.getElementById('auto-refresh').checked
        };

        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
        App.showNotification('Pengaturan berhasil disimpan!');
    },

    setupDragAndDrop() {
        // Implement drag and drop functionality for dashboard widgets
        const containers = document.querySelectorAll('.grid');
        containers.forEach(container => {
            container.addEventListener('dragover', this.dragOver.bind(this));
            container.addEventListener('dragenter', this.dragEnter.bind(this));
            container.addEventListener('dragleave', this.dragLeave.bind(this));
            container.addEventListener('drop', this.drop.bind(this));
        });

        // Make widgets draggable
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach(widget => {
            widget.setAttribute('draggable', 'true');
            widget.addEventListener('dragstart', this.dragStart.bind(this));
            widget.addEventListener('dragend', this.dragEnd.bind(this));
        });
    },

    dragStart(e) {
        this.dragStartIndex = e.target;
        setTimeout(() => e.target.classList.add('opacity-0'), 0);
    },

    dragEnd(e) {
        e.target.classList.remove('opacity-0');
        this.dragStartIndex = null;
    },

    dragOver(e) {
        e.preventDefault();
    },

    dragEnter(e) {
        e.preventDefault();
        e.target.classList.add('bg-gray-100');
    },

    dragLeave(e) {
        e.target.classList.remove('bg-gray-100');
    },

    drop(e) {
        e.target.classList.remove('bg-gray-100');
        if (this.dragStartIndex !== e.target) {
            // Swap elements
            const parent = e.target.parentNode;
            const targetIndex = Array.from(parent.children).indexOf(e.target);
            const startIndex = Array.from(parent.children).indexOf(this.dragStartIndex);

            if (targetIndex < startIndex) {
                parent.insertBefore(this.dragStartIndex, e.target);
            } else {
                parent.insertBefore(this.dragStartIndex, e.target.nextSibling);
            }
        }
    },

    saveDashboardLayout() {
        // Save the current layout configuration to localStorage
        const layout = {
            widgetOrder: [],
            widgetVisibility: {},
            lastUpdated: new Date().toISOString()
        };

        // Get current widget order
        const dashboardContainer = document.querySelector('#dashboard');
        if (dashboardContainer) {
            const widgets = dashboardContainer.querySelectorAll('.widget');
            layout.widgetOrder = Array.from(widgets).map(widget => widget.id || widget.querySelector('h2')?.textContent);
        }

        localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    },

    loadDashboardLayout() {
        // Load the saved layout configuration from localStorage
        const layout = JSON.parse(localStorage.getItem('dashboardLayout')) || {};

        if (layout.widgetOrder && layout.widgetOrder.length > 0) {
            // Reorder widgets based on saved layout
            // Implementation would depend on how widgets are structured
        }
    },

    // Additional methods for dashboard customization and data management
    exportDashboardData() {
        const dashboardData = {
            todos: Todo.todos,
            notes: Notes.notes,
            habits: Habits.habits,
            achievements: JSON.parse(localStorage.getItem('achievements')) || [],
            goals: Goals.goals,
            journal: typeof Journal !== 'undefined' ? Journal.entries : [],
            pomodoro: typeof Pomodoro !== 'undefined' ? Pomodoro.sessionHistory : [],
            settings: JSON.parse(localStorage.getItem('settings')) || {},
            dashboardLayout: JSON.parse(localStorage.getItem('dashboardLayout')) || {},
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(dashboardData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `dashboard-data-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    importDashboardData(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);

                // Restore data
                if (importedData.todos) {
                    localStorage.setItem('todos', JSON.stringify(importedData.todos));
                    Todo.todos = importedData.todos;
                }

                if (importedData.notes) {
                    localStorage.setItem('notes', JSON.stringify(importedData.notes));
                    Notes.notes = importedData.notes;
                }

                if (importedData.habits) {
                    localStorage.setItem('habits', JSON.stringify(importedData.habits));
                    Habits.habits = importedData.habits;
                }

                if (importedData.achievements) {
                    localStorage.setItem('achievements', JSON.stringify(importedData.achievements));
                }

                if (importedData.goals) {
                    localStorage.setItem('goals', JSON.stringify(importedData.goals));
                    Goals.goals = importedData.goals;
                }

                if (importedData.journal) {
                    localStorage.setItem('journal', JSON.stringify(importedData.journal));
                    if (typeof Journal !== 'undefined') {
                        Journal.entries = importedData.journal;
                    }
                }

                if (importedData.pomodoro) {
                    localStorage.setItem('pomodoro', JSON.stringify(importedData.pomodoro));
                    if (typeof Pomodoro !== 'undefined') {
                        Pomodoro.sessionHistory = importedData.pomodoro;
                    }
                }

                if (importedData.settings) {
                    localStorage.setItem('settings', JSON.stringify(importedData.settings));
                }

                if (importedData.dashboardLayout) {
                    localStorage.setItem('dashboardLayout', JSON.stringify(importedData.dashboardLayout));
                }

                // Update the dashboard
                this.updateDashboard();
                this.setupCharts();

                // Show success notification
                App.showNotification('Data berhasil diimpor!');
            } catch (error) {
                console.error('Error importing dashboard data:', error);
                App.showNotification('Gagal mengimpor data. File mungkin rusak.', 'error');
            }
        };
        reader.readAsText(file);
    },

    backupDashboard() {
        this.exportDashboardData();
    },

    restoreDashboard(file) {
        this.importDashboardData(file);
    },

    getDashboardRecommendations() {
        const recommendations = [];

        // Todo recommendations
        const incompleteTodos = Todo.todos.filter(t => !t.completed);
        if (incompleteTodos.length > 10) {
            recommendations.push({
                type: 'todo',
                message: 'Anda memiliki banyak todo yang belum selesai. Pertimbangkan untuk menyelesaikan beberapa todo penting hari ini.',
                priority: 'high'
            });
        }

        // Habit recommendations
        const incompleteHabits = Habits.habits.filter(h => !h.completedDates.includes(new Date().toISOString().split('T')[0]));
        if (incompleteHabits.length > 0) {
            recommendations.push({
                type: 'habit',
                message: 'Ada kebiasaan yang belum Anda selesaikan hari ini. Jangan lupa untuk menyelesaikan kebiasaan harian Anda.',
                priority: 'medium'
            });
        }

        // Productivity recommendations
        const productivityScore = this.calculateProductivityScore();
        if (productivityScore < 50) {
            recommendations.push({
                type: 'productivity',
                message: 'Skor produktivitas Anda rendah akhir-akhir ini. Cobalah untuk menggunakan teknik Pomodoro untuk meningkatkan fokus.',
                priority: 'medium'
            });
        }

        return recommendations;
    },

    updateRecommendations() {
        const recommendations = this.getDashboardRecommendations();
        const recEl = document.getElementById('dashboard-recommendations');
        if (!recEl || recommendations.length === 0) return;

        recEl.innerHTML = '';
        recommendations.forEach(rec => {
            const recItem = document.createElement('div');
            recItem.className = `p-4 rounded-lg mb-3 border-l-4 ${
                rec.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            }`;
            recItem.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-lightbulb text-xl mr-3 mt-0.5 ${
                        rec.priority === 'high' ? 'text-red-500' :
                        rec.priority === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                    }"></i>
                    <div>
                        <p class="font-medium text-gray-800 dark:text-gray-200">${rec.message}</p>
                    </div>
                </div>
            `;
            recEl.appendChild(recItem);
        });
    },

    updatePriorityTodos() {
        const priorityTodosEl = document.getElementById('priority-todos');
        if (!priorityTodosEl) return;

        // Pastikan Todo.todos ada dan merupakan array
        if (!Todo.todos || !Array.isArray(Todo.todos)) {
            priorityTodosEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <i class="fas fa-exclamation-circle text-5xl text-yellow-400 mb-4 opacity-70"></i>
                <p class="text-gray-500 dark:text-gray-400">Data todo tidak tersedia</p>
            </div>
        `;
            return;
        }

        // Gunakan method yang sudah diperbaiki atau fallback
        let priorityTodos;
        if (typeof Todo.getPriorityTodos === 'function') {
            priorityTodos = Todo.getPriorityTodos();
        } else {
            // Fallback jika method tidak ada
            const today = new Date().toISOString().split('T')[0];
            priorityTodos = Todo.todos
                .filter(todo => !todo.completed && new Date(todo.date) >= new Date(today))
                .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .slice(0, 5);
        }

        if (priorityTodos.length === 0) {
            priorityTodosEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <i class="fas fa-check-circle text-5xl text-green-400 mb-4 opacity-70"></i>
                <p class="text-gray-500 dark:text-gray-400">Tidak ada todo prioritas</p>
            </div>
        `;
            return;
        }

        priorityTodosEl.innerHTML = '';

        priorityTodos.forEach(todo => {
            const todoEl = document.createElement('div');
            todoEl.className = `todo-item ${todo.completed ? 'todo-completed' : ''} todo-priority-${todo.priority} p-4 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800`;

            const priorityIcons = {
                high: '<i class="fas fa-exclamation-circle text-red-500"></i>',
                medium: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
                low: '<i class="fas fa-info-circle text-green-500"></i>'
            };

            const dueDate = new Date(todo.date);
            const isOverdue = dueDate < new Date() && !todo.completed;
            const isDueToday = dueDate.toDateString() === new Date().toDateString();

            todoEl.innerHTML = `
            <div class="flex items-center flex-grow">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}
                       class="mr-3 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                       data-id="${todo.id}">
                <div class="flex-grow">
                    <p class="${todo.completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'} font-medium">
                        ${Utils.escapeHtml(todo.text)}
                    </p>
                    <div class="flex items-center space-x-2 text-sm mt-1">
                        ${priorityIcons[todo.priority]}
                        <span class="${isOverdue ? 'text-red-600 font-semibold' : isDueToday ? 'text-yellow-600' : 'text-gray-500'} dark:text-gray-400">
                            ${this.formatDueDate(todo.date)}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2 ml-4">
                <button class="edit-todo text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition" data-id="${todo.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-todo text-red-500 hover:text-red-700 dark:hover:text-red-400 transition" data-id="${todo.id}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

            priorityTodosEl.appendChild(todoEl);
        });

        // Add event listeners
        this.attachTodoEventListeners(priorityTodosEl);
    },

    updateTodayHabits() {
        const todayHabitsEl = document.getElementById('today-habits');
        if (!todayHabitsEl) return;

        const today = new Date().toISOString().split('T')[0];
        const incompleteHabits = Habits.habits.filter(h => !h.completedDates.includes(today));

        if (incompleteHabits.length === 0) {
            todayHabitsEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-trophy text-5xl text-yellow-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Semua kebiasaan hari ini selesai!</p>
                </div>
            `;
            return;
        }

        todayHabitsEl.innerHTML = '';

        incompleteHabits.forEach(habit => {
            const habitEl = document.createElement('div');
            habitEl.className = 'habit-card p-4 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800';

            const streakClass = this.getStreakClass(habit.streak);
            const completionRate = this.calculateHabitCompletionRate(habit);

            habitEl.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex-grow">
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200">${habit.name}</h4>
                        <div class="flex items-center space-x-2 mt-1">
                            ${habit.streak > 0 ? `
                                <span class="habit-streak ${streakClass} px-2 py-1 rounded-full text-xs font-medium">
                                    <i class="fas fa-fire mr-1"></i>${habit.streak} hari
                                </span>
                            ` : ''}
                            <span class="text-sm text-gray-500 dark:text-gray-400">${completionRate}% selesai</span>
                        </div>
                    </div>
                    <button class="complete-habit btn btn-success btn-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition" data-id="${habit.id}">
                        <i class="fas fa-check mr-1"></i> Selesai
                    </button>
                </div>
                <div class="mt-3">
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out" style="width: ${completionRate}%"></div>
                    </div>
                </div>
            `;

            todayHabitsEl.appendChild(habitEl);
        });

        // Add event listeners
        this.attachHabitEventListeners(todayHabitsEl);
    },

    updateUpcomingDeadlines() {
        const deadlinesEl = document.getElementById('upcoming-deadlines');
        if (!deadlinesEl) return;

        const upcomingDeadlines = this.getUpcomingDeadlines();

        if (upcomingDeadlines.length === 0) {
            deadlinesEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-calendar-alt text-5xl text-blue-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Tidak ada deadline mendatang</p>
                </div>
            `;
            return;
        }

        deadlinesEl.innerHTML = '';

        upcomingDeadlines.forEach(item => {
            const deadlineEl = document.createElement('div');
            deadlineEl.className = 'flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200';

            const daysLeft = this.calculateDaysLeft(item.date);
            const urgencyClass = daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-gray-600';

            deadlineEl.innerHTML = `
                <div>
                    <p class="font-medium text-gray-800 dark:text-gray-200">${item.title}</p>
                    <p class="text-sm ${urgencyClass}">${daysLeft} hari lagi</p>
                </div>
                <i class="fas fa-calendar-alt text-gray-400 dark:text-gray-500"></i>
            `;

            deadlinesEl.appendChild(deadlineEl);
        });
    },

    updateRecentActivity() {
        const activityEl = document.getElementById('recent-activity');
        if (!activityEl) return;

        const activities = this.getRecentActivities();

        if (activities.length === 0) {
            activityEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fas fa-history text-5xl text-gray-400 mb-4 opacity-70"></i>
                    <p class="text-gray-500 dark:text-gray-400">Belum ada aktivitas</p>
                </div>
            `;
            return;
        }

        activityEl.innerHTML = '';

        activities.forEach(activity => {
            const activityEl = document.createElement('div');
            activityEl.className = 'flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200';

            const iconClass = this.getActivityIconClass(activity.type);
            const timeAgo = this.formatTimeAgo(activity.timestamp);

            activityEl.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <i class="fas ${iconClass} text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <div class="flex-grow">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200">${activity.description}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${timeAgo}</p>
                </div>
            `;

            activityEl.appendChild(activityEl);
        });
    },

    updateProductivityScore() {
        const score = this.calculateProductivityScore();
        const scoreEl = document.getElementById('productivity-score');

        if (scoreEl) {
            scoreEl.textContent = `${score}%`;

            // Update color based on score
            let colorClass = 'text-red-600';
            if (score >= 80) colorClass = 'text-green-600';
            else if (score >= 60) colorClass = 'text-yellow-600';
            else if (score >= 40) colorClass = 'text-orange-600';

            scoreEl.className = `text-2xl font-bold ${colorClass}`;
        }
    },

    setupCharts() {
        this.setupTodoChart();
        this.setupHabitChart();
        this.setupProductivityTrend();
        this.setupCategoryDistribution();
    },

    setupTodoChart() {
        const ctx = document.getElementById('todo-chart');
        if (!ctx) return;

        const data = this.getTodoChartData();

        if (this.charts.todo) {
            this.charts.todo.destroy();
        }

        this.charts.todo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Todo Selesai',
                    data: data.completed,
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1
                }, {
                    label: 'Todo Belum Selesai',
                    data: data.pending,
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    setupHabitChart() {
        const ctx = document.getElementById('habit-chart');
        if (!ctx) return;

        const data = this.getHabitChartData();

        if (this.charts.habit) {
            this.charts.habit.destroy();
        }

        this.charts.habit = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Kebiasaan Selesai',
                    data: data.values,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    setupProductivityTrend() {
        const ctx = document.getElementById('dashboard-productivity-trend');
        if (!ctx) return;

        const data = this.getProductivityTrendData();

        if (this.charts.productivityTrend) {
            this.charts.productivityTrend.destroy();
        }

        this.charts.productivityTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Skor Produktivitas',
                    data: data.values,
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    setupCategoryDistribution() {
        const ctx = document.getElementById('dashboard-category-distribution');
        if (!ctx) return;

        const data = this.getCategoryDistributionData();

        if (this.charts.categoryDistribution) {
            this.charts.categoryDistribution.destroy();
        }

        this.charts.categoryDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },

    setupRealTimeUpdates() {
        // Update dashboard every minute
        setInterval(() => {
            this.updateDashboard();
        }, 60000);

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'todos' || e.key === 'habits' || e.key === 'notes') {
                this.updateDashboard();
            }
        });
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Ctrl/Cmd + D: Go to dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                App.switchTab('dashboard');
            }

            // Ctrl/Cmd + R: Refresh dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
                e.preventDefault();
                this.updateDashboard();
                this.setupCharts();
            }

            // Ctrl/Cmd + F: Toggle focus mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.toggleFocusMode();
            }

            // Ctrl/Cmd + K: Open quick capture
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showQuickAddModal();
            }
        });
    },

    setupTooltips() {
        // Add tooltip functionality to chart elements
        const chartElements = document.querySelectorAll('[data-chart-tooltip]');
        chartElements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'absolute bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg z-10';
                tooltip.textContent = el.getAttribute('data-chart-tooltip');
                document.body.appendChild(tooltip);

                const rect = el.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';

                el._tooltip = tooltip;
            });

            el.addEventListener('mouseleave', (e) => {
                if (el._tooltip) {
                    document.body.removeChild(el._tooltip);
                    el._tooltip = null;
                }
            });
        });
    },

    setupCollapsibleSections() {
        // Add collapsible functionality to sections
        const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('hidden');
                header.querySelector('i').classList.toggle('rotate-180');
            });
        });
    },

    setupDashboardCustomization() {
        // Add customization options
        const customizeBtn = document.getElementById('customize-dashboard');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => {
                this.showDashboardCustomizationModal();
            });
        }
    },

    showDashboardCustomizationModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Kustomisasi Dashboard</h2>
                    <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" id="close-customize-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">Widget Tersedia</h3>
                        <div class="space-y-2" id="available-widgets">
                            <div class="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Statistik Cepat</span>
                                <button class="add-widget-btn px-3 py-1 bg-indigo-600 text-white rounded text-sm">Tambah</button>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Todo Prioritas</span>
                                <button class="add-widget-btn px-3 py-1 bg-indigo-600 text-white rounded text-sm">Tambah</button>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span>Progres Tujuan</span>
                                <button class="add-widget-btn px-3 py-1 bg-indigo-600 text-white rounded text-sm">Tambah</button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">Widget Aktif</h3>
                        <div class="space-y-2" id="active-widgets">
                            <div class="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <span>Statistik Cepat</span>
                                <button class="remove-widget-btn px-3 py-1 bg-red-600 text-white rounded text-sm">Hapus</button>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <span>Todo Prioritas</span>
                                <button class="remove-widget-btn px-3 py-1 bg-red-600 text-white rounded text-sm">Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-6">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">Tema Dashboard</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer theme-option" data-theme="light">
                            <div class="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg"></div>
                            <span>Terang</span>
                        </div>
                        <div class="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer theme-option" data-theme="dark">
                            <div class="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg"></div>
                            <span>Gelap</span>
                        </div>
                        <div class="border-2 border-indigo-500 rounded-lg p-4 text-center cursor-pointer theme-option" data-theme="auto">
                            <div class="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
                            <span>Otomatis</span>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                    <button id="reset-customize" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Reset
                    </button>
                    <button id="save-customize" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Simpan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('close-customize-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('save-customize').addEventListener('click', () => {
            this.saveCustomization();
            document.body.removeChild(modal);
        });

        document.getElementById('reset-customize').addEventListener('click', () => {
            this.resetCustomization();
            document.body.removeChild(modal);
        });

        // Theme selection
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                themeOptions.forEach(opt => opt.classList.remove('border-indigo-500'));
                option.classList.add('border-indigo-500');
            });
        });
    },

    saveCustomization() {
        // Save customization settings
        const settings = {
            widgets: [],
            theme: 'light',
            layout: 'grid'
        };

        localStorage.setItem('dashboardCustomization', JSON.stringify(settings));
        App.showNotification('Kustomisasi berhasil disimpan!');
    },

    resetCustomization() {
        // Reset to default customization
        localStorage.removeItem('dashboardCustomization');
        App.showNotification('Kustomisasi berhasil direset!');
    },

    setupQuickActions() {
        // Add quick action functionality
        const quickActions = document.querySelectorAll('.quick-action-btn');
        quickActions.forEach(action => {
            action.addEventListener('click', () => {
                action.classList.add('animate-pulse');
                setTimeout(() => {
                    action.classList.remove('animate-pulse');
                }, 500);
            });
        });
    },

    setupDashboardSharing() {
        // Add dashboard sharing functionality
        const shareBtn = document.getElementById('share-dashboard');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.showDashboardSharingModal();
            });
        }
    },

    showDashboardSharingModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Bagikan Dashboard</h2>
                    <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" id="close-share-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Penerima</label>
                        <input type="email" id="share-email" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Masukkan email">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hak Akses</label>
                        <select id="share-permission" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                            <option value="view">Hanya Lihat</option>
                            <option value="edit">Lihat & Edit</option>
                        </select>
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" id="share-with-link" class="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500">
                        <label for="share-with-link" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Bagikan dengan tautan</label>
                    </div>

                    <div id="share-link-container" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tautan Berbagi</label>
                        <div class="flex">
                            <input type="text" id="share-link" class="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" readonly>
                            <button id="copy-share-link" class="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition">Salin</button>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                    <button id="cancel-share" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Batal
                    </button>
                    <button id="share-dashboard-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Bagikan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('close-share-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('cancel-share').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('share-with-link').addEventListener('change', (e) => {
            const container = document.getElementById('share-link-container');
            if (e.target.checked) {
                container.classList.remove('hidden');
                document.getElementById('share-link').value = window.location.href;
            } else {
                container.classList.add('hidden');
            }
        });

        document.getElementById('copy-share-link').addEventListener('click', () => {
            const linkInput = document.getElementById('share-link');
            linkInput.select();
            document.execCommand('copy');
            App.showNotification('Tautan disalin ke clipboard!');
        });

        document.getElementById('share-dashboard-btn').addEventListener('click', () => {
            // Implement sharing logic
            App.showNotification('Dashboard berhasil dibagikan!');
            document.body.removeChild(modal);
        });
    },

    setupDataBackupRestore() {
        // Add backup and restore functionality
        const backupBtn = document.getElementById('backup-dashboard');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.backupDashboard();
            });
        }

        const restoreBtn = document.getElementById('restore-dashboard');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                document.getElementById('restore-file-input').click();
            });
        }

        const restoreFileInput = document.getElementById('restore-file-input');
        if (restoreFileInput) {
            restoreFileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.restoreDashboard(e.target.files[0]);
                }
            });
        }
    },

    setupFocusMode() {
        // Add focus mode functionality
        const focusToggle = document.getElementById('focus-mode-toggle');
        if (focusToggle) {
            focusToggle.addEventListener('click', () => {
                this.toggleFocusMode();
            });
        }
    },

    setupThemeToggle() {
        // Add theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();

        // Save theme preference
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        settings.theme = this.theme;
        localStorage.setItem('settings', JSON.stringify(settings));

        App.showNotification(`Tema diubah ke ${this.theme === 'dark' ? 'gelap' : 'terang'}`);
    },

    setupProductivityAnalytics() {
        // Add productivity analytics functionality
        const analyticsBtn = document.getElementById('analytics-btn');
        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', () => {
                App.switchTab('analytics');
            });
        }
    },

    setupRecommendations() {
        // Add recommendation functionality
        const recBtn = document.getElementById('recommendations-btn');
        if (recBtn) {
            recBtn.addEventListener('click', () => {
                this.updateRecommendations();
            });
        }
    },

    setupDashboardShortcuts() {
        // Add dashboard shortcuts functionality
        const shortcuts = document.querySelectorAll('.dashboard-shortcut');
        shortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const tab = shortcut.getAttribute('data-tab');
                if (tab) {
                    App.switchTab(tab);
                }
            });
        });
    },

    setupGoalsTracking() {
        // Add daily goals tracking functionality
        const goalsBtn = document.getElementById('daily-goals-btn');
        if (goalsBtn) {
            goalsBtn.addEventListener('click', () => {
                App.switchTab('goals');
            });
        }
    },

    setupLoadingAnimations() {
        // Add loading animations for data fetching
        const loadingIndicators = document.querySelectorAll('.loading');
        loadingIndicators.forEach(indicator => {
            indicator.classList.add('animate-pulse');
        });
    },

    refreshWidget(widgetId) {
        // Refresh a specific widget
        switch(widgetId) {
            case 'quick-stats':
                this.updateQuickStats();
                break;
            case 'priority-todos':
                this.updatePriorityTodos();
                break;
            case 'today-habits':
                this.updateTodayHabits();
                break;
            case 'recent-achievements':
                this.updateAchievementShowcase();
                break;
            case 'goal-progress':
                this.updateGoalProgress();
                break;
            case 'recent-journals':
                this.updateJournalHighlights();
                break;
            case 'upcoming-deadlines':
                this.updateCalendarIntegration();
                break;
            default:
                this.updateDashboard();
        }

        App.showNotification('Widget diperbarui!');
    },

    toggleWidgetCollapse(widget) {
        const content = widget.querySelector('.widget-content');
        const collapseBtn = widget.querySelector('.widget-collapse');

        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            collapseBtn.innerHTML = '<i class="fas fa-minus"></i>';
        } else {
            content.classList.add('hidden');
            collapseBtn.innerHTML = '<i class="fas fa-plus"></i>';
        }
    },

    closeWidget(widget) {
        widget.classList.add('animate-fadeOut');
        setTimeout(() => {
            widget.remove();
        }, 300);
    },

    updateFocusModeIndicator() {
        const indicator = document.getElementById('focus-mode-indicator');
        if (indicator) {
            if (this.isFocusMode) {
                indicator.classList.remove('bg-gray-500');
                indicator.classList.add('bg-green-500');
            } else {
                indicator.classList.remove('bg-green-500');
                indicator.classList.add('bg-gray-500');
            }
        }
    },

    // Helper methods
    formatDueDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hari ini';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Besok';
        } else if (date < today) {
            return `Terlewat (${date.toLocaleDateString('id-ID')})`;
        } else {
            return date.toLocaleDateString('id-ID');
        }
    },

    getStreakClass(streak) {
        if (streak >= 100) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
        if (streak >= 50) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
        if (streak >= 21) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
        if (streak >= 7) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
        return 'bg-gray-200 text-gray-700';
    },

    calculateHabitCompletionRate(habit) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentDates = habit.completedDates.filter(date =>
            new Date(date) >= thirtyDaysAgo
        );

        return Math.round((recentDates.length / 30) * 100);
    },

    getUpcomingDeadlines() {
        const deadlines = [];
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Add todo deadlines
        if (Array.isArray(Todo.todos)) {
            Todo.todos.forEach(todo => {
                if (!todo.completed && new Date(todo.date) <= nextWeek) {
                    deadlines.push({
                        title: todo.text,
                        date: todo.date,
                        type: 'todo'
                    });
                }
            });
        }

        // Add goal deadlines
        if (Array.isArray(Goals.goals)) {
            Goals.goals.forEach(goal => {
                if (!goal.completed && goal.deadline && new Date(goal.deadline) <= nextWeek) {
                    deadlines.push({
                        title: goal.title,
                        date: goal.deadline,
                        type: 'goal'
                    });
                }
            });
        }

        return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
    },

    calculateDaysLeft(dateStr) {
        const today = new Date();
        const targetDate = new Date(dateStr);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getRecentActivities() {
        const activities = [];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Add todo activities
        if (Array.isArray(Todo.todos)) {
            Todo.todos.forEach(todo => {
                if (todo.completedAt && new Date(todo.completedAt) >= oneWeekAgo) {
                    activities.push({
                        type: 'todo',
                        description: `Menyelesaikan todo: ${todo.text}`,
                        timestamp: todo.completedAt
                    });
                }
            });
        }

        // Add note activities
        if (Array.isArray(Notes.notes)) {
            Notes.notes.forEach(note => {
                if (new Date(note.createdAt) >= oneWeekAgo) {
                    activities.push({
                        type: 'note',
                        description: `Membuat catatan: ${note.title}`,
                        timestamp: note.createdAt
                    });
                }
            });
        }

        // Add habit activities
        if (Array.isArray(Habits.habits)) {
            Habits.habits.forEach(habit => {
                if (Array.isArray(habit.completedDates)) {
                    habit.completedDates.forEach(date => {
                        if (new Date(date) >= oneWeekAgo) {
                            activities.push({
                                type: 'habit',
                                description: `Menyelesaikan kebiasaan: ${habit.name}`,
                                timestamp: date
                            });
                        }
                    });
                }
            });
        }

        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    },

    getActivityIconClass(type) {
        const icons = {
            todo: 'fa-check',
            note: 'fa-sticky-note',
            habit: 'fa-calendar-check',
            goal: 'fa-bullseye',
            journal: 'fa-book',
            pomodoro: 'fa-clock'
        };

        return icons[type] || 'fa-circle';
    },

    formatTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} menit lalu`;
        } else if (diffHours < 24) {
            return `${diffHours} jam lalu`;
        } else if (diffDays < 7) {
            return `${diffDays} hari lalu`;
        } else {
            return past.toLocaleDateString('id-ID');
        }
    },

    calculateProductivityScore() {
        const today = new Date().toISOString().split('T')[0];

        // Factor 1: Todo completion rate (40%)
        const todayTodos = Todo.todos.filter(t => t.date === today);
        const completedTodos = todayTodos.filter(t => t.completed).length;
        const todoScore = todayTodos.length > 0 ? (completedTodos / todayTodos.length) * 40 : 0;

        // Factor 2: Habit completion (30%)
        const completedHabits = Habits.habits.filter(h => h.completedDates.includes(today)).length;
        const habitScore = Habits.habits.length > 0 ? (completedHabits / Habits.habits.length) * 30 : 0;

        // Factor 3: Pomodoro sessions (20%)
        const pomodoroScore = Pomodoro && typeof Pomodoro.sessionCount === 'number' ? Math.min(Pomodoro.sessionCount * 2, 20) : 0;

        // Factor 4: Notes/Journal created (10%)
        const todayNotes = Notes.notes.filter(n => n.createdAt.split('T')[0] === today).length;
        const todayJournal = (typeof Journal !== 'undefined' && Journal.entries) ?
            Journal.entries.filter(j => j.date === today).length : 0;
        const writingScore = Math.min((todayNotes + todayJournal) * 5, 10);

        return Math.round(todoScore + habitScore + pomodoroScore + writingScore);
    },

    getTodoChartData() {
        const labels = [];
        const completed = [];
        const pending = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });

            labels.push(dayName);

            const dayTodos = Todo.todos.filter(t => t.date === dateStr);
            completed.push(dayTodos.filter(t => t.completed).length);
            pending.push(dayTodos.filter(t => !t.completed).length);
        }

        return { labels, completed, pending };
    },

    getHabitChartData() {
        const labels = [];
        const values = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

            labels.push(dayName);

            let completedHabits = 0;
            Habits.habits.forEach(habit => {
                if (habit.completedDates.includes(dateStr)) {
                    completedHabits++;
                }
            });

            values.push(completedHabits);
        }

        return { labels, values };
    },

    getProductivityTrendData() {
        const labels = [];
        const values = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

            labels.push(dayName);

            // Calculate productivity score for this day
            const dayTodos = Todo.todos.filter(t => t.date === dateStr);
            const completedTodos = dayTodos.filter(t => t.completed).length;
            const todoScore = dayTodos.length > 0 ? (completedTodos / dayTodos.length) * 50 : 0;

            let completedHabits = 0;
            Habits.habits.forEach(habit => {
                if (habit.completedDates.includes(dateStr)) {
                    completedHabits++;
                }
            });
            const habitScore = Habits.habits.length > 0 ? (completedHabits / Habits.habits.length) * 50 : 0;

            values.push(Math.round(todoScore + habitScore));
        }

        return { labels, values };
    },

    getCategoryDistributionData() {
        const categories = {
            personal: 0,
            work: 0,
            ideas: 0
        };

        Notes.notes.forEach(note => {
            if (categories.hasOwnProperty(note.category)) {
                categories[note.category]++;
            }
        });

        return {
            labels: ['Pribadi', 'Pekerjaan', 'Ide'],
            values: [categories.personal, categories.work, categories.ideas]
        };
    },

    attachTodoEventListeners(container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const todoId = parseInt(checkbox.dataset.id);
                if (!isNaN(todoId) && typeof Todo.toggleTodo === 'function') {
                    Todo.toggleTodo(todoId);
                    this.updatePriorityTodos();
                }
            });
        });

        const editBtns = container.querySelectorAll('.edit-todo');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const todoId = parseInt(btn.dataset.id);
                if (!isNaN(todoId) && typeof Todo.editTodo === 'function') {
                    Todo.editTodo(todoId);
                }
            });
        });

        const deleteBtns = container.querySelectorAll('.delete-todo');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const todoId = parseInt(btn.dataset.id);
                if (!isNaN(todoId) && typeof Todo.deleteTodo === 'function') {
                    Todo.deleteTodo(todoId);
                    this.updatePriorityTodos();
                }
            });
        });
    },

    attachHabitEventListeners(container) {
        const completeBtns = container.querySelectorAll('.complete-habit');
        completeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const habitId = parseInt(btn.dataset.id);
                if (!isNaN(habitId) && typeof Habits.toggleHabit === 'function') {
                    Habits.toggleHabit(habitId);
                    this.updateTodayHabits();
                }
            });
        });
    },

    updateMotivationalQuote() {
        const quoteEl = document.getElementById('motivational-quote');
        if (!quoteEl) return;

        const quotes = [
            { text: "Kesuksesan adalah kemampuan untuk pergi dari kegagalan ke kegagalan tanpa kehilangan semangat.", author: "Winston Churchill" },
            { text: "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya.", author: "Peter Drucker" },
            { text: "Jangan menunggu. Waktu tidak akan pernah tepat.", author: "Napoleon Hill" },
            { text: "Satu-satunya cara untuk melakukan pekerjaan besar adalah dengan mencintai yang Anda lakukan.", author: "Steve Jobs" }
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteEl.innerHTML = `
            <blockquote class="text-lg italic text-gray-700 dark:text-gray-300">
                "${randomQuote.text}"
            </blockquote>
            <cite class="text-sm text-gray-500 dark:text-gray-400">- ${randomQuote.author}</cite>
        `;
    },

    updateWeatherWidget() {
        const weatherEl = document.getElementById('weather-widget');
        if (!weatherEl) return;

        // This would integrate with a weather API
        // For now, showing placeholder
        weatherEl.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-cloud-sun text-4xl text-yellow-500 mr-4"></i>
                    <div>
                        <p class="text-2xl font-bold text-gray-800 dark:text-white">28°C</p>
                        <p class="text-gray-600 dark:text-gray-400">Cerah Berawan</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-600 dark:text-gray-400">Jakarta</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">Diperbarui: sekarang</p>
                </div>
            </div>
        `;
    },

    destroy() {
        // Destroy all chart instances to prevent memory leaks
        Object.values(this.charts).forEach(c => {
            if (c && typeof c.destroy === 'function') {
                c.destroy();
            }
        });
        this.charts = {};
    }
};