// Enhanced dashboard functionality
const Dashboard = {
    charts: {},
    widgets: {},

    init() {
        this.initializeWidgets();
        this.updateDashboard();
        this.setupCharts();
        this.setupRealTimeUpdates();
        this.setupKeyboardShortcuts();
    },

    initializeWidgets() {
        // Initialize quick stats widget
        this.widgets.quickStats = {
            todos: { element: document.getElementById('today-todos-count'), value: 0 },
            notes: { element: document.getElementById('notes-count'), value: 0 },
            habits: { element: document.getElementById('active-habits-count'), value: 0 },
            achievements: { element: document.getElementById('achievements-count'), value: 0 }
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
    },

    updateQuickStats() {
        // Update todos
        const today = new Date().toISOString().split('T')[0];
        const todayTodos = Todo.todos.filter(t => t.date === today);
        const completedToday = todayTodos.filter(t => t.completed).length;

        if (this.widgets.quickStats.todos.element) {
            this.widgets.quickStats.todos.element.textContent = `${completedToday}/${todayTodos.length}`;
            this.widgets.quickStats.todos.value = completedToday;
        }

        // Update notes
        if (this.widgets.quickStats.notes.element) {
            this.widgets.quickStats.notes.element.textContent = Notes.notes.length;
            this.widgets.quickStats.notes.value = Notes.notes.length;
        }

        // Update habits
        const activeHabits = Habits.habits.length;
        if (this.widgets.quickStats.habits.element) {
            this.widgets.quickStats.habits.element.textContent = activeHabits;
            this.widgets.quickStats.habits.value = activeHabits;
        }

        // Update achievements
        const unlockedAchievements = Achievements.getUnlockedCount();
        if (this.widgets.quickStats.achievements.element) {
            this.widgets.quickStats.achievements.element.textContent = unlockedAchievements;
            this.widgets.quickStats.achievements.value = unlockedAchievements;
        }
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

    updatePriorityTodos() {
        const priorityTodosEl = document.getElementById('priority-todos');
        if (!priorityTodosEl) return;

        // Pastikan Todo.todos ada dan merupakan array
        if (!Todo.todos || !Array.isArray(Todo.todos)) {
            priorityTodosEl.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-circle text-4xl text-yellow-500 mb-2"></i>
                <p class="text-gray-500">Data todo tidak tersedia</p>
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
            <div class="text-center py-4">
                <i class="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
                <p class="text-gray-500">Tidak ada todo prioritas</p>
            </div>
        `;
            return;
        }

        priorityTodosEl.innerHTML = '';

        priorityTodos.forEach(todo => {
            const todoEl = document.createElement('div');
            todoEl.className = `todo-item ${todo.completed ? 'todo-completed' : ''} todo-priority-${todo.priority} p-3 border-b border-gray-200`;

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
                    <p class="${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'} font-medium">
                        ${Utils.escapeHtml(todo.text)}
                    </p>
                    <div class="flex items-center space-x-2 text-sm">
                        ${priorityIcons[todo.priority]}
                        <span class="${isOverdue ? 'text-red-600 font-semibold' : isDueToday ? 'text-yellow-600' : 'text-gray-500'}">
                            ${this.formatDueDate(todo.date)}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2 ml-4">
                <button class="edit-todo text-blue-500 hover:text-blue-700 transition" data-id="${todo.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-todo text-red-500 hover:text-red-700 transition" data-id="${todo.id}" title="Hapus">
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
                <div class="text-center py-4">
                    <i class="fas fa-trophy text-4xl text-yellow-500 mb-2"></i>
                    <p class="text-gray-500">Semua kebiasaan hari ini selesai!</p>
                </div>
            `;
            return;
        }

        todayHabitsEl.innerHTML = '';

        incompleteHabits.forEach(habit => {
            const habitEl = document.createElement('div');
            habitEl.className = 'habit-card';

            const streakClass = this.getStreakClass(habit.streak);
            const completionRate = this.calculateHabitCompletionRate(habit);

            habitEl.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex-grow">
                        <h4 class="font-semibold text-gray-800">${habit.name}</h4>
                        <div class="flex items-center space-x-2 mt-1">
                            ${habit.streak > 0 ? `
                                <span class="habit-streak ${streakClass}">
                                    <i class="fas fa-fire mr-1"></i>${habit.streak} hari
                                </span>
                            ` : ''}
                            <span class="text-sm text-gray-500">${completionRate}% selesai</span>
                        </div>
                    </div>
                    <button class="complete-habit btn btn-success btn-sm" data-id="${habit.id}">
                        <i class="fas fa-check mr-1"></i> Selesai
                    </button>
                </div>
                <div class="mt-3">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionRate}%"></div>
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
            deadlinesEl.innerHTML = '<p class="text-gray-500">Tidak ada deadline mendatang</p>';
            return;
        }

        deadlinesEl.innerHTML = '';

        upcomingDeadlines.forEach(item => {
            const deadlineEl = document.createElement('div');
            deadlineEl.className = 'flex items-center justify-between p-2 hover:bg-gray-50 rounded';

            const daysLeft = this.calculateDaysLeft(item.date);
            const urgencyClass = daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-gray-600';

            deadlineEl.innerHTML = `
                <div>
                    <p class="font-medium">${item.title}</p>
                    <p class="text-sm ${urgencyClass}">${daysLeft} hari lagi</p>
                </div>
                <i class="fas fa-calendar-alt text-gray-400"></i>
            `;

            deadlinesEl.appendChild(deadlineEl);
        });
    },

    updateRecentActivity() {
        const activityEl = document.getElementById('recent-activity');
        if (!activityEl) return;

        const activities = this.getRecentActivities();

        if (activities.length === 0) {
            activityEl.innerHTML = '<p class="text-gray-500">Belum ada aktivitas</p>';
            return;
        }

        activityEl.innerHTML = '';

        activities.forEach(activity => {
            const activityEl = document.createElement('div');
            activityEl.className = 'flex items-center space-x-3 p-2 hover:bg-gray-50 rounded';

            const iconClass = this.getActivityIconClass(activity.type);
            const timeAgo = this.formatTimeAgo(activity.timestamp);

            activityEl.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <i class="fas ${iconClass} text-indigo-600 text-sm"></i>
                </div>
                <div class="flex-grow">
                    <p class="text-sm font-medium">${activity.description}</p>
                    <p class="text-xs text-gray-500">${timeAgo}</p>
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
        });
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
        if (streak >= 100) return 'habit-streak-platinum';
        if (streak >= 50) return 'habit-streak-gold';
        if (streak >= 21) return 'habit-streak-silver';
        if (streak >= 7) return 'habit-streak-bronze';
        return '';
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
        Todo.todos.forEach(todo => {
            if (!todo.completed && new Date(todo.date) <= nextWeek) {
                deadlines.push({
                    title: todo.text,
                    date: todo.date,
                    type: 'todo'
                });
            }
        });

        // Add goal deadlines
        Goals.goals.forEach(goal => {
            if (!goal.completed && goal.deadline && new Date(goal.deadline) <= nextWeek) {
                deadlines.push({
                    title: goal.title,
                    date: goal.deadline,
                    type: 'goal'
                });
            }
        });

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
        Todo.todos.forEach(todo => {
            if (todo.completedAt && new Date(todo.completedAt) >= oneWeekAgo) {
                activities.push({
                    type: 'todo',
                    description: `Menyelesaikan todo: ${todo.text}`,
                    timestamp: todo.completedAt
                });
            }
        });

        // Add note activities
        Notes.notes.forEach(note => {
            if (new Date(note.createdAt) >= oneWeekAgo) {
                activities.push({
                    type: 'note',
                    description: `Membuat catatan: ${note.title}`,
                    timestamp: note.createdAt
                });
            }
        });

        // Add habit activities
        Habits.habits.forEach(habit => {
            habit.completedDates.forEach(date => {
                if (new Date(date) >= oneWeekAgo) {
                    activities.push({
                        type: 'habit',
                        description: `Menyelesaikan kebiasaan: ${habit.name}`,
                        timestamp: date
                    });
                }
            });
        });

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
        const pomodoroScore = Math.min(Pomodoro.sessionCount * 2, 20);

        // Factor 4: Notes/Journal created (10%)
        const todayNotes = Notes.notes.filter(n => n.createdAt.split('T')[0] === today).length;
        const todayJournal = Journal.entries.filter(j => j.date === today).length;
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
                Todo.toggleTodo(parseInt(checkbox.dataset.id));
                this.updatePriorityTodos();
            });
        });

        const editBtns = container.querySelectorAll('.edit-todo');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Todo.editTodo(parseInt(btn.dataset.id));
            });
        });

        const deleteBtns = container.querySelectorAll('.delete-todo');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Todo.deleteTodo(parseInt(btn.dataset.id));
                this.updatePriorityTodos();
            });
        });
    },

    attachHabitEventListeners(container) {
        const completeBtns = container.querySelectorAll('.complete-habit');
        completeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Habits.toggleHabit(parseInt(btn.dataset.id));
                this.updateTodayHabits();
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
            <blockquote class="text-lg italic text-gray-700">
                "${randomQuote.text}"
            </blockquote>
            <cite class="text-sm text-gray-500">- ${randomQuote.author}</cite>
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
                        <p class="text-2xl font-bold">28°C</p>
                        <p class="text-gray-600">Cerah Berawan</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-600">Jakarta</p>
                    <p class="text-xs text-gray-500">Diperbarui: sekarang</p>
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