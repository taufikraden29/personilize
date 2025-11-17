// Enhanced calendar functionality
const Calendar = {
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    view: 'month', // month, week, day
    selectedDate: null,
    events: [],

    init() {
        this.loadEvents();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
        this.setupNotifications();
    },

    loadEvents() {
        const savedEvents = Storage.get('calendar-events');
        if (savedEvents) {
            this.events = savedEvents;
        } else {
            // Generate events from todos, habits, goals
            this.generateEventsFromData();
            Storage.set('calendar-events', this.events);
        }
    },

    generateEventsFromData() {
        this.events = [];

        // Generate events from todos
        Todo.todos.forEach(todo => {
            if (!todo.completed) {
                this.events.push({
                    id: `todo-${todo.id}`,
                    title: todo.text,
                    date: todo.date,
                    type: 'todo',
                    priority: todo.priority,
                    color: this.getTodoColor(todo.priority)
                });
            }
        });

        // Generate events from habits
        Habits.habits.forEach(habit => {
            habit.completedDates.forEach(date => {
                this.events.push({
                    id: `habit-${habit.id}-${date}`,
                    title: habit.name,
                    date: date,
                    type: 'habit',
                    habitId: habit.id,
                    color: '#10b981'
                });
            });
        });

        // Generate events from goals
        Goals.goals.forEach(goal => {
            if (goal.deadline && !goal.completed) {
                this.events.push({
                    id: `goal-${goal.id}`,
                    title: goal.title,
                    date: goal.deadline,
                    type: 'goal',
                    category: goal.category,
                    color: this.getGoalColor(goal.category)
                });
            }
        });

        // Generate events from journal entries
        Journal.entries.forEach(entry => {
            this.events.push({
                id: `journal-${entry.date}`,
                title: 'Journal Entry',
                date: entry.date,
                type: 'journal',
                mood: entry.mood,
                color: this.getJournalColor(entry.mood)
            });
        });
    },

    setupEventListeners() {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        const todayBtn = document.getElementById('today-btn');
        const viewBtns = document.querySelectorAll('.view-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousMonth());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextMonth());
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }

        if (viewBtns) {
            viewBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setView(btn.dataset.view);
                });
            });
        }

        // Mini calendar navigation
        const miniPrevBtn = document.getElementById('mini-prev-month');
        const miniNextBtn = document.getElementById('mini-next-month');

        if (miniPrevBtn) {
            miniPrevBtn.addEventListener('click', () => {
                this.previousMonth();
                this.render();
            });
        }

        if (miniNextBtn) {
            miniNextBtn.addEventListener('click', () => {
                this.nextMonth();
                this.render();
            });
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger shortcuts if not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // Arrow keys: Navigate calendar
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousMonth();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextMonth();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.previousYear();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.nextYear();
            }

            // T: Today
            if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.goToToday();
            }

            // M: Month view
            if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.setView('month');
            }

            // W: Week view
            if (e.key === 'w' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.setView('week');
            }

            // D: Day view
            if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.setView('day');
            }
        });
    },

    setupNotifications() {
        // Check for upcoming events and show notifications
        this.checkUpcomingEvents();

        // Check every hour
        setInterval(() => {
            this.checkUpcomingEvents();
        }, 60 * 60 * 1000);
    },

    checkUpcomingEvents() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Check for events tomorrow
        const tomorrowEvents = this.events.filter(event => event.date === tomorrowStr);

        if (tomorrowEvents.length > 0) {
            tomorrowEvents.forEach(event => {
                if (!this.isNotificationShown(event.id, tomorrowStr)) {
                    this.showEventNotification(event, 'besok');
                    this.markNotificationShown(event.id, tomorrowStr);
                }
            });
        }
    },

    isNotificationShown(eventId, date) {
        const shownNotifications = Storage.get('calendar-notifications') || {};
        return shownNotifications[`${eventId}-${date}`] || false;
    },

    markNotificationShown(eventId, date) {
        const shownNotifications = Storage.get('calendar-notifications') || {};
        shownNotifications[`${eventId}-${date}`] = true;
        Storage.set('calendar-notifications', shownNotifications);
    },

    showEventNotification(event, timeframe) {
        const message = `${event.title} ${timeframe}`;

        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, 'info');
        }

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pengingat Kalender', {
                body: message,
                icon: '/favicon.ico',
                tag: 'calendar-reminder'
            });
        }
    },

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    },

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    },

    previousYear() {
        this.currentYear--;
        this.render();
    },

    nextYear() {
        this.currentYear++;
        this.render();
    },

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectedDate = today.toISOString().split('T')[0];
        this.render();
    },

    setView(view) {
        this.view = view;
        this.render();

        // Update view buttons
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('bg-indigo-600', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
    },

    selectDate(date) {
        this.selectedDate = date;
        this.render();
        this.showDayDetails(date);
    },

    render() {
        const calendarDays = document.getElementById('calendar-days');
        const currentMonthEl = document.getElementById('current-month');

        if (!calendarDays || !currentMonthEl) return;

        // Update month display
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        currentMonthEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Render based on current view
        switch (this.view) {
            case 'month':
                this.renderMonthView(calendarDays);
                break;
            case 'week':
                this.renderWeekView(calendarDays);
                break;
            case 'day':
                this.renderDayView(calendarDays);
                break;
        }

        // Update mini calendar if exists
        this.renderMiniCalendar();
    },

    renderMonthView(container) {
        container.innerHTML = '';
        container.className = 'grid grid-cols-7 gap-1';

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'p-2';
            container.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateObj = new Date(dateStr);

            const isToday = today.getDate() === day &&
                today.getMonth() === this.currentMonth &&
                today.getFullYear() === this.currentYear;

            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const isSelected = this.selectedDate === dateStr;

            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day p-2 border rounded cursor-pointer transition-all duration-200 hover:shadow-md ${isToday ? 'calendar-day-today' : ''
                } ${isWeekend ? 'calendar-day-weekend' : ''} ${isSelected ? 'calendar-day-selected' : ''
                }`;

            // Get events for this day
            const dayEvents = this.getEventsForDate(dateStr);
            const hasEvents = dayEvents.length > 0;

            dayEl.innerHTML = `
                <div class="text-center">
                    <div class="font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-800'}">${day}</div>
                    ${hasEvents ? `
                        <div class="flex justify-center mt-1 space-x-1">
                            ${dayEvents.slice(0, 3).map(event => `
                                <div class="w-2 h-2 rounded-full" style="background-color: ${event.color}" 
                                     title="${event.title}"></div>
                            `).join('')}
                            ${dayEvents.length > 3 ? `<div class="text-xs text-gray-500">+${dayEvents.length - 3}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;

            dayEl.addEventListener('click', () => {
                this.selectDate(dateStr);
            });

            dayEl.addEventListener('dblclick', () => {
                this.showAddEventModal(dateStr);
            });

            container.appendChild(dayEl);
        }
    },

    renderWeekView(container) {
        container.innerHTML = '';
        container.className = 'space-y-2';

        const startOfWeek = new Date(this.currentYear, this.currentMonth, 1);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-week-day border rounded-lg p-4';

            const isToday = this.isToday(dateStr);
            const dayEvents = this.getEventsForDate(dateStr);

            const dayName = currentDate.toLocaleDateString('id-ID', { weekday: 'long' });
            const dayDate = currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });

            dayEl.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-800'}">
                        ${dayName}
                    </h3>
                    <span class="text-sm text-gray-500">${dayDate}</span>
                </div>
                <div class="space-y-2">
                    ${dayEvents.length > 0 ? dayEvents.map(event => `
                        <div class="flex items-center p-2 rounded" style="background-color: ${event.color}20">
                            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${event.color}"></div>
                            <div class="flex-grow">
                                <div class="font-medium text-sm">${event.title}</div>
                                ${event.type === 'todo' ? `<span class="text-xs text-gray-500">Priority: ${event.priority}</span>` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <p class="text-center text-gray-500 py-4">Tidak ada acara</p>
                    `}
                </div>
            `;

            container.appendChild(dayEl);
        }
    },

    renderDayView(container) {
        container.innerHTML = '';
        container.className = '';

        if (!this.selectedDate) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Pilih tanggal untuk melihat detail</p>';
            return;
        }

        const dateObj = new Date(this.selectedDate);
        const dayEvents = this.getEventsForDate(this.selectedDate);

        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day-detail';

        const dayName = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        dayEl.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">${dayName}</h2>
                </div>
                
                <div class="space-y-4">
                    ${dayEvents.length > 0 ? `
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Acara Hari Ini</h3>
                        ${dayEvents.map(event => this.renderEventCard(event)).join('')}
                    ` : `
                        <div class="text-center py-8">
                            <i class="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500">Tidak ada acara pada hari ini</p>
                        </div>
                    `}
                </div>
                
                <div class="mt-6 text-center">
                    <button class="btn btn-primary" onclick="Calendar.showAddEventModal('${this.selectedDate}')">
                        <i class="fas fa-plus mr-2"></i> Tambah Acara
                    </button>
                </div>
            </div>
        `;

        container.appendChild(dayEl);
    },

    renderEventCard(event) {
        const typeIcons = {
            todo: 'fa-tasks',
            habit: 'fa-calendar-check',
            goal: 'fa-bullseye',
            journal: 'fa-book'
        };

        const typeLabels = {
            todo: 'Todo',
            habit: 'Kebiasaan',
            goal: 'Tujuan',
            journal: 'Journal'
        };

        return `
            <div class="border rounded-lg p-3 hover:shadow-md transition-shadow" style="border-left: 4px solid ${event.color}">
                <div class="flex items-start justify-between">
                    <div class="flex-grow">
                        <div class="flex items-center mb-1">
                            <i class="fas ${typeIcons[event.type]} mr-2" style="color: ${event.color}"></i>
                            <h4 class="font-medium text-gray-800">${event.title}</h4>
                        </div>
                        <span class="text-xs text-gray-500">${typeLabels[event.type]}</span>
                    </div>
                    <div class="flex space-x-2">
                        ${event.type === 'todo' ? `
                            <button class="text-blue-500 hover:text-blue-700" onclick="Calendar.completeTodo('${event.id.replace('todo-', '')}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="text-gray-500 hover:text-gray-700" onclick="Calendar.editEvent('${event.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700" onclick="Calendar.deleteEvent('${event.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderMiniCalendar() {
        const miniCalendar = document.getElementById('mini-calendar');
        if (!miniCalendar) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Generate mini calendar for current month
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        let html = '<div class="grid grid-cols-7 gap-1 text-xs">';

        // Day headers
        const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        dayHeaders.forEach(day => {
            html += `<div class="text-center font-semibold text-gray-600 p-1">${day}</div>`;
        });

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="p-1"></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getDate() === day;
            html += `<div class="text-center p-1 rounded ${isToday ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}">${day}</div>`;
        }

        html += '</div>';
        miniCalendar.innerHTML = html;
    },

    getEventsForDate(dateStr) {
        return this.events.filter(event => event.date === dateStr);
    },

    showDayDetails(dateStr) {
        const events = this.getEventsForDate(dateStr);

        if (events.length === 0) {
            this.showNotification('Tidak ada acara pada tanggal ini', 'info');
            return;
        }

        // Show modal with event details
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Detail Acara</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-3">
                    ${events.map(event => this.renderEventCard(event)).join('')}
                </div>
                <div class="flex justify-end mt-6">
                    <button class="btn btn-primary" onclick="this.closest('.fixed').remove()">
                        Tutup
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    },

    showAddEventModal(date) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Tambah Acara</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Tanggal</label>
                        <input type="date" id="event-date" value="${date}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Judul</label>
                        <input type="text" id="event-title" class="form-input" placeholder="Masukkan judul acara">
                    </div>
                    <div>
                        <label class="form-label">Deskripsi</label>
                        <textarea id="event-description" rows="3" class="form-input" placeholder="Masukkan deskripsi acara"></textarea>
                    </div>
                    <div>
                        <label class="form-label">Warna</label>
                        <input type="color" id="event-color" value="#6366f1" class="form-input h-10">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.fixed').remove()">
                        Batal
                    </button>
                    <button class="btn btn-primary" onclick="Calendar.addEvent()">
                        Simpan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    },

    addEvent() {
        const date = document.getElementById('event-date').value;
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const color = document.getElementById('event-color').value;

        if (!title.trim()) {
            this.showNotification('Judul acara harus diisi', 'warning');
            return;
        }

        const event = {
            id: `custom-${Date.now()}`,
            title: title.trim(),
            description: description.trim(),
            date: date,
            color: color,
            type: 'custom',
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();
        this.render();

        // Close modal
        document.querySelector('.fixed').remove();

        this.showNotification('Acara berhasil ditambahkan', 'success');
    },

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // For todo events, open todo edit
        if (event.type === 'todo') {
            const todoId = parseInt(eventId.replace('todo-', ''));
            Todo.editTodo(todoId);
            return;
        }

        // For custom events, show edit modal
        this.showEditEventModal(event);
    },

    showEditEventModal(event) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Edit Acara</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Judul</label>
                        <input type="text" id="edit-event-title" value="${event.title}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Deskripsi</label>
                        <textarea id="edit-event-description" rows="3" class="form-input">${event.description}</textarea>
                    </div>
                    <div>
                        <label class="form-label">Warna</label>
                        <input type="color" id="edit-event-color" value="${event.color}" class="form-input h-10">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.fixed').remove()">
                        Batal
                    </button>
                    <button class="btn btn-danger" onclick="Calendar.deleteEvent('${event.id}'); this.closest('.fixed').remove();">
                        Hapus
                    </button>
                    <button class="btn btn-primary" onclick="Calendar.updateEvent('${event.id}')">
                        Simpan
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    },

    updateEvent(eventId) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const title = document.getElementById('edit-event-title').value;
        const description = document.getElementById('edit-event-description').value;
        const color = document.getElementById('edit-event-color').value;

        this.events[eventIndex] = {
            ...this.events[eventIndex],
            title: title.trim(),
            description: description.trim(),
            color: color,
            updatedAt: new Date().toISOString()
        };

        this.saveEvents();
        this.render();

        // Close modal
        document.querySelector('.fixed').remove();

        this.showNotification('Acara berhasil diperbarui', 'success');
    },

    deleteEvent(eventId) {
        if (confirm('Apakah Anda yakin ingin menghapus acara ini?')) {
            // For todo events, delete todo
            if (eventId.startsWith('todo-')) {
                const todoId = parseInt(eventId.replace('todo-', ''));
                Todo.deleteTodo(todoId);
                return;
            }

            // For other events, remove from calendar
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.render();

            this.showNotification('Acara berhasil dihapus', 'success');
        }
    },

    completeTodo(todoId) {
        Todo.toggleTodo(todoId);
        this.generateEventsFromData();
        this.saveEvents();
        this.render();
    },

    isToday(dateStr) {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    },

    getTodoColor(priority) {
        const colors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };
        return colors[priority] || '#6b7280';
    },

    getGoalColor(category) {
        const colors = {
            personal: '#3b82f6',
            career: '#8b5cf6',
            health: '#10b981',
            finance: '#f59e0b',
            learning: '#f97316'
        };
        return colors[category] || '#6b7280';
    },

    getJournalColor(mood) {
        const colors = {
            'very-happy': '#10b981',
            'happy': '#3b82f6',
            'neutral': '#6b7280',
            'sad': '#f59e0b',
            'angry': '#ef4444'
        };
        return colors[mood] || '#6b7280';
    },

    saveEvents() {
        Storage.set('calendar-events', this.events);
    },

    getStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        const todayEvents = this.events.filter(e => e.date === today);
        const monthEvents = this.events.filter(e => e.date.startsWith(thisMonth));

        const eventsByType = {
            todo: this.events.filter(e => e.type === 'todo').length,
            habit: this.events.filter(e => e.type === 'habit').length,
            goal: this.events.filter(e => e.type === 'goal').length,
            journal: this.events.filter(e => e.type === 'journal').length,
            custom: this.events.filter(e => e.type === 'custom').length
        };

        return {
            todayEvents: todayEvents.length,
            monthEvents: monthEvents.length,
            totalEvents: this.events.length,
            eventsByType
        };
    },

    showNotification(message, type = 'success') {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, type);
        }
    }
};