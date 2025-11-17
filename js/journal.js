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
        this.setupFilters();
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
        const privateToggle = document.getElementById('journal-private');

        if (saveBtn && dateInput) {
            saveBtn.addEventListener('click', () => this.saveEntry());
            dateInput.addEventListener('change', () => this.loadEntry());
        }

        // Private toggle
        if (privateToggle) {
            privateToggle.addEventListener('change', () => {
                if (privateToggle.checked) {
                    this.showNotification('Entri ini akan disimpan sebagai privat', 'info');
                }
            });
        }

        // Calendar view for date selection
        this.setupCalendarView();

        // Mood buttons
        const moodBtns = document.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtns.forEach(b => {
                    b.classList.remove('border-indigo-500', 'bg-indigo-50', 'ring-2', 'ring-indigo-500');
                    b.classList.add('border-gray-300', 'hover:border-indigo-500');
                });
                btn.classList.remove('border-gray-300', 'hover:border-indigo-500');
                btn.classList.add('border-indigo-500', 'bg-indigo-50', 'ring-2', 'ring-indigo-500');
            });
        });

        // Filter controls
        const moodFilter = document.getElementById('mood-filter');
        const dateRangeFilter = document.getElementById('date-range-filter');
        const searchInput = document.getElementById('journal-search');
        const showFavoritesToggle = document.getElementById('show-favorites-toggle');
        const showPrivateToggle = document.getElementById('show-private-toggle');

        if (moodFilter) {
            moodFilter.addEventListener('change', () => {
                this.setFilter('mood', moodFilter.value);
                this.render();
            });
        }

        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', () => {
                this.setFilter('dateRange', dateRangeFilter.value);
                this.render();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setFilter('search', e.target.value.toLowerCase());
                this.render();
            });
        }

        if (showFavoritesToggle) {
            showFavoritesToggle.addEventListener('change', () => {
                this.setFilter('showFavorites', showFavoritesToggle.checked);
                this.render();
            });
        }

        if (showPrivateToggle) {
            showPrivateToggle.addEventListener('change', () => {
                this.setFilter('showPrivate', showPrivateToggle.checked);
                this.render();
            });
        }

        // Quick actions
        this.setupQuickActions();
    },

    setupCalendarView() {
        // This method would implement a calendar view for date selection
        // For now, we'll just ensure the date input has proper attributes
        const dateInput = document.getElementById('journal-date');
        if (dateInput) {
            // Set min and max dates for the date input
            const today = new Date().toISOString().split('T')[0];
            dateInput.max = today;
        }
    },

    setupEditor() {
        // Initialize rich text editor for journal content
        const contentTextarea = document.getElementById('journal-content');
        if (contentTextarea) {
            // Replace textarea with contenteditable div for rich text
            const contentDiv = document.createElement('div');
            contentDiv.id = 'journal-content-editor';
            contentDiv.contentEditable = true;
            contentDiv.className = 'w-full min-h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';
            contentDiv.placeholder = 'Apa yang terjadi hari ini?';

            // Add toolbar for formatting
            const toolbar = document.createElement('div');
            toolbar.className = 'flex flex-wrap items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200';
            toolbar.innerHTML = `
                <div class="flex space-x-1">
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="bold" title="Bold">
                        <i class="fas fa-bold"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="italic" title="Italic">
                        <i class="fas fa-italic"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="underline" title="Underline">
                        <i class="fas fa-underline"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="strikethrough" title="Strikethrough">
                        <i class="fas fa-strikethrough"></i>
                    </button>
                </div>
                <div class="flex space-x-1">
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="list" title="Bullet List">
                        <i class="fas fa-list"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="numbered-list" title="Numbered List">
                        <i class="fas fa-list-ol"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="quote" title="Quote">
                        <i class="fas fa-quote-left"></i>
                    </button>
                </div>
                <div class="flex space-x-1">
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="link" title="Insert Link">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="image" title="Insert Image">
                        <i class="fas fa-image"></i>
                    </button>
                    <button class="format-btn p-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-300" data-format="clear" title="Clear Formatting">
                        <i class="fas fa-eraser"></i>
                    </button>
                </div>
            `;

            // Insert the toolbar and content editor
            contentTextarea.parentNode.insertBefore(toolbar, contentTextarea);
            contentTextarea.parentNode.insertBefore(contentDiv, contentTextarea);

            // Hide the original textarea and use the contentDiv instead
            contentTextarea.style.display = 'none';

            // Add event listeners to format buttons
            toolbar.querySelectorAll('.format-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.formatText(btn.dataset.format, contentDiv);
                });
            });

            // Auto-save functionality
            let autoSaveTimer;
            contentDiv.addEventListener('input', () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    this.autoSave();
                }, 2000);
            });
        }
    },

    formatText(format, editor) {
        if (!editor) {
            editor = document.getElementById('journal-content-editor');
        }

        const selection = window.getSelection();
        if (!selection.toString().trim() && format !== 'clear') {
            this.showNotification('Pilih teks yang ingin diformat', 'warning');
            return;
        }

        document.execCommand(format, false, null);
        editor.focus();
    },

    setupFilters() {
        // Initialize filters object with additional options
        this.filters = {
            mood: 'all',
            dateRange: 'all',
            search: '',
            tags: [],
            showFavorites: false,
            showPrivate: false
        };
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
                const journalDateElement = document.getElementById('journal-date');
                if (journalDateElement) journalDateElement.focus();
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

        // Add calendar view
        const calendarBtn = document.getElementById('journal-calendar');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                this.openCalendarView();
            });
        }

        // Add weather button
        const weatherBtn = document.getElementById('add-weather-btn');
        if (weatherBtn) {
            weatherBtn.addEventListener('click', async () => {
                await this.addWeatherToCurrentEntry();
            });
        }

        // Add location button
        const locationBtn = document.getElementById('add-location-btn');
        if (locationBtn) {
            locationBtn.addEventListener('click', async () => {
                await this.addLocationToCurrentEntry();
            });
        }

        // Add photo attachment button
        const photoBtn = document.getElementById('attach-photo-btn');
        if (photoBtn) {
            photoBtn.addEventListener('click', () => {
                this.attachPhoto();
            });
        }

        // Add voice capture button
        const voiceBtn = document.getElementById('voice-capture-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.startVoiceCapture();
            });
        }

        // Add tag cloud button
        const tagCloudBtn = document.getElementById('show-tag-cloud');
        if (tagCloudBtn) {
            tagCloudBtn.addEventListener('click', () => {
                this.showTagCloud();
            });
        }

        // Add export all button
        const exportAllBtn = document.getElementById('export-all-journals');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportAllEntries();
            });
        }

        // Add backup button
        const backupBtn = document.getElementById('backup-journals');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.backupEntries();
            });
        }

        // Add restore button
        const restoreBtn = document.getElementById('restore-journals');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.restoreEntries();
            });
        }
    },

    saveEntry() {
        const date = document.getElementById('journal-date');
        const contentEditor = document.getElementById('journal-content-editor');
        const tags = document.getElementById('journal-tags');
        const selectedMood = document.querySelector('.mood-btn.border-indigo-500');

        if (!date.value) {
            this.showNotification('Tanggal harus diisi', 'warning');
            return;
        }

        // Get content from the rich text editor
        const rawContent = contentEditor ? contentEditor.innerHTML.trim() : '';
        if (!rawContent) {
            this.showNotification('Konten journal harus diisi', 'warning');
            return;
        }

        try {
            const sanitizedContent = Utils.sanitizeHTML(rawContent);

            const entry = {
                date: date.value,
                content: sanitizedContent,
                mood: selectedMood ? selectedMood.dataset.mood : 'neutral',
                tags: tags.value.split(',').map(t => t.trim()).filter(t => t),
                gratitude: this.extractGratitude(sanitizedContent),
                goals: this.extractGoals(sanitizedContent),
                reflections: this.extractReflections(sanitizedContent),
                isPrivate: (document.getElementById('journal-private') && document.getElementById('journal-private').checked) || false,
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

    loadEntry(dateValue) {
        const date = document.getElementById('journal-date');
        const dateToLoad = dateValue || date.value;
        const entry = this.entries.find(e => e.date === dateToLoad);

        if (entry) {
            // Set content in the rich text editor
            const contentEditor = document.getElementById('journal-content-editor');
            if (contentEditor) {
                contentEditor.innerHTML = entry.content;
            }

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
            // Clear the rich text editor
            const contentEditor = document.getElementById('journal-content-editor');
            if (contentEditor) {
                contentEditor.innerHTML = '';
            }

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
                // Clear the rich text editor
                const contentEditor = document.getElementById('journal-content-editor');
                if (contentEditor) {
                    contentEditor.innerHTML = '';
                }

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

    showFavorites() {
        // Set filter to show only favorites
        this.filters.showFavorites = true;
        this.render();

        // Show notification
        const favoriteCount = this.entries.filter(e => e.isFavorite).length;
        this.showNotification(`Menampilkan ${favoriteCount} entri favorit`, 'info');
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
                this.exportToPDF(entry);
                return;
            case 'txt':
                content = this.convertToText(entry);
                filename = `journal-${entry.date}.txt`;
                mimeType = 'text/plain';
                break;
            case 'json':
                content = JSON.stringify(entry, null, 2);
                filename = `journal-${entry.date}.json`;
                mimeType = 'application/json';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        this.showNotification(`Journal diekspor sebagai ${format}`, 'success');
    },

    exportToPDF(entry) {
        // Using jsPDF to create a PDF
        if (typeof jsPDF !== 'undefined') {
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.text(`Journal - ${entry.date}`, 10, 10);

            // Add mood
            if (entry.mood) {
                doc.setFontSize(12);
                doc.text(`Mood: ${entry.mood}`, 10, 20);
            }

            // Add metadata
            let yPos = 30;
            if (entry.weather) {
                doc.text(`Cuaca: ${entry.weather}`, 10, yPos);
                yPos += 10;
            }

            if (entry.location) {
                doc.text(`Lokasi: ${entry.location}`, 10, yPos);
                yPos += 10;
            }

            doc.text(`Kata: ${entry.wordCount || 0}`, 10, yPos);
            doc.text(`Waktu baca: ${entry.readingTime || 0} menit`, 50, yPos);
            yPos += 15;

            // Add gratitude
            if (entry.gratitude && entry.gratitude.length > 0) {
                doc.setFontSize(14);
                doc.text('Bersyukur untuk:', 10, yPos);
                yPos += 10;

                doc.setFontSize(12);
                entry.gratitude.forEach(item => {
                    doc.text(`• ${item}`, 15, yPos);
                    yPos += 8;
                });

                yPos += 5;
            }

            // Add goals
            if (entry.goals && entry.goals.length > 0) {
                doc.setFontSize(14);
                doc.text('Tujuan hari ini:', 10, yPos);
                yPos += 10;

                doc.setFontSize(12);
                entry.goals.forEach(goal => {
                    doc.text(`• ${goal}`, 15, yPos);
                    yPos += 8;
                });

                yPos += 5;
            }

            // Add activities
            if (entry.activities && entry.activities.length > 0) {
                doc.setFontSize(14);
                doc.text('Aktivitas:', 10, yPos);
                yPos += 10;

                doc.setFontSize(12);
                entry.activities.forEach(activity => {
                    doc.text(`• ${activity}`, 15, yPos);
                    yPos += 8;
                });

                yPos += 5;
            }

            // Add reflections
            if (entry.reflections) {
                doc.setFontSize(14);
                doc.text('Refleksi:', 10, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.text(entry.reflections, 15, yPos, { maxWidth: 180 });
                yPos += (entry.reflections.length / 50) * 8; // Approximate line breaks

                yPos += 5;
            }

            // Add main content
            doc.setFontSize(14);
            doc.text('Catatan:', 10, yPos);
            yPos += 10;

            doc.setFontSize(12);
            // Split content into lines to fit page
            const contentLines = doc.splitTextToSize(entry.content.replace(/<[^>]*>/g, ''), 180);
            contentLines.forEach(line => {
                if (yPos > 280) { // If we're near bottom of page
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 15, yPos);
                yPos += 8;
            });

            // Add tags
            if (entry.tags && entry.tags.length > 0) {
                doc.setFontSize(14);
                doc.text('Tags:', 10, yPos + 10);
                doc.setFontSize(12);
                doc.text(entry.tags.join(', '), 30, yPos + 10);
            }

            // Save the PDF
            doc.save(`journal-${entry.date}.pdf`);
        } else {
            // Fallback to HTML-based PDF if jsPDF is not available
            const html = this.convertToPDF(entry);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
        }

        this.showNotification('Journal diekspor sebagai PDF', 'success');
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
                case 'today':
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(e => {
                        const entryDate = new Date(e.date);
                        return entryDate >= startDate && entryDate <= endDate;
                    });
                    break;
                case 'yesterday':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    const yesterdayEnd = new Date();
                    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
                    yesterdayEnd.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(e => {
                        const entryDate = new Date(e.date);
                        return entryDate >= startDate && entryDate <= yesterdayEnd;
                    });
                    break;
            }

            if (startDate && this.filters.dateRange !== 'today' && this.filters.dateRange !== 'yesterday') {
                filtered = filtered.filter(e => new Date(e.date) >= startDate);
            }
        }

        // Search filter - now searches in content, tags, gratitude, goals, and reflections
        if (this.filters.search) {
            filtered = filtered.filter(e =>
                e.content.toLowerCase().includes(this.filters.search) ||
                e.reflections.toLowerCase().includes(this.filters.search) ||
                e.tags.some(tag => tag.toLowerCase().includes(this.filters.search)) ||
                e.gratitude.some(item => item.toLowerCase().includes(this.filters.search)) ||
                e.goals.some(goal => goal.toLowerCase().includes(this.filters.search)) ||
                e.activities.some(activity => activity.toLowerCase().includes(this.filters.search))
            );
        }

        // Tags filter
        if (this.filters.tags.length > 0) {
            filtered = filtered.filter(e =>
                this.filters.tags.some(tag => e.tags.includes(tag))
            );
        }

        // Favorite filter
        if (this.filters.showFavorites) {
            filtered = filtered.filter(e => e.isFavorite);
        }

        // Private filter
        if (this.filters.showPrivate) {
            filtered = filtered.filter(e => e.isPrivate);
        }

        // Sort entries
        filtered.sort((a, b) => {
            let aValue = a[this.sorting.field];
            let bValue = b[this.sorting.field];

            if (this.sorting.field === 'date') {
                // For date sorting, convert to Date objects for proper comparison
                aValue = new Date(aValue);
                bValue = new Date(bValue);
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
        const journalList = document.getElementById('journal-list');
        if (!journalList) return;

        const filteredEntries = this.getFilteredEntries();

        // Show loading state with animation
        journalList.innerHTML = '<div class="loading h-40 rounded-lg mb-4 animate-pulse"></div>'.repeat(3);

        // Simulate loading delay for better UX
        setTimeout(() => {
            if (filteredEntries.length === 0) {
                journalList.innerHTML = `
                    <div class="text-center py-8 animate-fadeIn">
                        <i class="fas fa-book text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Tidak ada journal ditemukan</p>
                        <button class="mt-4 text-indigo-600 hover:text-indigo-800 transition-colors" onclick="Journal.clearFilters()">
                            Hapus filter
                        </button>
                    </div>
                `;
                return;
            }

            // Clear and add entries with animation
            journalList.innerHTML = '';
            filteredEntries.forEach((entry, index) => {
                const entryEl = this.createJournalElement(entry);
                // Add staggered animation
                entryEl.style.opacity = '0';
                entryEl.style.transform = 'translateY(20px)';
                journalList.appendChild(entryEl);

                // Animate in with delay
                setTimeout(() => {
                    entryEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    entryEl.style.opacity = '1';
                    entryEl.style.transform = 'translateY(0)';
                }, index * 50);
            });

            // Update stats
            this.updateFilterStats(filteredEntries);
        }, 300);
    },

    createJournalElement(entry) {
        const entryEl = document.createElement('div');
        entryEl.className = `journal-entry ${entry.isFavorite ? 'favorite' : ''} ${entry.isPrivate ? 'private' : ''} bg-white rounded-xl shadow-md p-5 mb-4 transition-all duration-300 hover:shadow-lg border-l-4 ${this.getMoodColorClass(entry.mood)}`;
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
            <div class="flex justify-between items-start mb-3">
                <div class="flex-grow">
                    <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                        ${entry.isFavorite ? '<i class="fas fa-star text-yellow-500 mr-2" title="Favorit"></i>' : ''}
                        ${entry.isPrivate ? '<i class="fas fa-lock text-gray-400 mr-2" title="Privat"></i>' : ''}
                        ${formattedDate}
                    </h3>
                    <div class="flex items-center flex-wrap gap-2 mt-2">
                        <div class="flex items-center bg-gray-100 rounded-full px-3 py-1">
                            <span class="text-xl mr-1">${moodEmojis[entry.mood]}</span>
                            <span class="text-sm capitalize">${entry.mood.replace('-', ' ')}</span>
                        </div>
                        ${entry.weather ? `<div class="flex items-center bg-blue-50 rounded-full px-3 py-1"><i class="fas fa-cloud-sun mr-1 text-blue-500"></i><span class="text-sm">${entry.weather}</span></div>` : ''}
                        ${entry.location ? `<div class="flex items-center bg-green-50 rounded-full px-3 py-1"><i class="fas fa-map-marker-alt mr-1 text-green-500"></i><span class="text-sm">${entry.location}</span></div>` : ''}
                        <div class="flex items-center bg-purple-50 rounded-full px-3 py-1"><i class="fas fa-font mr-1 text-purple-500"></i><span class="text-sm">${entry.wordCount} kata</span></div>
                        <div class="flex items-center bg-yellow-50 rounded-full px-3 py-1"><i class="fas fa-clock mr-1 text-yellow-500"></i><span class="text-sm">${entry.readingTime} menit baca</span></div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button class="favorite-btn text-yellow-500 hover:text-yellow-700 bg-gray-100 rounded-full p-2 transition-transform hover:scale-110" data-date="${entry.date}" title="Favorit">
                        <i class="fas fa-star${entry.isFavorite ? '' : '-o'}"></i>
                    </button>
                    <button class="edit-journal text-blue-500 hover:text-blue-700 bg-gray-100 rounded-full p-2 transition-transform hover:scale-110" data-date="${entry.date}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="export-journal text-green-500 hover:text-green-700 bg-gray-100 rounded-full p-2 transition-transform hover:scale-110" data-date="${entry.date}" title="Export">
                        <i class="fas fa-download"></i>
                    </button>
                    <div class="relative group">
                        <button class="more-options text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition-transform hover:scale-110" data-date="${entry.date}" title="Opsi Lainnya">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="more-options-menu hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-200">
                            <button class="share-btn w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center" data-date="${entry.date}">
                                <i class="fas fa-share-alt mr-2"></i> Bagikan
                            </button>
                            <button class="copy-btn w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center" data-date="${entry.date}">
                                <i class="fas fa-copy mr-2"></i> Salin
                            </button>
                            <button class="print-btn w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center" data-date="${entry.date}">
                                <i class="fas fa-print mr-2"></i> Cetak
                            </button>
                        </div>
                    </div>
                    <button class="delete-journal text-red-500 hover:text-red-700 bg-gray-100 rounded-full p-2 transition-transform hover:scale-110" data-date="${entry.date}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            ${entry.gratitude && entry.gratitude.length > 0 ? `
                <div class="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-100">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-heart text-yellow-500 mr-2"></i>
                        <h4 class="font-semibold text-yellow-800">Bersyukur untuk:</h4>
                    </div>
                    <ul class="text-yellow-700">
                        ${entry.gratitude.map(item => `<li class="flex items-start"><i class="fas fa-check-circle text-yellow-500 mr-2 mt-1"></i>${item}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${entry.goals && entry.goals.length > 0 ? `
                <div class="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-bullseye text-blue-500 mr-2"></i>
                        <h4 class="font-semibold text-blue-800">Tujuan hari ini:</h4>
                    </div>
                    <ul class="text-blue-700">
                        ${entry.goals.map(goal => `<li class="flex items-start"><i class="fas fa-check-circle text-blue-500 mr-2 mt-1"></i>${goal}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="mb-4 p-4 bg-gray-50 rounded-lg prose max-w-none">
                ${excerpt}
            </div>

            ${entry.reflections ? `
                <div class="mb-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-comment-dots text-purple-500 mr-2"></i>
                        <h4 class="font-semibold text-purple-800">Refleksi:</h4>
                    </div>
                    <p class="text-purple-700">${entry.reflections}</p>
                </div>
            ` : ''}

            ${entry.activities && entry.activities.length > 0 ? `
                <div class="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-running text-green-500 mr-2"></i>
                        <h4 class="font-semibold text-green-800">Aktivitas:</h4>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${entry.activities.map(activity => `
                            <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
                                <i class="fas fa-check-circle mr-1 text-xs"></i> ${activity}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${entry.tags.length > 0 ? `
                <div class="flex flex-wrap gap-2 mb-4">
                    ${entry.tags.map(tag => `
                        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full cursor-pointer hover:bg-indigo-200 transition-colors flex items-center"
                              onclick="Journal.filterByTag('${tag}')">
                            <i class="fas fa-hashtag mr-1 text-xs"></i> ${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}

            <div class="flex justify-between items-center text-sm text-gray-500 border-t border-gray-100 pt-3">
                <span>Diperbarui: ${new Date(entry.updatedAt).toLocaleString('id-ID')}</span>
                <div class="flex space-x-3">
                    <button class="text-indigo-600 hover:text-indigo-800 font-medium flex items-center" onclick="Journal.expandEntry('${entry.date}')">
                        <i class="fas fa-expand-arrows-alt mr-1"></i> Baca Selengkapnya
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachJournalEventListeners(entryEl);

        return entryEl;
    },

    getMoodColorClass(mood) {
        const moodColors = {
            'very-happy': 'border-green-500 bg-green-50',
            'happy': 'border-blue-500 bg-blue-50',
            'neutral': 'border-gray-500 bg-gray-50',
            'sad': 'border-purple-500 bg-purple-50',
            'angry': 'border-red-500 bg-red-50'
        };

        return moodColors[mood] || 'border-gray-300 bg-gray-50';
    },

    getMoodBackgroundColor(mood) {
        const moodColors = {
            'very-happy': 'bg-green-100',
            'happy': 'bg-blue-100',
            'neutral': 'bg-gray-100',
            'sad': 'bg-purple-100',
            'angry': 'bg-red-100'
        };

        return moodColors[mood] || 'bg-gray-100';
    },

    getMoodTextColor(mood) {
        const moodColors = {
            'very-happy': 'text-green-700',
            'happy': 'text-blue-700',
            'neutral': 'text-gray-700',
            'sad': 'text-purple-700',
            'angry': 'text-red-700'
        };

        return moodColors[mood] || 'text-gray-700';
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
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-2xl font-bold text-gray-800">Pelacak Mood</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="p-6 overflow-y-auto max-h-[70vh]">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Distribusi Mood 30 Hari Terakhir</h3>
                            <canvas id="mood-chart" width="600" height="300"></canvas>
                        </div>

                        <div class="bg-gray-50 p-6 rounded-xl">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Mood 30 Hari Terakhir</h3>
                            <canvas id="mood-trend-chart" width="600" height="300"></canvas>
                        </div>
                    </div>

                    <div class="mt-8">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Statistik Mood</h3>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            ${this.getMoodStatistics().map(stat => `
                                <div class="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                                    <div class="text-3xl mb-2">${stat.emoji}</div>
                                    <div class="font-bold text-indigo-700 text-xl">${stat.count}</div>
                                    <div class="text-sm text-gray-600">${stat.percentage}%</div>
                                    <div class="text-xs text-gray-500 mt-1 capitalize">${stat.mood.replace('-', ' ')}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Mood Rata-rata</h3>
                            <div class="text-4xl font-bold text-indigo-600">${this.getAverageMoodDisplay()}</div>
                            <p class="text-gray-600 mt-2">Berdasarkan ${this.entries.length} entri</p>
                        </div>

                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Streak Mood Positif</h3>
                            <div class="text-4xl font-bold text-green-600">${this.getConsecutiveHappyDays()}</div>
                            <p class="text-gray-600 mt-2">Hari berturut-turut dengan mood positif</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);

        // Draw mood charts after modal is added to DOM
        setTimeout(() => {
            const moodChartCanvas = modal.querySelector('#mood-chart');
            const moodTrendCanvas = modal.querySelector('#mood-trend-chart');

            if (moodChartCanvas) this.drawMoodChart(moodChartCanvas);
            if (moodTrendCanvas) this.drawMoodTrendChart(moodTrendCanvas);
        }, 100);
    },

    getAverageMoodDisplay() {
        const avgMood = this.calculateAverageMood();
        const moodValues = {
            'very-happy': 5,
            'happy': 4,
            'neutral': 3,
            'sad': 2,
            'angry': 1
        };

        // Find the mood that corresponds to the average value
        const moodNames = Object.keys(moodValues);
        let closestMood = 'neutral';
        let minDiff = Math.abs(moodValues['neutral'] - avgMood);

        for (const mood of moodNames) {
            const diff = Math.abs(moodValues[mood] - avgMood);
            if (diff < minDiff) {
                minDiff = diff;
                closestMood = mood;
            }
        }

        return `${this.getMoodEmoji(closestMood)} ${closestMood.replace('-', ' ')}`;
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

    async getCurrentWeather() {
        // Check if browser supports geolocation
        if (!navigator.geolocation) {
            console.error('Geolocation not supported by browser');
            return null;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,  // 10 seconds timeout
                    enableHighAccuracy: true
                });
            });

            // Get weather using OpenWeatherMap API (requires API key)
            // For demo purposes, we'll use a mock response
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // In a real implementation, you would make an API call like:
            /*
            const apiKey = 'YOUR_API_KEY';
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=id`
            );
            const data = await response.json();
            return `${data.weather[0].description}, ${Math.round(data.main.temp)}°C`;
            */

            // Mock weather data for demo
            const mockWeather = [
                'Cerah',
                'Berawan',
                'Hujan Ringan',
                'Hujan Lebat',
                'Awan Tebal',
                'Gerimis',
                'Cerah Berawan'
            ];
            const randomWeather = mockWeather[Math.floor(Math.random() * mockWeather.length)];
            return randomWeather;
        } catch (error) {
            console.error('Error getting weather:', error);
            return null;
        }
    },

    async addWeatherToCurrentEntry() {
        const weather = await this.getCurrentWeather();
        if (!weather) {
            this.showNotification('Gagal mendapatkan data cuaca', 'error');
            return;
        }

        const contentEditor = document.getElementById('journal-content-editor');
        if (contentEditor) {
            contentEditor.innerHTML += `<p>Cuaca saat ini: ${weather}</p>`;
            this.showNotification(`Cuaca ditambahkan: ${weather}`, 'success');
        }
    },

    attachPhoto() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type and size
            if (!file.type.match('image.*')) {
                this.showNotification('File harus berupa gambar', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showNotification('Gambar terlalu besar (maks 5MB)', 'error');
                return;
            }

            // Create a preview of the image
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgElement = document.createElement('img');
                imgElement.src = event.target.result;
                imgElement.className = 'max-w-xs h-auto rounded-lg border border-gray-300 my-2';
                imgElement.alt = 'Gambar terlampir';

                // Add to content editor
                const contentEditor = document.getElementById('journal-content-editor');
                if (contentEditor) {
                    contentEditor.appendChild(imgElement);
                    this.showNotification('Gambar berhasil dilampirkan', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        fileInput.click();
    },

    async getCurrentLocation() {
        // Check if browser supports geolocation
        if (!navigator.geolocation) {
            console.error('Geolocation not supported by browser');
            return null;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,  // 10 seconds timeout
                    enableHighAccuracy: true
                });
            });

            // Get location name using reverse geocoding (requires API key)
            // For demo purposes, we'll use coordinates
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // In a real implementation, you would make an API call like:
            /*
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=YOUR_API_KEY&language=id&pretty=1`
            );
            const data = await response.json();
            return data.results[0].formatted;
            */

            // For now, return coordinates as a mock location
            return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    },

    async addLocationToCurrentEntry() {
        const location = await this.getCurrentLocation();
        if (!location) {
            this.showNotification('Gagal mendapatkan data lokasi', 'error');
            return;
        }

        const contentEditor = document.getElementById('journal-content-editor');
        if (contentEditor) {
            contentEditor.innerHTML += `<p>Lokasi saat ini: ${location}</p>`;
            this.showNotification(`Lokasi ditambahkan: ${location}`, 'success');
        }
    },

    clearFilters() {
        this.filters = {
            mood: 'all',
            dateRange: 'all',
            search: '',
            tags: [],
            showFavorites: false,
            showPrivate: false
        };

        // Reset UI
        document.getElementById('journal-search').value = '';
        document.getElementById('mood-filter').value = 'all';
        const dateRangeFilter = document.getElementById('date-range-filter');
        if (dateRangeFilter) dateRangeFilter.value = 'all';
        const showFavoritesToggle = document.getElementById('show-favorites-toggle');
        if (showFavoritesToggle) showFavoritesToggle.removeAttribute('checked');
        const showPrivateToggle = document.getElementById('show-private-toggle');
        if (showPrivateToggle) showPrivateToggle.removeAttribute('checked');

        this.render();
    },

    async openCalendarView() {
        // This would integrate with the main calendar functionality
        // For now, we'll create a simple date picker modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-800">Kalender Journal</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto max-h-[70vh]">
                    <div class="flex justify-between items-center mb-6">
                        <button id="prev-month" class="p-2 rounded-full hover:bg-gray-100">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3 id="current-month" class="text-xl font-semibold text-gray-800"></h3>
                        <button id="next-month" class="p-2 rounded-full hover:bg-gray-100">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <div id="calendar-grid" class="grid grid-cols-7 gap-1 mb-4">
                        ${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day =>
                            `<div class="text-center font-medium text-gray-600 py-2">${day}</div>`
                        ).join('')}
                    </div>

                    <div id="calendar-days" class="grid grid-cols-7 gap-1">
                        <!-- Calendar days will be populated here -->
                    </div>
                </div>
            </div>
        `;

        // Initialize calendar
        let currentDate = new Date();
        this.renderCalendar(currentDate, modal);

        // Navigation event listeners
        modal.querySelector('#prev-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            this.renderCalendar(currentDate, modal);
        });

        modal.querySelector('#next-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            this.renderCalendar(currentDate, modal);
        });

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    },

    renderCalendar(date, modal) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Update month display
        modal.querySelector('#current-month').textContent =
            `${date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get today's date for comparison
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Generate calendar days
        const calendarDays = modal.querySelector('#calendar-days');
        calendarDays.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'h-12';
            calendarDays.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dateStr = dayDate.toISOString().split('T')[0];

            const dayCell = document.createElement('div');
            dayCell.className = 'h-12 flex flex-col items-center justify-center border rounded-lg cursor-pointer hover:bg-gray-100';
            dayCell.innerHTML = `<div class="text-sm">${day}</div>`;

            // Check if there's a journal entry for this day
            const hasEntry = this.entries.some(entry => entry.date === dateStr);
            if (hasEntry) {
                dayCell.classList.add('bg-indigo-100', 'border-indigo-300');
                dayCell.innerHTML += '<div class="w-2 h-2 rounded-full bg-indigo-500 mt-1"></div>';
            }

            // Highlight today
            if (dateStr === todayStr) {
                dayCell.classList.add('bg-blue-500', 'text-white');
            }

            // Add click event to load journal for that date
            dayCell.addEventListener('click', () => {
                document.getElementById('journal-date').value = dateStr;
                this.loadEntry(dateStr);

                // Close the modal
                modal.remove();

                // Show notification
                this.showNotification(`Tanggal ${dateStr} dipilih`, 'info');
            });

            calendarDays.appendChild(dayCell);
        }
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
                id: 'productive-day',
                name: 'Hari Produktif',
                description: 'Template untuk mencatat hari yang produktif',
                mood: 'happy',
                tags: ['produktif', 'kerja'],
                category: 'refleksi',
                content: '## Tujuan Hari Ini\n\n- [ ] Tujuan 1\n- [ ] Tujuan 2\n- [ ] Tujuan 3\n\n## Bersyukur\n\n- Hal yang saya syukuri hari ini:\n\n## Refleksi\n\n- Apa yang berhasil hari ini?\n- Apa yang bisa diperbaiki?\n\n## Aktivitas\n\n- Aktivitas 1\n- Aktivitas 2'
            },
            {
                id: 'morning-pages',
                name: 'Morning Pages',
                description: 'Template untuk menulis pagi',
                mood: 'neutral',
                tags: ['pagi', 'refleksi'],
                category: 'pagi',
                content: '## Hari Ini\n\nTanggal: [isi tanggal]\nCuaca: [isi cuaca]\n\n## Perasaan Pagi\n\nBagaimana perasaan saya saat bangun:\n\n## Apa yang ada di pikiran?\n\n- Pikiran 1\n- Pikiran 2\n- Pikiran 3\n\n## Gratitude\n\nTiga hal yang saya syukuri:\n1. \n2. \n3. \n\n## Intensi Hari Ini\n\nBagaimana saya ingin hari ini berjalan:\n\n'
            },
            {
                id: 'evening-reflection',
                name: 'Evening Reflection',
                description: 'Template untuk refleksi malam',
                mood: 'neutral',
                tags: ['malam', 'refleksi'],
                category: 'malam',
                content: '## Refleksi Hari [isi tanggal]\n\n## Highlight Hari Ini\n\n- Hal terbaik yang terjadi hari ini:\n- Hal yang membuat saya bahagia:\n\n## Challenges\n\n- Tantangan yang dihadapi:\n- Bagaimana saya mengatasinya:\n\n## Pembelajaran\n\n- Apa yang saya pelajari hari ini?\n- Hal yang bisa saya lakukan lebih baik besok?\n\n## Gratitude\n\nTiga hal yang saya syukuri:\n1. \n2. \n3. \n\n'
            },
            {
                id: 'gratitude',
                name: 'Gratitude Journal',
                description: 'Template khusus untuk bersyukur',
                mood: 'very-happy',
                tags: ['gratitude', 'bersyukur'],
                category: 'gratitude',
                content: '## Bersyukur Hari Ini\n\nTanggal: [isi tanggal]\n\n## Orang\n\n1. [Nama orang] - [Alasan bersyukur]\n2. [Nama orang] - [Alasan bersyukur]\n3. [Nama orang] - [Alasan bersyukur]\n\n## Pengalaman\n\n1. [Pengalaman] - [Alasan bersyukur]\n2. [Pengalaman] - [Alasan bersyukur]\n3. [Pengalaman] - [Alasan bersyukur]\n\n## Hal Kecil\n\n1. [Hal kecil] - [Alasan bersyukur]\n2. [Hal kecil] - [Alasan bersyukur]\n3. [Hal kecil] - [Alasan bersyukur]\n\n## Diri Sendiri\n\n1. [Kualitas diri] - [Alasan bersyukur]\n2. [Kemampuan] - [Alasan bersyukur]\n3. [Pencapaian] - [Alasan bersyukur]\n\n'
            },
            {
                id: 'goal-setting',
                name: 'Goal Setting',
                description: 'Template untuk menetapkan tujuan',
                mood: 'happy',
                tags: ['tujuan', 'goal'],
                category: 'tujuan',
                content: '## Tujuan [periode waktu]\n\n## Tujuan Utama\n\n[Tujuan utama periode ini]\n\n## Mengapa Ini Penting?\n\n[Alasan mengapa tujuan ini penting]\n\n## Target Spesifik\n\n- Target 1: [target spesifik]\n- Target 2: [target spesifik]\n- Target 3: [target spesifik]\n\n## Langkah-Langkah\n\n1. [Langkah 1]\n2. [Langkah 2]\n3. [Langkah 3]\n\n## Tantangan & Solusi\n\n**Tantangan:**\n- [Tantangan 1]\n- [Tantangan 2]\n\n**Solusi:**\n- [Solusi 1]\n- [Solusi 2]\n\n## Metric Keberhasilan\n\n- Bagaimana saya mengukur keberhasilan?\n- Target minimum untuk diangrapkan berhasil:\n\n## Reward\n\n[Reward jika berhasil mencapai tujuan]\n\n'
            },
            {
                id: 'daily-activities',
                name: 'Daily Activities',
                description: 'Template untuk mencatat aktivitas harian',
                mood: 'neutral',
                tags: ['aktivitas', 'hari'],
                category: 'aktivitas',
                content: '## Aktivitas Hari Ini\n\nTanggal: [isi tanggal]\n\n## Pagi\n\n- [ ] Jam 6:00 - 8:00: \n- [ ] Jam 8:00 - 10:00: \n\n## Siang\n\n- [ ] Jam 10:00 - 12:00: \n- [ ] Jam 12:00 - 14:00: \n\n## Sore\n\n- [ ] Jam 14:00 - 16:00: \n- [ ] Jam 16:00 - 18:00: \n\n## Malam\n\n- [ ] Jam 18:00 - 20:00: \n- [ ] Jam 20:00 - 22:00: \n\n## Refleksi\n\n- Aktivitas paling produktif:\n- Aktivitas yang ingin diulang:\n- Aktivitas yang ingin dihindari:\n\n'
            },
            {
                id: 'weekly-review',
                name: 'Weekly Review',
                description: 'Template untuk meninjau mingguan',
                mood: 'neutral',
                tags: ['mingguan', 'review'],
                category: 'review',
                content: '## Review Minggu Ini\n\nPeriode: [minggu]\n\n## Pencapaian Minggu Ini\n\n- Pencapaian 1\n- Pencapaian 2\n- Pencapaian 3\n\n## Halangan\n\n- Halangan 1\n- Halangan 2\n- Halangan 3\n\n## Pembelajaran\n\n- Pembelajaran 1\n- Pembelajaran 2\n- Pembelajaran 3\n\n## Tujuan Minggu Depan\n\n- Tujuan 1\n- Tujuan 2\n- Tujuan 3\n\n## Prioritas Minggu Depan\n\n- Prioritas 1\n- Prioritas 2\n- Prioritas 3\n\n'
            },
            {
                id: 'mindfulness',
                name: 'Mindfulness Journal',
                description: 'Template untuk menulis mindful',
                mood: 'neutral',
                tags: ['mindful', 'meditasi'],
                category: 'mindfulness',
                content: '## Mindfulness Journal\n\nTanggal: [isi tanggal]\n\n## Sensasi Fisik\n\n- Apa yang saya rasakan di tubuh?\n\n## Emosi\n\n- Apa yang saya rasakan saat ini?\n\n## Pernapasan\n\n- Bagaimana pernapasan saya?\n\n## Pemikiran\n\n- Pemikiran apa yang muncul?\n\n## Rasa Syukur\n\n- Hal-hal kecil yang saya syukuri:\n\n## Niat\n\n- Niat untuk hari ini:\n\n'
            }
        ];
    },

    showTemplatesModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-screen overflow-hidden">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-2xl font-bold text-gray-800">Template Journal</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="p-4 bg-gray-50 border-b">
                    <div class="flex flex-wrap gap-2">
                        <button class="filter-btn px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm hover:bg-indigo-200 active" data-filter="all">Semua</button>
                        <button class="filter-btn px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200" data-filter="refleksi">Refleksi</button>
                        <button class="filter-btn px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200" data-filter="gratitude">Gratitude</button>
                        <button class="filter-btn px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200" data-filter="tujuan">Tujuan</button>
                        <button class="filter-btn px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200" data-filter="aktivitas">Aktivitas</button>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto max-h-96">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="template-grid">
                        ${this.getTemplates().map(template => `
                            <div class="border rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:shadow-md template-card"
                                 data-template="${template.id}" data-category="${template.category}">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="font-semibold text-lg mb-1">${template.name}</h3>
                                        <p class="text-sm text-gray-600 mb-2">${template.description}</p>
                                    </div>
                                    <span class="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">${template.category}</span>
                                </div>
                                <div class="flex flex-wrap gap-1 mt-3">
                                    ${template.tags.map(tag => `
                                        <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">#${tag}</span>
                                    `).join('')}
                                </div>
                                <div class="mt-3 flex items-center">
                                    <span class="text-lg mr-2">${this.getMoodEmoji(template.mood)}</span>
                                    <span class="text-sm capitalize">${template.mood}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="p-4 bg-gray-50 border-t text-center">
                    <button class="create-custom-template px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                        <i class="fas fa-plus mr-2"></i> Buat Template Kustom
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.template;
                const template = this.getTemplates().find(t => t.id === templateId);
                if (template) {
                    this.applyTemplate(template);
                    modal.remove();
                }
            });
        });

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Filter functionality
        modal.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                modal.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('bg-indigo-100', 'text-indigo-800');
                    b.classList.add('bg-gray-100', 'text-gray-800');
                });
                btn.classList.remove('bg-gray-100', 'text-gray-800');
                btn.classList.add('bg-indigo-100', 'text-indigo-800');

                // Filter templates
                const filter = btn.dataset.filter;
                const templateCards = modal.querySelectorAll('.template-card');

                templateCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Create custom template
        modal.querySelector('.create-custom-template').addEventListener('click', () => {
            this.showCustomTemplateModal();
            modal.remove();
        });

        document.body.appendChild(modal);
    },

    showCustomTemplateModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl">
                <div class="p-6 border-b">
                    <h2 class="text-2xl font-bold text-gray-800">Buat Template Kustom</h2>
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
                        <input type="text" id="custom-template-name" class="form-input w-full" placeholder="Nama template...">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <input type="text" id="custom-template-desc" class="form-input w-full" placeholder="Deskripsi template...">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mood Rekomendasi</label>
                        <div class="flex space-x-2 mood-selector">
                            <button class="mood-btn px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500" data-mood="very-happy">😊</button>
                            <button class="mood-btn px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500" data-mood="happy">🙂</button>
                            <button class="mood-btn px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500" data-mood="neutral">😐</button>
                            <button class="mood-btn px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500" data-mood="sad">😢</button>
                            <button class="mood-btn px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500" data-mood="angry">😠</button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tags (pisahkan dengan koma)</label>
                        <input type="text" id="custom-template-tags" class="form-input w-full" placeholder="tag1, tag2, tag3">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Konten Template</label>
                        <textarea id="custom-template-content" class="form-input w-full h-40" placeholder="Tulis template di sini..."></textarea>
                    </div>
                </div>

                <div class="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                    <button class="cancel-btn px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                    <button class="save-template-btn px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan Template</button>
                </div>
            </div>
        `;

        // Mood selector
        const moodBtns = modal.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtns.forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-50'));
                btn.classList.add('border-indigo-500', 'bg-indigo-50');
            });
        });

        // Cancel button
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Save template button
        modal.querySelector('.save-template-btn').addEventListener('click', () => {
            const name = document.getElementById('custom-template-name').value;
            const desc = document.getElementById('custom-template-desc').value;
            const tags = document.getElementById('custom-template-tags').value.split(',').map(t => t.trim()).filter(t => t);
            const content = document.getElementById('custom-template-content').value;
            const moodElement = document.querySelector('.mood-btn.border-indigo-500');
            const mood = (moodElement && moodElement.dataset.mood) || 'neutral';

            if (!name || !content) {
                this.showNotification('Nama dan konten template harus diisi', 'error');
                return;
            }

            const customTemplate = {
                id: `custom-${Date.now()}`,
                name,
                description: desc || 'Template kustom',
                mood,
                tags,
                category: 'kustom',
                content
            };

            // Save to localStorage
            let customTemplates = JSON.parse(localStorage.getItem('journal-custom-templates') || '[]');
            customTemplates.push(customTemplate);
            localStorage.setItem('journal-custom-templates', JSON.stringify(customTemplates));

            this.showNotification('Template kustom berhasil disimpan', 'success');
            modal.remove();
        });

        document.body.appendChild(modal);
    },

    getCustomTemplates() {
        try {
            return JSON.parse(localStorage.getItem('journal-custom-templates') || '[]');
        } catch (e) {
            console.error('Error loading custom templates:', e);
            return [];
        }
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

        // Set content in the rich text editor
        const contentEditor = document.getElementById('journal-content-editor');
        if (contentEditor) {
            // Replace placeholder date with today's date in the template content
            let content = template.content.replace(/\[isi tanggal\]/g, today);

            // Replace other placeholders with today's information
            const todayDate = new Date();
            const dayName = todayDate.toLocaleDateString('id-ID', { weekday: 'long' });
            const monthName = todayDate.toLocaleDateString('id-ID', { month: 'long' });
            const year = todayDate.getFullYear();
            content = content.replace(/\[hari\]/g, dayName);
            content = content.replace(/\[bulan\]/g, monthName);
            content = content.replace(/\[tahun\]/g, year);
            content = content.replace(/\[minggu\]/g, `minggu ke-${Math.ceil(todayDate.getDate() / 7)}`);

            // Convert markdown-like formatting to HTML
            content = this.convertMarkdownToHTML(content);

            contentEditor.innerHTML = content;
        }

        // Set tags
        document.getElementById('journal-tags').value = template.tags.join(', ');

        // Focus on content
        if (contentEditor) {
            contentEditor.focus();
        }

        this.showNotification(`Template "${template.name}" diterapkan`, 'success');
    },

    convertMarkdownToHTML(text) {
        // Convert markdown headers to HTML
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Convert bold and italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Convert lists
        text = text.replace(/^- (.*$)/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

        // Convert checkboxes
        text = text.replace(/- \[ \] (.*$)/gim, '<li><input type="checkbox" class="mr-2"> $1</li>');
        text = text.replace(/- \[x\] (.*$)/gim, '<li><input type="checkbox" checked class="mr-2"> $1</li>');

        // Convert line breaks
        text = text.replace(/\n/g, '<br>');

        return text;
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

        // Draw background
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, chartHeight + 20);
        ctx.lineTo(chartWidth + 40, chartHeight + 20);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const y = 20 + (i * chartHeight / 5);
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(chartWidth + 40, y);
            ctx.stroke();
        }

        // Draw bars
        const moods = ['very-happy', 'happy', 'neutral', 'sad', 'angry'];
        const colors = ['#10b981', '#3b82f6', '#6b7280', '#f59e0b', '#ef4444'];
        const labels = ['Sangat\nBahagia', 'Bahagia', 'Netral', 'Sedih', 'Marah'];

        moods.forEach((mood, index) => {
            const value = moodData[mood];
            const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
            const x = 40 + (index * barWidth) + (barWidth * 0.1);
            const y = chartHeight + 20 - barHeight;

            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, colors[index]);
            gradient.addColorStop(1, `${colors[index]}80`); // Add transparency
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);

            // Draw value
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + (barWidth * 0.4), y - 5);

            // Draw label
            ctx.fillStyle = '#6b7280';
            ctx.fillText(labels[index], x + (barWidth * 0.4), chartHeight + 35);
        });

        // Draw title
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Distribusi Mood 30 Hari Terakhir', canvas.width / 2, 15);
    },

    drawMoodTrendChart(canvas) {
        if (!canvas) return;

        // Get mood data for the last 30 days
        const moodData = this.getMoodTrendData(30);
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Chart settings
        const chartWidth = canvas.width - 60;
        const chartHeight = canvas.height - 60;
        const padding = 40;

        // Draw background
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, chartHeight + padding);
        ctx.lineTo(chartWidth + padding, chartHeight + padding);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const y = padding + (i * chartHeight / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(chartWidth + padding, y);
            ctx.stroke();
        }

        // Mood values mapping
        const moodValues = {
            'very-happy': 5,
            'happy': 4,
            'neutral': 3,
            'sad': 2,
            'angry': 1
        };

        // Prepare data for the line chart
        const dates = Object.keys(moodData).sort();
        if (dates.length === 0) return;

        // Find min and max values for scaling
        const values = dates.map(date => moodValues[moodData[date]] || 3);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        // Draw line chart
        ctx.beginPath();
        dates.forEach((date, index) => {
            const x = padding + (index * chartWidth / (dates.length - 1));
            const moodValue = moodValues[moodData[date]] || 3;
            const y = chartHeight + padding - ((moodValue - minValue) / (maxValue - minValue || 1)) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        // Style the line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw points
        dates.forEach((date, index) => {
            const x = padding + (index * chartWidth / (dates.length - 1));
            const moodValue = moodValues[moodData[date]] || 3;
            const y = chartHeight + padding - ((moodValue - minValue) / (maxValue - minValue || 1)) * chartHeight;

            // Draw point
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw mood emoji
            const moodEmoji = this.getMoodEmoji(moodData[date]);
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(moodEmoji, x, y - 10);
        });

        // Draw title
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tren Mood 30 Hari Terakhir', canvas.width / 2, 20);
    },

    getMoodTrendData(days = 30) {
        const data = {};
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Initialize all dates in range with default mood
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            data[dateStr] = 'neutral'; // Default mood
        }

        // Override with actual mood data
        this.entries
            .filter(entry => new Date(entry.date) >= cutoffDate)
            .forEach(entry => {
                data[entry.date] = entry.mood;
            });

        return data;
    },

    autoSave() {
        const contentEditor = document.getElementById('journal-content-editor');
        const date = document.getElementById('journal-date');

        if (!contentEditor || !date.value) return;

        const draft = {
            date: date.value,
            content: contentEditor.innerHTML,
            tags: document.getElementById('journal-tags').value.split(',').map(t => t.trim()).filter(t => t),
            mood: (document.querySelector('.mood-btn.border-indigo-500') && document.querySelector('.mood-btn.border-indigo-500').dataset.mood) || 'neutral',
            isPrivate: (document.getElementById('journal-private') && document.getElementById('journal-private').checked) || false,
            autoSave: true,
            savedAt: new Date().toISOString()
        };

        Storage.set('journal-draft', draft);

        // Show visual feedback
        const saveIndicator = document.getElementById('auto-save-indicator');
        if (saveIndicator) {
            saveIndicator.textContent = 'Draft disimpan...';
            saveIndicator.className = 'text-green-600 text-sm italic';
            setTimeout(() => {
                saveIndicator.textContent = 'Draft terakhir: ' + new Date().toLocaleTimeString('id-ID');
                saveIndicator.className = 'text-gray-500 text-sm italic';
            }, 2000);
        }
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

            // Set content in the rich text editor
            const contentEditor = document.getElementById('journal-content-editor');
            if (contentEditor) {
                contentEditor.innerHTML = draft.content;
            }

            document.getElementById('journal-tags').value = draft.tags.join(', ');
            document.getElementById('journal-private').checked = draft.isPrivate;

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

    startVoiceCapture() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('Browser tidak mendukung fitur voice-to-text', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Indonesian language

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                }
            }

            // Add the transcribed text to the content editor
            const contentEditor = document.getElementById('journal-content-editor');
            if (contentEditor) {
                contentEditor.innerHTML += `<p>${transcript}</p>`;
                this.showNotification('Suara berhasil ditranskripsikan', 'success');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.showNotification('Gagal mengenali suara. Pastikan mikrofon diizinkan.', 'error');
        };

        recognition.start();
        this.showNotification('Merekam suara...', 'info');
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
        const totalWords = this.entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
        const totalReadingTime = this.entries.reduce((sum, e) => sum + (e.readingTime || 0), 0);
        const avgMood = this.calculateAverageMood();
        const privateEntries = this.entries.filter(e => e.isPrivate).length;
        const favoriteEntries = this.entries.filter(e => e.isFavorite).length;
        const longestEntry = this.entries.reduce((longest, current) =>
            (current.wordCount || 0) > (longest.wordCount || 0) ? current : longest, {wordCount: 0});

        return {
            totalEntries,
            avgWordCount,
            totalWords,
            totalReadingTime,
            avgMood,
            mostCommonMood,
            currentStreak: streak,
            longestStreak: Math.max(...this.entries.map(e => this.getEntryStreak(e.date)), 0),
            privateEntries,
            favoriteEntries,
            longestEntry
        };
    },

    calculateAverageMood() {
        if (this.entries.length === 0) return 0;

        const moodValues = {
            'very-happy': 5,
            'happy': 4,
            'neutral': 3,
            'sad': 2,
            'angry': 1
        };

        const totalMoodValue = this.entries.reduce((sum, e) => sum + (moodValues[e.mood] || 3), 0);
        return totalMoodValue / this.entries.length;
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

    backupEntries() {
        const backupData = {
            entries: this.entries,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const content = JSON.stringify(backupData, null, 2);
        const filename = `journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
        const mimeType = 'application/json';

        this.downloadFile(content, filename, mimeType);
        this.showNotification('Backup journal berhasil dibuat', 'success');
    },

    restoreEntries() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);

                    if (!backupData.version || !backupData.entries) {
                        this.showNotification('File backup tidak valid', 'error');
                        return;
                    }

                    if (confirm(`Anda akan menggantikan semua journal saat ini dengan ${backupData.entries.length} entri dari backup. Lanjutkan?`)) {
                        this.entries = backupData.entries;
                        this.saveEntries();
                        this.render();
                        this.updateStats();
                        this.showNotification('Restore journal berhasil', 'success');
                    }
                } catch (error) {
                    console.error('Error restoring backup:', error);
                    this.showNotification('Gagal memulihkan backup', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
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
        const moreOptionsBtns = container.querySelectorAll('.more-options');
        const shareBtns = container.querySelectorAll('.share-btn');
        const copyBtns = container.querySelectorAll('.copy-btn');
        const printBtns = container.querySelectorAll('.print-btn');

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

        // More options dropdown
        moreOptionsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = btn.parentElement.querySelector('.more-options-menu');
                menu.classList.toggle('hidden');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.group')) {
                document.querySelectorAll('.more-options-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });

        shareBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.shareEntry(btn.dataset.date);
            });
        });

        copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.copyEntry(btn.dataset.date);
            });
        });

        printBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.printEntry(btn.dataset.date);
            });
        });
    },

    shareEntry(date) {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return;

        // Create shareable content
        const shareData = {
            title: `Journal - ${entry.date}`,
            text: `Catatan journal saya pada tanggal ${entry.date}: ${this.getExcerpt(entry.content, 100)}`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Berhasil dibagikan'))
                .catch((error) => console.error('Gagal membagikan:', error));
        } else {
            // Fallback: Copy to clipboard
            this.copyToClipboard(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
            this.showNotification('Tautan disalin ke clipboard', 'success');
        }
    },

    copyEntry(date) {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return;

        const content = this.convertToMarkdown(entry);
        this.copyToClipboard(content);
        this.showNotification('Isi journal disalin ke clipboard', 'success');
    },

    printEntry(date) {
        const entry = this.entries.find(e => e.date === date);
        if (!entry) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
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

                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    }
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Gagal menyalin teks: ', err);
        });
    },

    filterByTag(tag) {
        // Toggle tag in filter - if tag is already in the filter, remove it, otherwise add it
        if (this.filters.tags.includes(tag)) {
            this.filters.tags = this.filters.tags.filter(t => t !== tag);
        } else {
            this.filters.tags.push(tag);
        }
        this.render();
    },

    getTagCloud() {
        // Get all tags from all entries
        const allTags = this.entries.flatMap(entry => entry.tags);

        // Count occurrences of each tag
        const tagCounts = {};
        allTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        // Convert to array and sort by count
        const tagArray = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
        tagArray.sort((a, b) => b.count - a.count);

        return tagArray;
    },

    showTagCloud() {
        const tagCloud = this.getTagCloud();

        if (tagCloud.length === 0) {
            this.showNotification('Tidak ada tag untuk ditampilkan', 'info');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-800">Tag Cloud</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <p class="text-gray-600 mt-1">${this.entries.length} entri dengan ${tagCloud.length} tag berbeda</p>
                </div>

                <div class="p-6 overflow-y-auto max-h-[70vh]">
                    <div class="flex flex-wrap gap-3 justify-center" id="tag-cloud-container">
                        ${tagCloud.map(item => {
                            // Calculate font size based on count (larger for more frequent tags)
                            const minSize = 14;
                            const maxSize = 28;
                            const maxCount = Math.max(...tagCloud.map(t => t.count));
                            const fontSize = minSize + (item.count / maxCount) * (maxSize - minSize);

                            return `
                                <span class="tag-item px-4 py-2 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-center"
                                      style="font-size: ${fontSize}px; border-color: #c7d2fe; background: linear-gradient(to right, #e0e7ff, #ede9fe);"
                                      data-tag="${item.tag}">
                                    #${item.tag} <span class="bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">${item.count}</span>
                                </span>
                            `;
                        }).join('')}
                    </div>

                    <div class="mt-8">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter Berdasarkan Tag</h3>
                        <div class="flex flex-wrap gap-2">
                            ${this.filters.tags.map(tag => `
                                <span class="px-3 py-1 bg-indigo-500 text-white rounded-full flex items-center">
                                    #${tag}
                                    <button class="ml-2 text-white hover:text-gray-200" onclick="Journal.removeFilterTag('${tag}')">
                                        <i class="fas fa-times text-xs"></i>
                                    </button>
                                </span>
                            `).join('')}
                            ${this.filters.tags.length > 0 ?
                                `<button class="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300" onclick="Journal.clearTagFilters()">
                                    Hapus semua filter
                                </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners to tag items
        modal.querySelectorAll('.tag-item').forEach(tagEl => {
            tagEl.addEventListener('click', () => {
                const tag = tagEl.dataset.tag;
                this.filterByTag(tag);

                // Update the tag's appearance to show it's selected
                if (this.filters.tags.includes(tag)) {
                    tagEl.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-100');
                } else {
                    tagEl.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-100');
                }
            });
        });

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    },

    removeFilterTag(tag) {
        this.filters.tags = this.filters.tags.filter(t => t !== tag);
        this.render();

        // Update the tag cloud modal if it's open
        const tagCloudModal = document.querySelector('#tag-cloud-container');
        if (tagCloudModal) {
            const tagEl = tagCloudModal.querySelector(`[data-tag="${tag}"]`);
            if (tagEl) {
                tagEl.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-100');
            }
        }
    },

    clearTagFilters() {
        this.filters.tags = [];
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