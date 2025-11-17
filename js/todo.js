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

    init() {
        this.loadTodos();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupKeyboardShortcuts();
        this.render();
        this.updateStats();
        this.checkRecurringTodos(); // Check for recurring todos that should be created
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
            completedSubtasks: todo.completedSubtasks || 0
        }));

        this.saveTodos();
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
                if (e.target.classList.contains('bulk-complete')) {
                    this.bulkComplete();
                } else if (e.target.classList.contains('bulk-delete')) {
                    this.bulkDelete();
                } else if (e.target.classList.contains('bulk-export')) {
                    this.exportTodos();
                }
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
                e.target.classList.add('opacity-50');
            }
        });

        todoList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('opacity-50');
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

            // Complete all subtasks
            todo.subtasks.forEach(subtask => {
                subtask.completed = true;
            });
            todo.completedSubtasks = todo.subtasks.length;
        } else {
            delete todo.completedAt;
            todo.completedSubtasks = todo.subtasks.filter(st => st.completed).length;
        }

        todo.updatedAt = new Date().toISOString();

        this.saveTodos();
        this.render();
        this.updateStats();

        this.checkAchievements();
        this.trackActivity(todo.completed ? 'completed' : 'uncompleted', todo);
    },

    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex === -1) return;

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
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const duplicatedTodo = {
            ...todo,
            id: Date.now(),
            text: `${todo.text} (Salinan)`,
            completed: false,
            completedAt: null,
            lastCompleted: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.todos.unshift(duplicatedTodo);
        this.saveTodos();
        this.render();

        this.showNotification('Todo berhasil diduplikasi', 'success');
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
                const priorityOrder = { high: 3, medium: 2, low: 1 };
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
        todoEl.className = `todo-item ${todo.completed ? 'todo-completed' : ''} todo-priority-${todo.priority} bg-white rounded-lg shadow p-4 mb-3 transition-all duration-200 border-l-4 ${
            todo.priority === 'high' ? 'border-red-500' : 
            todo.priority === 'medium' ? 'border-yellow-500' : 
            'border-green-500'
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
                       class="mr-3 mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 todo-checkbox"
                       data-id="${todo.id}">
                <div class="flex-grow">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'} font-medium">
                            ${this.highlightSearch(todo.text)}
                        </h3>
                        <div class="flex items-center space-x-2">
                            ${this.getPriorityBadge(todo.priority)}
                            ${this.getCategoryBadge(todo.category)}
                            ${todo.completed ? `<span class="text-xs text-green-600"><i class="fas fa-check mr-1"></i>Selesai</span>` : ''}
                        </div>
                    </div>

                    ${todo.subtasks.length > 0 ? `
                        <div class="mb-2">
                            <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Progress: ${completedSubtasks}/${todo.subtasks.length}</span>
                                <span>${progressPercentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-indigo-600 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3 text-sm text-gray-500">
                            <span class="${isOverdue ? 'text-red-600 font-semibold' : isDueToday ? 'text-yellow-600' : isDueSoon ? 'text-orange-600' : ''}">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                ${this.formatDate(todo.date)}
                            </span>
                            ${todo.estimatedTime > 0 ? `
                                <span><i class="fas fa-clock mr-1"></i>${todo.estimatedTime}m</span>
                            ` : ''}
                            ${todo.attachments.length > 0 ? `
                                <span><i class="fas fa-paperclip mr-1"></i>${todo.attachments.length}</span>
                            ` : ''}
                            ${todo.reminders.length > 0 ? `
                                <span><i class="fas fa-bell mr-1"></i>${todo.reminders.length}</span>
                            ` : ''}
                            ${todo.isRecurring ? `
                                <span class="text-blue-600" title="Todo berulang"><i class="fas fa-sync-alt"></i></span>
                            ` : ''}
                        </div>
                    </div>

                    ${todo.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${todo.tags.map(tag => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${todo.notes ? `
                        <div class="mt-2 text-sm text-gray-600">
                            <i class="fas fa-sticky-note mr-1"></i>${this.highlightSearch(todo.notes)}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="flex items-center space-x-2 ml-4">
                <button class="expand-todo text-gray-400 hover:text-gray-600" data-id="${todo.id}" title="Expand">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="edit-todo text-blue-500 hover:text-blue-700" data-id="${todo.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="duplicate-todo text-green-500 hover:text-green-700" data-id="${todo.id}" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="delete-todo text-red-500 hover:text-red-700" data-id="${todo.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        this.attachTodoElementEventListeners(todoEl);

        return todoEl;
    },

    createEditModal(todo) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Edit Todo</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="form-label">Text</label>
                        <input type="text" id="edit-todo-text" value="${todo.text}"
                               class="form-input" placeholder="Masukkan todo...">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Prioritas</label>
                            <select id="edit-todo-priority" class="form-input">
                                <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Rendah</option>
                                <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Sedang</option>
                                <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>Tinggi</option>
                            </select>
                        </div>

                        <div>
                            <label class="form-label">Kategori</label>
                            <select id="edit-todo-category" class="form-input">
                                <option value="personal" ${todo.category === 'personal' ? 'selected' : ''}>Pribadi</option>
                                <option value="work" ${todo.category === 'work' ? 'selected' : ''}>Pekerjaan</option>
                                <option value="shopping" ${todo.category === 'shopping' ? 'selected' : ''}>Belanja</option>
                                <option value="health" ${todo.category === 'health' ? 'selected' : ''}>Kesehatan</option>
                                <option value="other" ${todo.category === 'other' ? 'selected' : ''}>Lainnya</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Tanggal</label>
                            <input type="date" id="edit-todo-date" value="${todo.date}" class="form-input">
                        </div>

                        <div>
                            <label class="form-label">Estimasi Waktu (menit)</label>
                            <input type="number" id="edit-todo-estimated-time" value="${todo.estimatedTime}"
                                   min="0" class="form-input">
                        </div>
                    </div>

                    <div>
                        <label class="form-label">Tags (pisahkan dengan koma)</label>
                        <input type="text" id="edit-todo-tags" value="${todo.tags.join(', ')}"
                               class="form-input" placeholder="tag1, tag2, tag3">
                    </div>

                    <div>
                        <label class="form-label">Catatan</label>
                        <textarea id="edit-todo-notes" rows="3" class="form-input"
                                  placeholder="Tambahkan catatan...">${todo.notes || ''}</textarea>
                    </div>

                    <div>
                        <label class="form-label">Pengingat</label>
                        <div class="grid grid-cols-2 gap-4">
                            <input type="date" id="edit-todo-reminder-date" class="form-input" placeholder="Tanggal pengingat">
                            <input type="time" id="edit-todo-reminder-time" class="form-input" placeholder="Waktu pengingat">
                        </div>
                        <button type="button" id="add-reminder" class="mt-2 text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-plus mr-1"></i> Tambah Pengingat
                        </button>
                    </div>

                    <div>
                        <label class="form-label">Subtasks</label>
                        <div id="edit-subtasks" class="space-y-2">
                            ${todo.subtasks.map((subtask, index) => `
                                <div class="flex items-center space-x-2">
                                    <input type="checkbox" ${subtask.completed ? 'checked' : ''}
                                           data-subtask-id="${subtask.id}" class="subtask-checkbox">
                                    <input type="text" value="${subtask.text}"
                                           data-subtask-id="${subtask.id}" class="subtask-input flex-grow form-input">
                                    <button class="remove-subtask text-red-500 hover:text-red-700"
                                            data-subtask-id="${subtask.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" id="add-subtask" class="mt-2 text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-plus mr-1"></i> Tambah Subtask
                        </button>
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" id="edit-todo-recurring" ${todo.isRecurring ? 'checked' : ''} class="mr-2">
                        <label for="edit-todo-recurring" class="form-label">Todo Berulang</label>
                    </div>
                    
                    <div id="recurrence-options" class="${todo.isRecurring ? '' : 'hidden'}">
                        <label class="form-label">Pola Pengulangan</label>
                        <select id="edit-todo-recurrence-pattern" class="form-input">
                            <option value="daily" ${todo.recurrencePattern === 'daily' ? 'selected' : ''}>Harian</option>
                            <option value="weekly" ${todo.recurrencePattern === 'weekly' ? 'selected' : ''}>Mingguan</option>
                            <option value="monthly" ${todo.recurrencePattern === 'monthly' ? 'selected' : ''}>Bulanan</option>
                            <option value="yearly" ${todo.recurrencePattern === 'yearly' ? 'selected' : ''}>Tahunan</option>
                        </select>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">
                        Batal
                    </button>
                    <button class="btn btn-primary" id="save-todo-changes">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEditModalEventListeners(modal, todo);

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

    getPriorityBadge(priority) {
        const badges = {
            high: '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Tinggi</span>',
            medium: '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Sedang</span>',
            low: '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Rendah</span>'
        };

        return badges[priority] || '';
    },

    getCategoryBadge(category) {
        const badges = {
            personal: '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Pribadi</span>',
            work: '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Pekerjaan</span>',
            shopping: '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Belanja</span>',
            health: '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Kesehatan</span>',
            other: '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Lainnya</span>'
        };

        return badges[category] || '';
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
            btn.classList.remove('bg-indigo-200');
        });
        activeBtn.classList.add('bg-indigo-200');
    },

    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const checkboxes = document.querySelectorAll('.todo-checkbox:checked');

        if (bulkActions) {
            bulkActions.style.display = checkboxes.length > 0 ? 'block' : 'none';
        }
    },

    updateFilterStats(filteredTodos) {
        const statsEl = document.getElementById('filter-stats');
        if (!statsEl) return;

        const completed = filteredTodos.filter(t => t.completed).length;
        const pending = filteredTodos.filter(t => !t.completed).length;

        statsEl.innerHTML = `
            <span class="text-sm text-gray-500">
                Menampilkan ${filteredTodos.length} todo: ${completed} selesai, ${pending} pending
            </span>
        `;
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

    // Event listener attachment methods
    attachTodoElementEventListeners(todoEl) {
        const todoId = parseInt(todoEl.dataset.id);

        // Checkbox
        const checkbox = todoEl.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                this.toggleTodo(todoId);
            });
        }

        // Action buttons
        const expandBtn = todoEl.querySelector('.expand-todo');
        const editBtn = todoEl.querySelector('.edit-todo');
        const duplicateBtn = todoEl.querySelector('.duplicate-todo');
        const deleteBtn = todoEl.querySelector('.delete-todo');

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
    },

    attachEditModalEventListeners(modal, todo) {
        const closeBtn = modal.querySelector('.close-modal');
        const saveBtn = modal.querySelector('#save-todo-changes');
        const addSubtaskBtn = modal.querySelector('#add-subtask');
        const addReminderBtn = modal.querySelector('#add-reminder');
        const recurringCheckbox = modal.querySelector('#edit-todo-recurring');
        const recurrenceOptions = modal.querySelector('#recurrence-options');

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
                    isRecurring: document.getElementById('edit-todo-recurring').checked,
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
        subtaskField.className = 'flex items-center space-x-2';
        subtaskField.innerHTML = `
            <input type="checkbox" data-subtask-id="${newSubtaskId}" class="subtask-checkbox">
            <input type="text" data-subtask-id="${newSubtaskId}" class="subtask-input flex-grow form-input"
                   placeholder="Masukkan subtask...">
            <button class="remove-subtask text-red-500 hover:text-red-700" data-subtask-id="${newSubtaskId}">
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
            <div class="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Detail Todo</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${todo.text}</h3>
                        <div class="flex items-center space-x-3 mt-2">
                            ${this.getPriorityBadge(todo.priority)}
                            ${this.getCategoryBadge(todo.category)}
                            ${todo.completed ? '<span class="text-green-600"><i class="fas fa-check mr-1"></i>Selesai</span>' : ''}
                            ${todo.isRecurring ? '<span class="text-blue-600"><i class="fas fa-sync-alt mr-1"></i>Todo Berulang</span>' : ''}
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500">Dibuat</p>
                            <p class="font-medium">${new Date(todo.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Diperbarui</p>
                            <p class="font-medium">${new Date(todo.updatedAt).toLocaleString('id-ID')}</p>
                        </div>
                    </div>

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

                    ${todo.notes ? `
                        <div>
                            <p class="text-sm text-gray-500">Catatan</p>
                            <p class="font-medium">${todo.notes}</p>
                        </div>
                    ` : ''}

                    ${todo.tags.length > 0 ? `
                        <div>
                            <p class="text-sm text-gray-500">Tags</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${todo.tags.map(tag => `
                                    <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        #${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.subtasks.length > 0 ? `
                        <div>
                            <p class="text-sm text-gray-500 mb-2">Subtasks</p>
                            <div class="space-y-2">
                                ${todo.subtasks.map(subtask => `
                                    <div class="flex items-center space-x-2">
                                        <input type="checkbox" ${subtask.completed ? 'checked' : ''} disabled>
                                        <span class="${subtask.completed ? 'line-through text-gray-500' : ''}">${subtask.text}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.attachments.length > 0 ? `
                        <div>
                            <p class="text-sm text-gray-500 mb-2">Lampiran</p>
                            <div class="space-y-2">
                                ${todo.attachments.map(attachment => `
                                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div class="flex items-center space-x-2">
                                            <i class="fas fa-paperclip text-gray-400"></i>
                                            <span class="text-sm">${attachment.name}</span>
                                            <span class="text-xs text-gray-500">(${this.formatFileSize(attachment.size)})</span>
                                        </div>
                                        <button class="text-blue-500 hover:text-blue-700 text-sm" onclick="Todo.downloadAttachment('${attachment.id}', ${todo.id})">
                                            Download
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${todo.reminders.length > 0 ? `
                        <div>
                            <p class="text-sm text-gray-500 mb-2">Pengingat</p>
                            <div class="space-y-2">
                                ${todo.reminders.map(reminder => `
                                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                            <span class="text-sm">${new Date(reminder.date + ' ' + reminder.time).toLocaleString('id-ID')}</span>
                                            <span class="text-xs text-gray-500 ml-2">${reminder.triggered ? 'Terpicu' : 'Belum terpicu'}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="flex justify-end mt-6 space-x-3">
                    <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">
                        Tutup
                    </button>
                    <button class="btn btn-primary" onclick="Todo.editTodo(${todo.id}); this.closest('.modal').remove()">
                        Edit
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
                const priorityOrder = { high: 0, medium: 1, low: 2 };
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

        if (!todo.priority || !['low', 'medium', 'high'].includes(todo.priority)) {
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