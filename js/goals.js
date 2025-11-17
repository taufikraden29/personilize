// Enhanced goals functionality
const Goals = {
    goals: [],
    filters: {
        status: 'all',
        category: 'all',
        search: '',
        dateRange: 'all'
    },
    sorting: {
        field: 'deadline',
        order: 'asc'
    },

    init() {
        this.loadGoals();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
        this.updateStats();
        this.checkDeadlines();
    },

    loadGoals() {
        const savedGoals = Storage.get('goals');
        if (savedGoals) {
            this.goals = savedGoals;
        } else {
            Storage.set('goals', this.goals);
        }

        // Migrate old goals to new format if needed
        this.goals = this.goals.map(goal => ({
            ...goal,
            description: goal.description || '',
            subgoals: goal.subgoals || [],
            priority: goal.priority || 'medium',
            tags: goal.tags || [],
            visibility: goal.visibility || 'private',
            collaborators: goal.collaborators || [],
            attachments: goal.attachments || [],
            notes: goal.notes || [],
            createdAt: goal.createdAt || new Date().toISOString(),
            completedAt: goal.completedAt || null
        }));

        this.saveGoals();
    },

    setupEventListeners() {
        // Add goal form
        const addBtn = document.getElementById('add-goal-btn');
        const titleInput = document.getElementById('goal-title');

        if (addBtn && titleInput) {
            addBtn.addEventListener('click', () => this.addGoal());
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addGoal();
                }
            });
        }

        // Filter controls
        const filterSelect = document.getElementById('goal-filter');
        const searchInput = document.getElementById('goal-search');

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
        const sortSelect = document.getElementById('goal-sort');
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

            // Ctrl/Cmd + G: New goal
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                document.getElementById('goal-title')?.focus();
            }

            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('goal-search')?.focus();
            }
        });
    },

    addGoal() {
        const titleInput = document.getElementById('goal-title');
        const category = document.getElementById('goal-category');
        const deadline = document.getElementById('goal-deadline');

        if (!titleInput.value.trim()) {
            this.showNotification('Silakan masukkan judul tujuan', 'warning');
            return;
        }

        try {
            const titleValue = Utils.sanitizeHTML(titleInput.value.trim());

            const goal = {
                id: Date.now(),
                title: titleValue,
                description: '',
                category: category.value,
                deadline: deadline.value,
                priority: 'medium',
                progress: 0,
                subgoals: [],
                tags: this.extractTags(titleValue),
                visibility: 'private',
                collaborators: [],
                attachments: [],
                notes: [],
                createdAt: new Date().toISOString(),
                completedAt: null
            };

            // Validate the goal before saving
            const validation = this.validateGoal(goal);
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }

            this.goals.unshift(goal);
            this.saveGoals();
            this.render();
            this.updateStats();

            // Reset form
            titleInput.value = '';
            deadline.value = '';
            category.value = 'personal';

            // Show notification
            this.showNotification('Tujuan berhasil ditambahkan', 'success');

            // Check achievements
            this.checkAchievements();

            // Track activity
            this.trackActivity('created', goal);

            // Set reminder if deadline exists
            if (goal.deadline) {
                this.setReminder(goal);
            }
        } catch (error) {
            console.error('Error adding goal:', error);
            this.showNotification('Gagal menambahkan tujuan. Silakan coba lagi.', 'error');
        }
    },

    editGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        // Create edit modal
        const modal = this.createEditModal(goal);
        document.body.appendChild(modal);

        // Show modal
        modal.classList.remove('hidden');
        document.getElementById('edit-goal-title').focus();
    },

    updateGoal(id, updates) {
        const goalIndex = this.goals.findIndex(g => g.id === id);
        if (goalIndex === -1) return;

        this.goals[goalIndex] = {
            ...this.goals[goalIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Check if goal is completed
        if (updates.progress === 100 && !this.goals[goalIndex].completedAt) {
            this.goals[goalIndex].completedAt = new Date().toISOString();
            this.showGoalCompletionNotification(this.goals[goalIndex]);
        }

        this.saveGoals();
        this.render();
        this.updateStats();

        this.showNotification('Tujuan berhasil diperbarui', 'success');
        this.trackActivity('updated', this.goals[goalIndex]);

        // Check achievements
        this.checkAchievements();
    },

    deleteGoal(id) {
        const goalIndex = this.goals.findIndex(g => g.id === id);
        if (goalIndex === -1) return;

        const goal = this.goals[goalIndex];

        if (confirm(`Apakah Anda yakin ingin menghapus tujuan "${goal.title}"?`)) {
            this.goals.splice(goalIndex, 1);
            this.saveGoals();
            this.render();
            this.updateStats();

            this.showNotification('Tujuan berhasil dihapus', 'success');
            this.trackActivity('deleted', goal);
        }
    },

    duplicateGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        const duplicatedGoal = {
            ...goal,
            id: Date.now(),
            title: `${goal.title} (Salinan)`,
            progress: 0,
            subgoals: goal.subgoals.map(subgoal => ({
                ...subgoal,
                id: Date.now(),
                completed: false
            })),
            completedAt: null,
            createdAt: new Date().toISOString()
        };

        this.goals.unshift(duplicatedGoal);
        this.saveGoals();
        this.render();

        this.showNotification('Tujuan berhasil diduplikasi', 'success');
    },

    toggleSubgoal(goalId, subgoalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const subgoal = goal.subgoals.find(s => s.id === subgoalId);
        if (!subgoal) return;

        subgoal.completed = !subgoal.completed;

        // Update progress based on subgoals
        const completedSubgoals = goal.subgoals.filter(s => s.completed).length;
        const newProgress = goal.subgoals.length > 0 ?
            Math.round((completedSubgoals / goal.subgoals.length) * 100) : 0;

        this.updateGoal(goalId, {
            progress: newProgress,
            subgoals: goal.subgoals
        });
    },

    addSubgoal(goalId, text) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !text.trim()) return;

        const subgoal = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        goal.subgoals.push(subgoal);
        this.updateGoal(goalId, { subgoals: goal.subgoals });
    },

    addNote(goalId, note) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !note.trim()) return;

        const noteObj = {
            id: Date.now(),
            text: note.trim(),
            createdAt: new Date().toISOString()
        };

        goal.notes.push(noteObj);
        this.updateGoal(goalId, { notes: goal.notes });
    },

    addAttachment(goalId, file) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const attachment = {
                id: Date.now(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                uploadedAt: new Date().toISOString()
            };

            goal.attachments.push(attachment);
            this.updateGoal(goalId, { attachments: goal.attachments });
        };

        reader.readAsDataURL(file);
    },

    addCollaborator(goalId, email) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !email.trim()) return;

        if (!goal.collaborators.includes(email.trim())) {
            goal.collaborators.push(email.trim());
            this.updateGoal(goalId, { collaborators: goal.collaborators });
        }
    },

    setFilter(filterType, value) {
        this.filters[filterType] = value;
    },

    getFilteredGoals() {
        let filtered = [...this.goals];

        // Status filter
        if (this.filters.status !== 'all') {
            switch (this.filters.status) {
                case 'active':
                    filtered = filtered.filter(g => !g.completed);
                    break;
                case 'completed':
                    filtered = filtered.filter(g => g.completed);
                    break;
                case 'overdue':
                    const today = new Date().toISOString().split('T')[0];
                    filtered = filtered.filter(g => !g.completed && g.deadline && g.deadline < today);
                    break;
            }
        }

        // Category filter
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(g => g.category === this.filters.category);
        }

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(g =>
                g.title.toLowerCase().includes(this.filters.search) ||
                g.description.toLowerCase().includes(this.filters.search) ||
                g.tags.some(tag => tag.toLowerCase().includes(this.filters.search))
            );
        }

        // Date range filter
        if (this.filters.dateRange !== 'all') {
            const today = new Date();
            let startDate;

            switch (this.filters.dateRange) {
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate = new Date(today);
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(g =>
                    g.deadline && new Date(g.deadline) >= startDate
                );
            }
        }

        // Sort goals
        filtered.sort((a, b) => {
            let aValue = a[this.sorting.field];
            let bValue = b[this.sorting.field];

            if (this.sorting.field === 'deadline') {
                aValue = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
                bValue = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
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
        const goalsList = document.getElementById('goals-list');
        if (!goalsList) return;

        const filteredGoals = this.getFilteredGoals();

        // Show loading state
        goalsList.innerHTML = '<div class="loading h-32 rounded-lg mb-4"></div>'.repeat(3);

        // Simulate loading delay for better UX
        setTimeout(() => {
            if (filteredGoals.length === 0) {
                goalsList.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-bullseye text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Tidak ada tujuan ditemukan</p>
                        <button class="mt-4 text-indigo-600 hover:text-indigo-800" onclick="Goals.clearFilters()">
                            Hapus filter
                        </button>
                    </div>
                `;
                return;
            }

            goalsList.innerHTML = '';

            filteredGoals.forEach(goal => {
                const goalEl = this.createGoalElement(goal);
                goalsList.appendChild(goalEl);
            });

            // Update stats
            this.updateFilterStats(filteredGoals);
        }, 300);
    },

    createGoalElement(goal) {
        const goalEl = document.createElement('div');
        goalEl.className = `goal-card ${goal.completed ? 'completed' : ''}`;
        goalEl.dataset.id = goal.id;

        const daysLeft = goal.deadline ? this.calculateDaysLeft(goal.deadline) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;
        const isDueSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

        const categoryColors = {
            personal: 'bg-blue-100 text-blue-800',
            career: 'bg-purple-100 text-purple-800',
            health: 'bg-green-100 text-green-800',
            finance: 'bg-yellow-100 text-yellow-800',
            learning: 'bg-indigo-100 text-indigo-800'
        };

        const categoryLabels = {
            personal: 'Pribadi',
            career: 'Karir',
            health: 'Kesehatan',
            finance: 'Keuangan',
            learning: 'Pembelajaran'
        };

        const priorityIcons = {
            high: '<i class="fas fa-exclamation-circle text-red-500"></i>',
            medium: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
            low: '<i class="fas fa-info-circle text-green-500"></i>'
        };

        goalEl.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex-grow">
                    <div class="flex items-center mb-2">
                        <h3 class="text-lg font-semibold ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-800'}">
                            ${this.highlightSearch(goal.title)}
                        </h3>
                        <div class="flex items-center space-x-2 ml-3">
                            <span class="px-2 py-1 rounded-full text-xs ${categoryColors[goal.category]}">
                                ${categoryLabels[goal.category]}
                            </span>
                            ${goal.deadline ? `
                                <span class="text-xs ${isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'}">
                                    ${daysLeft < 0 ? 'Terlewat' : daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
                                </span>
                            ` : ''}
                            ${priorityIcons[goal.priority]}
                        </div>
                    </div>
                    ${goal.description ? `<p class="text-sm text-gray-600 mb-2">${this.highlightSearch(goal.description)}</p>` : ''}
                </div>
                <div class="flex items-center space-x-2">
                    <button class="complete-goal text-green-500 hover:text-green-700" data-id="${goal.id}" title="Complete">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="edit-goal text-blue-500 hover:text-blue-700" data-id="${goal.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="duplicate-goal text-purple-500 hover:text-purple-700" data-id="${goal.id}" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="delete-goal text-red-500 hover:text-red-700" data-id="${goal.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm text-gray-600">Progress</span>
                    <span class="text-sm font-semibold">${goal.progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="h-3 rounded-full transition-all duration-500" 
                         style="width: ${goal.progress}%; background: ${this.getProgressColor(goal.progress)}"></div>
                </div>
            </div>
            
            ${goal.subgoals.length > 0 ? `
                <div class="mb-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Subgoals (${goal.subgoals.filter(s => s.completed).length}/${goal.subgoals.length})</span>
                        <button class="add-subgoal text-indigo-600 hover:text-indigo-800 text-sm" data-id="${goal.id}">
                            <i class="fas fa-plus mr-1"></i> Tambah
                        </button>
                    </div>
                    <div class="space-y-1">
                        ${goal.subgoals.map(subgoal => `
                            <div class="flex items-center p-2 bg-gray-50 rounded">
                                <input type="checkbox" ${subgoal.completed ? 'checked' : ''} 
                                       class="subgoal-checkbox mr-2" data-goal-id="${goal.id}" data-subgoal-id="${subgoal.id}">
                                <span class="${subgoal.completed ? 'line-through text-gray-500' : 'text-gray-700'} text-sm flex-grow">
                                    ${subgoal.text}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${goal.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-3">
                    ${goal.tags.map(tag => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full cursor-pointer hover:bg-gray-200"
                              onclick="Goals.filterByTag('${tag}')">
                            #${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            
            ${goal.notes.length > 0 ? `
                <div class="mb-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Catatan (${goal.notes.length})</span>
                        <button class="add-note text-indigo-600 hover:text-indigo-800 text-sm" data-id="${goal.id}">
                            <i class="fas fa-plus mr-1"></i> Tambah
                        </button>
                    </div>
                    <div class="space-y-1">
                        ${goal.notes.slice(0, 2).map(note => `
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                <span class="text-gray-700">${note.text.substring(0, 50)}${note.text.length > 50 ? '...' : ''}</span>
                                <span class="text-xs text-gray-500">${new Date(note.createdAt).toLocaleDateString('id-ID')}</span>
                            </div>
                        `).join('')}
                        ${goal.notes.length > 2 ? `
                            <button class="text-indigo-600 hover:text-indigo-800 text-xs w-full" data-id="${goal.id}">
                                Lihat semua catatan
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${goal.attachments.length > 0 ? `
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                    <i class="fas fa-paperclip"></i>
                    <span>${goal.attachments.length} lampiran</span>
                </div>
            ` : ''}
        `;

        // Add event listeners
        this.attachGoalEventListeners(goalEl);

        return goalEl;
    },

    createEditModal(goal) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Edit Tujuan</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Judul</label>
                        <input type="text" id="edit-goal-title" value="${goal.title}" 
                               class="form-input" placeholder="Masukkan judul tujuan">
                    </div>
                    
                    <div>
                        <label class="form-label">Deskripsi</label>
                        <textarea id="edit-goal-description" rows="3" class="form-input" 
                                  placeholder="Tambahkan deskripsi tujuan...">${goal.description}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Kategori</label>
                            <select id="edit-goal-category" class="form-input">
                                <option value="personal" ${goal.category === 'personal' ? 'selected' : ''}>Pribadi</option>
                                <option value="career" ${goal.category === 'career' ? 'selected' : ''}>Karir</option>
                                <option value="health" ${goal.category === 'health' ? 'selected' : ''}>Kesehatan</option>
                                <option value="finance" ${goal.category === 'finance' ? 'selected' : ''}>Keuangan</option>
                                <option value="learning" ${goal.category === 'learning' ? 'selected' : ''}>Pembelajaran</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="form-label">Prioritas</label>
                            <select id="edit-goal-priority" class="form-input">
                                <option value="low" ${goal.priority === 'low' ? 'selected' : ''}>Rendah</option>
                                <option value="medium" ${goal.priority === 'medium' ? 'selected' : ''}>Sedang</option>
                                <option value="high" ${goal.priority === 'high' ? 'selected' : ''}>Tinggi</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Deadline</label>
                            <input type="date" id="edit-goal-deadline" value="${goal.deadline}" class="form-input">
                        </div>
                        
                        <div>
                            <label class="form-label">Progress (%)</label>
                            <input type="number" id="edit-goal-progress" value="${goal.progress}" 
                                   min="0" max="100" class="form-input">
                        </div>
                    </div>
                    
                    <div>
                        <label class="form-label">Tags (pisahkan dengan koma)</label>
                        <input type="text" id="edit-goal-tags" value="${goal.tags.join(', ')}" 
                               class="form-input" placeholder="tag1, tag2, tag3">
                    </div>
                    
                    <div>
                        <label class="form-label">Visibilitas</label>
                        <select id="edit-goal-visibility" class="form-input">
                            <option value="private" ${goal.visibility === 'private' ? 'selected' : ''}>Pribadi</option>
                            <option value="public" ${goal.visibility === 'public' ? 'selected' : ''}>Publik</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.fixed').remove()">
                        Batal
                    </button>
                    <button class="btn btn-primary" onclick="Goals.saveGoalChanges('${goal.id}')">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEditModalEventListeners(modal, goal);

        return modal;
    },

    // Helper methods
    extractTags(text) {
        const tagRegex = /#(\w+)/g;
        const matches = text.match(tagRegex);
        return matches ? matches.map(tag => tag.substring(1)) : [];
    },

    highlightSearch(text) {
        if (!this.filters.search) return text;

        const regex = new RegExp(`(${this.filters.search})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    },

    calculateDaysLeft(deadline) {
        const today = new Date();
        const targetDate = new Date(deadline);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getProgressColor(progress) {
        if (progress >= 100) return '#10b981';
        if (progress >= 75) return '#3b82f6';
        if (progress >= 50) return '#f59e0b';
        if (progress >= 25) return '#f97316';
        return '#ef4444';
    },

    showGoalCompletionNotification(goal) {
        const message = `🎉 Selamat! Anda telah menyelesaikan tujuan "${goal.title}"!`;

        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, 'success');
        }

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Tujuan Selesai!', {
                body: message,
                icon: '/favicon.ico'
            });
        }

        // Check for achievements
        this.checkAchievements();
    },

    setReminder(goal) {
        if (!goal.deadline) return;

        const deadlineDate = new Date(goal.deadline);
        const now = new Date();
        const reminderDate = new Date(deadlineDate);
        reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before

        if (reminderDate > now) {
            const reminderId = `goal-reminder-${goal.id}`;

            // Check if reminder already exists
            const existingReminders = Storage.get('goal-reminders') || {};
            if (existingReminders[reminderId]) return;

            // Schedule notification
            const timeUntilReminder = reminderDate - now;
            if (timeUntilReminder > 0) {
                setTimeout(() => {
                    const message = `Reminder: Tujuan "${goal.title}" deadline besok!`;

                    if (typeof App !== 'undefined' && App.showNotification) {
                        App.showNotification(message, 'warning');
                    }

                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Reminder Tujuan', {
                            body: message,
                            icon: '/favicon.ico'
                        });
                    }

                    // Mark reminder as shown
                    existingReminders[reminderId] = true;
                    Storage.set('goal-reminders', existingReminders);
                }, timeUntilReminder);
            }
        }
    },

    checkDeadlines() {
        const today = new Date().toISOString().split('T')[0];
        const upcomingGoals = this.goals.filter(g =>
            !g.completed && g.deadline && g.deadline >= today
        );

        // Check for goals due today or overdue
        upcomingGoals.forEach(goal => {
            const daysLeft = this.calculateDaysLeft(goal.deadline);

            if (daysLeft <= 0) {
                this.showNotification(`Tujuan "${goal.title}" telah terlewat!`, 'error');
            } else if (daysLeft <= 3) {
                this.showNotification(`Tujuan "${goal.title}" akan jatuh tempo dalam ${daysLeft} hari`, 'warning');
            }
        });
    },

    clearFilters() {
        this.filters = {
            status: 'all',
            category: 'all',
            search: '',
            dateRange: 'all'
        };

        // Reset UI
        document.getElementById('goal-filter').value = 'all';
        document.getElementById('goal-search').value = '';
        document.getElementById('goal-sort').value = 'deadline-asc';

        this.render();
    },

    updateFilterStats(filteredGoals) {
        const statsEl = document.getElementById('goal-stats');
        if (!statsEl) return;

        const total = this.goals.length;
        const completed = this.goals.filter(g => g.completed).length;
        const overdue = this.goals.filter(g => {
            const today = new Date().toISOString().split('T')[0];
            return !g.completed && g.deadline && g.deadline < today;
        }).length;

        statsEl.innerHTML = `
            <span class="text-sm text-gray-500">
                Menampilkan ${filteredGoals.length} dari ${total} tujuan: ${completed} selesai, ${overdue} terlewat
            </span>
        `;
    },

    saveGoals() {
        try {
            Storage.set('goals', this.goals);
        } catch (error) {
            console.error('Error saving goals:', error);
            this.showNotification('Gagal menyimpan tujuan. Data mungkin tidak disimpan secara permanen.', 'error');
        }
    },

    updateStats() {
        const activeGoalsCount = document.getElementById('active-goals-count');
        if (activeGoalsCount) {
            activeGoalsCount.textContent = this.goals.filter(g => !g.completed).length;
        }
    },

    checkAchievements() {
        const completedGoals = this.goals.filter(g => g.completed).length;

        const data = {
            totalGoals: this.goals.length,
            completedGoals
        };

        Achievements.checkAchievements(data);
    },

    trackActivity(action, goal) {
        const activity = {
            type: 'goal',
            action: action,
            goalId: goal.id,
            goalTitle: goal.title,
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
    attachGoalEventListeners(goalEl) {
        const completeBtn = goalEl.querySelector('.complete-goal');
        const editBtn = goalEl.querySelector('.edit-goal');
        const duplicateBtn = goalEl.querySelector('.duplicate-goal');
        const deleteBtn = goalEl.querySelector('.delete-goal');

        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                this.updateGoal(parseInt(completeBtn.dataset.id), { progress: 100 });
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editGoal(parseInt(editBtn.dataset.id));
            });
        }

        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => {
                this.duplicateGoal(parseInt(duplicateBtn.dataset.id));
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteGoal(parseInt(deleteBtn.dataset.id));
            });
        }

        // Subgoal event listeners
        const subgoalCheckboxes = goalEl.querySelectorAll('.subgoal-checkbox');
        subgoalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleSubgoal(
                    parseInt(checkbox.dataset.goalId),
                    parseInt(checkbox.dataset.subgoalId)
                );
            });
        });

        const addSubgoalBtn = goalEl.querySelector('.add-subgoal');
        if (addSubgoalBtn) {
            addSubgoalBtn.addEventListener('click', () => {
                const text = prompt('Tambah subgoal baru:');
                if (text && text.trim()) {
                    this.addSubgoal(parseInt(addSubgoalBtn.dataset.id), text);
                }
            });
        }

        // Note event listeners
        const addNoteBtn = goalEl.querySelector('.add-note');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => {
                const text = prompt('Tambah catatan baru:');
                if (text && text.trim()) {
                    this.addNote(parseInt(addNoteBtn.dataset.id), text);
                }
            });
        }
    },

    attachEditModalEventListeners(modal, goal) {
        const closeBtn = modal.querySelector('.close-modal');
        const saveBtn = modal.querySelector('#save-goal-changes');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const updates = {
                    title: Utils.sanitizeHTML(document.getElementById('edit-goal-title').value),
                    description: Utils.sanitizeHTML(document.getElementById('edit-goal-description').value),
                    category: document.getElementById('edit-goal-category').value,
                    priority: document.getElementById('edit-goal-priority').value,
                    deadline: document.getElementById('edit-goal-deadline').value,
                    progress: parseInt(document.getElementById('edit-goal-progress').value) || 0,
                    tags: document.getElementById('edit-goal-tags').value
                        .split(',')
                        .map(tag => Utils.sanitizeHTML(tag.trim()))
                        .filter(tag => tag),
                    visibility: document.getElementById('edit-goal-visibility').value
                };

                this.updateGoal(goal.id, updates);
                modal.remove();
            });
        }
    },

    saveGoalChanges(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const updates = {
            title: document.getElementById('edit-goal-title').value,
            description: document.getElementById('edit-goal-description').value,
            category: document.getElementById('edit-goal-category').value,
            priority: document.getElementById('edit-goal-priority').value,
            deadline: document.getElementById('edit-goal-deadline').value,
            progress: parseInt(document.getElementById('edit-goal-progress').value) || 0,
            tags: document.getElementById('edit-goal-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            visibility: document.getElementById('edit-goal-visibility').value
        };

        this.updateGoal(goalId, updates);
    },

    filterByTag(tag) {
        this.filters.tags = [tag];
        this.render();
    },

    // Clean up resources to prevent memory leaks
    destroy() {
        // Clear any active intervals or timeouts if present
        // Remove any references to DOM elements
    },

    // Validate goal input data
    validateGoal(goal) {
        if (!goal || typeof goal !== 'object') {
            return { valid: false, message: 'Data tujuan tidak valid' };
        }

        if (!goal.title || typeof goal.title !== 'string' || goal.title.trim().length === 0) {
            return { valid: false, message: 'Judul tujuan tidak boleh kosong' };
        }

        if (goal.title.length > 100) {
            return { valid: false, message: 'Judul tujuan terlalu panjang (maksimal 100 karakter)' };
        }

        if (goal.description && typeof goal.description !== 'string') {
            return { valid: false, message: 'Deskripsi tujuan harus berupa string' };
        }

        if (goal.description && goal.description.length > 1000) {
            return { valid: false, message: 'Deskripsi tujuan terlalu panjang (maksimal 1000 karakter)' };
        }

        if (goal.progress && (typeof goal.progress !== 'number' || goal.progress < 0 || goal.progress > 100)) {
            return { valid: false, message: 'Progress tujuan harus antara 0-100' };
        }

        if (goal.category && !['personal', 'career', 'health', 'finance', 'learning'].includes(goal.category)) {
            return { valid: false, message: 'Kategori tujuan tidak valid' };
        }

        if (goal.priority && !['low', 'medium', 'high'].includes(goal.priority)) {
            return { valid: false, message: 'Prioritas tujuan tidak valid' };
        }

        if (goal.tags && Array.isArray(goal.tags)) {
            for (let i = 0; i < goal.tags.length; i++) {
                const tag = goal.tags[i];
                if (typeof tag !== 'string' || tag.trim().length === 0) {
                    return { valid: false, message: `Tag ke-${i} tidak valid: tag tidak boleh kosong` };
                }
                if (tag.length > 30) {
                    return { valid: false, message: `Tag ke-${i} terlalu panjang (maksimal 30 karakter)` };
                }
            }
        }

        if (goal.deadline) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(goal.deadline)) {
                return { valid: false, message: 'Format tanggal deadline tidak valid (harus YYYY-MM-DD)' };
            }
        }

        return { valid: true };
    }
};