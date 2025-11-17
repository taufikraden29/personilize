// Enhanced habit tracker functionality
const Habits = {
    habits: [],
    filters: {
        status: 'all',
        frequency: 'all',
        frequencyFilter: 'all',
        search: ''
    },
    sorting: {
        field: 'name',
        order: 'asc'
    },

    init() {
        this.loadHabits();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
        this.updateStats();
        this.checkStreaks();
        this.setupReminderNotifications();
    },

    loadHabits() {
        const savedHabits = Storage.get('habits');
        if (savedHabits) {
            this.habits = savedHabits;
        }

        // Migrate old habits to new format if needed
        this.habits = this.habits.map(habit => ({
            ...habit,
            description: habit.description || '',
            category: habit.category || 'personal',
            targetDays: habit.targetDays || [],
            reminderTime: habit.reminderTime || null,
            color: habit.color || '#6366f1',
            icon: habit.icon || 'fa-check',
            difficulty: habit.difficulty || 'medium',
            reward: habit.reward || '',
            notes: habit.notes || '',
            createdAt: habit.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            goals: habit.goals || {
                targetDays: 30,
                targetStreak: 21
            }
        }));

        this.saveHabits();
    },

    setupEventListeners() {
        // Add habit form
        const addBtn = document.getElementById('add-habit-btn');
        const input = document.getElementById('habit-input');

        if (addBtn && input) {
            addBtn.addEventListener('click', () => this.addHabit());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addHabit();
                }
            });
        }

        // Filter controls
        const filterSelect = document.getElementById('habit-filter');
        const frequencyFilterSelect = document.getElementById('habit-frequency-filter');
        const searchInput = document.getElementById('habit-search');

        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.setFilter('status', filterSelect.value);
                this.render();
            });
        }

        if (frequencyFilterSelect) {
            frequencyFilterSelect.addEventListener('change', () => {
                this.setFilter('frequencyFilter', frequencyFilterSelect.value);
                this.render();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setFilter('search', e.target.value.toLowerCase());
                this.render();
            });
        }

        // Sort controls
        const sortSelect = document.getElementById('habit-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const [field, order] = sortSelect.value.split('-');
                this.sorting.field = field;
                this.sorting.order = order;
                this.render();
            });
        }

        // Modal close buttons
        document.getElementById('close-history-modal')?.addEventListener('click', () => {
            document.getElementById('habit-history-modal').classList.add('hidden');
        });

        document.getElementById('close-calendar-modal')?.addEventListener('click', () => {
            document.getElementById('habit-calendar-modal').classList.add('hidden');
        });
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Ctrl/Cmd + H: Focus habit input
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                document.getElementById('habit-input')?.focus();
            }
        });
    },

    addHabit() {
        const input = document.getElementById('habit-input');
        const frequency = document.getElementById('habit-frequency');
        const category = document.getElementById('habit-category');
        const difficulty = document.getElementById('habit-difficulty');

        if (!input.value.trim()) {
            this.showNotification('Silakan masukkan nama kebiasaan', 'warning');
            return;
        }

        const habit = {
            id: Date.now(),
            name: input.value.trim(),
            description: '',
            frequency: frequency.value,
            category: category.value || 'personal',
            targetDays: [],
            completedDates: [],
            streak: 0,
            bestStreak: 0,
            reminderTime: null,
            color: this.getRandomColor(),
            icon: this.getRandomIcon(),
            difficulty: difficulty.value || 'medium',
            reward: '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            goals: {
                targetDays: 30,
                targetStreak: 21
            }
        };

        this.habits.unshift(habit);
        this.saveHabits();
        this.render();
        this.updateStats();

        // Reset form
        input.value = '';
        frequency.value = 'daily';
        category.value = 'personal';
        difficulty.value = 'medium';

        // Show notification
        this.showNotification('Kebiasaan berhasil ditambahkan', 'success');

        // Check achievements
        this.checkAchievements();

        // Track activity
        this.trackActivity('created', habit);
    },

    editHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        // Create edit modal
        const modal = this.createEditModal(habit);
        document.body.appendChild(modal);

        // Show modal
        modal.classList.remove('hidden');
        document.getElementById('edit-habit-name').focus();
    },

    updateHabit(id, updates) {
        const habitIndex = this.habits.findIndex(h => h.id === id);
        if (habitIndex === -1) return;

        this.habits[habitIndex] = {
            ...this.habits[habitIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveHabits();
        this.render();
        this.updateStats();

        this.showNotification('Kebiasaan berhasil diperbarui', 'success');
        this.trackActivity('updated', this.habits[habitIndex]);
    },

    deleteHabit(id) {
        const habitIndex = this.habits.findIndex(h => h.id === id);
        if (habitIndex === -1) return;

        const habit = this.habits[habitIndex];

        if (confirm(`Apakah Anda yakin ingin menghapus kebiasaan "${habit.name}"?`)) {
            this.habits.splice(habitIndex, 1);
            this.saveHabits();
            this.render();
            this.updateStats();

            this.showNotification('Kebiasaan berhasil dihapus', 'success');
            this.trackActivity('deleted', habit);
        }
    },

    toggleHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const today = new Date().toISOString().split('T')[0];
        const todayIndex = habit.completedDates.indexOf(today);

        if (todayIndex === -1) {
            // Mark as completed for today
            habit.completedDates.push(today);
            this.updateStreak(habit);

            // Show celebration for milestones
            this.showMilestoneCelebration(habit);
        } else {
            // Mark as uncompleted for today
            habit.completedDates.splice(todayIndex, 1);
            this.updateStreak(habit);
        }

        habit.updatedAt = new Date().toISOString();

        this.saveHabits();
        this.render();
        this.updateStats();

        // Check achievements
        this.checkAchievements();

        // Track activity
        this.trackActivity(habit.completedDates.includes(today) ? 'completed' : 'uncompleted', habit);
    },

    updateStreak(habit) {
        const today = new Date();
        const sortedDates = [...habit.completedDates].sort().reverse();

        if (sortedDates.length === 0) {
            habit.streak = 0;
            return;
        }

        // Check if today is completed
        const todayStr = today.toISOString().split('T')[0];
        const todayIndex = sortedDates.indexOf(todayStr);

        if (todayIndex === -1) {
            // Check if yesterday is completed
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const yesterdayIndex = sortedDates.indexOf(yesterdayStr);

            if (yesterdayIndex === -1) {
                // Neither today nor yesterday is completed, streak is 0
                habit.streak = 0;
            } else {
                // Yesterday is completed, streak is 1
                habit.streak = 1;
            }
        } else {
            // Today is completed, calculate streak
            let streak = 0;
            let currentDate = new Date(today);

            for (let i = 0; i < 365; i++) { // Check up to a year
                const dateStr = currentDate.toISOString().split('T')[0];

                if (sortedDates.includes(dateStr)) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }

            habit.streak = streak;
        }

        // Update best streak
        if (habit.streak > habit.bestStreak) {
            habit.bestStreak = habit.streak;
        }
    },

    checkStreaks() {
        this.habits.forEach(habit => {
            this.updateStreak(habit);
        });
        this.saveHabits();
    },

    showMilestoneCelebration(habit) {
        const milestones = [7, 21, 30, 50, 100, 365];

        if (milestones.includes(habit.streak)) {
            let message = '';
            let emoji = '';

            switch (habit.streak) {
                case 7:
                    message = 'Seminggu penuh! 🔥';
                    emoji = '🎉';
                    break;
                case 21:
                    message = 'Tiga minggu berturut-turut! 💪';
                    emoji = '🏆';
                    break;
                case 30:
                    message = 'Sebulan penuh! 🌟';
                    emoji = '👑';
                    break;
                case 50:
                    message = '50 hari! Luar biasa! ⭐';
                    emoji = '🌠';
                    break;
                case 100:
                    message = '100 hari! Legendaris! 🏅';
                    emoji = '👑';
                    break;
                case 365:
                    message = 'Setahun penuh! Anda luar biasa! 🌟';
                    emoji = '🏆';
                    break;
            }

            this.showCelebrationModal(habit, message, emoji);
        }
    },

    showCelebrationModal(habit, message, emoji) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md text-center">
                <div class="text-6xl mb-4">${emoji}</div>
                <h2 class="text-2xl font-bold mb-2">Selamat! 🎉</h2>
                <p class="text-gray-600 mb-4">${message}</p>
                <p class="text-lg font-semibold mb-6">"${habit.name}"</p>
                <p class="text-sm text-gray-500 mb-6">Streak: ${habit.streak} hari</p>
                <button class="btn btn-primary" onclick="this.closest('.fixed').remove()">
                    Lanjutkan
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 5000);
    },

    setFilter(filterType, value) {
        this.filters[filterType] = value;
    },

    getRandomColor() {
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
            '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
            '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    getRandomIcon() {
        const icons = [
            'fa-check', 'fa-heart', 'fa-star', 'fa-fire', 'fa-dumbbell',
            'fa-book', 'fa-code', 'fa-palette', 'fa-bolt', 'fa-music',
            'fa-running', 'fa-apple-alt', 'fa-bed', 'fa-mug-hot', 'fa-seedling'
        ];
        return icons[Math.floor(Math.random() * icons.length)];
    },

    getFilteredHabits() {
        let filtered = [...this.habits];

        // Status filter
        if (this.filters.status !== 'all') {
            const today = new Date().toISOString().split('T')[0];

            switch (this.filters.status) {
                case 'active':
                    filtered = filtered.filter(h => !h.completedDates.includes(today));
                    break;
                case 'completed':
                    filtered = filtered.filter(h => h.completedDates.includes(today));
                    break;
                case 'streak':
                    filtered = filtered.filter(h => h.streak > 0);
                    break;
            }
        }

        // Frequency filter
        if (this.filters.frequencyFilter !== 'all') {
            filtered = filtered.filter(h => h.frequency === this.filters.frequencyFilter);
        }

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(h =>
                h.name.toLowerCase().includes(this.filters.search) ||
                h.description.toLowerCase().includes(this.filters.search)
            );
        }

        // Sort habits
        filtered.sort((a, b) => {
            let aValue = a[this.sorting.field];
            let bValue = b[this.sorting.field];

            if (this.sorting.field === 'streak' || this.sorting.field === 'bestStreak') {
                aValue = a[this.sorting.field] || 0;
                bValue = b[this.sorting.field] || 0;
            } else if (this.sorting.field === 'completion') {
                aValue = this.calculateCompletionRate(a);
                bValue = this.calculateCompletionRate(b);
            }

            if (this.sorting.order === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    },

    render() {
        const habitsList = document.getElementById('habits-list');
        if (!habitsList) return;

        const filteredHabits = this.getFilteredHabits();

        // Show loading state
        habitsList.innerHTML = '<div class="loading h-32 rounded-lg mb-4"></div>'.repeat(3);

        // Simulate loading delay for better UX
        setTimeout(() => {
            if (filteredHabits.length === 0) {
                habitsList.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Tidak ada kebiasaan ditemukan</p>
                        <button class="mt-4 text-indigo-600 hover:text-indigo-800" onclick="Habits.clearFilters()">
                            Hapus filter
                        </button>
                    </div>
                `;
                return;
            }

            habitsList.innerHTML = '';

            filteredHabits.forEach(habit => {
                const habitEl = this.createHabitElement(habit);
                habitsList.appendChild(habitEl);
            });

            // Update stats
            this.updateFilterStats(filteredHabits);
        }, 300);
    },

    createHabitElement(habit) {
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-card bg-white rounded-xl shadow-lg p-5 transition-all duration-300 hover:shadow-xl border border-gray-100';
        habitEl.dataset.id = habit.id;

        const today = new Date().toISOString().split('T')[0];
        const isCompletedToday = habit.completedDates.includes(today);
        const completionRate = this.calculateCompletionRate(habit);

        // Generate calendar for the last 30 days
        let calendarHtml = '';
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = habit.completedDates.includes(dateStr);

            const bgColor = isCompleted ? habit.color : '#e5e7eb';
            const title = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

            calendarHtml += `<div class="w-5 h-5 rounded-sm cursor-pointer hover:scale-110 transition-transform"
                                   style="background-color: ${bgColor}"
                                   title="${title}"
                                   onclick="Habits.showHabitDetails(${habit.id}, '${dateStr}')"></div>`;
        }

        const frequencyLabels = {
            daily: 'Harian',
            weekly: 'Mingguan',
            monthly: 'Bulanan'
        };

        const difficultyColors = {
            easy: 'text-green-600',
            medium: 'text-yellow-600',
            hard: 'text-red-600'
        };

        const difficultyLabels = {
            easy: 'Mudah',
            medium: 'Sedang',
            hard: 'Sulit'
        };

        const categoryColors = {
            personal: 'bg-blue-100 text-blue-800',
            health: 'bg-green-100 text-green-800',
            work: 'bg-purple-100 text-purple-800',
            learning: 'bg-yellow-100 text-yellow-800',
            other: 'bg-gray-100 text-gray-800'
        };

        const categoryLabels = {
            personal: 'Pribadi',
            health: 'Kesehatan',
            work: 'Pekerjaan',
            learning: 'Pembelajaran',
            other: 'Lainnya'
        };

        habitEl.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-grow">
                    <div class="flex items-center mb-2">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center mr-3 shadow-sm"
                             style="background-color: ${habit.color}20; border: 2px solid ${habit.color}40">
                            <i class="fas ${habit.icon} text-xl" style="color: ${habit.color}"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${habit.name}</h3>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="px-2 py-1 rounded-full text-xs ${categoryColors[habit.category] || categoryColors.other}">
                                    ${categoryLabels[habit.category] || categoryLabels.other}
                                </span>
                                <span class="text-xs text-gray-500">${frequencyLabels[habit.frequency]}</span>
                                <span class="text-xs ${difficultyColors[habit.difficulty]}">
                                    ${difficultyLabels[habit.difficulty]}
                                </span>
                            </div>
                        </div>
                    </div>
                    ${habit.description ? `<p class="text-sm text-gray-600 mb-2">${habit.description}</p>` : ''}
                </div>
                <div class="flex items-center space-x-2">
                    ${habit.streak > 0 ? `
                        <span class="habit-streak ${this.getStreakClass(habit.streak)} px-3 py-1 rounded-full">
                            <i class="fas fa-fire mr-1"></i>${habit.streak} hari
                        </span>
                    ` : ''}
                    <button class="edit-habit text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors" data-id="${habit.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-habit text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" data-id="${habit.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm text-gray-600">Tingkat penyelesaian (30 hari terakhir)</span>
                    <span class="text-sm font-semibold text-gray-800">${completionRate}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="h-2.5 rounded-full transition-all duration-500 ease-out"
                         style="width: ${completionRate}%; background-color: ${habit.color}"></div>
                </div>
            </div>

            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Target: ${habit.goals.targetStreak} hari</span>
                    <span class="text-sm font-semibold text-gray-800">Streak: ${habit.streak}/${habit.goals.targetStreak}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="h-2.5 rounded-full transition-all duration-500 ease-out"
                         style="width: ${Math.min(100, (habit.streak / habit.goals.targetStreak) * 100)}%; background-color: #f59e0b"></div>
                </div>
            </div>

            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-2">Kalender 30 hari terakhir:</p>
                <div class="flex flex-wrap gap-1 justify-center">
                    ${calendarHtml}
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
                <button class="toggle-habit px-4 py-2 ${isCompletedToday ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300'} text-${isCompletedToday ? 'white' : 'gray-800'} rounded-lg transition font-medium flex-1" data-id="${habit.id}">
                    ${isCompletedToday ? '<i class="fas fa-check mr-2"></i> Selesai Hari Ini' : '<i class="fas fa-circle mr-2"></i> Tandai Selesai'}
                </button>
                <button class="view-history px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition font-medium flex-1" data-id="${habit.id}">
                    <i class="fas fa-history mr-2"></i> Riwayat
                </button>
            </div>

            <div class="mt-3 flex justify-center space-x-2">
                <button class="view-calendar px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition" data-id="${habit.id}">
                    <i class="fas fa-calendar-alt mr-1"></i> Kalender
                </button>
                <button class="set-reminder px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition" data-id="${habit.id}">
                    <i class="fas fa-bell mr-1"></i> Ingatkan
                </button>
            </div>
        `;

        // Add event listeners
        this.attachHabitEventListeners(habitEl);

        return habitEl;
    },

    createEditModal(habit) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Edit Kebiasaan</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Nama Kebiasaan</label>
                        <input type="text" id="edit-habit-name" value="${habit.name}" 
                               class="form-input" placeholder="Masukkan nama kebiasaan...">
                    </div>
                    
                    <div>
                        <label class="form-label">Deskripsi</label>
                        <textarea id="edit-habit-description" rows="3" class="form-input" 
                                  placeholder="Tambahkan deskripsi...">${habit.description || ''}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Frekuensi</label>
                            <select id="edit-habit-frequency" class="form-input">
                                <option value="daily" ${habit.frequency === 'daily' ? 'selected' : ''}>Harian</option>
                                <option value="weekly" ${habit.frequency === 'weekly' ? 'selected' : ''}>Mingguan</option>
                                <option value="monthly" ${habit.frequency === 'monthly' ? 'selected' : ''}>Bulanan</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="form-label">Kategori</label>
                            <select id="edit-habit-category" class="form-input">
                                <option value="personal" ${habit.category === 'personal' ? 'selected' : ''}>Pribadi</option>
                                <option value="health" ${habit.category === 'health' ? 'selected' : ''}>Kesehatan</option>
                                <option value="work" ${habit.category === 'work' ? 'selected' : ''}>Pekerjaan</option>
                                <option value="learning" ${habit.category === 'learning' ? 'selected' : ''}>Pembelajaran</option>
                                <option value="other" ${habit.category === 'other' ? 'selected' : ''}>Lainnya</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Kesulitan</label>
                            <select id="edit-habit-difficulty" class="form-input">
                                <option value="easy" ${habit.difficulty === 'easy' ? 'selected' : ''}>Mudah</option>
                                <option value="medium" ${habit.difficulty === 'medium' ? 'selected' : ''}>Sedang</option>
                                <option value="hard" ${habit.difficulty === 'hard' ? 'selected' : ''}>Sulit</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="form-label">Warna</label>
                            <input type="color" id="edit-habit-color" value="${habit.color}" class="form-input h-10">
                        </div>
                    </div>
                    
                    <div>
                        <label class="form-label">Icon</label>
                        <select id="edit-habit-icon" class="form-input">
                            <option value="fa-check" ${habit.icon === 'fa-check' ? 'selected' : ''}>✓</option>
                            <option value="fa-heart" ${habit.icon === 'fa-heart' ? 'selected' : ''}>❤️</option>
                            <option value="fa-star" ${habit.icon === 'fa-star' ? 'selected' : ''}>⭐</option>
                            <option value="fa-fire" ${habit.icon === 'fa-fire' ? 'selected' : ''}>🔥</option>
                            <option value="fa-dumbbell" ${habit.icon === 'fa-dumbbell' ? 'selected' : ''}>💪</option>
                            <option value="fa-book" ${habit.icon === 'fa-book' ? 'selected' : ''}>📚</option>
                            <option value="fa-code" ${habit.icon === 'fa-code' ? 'selected' : ''}>💻</option>
                            <option value="fa-palette" ${habit.icon === 'fa-palette' ? 'selected' : ''}>🎨</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="form-label">Hadiah</label>
                        <input type="text" id="edit-habit-reward" value="${habit.reward || ''}" 
                               class="form-input" placeholder="Hadiah untuk menyelesaikan kebiasaan...">
                    </div>
                    
                    <div>
                        <label class="form-label">Catatan</label>
                        <textarea id="edit-habit-notes" rows="3" class="form-input" 
                                  placeholder="Tambahkan catatan...">${habit.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.fixed').remove()">
                        Batal
                    </button>
                    <button class="btn btn-primary" id="save-habit-changes">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEditModalEventListeners(modal, habit);

        return modal;
    },

    showHabitDetails(habitId, date) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const isCompleted = habit.completedDates.includes(date);
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Detail Kebiasaan</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <p class="font-semibold text-gray-800">${habit.name}</p>
                        <p class="text-sm text-gray-600">${formattedDate}</p>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span>Status:</span>
                        <span class="${isCompleted ? 'text-green-600' : 'text-gray-500'}">
                            ${isCompleted ? '✓ Selesai' : '○ Belum selesai'}
                        </span>
                    </div>
                    
                    ${habit.reward ? `
                        <div class="flex items-center justify-between">
                            <span>Hadiah:</span>
                            <span class="text-yellow-600">🎁 ${habit.reward}</span>
                        </div>
                    ` : ''}
                    
                    ${habit.notes ? `
                        <div>
                            <p class="font-semibold mb-1">Catatan:</p>
                            <p class="text-sm text-gray-600">${habit.notes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex justify-end mt-6">
                    <button class="btn btn-primary" onclick="this.closest('.fixed').remove()">
                        Tutup
                    </button>
                </div>
            </div>
        `;

        // Add event listener to close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    },

    // Helper methods
    getStreakClass(streak) {
        if (streak >= 365) return 'habit-streak-platinum';
        if (streak >= 100) return 'habit-streak-gold';
        if (streak >= 50) return 'habit-streak-silver';
        if (streak >= 21) return 'habit-streak-bronze';
        if (streak >= 7) return 'habit-streak-blue';
        return '';
    },

    clearFilters() {
        this.filters = {
            status: 'all',
            frequency: 'all',
            search: ''
        };

        // Reset UI
        document.getElementById('habit-filter').value = 'all';
        document.getElementById('habit-search').value = '';
        document.getElementById('habit-sort').value = 'name-asc';

        this.render();
    },

    updateFilterStats(filteredHabits) {
        const statsEl = document.getElementById('filter-stats');
        if (!statsEl) return;

        const today = new Date().toISOString().split('T')[0];
        const completedToday = filteredHabits.filter(h => h.completedDates.includes(today)).length;
        const activeStreaks = filteredHabits.filter(h => h.streak > 0).length;

        statsEl.innerHTML = `
            <span class="text-sm text-gray-500">
                Menampilkan ${filteredHabits.length} kebiasaan: ${completedToday} selesai hari ini, ${activeStreaks} dengan streak aktif
            </span>
        `;
    },

    saveHabits() {
        Storage.set('habits', this.habits);
    },

    updateStats() {
        const activeHabitsCount = document.getElementById('active-habits-count');
        if (activeHabitsCount) {
            activeHabitsCount.textContent = this.habits.length;
        }
    },

    checkAchievements() {
        const maxStreak = Math.max(...this.habits.map(h => h.streak), 0);

        const data = {
            totalHabits: this.habits.length,
            maxStreak
        };

        Achievements.checkAchievements(data);
    },

    trackActivity(action, habit) {
        const activity = {
            type: 'habit',
            action: action,
            habitId: habit.id,
            habitName: habit.name,
            timestamp: new Date().toISOString()
        };

        // Save to activity log
        const activities = Storage.get('activities') || [];
        activities.unshift(activity);

        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }

        Storage.set('activities', activities);
    },

    showNotification(message, type = 'success') {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, type);
        }
    },

    // Event listener attachment methods
    attachHabitEventListeners(habitEl) {
        const toggleBtn = habitEl.querySelector('.toggle-habit');
        const editBtn = habitEl.querySelector('.edit-habit');
        const deleteBtn = habitEl.querySelector('.delete-habit');
        const viewHistoryBtn = habitEl.querySelector('.view-history');
        const viewCalendarBtn = habitEl.querySelector('.view-calendar');
        const setReminderBtn = habitEl.querySelector('.set-reminder');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleHabit(parseInt(toggleBtn.dataset.id));
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editHabit(parseInt(editBtn.dataset.id));
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteHabit(parseInt(deleteBtn.dataset.id));
            });
        }

        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                this.showHabitHistory(parseInt(viewHistoryBtn.dataset.id));
            });
        }

        if (viewCalendarBtn) {
            viewCalendarBtn.addEventListener('click', () => {
                this.showHabitCalendar(parseInt(viewCalendarBtn.dataset.id));
            });
        }

        if (setReminderBtn) {
            setReminderBtn.addEventListener('click', () => {
                this.setHabitReminder(parseInt(setReminderBtn.dataset.id));
            });
        }
    },

    attachEditModalEventListeners(modal, habit) {
        const closeBtn = modal.querySelector('.close-modal');
        const saveBtn = modal.querySelector('#save-habit-changes');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const updates = {
                    name: document.getElementById('edit-habit-name').value,
                    description: document.getElementById('edit-habit-description').value,
                    frequency: document.getElementById('edit-habit-frequency').value,
                    category: document.getElementById('edit-habit-category').value,
                    difficulty: document.getElementById('edit-habit-difficulty').value,
                    color: document.getElementById('edit-habit-color').value,
                    icon: document.getElementById('edit-habit-icon').value,
                    reward: document.getElementById('edit-habit-reward').value,
                    notes: document.getElementById('edit-habit-notes').value
                };

                this.updateHabit(habit.id, updates);
                modal.remove();
            });
        }
    },

    // Additional functionality methods
    showHabitHistory(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const modal = document.getElementById('habit-history-modal');
        const content = document.getElementById('habit-history-content');

        // Sort completed dates in descending order
        const sortedDates = [...habit.completedDates].sort().reverse();

        let historyHtml = `
            <h4 class="text-lg font-bold mb-4">${habit.name} - Riwayat Penyelesaian</h4>
            <div class="mb-4">
                <div class="grid grid-cols-7 gap-1 mb-2">
                    <div class="text-center text-xs font-semibold text-gray-500">Sen</div>
                    <div class="text-center text-xs font-semibold text-gray-500">Sel</div>
                    <div class="text-center text-xs font-semibold text-gray-500">Rab</div>
                    <div class="text-center text-xs font-semibold text-gray-500">Kam</div>
                    <div class="text-center text-xs font-semibold text-gray-500">Jum</div>
                    <div class="text-center text-xs font-semibold text-gray-500">Sab</div>
                    <div class="text-center text-xs font-semibold text-gray-500">Min</div>
                </div>
                <div class="grid grid-cols-7 gap-1">
        `;

        // Create calendar view for the last 90 days
        const today = new Date();
        for (let i = 89; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = habit.completedDates.includes(dateStr);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

            // Add empty cells for the start of the week if needed
            if (i === 89) {
                // Add empty cells for days before the first day of the 90-day period
                const firstDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday format
                for (let j = 0; j < firstDayOfWeek; j++) {
                    historyHtml += `<div class="w-6 h-6 rounded-sm bg-gray-100"></div>`;
                }
            }

            const bgColor = isCompleted ? habit.color : '#e5e7eb';
            const title = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

            historyHtml += `<div class="w-6 h-6 rounded-sm" style="background-color: ${bgColor}" title="${title}"></div>`;
        }

        historyHtml += `
                </div>
            </div>
            <div class="mb-4">
                <h5 class="font-semibold mb-2">Tanggal Penyelesaian:</h5>
                <div class="max-h-60 overflow-y-auto">
        `;

        if (sortedDates.length > 0) {
            sortedDates.forEach(date => {
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                historyHtml += `<div class="py-1 border-b border-gray-100">${formattedDate}</div>`;
            });
        } else {
            historyHtml += `<div class="text-gray-500 py-2">Belum ada tanggal penyelesaian</div>`;
        }

        historyHtml += `
                </div>
            </div>
            <div class="flex justify-between">
                <div>
                    <p class="font-semibold">Total Penyelesaian:</p>
                    <p>${habit.completedDates.length} kali</p>
                </div>
                <div>
                    <p class="font-semibold">Streak Terbaik:</p>
                    <p>${habit.bestStreak} hari</p>
                </div>
            </div>
        `;

        content.innerHTML = historyHtml;
        modal.classList.remove('hidden');
    },

    showHabitCalendar(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const modal = document.getElementById('habit-calendar-modal');
        const content = document.getElementById('habit-calendar-content');

        // Create a monthly calendar view
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Get first day of month and number of days in month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

        let calendarHtml = `
            <h4 class="text-lg font-bold mb-4">${habit.name} - Kalender Bulan Ini</h4>
            <div class="text-center mb-4">
                <h5 class="text-xl font-bold">${firstDay.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h5>
            </div>
            <div class="grid grid-cols-7 gap-1 mb-2">
                <div class="text-center text-xs font-semibold text-gray-500">Min</div>
                <div class="text-center text-xs font-semibold text-gray-500">Sen</div>
                <div class="text-center text-xs font-semibold text-gray-500">Sel</div>
                <div class="text-center text-xs font-semibold text-gray-500">Rab</div>
                <div class="text-center text-xs font-semibold text-gray-500">Kam</div>
                <div class="text-center text-xs font-semibold text-gray-500">Jum</div>
                <div class="text-center text-xs font-semibold text-gray-500">Sab</div>
            </div>
            <div class="grid grid-cols-7 gap-1">
        `;

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startDay; i++) {
            calendarHtml += `<div class="w-8 h-8 rounded-sm bg-gray-100"></div>`;
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isCompleted = habit.completedDates.includes(dateStr);
            const bgColor = isCompleted ? habit.color : '#e5e7eb';
            const todayClass = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                ? 'border-2 border-blue-500' : '';

            calendarHtml += `<div class="w-8 h-8 rounded-sm flex items-center justify-center ${todayClass}" style="background-color: ${bgColor}" title="${dateStr}">${day}</div>`;
        }

        calendarHtml += `
            </div>
            <div class="mt-4">
                <div class="flex items-center mb-2">
                    <div class="w-4 h-4 rounded-sm mr-2" style="background-color: ${habit.color}"></div>
                    <span class="text-sm">Selesai</span>
                </div>
                <div class="flex items-center">
                    <div class="w-4 h-4 rounded-sm bg-gray-200 mr-2"></div>
                    <span class="text-sm">Belum Selesai</span>
                </div>
            </div>
        `;

        content.innerHTML = calendarHtml;
        modal.classList.remove('hidden');
    },

    setHabitReminder(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        // Create a reminder modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Atur Pengingat</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="form-label block text-sm font-medium text-gray-700 mb-1">Waktu Pengingat</label>
                        <input type="time" id="reminder-time" value="${habit.reminderTime || '08:00'}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="enable-reminder" ${habit.reminderTime ? 'checked' : ''}
                               class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                        <label for="enable-reminder" class="ml-2 block text-sm text-gray-900">Aktifkan Pengingat</label>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Batal
                    </button>
                    <button class="btn btn-primary px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        Simpan Pengingat
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('.btn-ghost');
        const saveBtn = modal.querySelector('.btn-primary');
        const enableCheckbox = modal.querySelector('#enable-reminder');
        const timeInput = modal.querySelector('#reminder-time');

        const closeModal = () => modal.remove();

        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        saveBtn?.addEventListener('click', () => {
            const reminderTime = enableCheckbox.checked ? timeInput.value : null;
            this.updateHabit(habitId, { reminderTime });
            closeModal();
        });

        document.body.appendChild(modal);
    },

    setupReminderNotifications() {
        // Check for reminders every minute
        setInterval(() => {
            this.checkReminders();
        }, 60000); // 60 seconds
    },

    checkReminders() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this.habits.forEach(habit => {
            if (habit.reminderTime && habit.reminderTime === currentTime) {
                // Check if habit was not completed today
                const today = now.toISOString().split('T')[0];
                if (!habit.completedDates.includes(today)) {
                    this.showNotification(`Waktunya ${habit.name}! Jangan lupa untuk menyelesaikan kebiasaan ini hari ini.`, 'info');
                }
            }
        });
    },

    exportHabits() {
        const dataStr = JSON.stringify(this.habits, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `habits-export-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    calculateCompletionRate(habit) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const recentDates = habit.completedDates.filter(date => date >= thirtyDaysAgoStr);

        // Calculate possible completions based on frequency
        const daysSinceStart = Math.floor((new Date() - new Date(thirtyDaysAgoStr)) / (1000 * 60 * 60 * 24));

        let possibleCompletions = 0;
        switch (habit.frequency) {
            case 'daily':
                possibleCompletions = daysSinceStart;
                break;
            case 'weekly':
                possibleCompletions = Math.floor(daysSinceStart / 7);
                break;
            case 'monthly':
                possibleCompletions = Math.floor(daysSinceStart / 30);
                break;
        }

        return possibleCompletions > 0 ? Math.round((recentDates.length / possibleCompletions) * 100) : 0;
    },

    updateStats() {
        const stats = this.getStatistics();

        // Update the new stats elements in the UI
        document.getElementById('total-habits-count').textContent = stats.totalHabits;
        document.getElementById('completed-today-count').textContent = stats.completedToday;
        document.getElementById('active-streaks-count').textContent = stats.activeStreaks;
        document.getElementById('completion-rate').textContent = `${stats.completionRate30Days}%`;

        // Also update the original element if it exists
        const activeHabitsCount = document.getElementById('active-habits-count');
        if (activeHabitsCount) {
            activeHabitsCount.textContent = stats.totalHabits;
        }
    },

    getStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        return {
            totalHabits: this.habits.length,
            completedToday: this.habits.filter(h => h.completedDates.includes(today)).length,
            activeStreaks: this.habits.filter(h => h.streak > 0).length,
            averageStreak: this.habits.length > 0 ? Math.round(this.habits.reduce((sum, h) => sum + h.streak, 0) / this.habits.length) : 0,
            bestStreak: Math.max(...this.habits.map(h => h.bestStreak), 0),
            completionRate30Days: this.calculateOverallCompletionRate(thirtyDaysAgoStr)
        };
    },

    calculateOverallCompletionRate(startDate) {
        if (this.habits.length === 0) return 0;

        let totalPossible = 0;
        let totalCompleted = 0;

        this.habits.forEach(habit => {
            const recentDates = habit.completedDates.filter(date => date >= startDate);
            totalCompleted += recentDates.length;

            // Calculate possible completions based on frequency
            const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));

            switch (habit.frequency) {
                case 'daily':
                    totalPossible += daysSinceStart;
                    break;
                case 'weekly':
                    totalPossible += Math.floor(daysSinceStart / 7);
                    break;
                case 'monthly':
                    totalPossible += Math.floor(daysSinceStart / 30);
                    break;
            }
        });

        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    }
};