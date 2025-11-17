// Enhanced goals functionality
const Goals = {
    goals: [],
    filters: {
        status: 'all',
        category: 'all',
        search: '',
        dateRange: 'all',
        priority: 'all',
        tags: []
    },
    sorting: {
        field: 'deadline',
        order: 'asc'
    },
    templates: [
        { name: 'Kesehatan & Kebugaran', category: 'health', description: 'Meningkatkan kesehatan dan kebugaran secara keseluruhan' },
        { name: 'Karir & Profesional', category: 'career', description: 'Mencapai tujuan profesional dan pengembangan karir' },
        { name: 'Finansial', category: 'finance', description: 'Mengelola keuangan dan mencapai tujuan finansial' },
        { name: 'Pembelajaran & Keterampilan', category: 'learning', description: 'Mengembangkan keterampilan dan pengetahuan baru' },
        { name: 'Pribadi & Hubungan', category: 'personal', description: 'Meningkatkan kualitas hidup pribadi dan hubungan' }
    ],
    stats: {
        total: 0,
        completed: 0,
        active: 0,
        overdue: 0,
        highPriority: 0,
        byCategory: {}
    },

    init() {
        this.loadGoals();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
        this.updateStats();
        this.checkDeadlines();
        this.setupGoalReminders();
        this.loadGoalTemplates();
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
            completedAt: goal.completedAt || null,
            milestones: goal.milestones || [],
            dependencies: goal.dependencies || [],
            impact: goal.impact || 0, // 1-10 scale
            reflection: goal.reflection || null,
            sharedWith: goal.sharedWith || [],
            reminderTime: goal.reminderTime || null,
            backup: goal.backup || null
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
        const priorityFilter = document.getElementById('goal-priority-filter');
        const categoryFilter = document.getElementById('goal-category-filter');

        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.setFilter('status', filterSelect.value);
                this.render();
            });
        }

        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => {
                this.setFilter('priority', priorityFilter.value);
                this.render();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.setFilter('category', categoryFilter.value);
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

        // Template controls
        const templateBtn = document.getElementById('goal-template-btn');
        if (templateBtn) {
            templateBtn.addEventListener('click', () => this.showTemplateModal());
        }

        // Export/Import controls
        const exportBtn = document.getElementById('export-goals');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportGoals());
        }

        const importBtn = document.getElementById('import-goals');
        if (importBtn) {
            importBtn.addEventListener('click', () => document.getElementById('import-goals-file').click());
        }

        const importFileInput = document.getElementById('import-goals-file');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => this.importGoals(e.target.files[0]));
        }

        // Backup/Restore controls
        const backupBtn = document.getElementById('backup-goals');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.backupGoals());
        }

        const restoreBtn = document.getElementById('restore-goals');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => document.getElementById('restore-goals-file').click());
        }

        const restoreFileInput = document.getElementById('restore-goals-file');
        if (restoreFileInput) {
            restoreFileInput.addEventListener('change', (e) => this.restoreGoals(e.target.files[0]));
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
        const priority = document.getElementById('goal-priority');
        const description = document.getElementById('goal-description');
        const impact = document.getElementById('goal-impact');

        if (!titleInput.value.trim()) {
            this.showNotification('Silakan masukkan judul tujuan', 'warning');
            return;
        }

        try {
            const titleValue = Utils.sanitizeHTML(titleInput.value.trim());
            const descriptionValue = Utils.sanitizeHTML(description ? description.value : '');

            const goal = {
                id: Date.now(),
                title: titleValue,
                description: descriptionValue,
                category: category.value,
                deadline: deadline.value,
                priority: priority ? priority.value : 'medium',
                progress: 0,
                subgoals: [],
                tags: this.extractTags(titleValue),
                visibility: 'private',
                collaborators: [],
                attachments: [],
                notes: [],
                milestones: [],
                dependencies: [],
                impact: impact ? parseInt(impact.value) || 0 : 0,
                reflection: null,
                sharedWith: [],
                reminderTime: null,
                backup: null,
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
            if (priority) priority.value = 'medium';
            if (description) description.value = '';
            if (impact) impact.value = 5;

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

        // Priority filter
        if (this.filters.priority !== 'all') {
            filtered = filtered.filter(g => g.priority === this.filters.priority);
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
            } else if (this.sorting.field === 'priority') {
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                aValue = priorityOrder[a.priority] || 0;
                bValue = priorityOrder[b.priority] || 0;
            } else if (this.sorting.field === 'impact') {
                aValue = a.impact || 0;
                bValue = b.impact || 0;
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
        goalEl.className = `goal-card bg-white rounded-xl shadow-lg p-5 mb-4 transition-all duration-300 hover:shadow-xl border-l-4 ${
            goal.priority === 'high' ? 'border-red-500' :
            goal.priority === 'medium' ? 'border-yellow-500' :
            'border-green-500'
        } ${goal.completed ? 'opacity-75' : ''}`;
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
            high: '<i class="fas fa-exclamation-circle text-red-500" title="Prioritas Tinggi"></i>',
            medium: '<i class="fas fa-exclamation-triangle text-yellow-500" title="Prioritas Sedang"></i>',
            low: '<i class="fas fa-info-circle text-green-500" title="Prioritas Rendah"></i>'
        };

        // Calculate milestone progress
        const completedMilestones = goal.milestones.filter(m => m.completed).length;
        const milestoneProgress = goal.milestones.length > 0 ?
            Math.round((completedMilestones / goal.milestones.length) * 100) : 0;

        goalEl.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div class="flex-grow mb-3 md:mb-0">
                    <div class="flex items-center mb-2">
                        <h3 class="text-lg font-bold ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-800'}">
                            ${this.highlightSearch(goal.title)}
                        </h3>
                        <div class="flex items-center space-x-2 ml-3">
                            <span class="px-2 py-1 rounded-full text-xs ${categoryColors[goal.category]}">
                                ${categoryLabels[goal.category]}
                            </span>
                            ${goal.deadline ? `
                                <span class="text-xs ${isOverdue ? 'text-red-600 font-bold' : isDueSoon ? 'text-yellow-600 font-semibold' : 'text-gray-500'}">
                                    ${daysLeft < 0 ? 'Terlewat' : daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
                                </span>
                            ` : ''}
                            ${priorityIcons[goal.priority]}
                        </div>
                    </div>
                    ${goal.description ? `<p class="text-sm text-gray-600 mb-2">${this.highlightSearch(goal.description)}</p>` : ''}

                    <!-- Impact visualization -->
                    <div class="flex items-center mb-2">
                        <span class="text-xs text-gray-500 mr-2">Dampak:</span>
                        ${this.renderImpactStars(goal.impact)}
                    </div>
                </div>

                <div class="flex items-center space-x-2">
                    ${goal.completed ?
                        '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Selesai</span>' :
                        `<button class="complete-goal text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors" data-id="${goal.id}" title="Tandai Selesai">
                            <i class="fas fa-check-circle"></i>
                        </button>`
                    }
                    <button class="edit-goal text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors" data-id="${goal.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="duplicate-goal text-purple-500 hover:text-purple-700 p-2 rounded-full hover:bg-purple-50 transition-colors" data-id="${goal.id}" title="Duplikat">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="share-goal text-indigo-500 hover:text-indigo-700 p-2 rounded-full hover:bg-indigo-50 transition-colors" data-id="${goal.id}" title="Bagikan">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="delete-goal text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors" data-id="${goal.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <!-- Progress section -->
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Progress</span>
                    <span class="text-sm font-bold">${goal.progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
                        goal.progress === 100 ? 'from-green-400 to-green-600' :
                        goal.progress >= 75 ? 'from-blue-400 to-blue-600' :
                        goal.progress >= 50 ? 'from-yellow-400 to-yellow-600' :
                        goal.progress >= 25 ? 'from-orange-400 to-orange-600' :
                        'from-red-400 to-red-600'
                    }" style="width: ${goal.progress}%"></div>
                </div>
            </div>

            <!-- Milestones section -->
            ${goal.milestones.length > 0 ? `
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Tahapan (${completedMilestones}/${goal.milestones.length})</span>
                        <button class="add-milestone text-indigo-600 hover:text-indigo-800 text-sm" data-id="${goal.id}">
                            <i class="fas fa-plus mr-1"></i> Tambah
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${goal.milestones.map(milestone => `
                            <div class="flex items-center p-2 bg-gray-50 rounded-lg">
                                <input type="checkbox" ${milestone.completed ? 'checked' : ''}
                                       class="milestone-checkbox mr-2 h-4 w-4 text-indigo-600 rounded"
                                       data-goal-id="${goal.id}" data-milestone-id="${milestone.id}">
                                <span class="${milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'} text-sm flex-grow">
                                    ${milestone.title}
                                </span>
                                ${milestone.dueDate ? `
                                    <span class="text-xs text-gray-500 ml-2">${new Date(milestone.dueDate).toLocaleDateString('id-ID')}</span>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Subgoals section -->
            ${goal.subgoals.length > 0 ? `
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Subgoals (${goal.subgoals.filter(s => s.completed).length}/${goal.subgoals.length})</span>
                        <button class="add-subgoal text-indigo-600 hover:text-indigo-800 text-sm" data-id="${goal.id}">
                            <i class="fas fa-plus mr-1"></i> Tambah
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${goal.subgoals.map(subgoal => `
                            <div class="flex items-center p-2 bg-gray-50 rounded-lg">
                                <input type="checkbox" ${subgoal.completed ? 'checked' : ''}
                                       class="subgoal-checkbox mr-2 h-4 w-4 text-indigo-600 rounded" data-goal-id="${goal.id}" data-subgoal-id="${subgoal.id}">
                                <span class="${subgoal.completed ? 'line-through text-gray-500' : 'text-gray-700'} text-sm flex-grow">
                                    ${subgoal.text}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Dependencies section -->
            ${goal.dependencies.length > 0 ? `
                <div class="mb-4">
                    <div class="text-sm text-gray-600 mb-2">Ketergantungan</div>
                    <div class="flex flex-wrap gap-1">
                        ${goal.dependencies.map(dep => `
                            <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                ${dep}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Tags section -->
            ${goal.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-4">
                    ${goal.tags.map(tag => `
                        <span class="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full cursor-pointer hover:bg-indigo-200 transition-colors"
                              onclick="Goals.filterByTag('${tag}')">
                            #${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Notes section -->
            ${goal.notes.length > 0 ? `
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Catatan (${goal.notes.length})</span>
                        <button class="add-note text-indigo-600 hover:text-indigo-800 text-sm" data-id="${goal.id}">
                            <i class="fas fa-plus mr-1"></i> Tambah
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${goal.notes.slice(0, 2).map(note => `
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <p class="text-sm text-gray-700">${note.text.substring(0, 100)}${note.text.length > 100 ? '...' : ''}</p>
                                <div class="text-xs text-gray-500 mt-1">${new Date(note.createdAt).toLocaleDateString('id-ID')}</div>
                            </div>
                        `).join('')}
                        ${goal.notes.length > 2 ? `
                            <button class="text-indigo-600 hover:text-indigo-800 text-xs w-full text-left p-2 rounded-lg hover:bg-gray-50" data-id="${goal.id}">
                                Lihat semua catatan
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Additional info -->
            <div class="flex flex-wrap justify-between text-sm text-gray-500">
                ${goal.attachments.length > 0 ? `
                    <div class="flex items-center space-x-1">
                        <i class="fas fa-paperclip text-xs"></i>
                        <span>${goal.attachments.length} lampiran</span>
                    </div>
                ` : ''}

                ${goal.collaborators.length > 0 ? `
                    <div class="flex items-center space-x-1">
                        <i class="fas fa-users text-xs"></i>
                        <span>${goal.collaborators.length} kolaborator</span>
                    </div>
                ` : ''}

                ${goal.createdAt ? `
                    <div class="flex items-center space-x-1">
                        <i class="fas fa-calendar text-xs"></i>
                        <span>${new Date(goal.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                ` : ''}
            </div>
        `;

        // Add event listeners
        this.attachGoalEventListeners(goalEl);

        return goalEl;
    },

    // Render impact stars for visualization
    renderImpactStars(impact) {
        let stars = '';
        for (let i = 1; i <= 10; i++) {
            stars += `<i class="fas fa-star ${i <= impact ? 'text-yellow-400' : 'text-gray-300'} text-xs"></i>`;
        }
        return stars;
    },

    // Setup goal reminders
    setupGoalReminders() {
        // Check for upcoming deadlines and set reminders
        this.goals.forEach(goal => {
            if (goal.deadline && !goal.completed) {
                this.setReminder(goal);
            }
        });
    },

    // Load goal templates
    loadGoalTemplates() {
        // Templates are already defined in the class property
    },

    // Show template modal
    showTemplateModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Template Tujuan</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this.templates.map(template => `
                        <div class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer template-item"
                             data-name="${template.name}"
                             data-category="${template.category}"
                             data-description="${template.description}">
                            <h3 class="font-semibold text-gray-800">${template.name}</h3>
                            <p class="text-sm text-gray-600 mt-1">${template.description}</p>
                            <div class="mt-2">
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    ${template.category}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-6 text-center">
                    <button class="btn btn-primary" onclick="Goals.closeTemplateModal(this)">
                        Tutup
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners to template items
        const templateItems = modal.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const category = item.dataset.category;
                const description = item.dataset.description;

                // Fill the goal form with template data
                document.getElementById('goal-title').value = name;
                document.getElementById('goal-category').value = category;
                document.getElementById('goal-description').value = description;

                // Close modal
                modal.remove();
            });
        });

        // Add event listener to close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    },

    // Close template modal
    closeTemplateModal(element) {
        const modal = element.closest('.fixed');
        modal.remove();
    },

    // Export goals functionality
    exportGoals() {
        const dataStr = JSON.stringify(this.goals, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = 'goals-export.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showNotification('Tujuan berhasil diekspor', 'success');
    },

    // Import goals functionality
    importGoals(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedGoals = JSON.parse(e.target.result);

                if (Array.isArray(importedGoals)) {
                    this.goals = [...this.goals, ...importedGoals];
                    this.saveGoals();
                    this.render();
                    this.updateStats();
                    this.showNotification('Tujuan berhasil diimpor', 'success');
                } else {
                    this.showNotification('Format file tidak valid', 'error');
                }
            } catch (error) {
                console.error('Error importing goals:', error);
                this.showNotification('Gagal mengimpor tujuan. File mungkin rusak.', 'error');
            }
        };

        reader.readAsText(file);
    },

    // Backup goals functionality
    backupGoals() {
        const backupData = {
            goals: this.goals,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const backupFileDefaultName = `goals-backup-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', backupFileDefaultName);
        linkElement.click();

        this.showNotification('Backup tujuan berhasil dibuat', 'success');
    },

    // Restore goals functionality
    restoreGoals(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);

                if (backupData.goals && Array.isArray(backupData.goals)) {
                    this.goals = backupData.goals;
                    this.saveGoals();
                    this.render();
                    this.updateStats();
                    this.showNotification('Tujuan berhasil dipulihkan dari backup', 'success');
                } else {
                    this.showNotification('File backup tidak valid', 'error');
                }
            } catch (error) {
                console.error('Error restoring goals:', error);
                this.showNotification('Gagal memulihkan tujuan. File mungkin rusak.', 'error');
            }
        };

        reader.readAsText(file);
    },

    // Add milestone to goal
    addMilestone(goalId, title, dueDate = null) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !title.trim()) return;

        const milestone = {
            id: Date.now(),
            title: title.trim(),
            completed: false,
            dueDate: dueDate,
            createdAt: new Date().toISOString()
        };

        goal.milestones.push(milestone);
        this.updateGoal(goalId, { milestones: goal.milestones });
    },

    // Toggle milestone completion
    toggleMilestone(goalId, milestoneId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const milestone = goal.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        milestone.completed = !milestone.completed;

        // Update progress based on milestones
        const completedMilestones = goal.milestones.filter(m => m.completed).length;
        const milestoneProgress = goal.milestones.length > 0 ?
            Math.round((completedMilestones / goal.milestones.length) * 100) : 0;

        // Calculate overall progress based on milestones and subgoals
        const subgoalProgress = goal.subgoals.length > 0 ?
            Math.round((goal.subgoals.filter(s => s.completed).length / goal.subgoals.length) * 100) : 0;

        const overallProgress = Math.round((milestoneProgress + subgoalProgress) / 2);

        this.updateGoal(goalId, {
            progress: overallProgress,
            milestones: goal.milestones
        });
    },

    // Share goal functionality
    shareGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Create share modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Bagikan Tujuan</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="mb-4">
                    <label class="form-label">Email Penerima</label>
                    <input type="email" id="share-email" placeholder="email@example.com"
                           class="form-input w-full">
                </div>

                <div class="mb-4">
                    <label class="form-label">Pesan (opsional)</label>
                    <textarea id="share-message" rows="3" placeholder="Tambahkan pesan..."
                              class="form-input w-full"></textarea>
                </div>

                <div class="flex justify-end space-x-3">
                    <button class="btn btn-ghost close-modal">Batal</button>
                    <button class="btn btn-primary" onclick="Goals.sendShareRequest(${goalId})">
                        Kirim Undangan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
    },

    // Send share request
    sendShareRequest(goalId) {
        const email = document.getElementById('share-email').value;
        const message = document.getElementById('share-message').value;

        if (!email) {
            this.showNotification('Silakan masukkan email penerima', 'error');
            return;
        }

        // Add email to sharedWith array
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            if (!goal.sharedWith.includes(email)) {
                goal.sharedWith.push(email);
                this.updateGoal(goalId, { sharedWith: goal.sharedWith });
            }
        }

        // In a real app, you would send an email here
        this.showNotification(`Undangan telah dikirim ke ${email}`, 'success');

        // Close modal
        const modal = document.querySelector('#share-email').closest('.fixed');
        modal.remove();
    },

    // Show goal completion celebration
    showGoalCompletionCelebration(goal) {
        // Create celebration effect
        const celebration = document.createElement('div');
        celebration.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
        celebration.innerHTML = `
            <div class="bg-white rounded-lg p-8 text-center max-w-md mx-4 relative">
                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <i class="fas fa-trophy text-5xl text-yellow-500"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mt-6">Selamat!</h2>
                <p class="text-gray-600 mt-2">Anda telah menyelesaikan tujuan:</p>
                <p class="text-lg font-semibold text-indigo-600 mt-2">${goal.title}</p>

                <div class="mt-6">
                    <button class="btn btn-primary" onclick="this.closest('.fixed').remove()">
                        Lanjutkan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(celebration);

        // Add celebration animation
        setTimeout(() => {
            celebration.remove();
        }, 3000);
    },

    // Show reflection prompt after goal completion
    showReflectionPrompt(goal) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Refleksi Tujuan</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="mb-4">
                    <h3 class="font-semibold text-gray-700 mb-2">Bagaimana Anda mencapai tujuan ini?</h3>
                    <textarea id="reflection-approach" rows="3" placeholder="Jelaskan pendekatan yang Anda gunakan..."
                              class="form-input w-full"></textarea>
                </div>

                <div class="mb-4">
                    <h3 class="font-semibold text-gray-700 mb-2">Apa pelajaran yang Anda dapatkan?</h3>
                    <textarea id="reflection-lesson" rows="3" placeholder="Apa yang Anda pelajari dari proses ini?"
                              class="form-input w-full"></textarea>
                </div>

                <div class="mb-4">
                    <h3 class="font-semibold text-gray-700 mb-2">Bagaimana Anda bisa meningkatkan di masa depan?</h3>
                    <textarea id="reflection-improvement" rows="3" placeholder="Apa yang akan Anda lakukan berbeda di masa depan?"
                              class="form-input w-full"></textarea>
                </div>

                <div class="flex justify-end space-x-3">
                    <button class="btn btn-ghost close-modal">Lewati</button>
                    <button class="btn btn-primary" onclick="Goals.saveReflection(${goal.id})">
                        Simpan Refleksi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
    },

    // Save reflection to goal
    saveReflection(goalId) {
        const approach = document.getElementById('reflection-approach').value;
        const lesson = document.getElementById('reflection-lesson').value;
        const improvement = document.getElementById('reflection-improvement').value;

        const reflection = {
            approach: approach,
            lesson: lesson,
            improvement: improvement,
            completedAt: new Date().toISOString()
        };

        this.updateGoal(goalId, { reflection: reflection });

        // Close modal
        const modal = document.querySelector('#reflection-approach').closest('.fixed');
        modal.remove();

        this.showNotification('Refleksi berhasil disimpan', 'success');
    },

    // Update the showGoalCompletionNotification to include celebration and reflection
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

        // Show celebration effect
        this.showGoalCompletionCelebration(goal);

        // Show reflection prompt after a short delay
        setTimeout(() => {
            this.showReflectionPrompt(goal);
        }, 1000);

        // Check for achievements
        this.checkAchievements();
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

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <div>
                            <label class="form-label">Deadline</label>
                            <input type="date" id="edit-goal-deadline" value="${goal.deadline}" class="form-input">
                        </div>

                        <div>
                            <label class="form-label">Progress (%)</label>
                            <input type="number" id="edit-goal-progress" value="${goal.progress}"
                                   min="0" max="100" class="form-input">
                        </div>

                        <div>
                            <label class="form-label">Dampak (1-10)</label>
                            <input type="range" id="edit-goal-impact" min="1" max="10" value="${goal.impact || 5}"
                                   class="w-full">
                            <div class="flex justify-between text-xs text-gray-500">
                                <span>1 (Rendah)</span>
                                <span>5 (Sedang)</span>
                                <span>10 (Tinggi)</span>
                            </div>
                        </div>

                        <div>
                            <label class="form-label">Visibilitas</label>
                            <select id="edit-goal-visibility" class="form-input">
                                <option value="private" ${goal.visibility === 'private' ? 'selected' : ''}>Pribadi</option>
                                <option value="public" ${goal.visibility === 'public' ? 'selected' : ''}>Publik</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="form-label">Tags (pisahkan dengan koma)</label>
                        <input type="text" id="edit-goal-tags" value="${goal.tags.join(', ')}"
                               class="form-input" placeholder="tag1, tag2, tag3">
                    </div>

                    <div>
                        <label class="form-label">Ketergantungan (pisahkan dengan koma)</label>
                        <input type="text" id="edit-goal-dependencies" value="${goal.dependencies.join(', ')}"
                               class="form-input" placeholder="tujuan1, tujuan2, tujuan3">
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost close-modal">Batal</button>
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

    // Update the saveGoalChanges method to handle new fields
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
            impact: parseInt(document.getElementById('edit-goal-impact').value) || 5,
            tags: document.getElementById('edit-goal-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            dependencies: document.getElementById('edit-goal-dependencies').value
                .split(',')
                .map(dep => dep.trim())
                .filter(dep => dep),
            visibility: document.getElementById('edit-goal-visibility').value
        };

        this.updateGoal(goalId, updates);
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
        const active = this.goals.filter(g => !g.completed).length;
        const overdue = this.goals.filter(g => {
            const today = new Date().toISOString().split('T')[0];
            return !g.completed && g.deadline && g.deadline < today;
        }).length;
        const highPriority = this.goals.filter(g => g.priority === 'high').length;

        statsEl.innerHTML = `
            <div class="flex flex-wrap justify-between items-center text-sm text-gray-500">
                <div class="flex flex-wrap gap-4">
                    <span>Menampilkan <span class="font-semibold">${filteredGoals.length}</span> dari <span class="font-semibold">${total}</span> tujuan</span>
                    <span><span class="font-semibold">${completed}</span> selesai</span>
                    <span><span class="font-semibold">${active}</span> aktif</span>
                    <span><span class="font-semibold">${overdue}</span> terlewat</span>
                    <span><span class="font-semibold">${highPriority}</span> prioritas tinggi</span>
                </div>
                <div class="mt-2 md:mt-0">
                    <button class="text-indigo-600 hover:text-indigo-800 text-sm" onclick="Goals.clearFilters()">
                        <i class="fas fa-times mr-1"></i> Hapus semua filter
                    </button>
                </div>
            </div>
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

        // Calculate comprehensive stats
        this.stats.total = this.goals.length;
        this.stats.completed = this.goals.filter(g => g.completed).length;
        this.stats.active = this.goals.filter(g => !g.completed).length;

        const today = new Date().toISOString().split('T')[0];
        this.stats.overdue = this.goals.filter(g => {
            return !g.completed && g.deadline && g.deadline < today;
        }).length;

        this.stats.highPriority = this.goals.filter(g => g.priority === 'high').length;

        // Calculate by category
        this.stats.byCategory = {};
        this.goals.forEach(goal => {
            if (!this.stats.byCategory[goal.category]) {
                this.stats.byCategory[goal.category] = 0;
            }
            this.stats.byCategory[goal.category]++;
        });
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
        const shareBtn = goalEl.querySelector('.share-goal');

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

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareGoal(parseInt(shareBtn.dataset.id));
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

        // Milestone event listeners
        const milestoneCheckboxes = goalEl.querySelectorAll('.milestone-checkbox');
        milestoneCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleMilestone(
                    parseInt(checkbox.dataset.goalId),
                    parseInt(checkbox.dataset.milestoneId)
                );
            });
        });

        const addMilestoneBtn = goalEl.querySelector('.add-milestone');
        if (addMilestoneBtn) {
            addMilestoneBtn.addEventListener('click', () => {
                const title = prompt('Tambah tahapan baru:');
                if (title && title.trim()) {
                    this.addMilestone(parseInt(addMilestoneBtn.dataset.id), title);
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
        const closeBtns = modal.querySelectorAll('.close-modal');

        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
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