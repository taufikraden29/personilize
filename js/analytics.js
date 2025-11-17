// Enhanced analytics functionality with comprehensive features
const Analytics = {
    charts: {},
    dateRange: 30, // days
    refreshInterval: null,
    isRealTime: false,
    theme: 'light',
    widgets: [],
    currentFilters: {
        dateRange: 30,
        category: 'all',
        activityType: 'all'
    },

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.render();
        this.setupAutoRefresh();
        this.setupExportOptions();
        this.setupDragAndDrop();
        this.setupHotkeys();
        this.setupThemeToggle();
        this.setupRealTimeTracking();
        this.setupCustomReportBuilder();
        this.setupDataBackupRestore();
    },

    setupEventListeners() {
        // Date range filter
        const rangeSelect = document.getElementById('date-range');
        if (rangeSelect) {
            rangeSelect.addEventListener('change', (e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) {
                    this.currentFilters.dateRange = v;
                    this.dateRange = v;
                    this.render();
                    this.saveSettings();
                }
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.render();
                this.saveSettings();
            });
        }

        // Activity type filter
        const activityFilter = document.getElementById('activity-type-filter');
        if (activityFilter) {
            activityFilter.addEventListener('change', (e) => {
                this.currentFilters.activityType = e.target.value;
                this.render();
                this.saveSettings();
            });
        }

        // Export buttons
        const exportPdfBtn = document.getElementById('export-pdf');
        const exportImageBtn = document.getElementById('export-image');
        const exportCsvBtn = document.getElementById('export-csv');
        if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        if (exportImageBtn) exportImageBtn.addEventListener('click', () => this.exportToImage());
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => this.exportToCSV());

        // Refresh button
        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.render();
                this.showNotification('Analytics berhasil diperbarui', 'success');
            });
        }

        // Widget collapse/expand
        document.addEventListener('click', (e) => {
            if (e.target.closest('.widget-collapse')) {
                this.toggleWidget(e.target.closest('.widget-collapse').closest('.analytics-widget'));
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('analytics-theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Focus mode toggle
        const focusToggle = document.getElementById('focus-mode-toggle-analytics');
        if (focusToggle) {
            focusToggle.addEventListener('click', () => {
                this.toggleFocusMode();
            });
        }

        // Custom report builder
        const reportBuilder = document.getElementById('custom-report-builder');
        if (reportBuilder) {
            reportBuilder.addEventListener('click', () => {
                this.openCustomReportBuilder();
            });
        }

        // Analytics settings
        const settingsBtn = document.getElementById('analytics-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openAnalyticsSettings();
            });
        }

        // Modal close buttons
        const closeCustomReportBtn = document.getElementById('close-custom-report');
        const cancelCustomReportBtn = document.getElementById('cancel-custom-report');
        const closeAnalyticsSettingsBtn = document.getElementById('close-analytics-settings');
        const closeAnalyticsHelpBtn = document.getElementById('close-analytics-help');
        const closeHelpModalBtn = document.getElementById('close-help-modal');

        if (closeCustomReportBtn) closeCustomReportBtn.addEventListener('click', () => this.closeCustomReportBuilder());
        if (cancelCustomReportBtn) cancelCustomReportBtn.addEventListener('click', () => this.closeCustomReportBuilder());
        if (closeAnalyticsSettingsBtn) closeAnalyticsSettingsBtn.addEventListener('click', () => this.closeAnalyticsSettings());
        if (closeAnalyticsHelpBtn) closeAnalyticsHelpBtn.addEventListener('click', () => this.closeAnalyticsHelp());
        if (closeHelpModalBtn) closeHelpModalBtn.addEventListener('click', () => this.closeAnalyticsHelp());

        // Generate report button
        const generateReportBtn = document.getElementById('generate-report');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateCustomReport());
        }

        // Save analytics settings
        const saveSettingsBtn = document.getElementById('save-analytics-settings');
        const resetSettingsBtn = document.getElementById('reset-analytics-settings');
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveAnalyticsSettings());
        if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', () => this.resetAnalyticsSettings());
    },

    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            if (this.isRealTime) {
                this.render();
            }
        }, 5 * 60 * 1000);
    },

    setupExportOptions() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            const key = (e.key || '').toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === 'p') {
                e.preventDefault();
                this.exportToPDF();
            }
            if ((e.ctrlKey || e.metaKey) && key === 'i') {
                e.preventDefault();
                this.exportToImage();
            }
            if ((e.ctrlKey || e.metaKey) && key === 'e') {
                e.preventDefault();
                this.exportToCSV();
            }
        });
    },

    setupDragAndDrop() {
        // Enable drag and drop for widgets
        const widgets = document.querySelectorAll('.analytics-widget');
        widgets.forEach(widget => {
            widget.draggable = true;
            widget.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', widget.id);
            });
        });

        const container = document.querySelector('.analytics-grid');
        if (container) {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                const widgetId = e.dataTransfer.getData('text/plain');
                const widget = document.getElementById(widgetId);
                if (widget) {
                    // Insert at drop position
                    const rect = container.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // For simplicity, just append to end
                    container.appendChild(widget);
                    this.saveWidgetOrder();
                }
            });
        }
    },

    setupHotkeys() {
        // Register hotkeys for analytics
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1' && !App.isInputFocused()) {
                e.preventDefault();
                this.openAnalyticsHelp();
            }
        });
    },

    setupThemeToggle() {
        // Check system preference for theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme = 'dark';
        }
        
        // Apply theme
        this.applyTheme();
    },

    setupRealTimeTracking() {
        // Enable real-time analytics tracking
        this.isRealTime = true;
    },

    setupCustomReportBuilder() {
        // Initialize custom report builder
        const builder = document.getElementById('custom-report-builder-modal');
        if (builder) {
            builder.style.display = 'none';
        }
    },

    setupDataBackupRestore() {
        // Setup backup and restore functionality
        const backupBtn = document.getElementById('backup-analytics-data');
        const restoreBtn = document.getElementById('restore-analytics-data');
        
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.backupAnalyticsData());
        }
        
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreAnalyticsData());
        }
    },

    render() {
        this.updateStatisticsCards();
        this.setupCharts();
        this.updateInsights();
        this.updateRecommendations();
        this.updateLoadingState(false);
    },

    updateStatisticsCards() {
        // Productivity score
        const productivityScore = this.calculateProductivityScore();
        const productivityEl = document.getElementById('weekly-productivity');
        if (productivityEl) {
            productivityEl.textContent = `${productivityScore}%`;
            productivityEl.className = `text-3xl font-bold ${this.getProductivityColor(productivityScore)}`;
        }

        // Completed todos
        const completedTodos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.completed).length : 0;
        const completedTodosEl = document.getElementById('total-completed-todos');
        if (completedTodosEl) completedTodosEl.textContent = completedTodos;

        // Focus hours
        const totalFocusHours = (window.Pomodoro && typeof Pomodoro.totalMinutes === 'number') ? Math.floor(Pomodoro.totalMinutes / 60) : 0;
        const focusHoursEl = document.getElementById('total-focus-hours');
        if (focusHoursEl) focusHoursEl.textContent = totalFocusHours;

        // Best streak
        const bestStreak = (window.Habits && Array.isArray(Habits.habits)) ? Math.max(0, ...Habits.habits.map(h => h.streak || 0)) : 0;
        const bestStreakEl = document.getElementById('best-streak');
        if (bestStreakEl) bestStreakEl.textContent = `${bestStreak} hari`;

        // Additional statistics
        const totalHabits = (window.Habits && Array.isArray(Habits.habits)) ? Habits.habits.length : 0;
        const habitsEl = document.getElementById('total-habits');
        if (habitsEl) habitsEl.textContent = totalHabits;

        const totalGoals = (window.Goals && Array.isArray(Goals.goals)) ? Goals.goals.length : 0;
        const goalsEl = document.getElementById('total-goals');
        if (goalsEl) goalsEl.textContent = totalGoals;

        const totalNotes = (window.Notes && Array.isArray(Notes.notes)) ? Notes.notes.length : 0;
        const notesEl = document.getElementById('total-notes');
        if (notesEl) notesEl.textContent = totalNotes;

        const totalJournals = (window.Journal && Array.isArray(Journal.entries)) ? Journal.entries.length : 0;
        const journalsEl = document.getElementById('total-journals');
        if (journalsEl) journalsEl.textContent = totalJournals;
    },

    calculateProductivityScore() {
        const today = new Date().toISOString().split('T')[0];

        // Factor 1: Todo completion rate (40%)
        const todayTodos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.date === today) : [];
        const completedTodos = todayTodos.filter(t => t.completed).length;
        const todoScore = todayTodos.length > 0 ? (completedTodos / todayTodos.length) * 40 : 0;

        // Factor 2: Habit completion (30%)
        const completedHabits = (window.Habits && Array.isArray(Habits.habits)) ? Habits.habits.filter(h => Array.isArray(h.completedDates) && h.completedDates.includes(today)).length : 0;
        const habitScore = (window.Habits && Habits.habits && Habits.habits.length > 0) ? (completedHabits / Habits.habits.length) * 30 : 0;

        // Factor 3: Pomodoro sessions (20%)
        const pomodoroScore = (window.Pomodoro && typeof Pomodoro.sessionCount === 'number') ? Math.min(Pomodoro.sessionCount * 2, 20) : 0;

        // Factor 4: Journal entries (10%)
        const todayJournal = (window.Journal && Array.isArray(Journal.entries)) ? Journal.entries.filter(j => j.date === today).length : 0;
        const journalScore = Math.min(todayJournal * 5, 10);

        return Math.round(todoScore + habitScore + pomodoroScore + journalScore);
    },

    getProductivityColor(score) {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 40) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    },

    setupCharts() {
        this.setupProductivityTrendChart();
        this.setupCategoryDistributionChart();
        this.setupMoodAnalysisChart();
        this.setupWeeklyComparisonChart();
        this.setupGoalProgressChart();
        this.setupHabitStreakChart();
        this.setupActivityTimelineChart();
    },

    // --- Productivity trend ---
    setupProductivityTrendChart() {
        const canvas = document.getElementById('productivity-trend');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.getProductivityTrendData();

        if (this.charts.productivityTrend) this.charts.productivityTrend.destroy();

        this.charts.productivityTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Skor Produktivitas',
                    data: data.values,
                    borderColor: this.theme === 'dark' ? 'rgb(99, 102, 241)' : 'rgb(79, 70, 229)',
                    backgroundColor: this.theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: this.theme === 'dark' ? 'rgb(99, 102, 241)' : 'rgb(79, 70, 229)',
                    pointBorderColor: this.theme === 'dark' ? '#1f2937' : '#fff',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) { 
                                return `Skor: ${context.parsed.y}%`; 
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            callback: value => `${value}%`,
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    getProductivityTrendData() {
        const days = this.currentFilters.dateRange;
        const labels = [];
        const values = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });

            labels.push(dayName);
            values.push(this.calculateDailyProductivity(dateStr));
        }

        return { labels, values };
    },

    calculateDailyProductivity(dateStr) {
        const activities = (window.Storage && typeof Storage.get === 'function') ? Storage.get('activities') || [] : (window.activities || []);
        const dayActivities = activities.filter(a => {
            const activityDate = a.timestamp ? a.timestamp.split('T')[0] : null;
            return activityDate === dateStr;
        });

        let score = 0;
        dayActivities.forEach(activity => {
            switch (activity.type) {
                case 'todo': score += 10; break;
                case 'habit': score += 5; break;
                case 'pomodoro': score += 15; break;
                case 'journal': score += 8; break;
                case 'goal': score += 12; break;
                default: break;
            }
        });

        return Math.min(score, 100);
    },

    // --- Category distribution (doughnut) ---
    setupCategoryDistributionChart() {
        const canvas = document.getElementById('category-distribution');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.getCategoryDistributionData();

        if (this.charts.categoryDistribution) this.charts.categoryDistribution.destroy();

        this.charts.categoryDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        this.theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                        this.theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.8)',
                        this.theme === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.8)',
                        this.theme === 'dark' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.8)',
                        this.theme === 'dark' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                        this.theme === 'dark' ? 'rgba(147, 51, 234, 0.8)' : 'rgba(147, 51, 234, 0.8)',
                        this.theme === 'dark' ? 'rgba(234, 179, 8, 0.8)' : 'rgba(234, 179, 8, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            padding: 15, 
                            font: { size: 12 },
                            color: this.theme === 'dark' ? '#d1d5db' : '#4b5563'
                        }
                    },
                    tooltip: {
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    getCategoryDistributionData() {
        // Get data from todos
        const todos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos : [];
        const byCategory = {};
        
        todos.forEach(t => {
            if (this.currentFilters.category !== 'all' && t.category !== this.currentFilters.category) {
                return;
            }
            const cat = t.category || 'Lainnya';
            byCategory[cat] = (byCategory[cat] || 0) + 1;
        });
        
        const labels = Object.keys(byCategory);
        const values = labels.map(l => byCategory[l]);
        return { labels, values };
    },

    // --- Mood analysis (bar) ---
    setupMoodAnalysisChart() {
        const canvas = document.getElementById('mood-analysis');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = (window.Journal && typeof Journal.getMoodData === 'function') ? Journal.getMoodData(this.currentFilters.dateRange) : {
            'very-happy': 0, happy: 0, neutral: 0, sad: 0, angry: 0
        };

        if (this.charts.moodAnalysis) this.charts.moodAnalysis.destroy();

        this.charts.moodAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sangat Bahagia', 'Bahagia', 'Netral', 'Sedih', 'Marah'],
                datasets: [{
                    label: 'Jumlah Hari',
                    data: [
                        data['very-happy'] || 0,
                        data['happy'] || 0,
                        data['neutral'] || 0,
                        data['sad'] || 0,
                        data['angry'] || 0
                    ],
                    backgroundColor: [
                        this.theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.8)',
                        this.theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                        this.theme === 'dark' ? 'rgba(107, 114, 128, 0.8)' : 'rgba(107, 114, 128, 0.8)',
                        this.theme === 'dark' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.8)',
                        this.theme === 'dark' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            stepSize: 1,
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    }
                }
            }
        });
    },

    // --- Weekly comparison (multi bar) ---
    setupWeeklyComparisonChart() {
        const canvas = document.getElementById('weekly-comparison');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.getWeeklyComparisonData();

        if (this.charts.weeklyComparison) this.charts.weeklyComparison.destroy();

        this.charts.weeklyComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Todo Selesai',
                        data: data.todos,
                        backgroundColor: this.theme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(79, 70, 229, 0.8)',
                        borderColor: this.theme === 'dark' ? 'rgba(99, 102, 241, 1)' : 'rgba(79, 70, 229, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kebiasaan Selesai',
                        data: data.habits,
                        backgroundColor: this.theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.8)',
                        borderColor: this.theme === 'dark' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Sesi Pomodoro',
                        data: data.pomodoro,
                        backgroundColor: this.theme === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(124, 58, 237, 0.8)',
                        borderColor: this.theme === 'dark' ? 'rgba(139, 92, 246, 1)' : 'rgba(124, 58, 237, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'top',
                        labels: {
                            color: this.theme === 'dark' ? '#d1d5db' : '#4b5563'
                        }
                    },
                    tooltip: {
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            stepSize: 1,
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    }
                }
            }
        });
    },

    getWeeklyComparisonData() {
        const weeks = Math.max(1, Math.floor(this.currentFilters.dateRange / 7));
        const labels = [];
        const todosData = [];
        const habitsData = [];
        const pomodoroData = [];

        for (let i = weeks - 1; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            labels.push(`Minggu ${weeks - i}`);

            // Todos completed this week
            const weekTodos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => {
                const todoDate = t.date ? t.date.split('T')[0] : null;
                return todoDate && todoDate >= startStr && todoDate <= endStr && t.completed;
            }).length : 0;
            todosData.push(weekTodos);

            // Habits completed this week
            let habitCompletions = 0;
            if (window.Habits && Array.isArray(Habits.habits)) {
                Habits.habits.forEach(habit => {
                    if (Array.isArray(habit.completedDates)) {
                        habit.completedDates.forEach(date => {
                            if (date >= startStr && date <= endStr) habitCompletions++;
                        });
                    }
                });
            }
            habitsData.push(habitCompletions);

            // Pomodoro sessions this week
            const weekPomodoros = (window.Pomodoro && Array.isArray(Pomodoro.statistics && Pomodoro.statistics.dailySessions))
                ? Pomodoro.statistics.dailySessions.filter(s => {
                    const sessionDate = s.date ? s.date.split('T')[0] : null;
                    return sessionDate && sessionDate >= startStr && sessionDate <= endStr;
                }).length
                : 0;
            pomodoroData.push(weekPomodoros);
        }

        return { labels, todos: todosData, habits: habitsData, pomodoro: pomodoroData };
    },

    // --- Goal progress (horizontal bar) ---
    setupGoalProgressChart() {
        const canvas = document.getElementById('goal-progress');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.getGoalProgressData();

        if (this.charts.goalProgress) this.charts.goalProgress.destroy();

        this.charts.goalProgress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Progress',
                    data: data.values,
                    backgroundColor: data.backgroundColor,
                    borderColor: data.borderColor,
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Progress: ${context.parsed.x}%`;
                            }
                        }
                    }
                },
                scales: { 
                    x: { 
                        beginAtZero: true, 
                        max: 100,
                        ticks: { 
                            stepSize: 25,
                            callback: value => `${value}%`,
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    },
                    y: {
                        ticks: {
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    }
                }
            }
        });
    },

    getGoalProgressData() {
        const goals = (window.Goals && Array.isArray(Goals.goals)) ? Goals.goals : [];
        const activeGoals = goals.filter(g => !g.completed);
        if (activeGoals.length === 0) {
            return { 
                labels: ['Tidak ada tujuan aktif'], 
                values: [0], 
                backgroundColor: [this.theme === 'dark' ? 'rgba(156, 163, 175, 0.8)' : 'rgba(209, 213, 219, 0.8)'], 
                borderColor: [this.theme === 'dark' ? 'rgba(107, 114, 128, 1)' : 'rgba(107, 114, 128, 1)'] 
            };
        }

        const labels = activeGoals.map(g => (g.title || 'Tujuan').substring(0, 20));
        const values = activeGoals.map(g => Math.min(Math.max(Number(g.progress) || 0, 0), 100));
        const backgroundColor = activeGoals.map(g => {
            const p = g.progress || 0;
            if (p >= 100) return this.theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.8)';
            if (p >= 75) return this.theme === 'dark' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(34, 197, 94, 0.8)';
            if (p >= 50) return this.theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)';
            if (p >= 25) return this.theme === 'dark' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(249, 115, 22, 0.8)';
            return this.theme === 'dark' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        });
        const borderColor = backgroundColor.map(c => c.replace(/0\.8\)$/, '1)'));
        return { labels, values, backgroundColor, borderColor };
    },

    // --- Habit streak chart ---
    setupHabitStreakChart() {
        const canvas = document.getElementById('habit-streak-chart');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.getHabitStreakData();

        if (this.charts.habitStreak) this.charts.habitStreak.destroy();

        this.charts.habitStreak = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Streak (hari)',
                    data: data.values,
                    backgroundColor: this.theme === 'dark' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.8)',
                    borderColor: this.theme === 'dark' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            stepSize: 5,
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    }
                }
            }
        });
    },

    getHabitStreakData() {
        const habits = (window.Habits && Array.isArray(Habits.habits)) ? Habits.habits : [];
        const activeHabits = habits.filter(h => h.active !== false);
        if (activeHabits.length === 0) {
            return { labels: ['Tidak ada kebiasaan aktif'], values: [0] };
        }

        // Get top 5 habits by streak
        const sortedHabits = activeHabits.sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 5);
        const labels = sortedHabits.map(h => h.name.substring(0, 15));
        const values = sortedHabits.map(h => h.streak || 0);

        return { labels, values };
    },

    // --- Activity timeline chart ---
    setupActivityTimelineChart() {
        const canvas = document.getElementById('activity-timeline');
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.getActivityTimelineData();

        if (this.charts.activityTimeline) this.charts.activityTimeline.destroy();

        this.charts.activityTimeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Todo',
                        data: data.todos,
                        borderColor: this.theme === 'dark' ? 'rgba(99, 102, 241, 1)' : 'rgba(79, 70, 229, 1)',
                        backgroundColor: this.theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Habits',
                        data: data.habits,
                        borderColor: this.theme === 'dark' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 1)',
                        backgroundColor: this.theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Pomodoro',
                        data: data.pomodoro,
                        borderColor: this.theme === 'dark' ? 'rgba(139, 92, 246, 1)' : 'rgba(124, 58, 237, 1)',
                        backgroundColor: this.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: this.theme === 'dark' ? '#d1d5db' : '#4b5563'
                        }
                    },
                    tooltip: {
                        backgroundColor: this.theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: this.theme === 'dark' ? '#f9fafb' : '#1f2937',
                        bodyColor: this.theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: this.theme === 'dark' ? '#374151' : '#d1d5db',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    },
                    x: {
                        ticks: {
                            color: this.theme === 'dark' ? '#9ca3af' : '#6b7280'
                        },
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                        }
                    }
                }
            }
        });
    },

    getActivityTimelineData() {
        const days = this.currentFilters.dateRange;
        const labels = [];
        const todos = [];
        const habits = [];
        const pomodoro = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });

            labels.push(dayName);

            // Count todos for this day
            const dayTodos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.date === dateStr).length : 0;
            todos.push(dayTodos);

            // Count habits completed for this day
            let dayHabits = 0;
            if (window.Habits && Array.isArray(Habits.habits)) {
                Habits.habits.forEach(habit => {
                    if (Array.isArray(habit.completedDates) && habit.completedDates.includes(dateStr)) {
                        dayHabits++;
                    }
                });
            }
            habits.push(dayHabits);

            // Count pomodoro sessions for this day
            let dayPomodoro = 0;
            if (window.Pomodoro && Array.isArray(Pomodoro.statistics && Pomodoro.statistics.dailySessions)) {
                dayPomodoro = Pomodoro.statistics.dailySessions.filter(s => s.date === dateStr).length;
            }
            pomodoro.push(dayPomodoro);
        }

        return { labels, todos, habits, pomodoro };
    },

    // --- Insights & recommendations ---
    getInsights() {
        const today = new Date().toISOString().split('T')[0];
        const thisWeek = this.getWeekData(today);
        const lastWeek = this.getWeekData(this.getDateNDaysAgo(today, 7));
        const insights = [];

        const thisWeekScore = this.calculateWeekProductivity(thisWeek);
        const lastWeekScore = this.calculateWeekProductivity(lastWeek);
        const productivityChange = thisWeekScore - lastWeekScore;

        if (productivityChange > 10) {
            insights.push({
                type: 'positive',
                title: 'Produktivitas Meningkat!',
                description: `Produktivitas minggu ini meningkat ${productivityChange}% dari minggu lalu`,
                icon: 'fa-chart-line',
                color: this.theme === 'dark' ? 'text-green-400' : 'text-green-600'
            });
        } else if (productivityChange < -10) {
            insights.push({
                type: 'warning',
                title: 'Produktivitas Menurun',
                description: `Produktivitas minggu ini menurun ${Math.abs(productivityChange)}% dari minggu lalu`,
                icon: 'fa-chart-line',
                color: this.theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            });
        }

        const mostProductiveDay = this.getMostProductiveDay(thisWeek);
        if (mostProductiveDay) {
            insights.push({
                type: 'info',
                title: 'Hari Paling Produktif',
                description: `${mostProductiveDay.day} adalah hari paling produktif minggu ini dengan ${mostProductiveDay.score} poin`,
                icon: 'fa-calendar-day',
                color: this.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            });
        }

        const habitInsights = this.getHabitInsights();
        insights.push(...habitInsights);

        const goalInsights = this.getGoalInsights();
        insights.push(...goalInsights);

        return insights;
    },

    getWeekData(dateStr) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - dayOfWeek);

        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            weekData.push(currentDate.toISOString().split('T')[0]);
        }
        return weekData;
    },

    getDateNDaysAgo(dateStr, n) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() - n);
        return date.toISOString().split('T')[0];
    },

    calculateWeekProductivity(weekData) {
        let totalScore = 0;
        weekData.forEach(dateStr => {
            totalScore += this.calculateDailyProductivity(dateStr);
        });
        return Math.round(totalScore / 7);
    },

    getMostProductiveDay(weekData) {
        let maxScore = 0;
        let mostProductiveDay = null;
        weekData.forEach(dateStr => {
            const score = this.calculateDailyProductivity(dateStr);
            if (score > maxScore) {
                maxScore = score;
                const date = new Date(dateStr);
                mostProductiveDay = { day: date.toLocaleDateString('id-ID', { weekday: 'long' }), date: dateStr, score };
            }
        });
        return mostProductiveDay;
    },

    getHabitInsights() {
        const insights = [];
        if (!window.Habits || !Array.isArray(Habits.habits) || Habits.habits.length === 0) return insights;

        // Most consistent habit
        const mostConsistent = Habits.habits.reduce((most, habit) => (habit.streak > (most.streak || 0) ? habit : most), { streak: 0 });
        if (mostConsistent && mostConsistent.streak >= 7) {
            insights.push({
                type: 'success',
                title: 'Kebiasaan Konsisten!',
                description: `"${mostConsistent.name}" adalah kebiasaan paling konsisten dengan streak ${mostConsistent.streak} hari`,
                icon: 'fa-fire',
                color: this.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            });
        }

        // Habits needing attention
        const neglectedHabits = Habits.habits.filter(habit => {
            const today = new Date().toISOString().split('T')[0];
            if (!Array.isArray(habit.completedDates) || habit.completedDates.length === 0) return false;
            const lastCompleted = habit.completedDates.slice().sort().pop();
            if (!lastCompleted) return false;
            const daysSinceLast = Math.floor((new Date() - new Date(lastCompleted)) / (1000 * 60 * 60 * 24));
            return daysSinceLast >= 3 && !habit.completedDates.includes(today);
        });

        if (neglectedHabits.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Kebiasaan Membutuh Perhatian',
                description: `${neglectedHabits.length} kebiasaan membutuhkan perhatian Anda`,
                icon: 'fa-exclamation-triangle',
                color: this.theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            });
        }

        return insights;
    },

    getGoalInsights() {
        const insights = [];
        if (!window.Goals || !Array.isArray(Goals.goals)) return insights;

        const upcomingDeadlines = Goals.goals
            .filter(g => !g.completed && g.deadline)
            .filter(g => {
                const dd = new Date(g.deadline);
                const now = new Date();
                const diff = (dd - now) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 7;
            })
            .slice(0, 3);

        if (upcomingDeadlines.length > 0) {
            insights.push({
                type: 'info',
                title: 'Deadline Mendekat',
                description: `${upcomingDeadlines.length} tujuan akan jatuh tempo dalam 7 hari ke depan`,
                icon: 'fa-clock',
                color: this.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            });
        }

        const overdueGoals = Goals.goals.filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date());
        if (overdueGoals.length > 0) {
            insights.push({
                type: 'error',
                title: 'Tujuan Terlewat',
                description: `${overdueGoals.length} tujuan telah terlewat deadline`,
                icon: 'fa-exclamation-circle',
                color: this.theme === 'dark' ? 'text-red-400' : 'text-red-600'
            });
        }

        const highProgressGoals = Goals.goals.filter(g => g.progress >= 75 && !g.completed);
        if (highProgressGoals.length > 0) {
            insights.push({
                type: 'success',
                title: 'Tujuan Hampir Selesai',
                description: `${highProgressGoals.length} tujuan hampir selesai (75%+)`,
                icon: 'fa-trophy',
                color: this.theme === 'dark' ? 'text-green-400' : 'text-green-600'
            });
        }

        return insights;
    },

    updateInsights() {
        const container = document.getElementById('analytics-insights');
        if (!container) return;

        const insights = this.getInsights();
        if (!insights || insights.length === 0) {
            container.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-chart-line text-4xl ${this.theme === 'dark' ? 'text-gray-400' : 'text-gray-300'} mb-4"></i>
          <p class="${this.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}">Belum ada insight tersedia</p>
        </div>`;
            return;
        }

        container.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 ${this.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}">Insight Mingguan</h3>
      <div class="space-y-3">
        ${insights.map(ins => `
          <div class="flex items-start p-3 rounded-lg border-l-4 ${this.getInsightBorderColor(ins.type)} ${this.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}">
            <div class="flex-shrink-0 mr-3">
              <i class="fas ${ins.icon} ${ins.color} text-lg"></i>
            </div>
            <div class="flex-grow">
              <h4 class="font-semibold ${this.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}">${ins.title}</h4>
              <p class="text-sm ${this.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}">${ins.description}</p>
            </div>
          </div>
        `).join('')}
      </div>`;
    },

    getInsightBorderColor(type) {
        switch (type) {
            case 'positive': return this.theme === 'dark' ? 'border-green-500' : 'border-green-500';
            case 'warning': return this.theme === 'dark' ? 'border-yellow-500' : 'border-yellow-500';
            case 'error': return this.theme === 'dark' ? 'border-red-500' : 'border-red-500';
            case 'success': return this.theme === 'dark' ? 'border-green-500' : 'border-green-500';
            case 'info': return this.theme === 'dark' ? 'border-blue-500' : 'border-blue-500';
            default: return this.theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
        }
    },

    updateRecommendations() {
        const container = document.getElementById('analytics-recommendations');
        if (!container) return;

        const recommendations = this.getRecommendations();
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-lightbulb text-4xl ${this.theme === 'dark' ? 'text-gray-400' : 'text-gray-300'} mb-4"></i>
          <p class="${this.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}">Belum ada rekomendasi tersedia</p>
        </div>`;
            return;
        }

        container.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 ${this.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}">Rekomendasi</h3>
      <div class="space-y-3">
        ${recommendations.map(rec => `
          <div class="flex items-start p-3 rounded-lg ${this.theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} border border-blue-200 dark:border-blue-800">
            <div class="flex-shrink-0 mr-3">
              <i class="fas ${rec.icon} text-blue-500 dark:text-blue-400 text-lg"></i>
            </div>
            <div class="flex-grow">
              <h4 class="font-semibold ${this.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}">${rec.title}</h4>
              <p class="text-sm ${this.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}">${rec.description}</p>
            </div>
          </div>
        `).join('')}
      </div>`;
    },

    getRecommendations() {
        const recommendations = [];
        
        // Based on productivity score
        const score = this.calculateProductivityScore();
        if (score < 50) {
            recommendations.push({
                title: 'Tingkatkan Produktivitas',
                description: 'Coba fokus pada 3 tugas penting setiap hari dan gunakan teknik Pomodoro untuk meningkatkan fokus',
                icon: 'fa-lightbulb'
            });
        } else if (score > 80) {
            recommendations.push({
                title: 'Pertahankan Kinerja',
                description: 'Anda sangat produktif! Pertahankan rutinitas yang baik dan tetap jaga keseimbangan kerja',
                icon: 'fa-thumbs-up'
            });
        }
        
        // Based on habits
        if (window.Habits && Array.isArray(Habits.habits)) {
            const inactiveHabits = Habits.habits.filter(h => !h.active || h.streak < 3);
            if (inactiveHabits.length > 0) {
                recommendations.push({
                    title: 'Aktifkan Kebiasaan',
                    description: `Coba aktifkan ${inactiveHabits.length} kebiasaan yang belum Anda mulai`,
                    icon: 'fa-check-circle'
                });
            }
        }
        
        // Based on goals
        if (window.Goals && Array.isArray(Goals.goals)) {
            const goalsWithoutProgress = Goals.goals.filter(g => g.progress < 10 && !g.completed);
            if (goalsWithoutProgress.length > 0) {
                recommendations.push({
                    title: 'Mulai Tujuan Anda',
                    description: `Anda memiliki ${goalsWithoutProgress.length} tujuan yang belum dimulai`,
                    icon: 'fa-bullseye'
                });
            }
        }
        
        return recommendations;
    },

    // --- Export functions ---
    exportToPDF() {
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            this.showNotification('Library jsPDF tidak tersedia. Silakan install terlebih dahulu.', 'error');
            return;
        }

        const jsPDFClass = window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || null;
        if (!jsPDFClass) {
            this.showNotification('jsPDF gagal diinisialisasi.', 'error');
            return;
        }

        const doc = new jsPDFClass('landscape', 'pt', 'a4');

        // Title
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text('Laporan Analytics Produktivitas', 40, 40);

        // Date range
        doc.setFontSize(11);
        doc.setTextColor(80);
        doc.text(`Periode: ${this.getDateRangeLabel()}`, 40, 60);

        let y = 90;
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Skor Produktivitas: ${this.calculateProductivityScore()}%`, 40, y); y += 16;
        doc.text(`Todo Selesai: ${(window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.completed).length : 0}`, 40, y); y += 16;
        doc.text(`Kebiasaan Aktif Hari Ini: ${(window.Habits && Array.isArray(Habits.habits)) ? Habits.habits.filter(h => Array.isArray(h.completedDates) && h.completedDates.includes(new Date().toISOString().split('T')[0])).length : 0}`, 40, y); y += 16;
        doc.text(`Sesi Pomodoro: ${(window.Pomodoro && typeof Pomodoro.sessionCount === 'number') ? Pomodoro.sessionCount : 0}`, 40, y); y += 16;
        doc.text(`Total Waktu Fokus: ${(window.Pomodoro && typeof Pomodoro.totalMinutes === 'number') ? Math.floor(Pomodoro.totalMinutes / 60) : 0} jam`, 40, y); y += 24;

        // Add charts as images
        const chartIds = ['productivity-trend', 'category-distribution', 'mood-analysis', 'goal-progress', 'weekly-comparison'];
        for (const id of chartIds) {
            const c = document.getElementById(id);
            if (c && c.toDataURL) {
                try {
                    const imgData = c.toDataURL('image/png');
                    if (y + 180 > 500) { doc.addPage(); y = 40; }
                    doc.addImage(imgData, 'PNG', 40, y, 500, 180);
                    y += 190;
                } catch (err) {
                    // skip chart if error
                }
            }
        }

        doc.save(`analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`);
        this.showNotification('Laporan analytics berhasil diekspor sebagai PDF', 'success');
    },

    exportToImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1200;
        canvas.height = 1600;

        // background
        ctx.fillStyle = this.theme === 'dark' ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = this.theme === 'dark' ? '#f9fafb' : '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Laporan Analytics', 50, 50);

        ctx.fillStyle = this.theme === 'dark' ? '#d1d5db' : '#4b5563';
        ctx.font = '16px Arial';
        ctx.fillText(`Periode: ${this.getDateRangeLabel()}`, 50, 80);

        ctx.fillStyle = this.theme === 'dark' ? '#9ca3af' : '#6b7280';
        ctx.font = '14px Arial';
        let y = 120;
        ctx.fillText(`Skor Produktivitas: ${this.calculateProductivityScore()}%`, 50, y); y += 26;
        ctx.fillText(`Todo Selesai: ${(window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.completed).length : 0}`, 50, y); y += 26;
        ctx.fillText(`Kebiasaan Aktif Hari Ini: ${(window.Habits && Array.isArray(Habits.habits)) ? Habits.habits.filter(h => Array.isArray(h.completedDates) && h.completedDates.includes(new Date().toISOString().split('T')[0])).length : 0}`, 50, y); y += 26;
        ctx.fillText(`Sesi Pomodoro: ${(window.Pomodoro && typeof Pomodoro.sessionCount === 'number') ? Pomodoro.sessionCount : 0}`, 50, y); y += 26;
        ctx.fillText(`Total Waktu Fokus: ${(window.Pomodoro && typeof Pomodoro.totalMinutes === 'number') ? Math.floor(Pomodoro.totalMinutes / 60) : 0} jam`, 50, y); y += 40;

        const chartIds = ['productivity-trend', 'category-distribution', 'mood-analysis', 'goal-progress', 'weekly-comparison'];
        for (const id of chartIds) {
            const c = document.getElementById(id);
            if (c && c instanceof HTMLCanvasElement) {
                try {
                    ctx.drawImage(c, 50, y, 600, 220);
                    y += 240;
                } catch (err) {
                    // skip if drawing fails
                }
            }
        }

        canvas.toBlob(blob => {
            if (!blob) {
                this.showNotification('Gagal membuat gambar.', 'error');
                return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            this.showNotification('Laporan analytics berhasil diekspor sebagai gambar', 'success');
        }, 'image/png');
    },

    exportToCSV() {
        // Create CSV content
        let csvContent = "Data,Produktivitas,Todo,Habits,Pomodoro\n";
        
        const days = this.currentFilters.dateRange;
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
            
            const productivity = this.calculateDailyProductivity(dateStr);
            const todoCount = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.date === dateStr).length : 0;
            const habitCount = (window.Habits && Array.isArray(Habits.habits)) ? Habits.habits.filter(h => Array.isArray(h.completedDates) && h.completedDates.includes(dateStr)).length : 0;
            const pomodoroCount = (window.Pomodoro && Array.isArray(Pomodoro.statistics && Pomodoro.statistics.dailySessions)) ? Pomodoro.statistics.dailySessions.filter(s => s.date === dateStr).length : 0;
            
            csvContent += `"${dayName}",${productivity},${todoCount},${habitCount},${pomodoroCount}\n`;
        }
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analytics-data-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        
        this.showNotification('Data analytics berhasil diekspor sebagai CSV', 'success');
    },

    getDateRangeLabel() {
        switch (this.currentFilters.dateRange) {
            case 7: return '7 Hari Terakhir';
            case 30: return '30 Hari Terakhir';
            case 90: return '3 Bulan Terakhir';
            case 365: return '1 Tahun Terakhir';
            default: return `${this.currentFilters.dateRange} Hari Terakhir`;
        }
    },

    // --- UI Enhancement Functions ---
    toggleWidget(widget) {
        const content = widget.querySelector('.collapsible-content');
        const icon = widget.querySelector('.widget-collapse i');
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('fa-minus');
            icon.classList.add('fa-plus');
        }
    },

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveSettings();
    },

    applyTheme() {
        const body = document.body;
        if (this.theme === 'dark') {
            body.classList.add('dark');
            body.classList.remove('light');
        } else {
            body.classList.remove('dark');
            body.classList.add('light');
        }
        
        // Re-render charts with new theme
        this.setupCharts();
    },

    toggleFocusMode() {
        const analyticsSection = document.getElementById('analytics');
        analyticsSection.classList.toggle('focus-mode');
    },

    openCustomReportBuilder() {
        const modal = document.getElementById('custom-report-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    openAnalyticsSettings() {
        const modal = document.getElementById('analytics-settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    openAnalyticsHelp() {
        const modal = document.getElementById('analytics-help-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    closeCustomReportBuilder() {
        const modal = document.getElementById('custom-report-builder-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    closeAnalyticsSettings() {
        const modal = document.getElementById('analytics-settings-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    closeAnalyticsHelp() {
        const modal = document.getElementById('analytics-help-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    generateCustomReport() {
        const reportName = document.getElementById('report-name').value || 'Laporan Kustom';
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;

        // Get selected data types
        const includeProductivity = document.getElementById('include-productivity').checked;
        const includeTodos = document.getElementById('include-todos').checked;
        const includeHabits = document.getElementById('include-habits').checked;
        const includeGoals = document.getElementById('include-goals').checked;
        const includePomodoro = document.getElementById('include-pomodoro').checked;

        // Get export format
        const exportFormat = document.querySelector('input[name="export-format"]:checked').value;

        // Generate report based on selections
        if (exportFormat === 'pdf') {
            this.exportToPDF();
        } else if (exportFormat === 'csv') {
            this.exportToCSV();
        } else if (exportFormat === 'image') {
            this.exportToImage();
        }

        this.showNotification(`Laporan "${reportName}" berhasil dibuat`, 'success');
        this.closeCustomReportBuilder();
    },

    saveAnalyticsSettings() {
        const defaultDateRange = document.getElementById('default-date-range').value;
        const defaultTheme = document.getElementById('default-theme').value;
        const autoRefresh = document.getElementById('auto-refresh').checked;
        const notifications = document.getElementById('analytics-notifications').checked;

        // Save settings
        const settings = {
            dateRange: parseInt(defaultDateRange),
            theme: defaultTheme,
            autoRefresh: autoRefresh,
            notifications: notifications
        };

        localStorage.setItem('analyticsSettings', JSON.stringify(settings));

        // Apply settings
        this.currentFilters.dateRange = parseInt(defaultDateRange);
        this.dateRange = parseInt(defaultDateRange);

        if (defaultTheme !== this.theme) {
            this.theme = defaultTheme;
            this.applyTheme();
        }

        this.isRealTime = autoRefresh;

        this.showNotification('Pengaturan analytics berhasil disimpan', 'success');
        this.closeAnalyticsSettings();
    },

    resetAnalyticsSettings() {
        // Reset to default values
        document.getElementById('default-date-range').value = 30;
        document.getElementById('default-theme').value = 'light';
        document.getElementById('auto-refresh').checked = true;
        document.getElementById('analytics-notifications').checked = true;

        this.showNotification('Pengaturan analytics berhasil direset', 'success');
    },

    saveWidgetOrder() {
        // Save the order of widgets in localStorage
        const widgets = document.querySelectorAll('.analytics-widget');
        const order = Array.from(widgets).map(w => w.id);
        localStorage.setItem('analyticsWidgetOrder', JSON.stringify(order));
    },

    backupAnalyticsData() {
        const backupData = {
            dateRange: this.currentFilters.dateRange,
            theme: this.theme,
            productivityScore: this.calculateProductivityScore(),
            completedTodos: (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.completed).length : 0,
            focusHours: (window.Pomodoro && typeof Pomodoro.totalMinutes === 'number') ? Math.floor(Pomodoro.totalMinutes / 60) : 0,
            bestStreak: (window.Habits && Array.isArray(Habits.habits)) ? Math.max(0, ...Habits.habits.map(h => h.streak || 0)) : 0,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analytics-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        this.showNotification('Data analytics berhasil di-backup', 'success');
    },

    restoreAnalyticsData() {
        // Create file input to allow user to select backup file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.dateRange) {
                        this.currentFilters.dateRange = data.dateRange;
                        this.dateRange = data.dateRange;
                    }
                    if (data.theme) {
                        this.theme = data.theme;
                        this.applyTheme();
                    }
                    
                    this.render();
                    this.saveSettings();
                    this.showNotification('Data analytics berhasil dipulihkan', 'success');
                } catch (error) {
                    this.showNotification('Gagal memulihkan data: format file tidak valid', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    updateLoadingState(loading) {
        const loadingElements = document.querySelectorAll('.analytics-loading');
        loadingElements.forEach(el => {
            if (loading) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    },

    loadSettings() {
        const saved = localStorage.getItem('analyticsSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.currentFilters.dateRange = settings.dateRange || 30;
                this.dateRange = settings.dateRange || 30;
                this.theme = settings.theme || 'light';
            } catch (e) {
                console.error('Error loading analytics settings:', e);
            }
        }
    },

    saveSettings() {
        const settings = {
            dateRange: this.currentFilters.dateRange,
            theme: this.theme
        };
        localStorage.setItem('analyticsSettings', JSON.stringify(settings));
    },

    showNotification(message, type = 'success') {
        if (typeof window.App !== 'undefined' && typeof App.showNotification === 'function') {
            App.showNotification(message, type);
            return;
        }
        // fallback sederhana: console
        console.log(`[${type}] ${message}`);
    },

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        // Properly destroy all Chart.js instances to prevent memory leaks
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
};