// Achievement system
const Achievements = {
    achievements: [
        // Todo Achievements
        {
            id: 'first-todo',
            title: 'Todo Pertama',
            description: 'Selesaikan todo pertama Anda',
            icon: 'fa-check',
            category: 'todo',
            condition: (data) => data.completedTodos >= 1,
            unlocked: false,
            points: 10
        },
        {
            id: 'todo-warrior',
            title: 'Prajurit Todo',
            description: 'Selesaikan 10 todo',
            icon: 'fa-tasks',
            category: 'todo',
            condition: (data) => data.completedTodos >= 10,
            unlocked: false,
            points: 25
        },
        {
            id: 'todo-master',
            title: 'Master Todo',
            description: 'Selesaikan 50 todo',
            icon: 'fa-trophy',
            category: 'todo',
            condition: (data) => data.completedTodos >= 50,
            unlocked: false,
            points: 50
        },
        {
            id: 'todo-legend',
            title: 'Legenda Todo',
            description: 'Selesaikan 100 todo',
            icon: 'fa-crown',
            category: 'todo',
            condition: (data) => data.completedTodos >= 100,
            unlocked: false,
            points: 100
        },

        // Habit Achievements
        {
            id: 'habit-starter',
            title: 'Pemula Kebiasaan',
            description: 'Buat kebiasaan pertama Anda',
            icon: 'fa-seedling',
            category: 'habit',
            condition: (data) => data.totalHabits >= 1,
            unlocked: false,
            points: 10
        },
        {
            id: 'habit-keeper',
            title: 'Penjaga Kebiasaan',
            description: 'Pertahankan kebiasaan selama 7 hari berturut-turut',
            icon: 'fa-calendar-check',
            category: 'habit',
            condition: (data) => data.maxStreak >= 7,
            unlocked: false,
            points: 25
        },
        {
            id: 'habit-champion',
            title: 'Juara Kebiasaan',
            description: 'Pertahankan kebiasaan selama 30 hari berturut-turut',
            icon: 'fa-medal',
            category: 'habit',
            condition: (data) => data.maxStreak >= 30,
            unlocked: false,
            points: 50
        },
        {
            id: 'habit-master',
            title: 'Master Kebiasaan',
            description: 'Pertahankan kebiasaan selama 100 hari berturut-turut',
            icon: 'fa-fire',
            category: 'habit',
            condition: (data) => data.maxStreak >= 100,
            unlocked: false,
            points: 100
        },

        // Pomodoro Achievements
        {
            id: 'pomodoro-beginner',
            title: 'Pemula Pomodoro',
            description: 'Selesaikan 5 sesi Pomodoro',
            icon: 'fa-clock',
            category: 'pomodoro',
            condition: (data) => data.totalSessions >= 5,
            unlocked: false,
            points: 10
        },
        {
            id: 'pomodoro-expert',
            title: 'Ahli Pomodoro',
            description: 'Selesaikan 25 sesi Pomodoro',
            icon: 'fa-hourglass-half',
            category: 'pomodoro',
            condition: (data) => data.totalSessions >= 25,
            unlocked: false,
            points: 25
        },
        {
            id: 'pomodoro-master',
            title: 'Master Pomodoro',
            description: 'Selesaikan 100 sesi Pomodoro',
            icon: 'fa-hourglass',
            category: 'pomodoro',
            condition: (data) => data.totalSessions >= 100,
            unlocked: false,
            points: 50
        },
        {
            id: 'pomodoro-marathon',
            title: 'Maraton Pomodoro',
            description: 'Selesaikan 10 jam fokus total',
            icon: 'fa-stopwatch',
            category: 'pomodoro',
            condition: (data) => data.totalMinutes >= 600,
            unlocked: false,
            points: 50
        },

        // Notes Achievements
        {
            id: 'note-taker',
            title: 'Pencatat',
            description: 'Buat 5 catatan',
            icon: 'fa-sticky-note',
            category: 'notes',
            condition: (data) => data.totalNotes >= 5,
            unlocked: false,
            points: 10
        },
        {
            id: 'note-writer',
            title: 'Penulis',
            description: 'Buat 20 catatan',
            icon: 'fa-pen',
            category: 'notes',
            condition: (data) => data.totalNotes >= 20,
            unlocked: false,
            points: 25
        },
        {
            id: 'note-author',
            title: 'Penulis Produktif',
            description: 'Buat 50 catatan',
            icon: 'fa-book',
            category: 'notes',
            condition: (data) => data.totalNotes >= 50,
            unlocked: false,
            points: 50
        },

        // Journal Achievements
        {
            id: 'journal-beginner',
            title: 'Pemula Journal',
            description: 'Tulis journal pertama Anda',
            icon: 'fa-book-open',
            category: 'journal',
            condition: (data) => data.totalJournalEntries >= 1,
            unlocked: false,
            points: 10
        },
        {
            id: 'journal-writer',
            title: 'Penulis Journal',
            description: 'Tulis 7 journal',
            icon: 'fa-journal-whills',
            category: 'journal',
            condition: (data) => data.totalJournalEntries >= 7,
            unlocked: false,
            points: 25
        },
        {
            id: 'journal-regular',
            title: 'Journaler Rutin',
            description: 'Tulis journal selama 7 hari berturut-turut',
            icon: 'fa-calendar-day',
            category: 'journal',
            condition: (data) => data.journalStreak >= 7,
            unlocked: false,
            points: 50
        },
        {
            id: 'journal-master',
            title: 'Master Journal',
            description: 'Tulis 30 journal',
            icon: 'fa-feather',
            category: 'journal',
            condition: (data) => data.totalJournalEntries >= 30,
            unlocked: false,
            points: 50
        },

        // Goals Achievements
        {
            id: 'goal-setter',
            title: 'Penentu Tujuan',
            description: 'Buat tujuan pertama Anda',
            icon: 'fa-bullseye',
            category: 'goals',
            condition: (data) => data.totalGoals >= 1,
            unlocked: false,
            points: 10
        },
        {
            id: 'goal-achiever',
            title: 'Pencapai Tujuan',
            description: 'Selesaikan tujuan pertama Anda',
            icon: 'fa-flag-checkered',
            category: 'goals',
            condition: (data) => data.completedGoals >= 1,
            unlocked: false,
            points: 25
        },
        {
            id: 'goal-planner',
            title: 'Perencana Tujuan',
            description: 'Buat 5 tujuan',
            icon: 'fa-tasks',
            category: 'goals',
            condition: (data) => data.totalGoals >= 5,
            unlocked: false,
            points: 25
        },
        {
            id: 'goal-master',
            title: 'Master Tujuan',
            description: 'Selesaikan 5 tujuan',
            icon: 'fa-trophy',
            category: 'goals',
            condition: (data) => data.completedGoals >= 5,
            unlocked: false,
            points: 50
        },

        // Calendar Achievements
        {
            id: 'calendar-user',
            title: 'Pengguna Kalender',
            description: 'Gunakan fitur kalender',
            icon: 'fa-calendar-alt',
            category: 'calendar',
            condition: (data) => data.usedCalendar,
            unlocked: false,
            points: 10
        },
        {
            id: 'calendar-planner',
            title: 'Perencana Kalender',
            description: 'Lihat agenda untuk 7 hari berbeda',
            icon: 'fa-calendar-week',
            category: 'calendar',
            condition: (data) => data.calendarDaysViewed >= 7,
            unlocked: false,
            points: 25
        },

        // Analytics Achievements
        {
            id: 'analytics-viewer',
            title: 'Penganalisis Data',
            description: 'Lihat halaman analytics',
            icon: 'fa-chart-line',
            category: 'analytics',
            condition: (data) => data.viewedAnalytics,
            unlocked: false,
            points: 10
        },
        {
            id: 'data-driven',
            title: 'Berdasarkan Data',
            description: 'Lihat analytics 5 kali',
            icon: 'fa-chart-pie',
            category: 'analytics',
            condition: (data) => data.analyticsViews >= 5,
            unlocked: false,
            points: 25
        },

        // Quick Capture Achievements
        {
            id: 'quick-capture-user',
            title: 'Penangkap Cepat',
            description: 'Gunakan fitur quick capture',
            icon: 'fa-bolt',
            category: 'productivity',
            condition: (data) => data.usedQuickCapture,
            unlocked: false,
            points: 10
        },
        {
            id: 'idea-collector',
            title: 'Pengumpul Ide',
            description: 'Gunakan quick capture 10 kali',
            icon: 'fa-lightbulb',
            category: 'productivity',
            condition: (data) => data.quickCaptureCount >= 10,
            unlocked: false,
            points: 25
        },

        // General Usage Achievements
        {
            id: 'productive-day',
            title: 'Hari Produktif',
            description: 'Selesaikan 5 todo dalam satu hari',
            icon: 'fa-calendar-day',
            category: 'productivity',
            condition: (data) => data.maxDailyTodos >= 5,
            unlocked: false,
            points: 25
        },
        {
            id: 'consistent-user',
            title: 'Pengguna Konsisten',
            description: 'Gunakan aplikasi selama 7 hari berturut-turut',
            icon: 'fa-user-check',
            category: 'productivity',
            condition: (data) => data.consecutiveDays >= 7,
            unlocked: false,
            points: 25
        },
        {
            id: 'dedicated-user',
            title: 'Pengguna Dedikasi',
            description: 'Gunakan aplikasi selama 30 hari berturut-turut',
            icon: 'fa-star',
            category: 'productivity',
            condition: (data) => data.consecutiveDays >= 30,
            unlocked: false,
            points: 50
        },
        {
            id: 'power-user',
            title: 'Pengguna Power',
            description: 'Gunakan semua fitur aplikasi',
            icon: 'fa-rocket',
            category: 'productivity',
            condition: (data) => data.featuresUsed >= 8,
            unlocked: false,
            points: 100
        },
        {
            id: 'milestone-100',
            title: 'Tonggak 100',
            description: 'Dapatkan 100 poin pencapaian',
            icon: 'fa-award',
            category: 'milestone',
            condition: (data) => data.totalPoints >= 100,
            unlocked: false,
            points: 0
        },
        {
            id: 'milestone-250',
            title: 'Tonggak 250',
            description: 'Dapatkan 250 poin pencapaian',
            icon: 'fa-medal',
            category: 'milestone',
            condition: (data) => data.totalPoints >= 250,
            unlocked: false,
            points: 0
        },
        {
            id: 'milestone-500',
            title: 'Tonggak 500',
            description: 'Dapatkan 500 poin pencapaian',
            icon: 'fa-trophy',
            category: 'milestone',
            condition: (data) => data.totalPoints >= 500,
            unlocked: false,
            points: 0
        }
    ],

    // Initialize achievements
    init() {
        const savedAchievements = Storage.get('achievements');
        if (savedAchievements) {
            // Merge saved achievements with default achievements
            this.achievements = this.mergeAchievements(this.achievements, savedAchievements);
        } else {
            Storage.set('achievements', this.achievements);
        }

        // Initialize achievement stats
        this.initAchievementStats();

        this.render();
    },

    // Merge saved achievements with default achievements
    mergeAchievements(defaultAchievements, savedAchievements) {
        const merged = [...defaultAchievements];

        // Update unlocked status from saved achievements
        savedAchievements.forEach(saved => {
            const index = merged.findIndex(a => a.id === saved.id);
            if (index !== -1) {
                merged[index].unlocked = saved.unlocked;
                merged[index].unlockedAt = saved.unlockedAt;
            }
        });

        return merged;
    },

    // Initialize achievement statistics
    initAchievementStats() {
        const stats = Storage.get('achievementStats') || {
            totalPoints: 0,
            categoryPoints: {},
            recentUnlocks: []
        };

        this.stats = stats;
        this.calculateTotalPoints();
    },

    // Calculate total points from unlocked achievements
    calculateTotalPoints() {
        let totalPoints = 0;
        const categoryPoints = {};

        this.achievements.forEach(achievement => {
            if (achievement.unlocked) {
                totalPoints += achievement.points || 0;

                // Initialize category if not exists
                if (!categoryPoints[achievement.category]) {
                    categoryPoints[achievement.category] = 0;
                }

                categoryPoints[achievement.category] += achievement.points || 0;
            }
        });

        this.stats.totalPoints = totalPoints;
        this.stats.categoryPoints = categoryPoints;

        Storage.set('achievementStats', this.stats);
    },

    // Check for new achievements
    checkAchievements(data) {
        let newAchievements = false;
        const now = new Date().toISOString();

        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition(data)) {
                achievement.unlocked = true;
                achievement.unlockedAt = now;
                newAchievements = true;

                // Add to recent unlocks
                this.stats.recentUnlocks.unshift({
                    id: achievement.id,
                    title: achievement.title,
                    unlockedAt: now
                });

                // Keep only last 5 recent unlocks
                if (this.stats.recentUnlocks.length > 5) {
                    this.stats.recentUnlocks = this.stats.recentUnlocks.slice(0, 5);
                }

                this.showNotification(achievement);
            }
        });

        if (newAchievements) {
            this.calculateTotalPoints();
            Storage.set('achievements', this.achievements);
            Storage.set('achievementStats', this.stats);
            this.render();
        }

        return newAchievements;
    },

    // Show achievement notification with animation
    showNotification(achievement) {
        // Create custom notification for achievements
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-500 z-50 max-w-sm';

        notification.innerHTML = `
            <div class="flex items-center">
                <div class="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3">
                    <i class="fas ${achievement.icon} text-xl"></i>
                </div>
                <div>
                    <h4 class="font-bold">Pencapaian Terbuka!</h4>
                    <p class="text-sm">${achievement.title}</p>
                    <p class="text-xs opacity-75">+${achievement.points} poin</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 100);

        // Animate out after 4 seconds
        setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');

            // Remove from DOM after animation
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 4000);

        // Also show standard notification
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(`Pencapaian baru: ${achievement.title}!`, 'success');
        }
    },

    // Render achievements with filtering and sorting
    render(filter = 'all', sortBy = 'category') {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;

        achievementsList.innerHTML = '';

        // Filter achievements
        let filteredAchievements = this.achievements;
        if (filter !== 'all') {
            filteredAchievements = this.achievements.filter(a =>
                filter === 'unlocked' ? a.unlocked : !a.unlocked
            );
        }

        // Sort achievements
        switch (sortBy) {
            case 'category':
                filteredAchievements.sort((a, b) => {
                    if (a.category !== b.category) {
                        return a.category.localeCompare(b.category);
                    }
                    return a.points - b.points;
                });
                break;
            case 'points':
                filteredAchievements.sort((a, b) => b.points - a.points);
                break;
            case 'recent':
                filteredAchievements.sort((a, b) => {
                    if (!a.unlockedAt && !b.unlockedAt) return 0;
                    if (!a.unlockedAt) return 1;
                    if (!b.unlockedAt) return -1;
                    return new Date(b.unlockedAt) - new Date(a.unlockedAt);
                });
                break;
        }

        // Group by category
        const groupedAchievements = {};
        filteredAchievements.forEach(achievement => {
            if (!groupedAchievements[achievement.category]) {
                groupedAchievements[achievement.category] = [];
            }
            groupedAchievements[achievement.category].push(achievement);
        });

        // Render achievements by category
        Object.keys(groupedAchievements).forEach(category => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'mb-6';

            const categoryTitle = this.getCategoryTitle(category);
            const categoryColor = this.getCategoryColor(category);

            categoryEl.innerHTML = `
                <h3 class="text-lg font-semibold mb-3 flex items-center">
                    <span class="w-3 h-3 rounded-full ${categoryColor} mr-2"></span>
                    ${categoryTitle}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${groupedAchievements[category].map(achievement => this.renderAchievementCard(achievement)).join('')}
                </div>
            `;

            achievementsList.appendChild(categoryEl);
        });

        // Add filter controls if not already present
        this.addFilterControls(filter, sortBy);

        // Add achievement summary
        this.renderAchievementSummary();
    },

    // Render individual achievement card
    renderAchievementCard(achievement) {
        return `
            <div class="achievement-card p-4 rounded-lg shadow-md ${achievement.unlocked ? 'unlocked bg-white border-l-4 border-green-500' : 'locked bg-gray-100 opacity-75'} transition-all duration-300 hover:shadow-lg">
                <div class="flex items-start mb-2">
                    <div class="w-12 h-12 rounded-full ${achievement.unlocked ? 'bg-indigo-100' : 'bg-gray-200'} flex items-center justify-center mr-3">
                        <i class="fas ${achievement.icon} ${achievement.unlocked ? 'text-indigo-600' : 'text-gray-400'}"></i>
                    </div>
                    <div class="flex-grow">
                        <h4 class="font-semibold ${achievement.unlocked ? 'text-gray-800' : 'text-gray-600'}">${achievement.title}</h4>
                        <p class="text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-500'}">${achievement.description}</p>
                        ${achievement.points > 0 ? `<p class="text-xs ${achievement.unlocked ? 'text-indigo-600' : 'text-gray-400'} mt-1">+${achievement.points} poin</p>` : ''}
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    ${achievement.unlocked ?
                `<span class="text-green-600 text-sm"><i class="fas fa-check-circle mr-1"></i> Dicapai</span>` :
                '<span class="text-gray-500 text-sm"><i class="fas fa-lock mr-1"></i> Terkunci</span>'}
                    ${achievement.unlocked && achievement.unlockedAt ?
                `<span class="text-xs text-gray-500">${new Date(achievement.unlockedAt).toLocaleDateString('id-ID')}</span>` : ''}
                </div>
            </div>
        `;
    },

    // Get category title in Indonesian
    getCategoryTitle(category) {
        const titles = {
            'todo': 'Todo',
            'habit': 'Kebiasaan',
            'pomodoro': 'Pomodoro',
            'notes': 'Catatan',
            'journal': 'Journal',
            'goals': 'Tujuan',
            'calendar': 'Kalender',
            'analytics': 'Analytics',
            'productivity': 'Produktivitas',
            'milestone': 'Tonggak'
        };

        return titles[category] || category;
    },

    // Get category color
    getCategoryColor(category) {
        const colors = {
            'todo': 'bg-blue-500',
            'habit': 'bg-green-500',
            'pomodoro': 'bg-red-500',
            'notes': 'bg-yellow-500',
            'journal': 'bg-purple-500',
            'goals': 'bg-indigo-500',
            'calendar': 'bg-pink-500',
            'analytics': 'bg-teal-500',
            'productivity': 'bg-orange-500',
            'milestone': 'bg-gray-800'
        };

        return colors[category] || 'bg-gray-500';
    },

    // Add filter controls to achievements page
    addFilterControls(currentFilter, currentSort) {
        const achievementsContainer = document.getElementById('achievements-list');
        if (!achievementsContainer) return;

        // Check if controls already exist
        if (document.getElementById('achievement-controls')) return;

        const controlsEl = document.createElement('div');
        controlsEl.id = 'achievement-controls';
        controlsEl.className = 'mb-6 flex flex-wrap gap-4 items-center justify-between';

        controlsEl.innerHTML = `
            <div class="flex gap-2">
                <button class="filter-achievements px-3 py-1 rounded-full text-sm ${currentFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}" data-filter="all">
                    Semua (${this.achievements.length})
                </button>
                <button class="filter-achievements px-3 py-1 rounded-full text-sm ${currentFilter === 'unlocked' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}" data-filter="unlocked">
                    Dicapai (${this.getUnlockedCount()})
                </button>
                <button class="filter-achievements px-3 py-1 rounded-full text-sm ${currentFilter === 'locked' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}" data-filter="locked">
                    Terkunci (${this.getLockedCount()})
                </button>
            </div>
            <div class="flex gap-2">
                <select id="sort-achievements" class="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option value="category" ${currentSort === 'category' ? 'selected' : ''}>Urutkan berdasarkan Kategori</option>
                    <option value="points" ${currentSort === 'points' ? 'selected' : ''}>Urutkan berdasarkan Poin</option>
                    <option value="recent" ${currentSort === 'recent' ? 'selected' : ''}>Urutkan berdasarkan Terbaru</option>
                </select>
            </div>
        `;

        // Insert at the beginning of the container
        achievementsContainer.parentNode.insertBefore(controlsEl, achievementsContainer);

        // Add event listeners
        const filterBtns = controlsEl.querySelectorAll('.filter-achievements');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.render(btn.dataset.filter, currentSort);
            });
        });

        const sortSelect = controlsEl.querySelector('#sort-achievements');
        sortSelect.addEventListener('change', () => {
            this.render(currentFilter, sortSelect.value);
        });
    },

    // Render achievement summary
    renderAchievementSummary() {
        const summaryContainer = document.getElementById('achievement-summary');
        if (!summaryContainer) return;

        const unlockedCount = this.getUnlockedCount();
        const totalCount = this.achievements.length;
        const percentage = Math.round((unlockedCount / totalCount) * 100);

        summaryContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 class="text-lg font-semibold mb-4">Ringkasan Pencapaian</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-indigo-600">${unlockedCount}/${totalCount}</div>
                        <div class="text-sm text-gray-600">Pencapaian</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${percentage}%</div>
                        <div class="text-sm text-gray-600">Selesai</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${this.stats.totalPoints}</div>
                        <div class="text-sm text-gray-600">Total Poin</div>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-indigo-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get unlocked achievements count
    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    },

    // Get locked achievements count
    getLockedCount() {
        return this.achievements.filter(a => !a.unlocked).length;
    },

    // Get achievements by category
    getByCategory(category) {
        return this.achievements.filter(a => a.category === category);
    },

    // Get recent achievements
    getRecent(count = 5) {
        return this.stats.recentUnlocks.slice(0, count);
    },

    // Reset all achievements
    resetAchievements() {
        if (confirm('Apakah Anda yakin ingin mereset semua pencapaian? Tindakan ini tidak dapat dibatalkan.')) {
            this.achievements.forEach(achievement => {
                achievement.unlocked = false;
                delete achievement.unlockedAt;
            });

            this.stats = {
                totalPoints: 0,
                categoryPoints: {},
                recentUnlocks: []
            };

            Storage.set('achievements', this.achievements);
            Storage.set('achievementStats', this.stats);

            this.render();

            if (typeof App !== 'undefined' && App.showNotification) {
                App.showNotification('Semua pencapaian telah direset', 'warning');
            }
        }
    }
};