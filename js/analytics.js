// Enhanced analytics functionality — perbaikan dan refactor
const Analytics = {
    charts: {},
    dateRange: 30, // hari
    refreshInterval: null,

    init() {
        this.setupEventListeners();
        this.render();
        this.setupAutoRefresh();
        this.setupExportOptions();
    },

    setupEventListeners() {
        const rangeSelect = document.getElementById('date-range');
        if (rangeSelect) {
            rangeSelect.addEventListener('change', (e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) {
                    this.dateRange = v;
                    this.render();
                }
            });
        }

        const exportPdfBtn = document.getElementById('export-pdf');
        const exportImageBtn = document.getElementById('export-image');
        if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        if (exportImageBtn) exportImageBtn.addEventListener('click', () => this.exportToImage());

        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.render();
                this.showNotification('Analytics berhasil diperbarui', 'success');
            });
        }
    },

    setupAutoRefresh() {
        // Auto-refresh setiap 5 menit
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => this.render(), 5 * 60 * 1000);
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
        });
    },

    render() {
        this.updateStatisticsCards();
        this.setupCharts();
        this.updateInsights();
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
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    },

    setupCharts() {
        this.setupProductivityTrendChart();
        this.setupCategoryDistributionChart();
        this.setupMoodAnalysisChart();
        this.setupWeeklyComparisonChart();
        this.setupGoalProgressChart();
    },

    // --- Productivity trend ---
    setupProductivityTrendChart() {
        const canvas = document.getElementById('productivity-trend');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const data = this.getProductivityTrendData();

        if (this.charts.productivityTrend) this.charts.productivityTrend.destroy();

        this.charts.productivityTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Skor Produktivitas',
                    data: data.values,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) { return `Skor: ${context.parsed.y}`; }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: value => `${value}%` }
                    }
                }
            }
        });
    },

    getProductivityTrendData() {
        const days = this.dateRange;
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
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const data = this.getCategoryDistributionData();

        if (this.charts.categoryDistribution) this.charts.categoryDistribution.destroy();

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
                        position: 'bottom',
                        labels: { padding: 15, font: { size: 12 } }
                    },
                    tooltip: {
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
        // contoh sederhana: ambil dari Todo atau sumber lain
        const todos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos : [];
        const byCategory = {};
        todos.forEach(t => {
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
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const data = (window.Journal && typeof Journal.getMoodData === 'function') ? Journal.getMoodData(this.dateRange) : {
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
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(107, 114, 128, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },

    // --- Weekly comparison (multi bar) ---
    setupWeeklyComparisonChart() {
        const canvas = document.getElementById('weekly-comparison');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

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
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kebiasaan Selesai',
                        data: data.habits,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Sesi Pomodoro',
                        data: data.pomodoro,
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    },

    getWeeklyComparisonData() {
        const weeks = Math.max(1, Math.floor(this.dateRange / 7));
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

            // Todos selesai minggu ini
            const weekTodos = (window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => {
                const todoDate = t.date ? t.date.split('T')[0] : null;
                return todoDate && todoDate >= startStr && todoDate <= endStr && t.completed;
            }).length : 0;
            todosData.push(weekTodos);

            // Habits selesai minggu ini
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

            // Pomodoro sessions minggu ini
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

    // --- Goal progress (bar) ---
    setupGoalProgressChart() {
        const canvas = document.getElementById('goal-progress');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

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
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    },

    getGoalProgressData() {
        const goals = (window.Goals && Array.isArray(Goals.goals)) ? Goals.goals : [];
        const activeGoals = goals.filter(g => !g.completed);
        if (activeGoals.length === 0) {
            return { labels: ['Tidak ada tujuan aktif'], values: [0], backgroundColor: ['rgba(209, 213, 219, 0.8)'], borderColor: ['rgba(107, 114, 128,1)'] };
        }

        const labels = activeGoals.map(g => (g.title || 'Tujuan').substring(0, 20));
        const values = activeGoals.map(g => Math.min(Math.max(Number(g.progress) || 0, 0), 100));
        const backgroundColor = activeGoals.map(g => {
            const p = g.progress || 0;
            if (p >= 100) return 'rgba(16, 185, 129, 0.8)';
            if (p >= 75) return 'rgba(34, 197, 94, 0.8)';
            if (p >= 50) return 'rgba(59, 130, 246, 0.8)';
            if (p >= 25) return 'rgba(249, 115, 22, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
        });
        const borderColor = backgroundColor.map(c => c.replace(/0\.8\)$/, '1)'));
        return { labels, values, backgroundColor, borderColor };
    },

    // --- Insights & helpers ---
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
                color: 'text-green-600'
            });
        } else if (productivityChange < -10) {
            insights.push({
                type: 'warning',
                title: 'Produktivitas Menurun',
                description: `Produktivitas minggu ini menurun ${Math.abs(productivityChange)}% dari minggu lalu`,
                icon: 'fa-chart-line',
                color: 'text-yellow-600'
            });
        }

        const mostProductiveDay = this.getMostProductiveDay(thisWeek);
        if (mostProductiveDay) {
            insights.push({
                type: 'info',
                title: 'Hari Paling Produktif',
                description: `${mostProductiveDay.day} adalah hari paling produktif minggu ini dengan ${mostProductiveDay.score} poin`,
                icon: 'fa-calendar-day',
                color: 'text-blue-600'
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
                color: 'text-orange-600'
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
                color: 'text-yellow-600'
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
                color: 'text-blue-600'
            });
        }

        const overdueGoals = Goals.goals.filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date());
        if (overdueGoals.length > 0) {
            insights.push({
                type: 'error',
                title: 'Tujuan Terlewat',
                description: `${overdueGoals.length} tujuan telah terlewat deadline`,
                icon: 'fa-exclamation-circle',
                color: 'text-red-600'
            });
        }

        const highProgressGoals = Goals.goals.filter(g => g.progress >= 75 && !g.completed);
        if (highProgressGoals.length > 0) {
            insights.push({
                type: 'success',
                title: 'Tujuan Hampir Selesai',
                description: `${highProgressGoals.length} tujuan hampir selesai (75%+)`,
                icon: 'fa-trophy',
                color: 'text-green-600'
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
          <i class="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">Belum ada insight tersedia</p>
        </div>`;
            return;
        }

        container.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 text-gray-800">Insight Mingguan</h3>
      <div class="space-y-3">
        ${insights.map(ins => `
          <div class="flex items-start p-3 rounded-lg border-l-4 ${this.getInsightBorderColor(ins.type)}">
            <div class="flex-shrink-0 mr-3">
              <i class="fas ${ins.icon} ${ins.color} text-lg"></i>
            </div>
            <div class="flex-grow">
              <h4 class="font-semibold text-gray-800">${ins.title}</h4>
              <p class="text-sm text-gray-600">${ins.description}</p>
            </div>
          </div>
        `).join('')}
      </div>`;
    },

    getInsightBorderColor(type) {
        switch (type) {
            case 'positive': return 'border-green-500';
            case 'warning': return 'border-yellow-500';
            case 'error': return 'border-red-500';
            case 'success': return 'border-green-500';
            case 'info': return 'border-blue-500';
            default: return 'border-gray-300';
        }
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

        const doc = new jsPDFClass('portrait', 'pt', 'a4');

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

        // Add charts as images (jika tersedia)
        const chartIds = ['productivity-trend', 'category-distribution', 'mood-analysis'];
        for (const id of chartIds) {
            const c = document.getElementById(id);
            if (c && c.toDataURL) {
                try {
                    const imgData = c.toDataURL('image/png');
                    if (y + 180 > 800) { doc.addPage(); y = 40; }
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
        canvas.height = 1600; // panjang dibuat lebih besar untuk menampung content

        // background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Laporan Analytics', 50, 50);

        ctx.fillStyle = '#4b5563';
        ctx.font = '16px Arial';
        ctx.fillText(`Periode: ${this.getDateRangeLabel()}`, 50, 80);

        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Arial';
        let y = 120;
        ctx.fillText(`Skor Produktivitas: ${this.calculateProductivityScore()}%`, 50, y); y += 26;
        ctx.fillText(`Todo Selesai: ${(window.Todo && Array.isArray(Todo.todos)) ? Todo.todos.filter(t => t.completed).length : 0}`, 50, y); y += 26;
        ctx.fillText(`Kebiasaan Aktif Hari Ini: ${(window.Habits && Array.isArray(Habits.habits)) ? Habits.habits.filter(h => Array.isArray(h.completedDates) && h.completedDates.includes(new Date().toISOString().split('T')[0])).length : 0}`, 50, y); y += 26;
        ctx.fillText(`Sesi Pomodoro: ${(window.Pomodoro && typeof Pomodoro.sessionCount === 'number') ? Pomodoro.sessionCount : 0}`, 50, y); y += 26;
        ctx.fillText(`Total Waktu Fokus: ${(window.Pomodoro && typeof Pomodoro.totalMinutes === 'number') ? Math.floor(Pomodoro.totalMinutes / 60) : 0} jam`, 50, y); y += 40;

        const chartIds = ['productivity-trend', 'category-distribution', 'mood-analysis'];
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

    getDateRangeLabel() {
        switch (this.dateRange) {
            case 7: return '7 Hari Terakhir';
            case 30: return '30 Hari Terakhir';
            case 90: return '3 Bulan Terakhir';
            default: return `${this.dateRange} Hari Terakhir`;
        }
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

