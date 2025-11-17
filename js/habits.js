// Enhanced habit tracker functionality
const Habits = {
    habits: [],
    filters: {
        status: 'all',
        frequency: 'all',
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
            updatedAt: new Date().toISOString()
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
        const searchInput = document.getElementById('habit-search');

        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.setFilter('status', filterSelect.value);
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
            color: '#6366f1',
            icon: 'fa-check',
            difficulty: difficulty.value || 'medium',
            reward: '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
        if (this.filters.frequency !== 'all') {
            filtered = filtered.filter(h => h.frequency === this.filters.frequency);
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
        habitEl.className = 'habit-card';
        habitEl.dataset.id = habit.id;

        const today = new Date().toISOString().split('T')[0];
        const isCompletedToday = habit.completedDates.includes(today);

        // Calculate completion rate for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const recentDates = habit.completedDates.filter(date => date >= thirtyDaysAgoStr);
        const completionRate = Math.round((recentDates.length / 30) * 100);

        // Generate calendar for the last 30 days
        let calendarHtml = '';
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = habit.completedDates.includes(dateStr);

            const bgColor = isCompleted ? habit.color : '#e5e7eb';
            const title = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

            calendarHtml += `<div class="w-6 h-6 rounded-sm cursor-pointer hover:scale-110 transition-transform" 
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
                        <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
                             style="background-color: ${habit.color}20">
                            <i class="fas ${habit.icon}" style="color: ${habit.color}"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${habit.name}</h3>
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
                        <span class="habit-streak ${this.getStreakClass(habit.streak)}">
                            <i class="fas fa-fire mr-1"></i>${habit.streak} hari
                        </span>
                    ` : ''}
                    <button class="edit-habit text-blue-500 hover:text-blue-700" data-id="${habit.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-habit text-red-500 hover:text-red-700" data-id="${habit.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm text-gray-600">Tingkat penyelesaian (30 hari terakhir)</span>
                    <span class="text-sm font-semibold text-gray-800">${completionRate}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-500" 
                         style="width: ${completionRate}%; background-color: ${habit.color}"></div>
                </div>
            </div>
            
            <div class="mb-3">
                <p class="text-sm text-gray-600 mb-2">Kalender 30 hari terakhir:</p>
                <div class="flex flex-wrap gap-1">
                    ${calendarHtml}
                </div>
            </div>
            
            <div class="flex justify-center">
                <button class="toggle-habit px-4 py-2 ${isCompletedToday ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300'} text-${isCompletedToday ? 'white' : 'gray-800'} rounded-lg transition" data-id="${habit.id}">
                    ${isCompletedToday ? '<i class="fas fa-check mr-2"></i> Selesai Hari Ini' : '<i class="fas fa-circle mr-2"></i> Tandai Selesai'}
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

    getStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        return {
            totalHabits: this.habits.length,
            completedToday: this.habits.filter(h => h.completedDates.includes(today)).length,
            activeStreaks: this.habits.filter(h => h.streak > 0).length,
            averageStreak: Math.round(this.habits.reduce((sum, h) => sum + h.streak, 0) / this.habits.length),
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