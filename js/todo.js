// Enhanced todo list functionality
const Todo = {
    todos: [],
    filters: {
        status: 'all',
        priority: 'all',
        category: 'all',
        search: '',
        dateRange: 'all'
    },
    sorting: {
        field: 'createdAt',
        order: 'desc'
    },
    selectedIds: new Set(), // For bulk operations
    collaborators: [], // For task collaboration
    templates: [], // For task templates
    dependencies: [], // For task dependencies

    init() {
        this.loadTodos();
        this.loadTemplates();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupKeyboardShortcuts();
        this.setupCollaboration();
        this.setupCalendarIntegration();
        this.render();
        this.updateStats();
        this.checkRecurringTodos(); // Check for recurring todos that should be created
        this.setupNotifications();
        this.setupTaskSharing();
    },

    loadTodos() {
        const savedTodos = Storage.get('todos');
        if (savedTodos) {
            this.todos = savedTodos;
        }

        // Migrate old todos to new format if needed
        this.todos = this.todos.map(todo => ({
            ...todo,
            category: todo.category || 'personal',
            tags: todo.tags || [],
            subtasks: todo.subtasks || [],
            estimatedTime: todo.estimatedTime || 0,
            actualTime: todo.actualTime || 0,
            attachments: todo.attachments || [],
            reminders: todo.reminders || [],
            isRecurring: todo.isRecurring || false,
            recurrencePattern: todo.recurrencePattern || null,
            lastCompleted: todo.lastCompleted || null,
            notes: todo.notes || '',
            completedSubtasks: todo.completedSubtasks || 0,
            collaborators: todo.collaborators || [],
            dependencies: todo.dependencies || [],
            progress: todo.progress || 0,
            impact: todo.impact || 'medium',
            reflection: todo.reflection || '',
            achievement: todo.achievement || false,
            templateId: todo.templateId || null,
            isShared: todo.isShared || false,
            sharedWith: todo.sharedWith || []
        }));

        this.saveTodos();
    },

    loadTemplates() {
        const savedTemplates = Storage.get('todoTemplates');
        if (savedTemplates) {
            this.templates = savedTemplates;
        } else {
            // Default templates
            this.templates = [
                {
                    id: 'work',
                    name: 'Tugas Kantor',
                    text: 'Lakukan tugas kantor',
                    priority: 'high',
                    category: 'work',
                    estimatedTime: 60,
                    tags: ['kerja', 'penting'],
                    subtasks: [
                        { id: Date.now() + 1, text: 'Siapkan dokumen', completed: false },
                        { id: Date.now() + 2, text: 'Kerjakan proyek', completed: false },
                        { id: Date.now() + 3, text: 'Review hasil', completed: false }
                    ]
                },
                {
                    id: 'health',
                    name: 'Kesehatan',
                    text: 'Perawatan kesehatan',
                    priority: 'medium',
                    category: 'health',
                    estimatedTime: 30,
                    tags: ['sehat', 'olahraga'],
                    subtasks: [
                        { id: Date.now() + 4, text: 'Olahraga ringan', completed: false },
                        { id: Date.now() + 5, text: 'Makan sehat', completed: false },
                        { id: Date.now() + 6, text: 'Istirahat cukup', completed: false }
                    ]
                },
                {
                    id: 'finance',
                    name: 'Keuangan',
                    text: 'Pengelolaan keuangan',
                    priority: 'high',
                    category: 'finance',
                    estimatedTime: 45,
                    tags: ['keuangan', 'penting'],
                    subtasks: [
                        { id: Date.now() + 7, text: 'Cek rekening', completed: false },
                        { id: Date.now() + 8, text: 'Catat pengeluaran', completed: false },
                        { id: Date.now() + 9, text: 'Buat anggaran', completed: false }
                    ]
                },
                {
                    id: 'learning',
                    name: 'Pembelajaran',
                    text: 'Belajar keterampilan baru',
                    priority: 'medium',
                    category: 'education',
                    estimatedTime: 120,
                    tags: ['belajar', 'keterampilan'],
                    subtasks: [
                        { id: Date.now() + 10, text: 'Baca materi', completed: false },
                        { id: Date.now() + 11, text: 'Praktik langsung', completed: false },
                        { id: Date.now() + 12, text: 'Evaluasi progres', completed: false }
                    ]
                }
            ];
            Storage.set('todoTemplates', this.templates);
        }
    },

    setupEventListeners() {
        // Add todo form
        const addBtn = document.getElementById('add-todo-btn');
        const input = document.getElementById('todo-input');

        if (addBtn && input) {
            addBtn.addEventListener('click', () => this.addTodo());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addTodo();
                }
            });
        }

        // Template buttons
        const templateBtns = document.querySelectorAll('.template-btn');
        templateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.template-btn').dataset.template;
                this.applyTemplate(templateId);
            });
        });

        // Import button
        const importBtn = document.getElementById('import-todos');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importTodos());
        }

        // Recurring checkbox
        const recurringCheckbox = document.getElementById('todo-recurring');
        const recurrenceOptions = document.getElementById('recurrence-options');
        if (recurringCheckbox && recurrenceOptions) {
            recurringCheckbox.addEventListener('change', (e) => {
                recurrenceOptions.classList.toggle('hidden', !e.target.checked);
            });
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter, btn.dataset.value || 'all');
                this.updateFilterButtons(btn);
                this.render();
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sort-todos');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const [field, order] = sortSelect.value.split('-');
                this.sorting.field = field;
                this.sorting.order = order;
                this.render();
            });
        }

        // Search input
        const searchInput = document.getElementById('search-todos');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.render();
            });
        }

        // Bulk actions
        const bulkActions = document.getElementById('bulk-actions');
        if (bulkActions) {
            bulkActions.addEventListener('click', (e) => {
                if (e.target.classList.contains('bulk-complete') || e.target.closest('.bulk-complete')) {
                    this.bulkComplete();
                } else if (e.target.classList.contains('bulk-delete') || e.target.closest('.bulk-delete')) {
                    this.bulkDelete();
                } else if (e.target.classList.contains('bulk-export') || e.target.closest('.bulk-export')) {
                    this.exportTodos();
                } else if (e.target.classList.contains('bulk-priority') || e.target.closest('.bulk-priority')) {
                    this.bulkUpdatePriority();
                }
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-todos');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAllTodos(e.target.checked);
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-todos');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTodos());
        }

        // Filter dropdowns
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.setFilter('priority', e.target.value);
                this.render();
            });
        }

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.setFilter('category', e.target.value);
                this.render();
            });
        }

        // Date range filter
        const dateRangeFilter = document.getElementById('date-range-filter');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.setFilter('dateRange', e.target.value);
                this.render();
            });
        }

        // View toggle (list vs grid)
        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', (e) => {
                const currentView = e.target.dataset.view;
                e.target.dataset.view = currentView === 'list' ? 'grid' : 'list';
                e.target.innerHTML = currentView === 'list' ?
                    '<i class="fas fa-th-large mr-2"></i> Grid View' :
                    '<i class="fas fa-list mr-2"></i> List View';
                document.body.classList.toggle('todo-grid-view', currentView === 'list');
                this.render();
            });
        }
    },

    setupDragAndDrop() {
        const todoList = document.getElementById('todo-list');
        if (!todoList) return;

        let draggedElement = null;

        todoList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                draggedElement = e.target;
                e.target.classList.add('opacity-50', 'shadow-lg');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        todoList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('opacity-50', 'shadow-lg');
                // Update todo order after drag
                this.updateTodoOrder();
            }
        });

        todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(todoList, e.clientY);
            if (afterElement == null) {
                todoList.appendChild(draggedElement);
            } else {
                todoList.insertBefore(draggedElement, afterElement);
            }
        });
    },

    setupCollaboration() {
        // Initialize collaboration features
        this.collaborators = Storage.get('todoCollaborators') || [];
    },

    setupCalendarIntegration() {
        // Initialize calendar integration
        if (typeof Calendar !== 'undefined') {
            // Connect with calendar module if available
        }
    },

    setupNotifications() {
        // Initialize notification system
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    },

    setupTaskSharing() {
        // Initialize task sharing features
    },

    updateTodoOrder() {
        const todoList = document.getElementById('todo-list');
        const todoItems = todoList.querySelectorAll('.todo-item');

        // Update the order in the todos array based on DOM order
        const newOrder = Array.from(todoItems).map(item => parseInt(item.dataset.id));

        this.todos.sort((a, b) => {
            const aIndex = newOrder.indexOf(a.id);
            const bIndex = newOrder.indexOf(b.id);
            return aIndex - bIndex;
        });

        this.saveTodos();
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Ctrl/Cmd + N: New todo
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('todo-input')?.focus();
            }

            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('search-todos')?.focus();
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.remove());
            }
        });
    },

    addTodo() {
        const input = document.getElementById('todo-input');
        const priority = document.getElementById('todo-priority');
        const date = document.getElementById('todo-date');
        const category = document.getElementById('todo-category');
        const estimatedTime = document.getElementById('todo-estimated-time');
        const tagsInput = document.getElementById('todo-tags');
        const notesInput = document.getElementById('todo-notes');
        const isRecurring = document.getElementById('todo-recurring')?.checked;
        const recurrencePattern = document.getElementById('todo-recurrence-pattern')?.value;

        if (!input.value.trim()) {
            this.showNotification('Silakan masukkan todo terlebih dahulu', 'warning');
            return;
        }

        try {
            const todo = {
                id: Date.now(),
                text: Utils.sanitizeHTML(input.value.trim()),
                completed: false,
                priority: priority && priority.value ? priority.value : 'medium',
                date: date && date.value ? date.value : new Date().toISOString().split('T')[0],
                category: (category && category.value) ? category.value : 'personal',
                tags: tagsInput?.value ?
                    tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) :
                    this.extractTags(input.value),
                subtasks: [],
                estimatedTime: (estimatedTime && estimatedTime.value) ? parseInt(estimatedTime.value) || 0 : 0,
                actualTime: 0,
                attachments: [],
                reminders: [],
                notes: notesInput?.value || '',
                isRecurring: isRecurring || false,
                recurrencePattern: recurrencePattern || null,
                lastCompleted: null,
                completedSubtasks: 0,
                progress: 0,
                impact: 'medium',
                reflection: '',
                achievement: false,
                templateId: null,
                collaborators: [],
                dependencies: [],
                isShared: false,
                sharedWith: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Validate the todo before saving
            const validation = this.validateTodo(todo);
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }

            this.todos.unshift(todo);
            this.saveTodos();
            this.render();
            this.updateStats();

            // Reset form
            input.value = '';
            date.value = '';
            priority.value = 'medium';
            category.value = 'personal';
            estimatedTime.value = '';
            if (tagsInput) tagsInput.value = '';
            if (notesInput) notesInput.value = '';
            if (document.getElementById('todo-recurring')) document.getElementById('todo-recurring').checked = false;
            if (document.getElementById('todo-recurrence-pattern')) document.getElementById('todo-recurrence-pattern').value = 'daily';

            // Show notification
            this.showNotification('Todo berhasil ditambahkan', 'success');

            // Check achievements
            this.checkAchievements();

            // Track activity
            this.trackActivity('created', todo);
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showNotification('Gagal menambahkan todo. Silakan coba lagi.', 'error');
        }
    },

    applyTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const input = document.getElementById('todo-input');
        const priority = document.getElementById('todo-priority');
        const category = document.getElementById('todo-category');
        const estimatedTime = document.getElementById('todo-estimated-time');
        const tagsInput = document.getElementById('todo-tags');

        if (input) input.value = template.text;
        if (priority) priority.value = template.priority;
        if (category) category.value = template.category;
        if (estimatedTime) estimatedTime.value = template.estimatedTime;
        if (tagsInput) tagsInput.value = template.tags.join(', ');

        this.showNotification(`Template "${template.name}" diterapkan`, 'success');
    },

    importTodos() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const importedTodos = JSON.parse(e.target.result);
                    if (Array.isArray(importedTodos)) {
                        this.todos = [...this.todos, ...importedTodos];
                        this.saveTodos();
                        this.render();
                        this.updateStats();
                        this.showNotification(`${importedTodos.length} todo berhasil diimpor`, 'success');
                    } else {
                        this.showNotification('Format file tidak valid', 'error');
                    }
                } catch (error) {
                    console.error('Error importing todos:', error);
                    this.showNotification('Gagal mengimpor todo. File tidak valid.', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        // Create edit modal
        const modal = this.createEditModal(todo);
        document.body.appendChild(modal);

        // Show modal
        modal.classList.remove('hidden');
        document.getElementById('edit-todo-text').focus();
    },

    updateTodo(id, updates) {
        try {
            const todoIndex = this.todos.findIndex(t => t.id === id);
            if (todoIndex === -1) {
                this.showNotification('Todo tidak ditemukan', 'error');
                return;
            }

            this.todos[todoIndex] = {
                ...this.todos[todoIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.saveTodos();
            this.render();
            this.updateStats();

            this.showNotification('Todo berhasil diperbarui', 'success');
            this.trackActivity('updated', this.todos[todoIndex]);
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showNotification('Gagal memperbarui todo. Silakan coba lagi.', 'error');
        }
    },

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        todo.completed = !todo.completed;

        if (todo.completed) {
            todo.completedAt = new Date().toISOString();
            todo.lastCompleted = new Date().toISOString();
            todo.progress = 100;

            // Complete all subtasks
            todo.subtasks.forEach(subtask => {
                subtask.completed = true;
            });
            todo.completedSubtasks = todo.subtasks.length;
        } else {
            delete todo.completedAt;
            todo.lastCompleted = null;
            todo.progress = 0;
            todo.completedSubtasks = todo.subtasks.filter(st => st.completed).length;
        }

        todo.updatedAt = new Date().toISOString();

        this.saveTodos();
        this.render();
        this.updateStats();

        this.checkAchievements();
        this.trackActivity(todo.completed ? 'completed' : 'uncompleted', todo);
    },

    updateProgress(id, progress) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        todo.progress = Math.max(0, Math.min(100, progress));
        todo.updatedAt = new Date().toISOString();

        if (todo.progress === 100) {
            todo.completed = true;
            todo.completedAt = new Date().toISOString();
        } else if (todo.completed && todo.progress < 100) {
            todo.completed = false;
            delete todo.completedAt;
        }

        this.saveTodos();
        this.render();
        this.updateStats();
    },

    addCollaborator(todoId, collaborator) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        if (!todo.collaborators.some(c => c.id === collaborator.id)) {
            todo.collaborators.push(collaborator);
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.showNotification('Kolaborator ditambahkan', 'success');
        }
    },

    removeCollaborator(todoId, collaboratorId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        todo.collaborators = todo.collaborators.filter(c => c.id !== collaboratorId);
        todo.updatedAt = new Date().toISOString();
        this.saveTodos();
        this.render();
        this.showNotification('Kolaborator dihapus', 'success');
    },

    addDependency(todoId, dependencyId) {
        const todo = this.todos.find(t => t.id === todoId);
        const dependency = this.todos.find(t => t.id === dependencyId);
        
        if (!todo || !dependency) return;

        if (!todo.dependencies.includes(dependencyId)) {
            todo.dependencies.push(dependencyId);
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.showNotification('Dependency ditambahkan', 'success');
        }
    },

    addSubtask(todoId, subtaskText) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo || !subtaskText.trim()) return;

        const subtask = {
            id: Date.now(),
            text: subtaskText.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        todo.subtasks.push(subtask);
        todo.updatedAt = new Date().toISOString();

        this.saveTodos();
        this.render();

        this.showNotification('Subtask berhasil ditambahkan', 'success');
    },

    toggleSubtask(todoId, subtaskId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        const subtask = todo.subtasks.find(st => st.id === subtaskId);
        if (!subtask) return;

        subtask.completed = !subtask.completed;
        todo.updatedAt = new Date().toISOString();

        // Update completed subtasks count
        todo.completedSubtasks = todo.subtasks.filter(st => st.completed).length;

        // Check if all subtasks are completed
        const allSubtasksCompleted = todo.subtasks.every(st => st.completed);
        if (allSubtasksCompleted && !todo.completed) {
            todo.completed = true;
            todo.completedAt = new Date().toISOString();
        } else if (!allSubtasksCompleted && todo.completed) {
            todo.completed = false;
            delete todo.completedAt;
        }

        this.saveTodos();
        this.render();
        this.updateStats();
    },

    addAttachment(todoId, file) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo || !file) return;

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

            todo.attachments.push(attachment);
            todo.updatedAt = new Date().toISOString();

            this.saveTodos();
            this.render();

            this.showNotification('Lampiran berhasil ditambahkan', 'success');
        };

        reader.readAsDataURL(file);
    },

    addReminder(todoId, reminderDate, reminderTime) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        const reminder = {
            id: Date.now(),
            date: reminderDate,
            time: reminderTime,
            triggered: false,
            createdAt: new Date().toISOString()
        };

        todo.reminders.push(reminder);
        todo.updatedAt = new Date().toISOString();

        this.saveTodos();
        this.render();

        this.showNotification('Pengingat berhasil ditambahkan', 'success');

        // Schedule notification
        this.scheduleReminder(todo, reminder);
    },

    setFilter(filterType, value) {
        this.filters[filterType] = value;
    },

    getFilteredTodos() {
        let filtered = [...this.todos];

        // Status filter
        if (this.filters.status !== 'all') {
            if (this.filters.status === 'completed') {
                filtered = filtered.filter(t => t.completed);
            } else if (this.filters.status === 'pending') {
                filtered = filtered.filter(t => !t.completed);
            } else if (this.filters.status === 'overdue') {
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(t => !t.completed && t.date < today);
            } else if (this.filters.status === 'due-soon') {
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];
                const todayStr = today.toISOString().split('T')[0];
                filtered = filtered.filter(t => !t.completed && t.date >= todayStr && t.date <= nextWeekStr);
            }
        }

        // Priority filter
        if (this.filters.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === this.filters.priority);
        }

        // Category filter
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === this.filters.category);
        }

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(t =>
                t.text.toLowerCase().includes(this.filters.search) ||
                t.tags.some(tag => tag.toLowerCase().includes(this.filters.search)) ||
                (t.notes && t.notes.toLowerCase().includes(this.filters.search))
            );
        }

        // Date range filter
        if (this.filters.dateRange !== 'all') {
            const today = new Date();
            let startDate;

            switch (this.filters.dateRange) {
                case 'today':
                    startDate = new Date(today);
                    break;
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(t => new Date(t.date) >= startDate);
            }
        }

        // Sort todos
        filtered.sort((a, b) => {
            let aValue = a[this.sorting.field];
            let bValue = b[this.sorting.field];

            if (this.sorting.field === 'priority') {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                aValue = priorityOrder[a.priority];
                bValue = priorityOrder[b.priority];
            } else if (this.sorting.field === 'date') {
                aValue = new Date(a.date);
                bValue = new Date(b.date);
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
        const todoList = document.getElementById('todo-list');
        if (!todoList) return;

        const filteredTodos = this.getFilteredTodos();

        // Show loading state
        todoList.innerHTML = '<div class="loading h-20 rounded mb-2"></div>'.repeat(3);

        // Simulate loading delay for better UX
        setTimeout(() => {
            if (filteredTodos.length === 0) {
                todoList.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Tidak ada todo ditemukan</p>
                        <button class="mt-4 text-indigo-600 hover:text-indigo-800" onclick="Todo.clearFilters()">
                            Hapus filter
                        </button>
                    </div>
                `;
                return;
            }

            todoList.innerHTML = '';

            filteredTodos.forEach(todo => {
                const todoEl = this.createTodoElement(todo);
                todoList.appendChild(todoEl);
            });

            // Update bulk actions visibility
            this.updateBulkActions();

            // Update stats
            this.updateFilterStats(filteredTodos);
        }, 300);
    },

    createTodoElement(todo) {
        const todoEl = document.createElement('div');
        todoEl.className = `todo-item ${todo.completed ? 'todo-completed' : ''} todo-priority-${todo.priority} bg-white rounded-xl shadow-lg p-5 mb-4 transition-all duration-300 border-l-4 ${
            todo.priority === 'critical' ? 'border-red-600 bg-red-50' :
            todo.priority === 'high' ? 'border-red-500 bg-red-25' :
            todo.priority === 'medium' ? 'border-yellow-500 bg-yellow-25' :
            'border-green-500 bg-green-25'
        }`;
        todoEl.draggable = true;
        todoEl.dataset.id = todo.id;

        const dueDate = new Date(todo.date);
        const isOverdue = dueDate < new Date() && !todo.completed;
        const isDueToday = dueDate.toDateString() === new Date().toDateString();
        const isDueSoon = !isOverdue && !isDueToday && dueDate <= new Date(new Date().setDate(new Date().getDate() + 3));

        const completedSubtasks = todo.subtasks.filter(st => st.completed).length;
        const progressPercentage = todo.subtasks.length > 0 ?
            Math.round((completedSubtasks / todo.subtasks.length) * 100) : 0;

        todoEl.innerHTML = `
            <div class="flex items-start">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}
                       class="mr-4 mt-1 w-6 h-6 text-indigo-600 rounded-full focus:ring-indigo-500 todo-checkbox cursor-pointer"
                       data-id="${todo.id}">
                <div class="flex-grow">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-grow">
                            <h3 class="${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'} font-semibold text-lg mb-1">
                                ${this.highlightSearch(todo.text)}
                            </h3>
                            <div class="flex items-center space-x-3 mb-3">
                                ${this.getPriorityBadge(todo.priority)}
                                ${this.getCategoryBadge(todo.category)}
                                ${todo.completed ? `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center"><i class="fas fa-check mr-1"></i>Selesai</span>` : ''}
                                ${todo.isShared ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"><i class="fas fa-share-alt mr-1"></i>Dibagikan</span>` : ''}
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="mb-3">
                                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span>${todo.progress}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3">
                                    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out" style="width: ${todo.progress}%"></div>
                                </div>
                            </div>
                            
                            <!-- Subtasks Progress -->
                            ${todo.subtasks.length > 0 ? `
                                <div class="mb-3">
                                    <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>Subtasks: ${completedSubtasks}/${todo.subtasks.length}</span>
                                        <span>${progressPercentage}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-indigo-500 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex flex-col items-end space-y-2">
                            <div class="flex items-center space-x-2">
                                ${todo.collaborators.length > 0 ? `
                                    <div class="flex -space-x-2">
                                        ${todo.collaborators.slice(0, 3).map(collaborator => `
                                            <div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs" title="${collaborator.name}">
                                                ${collaborator.name.charAt(0)}
                                            </div>
                                        `).join('')}
                                        ${todo.collaborators.length > 3 ? `<div class="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">+${todo.collaborators.length - 3}</div>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="flex items-center space-x-1">
                                <button class="share-todo text-blue-500 hover:text-blue-700" data-id="${todo.id}" title="Bagikan">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                                <button class="add-collaborator text-indigo-500 hover:text-indigo-700" data-id="${todo.id}" title="Tambah Kolaborator">
                                    <i class="fas fa-user-plus"></i>
                                </button>
                                <button class="add-dependency text-purple-500 hover:text-purple-700" data-id="${todo.id}" title="Tambah Dependency">
                                    <i class="fas fa-link"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div class="flex items-center">
                            <i class="fas fa-calendar-alt mr-1 text-gray-400"></i>
                            <span class="${isOverdue ? 'text-red-600 font-semibold' : isDueToday ? 'text-yellow-600 font-semibold' : isDueSoon ? 'text-orange-600' : 'text-gray-600'}">
                                ${this.formatDate(todo.date)}
                            </span>
                        </div>
                        ${todo.estimatedTime > 0 ? `
                            <div class="flex items-center">
                                <i class="fas fa-clock mr-1 text-gray-400"></i>
                                <span>${todo.estimatedTime}m</span>
                            </div>
                        ` : ''}
                        ${todo.actualTime > 0 ? `
                            <div class="flex items-center">
                                <i class="fas fa-history mr-1 text-gray-400"></i>
                                <span>${todo.actualTime}m selesai</span>
                            </div>
                        ` : ''}
                        ${todo.attachments.length > 0 ? `
                            <div class="flex items-center">
                                <i class="fas fa-paperclip mr-1 text-gray-400"></i>
                                <span>${todo.attachments.length}</span>
                            </div>
                        ` : ''}
                        ${todo.reminders.length > 0 ? `
                            <div class="flex items-center">
                                <i class="fas fa-bell mr-1 text-gray-400"></i>
                                <span>${todo.reminders.length}</span>
                            </div>
                        ` : ''}
                        ${todo.isRecurring ? `
                            <div class="flex items-center text-blue-600">
                                <i class="fas fa-sync-alt mr-1"></i>
                                <span>Ulang</span>
                            </div>
                        ` : ''}
                        ${todo.dependencies.length > 0 ? `
                            <div class="flex items-center text-purple-600">
                                <i class="fas fa-link mr-1"></i>
                                <span>${todo.dependencies.length} dependensi</span>
                            </div>
                        ` : ''}
                    </div>

                    ${todo.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mb-3">
                            ${todo.tags.map(tag => `
                                <span class="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${todo.notes ? `
                        <div class="mt-2 text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-sticky-note mr-2 text-indigo-500"></i>${this.highlightSearch(todo.notes)}
                        </div>
                    ` : ''}

                    ${todo.subtasks.length > 0 ? `
                        <div class="mt-4">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Subtasks:</h4>
                            <div class="space-y-2">
                                ${todo.subtasks.map(subtask => `
                                    <div class="flex items-center text-sm">
                                        <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                                               class="mr-2 h-4 w-4 text-indigo-600 rounded subtask-checkbox" 
                                               data-todo-id="${todo.id}" data-subtask-id="${subtask.id}">
                                        <span class="${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}">
                                            ${subtask.text}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div class="flex items-center space-x-4">
                    <button class="expand-todo text-gray-500 hover:text-gray-700 flex items-center" data-id="${todo.id}" title="Detail">
                        <i class="fas fa-info-circle mr-1"></i> Detail
                    </button>
                    <button class="edit-todo text-blue-600 hover:text-blue-800 flex items-center" data-id="${todo.id}" title="Edit">
                        <i class="fas fa-edit mr-1"></i> Edit
                    </button>
                    <button class="duplicate-todo text-green-600 hover:text-green-800 flex items-center" data-id="${todo.id}" title="Duplikat">
                        <i class="fas fa-copy mr-1"></i> Duplikat
                    </button>
                    <button class="delete-todo text-red-600 hover:text-red-800 flex items-center" data-id="${todo.id}" title="Hapus">
                        <i class="fas fa-trash mr-1"></i> Hapus
                    </button>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="progress-decrease text-gray-500 hover:text-gray-700" data-id="${todo.id}" title="Kurangi Progres">
                        <i class="fas fa-minus-circle"></i>
                    </button>
                    <button class="progress-increase text-gray-500 hover:text-gray-700" data-id="${todo.id}" title="Tambah Progres">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachTodoElementEventListeners(todoEl);

        return todoEl;
    },

    // Event listener attachment methods
    attachTodoElementEventListeners(todoEl) {
        const todoId = parseInt(todoEl.dataset.id);

        // Checkbox
        const checkbox = todoEl.querySelector('input[type="checkbox"].todo-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                this.toggleTodo(todoId);
                this.updateBulkActions();
            });
        }

        // Action buttons
        const expandBtn = todoEl.querySelector('.expand-todo');
        const editBtn = todoEl.querySelector('.edit-todo');
        const duplicateBtn = todoEl.querySelector('.duplicate-todo');
        const deleteBtn = todoEl.querySelector('.delete-todo');
        const shareBtn = todoEl.querySelector('.share-todo');
        const addCollaboratorBtn = todoEl.querySelector('.add-collaborator');
        const addDependencyBtn = todoEl.querySelector('.add-dependency');
        const progressIncreaseBtn = todoEl.querySelector('.progress-increase');
        const progressDecreaseBtn = todoEl.querySelector('.progress-decrease');

        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.expandTodo(todoId);
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editTodo(todoId);
            });
        }

        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => {
                this.duplicateTodo(todoId);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteTodo(todoId);
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareTodo(todoId);
            });
        }

        if (addCollaboratorBtn) {
            addCollaboratorBtn.addEventListener('click', () => {
                this.addCollaborator(todoId, { id: Date.now(), name: 'Contoh Kolaborator' });
            });
        }

        if (addDependencyBtn) {
            addDependencyBtn.addEventListener('click', () => {
                this.showDependencyModal(todoId);
            });
        }

        if (progressIncreaseBtn) {
            progressIncreaseBtn.addEventListener('click', () => {
                const todo = this.todos.find(t => t.id === todoId);
                if (todo) {
                    this.updateProgress(todoId, Math.min(100, todo.progress + 10));
                }
            });
        }

        if (progressDecreaseBtn) {
            progressDecreaseBtn.addEventListener('click', () => {
                const todo = this.todos.find(t => t.id === todoId);
                if (todo) {
                    this.updateProgress(todoId, Math.max(0, todo.progress - 10));
                }
            });
        }

        // Subtask checkboxes
        const subtaskCheckboxes = todoEl.querySelectorAll('.subtask-checkbox');
        subtaskCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const subtaskId = parseInt(e.target.dataset.subtaskId);
                this.toggleSubtask(todoId, subtaskId);
            });
        });
    },

    shareTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        // Create share modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Bagikan Tugas</h2>
                <div class="mb-4">
                    <input type="email" id="share-email" placeholder="Masukkan email kolaborator"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            onclick="this.closest('.modal').remove()">Batal</button>
                    <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            onclick="Todo.performShare(${todo.id}, document.getElementById('share-email').value)">Bagikan</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    performShare(todoId, email) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo || !email) return;

        // In a real implementation, this would send an email or notification
        // For now, we'll just add the email to the sharedWith array
        if (!todo.sharedWith.includes(email)) {
            todo.sharedWith.push(email);
            todo.isShared = true;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.showNotification(`Tugas dibagikan ke ${email}`, 'success');
        }

        // Close modal
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    },

    showDependencyModal(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        // Create dependency modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Tambah Dependency</h2>
                <div class="mb-4">
                    <select id="dependency-select" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Pilih tugas yang menjadi dependency...</option>
                        ${this.todos.filter(t => t.id !== todoId).map(t => `
                            <option value="${t.id}">${t.text}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            onclick="this.closest('.modal').remove()">Batal</button>
                    <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            onclick="Todo.addDependencyFromModal(${todo.id}, document.getElementById('dependency-select').value)">Tambah</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    addDependencyFromModal(todoId, dependencyId) {
        if (!dependencyId) return;

        this.addDependency(todoId, parseInt(dependencyId));
        
        // Close modal
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    },

    createEditModal(todo) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-screen overflow-y-auto shadow-2xl">
                <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 class="text-2xl font-bold text-gray-800">Edit Todo</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Teks Todo</label>
                        <input type="text" id="edit-todo-text" value="${todo.text}"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg" 
                               placeholder="Masukkan todo...">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Prioritas</label>
                            <select id="edit-todo-priority" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Rendah</option>
                                <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Sedang</option>
                                <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>Tinggi</option>
                                <option value="critical" ${todo.priority === 'critical' ? 'selected' : ''}>Kritis</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                            <select id="edit-todo-category" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="personal" ${todo.category === 'personal' ? 'selected' : ''}>Pribadi</option>
                                <option value="work" ${todo.category === 'work' ? 'selected' : ''}>Pekerjaan</option>
                                <option value="shopping" ${todo.category === 'shopping' ? 'selected' : ''}>Belanja</option>
                                <option value="health" ${todo.category === 'health' ? 'selected' : ''}>Kesehatan</option>
                                <option value="education" ${todo.category === 'education' ? 'selected' : ''}>Pendidikan</option>
                                <option value="finance" ${todo.category === 'finance' ? 'selected' : ''}>Keuangan</option>
                                <option value="other" ${todo.category === 'other' ? 'selected' : ''}>Lainnya</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                            <input type="date" id="edit-todo-date" value="${todo.date}" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Estimasi Waktu (menit)</label>
                            <input type="number" id="edit-todo-estimated-time" value="${todo.estimatedTime}"
                                   min="0" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tags (pisahkan dengan koma)</label>
                        <input type="text" id="edit-todo-tags" value="${todo.tags.join(', ')}"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                               placeholder="tag1, tag2, tag3">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                        <textarea id="edit-todo-notes" rows="3" 
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="Tambahkan catatan...">${todo.notes || ''}</textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Progres (%)</label>
                        <div class="flex items-center space-x-4">
                            <input type="range" id="edit-todo-progress" min="0" max="100" value="${todo.progress}"
                                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                            <span id="progress-value" class="text-lg font-semibold text-indigo-600 w-12">${todo.progress}%</span>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Pengingat</label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="date" id="edit-todo-reminder-date" class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tanggal pengingat">
                            <input type="time" id="edit-todo-reminder-time" class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Waktu pengingat">
                        </div>
                        <button type="button" id="add-reminder" class="mt-2 px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg">
                            <i class="fas fa-plus mr-1"></i> Tambah Pengingat
                        </button>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
                        <div id="edit-subtasks" class="space-y-3">
                            ${todo.subtasks.map((subtask, index) => `
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <input type="checkbox" ${subtask.completed ? 'checked' : ''}
                                           data-subtask-id="${subtask.id}" class="subtask-checkbox h-5 w-5 text-indigo-600 rounded">
                                    <input type="text" value="${subtask.text}"
                                           data-subtask-id="${subtask.id}" class="subtask-input flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <button class="remove-subtask text-red-500 hover:text-red-700 p-2"
                                            data-subtask-id="${subtask.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" id="add-subtask" class="mt-3 px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg flex items-center">
                            <i class="fas fa-plus mr-2"></i> Tambah Subtask
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center">
                            <input type="checkbox" id="edit-todo-recurring" ${todo.isRecurring ? 'checked' : ''} class="h-4 w-4 text-indigo-600 rounded mr-3">
                            <label for="edit-todo-recurring" class="text-sm font-medium text-gray-700">Todo Berulang</label>
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox" id="edit-todo-shared" ${todo.isShared ? 'checked' : ''} class="h-4 w-4 text-indigo-600 rounded mr-3">
                            <label for="edit-todo-shared" class="text-sm font-medium text-gray-700">Bagikan Tugas</label>
                        </div>
                    </div>

                    <div id="recurrence-options" class="${todo.isRecurring ? '' : 'hidden'}">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Pola Pengulangan</label>
                        <select id="edit-todo-recurrence-pattern" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="daily" ${todo.recurrencePattern === 'daily' ? 'selected' : ''}>Harian</option>
                            <option value="weekly" ${todo.recurrencePattern === 'weekly' ? 'selected' : ''}>Mingguan</option>
                            <option value="monthly" ${todo.recurrencePattern === 'monthly' ? 'selected' : ''}>Bulanan</option>
                            <option value="yearly" ${todo.recurrencePattern === 'yearly' ? 'selected' : ''}>Tahunan</option>
                        </select>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <button class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            onclick="this.closest('.modal').remove()">
                        Batal
                    </button>
                    <button class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
                            id="save-todo-changes">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEditModalEventListeners(modal, todo);

        return modal;
    },

    attachEditModalEventListeners(modal, todo) {
        const closeBtn = modal.querySelector('.close-modal');
        const saveBtn = modal.querySelector('#save-todo-changes');
        const addSubtaskBtn = modal.querySelector('#add-subtask');
        const addReminderBtn = modal.querySelector('#add-reminder');
        const recurringCheckbox = modal.querySelector('#edit-todo-recurring');
        const recurrenceOptions = modal.querySelector('#recurrence-options');
        const progressSlider = modal.querySelector('#edit-todo-progress');
        const progressValue = modal.querySelector('#progress-value');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        if (recurringCheckbox && recurrenceOptions) {
            recurringCheckbox.addEventListener('change', () => {
                recurrenceOptions.classList.toggle('hidden', !recurringCheckbox.checked);
            });

            // Set initial state based on todo
            if (todo.isRecurring) {
                recurrenceOptions.classList.remove('hidden');
            }
        }

        if (progressSlider && progressValue) {
            // Update progress value display
            progressSlider.addEventListener('input', () => {
                progressValue.textContent = progressSlider.value + '%';
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const updates = {
                    text: Utils.sanitizeHTML(document.getElementById('edit-todo-text').value),
                    priority: document.getElementById('edit-todo-priority').value,
                    category: document.getElementById('edit-todo-category').value,
                    date: document.getElementById('edit-todo-date').value,
                    estimatedTime: parseInt(document.getElementById('edit-todo-estimated-time').value) || 0,
                    tags: document.getElementById('edit-todo-tags').value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag),
                    notes: Utils.sanitizeHTML(document.getElementById('edit-todo-notes').value),
                    progress: parseInt(document.getElementById('edit-todo-progress').value) || 0,
                    isRecurring: document.getElementById('edit-todo-recurring').checked,
                    isShared: document.getElementById('edit-todo-shared').checked,
                    recurrencePattern: document.getElementById('edit-todo-recurrence-pattern').value,
                    subtasks: this.getUpdatedSubtasks()
                };

                this.updateTodo(todo.id, updates);
                modal.remove();
            });
        }

        if (addSubtaskBtn) {
            addSubtaskBtn.addEventListener('click', () => {
                this.addNewSubtaskField();
            });
        }

        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', () => {
                const reminderDate = document.getElementById('edit-todo-reminder-date').value;
                const reminderTime = document.getElementById('edit-todo-reminder-time').value;

                if (reminderDate && reminderTime) {
                    this.addReminder(todo.id, reminderDate, reminderTime);
                    document.getElementById('edit-todo-reminder-date').value = '';
                    document.getElementById('edit-todo-reminder-time').value = '';
                } else {
                    this.showNotification('Silakan masukkan tanggal dan waktu pengingat', 'warning');
                }
            });
        }
    },

    getUpdatedSubtasks() {
        const subtaskInputs = document.querySelectorAll('.subtask-input');
        const subtaskCheckboxes = document.querySelectorAll('.subtask-checkbox');

        return Array.from(subtaskInputs).map((input, index) => ({
            id: parseInt(input.dataset.subtaskId),
            text: input.value,
            completed: subtaskCheckboxes[index].checked
        }));
    },

    addNewSubtaskField() {
        const subtasksContainer = document.getElementById('edit-subtasks');
        const newSubtaskId = Date.now();

        const subtaskField = document.createElement('div');
        subtaskField.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
        subtaskField.innerHTML = `
            <input type="checkbox" data-subtask-id="${newSubtaskId}" class="subtask-checkbox h-5 w-5 text-indigo-600 rounded">
            <input type="text" data-subtask-id="${newSubtaskId}" class="subtask-input flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   placeholder="Masukkan subtask...">
            <button class="remove-subtask text-red-500 hover:text-red-700 p-2" data-subtask-id="${newSubtaskId}">
                <i class="fas fa-trash"></i>
            </button>
        `;

        subtasksContainer.appendChild(subtaskField);

        // Add event listener to remove button
        subtaskField.querySelector('.remove-subtask').addEventListener('click', (e) => {
            subtaskField.remove();
        });
    },

    expandTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        // Create expanded view modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-4xl max-h-screen overflow-y-auto shadow-2xl">
                <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 class="text-2xl font-bold text-gray-800">Detail Todo</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-6">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${todo.text}</h3>
                        <div class="flex flex-wrap items-center gap-3 mb-4">
                            ${this.getPriorityBadge(todo.priority)}
                            ${this.getCategoryBadge(todo.category)}
                            ${todo.completed ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center"><i class="fas fa-check mr-1"></i>Selesai</span>' : ''}
                            ${todo.isRecurring ? '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center"><i class="fas fa-sync-alt mr-1"></i>Todo Berulang</span>' : ''}
                            ${todo.isShared ? '<span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center"><i class="fas fa-share-alt mr-1"></i>Dibagikan</span>' : ''}
                        </div>
                    </div>

                    <!-- Progress Section -->
                    <div class="bg-gray-50 p-4 rounded-xl">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-medium text-gray-700">Progres Tugas</h4>
                            <span class="text-lg font-semibold text-indigo-600">${todo.progress}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full" style="width: ${todo.progress}%"></div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center p-3 bg-white rounded-lg">
                                <div class="text-2xl font-bold text-indigo-600">${todo.progress}</div>
                                <div class="text-sm text-gray-600">Progres</div>
                            </div>
                            <div class="text-center p-3 bg-white rounded-lg">
                                <div class="text-2xl font-bold text-green-600">${todo.subtasks.filter(st => st.completed).length}</div>
                                <div class="text-sm text-gray-600">Subtask Selesai</div>
                            </div>
                            <div class="text-center p-3 bg-white rounded-lg">
                                <div class="text-2xl font-bold text-blue-600">${todo.estimatedTime}</div>
                                <div class="text-sm text-gray-600">Menit Estimasi</div>
                            </div>
                            <div class="text-center p-3 bg-white rounded-lg">
                                <div class="text-2xl font-bold text-purple-600">${todo.collaborators.length}</div>
                                <div class="text-sm text-gray-600">Kolaborator</div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Detail Informasi</h4>
                            <div class="space-y-3">
                                <div>
                                    <p class="text-sm text-gray-500">Dibuat</p>
                                    <p class="font-medium">${new Date(todo.createdAt).toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Diperbarui</p>
                                    <p class="font-medium">${new Date(todo.updatedAt).toLocaleString('id-ID')}</p>
                                </div>
                                ${todo.completedAt ? `
                                <div>
                                    <p class="text-sm text-gray-500">Selesai</p>
                                    <p class="font-medium">${new Date(todo.completedAt).toLocaleString('id-ID')}</p>
                                </div>
                                ` : ''}
                                ${todo.date ? `
                                <div>
                                    <p class="text-sm text-gray-500">Deadline</p>
                                    <p class="font-medium">${new Date(todo.date).toLocaleDateString('id-ID')}</p>
                                </div>
                                ` : ''}
                                ${todo.estimatedTime > 0 ? `
                                <div>
                                    <p class="text-sm text-gray-500">Estimasi Waktu</p>
                                    <p class="font-medium">${todo.estimatedTime} menit</p>
                                </div>
                                ` : ''}
                                ${todo.actualTime > 0 ? `
                                <div>
                                    <p class="text-sm text-gray-500">Waktu Aktual</p>
                                    <p class="font-medium">${todo.actualTime} menit</p>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Kolaborator</h4>
                            <div class="space-y-2 mb-4">
                                ${todo.collaborators.length > 0 ? todo.collaborators.map(collaborator => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-3">
                                                ${collaborator.name.charAt(0)}
                                            </div>
                                            <span>${collaborator.name}</span>
                                        </div>
                                        <button class="remove-collaborator text-red-500 hover:text-red-700" data-collaborator-id="${collaborator.id}" data-todo-id="${todo.id}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('') : '<p class="text-gray-500 text-sm">Tidak ada kolaborator</p>'}
                            </div>
                            
                            <button class="add-collaborator-modal px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm flex items-center w-full"
                                    data-todo-id="${todo.id}">
                                <i class="fas fa-user-plus mr-2"></i> Tambah Kolaborator
                            </button>
                        </div>
                    </div>

                    ${todo.notes ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">Catatan</h4>
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <p class="text-gray-700">${todo.notes}</p>
                            </div>
                        </div>
                    ` : ''}

                    ${todo.tags.length > 0 ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">Tags</h4>
                            <div class="flex flex-wrap gap-2">
                                ${todo.tags.map(tag => `
                                    <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                                        #${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.subtasks.length > 0 ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Subtasks</h4>
                            <div class="space-y-3">
                                ${todo.subtasks.map(subtask => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div class="flex items-center">
                                            <input type="checkbox" ${subtask.completed ? 'checked' : ''} disabled
                                                   class="mr-3 h-5 w-5 text-indigo-600 rounded">
                                            <span class="${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}">${subtask.text}</span>
                                        </div>
                                        <span class="text-sm ${subtask.completed ? 'text-green-600' : 'text-gray-500'}">
                                            ${subtask.completed ? 'Selesai' : 'Pending'}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.attachments.length > 0 ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Lampiran</h4>
                            <div class="space-y-3">
                                ${todo.attachments.map(attachment => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div class="flex items-center">
                                            <i class="fas fa-paperclip text-gray-400 mr-3"></i>
                                            <span class="text-sm">${attachment.name}</span>
                                            <span class="text-xs text-gray-500 ml-2">(${this.formatFileSize(attachment.size)})</span>
                                        </div>
                                        <button class="download-attachment text-blue-500 hover:text-blue-700 text-sm" 
                                                data-attachment-id="${attachment.id}" data-todo-id="${todo.id}">
                                            <i class="fas fa-download mr-1"></i> Download
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.reminders.length > 0 ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Pengingat</h4>
                            <div class="space-y-3">
                                ${todo.reminders.map(reminder => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span class="text-sm">${new Date(reminder.date + ' ' + reminder.time).toLocaleString('id-ID')}</span>
                                            <span class="text-xs text-gray-500 ml-2">${reminder.triggered ? 'Terpicu' : 'Belum terpicu'}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.dependencies.length > 0 ? `
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Dependency</h4>
                            <div class="space-y-2">
                                ${todo.dependencies.map(depId => {
                                    const depTodo = this.todos.find(t => t.id === depId);
                                    return depTodo ? `
                                        <div class="p-3 bg-gray-50 rounded-lg">
                                            <span class="font-medium">${depTodo.text}</span>
                                            <span class="text-xs text-gray-500 ml-2">${depTodo.completed ? 'Selesai' : 'Pending'}</span>
                                        </div>
                                    ` : '';
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="flex justify-end mt-8 pt-6 border-t border-gray-200 space-x-4">
                    <button class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            onclick="this.closest('.modal').remove()">
                        Tutup
                    </button>
                    <button class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
                            onclick="Todo.editTodo(${todo.id}); this.closest('.modal').remove()">
                        Edit
                    </button>
                </div>
            </div>
        `;

        // Add event listener to close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Add event listeners for collaboration features
        const removeCollaboratorBtns = modal.querySelectorAll('.remove-collaborator');
        removeCollaboratorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.closest('button').dataset.todoId);
                const collaboratorId = parseInt(e.target.closest('button').dataset.collaboratorId);
                this.removeCollaborator(todoId, collaboratorId);
                modal.remove();
                this.expandTodo(todoId);
            });
        });

        const addCollaboratorBtn = modal.querySelector('.add-collaborator-modal');
        if (addCollaboratorBtn) {
            addCollaboratorBtn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.closest('button').dataset.todoId);
                this.addCollaborator(todoId, { id: Date.now(), name: 'Contoh Kolaborator' });
                modal.remove();
                this.expandTodo(todoId);
            });
        }

        const downloadAttachmentBtns = modal.querySelectorAll('.download-attachment');
        downloadAttachmentBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.closest('button').dataset.todoId);
                const attachmentId = parseInt(e.target.closest('button').dataset.attachmentId);
                this.downloadAttachment(attachmentId, todoId);
            });
        });

        document.body.appendChild(modal);
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

    getPriorityBadge(priority) {
        const badges = {
            critical: '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center"><i class="fas fa-exclamation-triangle mr-1"></i>Kritis</span>',
            high: '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Tinggi</span>',
            medium: '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Sedang</span>',
            low: '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Rendah</span>'
        };

        return badges[priority] || '';
    },

    getCategoryBadge(category) {
        const colors = {
            personal: 'bg-blue-100 text-blue-800',
            work: 'bg-purple-100 text-purple-800',
            shopping: 'bg-orange-100 text-orange-800',
            health: 'bg-green-100 text-green-800',
            education: 'bg-indigo-100 text-indigo-800',
            finance: 'bg-yellow-100 text-yellow-800',
            other: 'bg-gray-100 text-gray-800'
        };

        const icons = {
            personal: 'fas fa-user',
            work: 'fas fa-briefcase',
            shopping: 'fas fa-shopping-cart',
            health: 'fas fa-heartbeat',
            education: 'fas fa-graduation-cap',
            finance: 'fas fa-dollar-sign',
            other: 'fas fa-circle'
        };

        return `<span class="px-2 py-1 ${colors[category] || colors.other} text-xs rounded-full flex items-center">
            <i class="${icons[category] || icons.other} mr-1 text-xs"></i>${this.getCategoryName(category)}
        </span>`;
    },

    getCategoryName(category) {
        const names = {
            personal: 'Pribadi',
            work: 'Pekerjaan',
            shopping: 'Belanja',
            health: 'Kesehatan',
            education: 'Pendidikan',
            finance: 'Keuangan',
            other: 'Lainnya'
        };
        return names[category] || 'Lainnya';
    },

    formatDate(dateStr) {
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

    updateFilterButtons(activeBtn) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.remove('bg-indigo-100', 'text-indigo-800', 'bg-red-100', 'text-red-800', 'bg-yellow-100', 'text-yellow-800');
            btn.classList.add('bg-gray-200');
        });
        activeBtn.classList.remove('bg-gray-200');
        activeBtn.classList.add('bg-indigo-100', 'text-indigo-800');
    },

    updateFilterStats(filteredTodos) {
        const statsEl = document.getElementById('filter-stats');
        if (!statsEl) return;

        const completed = filteredTodos.filter(t => t.completed).length;
        const pending = filteredTodos.filter(t => !t.completed).length;

        statsEl.innerHTML = `
            <span class="text-sm text-gray-600">
                Menampilkan ${filteredTodos.length} todo: ${completed} selesai, ${pending} pending
            </span>
        `;
    },

    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const checkboxes = document.querySelectorAll('.todo-checkbox:checked');

        if (bulkActions) {
            bulkActions.style.display = checkboxes.length > 0 ? 'block' : 'none';
            
            // Update selected count
            const selectedCount = document.getElementById('selected-count');
            if (selectedCount) {
                selectedCount.textContent = checkboxes.length;
            }
        }
    },

    selectAllTodos(checked) {
        const checkboxes = document.querySelectorAll('.todo-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedIds.add(parseInt(checkbox.dataset.id));
            } else {
                this.selectedIds.delete(parseInt(checkbox.dataset.id));
            }
        });
        this.updateBulkActions();
    },

    bulkUpdatePriority() {
        const checkboxes = document.querySelectorAll('.todo-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

        // Show priority selection modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold text-gray-800 mb-4">Ubah Prioritas Massal</h2>
                <div class="space-y-3">
                    <button class="priority-option w-full px-4 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-left" data-priority="critical">
                        <i class="fas fa-exclamation-triangle mr-2"></i> Kritis
                    </button>
                    <button class="priority-option w-full px-4 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-left" data-priority="high">
                        <i class="fas fa-exclamation-circle mr-2"></i> Tinggi
                    </button>
                    <button class="priority-option w-full px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-left" data-priority="medium">
                        <i class="fas fa-minus-circle mr-2"></i> Sedang
                    </button>
                    <button class="priority-option w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-left" data-priority="low">
                        <i class="fas fa-check-circle mr-2"></i> Rendah
                    </button>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Batal</button>
                </div>
            </div>
        `;

        // Add event listeners to priority options
        const priorityOptions = modal.querySelectorAll('.priority-option');
        priorityOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const priority = e.target.closest('.priority-option').dataset.priority;
                ids.forEach(id => {
                    const todo = this.todos.find(t => t.id === id);
                    if (todo) {
                        todo.priority = priority;
                        todo.updatedAt = new Date().toISOString();
                    }
                });
                this.saveTodos();
                this.render();
                this.showNotification(`${ids.length} todo diperbarui dengan prioritas ${priority}`, 'success');
                modal.remove();
            });
        });

        document.body.appendChild(modal);
    },

    clearFilters() {
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            search: '',
            dateRange: 'all'
        };

        // Reset UI
        document.getElementById('search-todos').value = '';
        document.getElementById('sort-todos').value = 'createdAt-desc';
        if (document.getElementById('priority-filter')) document.getElementById('priority-filter').value = 'all';
        if (document.getElementById('category-filter')) document.getElementById('category-filter').value = 'all';
        if (document.getElementById('date-range-filter')) document.getElementById('date-range-filter').value = 'all';

        this.render();
    },

    bulkComplete() {
        const checkboxes = document.querySelectorAll('.todo-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

        ids.forEach(id => {
            const todo = this.todos.find(t => t.id === id);
            if (todo && !todo.completed) {
                todo.completed = true;
                todo.completedAt = new Date().toISOString();
                todo.progress = 100;
            }
        });

        this.saveTodos();
        this.render();
        this.updateStats();

        this.showNotification(`${ids.length} todo ditandai sebagai selesai`, 'success');
    },

    bulkDelete() {
        const checkboxes = document.querySelectorAll('.todo-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} todo?`)) {
            this.todos = this.todos.filter(t => !ids.includes(t.id));
            this.saveTodos();
            this.render();
            this.updateStats();

            this.showNotification(`${ids.length} todo berhasil dihapus`, 'success');
        }
    },

    exportTodos() {
        const filteredTodos = this.getFilteredTodos();
        const dataStr = JSON.stringify(filteredTodos, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `todos_export_${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showNotification('Todo berhasil diekspor', 'success');
    },

    scheduleReminder(todo, reminder) {
        const reminderDate = new Date(`${reminder.date} ${reminder.time}`);
        const now = new Date();
        const timeUntilReminder = reminderDate - now;

        if (timeUntilReminder > 0) {
            setTimeout(() => {
                if (!reminder.triggered) {
                    reminder.triggered = true;
                    this.showNotification(`Pengingat: ${todo.text}`, 'warning');

                    // Play notification sound if enabled
                    if (App.settings.notifications) {
                        this.playNotificationSound();
                    }
                }
            }, timeUntilReminder);
        }
    },

    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play();
    },

    trackActivity(action, todo) {
        const activity = {
            type: 'todo',
            action: action,
            todoId: todo.id,
            todoText: todo.text,
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

    saveTodos() {
        try {
            Storage.set('todos', this.todos);
        } catch (error) {
            console.error('Error saving todos:', error);
            this.showNotification('Gagal menyimpan todo. Data mungkin tidak disimpan secara permanen.', 'error');
        }
    },

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayTodos = this.todos.filter(t => t.date === today);

        // Update dashboard stats
        const todayTodosCount = document.getElementById('today-todos-count');
        const totalTodosCount = document.getElementById('total-todos-count');

        if (todayTodosCount) {
            const completed = todayTodos.filter(t => t.completed).length;
            todayTodosCount.textContent = `${completed}/${todayTodos.length}`;
        }

        if (totalTodosCount) {
            totalTodosCount.textContent = this.todos.length;
        }
    },

    checkAchievements() {
        const completedTodos = this.todos.filter(t => t.completed).length;
        const today = new Date().toISOString().split('T')[0];
        const todayCompleted = this.todos.filter(t =>
            t.completed && t.completedAt && t.completedAt.split('T')[0] === today
        ).length;

        const data = {
            completedTodos,
            maxDailyTodos: Math.max(todayCompleted, Storage.get('maxDailyTodos') || 0)
        };

        Achievements.checkAchievements(data);

        // Update max daily todos
        if (todayCompleted > (Storage.get('maxDailyTodos') || 0)) {
            Storage.set('maxDailyTodos', todayCompleted);
        }
    },

    showNotification(message, type = 'success') {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, type);
        }
    },

    downloadAttachment(attachmentId, todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        const attachment = todo.attachments.find(a => a.id == attachmentId);
        if (!attachment) return;

        // Create a temporary link to download the attachment
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name;
        link.click();
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },


    // Check for recurring todos that should be created
    checkRecurringTodos() {
        const today = new Date().toISOString().split('T')[0];

        this.todos.forEach(todo => {
            if (todo.isRecurring && todo.completed && todo.lastCompleted) {
                const lastCompleted = new Date(todo.lastCompleted);
                const shouldRecur = this.shouldRecur(todo, lastCompleted);

                if (shouldRecur) {
                    this.createRecurringTodo(todo);
                }
            }
        });
    },

    shouldRecur(todo, lastCompleted) {
        const now = new Date();
        const pattern = todo.recurrencePattern;

        switch (pattern) {
            case 'daily':
                return now.toDateString() !== lastCompleted.toDateString();
            case 'weekly':
                return now.getDate() - lastCompleted.getDate() >= 7;
            case 'monthly':
                return now.getMonth() !== lastCompleted.getMonth();
            case 'yearly':
                return now.getFullYear() !== lastCompleted.getFullYear();
            default:
                return false;
        }
    },

    createRecurringTodo(originalTodo) {
        const newTodo = {
            ...originalTodo,
            id: Date.now(),
            completed: false,
            completedAt: null,
            lastCompleted: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0] // Set to today
        };

        this.todos.unshift(newTodo);
        this.saveTodos();
    },

    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex === -1) {
            this.showNotification('Todo tidak ditemukan', 'error');
            return;
        }

        // Confirm deletion
        const todo = this.todos[todoIndex];
        if (confirm(`Apakah Anda yakin ingin menghapus todo "${todo.text}"?`)) {
            this.todos.splice(todoIndex, 1);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification('Todo berhasil dihapus', 'success');
            this.trackActivity('deleted', todo);
        }
    },

    duplicateTodo(id) {
        const originalTodo = this.todos.find(t => t.id === id);
        if (!originalTodo) {
            this.showNotification('Todo tidak ditemukan', 'error');
            return;
        }

        try {
            const duplicatedTodo = {
                ...originalTodo,
                id: Date.now(), // New unique ID
                completed: false, // New todo should not be completed
                completedAt: null,
                lastCompleted: null,
                createdAt: new Date().toISOString(), // New creation time
                updatedAt: new Date().toISOString(), // New update time
                progress: 0, // Reset progress
                subtasks: originalTodo.subtasks.map(st => ({
                    ...st,
                    id: Date.now() + Math.random() // Ensure unique subtask IDs
                })),
                completedSubtasks: 0 // Reset completed subtasks count
            };

            this.todos.unshift(duplicatedTodo);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showNotification('Todo berhasil diduplikat', 'success');
            this.trackActivity('duplicated', duplicatedTodo);
        } catch (error) {
            console.error('Error duplicating todo:', error);
            this.showNotification('Gagal menduplikat todo. Silakan coba lagi.', 'error');
        }
    },

    // Clean up resources to prevent memory leaks
    destroy() {
        // Clear any active intervals or timeouts if present
        // Remove any references to DOM elements
        // The setupEventListeners function doesn't store references, so no cleanup needed here
        // for dynamically added listeners since they're tied to DOM elements that will be removed
    },

    // Get priority todos for dashboard
    getPriorityTodos() {
        const today = new Date().toISOString().split('T')[0];
        return this.todos
            .filter(todo => !todo.completed && new Date(todo.date) >= new Date(today))
            .sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, 5); // Ambil 5 todo prioritas tertinggi
    },

    // Validate todo input data
    validateTodo(todo) {
        if (!todo || typeof todo !== 'object') {
            return { valid: false, message: 'Todo data tidak valid' };
        }

        if (!todo.text || typeof todo.text !== 'string' || todo.text.trim().length === 0) {
            return { valid: false, message: 'Text todo tidak boleh kosong' };
        }

        if (todo.text.length > 500) {
            return { valid: false, message: 'Text todo terlalu panjang (maksimal 500 karakter)' };
        }

        if (!todo.priority || !['low', 'medium', 'high', 'critical'].includes(todo.priority)) {
            return { valid: false, message: 'Prioritas todo tidak valid' };
        }

        if (todo.estimatedTime && (typeof todo.estimatedTime !== 'number' || todo.estimatedTime < 0)) {
            return { valid: false, message: 'Estimasi waktu tidak valid' };
        }

        // Validate subtasks if present
        if (todo.subtasks && Array.isArray(todo.subtasks)) {
            for (let i = 0; i < todo.subtasks.length; i++) {
                const subtask = todo.subtasks[i];
                if (!subtask.text || typeof subtask.text !== 'string' || subtask.text.trim().length === 0) {
                    return { valid: false, message: `Subtask ke-${i} tidak valid: text tidak boleh kosong` };
                }
            }
        }

        return { valid: true };
    }
};