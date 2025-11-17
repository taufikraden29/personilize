// Enhanced calendar functionality with multiple views, event management, and collaboration features
const Calendar = {
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    view: 'month', // month, week, day
    selectedDate: null,
    events: [],
    draggedEvent: null,
    collaborators: [],

    init() {
        this.loadEvents();
        this.loadCollaborators();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
        this.setupNotifications();
        this.updateStatistics();
        this.setupDragAndDrop();
        this.setupSearch();
        this.setupSyncIntervals(); // Start sync intervals after initialization
    },

    loadEvents() {
        const savedEvents = Storage.get('calendar-events');
        if (savedEvents) {
            // Add default time values to events that don't have them
            this.events = savedEvents.map(event => {
                if (!event.hasOwnProperty('startTime')) {
                    event.startTime = '09:00';
                }
                if (!event.hasOwnProperty('endTime')) {
                    event.endTime = '10:00';
                }
                return event;
            });
        } else {
            // Generate events from todos, habits, goals
            this.generateEventsFromData();
            Storage.set('calendar-events', this.events);
        }
    },

    loadCollaborators() {
        const savedCollaborators = Storage.get('calendar-collaborators');
        if (savedCollaborators) {
            this.collaborators = savedCollaborators;
        } else {
            this.collaborators = [];
            Storage.set('calendar-collaborators', this.collaborators);
        }
    },

    generateEventsFromData() {
        this.events = [];

        // Generate events from todos
        if (typeof Todo !== 'undefined' && Todo.todos) {
            Todo.todos.forEach(todo => {
                if (!todo.completed) {
                    this.events.push({
                        id: `todo-${todo.id}`,
                        title: todo.text,
                        date: todo.date,
                        type: 'todo',
                        priority: todo.priority,
                        color: this.getTodoColor(todo.priority),
                        category: 'todo',
                        description: todo.notes || '',
                        reminder: todo.reminder || null,
                        recurring: todo.recurring || null,
                        startTime: '09:00', // Default start time
                        endTime: '10:00'    // Default end time
                    });
                }
            });
        }

        // Generate events from habits
        if (typeof Habits !== 'undefined' && Habits.habits) {
            Habits.habits.forEach(habit => {
                habit.completedDates.forEach(date => {
                    this.events.push({
                        id: `habit-${habit.id}-${date}`,
                        title: habit.name,
                        date: date,
                        type: 'habit',
                        habitId: habit.id,
                        color: '#10b981',
                        category: 'habit',
                        description: `Kebiasaan: ${habit.name}`,
                        startTime: '08:00', // Default start time
                        endTime: '08:30'    // Default end time
                    });
                });
            });
        }

        // Generate events from goals
        if (typeof Goals !== 'undefined' && Goals.goals) {
            Goals.goals.forEach(goal => {
                if (goal.deadline && !goal.completed) {
                    this.events.push({
                        id: `goal-${goal.id}`,
                        title: goal.title,
                        date: goal.deadline,
                        type: 'goal',
                        category: goal.category,
                        color: this.getGoalColor(goal.category),
                        description: goal.description || '',
                        startTime: '10:00', // Default start time
                        endTime: '11:00'    // Default end time
                    });
                }
            });
        }

        // Generate events from journal entries
        if (typeof Journal !== 'undefined' && Journal.entries) {
            Journal.entries.forEach(entry => {
                this.events.push({
                    id: `journal-${entry.date}`,
                    title: 'Journal Entry',
                    date: entry.date,
                    type: 'journal',
                    mood: entry.mood,
                    color: this.getJournalColor(entry.mood),
                    category: 'journal',
                    description: entry.content || '',
                    startTime: '20:00', // Default start time
                    endTime: '20:30'    // Default end time
                });
            });
        }
    },

    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        const todayBtn = document.getElementById('today-btn');
        const viewBtns = document.querySelectorAll('.view-btn');
        const addEventBtn = document.getElementById('add-event-btn');
        const calendarExportBtn = document.getElementById('calendar-export-btn');
        const calendarPrintBtn = document.getElementById('calendar-print-btn');

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

        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => this.showAddEventModal());
        }

        if (calendarExportBtn) {
            calendarExportBtn.addEventListener('click', () => this.exportCalendar());
        }

        if (calendarPrintBtn) {
            calendarPrintBtn.addEventListener('click', () => this.printCalendar());
        }

        // Event modal buttons
        const closeEventModal = document.getElementById('close-event-modal');
        const cancelEvent = document.getElementById('cancel-event');
        const saveEvent = document.getElementById('save-event');
        const eventReminderEnabled = document.getElementById('event-reminder-enabled');
        const eventRecurring = document.getElementById('event-recurring');
        const addAttachmentBtn = document.getElementById('add-attachment-btn');
        const eventAttachmentInput = document.getElementById('event-attachment');

        if (closeEventModal) {
            closeEventModal.addEventListener('click', () => this.closeEventModal());
        }

        if (cancelEvent) {
            cancelEvent.addEventListener('click', () => this.closeEventModal());
        }

        if (saveEvent) {
            saveEvent.addEventListener('click', () => this.saveEvent());
        }

        if (eventReminderEnabled) {
            eventReminderEnabled.addEventListener('change', (e) => {
                const reminderOptions = document.getElementById('reminder-options');
                if (reminderOptions) {
                    reminderOptions.classList.toggle('hidden', !e.target.checked);
                }
            });
        }

        if (eventRecurring) {
            eventRecurring.addEventListener('change', (e) => {
                const recurringOptions = document.getElementById('recurring-options');
                if (recurringOptions) {
                    recurringOptions.classList.toggle('hidden', !e.target.checked);
                }
            });
        }


        // Initialize the default color selection
        this.initColorSelection();

        if (addAttachmentBtn) {
            addAttachmentBtn.addEventListener('click', () => {
                if (eventAttachmentInput.files.length > 0) {
                    Array.from(eventAttachmentInput.files).forEach(file => {
                        // For now, just show a notification - in a real implementation, you would upload the file
                        this.showNotification(`Lampiran "${file.name}" akan ditambahkan`, 'info');
                    });
                    eventAttachmentInput.value = ''; // Clear the input
                } else {
                    this.showNotification('Silakan pilih file untuk dilampirkan', 'warning');
                }
            });
        }

        // Calendar sharing modal
        const shareCalendar = document.getElementById('share-calendar');
        const closeSharingModal = document.getElementById('close-sharing-modal');
        const cancelSharing = document.getElementById('cancel-sharing');

        if (shareCalendar) {
            shareCalendar.addEventListener('click', () => this.shareCalendar());
        }

        if (closeSharingModal) {
            closeSharingModal.addEventListener('click', () => this.closeSharingModal());
        }

        if (cancelSharing) {
            cancelSharing.addEventListener('click', () => this.closeSharingModal());
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

            // N: New event
            if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.showAddEventModal();
            }

            // S: Search
            if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const searchInput = document.getElementById('calendar-search');
                if (searchInput) {
                    searchInput.focus();
                }
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

        // Check for events with reminders
        this.events.forEach(event => {
            if (event.reminder) {
                this.checkEventReminder(event);
            }
        });
    },

    checkEventReminder(event) {
        if (!event.reminder) return;

        const eventDate = new Date(event.date);
        const reminderMinutes = event.reminder.minutes || 0;
        const reminderTime = new Date(eventDate.getTime() - reminderMinutes * 60000);
        const now = new Date();

        // Check if we're within the reminder window
        if (now >= reminderTime && now < eventDate) {
            if (!this.isReminderShown(event.id)) {
                this.showEventNotification(event, `dalam ${reminderMinutes} menit`);
                this.markReminderShown(event.id);
            }
        }
    },

    isNotificationShown(eventId, date) {
        const shownNotifications = Storage.get('calendar-notifications') || {};
        return shownNotifications[`${eventId}-${date}`] || false;
    },

    isReminderShown(eventId) {
        const shownReminders = Storage.get('calendar-reminders') || {};
        return shownReminders[eventId] || false;
    },

    markNotificationShown(eventId, date) {
        const shownNotifications = Storage.get('calendar-notifications') || {};
        shownNotifications[`${eventId}-${date}`] = true;
        Storage.set('calendar-notifications', shownNotifications);
    },

    markReminderShown(eventId) {
        const shownReminders = Storage.get('calendar-reminders') || {};
        shownReminders[eventId] = true;
        Storage.set('calendar-reminders', shownReminders);
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
        this.updateStatistics();
    },

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
        this.updateStatistics();
    },

    previousYear() {
        this.currentYear--;
        this.render();
        this.updateStatistics();
    },

    nextYear() {
        this.currentYear++;
        this.render();
        this.updateStatistics();
    },

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectedDate = today.toISOString().split('T')[0];
        this.render();
        this.updateStatistics();
    },

    setView(view) {
        this.view = view;
        this.render();
        this.updateStatistics();

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
            dayEl.className = `calendar-day p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col h-24 ${isToday ? 'calendar-day-today bg-indigo-50' : ''
                } ${isWeekend ? 'calendar-day-weekend bg-gray-50' : ''} ${isSelected ? 'calendar-day-selected ring-2 ring-indigo-500' : ''
                }`;

            // Get events for this day
            const dayEvents = this.getEventsForDate(dateStr);
            const hasEvents = dayEvents.length > 0;

            dayEl.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-800'}">${day}</div>
                    ${isToday ? '<span class="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">Hari Ini</span>' : ''}
                </div>
                <div class="flex-grow overflow-y-auto mt-1 space-y-1">
                    ${hasEvents ? dayEvents.slice(0, 3).map(event => `
                        <div class="event-item text-xs p-1 rounded truncate"
                             style="background-color: ${event.color}20; border-left: 3px solid ${event.color};"
                             title="${event.title}${event.startTime ? ' (' + event.startTime + (event.endTime ? ' - ' + event.endTime : '') + ')' : ''}"
                             data-event-id="${event.id}">
                            <span class="truncate">${event.title}</span>
                            ${event.startTime ? `<span class="text-xs opacity-75">${event.startTime}</span>` : ''}
                        </div>
                    `).join('') : ''}
                    ${dayEvents.length > 3 ? `<div class="text-xs text-gray-500 text-center">+${dayEvents.length - 3}</div>` : ''}
                </div>
            `;

            dayEl.addEventListener('click', () => {
                this.selectDate(dateStr);
            });

            dayEl.addEventListener('dblclick', () => {
                this.showAddEventModal(dateStr);
            });

            // Add drag and drop functionality
            dayEl.setAttribute('data-date', dateStr);
            dayEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                dayEl.classList.add('bg-blue-100');
            });

            dayEl.addEventListener('dragleave', () => {
                dayEl.classList.remove('bg-blue-100');
            });

            dayEl.addEventListener('drop', (e) => {
                e.preventDefault();
                dayEl.classList.remove('bg-blue-100');
                if (this.draggedEvent) {
                    this.moveEventToNewDate(this.draggedEvent, dateStr);
                }
            });

            container.appendChild(dayEl);
        }
    },

    renderWeekView(container) {
        container.innerHTML = '';
        container.className = 'space-y-2';

        // Calculate the start of the week based on the current date
        const date = this.selectedDate ? new Date(this.selectedDate) : new Date();
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek);

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
                <div class="space-y-2 max-h-40 overflow-y-auto">
                    ${dayEvents.length > 0 ? dayEvents.map(event => `
                        <div class="event-item flex items-center p-2 rounded border-l-4"
                             style="background-color: ${event.color}20; border-left-color: ${event.color};"
                             data-event-id="${event.id}">
                            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${event.color}"></div>
                            <div class="flex-grow">
                                <div class="font-medium text-sm">${event.title}</div>
                                ${event.startTime ? `<div class="text-xs text-gray-600">${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</div>` : ''}
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
            journal: 'fa-book',
            custom: 'fa-calendar-plus',
            meeting: 'fa-users',
            personal: 'fa-user',
            work: 'fa-briefcase'
        };

        const typeLabels = {
            todo: 'Todo',
            habit: 'Kebiasaan',
            goal: 'Tujuan',
            journal: 'Journal',
            custom: 'Kustom',
            meeting: 'Pertemuan',
            personal: 'Pribadi',
            work: 'Pekerjaan'
        };

        const categoryColors = {
            todo: 'bg-blue-100 text-blue-800',
            habit: 'bg-green-100 text-green-800',
            goal: 'bg-purple-100 text-purple-800',
            journal: 'bg-yellow-100 text-yellow-800',
            custom: 'bg-indigo-100 text-indigo-800',
            meeting: 'bg-red-100 text-red-800',
            personal: 'bg-pink-100 text-pink-800',
            work: 'bg-gray-100 text-gray-800'
        };

        // Format time display
        const startTimeDisplay = event.startTime ? ` ${event.startTime}` : '';
        const endTimeDisplay = event.endTime ? ` - ${event.endTime}` : '';

        return `
            <div class="event-item border rounded-lg p-3 hover:shadow-md transition-shadow" style="border-left: 4px solid ${event.color}"
                 data-event-id="${event.id}">
                <div class="flex items-start justify-between">
                    <div class="flex-grow">
                        <div class="flex items-center mb-1">
                            <i class="fas ${typeIcons[event.type] || typeIcons.custom} mr-2" style="color: ${event.color}"></i>
                            <h4 class="font-medium text-gray-800">${event.title}</h4>
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-2 py-1 text-xs rounded-full ${categoryColors[event.category] || categoryColors.custom}">
                                ${typeLabels[event.type] || typeLabels.custom}
                            </span>
                            ${event.reminder ? `<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pengingat</span>` : ''}
                            ${event.recurring ? `<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Berulang</span>` : ''}
                        </div>
                        ${event.description ? `<p class="text-sm text-gray-600 mb-2">${event.description}</p>` : ''}
                        <div class="flex items-center text-xs text-gray-500">
                            <i class="fas fa-calendar mr-1"></i>
                            <span>${event.date}${startTimeDisplay}${endTimeDisplay}</span>
                        </div>
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

        // Update today's agenda section
        const todayAgenda = document.getElementById('today-agenda');
        if (todayAgenda) {
            todayAgenda.innerHTML = events.map(event => this.renderEventCard(event)).join('');
        }
    },

    showAddEventModal(date = null) {
        const eventModal = document.getElementById('event-modal');
        if (eventModal) {
            // Set date if provided
            if (date) {
                document.getElementById('event-start-date').value = date;
                document.getElementById('event-end-date').value = date;
                // Set default time to 9:00 AM for start and 10:00 AM for end
                document.getElementById('event-start-time').value = '09:00';
                document.getElementById('event-end-time').value = '10:00';
            } else {
                // Set default times
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                document.getElementById('event-start-time').value = `${hours}:${minutes}`;
                document.getElementById('event-end-time').value = `${String(now.getHours() + 1).padStart(2, '0')}:${minutes}`;
            }

            // Reset form and show as add mode
            document.getElementById('event-modal-title').textContent = 'Tambah Acara';
            document.getElementById('save-event').textContent = 'Simpan';
            document.getElementById('save-event').onclick = () => this.saveEvent();

            // Reset form fields
            document.getElementById('event-title').value = '';
            document.getElementById('event-description').value = '';
            document.getElementById('event-category').value = 'custom';
            document.getElementById('event-color').value = '#6366f1';
            document.getElementById('event-reminder-enabled').checked = false;
            document.getElementById('event-recurring').checked = false;

            // Hide reminder and recurring options
            document.getElementById('reminder-options').classList.add('hidden');
            document.getElementById('recurring-options').classList.add('hidden');

            // Hide error messages
            document.getElementById('event-title-error').classList.add('hidden');

            // Show modal with animation
            eventModal.classList.remove('hidden');
            setTimeout(() => {
                eventModal.classList.add('opacity-100', 'scale-100', 'translate-y-0');
                eventModal.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
            }, 10);
        }
    },

    closeEventModal() {
        const eventModal = document.getElementById('event-modal');
        if (eventModal) {
            // Add closing animation
            eventModal.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
            eventModal.classList.add('opacity-0', 'scale-95', 'translate-y-4');

            // Hide modal after animation completes
            setTimeout(() => {
                eventModal.classList.add('hidden');
            }, 300);
        }
    },

    saveEvent() {
        const title = document.getElementById('event-title').value;
        const startDate = document.getElementById('event-start-date').value;
        const startTime = document.getElementById('event-start-time').value;
        const endDate = document.getElementById('event-end-date').value;
        const endTime = document.getElementById('event-end-time').value;
        const description = document.getElementById('event-description').value;
        const category = document.getElementById('event-category').value;
        const color = document.getElementById('event-color').value;
        const reminderEnabled = document.getElementById('event-reminder-enabled').checked;
        const reminderTime = document.getElementById('event-reminder-time').value;
        const recurring = document.getElementById('event-recurring').checked;
        const recurrencePattern = document.getElementById('event-recurrence-pattern').value;

        // Validation
        let isValid = true;

        if (!title.trim()) {
            document.getElementById('event-title-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('event-title-error').classList.add('hidden');
        }

        if (!isValid) {
            return;
        }

        // Combine date and time
        const startDateTime = startTime ? `${startDate}T${startTime}` : startDate;
        const endDateTime = endTime ? `${endDate}T${endTime}` : endDate;

        const event = {
            id: `custom-${Date.now()}`,
            title: title.trim(),
            startDate: startDate,
            startTime: startTime,
            endDate: endDate,
            endTime: endTime,
            date: startDate, // For compatibility with existing functions
            fullStartDateTime: startDateTime,
            fullEndDateTime: endDateTime,
            description: description.trim(),
            color: color,
            type: 'custom',
            category: category,
            createdAt: new Date().toISOString(),
            reminder: reminderEnabled ? { minutes: parseInt(reminderTime) } : null,
            recurring: recurring ? { pattern: recurrencePattern } : null,
            attachments: [] // Initialize empty attachments array
        };

        this.events.push(event);
        this.saveEvents();
        this.render();
        this.updateStatistics();

        // Close modal
        this.closeEventModal();

        this.showNotification('Acara berhasil ditambahkan', 'success');
    },

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // For todo events, open todo edit
        if (event.type === 'todo') {
            const todoId = parseInt(eventId.replace('todo-', ''));
            if (typeof Todo !== 'undefined') {
                Todo.editTodo(todoId);
            }
            return;
        }

        // For other events, show edit modal
        this.showEditEventModal(event);
    },

    showEditEventModal(event) {
        const eventModal = document.getElementById('event-modal');
        if (eventModal) {
            // Set modal title
            document.getElementById('event-modal-title').textContent = 'Edit Acara';
            document.getElementById('save-event').textContent = 'Perbarui';
            document.getElementById('save-event').onclick = () => this.updateEvent(event.id);

            // Set form values
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-start-date').value = event.startDate || event.date;
            document.getElementById('event-end-date').value = event.endDate || event.date;

            // Extract time from date strings if they exist
            if (event.startTime) {
                document.getElementById('event-start-time').value = event.startTime;
            } else {
                document.getElementById('event-start-time').value = '09:00';
            }

            if (event.endTime) {
                document.getElementById('event-end-time').value = event.endTime;
            } else {
                document.getElementById('event-end-time').value = '10:00';
            }

            document.getElementById('event-description').value = event.description || '';
            document.getElementById('event-category').value = event.category;
            document.getElementById('event-color').value = event.color;

            // Set reminder values
            const reminderEnabled = document.getElementById('event-reminder-enabled');
            const reminderOptions = document.getElementById('reminder-options');
            if (event.reminder) {
                reminderEnabled.checked = true;
                document.getElementById('event-reminder-time').value = event.reminder.minutes || 0;
                reminderOptions.classList.remove('hidden');
            } else {
                reminderEnabled.checked = false;
                reminderOptions.classList.add('hidden');
            }

            // Set recurring values
            const recurringCheckbox = document.getElementById('event-recurring');
            const recurringOptions = document.getElementById('recurring-options');
            if (event.recurring) {
                recurringCheckbox.checked = true;
                document.getElementById('event-recurrence-pattern').value = event.recurring.pattern;
                recurringOptions.classList.remove('hidden');
            } else {
                recurringCheckbox.checked = false;
                recurringOptions.classList.add('hidden');
            }

            // Show attachments
            this.updateAttachmentsList(event.id);

            // Show modal with animation
            eventModal.classList.remove('hidden');
            setTimeout(() => {
                eventModal.classList.add('opacity-100', 'scale-100', 'translate-y-0');
                eventModal.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
            }, 10);
        }
    },

    updateAttachmentsList(eventId) {
        const attachmentsList = document.getElementById('attachments-list');
        if (!attachmentsList) return;

        const event = this.events.find(e => e.id === eventId);
        if (!event || !event.attachments || event.attachments.length === 0) {
            attachmentsList.innerHTML = '<p class="text-sm text-gray-500">Tidak ada lampiran</p>';
            return;
        }

        attachmentsList.innerHTML = event.attachments.map(attachment => `
            <div class="flex items-center justify-between p-2 bg-gray-100 rounded">
                <div class="flex items-center">
                    <i class="fas fa-paperclip mr-2 text-gray-600"></i>
                    <span class="text-sm">${attachment.name}</span>
                    <span class="text-xs text-gray-500 ml-2">(${this.formatFileSize(attachment.size)})</span>
                </div>
                <button class="text-red-500 hover:text-red-700" onclick="Calendar.removeAttachment('${eventId}', '${attachment.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    removeAttachment(eventId, attachmentId) {
        this.removeAttachmentFromEvent(eventId, attachmentId);
        this.updateAttachmentsList(eventId);
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    updateEvent(eventId) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const title = document.getElementById('event-title').value;
        const startDate = document.getElementById('event-start-date').value;
        const startTime = document.getElementById('event-start-time').value;
        const endDate = document.getElementById('event-end-date').value;
        const endTime = document.getElementById('event-end-time').value;
        const description = document.getElementById('event-description').value;
        const category = document.getElementById('event-category').value;
        const color = document.getElementById('event-color').value;
        const reminderEnabled = document.getElementById('event-reminder-enabled').checked;
        const reminderTime = document.getElementById('event-reminder-time').value;
        const recurring = document.getElementById('event-recurring').checked;
        const recurrencePattern = document.getElementById('event-recurrence-pattern').value;

        // Validation
        let isValid = true;

        if (!title.trim()) {
            document.getElementById('event-title-error').classList.remove('hidden');
            isValid = false;
        } else {
            document.getElementById('event-title-error').classList.add('hidden');
        }

        if (!isValid) {
            return;
        }

        // Combine date and time
        const startDateTime = startTime ? `${startDate}T${startTime}` : startDate;
        const endDateTime = endTime ? `${endDate}T${endTime}` : endDate;

        this.events[eventIndex] = {
            ...this.events[eventIndex],
            title: title.trim(),
            startDate: startDate,
            startTime: startTime,
            endDate: endDate,
            endTime: endTime,
            date: startDate, // For compatibility
            fullStartDateTime: startDateTime,
            fullEndDateTime: endDateTime,
            description: description.trim(),
            category: category,
            color: color,
            reminder: reminderEnabled ? { minutes: parseInt(reminderTime) } : null,
            recurring: recurring ? { pattern: recurrencePattern } : null,
            updatedAt: new Date().toISOString()
        };

        this.saveEvents();
        this.render();
        this.updateStatistics();

        // Close modal
        this.closeEventModal();

        this.showNotification('Acara berhasil diperbarui', 'success');
    },

    deleteEvent(eventId) {
        if (confirm('Apakah Anda yakin ingin menghapus acara ini?')) {
            // For todo events, delete todo
            if (eventId.startsWith('todo-')) {
                const todoId = parseInt(eventId.replace('todo-', ''));
                if (typeof Todo !== 'undefined') {
                    Todo.deleteTodo(todoId);
                }
                return;
            }

            // For other events, remove from calendar
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.render();
            this.updateStatistics();

            this.showNotification('Acara berhasil dihapus', 'success');
        }
    },

    completeTodo(todoId) {
        if (typeof Todo !== 'undefined') {
            Todo.toggleTodo(todoId);
            this.generateEventsFromData();
            this.saveEvents();
            this.render();
        }
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

    updateStatistics() {
        const stats = this.getStatistics();

        // Update today events count
        const todayEventsEl = document.getElementById('calendar-today-events');
        if (todayEventsEl) {
            todayEventsEl.textContent = stats.todayEvents;
        }

        // Update month events count
        const monthEventsEl = document.getElementById('calendar-month-events');
        if (monthEventsEl) {
            monthEventsEl.textContent = stats.monthEvents;
        }

        // Update total events count
        const totalEventsEl = document.getElementById('calendar-total-events');
        if (totalEventsEl) {
            totalEventsEl.textContent = stats.totalEvents;
        }

        // Update event types
        const eventTypesEl = document.getElementById('calendar-event-types');
        if (eventTypesEl) {
            eventTypesEl.innerHTML = `
                <div class="flex justify-between text-sm">
                    <span>Todo:</span>
                    <span class="font-medium">${stats.eventsByType.todo}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Kebiasaan:</span>
                    <span class="font-medium">${stats.eventsByType.habit}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Tujuan:</span>
                    <span class="font-medium">${stats.eventsByType.goal}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Journal:</span>
                    <span class="font-medium">${stats.eventsByType.journal}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Kustom:</span>
                    <span class="font-medium">${stats.eventsByType.custom}</span>
                </div>
            `;
        }
    },

    showNotification(message, type = 'success') {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, type);
        }
    },

    setupDragAndDrop() {
        // Add event listeners to all event items for drag start
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('event-item')) {
                this.draggedEvent = e.target.getAttribute('data-event-id');
                e.target.classList.add('opacity-50');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('event-item')) {
                e.target.classList.remove('opacity-50');
                this.draggedEvent = null;
            }
        });
    },

    moveEventToNewDate(eventId, newDate) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            event.date = newDate;
            event.startDate = newDate;
            this.saveEvents();
            this.render();
            this.showNotification('Acara berhasil dipindahkan', 'success');
        }
    },

    setupSearch() {
        const searchInput = document.getElementById('calendar-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterEvents(e.target.value);
            });
        }

        const categoryFilter = document.getElementById('calendar-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterEventsByCategory(e.target.value);
            });
        }
    },

    filterEvents(searchTerm) {
        // This would implement actual search functionality
        // For now, just update the view to show matching events
        this.render();
    },

    filterEventsByCategory(category) {
        // This would implement category filtering
        // For now, just update the view to show matching events
        this.render();
    },

    exportCalendar() {
        // Export calendar data to JSON
        const dataStr = JSON.stringify(this.events, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `calendar-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showNotification('Kalender berhasil diekspor', 'success');
    },

    importCalendar(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedEvents = JSON.parse(e.target.result);
                this.events = importedEvents;
                this.saveEvents();
                this.render();
                this.updateStatistics();
                this.showNotification('Kalender berhasil diimpor', 'success');
            } catch (error) {
                this.showNotification('Gagal mengimpor kalender', 'error');
            }
        };
        reader.readAsText(file);
    },

    printCalendar() {
        // Create a print-friendly version of the calendar
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Calendar Print</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
                        .calendar-day { border: 1px solid #ccc; padding: 10px; min-height: 100px; }
                        .event-item { margin: 5px 0; padding: 5px; border-radius: 4px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>Calendar - ${new Date(this.currentYear, this.currentMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h1>
                    <div class="calendar-grid">
                        <div><strong>Min</strong></div>
                        <div><strong>Sen</strong></div>
                        <div><strong>Sel</strong></div>
                        <div><strong>Rab</strong></div>
                        <div><strong>Kam</strong></div>
                        <div><strong>Jum</strong></div>
                        <div><strong>Sab</strong></div>
        `);

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            printWindow.document.write('<div></div>');
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = this.getEventsForDate(dateStr);

            printWindow.document.write(`
                <div class="calendar-day">
                    <div><strong>${day}</strong></div>
                    ${dayEvents.map(event => `
                        <div class="event-item" style="background-color: ${event.color}20; border-left: 3px solid ${event.color};">
                            ${event.title}
                        </div>
                    `).join('')}
                </div>
            `);
        }

        printWindow.document.write(`
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    },

    shareCalendar() {
        const email = document.getElementById('share-email').value;
        const permission = document.getElementById('share-permission').value;

        if (!email) {
            this.showNotification('Silakan masukkan email pengguna', 'warning');
            return;
        }

        // Add collaborator
        const collaborator = {
            email: email,
            permission: permission,
            added: new Date().toISOString()
        };

        this.collaborators.push(collaborator);
        Storage.set('calendar-collaborators', this.collaborators);

        // Close modal
        this.closeSharingModal();

        this.showNotification(`Kalender dibagikan ke ${email}`, 'success');
    },

    closeSharingModal() {
        const sharingModal = document.getElementById('calendar-sharing-modal');
        if (sharingModal) {
            sharingModal.classList.add('hidden');
        }
    },

    backupCalendar() {
        // Create backup of calendar data
        const backup = {
            events: this.events,
            collaborators: this.collaborators,
            backupDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const backupFileDefaultName = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', backupFileDefaultName);
        linkElement.click();

        this.showNotification('Kalender berhasil dibackup', 'success');
    },

    restoreCalendar(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);

                if (backup.events) {
                    this.events = backup.events;
                }

                if (backup.collaborators) {
                    this.collaborators = backup.collaborators;
                }

                this.saveEvents();
                Storage.set('calendar-collaborators', this.collaborators);
                this.render();
                this.updateStatistics();
                this.showNotification('Kalender berhasil dipulihkan', 'success');
            } catch (error) {
                this.showNotification('Gagal memulihkan kalender', 'error');
            }
        };
        reader.readAsText(file);
    },

    addAttachmentToEvent(eventId, file) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const attachment = {
            id: `attachment-${Date.now()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            data: null, // In a real implementation, this would be the file data or URL
            uploadedAt: new Date().toISOString()
        };

        // For now, just store basic info about the file
        // In a real implementation, you would upload the file to a server or store it in IndexedDB
        if (!event.attachments) {
            event.attachments = [];
        }

        event.attachments.push(attachment);
        this.saveEvents();
        this.showNotification('Lampiran berhasil ditambahkan', 'success');
    },

    removeAttachmentFromEvent(eventId, attachmentId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        event.attachments = event.attachments.filter(attachment => attachment.id !== attachmentId);
        this.saveEvents();
        this.showNotification('Lampiran berhasil dihapus', 'success');
    },

    getAttachmentsForEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        return event ? event.attachments || [] : [];
    },

    // Synchronization methods
    syncWithExternalCalendar(calendarService) {
        // This would connect to external calendar services like Google Calendar, Outlook, etc.
        // For this implementation, we'll just log that synchronization is happening
        this.showNotification(`Sinkronisasi dengan ${calendarService} sedang berlangsung...`, 'info');

        // In a real implementation, you would:
        // 1. Authenticate with the calendar service
        // 2. Fetch events from the external calendar
        // 3. Merge with local events
        // 4. Handle conflicts
        // 5. Update the UI
    },

    setupSyncIntervals() {
        // Set up periodic synchronization (e.g., every 30 minutes)
        setInterval(() => {
            if (this.shouldSync()) {
                this.syncWithExternalCalendar('default');
            }
        }, 30 * 60 * 1000); // 30 minutes
    },

    shouldSync() {
        // Determine if synchronization should occur
        // For example, check if user is online, if sync is enabled, etc.
        return navigator.onLine && this.syncEnabled !== false;
    },

    initColorSelection() {
        // Set the default selected color when the page loads
        const defaultColor = '#6366f1'; // Default indigo color
        const colorOptions = document.querySelectorAll('[data-color]');

        // Add event listeners to color options
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                document.getElementById('event-color').value = color;

                // Update the color preview for the selected option
                colorOptions.forEach(opt => opt.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500'));
                e.target.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500');
            });
        });

        // Set the default selection
        colorOptions.forEach(option => {
            if (option.getAttribute('data-color') === defaultColor) {
                option.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500');
            } else {
                option.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500');
            }
        });
    }
};