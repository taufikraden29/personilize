// Enhanced journal functionality
const Journal = {
    entries: [],
    filters: {
        mood: 'all',
        dateRange: 'all',
        search: '',
        tags: []
    },
    sorting: {
        field: 'date',
        order: 'desc'
    },
    editor: null,

    init() {
        this.loadEntries();
        this.setupEventListeners();
        this.setupEditor();
        this.setupKeyboardShortcuts();
        this.render();
        this.updateStats();
        this.checkMoodTrends();
    },

    loadEntries() {
        const savedEntries = Storage.get('journal');
        if (savedEntries) {
            this.entries = savedEntries;
        }

        // Migrate old entries to new format if needed
        this.entries = this.entries.map(entry => ({
            ...entry,
            isPrivate: entry.isPrivate || false,
            isFavorite: entry.isFavorite || false,
            weather: entry.weather || null,
            location: entry.location || null,
            activities: entry.activities || [],
            gratitude: entry.gratitude || [],
            goals: entry.goals || [],
            reflections: entry.reflections || '',
            version: entry.version || 1
        }));

        this.saveEntries();
    },

    setupEventListeners() {
        // Save journal button
        const saveBtn = document.getElementById('save-journal');
        const dateInput = document.getElementById('journal-date');

        if (saveBtn && dateInput) {
            saveBtn.addEventListener('click', () => this.saveEntry());
            dateInput.addEventListener('change', () => this.loadEntry());
        }

        // Mood buttons
        const moodBtns = document.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtns.forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-50'));
                btn.classList.add('border-indigo-500', 'bg-indigo-50');
            });
        });

        // Filter controls
        const moodFilter = document.getElementById('mood-filter');
        const searchInput = document.getElementById('journal-search');

        if (moodFilter) {
            moodFilter.addEventListener('change', () => {
                this.setFilter('mood', moodFilter.value);
                this.render();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setFilter('search', e.target.value.toLowerCase());
                this.render();
            });
        }

        // Quick actions
        this.setupQuickActions();
    },

    setupEditor() {
        // Initialize rich text editor for journal content
        const contentTextarea = document.getElementById('journal-content');
        if (contentTextarea) {
            // Add toolbar for formatting
            const toolbar = document.createElement('div');
            toolbar.className = 'flex items-center space-x-2 mb-2 p-2 bg-gray-50 rounded';
            toolbar.innerHTML = `
                <button class="format-btn px-2 py-1 text-sm bg-white rounded hover:bg-gray-100" data-format="bold">
                    <i class="fas fa-bold"></i>
                </button>
                <button class="format-btn px-2 py-1 text-sm bg-white rounded hover:bg-gray-100" data-format="italic">
                    <i class="fas fa-italic"></i>
                </button>
                <button class="format-btn px-2 py-1 text-sm bg-white rounded hover:bg-gray-100" data-format="underline">
                    <i class="fas fa-underline"></i>
                </button>
                <button class="format-btn px-2 py-1 text-sm bg-white rounded hover:bg-gray-100" data-format="list">
                    <i class="fas fa-list"></i>
                </button>
                <button class="format-btn px-2 py-1 text-sm bg-white rounded hover:bg-gray-100" data-format="quote">
                    <i class="fas fa-quote-left"></i>
                </button>
            `;

            contentTextarea.parentNode.insertBefore(toolbar, contentTextarea);

            // Add event listeners to format buttons
            toolbar.querySelectorAll('.format-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.formatText(btn.dataset.format);
                });
            });

            // Auto-save functionality
            let autoSaveTimer;
            contentTextarea.addEventListener('input', () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    this.autoSave();
                }, 2000);
            });
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Ctrl/Cmd + J: New journal
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
                e.preventDefault();
                document.getElementById('journal-date')?.focus();
            }

            // Ctrl/Cmd + S: Save journal
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveEntry();
            }
        });
    },

    setupQuickActions() {
        // Add quick templates
        const templatesBtn = document.getElementById('journal-templates');
        if (templatesBtn) {
            templatesBtn.addEventListener('click', () => {
                this.showTemplatesModal();
            });
        }

        // Add mood tracker
        const moodTrackerBtn = document.getElementById('mood-tracker');
        if (moodTrackerBtn) {
            moodTrackerBtn.addEventListener('click', () => {
                this.showMoodTracker();
            });
        }
    },

    saveEntry() {
        const date = document.getElementById('journal-date');
        const content = document.getElementById('journal-content');
        const tags = document.getElementById('journal-tags');
        const selectedMood = document.querySelector('.mood-btn.border-indigo-500');

        if (!date.value || !content.value.trim()) {
            this.showNotification('Tanggal dan konten harus diisi', 'warning');
            return;
        }

        try {
            const rawContent = content.value.trim();
            const sanitizedContent = Utils.sanitizeHTML(rawContent);

            const entry = {
                date: date.value,
                content: sanitizedContent,
                mood: selectedMood ? selectedMood.dataset.mood : 'neutral',
                tags: tags.value.split(',').map(t => t.trim()).filter(t => t),
                gratitude: this.extractGratitude(sanitizedContent),
                goals: this.extractGoals(sanitizedContent),
                reflections: this.extractReflections(sanitizedContent),
                isPrivate: document.getElementById('journal-private')?.checked || false,
                isFavorite: false,
                weather: this.getCurrentWeather(),
                location: this.getCurrentLocation(),
                activities: this.extractActivities(sanitizedContent),
                wordCount: this.countWords(sanitizedContent),
                readingTime: Math.ceil(this.countWords(sanitizedContent) / 200),
                updatedAt: new Date().toISOString()
            };

            // Validate the entry before saving
            const validation = this.validateEntry(entry);
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }

            const existingIndex = this.entries.findIndex(e => e.date === entry.date);
            if (existingIndex !== -1) {
                entry.createdAt = this.entries[existingIndex].createdAt;
                this.entries[existingIndex] = entry;
            } else {
                entry.createdAt = new Date().toISOString();
                this.entries.unshift(entry);
            }

            this.saveEntries();
            this.render();
            this.updateStats();

            this.showNotification('Journal berhasil disimpan', 'success');

            // Check mood achievements
            this.checkMoodAchievements();

            // Track activity
            this.trackActivity(existingIndex !== -1 ? 'updated' : 'created', entry);
        } catch (error) {
            console.error('Error saving journal entry:', error);
            this.showNotification('Gagal menyimpan journal. Silakan coba lagi.', 'error');
        }
    },

    loadEntry() {
        const date = document.getElementById('journal-date');
        const entry = this.entries.find(e => e.date === date.value);

        if (entry) {
            document.getElementById('journal-content').value = entry.content;
            document.getElementById('journal-tags').value = entry.tags.join(', ');
            document.getElementById('journal-private').checked = entry.isPrivate || false;

            // Set mood button
            const moodBtns = document.querySelectorAll('.mood-btn');
            moodBtns.forEach(btn => {
                btn.classList.remove('border-indigo-500', 'bg-indigo-50');
                if (btn.dataset.mood === entry.mood) {
                    btn.classList.add('border-indigo-500', 'bg-indigo-50');
                }
            });
        } else {
            document.getElementById('journal-content').value = '';
            document.getElementById('journal-tags').value = '';
            document.getElementById('journal-private').checked = false;

            // Reset mood buttons
            const moodBtns = document.querySelectorAll('.mood-btn');
            moodBtns.forEach(btn => {
                btn.classList.remove('border-indigo-500', 'bg-indigo-50');
            });
        }
    },

    deleteEntry(date) {
        if (confirm('Apakah Anda yakin ingin menghapus journal ini?')) {
            this.entries = this.entries.filter(e => e.date !== date);
            this.saveEntries();
            this.render();

            // Clear form if deleted entry was being edited
            const currentDate = document.getElementById('journal-date').value;
            if (currentDate === date) {
                document.getElementById('journal-content').value = '';
                document.getElementById('journal-tags').value = '';
                document.getElementById('journal-private').checked = false;

                const moodBtns = document.querySelectorAll('.mood-btn');
                moodBtns.forEach(btn => {
                    btn.classList.remove('border-indigo-500', 'bg-indigo-50');
                });
            }

            this.showNotification('Journal berhasil dihapus', 'success');
        }
    },

    toggleFavorite(date) {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return;

        entry.isFavorite = !entry.isFavorite;
        entry.updatedAt = new Date().toISOString();

        this.saveEntries();
        this.render();

        this.showNotification(
            entry.isFavorite ? 'Journal ditandai sebagai favorit' : 'Favorit dihapus',
            'success'
        );
    },

    exportEntry(date, format = 'markdown') {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return;

        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
            case 'markdown':
                content = this.convertToMarkdown(entry);
                filename = `journal-${entry.date}.md`;
                mimeType = 'text/markdown';
                break;
            case 'pdf':
                content = this.convertToPDF(entry);
                filename = `journal-${entry.date}.pdf`;
                mimeType = 'application/pdf';
                break;
            case 'txt':
                content = this.convertToText(entry);
                filename = `journal-${entry.date}.txt`;
                mimeType = 'text/plain';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        this.showNotification(`Journal diekspor sebagai ${format}`, 'success');
    },

    setFilter(filterType, value) {
        this.filters[filterType] = value;
    },

    getFilteredEntries() {
        let filtered = [...this.entries];

        // Mood filter
        if (this.filters.mood !== 'all') {
            filtered = filtered.filter(e => e.mood === this.filters.mood);
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
                case 'year':
                    startDate = new Date(today);
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(e => new Date(e.date) >= startDate);
            }
        }

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(e =>
                e.content.toLowerCase().includes(this.filters.search) ||
                e.reflections.toLowerCase().includes(this.filters.search) ||
                e.tags.some(tag => tag.toLowerCase().includes(this.filters.search))
            );
        }

        // Tags filter
        if (this.filters.tags.length > 0) {
            filtered = filtered.filter(e =>
                this.filters.tags.some(tag => e.tags.includes(tag))
            );
        }

        // Sort entries
        filtered.sort((a, b) => {
            let aValue = a[this.sorting.field];
            let bValue = b[this.sorting.field];

            if (this.sorting.order === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    },

    render() {
        const journalList = document.getElementById('journal-list');
        if (!journalList) return;

        const filteredEntries = this.getFilteredEntries();

        // Show loading state
        journalList.innerHTML = '<div class="loading h-40 rounded-lg mb-4"></div>'.repeat(3);

        // Simulate loading delay for better UX
        setTimeout(() => {
            if (filteredEntries.length === 0) {
                journalList.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-book text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Tidak ada journal ditemukan</p>
                        <button class="mt-4 text-indigo-600 hover:text-indigo-800" onclick="Journal.clearFilters()">
                            Hapus filter
                        </button>
                    </div>
                `;
                return;
            }

            journalList.innerHTML = '';

            filteredEntries.forEach(entry => {
                const entryEl = this.createJournalElement(entry);
                journalList.appendChild(entryEl);
            });

            // Update stats
            this.updateFilterStats(filteredEntries);
        }, 300);
    },

    createJournalElement(entry) {
        const entryEl = document.createElement('div');
        entryEl.className = `journal-entry ${entry.isFavorite ? 'favorite' : ''} ${entry.isPrivate ? 'private' : ''}`;
        entryEl.dataset.date = entry.date;

        const moodEmojis = {
            'very-happy': '😊',
            'happy': '🙂',
            'neutral': '😐',
            'sad': '😢',
            'angry': '😠'
        };

        const dateObj = new Date(entry.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const excerpt = this.getExcerpt(entry.content, 150);

        entryEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex-grow">
                    <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                        ${entry.isFavorite ? '<i class="fas fa-star text-yellow-500 mr-2"></i>' : ''}
                        ${entry.isPrivate ? '<i class="fas fa-lock text-gray-400 mr-2"></i>' : ''}
                        ${formattedDate}
                    </h3>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="text-2xl">${moodEmojis[entry.mood]}</span>
                        ${entry.weather ? `<span class="text-sm text-gray-500"><i class="fas fa-cloud-sun mr-1"></i>${entry.weather}</span>` : ''}
                        ${entry.location ? `<span class="text-sm text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>${entry.location}</span>` : ''}
                        <span class="text-sm text-gray-500">${entry.wordCount} kata • ${entry.readingTime} menit baca</span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="favorite-btn text-yellow-500 hover:text-yellow-700" data-date="${entry.date}" title="Favorite">
                        <i class="fas fa-star${entry.isFavorite ? '' : '-o'}"></i>
                    </button>
                    <button class="edit-journal text-blue-500 hover:text-blue-700" data-date="${entry.date}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="export-journal text-green-500 hover:text-green-700" data-date="${entry.date}" title="Export">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="delete-journal text-red-500 hover:text-red-700" data-date="${entry.date}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${entry.gratitude && entry.gratitude.length > 0 ? `
                <div class="mb-3 p-2 bg-yellow-50 rounded">
                    <p class="text-sm font-semibold text-yellow-800 mb-1">Bersyukur untuk:</p>
                    <ul class="text-sm text-yellow-700">
                        ${entry.gratitude.map(item => `<li>• ${item}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${entry.goals && entry.goals.length > 0 ? `
                <div class="mb-3 p-2 bg-blue-50 rounded">
                    <p class="text-sm font-semibold text-blue-800 mb-1">Tujuan hari ini:</p>
                    <ul class="text-sm text-blue-700">
                        ${entry.goals.map(goal => `<li>• ${goal}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="mb-3">
                <p class="text-gray-600 line-clamp-3">${excerpt}</p>
            </div>
            
            ${entry.reflections ? `
                <div class="mb-3 p-2 bg-purple-50 rounded">
                    <p class="text-sm font-semibold text-purple-800 mb-1">Refleksi:</p>
                    <p class="text-sm text-purple-700">${entry.reflections}</p>
                </div>
            ` : ''}
            
            ${entry.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-3">
                    ${entry.tags.map(tag => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full cursor-pointer hover:bg-gray-200"
                              onclick="Journal.filterByTag('${tag}')">
                            #${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="flex justify-between items-center text-sm text-gray-500">
                <span>Diperbarui: ${new Date(entry.updatedAt).toLocaleString('id-ID')}</span>
                <div class="flex space-x-2">
                    <button class="text-indigo-600 hover:text-indigo-800" onclick="Journal.expandEntry('${entry.date}')">
                        Baca Selengkapnya
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachJournalEventListeners(entryEl);

        return entryEl;
    },

    expandEntry(date) {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return;

        // Create expanded view modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Journal - ${entry.date}</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="flex items-center space-x-4">
                        <span class="text-3xl">${this.getMoodEmoji(entry.mood)}</span>
                        ${entry.weather ? `<span class="text-lg"><i class="fas fa-cloud-sun mr-2"></i>${entry.weather}</span>` : ''}
                        ${entry.location ? `<span class="text-lg"><i class="fas fa-map-marker-alt mr-2"></i>${entry.location}</span>` : ''}
                    </div>
                    
                    ${entry.gratitude && entry.gratitude.length > 0 ? `
                        <div class="p-4 bg-yellow-50 rounded">
                            <h3 class="font-semibold text-yellow-800 mb-2">Bersyukur untuk:</h3>
                            <ul class="space-y-1">
                                ${entry.gratitude.map(item => `<li class="text-yellow-700">• ${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${entry.goals && entry.goals.length > 0 ? `
                        <div class="p-4 bg-blue-50 rounded">
                            <h3 class="font-semibold text-blue-800 mb-2">Tujuan hari ini:</h3>
                            <ul class="space-y-1">
                                ${entry.goals.map(goal => `<li class="text-blue-700">• ${goal}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="prose max-w-none">
                        ${this.formatContent(entry.content)}
                    </div>
                    
                    ${entry.reflections ? `
                        <div class="p-4 bg-purple-50 rounded">
                            <h3 class="font-semibold text-purple-800 mb-2">Refleksi:</h3>
                            <p class="text-purple-700">${entry.reflections}</p>
                        </div>
                    ` : ''}
                    
                    ${entry.activities && entry.activities.length > 0 ? `
                        <div class="p-4 bg-green-50 rounded">
                            <h3 class="font-semibold text-green-800 mb-2">Aktivitas:</h3>
                            <div class="flex flex-wrap gap-2">
                                ${entry.activities.map(activity => `
                                    <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                        ${activity}
                                    </span>
                                `).join('')}
                            </div>
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

    showTemplatesModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Template Journal</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this.getTemplates().map(template => `
                        <div class="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 template-card" data-template="${template.name}">
                            <h3 class="font-semibold mb-2">${template.name}</h3>
                            <p class="text-sm text-gray-600 mb-2">${template.description}</p>
                            <div class="text-xs text-gray-500">
                                ${template.mood ? `Mood: ${template.mood} • ` : ''}
                                ${template.tags.length > 0 ? `Tags: ${template.tags.join(', ')}` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateName = card.dataset.template;
                const template = this.getTemplates().find(t => t.name === templateName);
                if (template) {
                    this.applyTemplate(template);
                    modal.remove();
                }
            });
        });

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    },

    showMoodTracker() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Pelacak Mood</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <canvas id="mood-chart" width="800" height="400"></canvas>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${this.getMoodStatistics().map(stat => `
                        <div class="text-center p-4 bg-gray-50 rounded">
                            <div class="text-2xl mb-1">${stat.emoji}</div>
                            <div class="font-semibold">${stat.count} hari</div>
                            <div class="text-sm text-gray-600">${stat.percentage}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);

        // Draw mood chart
        this.drawMoodChart(modal.querySelector('#mood-chart'));
    },

    // Helper methods
    extractGratitude(content) {
        const gratitudeRegex = /bersyukur untuk[:\s]*([^.\n]+)/gi;
        const matches = content.match(gratitudeRegex);
        return matches ? matches.map(match => match.replace(/bersyukur untuk[:\s]*/, '').trim()) : [];
    },

    extractGoals(content) {
        const goalsRegex = /tujuan[:\s]*([^.\n]+)/gi;
        const matches = content.match(goalsRegex);
        return matches ? matches.map(match => match.replace(/tujuan[:\s]*/, '').trim()) : [];
    },

    extractReflections(content) {
        const reflectionsRegex = /refleksi[:\s]*([^.\n]+)/gi;
        const match = content.match(reflectionsRegex);
        return match ? match.replace(/refleksi[:\s]*/, '').trim() : '';
    },

    extractActivities(content) {
        const activitiesRegex = /aktivitas[:\s]*([^.\n]+)/gi;
        const matches = content.match(activitiesRegex);
        return matches ? matches.map(match => match.replace(/aktivitas[:\s]*/, '').trim()) : [];
    },

    countWords(text) {
        return text.trim().split(/\s+/).length;
    },

    getExcerpt(content, maxLength) {
        if (!content) return '';

        // Remove HTML tags for excerpt
        const text = content.replace(/<[^>]*>/g, '');

        if (text.length <= maxLength) return text;

        return text.substring(0, maxLength).trim() + '...';
    },

    getMoodEmoji(mood) {
        const moodEmojis = {
            'very-happy': '😊',
            'happy': '🙂',
            'neutral': '😐',
            'sad': '😢',
            'angry': '😠'
        };

        return moodEmojis[mood] || '😐';
    },

    formatContent(content) {
        // Convert plain text to formatted HTML
        let formatted = content;

        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');

        // Convert hashtags to styled spans
        const hashtagRegex = /#(\w+)/g;
        formatted = formatted.replace(hashtagRegex, '<span class="text-indigo-600 font-semibold">#$1</span>');

        // Convert line breaks to <br>
        formatted = formatted.replace(/\n/g, '<br>');

        // Convert **bold** to <strong>
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert *italic* to <em>
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

        return formatted;
    },

    convertToMarkdown(entry) {
        let markdown = `# ${entry.date}\n\n`;

        if (entry.mood) {
            const moodEmojis = {
                'very-happy': '😊',
                'happy': '🙂',
                'neutral': '😐',
                'sad': '😢',
                'angry': '😠'
            };
            markdown += `**Mood:** ${moodEmojis[entry.mood]} ${entry.mood}\n\n`;
        }

        if (entry.weather) {
            markdown += `**Cuaca:** ${entry.weather}\n\n`;
        }

        if (entry.location) {
            markdown += `**Lokasi:** ${entry.location}\n\n`;
        }

        if (entry.gratitude && entry.gratitude.length > 0) {
            markdown += `## Bersyukur untuk:\n\n`;
            entry.gratitude.forEach(item => {
                markdown += `- ${item}\n`;
            });
            markdown += '\n';
        }

        if (entry.goals && entry.goals.length > 0) {
            markdown += `## Tujuan hari ini:\n\n`;
            entry.goals.forEach(goal => {
                markdown += `- ${goal}\n`;
            });
            markdown += '\n';
        }

        if (entry.activities && entry.activities.length > 0) {
            markdown += `## Aktivitas:\n\n`;
            entry.activities.forEach(activity => {
                markdown += `- ${activity}\n`;
            });
            markdown += '\n';
        }

        if (entry.reflections) {
            markdown += `## Refleksi:\n\n${entry.reflections}\n\n`;
        }

        markdown += `## Catatan:\n\n${entry.content}\n\n`;

        if (entry.tags && entry.tags.length > 0) {
            markdown += `**Tags:** ${entry.tags.map(tag => `#${tag}`).join(' ')}\n`;
        }

        if (entry.wordCount) {
            markdown += `\n**Statistik:** ${entry.wordCount} kata, ${entry.readingTime} menit baca`;
        }

        return markdown;
    },

    convertToPDF(entry) {
        // This would require a PDF library like jsPDF
        // For now, return formatted HTML that can be printed
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Journal - ${entry.date}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                    h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
                    h2 { color: #666; margin-top: 30px; }
                    .mood { font-size: 24px; margin: 10px 0; }
                    .metadata { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 20px 0; }
                    .tags { margin-top: 20px; }
                    .tag { display: inline-block; background: #e0e0e0; padding: 3px 8px; border-radius: 15px; margin: 2px; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>Journal - ${entry.date}</h1>
                
                ${entry.mood ? `<div class="mood">Mood: ${this.getMoodEmoji(entry.mood)} ${entry.mood}</div>` : ''}
                
                <div class="metadata">
                    ${entry.weather ? `<p>Cuaca: ${entry.weather}</p>` : ''}
                    ${entry.location ? `<p>Lokasi: ${entry.location}</p>` : ''}
                    <p>Kata: ${entry.wordCount || 0}</p>
                    <p>Waktu baca: ${entry.readingTime || 0} menit</p>
                </div>
                
                ${entry.gratitude && entry.gratitude.length > 0 ? `
                    <h2>Bersyukur untuk:</h2>
                    <ul>
                        ${entry.gratitude.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                ` : ''}
                
                ${entry.goals && entry.goals.length > 0 ? `
                    <h2>Tujuan hari ini:</h2>
                    <ul>
                        ${entry.goals.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                ` : ''}
                
                ${entry.activities && entry.activities.length > 0 ? `
                    <h2>Aktivitas:</h2>
                    <ul>
                        ${entry.activities.map(activity => `<li>${activity}</li>`).join('')}
                    </ul>
                ` : ''}
                
                ${entry.reflections ? `
                    <h2>Refleksi:</h2>
                    <p>${entry.reflections}</p>
                ` : ''}
                
                <h2>Catatan:</h2>
                <div>${this.formatContent(entry.content)}</div>
                
                ${entry.tags && entry.tags.length > 0 ? `
                    <div class="tags">
                        ${entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </body>
            </html>
        `;

        return html;
    },

    convertToText(entry) {
        let text = `Journal - ${entry.date}\n`;
        text += '='.repeat(50) + '\n\n';

        if (entry.mood) {
            text += `Mood: ${entry.mood}\n`;
        }

        if (entry.weather) {
            text += `Cuaca: ${entry.weather}\n`;
        }

        if (entry.location) {
            text += `Lokasi: ${entry.location}\n`;
        }

        text += '\n';

        if (entry.gratitude && entry.gratitude.length > 0) {
            text += 'Bersyukur untuk:\n';
            entry.gratitude.forEach(item => {
                text += `- ${item}\n`;
            });
            text += '\n';
        }

        if (entry.goals && entry.goals.length > 0) {
            text += 'Tujuan hari ini:\n';
            entry.goals.forEach(goal => {
                text += `- ${goal}\n`;
            });
            text += '\n';
        }

        if (entry.activities && entry.activities.length > 0) {
            text += 'Aktivitas:\n';
            entry.activities.forEach(activity => {
                text += `- ${activity}\n`;
            });
            text += '\n';
        }

        if (entry.reflections) {
            text += 'Refleksi:\n';
            text += entry.reflections + '\n\n';
        }

        text += 'Catatan:\n';
        text += entry.content.replace(/<[^>]*>/g, '') + '\n\n';

        if (entry.tags && entry.tags.length > 0) {
            text += `Tags: ${entry.tags.join(', ')}\n`;
        }

        if (entry.wordCount) {
            text += `\nStatistik: ${entry.wordCount} kata, ${entry.readingTime} menit baca`;
        }

        return text;
    },

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    },

    getCurrentWeather() {
        // This would integrate with a weather API
        // For now, return a placeholder or use browser geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // In a real implementation, you would use coordinates to fetch weather
                    return 'Cerah Berawan';
                },
                (error) => {
                    console.error('Error getting location:', error);
                    return null;
                }
            );
        }
        return null;
    },

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // In a real implementation, you would use reverse geocoding
                    return `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`;
                },
                (error) => {
                    console.error('Error getting location:', error);
                    return null;
                }
            );
        }
        return null;
    },

    clearFilters() {
        this.filters = {
            mood: 'all',
            dateRange: 'all',
            search: '',
            tags: []
        };

        // Reset UI
        document.getElementById('journal-search').value = '';
        document.getElementById('mood-filter').value = 'all';

        this.render();
    },

    updateFilterStats(filteredEntries) {
        const statsEl = document.getElementById('journal-stats');
        if (!statsEl) return;

        const total = this.entries.length;
        const filtered = filteredEntries.length;
        const avgWordCount = filtered.length > 0 ?
            Math.round(filtered.reduce((sum, e) => sum + (e.wordCount || 0), 0) / filtered.length) : 0;

        statsEl.innerHTML = `
            <span class="text-sm text-gray-500">
                Menampilkan ${filtered} dari ${total} journal, rata-rata ${avgWordCount} kata
            </span>
        `;
    },

    saveEntries() {
        try {
            Storage.set('journal', this.entries);
        } catch (error) {
            console.error('Error saving journal entries:', error);
            this.showNotification('Gagal menyimpan journal. Data mungkin tidak disimpan secara permanen.', 'error');
        }
    },

    updateStats() {
        const totalEntriesEl = document.getElementById('total-journal-entries');
        if (totalEntriesEl) {
            totalEntriesEl.textContent = this.entries.length;
        }
    },

    checkMoodAchievements() {
        const moodData = this.getMoodData(30);
        const consecutiveHappyDays = this.getConsecutiveHappyDays();

        const data = {
            totalJournalEntries: this.entries.length,
            journalStreak: consecutiveHappyDays,
            positiveMoodDays: moodData['very-happy'] + moodData['happy']
        };

        Achievements.checkAchievements(data);
    },

    checkMoodTrends() {
        const moodData = this.getMoodData(30);
        const trend = this.calculateMoodTrend(moodData);

        // Update mood trend display if it exists
        const trendEl = document.getElementById('mood-trend');
        if (trendEl) {
            const trendEmoji = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
            trendEl.innerHTML = `Tren mood: ${trendEmoji} ${trend > 0 ? 'Membaik' : trend < 0 ? 'Memburuk' : 'Stabil'}`;
        }
    },

    getMoodData(days = 30) {
        const data = {
            'very-happy': 0,
            'happy': 0,
            'neutral': 0,
            'sad': 0,
            'angry': 0
        };

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        this.entries
            .filter(entry => entry.date >= cutoffDateStr)
            .forEach(entry => {
                if (data.hasOwnProperty(entry.mood)) {
                    data[entry.mood]++;
                }
            });

        return data;
    },

    getConsecutiveHappyDays() {
        const sortedEntries = [...this.entries].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let consecutiveDays = 0;
        const happyMoods = ['very-happy', 'happy'];

        for (let i = 0; i < sortedEntries.length; i++) {
            if (happyMoods.includes(sortedEntries[i].mood)) {
                consecutiveDays++;
            } else {
                break;
            }
        }

        return consecutiveDays;
    },

    calculateMoodTrend(moodData) {
        // Simple trend calculation based on happy vs sad moods
        const positive = moodData['very-happy'] + moodData['happy'];
        const negative = moodData['sad'] + moodData['angry'];

        return positive - negative;
    },

    getTemplates() {
        return [
            {
                name: 'Hari Produktif',
                description: 'Template untuk mencatat hari yang produktif',
                mood: 'happy',
                tags: ['produktif', 'kerja'],
                content: '## Tujuan Hari Ini\n\n- [ ] Tujuan 1\n- [ ] Tujuan 2\n- [ ] Tujuan 3\n\n## Bersyukur\n\n- Hal yang saya syukuri hari ini:\n\n## Refleksi\n\n- Apa yang berhasil hari ini?\n- Apa yang bisa diperbaiki?\n\n## Aktivitas\n\n- Aktivitas 1\n- Aktivitas 2'
            },
            {
                name: 'Morning Pages',
                description: 'Template untuk menulis pagi',
                mood: 'neutral',
                tags: ['pagi', 'refleksi'],
                content: '## Hari Ini\n\nTanggal: [isi tanggal]\nCuaca: [isi cuaca]\n\n## Perasaan Pagi\n\nBagaimana perasaan saya saat bangun:\n\n## Apa yang ada di pikiran?\n\n- Pikiran 1\n- Pikiran 2\n- Pikiran 3\n\n## Gratitude\n\nTiga hal yang saya syukuri:\n1. \n2. \n3. \n\n## Intensi Hari Ini\n\nBagaimana saya ingin hari ini berjalan:\n\n'
            },
            {
                name: 'Evening Reflection',
                description: 'Template untuk refleksi malam',
                mood: 'neutral',
                tags: ['malam', 'refleksi'],
                content: '## Refleksi Hari [isi tanggal]\n\n## Highlight Hari Ini\n\n- Hal terbaik yang terjadi hari ini:\n- Hal yang membuat saya bahagia:\n\n## Challenges\n\n- Tantangan yang dihadapi:\n- Bagaimana saya mengatasinya:\n\n## Pembelajaran\n\n- Apa yang saya pelajari hari ini?\n- Hal yang bisa saya lakukan lebih baik besok?\n\n## Gratitude\n\nTiga hal yang saya syukuri:\n1. \n2. \n3. \n\n'
            },
            {
                name: 'Gratitude Journal',
                description: 'Template khusus untuk bersyukur',
                mood: 'very-happy',
                tags: ['gratitude', 'bersyukur'],
                content: '## Bersyukur Hari Ini\n\nTanggal: [isi tanggal]\n\n## Orang\n\n1. [Nama orang] - [Alasan bersyukur]\n2. [Nama orang] - [Alasan bersyukur]\n3. [Nama orang] - [Alasan bersyukur]\n\n## Pengalaman\n\n1. [Pengalaman] - [Alasan bersyukur]\n2. [Pengalaman] - [Alasan bersyukur]\n3. [Pengalaman] - [Alasan bersyukur]\n\n## Hal Kecil\n\n1. [Hal kecil] - [Alasan bersyukur]\n2. [Hal kecil] - [Alasan bersyukur]\n3. [Hal kecil] - [Alasan bersyukur]\n\n## Diri Sendiri\n\n1. [Kualitas diri] - [Alasan bersyukur]\n2. [Kemampuan] - [Alasan bersyukur]\n3. [Pencapaian] - [Alasan bersyukur]\n\n'
            },
            {
                name: 'Goal Setting',
                description: 'Template untuk menetapkan tujuan',
                mood: 'happy',
                tags: ['tujuan', 'goal'],
                content: '## Tujuan [periode waktu]\n\n## Tujuan Utama\n\n[Tujuan utama periode ini]\n\n## Mengapa Ini Penting?\n\n[Alasan mengapa tujuan ini penting]\n\n## Target Spesifik\n\n- Target 1: [target spesifik]\n- Target 2: [target spesifik]\n- Target 3: [target spesifik]\n\n## Langkah-Langkah\n\n1. [Langkah 1]\n2. [Langkah 2]\n3. [Langkah 3]\n\n## Tantangan & Solusi\n\n**Tantangan:**\n- [Tantangan 1]\n- [Tantangan 2]\n\n**Solusi:**\n- [Solusi 1]\n- [Solusi 2]\n\n## Metric Keberhasilan\n\n- Bagaimana saya mengukur keberhasilan?\n- Target minimum untuk dianggap berhasil:\n\n## Reward\n\n[Reward jika berhasil mencapai tujuan]\n\n'
            }
        ];
    },

    applyTemplate(template) {
        const today = new Date().toISOString().split('T')[0];

        // Set today's date
        document.getElementById('journal-date').value = today;

        // Set mood
        const moodBtns = document.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50');
            if (btn.dataset.mood === template.mood) {
                btn.classList.add('border-indigo-500', 'bg-indigo-50');
            }
        });

        // Set content
        document.getElementById('journal-content').value = template.content;

        // Set tags
        document.getElementById('journal-tags').value = template.tags.join(', ');

        // Focus on content
        document.getElementById('journal-content').focus();

        this.showNotification(`Template "${template.name}" diterapkan`, 'success');
    },

    drawMoodChart(canvas) {
        if (!canvas) return;

        const moodData = this.getMoodData(30);
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Chart settings
        const chartWidth = canvas.width - 60;
        const chartHeight = canvas.height - 60;
        const barWidth = chartWidth / 5;
        const maxValue = Math.max(...Object.values(moodData));

        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, chartHeight + 20);
        ctx.lineTo(chartWidth + 40, chartHeight + 20);
        ctx.stroke();

        // Draw bars
        const moods = ['very-happy', 'happy', 'neutral', 'sad', 'angry'];
        const colors = ['#10b981', '#3b82f6', '#6b7280', '#f59e0b', '#ef4444'];
        const labels = ['Sangat\nBahagia', 'Bahagia', 'Netral', 'Sedih', 'Marah'];

        moods.forEach((mood, index) => {
            const value = moodData[mood];
            const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
            const x = 40 + (index * barWidth) + (barWidth * 0.1);
            const y = chartHeight + 20 - barHeight;

            // Draw bar
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);

            // Draw value
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + (barWidth * 0.4), y - 5);

            // Draw label
            ctx.fillText(labels[index], x + (barWidth * 0.4), chartHeight + 35);
        });

        // Draw title
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Distribusi Mood 30 Hari Terakhir', canvas.width / 2, 15);
    },

    autoSave() {
        const content = document.getElementById('journal-content');
        const date = document.getElementById('journal-date');

        if (!content.value || !date.value) return;

        const draft = {
            date: date.value,
            content: content.value,
            tags: document.getElementById('journal-tags').value.split(',').map(t => t.trim()).filter(t => t),
            mood: document.querySelector('.mood-btn.border-indigo-500')?.dataset.mood || 'neutral',
            autoSave: true,
            savedAt: new Date().toISOString()
        };

        Storage.set('journal-draft', draft);
    },

    loadAutoSave() {
        const draft = Storage.get('journal-draft');
        if (!draft || !draft.autoSave) return;

        // Check if draft is from today
        const today = new Date().toISOString().split('T')[0];
        if (draft.date !== today) return;

        // Ask user if they want to restore draft
        if (confirm('Ditemukan draft journal hari ini. Apakah Anda ingin memulihkannya?')) {
            document.getElementById('journal-date').value = draft.date;
            document.getElementById('journal-content').value = draft.content;
            document.getElementById('journal-tags').value = draft.tags.join(', ');

            // Set mood
            const moodBtns = document.querySelectorAll('.mood-btn');
            moodBtns.forEach(btn => {
                btn.classList.remove('border-indigo-500', 'bg-indigo-50');
                if (btn.dataset.mood === draft.mood) {
                    btn.classList.add('border-indigo-500', 'bg-indigo-50');
                }
            });

            // Clear draft
            Storage.remove('journal-draft');

            this.showNotification('Draft berhasil dipulihkan', 'success');
        }
    },

    getStatistics() {
        const totalEntries = this.entries.length;
        const avgWordCount = totalEntries > 0 ?
            Math.round(this.entries.reduce((sum, e) => sum + (e.wordCount || 0), 0) / totalEntries) : 0;

        const moodData = this.getMoodData();
        const mostCommonMood = Object.keys(moodData).reduce((a, b) =>
            moodData[a] > moodData[b] ? a : b
            , 'neutral');

        const streak = this.getConsecutiveHappyDays();

        return {
            totalEntries,
            avgWordCount,
            mostCommonMood,
            currentStreak: streak,
            longestStreak: Math.max(...this.entries.map(e => this.getEntryStreak(e.date)), 0)
        };
    },

    getEntryStreak(date) {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return 0;

        const happyMoods = ['very-happy', 'happy'];
        if (!happyMoods.includes(entry.mood)) return 0;

        // Check consecutive happy days before this entry
        const sortedEntries = [...this.entries]
            .filter(e => happyMoods.includes(e.mood))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const entryIndex = sortedEntries.findIndex(e => e.date === date);
        if (entryIndex === -1) return 0;

        let streak = 1;
        const entryDate = new Date(date);

        for (let i = entryIndex - 1; i >= 0; i--) {
            const prevDate = new Date(sortedEntries[i].date);
            const daysDiff = Math.floor((entryDate - prevDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    exportAllEntries(format = 'json') {
        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
            case 'json':
                content = JSON.stringify(this.entries, null, 2);
                filename = `journal-entries-${new Date().toISOString().slice(0, 10)}.json`;
                mimeType = 'application/json';
                break;
            case 'csv':
                content = this.convertToCSV();
                filename = `journal-entries-${new Date().toISOString().slice(0, 10)}.csv`;
                mimeType = 'text/csv';
                break;
            case 'markdown':
                content = this.entries.map(entry => this.convertToMarkdown(entry)).join('\n\n---\n\n');
                filename = `journal-entries-${new Date().toISOString().slice(0, 10)}.md`;
                mimeType = 'text/markdown';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        this.showNotification(`Semua journal diekspor sebagai ${format}`, 'success');
    },

    convertToCSV() {
        const headers = ['Date', 'Mood', 'Content', 'Tags', 'Word Count', 'Reading Time'];
        const rows = this.entries.map(entry => [
            entry.date,
            entry.mood,
            `"${entry.content.replace(/"/g, '""')}"`,
            `"${entry.tags.join('; ')}"`,
            entry.wordCount || 0,
            entry.readingTime || 0
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    trackActivity(action, entry) {
        const activity = {
            type: 'journal',
            action: action,
            entryDate: entry.date,
            entryMood: entry.mood,
            wordCount: entry.wordCount,
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
    attachJournalEventListeners(container) {
        const favoriteBtns = container.querySelectorAll('.favorite-btn');
        const editBtns = container.querySelectorAll('.edit-journal');
        const exportBtns = container.querySelectorAll('.export-journal');
        const deleteBtns = container.querySelectorAll('.delete-journal');

        favoriteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleFavorite(btn.dataset.date);
            });
        });

        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadEntry(btn.dataset.date);
                document.getElementById('journal-date').focus();
            });
        });

        exportBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportEntry(btn.dataset.date);
            });
        });

        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteEntry(btn.dataset.date);
            });
        });
    },

    filterByTag(tag) {
        this.filters.tags = [tag];
        this.render();
    },

    // Clean up resources to prevent memory leaks
    destroy() {
        // Clear any active intervals or timeouts if present
        // Remove any references to DOM elements
        // Cancel any pending auto-save timers
        // The editor reference was already set to null in the original file
    },

    // Validate journal entry input data
    validateEntry(entry) {
        if (!entry || typeof entry !== 'object') {
            return { valid: false, message: 'Data journal tidak valid' };
        }

        if (!entry.date || typeof entry.date !== 'string' || entry.date.length === 0) {
            return { valid: false, message: 'Tanggal journal harus diisi' };
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(entry.date)) {
            return { valid: false, message: 'Format tanggal tidak valid (harus YYYY-MM-DD)' };
        }

        if (!entry.content || typeof entry.content !== 'string' || entry.content.trim().length === 0) {
            return { valid: false, message: 'Konten journal tidak boleh kosong' };
        }

        if (entry.content.length > 10000) {
            return { valid: false, message: 'Konten journal terlalu panjang (maksimal 10000 karakter)' };
        }

        if (entry.mood && !['very-happy', 'happy', 'neutral', 'sad', 'angry'].includes(entry.mood)) {
            return { valid: false, message: 'Mood tidak valid' };
        }

        if (entry.tags && Array.isArray(entry.tags)) {
            for (let i = 0; i < entry.tags.length; i++) {
                const tag = entry.tags[i];
                if (typeof tag !== 'string' || tag.trim().length === 0) {
                    return { valid: false, message: `Tag ke-${i} tidak valid: tag tidak boleh kosong` };
                }
                if (tag.length > 30) {
                    return { valid: false, message: `Tag ke-${i} terlalu panjang (maksimal 30 karakter)` };
                }
            }
        }

        if (entry.wordCount && typeof entry.wordCount !== 'number') {
            return { valid: false, message: 'Jumlah kata harus berupa angka' };
        }

        return { valid: true };
    }
};