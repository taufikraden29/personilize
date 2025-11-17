// Enhanced notes functionality with comprehensive features
const Notes = {
    notes: [],
    filters: {
        category: 'all',
        search: '',
        dateRange: 'all',
        tags: [],
        view: 'grid', // grid or list
        archived: false,
        pinned: false
    },
    sorting: {
        field: 'updatedAt',
        order: 'desc'
    },
    editor: null,
    editorModal: null,
    selectedNotes: [],
    templates: [
        { id: 'meeting', name: 'Catatan Rapat', content: '# [Judul Rapat]\n\n## Peserta\n- \n\n## Agenda\n- \n\n## Catatan Penting\n\n## Tindak Lanjut\n- [ ] ' },
        { id: 'project', name: 'Catatan Proyek', content: '# [Nama Proyek]\n\n## Tujuan\n\n## Tugas\n- [ ] \n\n## Tenggat Waktu\n\n## Catatan\n\n## Rencana Berikutnya\n' },
        { id: 'idea', name: 'Catatan Ide', content: '# [Judul Ide]\n\n## Deskripsi\n\n## Potensi Manfaat\n\n## Langkah Implementasi\n- [ ] \n\n## Sumber Inspirasi\n\n## Catatan Tambahan\n' }
    ],
    versionHistory: {},

    init() {
        this.loadNotes();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
        this.updateStats();
    },

    loadNotes() {
        const savedNotes = Storage.get('notes');
        if (savedNotes) {
            this.notes = savedNotes;
        }

        // Migrate old notes to new format if needed
        this.notes = this.notes.map(note => ({
            ...note,
            tags: note.tags || [],
            isPinned: note.isPinned || false,
            isArchived: note.isArchived || false,
            color: note.color || '#ffffff',
            attachments: note.attachments || [],
            version: note.version || 1,
            collaborators: note.collaborators || [],
            checklist: note.checklist || [],
            reminder: note.reminder || null,
            isShared: note.isShared || false,
            sharedWith: note.sharedWith || [],
            template: note.template || null,
            wordCount: note.wordCount || 0,
            readingTime: note.readingTime || 0
        }));

        this.saveNotes();
    },

    setupEventListeners() {
        // Add note button
        const addBtn = document.getElementById('add-note-btn');
        const titleInput = document.getElementById('note-title');

        if (addBtn && titleInput) {
            addBtn.addEventListener('click', () => this.addNote());
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addNote();
                }
            });
        }

        // Category buttons
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter('category', btn.dataset.category);
                this.updateCategoryButtons(btn);
                this.render();
            });
        });

        // Search input
        const searchInput = document.getElementById('search-notes');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.render();
            });
        }

        // Sort dropdown
        const sortSelect = document.getElementById('sort-notes');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const [field, order] = sortSelect.value.split('-');
                this.sorting.field = field;
                this.sorting.order = order;
                this.render();
            });
        }

        // View toggle (grid/list)
        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('change', () => {
                this.setView(viewToggle.value);
            });
        }

        // Export buttons
        const exportButtons = document.querySelectorAll('.export-note');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.target.closest('[data-note-id]').dataset.noteId;
                const format = e.target.dataset.format || 'markdown';
                this.exportNote(noteId, format);
            });
        });

        // Filter by pinned
        const pinnedFilter = document.getElementById('filter-pinned');
        if (pinnedFilter) {
            pinnedFilter.addEventListener('change', (e) => {
                this.filters.pinned = e.target.checked;
                this.render();
            });
        }

        // Filter by archived
        const archivedFilter = document.getElementById('filter-archived');
        if (archivedFilter) {
            archivedFilter.addEventListener('change', (e) => {
                this.filters.archived = e.target.checked;
                this.render();
            });
        }

        // Bulk actions
        const bulkDeleteBtn = document.getElementById('bulk-delete-notes');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteNotes());
        }

        const bulkArchiveBtn = document.getElementById('bulk-archive-notes');
        if (bulkArchiveBtn) {
            bulkArchiveBtn.addEventListener('click', () => this.bulkArchiveNotes());
        }

        const bulkPinBtn = document.getElementById('bulk-pin-notes');
        if (bulkPinBtn) {
            bulkPinBtn.addEventListener('click', () => this.bulkPinNotes());
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (App.isInputFocused()) {
                return;
            }

            // Ctrl/Cmd + N: New note
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('note-title')?.focus();
            }

            // Ctrl/Cmd + /: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                document.getElementById('search-notes')?.focus();
            }

            // Ctrl/Cmd + S: Save note (when editor is open)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.editorModal) {
                    this.saveNoteFromEditor();
                }
            }

            // Escape: Close editor
            if (e.key === 'Escape' && this.editorModal) {
                this.closeEditorModal();
            }
        });
    },

    addNote(title = '', content = '', category = 'personal') {
        const note = {
            id: Date.now(),
            title: Utils.sanitizeHTML(title) || 'Catatan Baru',
            content: content,
            category: category,
            tags: this.extractTags(title),
            isPinned: false,
            isArchived: false,
            color: '#ffffff',
            attachments: [],
            checklist: [],
            version: 1,
            collaborators: [],
            reminder: null,
            isShared: false,
            sharedWith: [],
            template: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: this.countWords(content),
            readingTime: Math.ceil(this.countWords(content) / 200)
        };

        // Validate the note before saving
        const validation = this.validateNote(note);
        if (!validation.valid) {
            this.showNotification(validation.message, 'error');
            return;
        }

        this.notes.unshift(note);
        this.saveNotes();
        this.render();
        this.updateStats();

        // Open editor for new note
        this.openNoteEditor(note.id);

        // Show notification
        this.showNotification('Catatan berhasil ditambahkan', 'success');

        // Check achievements
        this.checkAchievements();

        // Track activity
        this.trackActivity('created', note);
    },

    openNoteEditor(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        // Close any existing editor
        if (this.editorModal) {
            this.editorModal.remove();
        }

        // Create editor modal
        this.editorModal = this.createEditorModal(note);
        document.body.appendChild(this.editorModal);

        // Show modal
        this.editorModal.classList.remove('hidden');

        // Initialize rich text editor
        this.setupRichTextEditor(note.content);

        // Focus title
        document.getElementById('editor-note-title')?.focus();

        // Update auto-save indicator
        this.updateAutoSaveIndicator();
    },

    setupRichTextEditor(content = '') {
        const editorContainer = document.getElementById('note-editor');
        if (!editorContainer) return;

        // Clear previous editor if exists
        editorContainer.innerHTML = '';

        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'flex flex-wrap items-center gap-2 p-2 bg-gray-100 border-b rounded-t-lg';
        toolbar.innerHTML = `
            <button type="button" class="toolbar-btn" data-command="bold" title="Tebal">
                <i class="fas fa-bold"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="italic" title="Miring">
                <i class="fas fa-italic"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="underline" title="Garis Bawah">
                <i class="fas fa-underline"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="strikeThrough" title="Coret">
                <i class="fas fa-strikethrough"></i>
            </button>
            <div class="border-l border-gray-300 h-6 mx-1"></div>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-value="h1" title="Judul 1">
                <i class="fas fa-heading"></i><span class="ml-1">1</span>
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-value="h2" title="Judul 2">
                <i class="fas fa-heading"></i><span class="ml-1">2</span>
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-value="h3" title="Judul 3">
                <i class="fas fa-heading"></i><span class="ml-1">3</span>
            </button>
            <div class="border-l border-gray-300 h-6 mx-1"></div>
            <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Daftar">
                <i class="fas fa-list-ul"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Daftar Berurut">
                <i class="fas fa-list-ol"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertChecklist" title="Daftar Checklist">
                <i class="fas fa-list-check"></i>
            </button>
            <div class="border-l border-gray-300 h-6 mx-1"></div>
            <button type="button" class="toolbar-btn" data-command="createLink" title="Tambah Tautan">
                <i class="fas fa-link"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertImage" title="Tambah Gambar">
                <i class="fas fa-image"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertHorizontalRule" title="Garis Pemisah">
                <i class="fas fa-grip-lines"></i>
            </button>
        `;

        editorContainer.appendChild(toolbar);

        // Create contenteditable div
        const contentDiv = document.createElement('div');
        contentDiv.id = 'note-editor-content';
        contentDiv.className = 'w-full h-64 p-4 border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';
        contentDiv.contentEditable = true;
        contentDiv.innerHTML = content || '<p>Silakan mulai menulis di sini...</p>';
        contentDiv.addEventListener('input', () => {
            this.updateAutoSaveIndicator();
            this.updateWordCount();
        });

        editorContainer.appendChild(contentDiv);

        // Add event listeners to toolbar buttons
        const toolbarBtns = editorContainer.querySelectorAll('.toolbar-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                const value = btn.dataset.value;

                if (command === 'insertChecklist') {
                    this.insertChecklist();
                } else {
                    document.execCommand(command, false, value);
                }
                
                contentDiv.focus();
            });
        });

        // Update word count
        this.updateWordCount();
    },

    insertChecklist() {
        const contentDiv = document.getElementById('note-editor-content');
        if (!contentDiv) return;

        const checklistHTML = `
            <ul class="checklist">
                <li class="flex items-center">
                    <input type="checkbox" class="mr-2 checklist-item"> 
                    <span contenteditable="true">Item checklist</span>
                </li>
            </ul>
        `;
        
        document.execCommand('insertHTML', false, checklistHTML);
    },

    updateWordCount() {
        const contentDiv = document.getElementById('note-editor-content');
        if (!contentDiv) return;

        const text = contentDiv.innerText || '';
        const wordCount = this.countWords(text);
        const readingTime = Math.ceil(wordCount / 200);

        document.getElementById('editor-word-count').textContent = wordCount;
        document.getElementById('editor-reading-time').textContent = readingTime;
    },

    updateAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.textContent = 'Perubahan otomatis disimpan...';
            indicator.className = 'text-green-600 text-sm italic';
            
            setTimeout(() => {
                if (indicator) {
                    indicator.textContent = 'Siap menyimpan...';
                    indicator.className = 'text-gray-500 text-sm italic';
                }
            }, 2000);
        }
    },

    saveNoteFromEditor() {
        if (!this.editorModal) return;

        const noteId = this.editorModal.dataset.noteId;
        const note = this.notes.find(n => n.id === parseInt(noteId));
        if (!note) return;

        const title = Utils.sanitizeHTML(document.getElementById('editor-note-title').value);
        const category = document.getElementById('editor-note-category').value;
        const tags = document.getElementById('editor-note-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        const content = Utils.sanitizeHTML(document.getElementById('note-editor-content').innerHTML);
        const checklist = this.getUpdatedChecklist();

        // Update note
        note.title = title;
        note.category = category;
        note.tags = tags;
        note.content = content;
        note.checklist = checklist;
        note.updatedAt = new Date().toISOString();
        note.wordCount = this.countWords(content);
        note.readingTime = Math.ceil(note.wordCount / 200);

        // Save to version history
        this.saveVersionHistory(note);

        this.saveNotes();
        this.render();
        this.updateStats();

        this.showNotification('Catatan berhasil disimpan', 'success');
        this.trackActivity('updated', note);
    },

    getUpdatedChecklist() {
        const contentDiv = document.getElementById('note-editor-content');
        if (!contentDiv) return [];

        const checklistItems = contentDiv.querySelectorAll('input[type="checkbox"]');
        const checklist = [];

        checklistItems.forEach((checkbox, index) => {
            const listItem = checkbox.closest('li');
            const textElement = listItem ? listItem.querySelector('span') : null;
            const text = textElement ? textElement.textContent : `Item ${index + 1}`;

            checklist.push({
                id: Date.now() + index,
                text: text,
                completed: checkbox.checked,
                createdAt: new Date().toISOString()
            });
        });

        return checklist;
    },

    saveVersionHistory(note) {
        if (!this.versionHistory[note.id]) {
            this.versionHistory[note.id] = [];
        }

        // Add current version to history
        this.versionHistory[note.id].unshift({
            ...note,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 versions
        if (this.versionHistory[note.id].length > 10) {
            this.versionHistory[note.id].pop();
        }
    },

    closeEditorModal() {
        if (this.editorModal) {
            this.editorModal.remove();
            this.editorModal = null;
        }
    },

    updateNote(id, updates) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex === -1) return;

        // Save current version to history
        this.saveVersionHistory(this.notes[noteIndex]);

        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            ...updates,
            version: (this.notes[noteIndex].version || 1) + 1,
            updatedAt: new Date().toISOString()
        };

        this.saveNotes();
        this.render();
        this.updateStats();

        this.showNotification('Catatan berhasil diperbarui', 'success');
        this.trackActivity('updated', this.notes[noteIndex]);
    },

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex === -1) return;

        const note = this.notes[noteIndex];

        if (confirm(`Apakah Anda yakin ingin menghapus catatan "${note.title}"?`)) {
            this.notes.splice(noteIndex, 1);
            this.saveNotes();
            this.render();
            this.updateStats();

            this.showNotification('Catatan berhasil dihapus', 'success');
            this.trackActivity('deleted', note);
        }
    },

    duplicateNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const duplicatedNote = {
            ...note,
            id: Date.now(),
            title: `${note.title} (Salinan)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(duplicatedNote);
        this.saveNotes();
        this.render();

        this.showNotification('Catatan berhasil diduplikasi', 'success');
    },

    togglePin(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        note.isPinned = !note.isPinned;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();

        this.showNotification(
            note.isPinned ? 'Catatan disematkan' : 'Sematan dilepas',
            'success'
        );
    },

    toggleArchive(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        note.isArchived = !note.isArchived;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();
        this.updateStats();

        this.showNotification(
            note.isArchived ? 'Catatan diarsipkan' : 'Catatan dikembalikan dari arsip',
            'success'
        );
    },

    changeColor(id, color) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        note.color = color;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();
    },

    addTag(id, tag) {
        const note = this.notes.find(n => n.id === id);
        if (!note || !tag.trim()) return;

        if (!note.tags.includes(tag.trim())) {
            note.tags.push(tag.trim());
            note.updatedAt = new Date().toISOString();

            this.saveNotes();
            this.render();

            this.showNotification('Tag berhasil ditambahkan', 'success');
        }
    },

    removeTag(id, tag) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const tagIndex = note.tags.indexOf(tag);
        if (tagIndex > -1) {
            note.tags.splice(tagIndex, 1);
            note.updatedAt = new Date().toISOString();

            this.saveNotes();
            this.render();

            this.showNotification('Tag berhasil dihapus', 'success');
        }
    },

    addChecklistItem(id, text) {
        const note = this.notes.find(n => n.id === id);
        if (!note || !text.trim()) return;

        const checklistItem = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        note.checklist.push(checklistItem);
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();

        this.showNotification('Item checklist berhasil ditambahkan', 'success');
    },

    toggleChecklistItem(noteId, itemId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        const item = note.checklist.find(i => i.id === itemId);
        if (!item) return;

        item.completed = !item.completed;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();
    },

    addAttachment(id, file) {
        const note = this.notes.find(n => n.id === id);
        if (!note || !file) return;

        const attachment = {
            id: Date.now(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            uploadedAt: new Date().toISOString()
        };

        note.attachments.push(attachment);
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();

        this.showNotification('Lampiran berhasil ditambahkan', 'success');
    },

    removeAttachment(id, attachmentId) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const attachmentIndex = note.attachments.findIndex(a => a.id === attachmentId);
        if (attachmentIndex > -1) {
            note.attachments.splice(attachmentIndex, 1);
            note.updatedAt = new Date().toISOString();

            this.saveNotes();
            this.render();

            this.showNotification('Lampiran berhasil dihapus', 'success');
        }
    },

    setReminder(id, reminderDate) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        note.reminder = reminderDate;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();

        this.showNotification('Pengingat berhasil disetel', 'success');
    },

    shareNote(id, email) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        if (!email) {
            email = prompt('Masukkan email untuk berbagi catatan:');
            if (!email) return;
        }

        note.sharedWith.push(email);
        note.isShared = true;
        note.updatedAt = new Date().toISOString();

        this.saveNotes();
        this.render();

        this.showNotification(`Catatan dibagikan ke ${email}`, 'success');
    },

    exportNote(id, format = 'markdown') {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
            case 'markdown':
                content = this.convertToMarkdown(note);
                filename = `${note.title}.md`;
                mimeType = 'text/markdown';
                break;
            case 'html':
                content = this.convertToHTML(note);
                filename = `${note.title}.html`;
                mimeType = 'text/html';
                break;
            case 'txt':
                content = this.convertToText(note);
                filename = `${note.title}.txt`;
                mimeType = 'text/plain';
                break;
            case 'pdf':
                // For PDF export, we'll use html2pdf library if available
                if (typeof html2pdf !== 'undefined') {
                    const element = document.createElement('div');
                    element.innerHTML = this.convertToHTML(note);
                    html2pdf().from(element).save(`${note.title}.pdf`);
                    this.showNotification('Catatan diekspor sebagai PDF', 'success');
                    return;
                } else {
                    this.showNotification('Library html2pdf tidak tersedia', 'error');
                    return;
                }
        }

        this.downloadFile(content, filename, mimeType);
        this.showNotification(`Catatan diekspor sebagai ${format}`, 'success');
    },

    convertToMarkdown(note) {
        let markdown = `# ${note.title}\n\n`;

        if (note.tags.length > 0) {
            markdown += `Tags: ${note.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
        }

        markdown += note.content;

        if (note.checklist.length > 0) {
            markdown += '\n\n## Checklist\n\n';
            note.checklist.forEach(item => {
                markdown += `- [${item.completed ? 'x' : ' '}] ${item.text}\n`;
            });
        }

        return markdown;
    },

    convertToHTML(note) {
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${note.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .tags { color: #666; margin-bottom: 20px; }
        .checklist { margin: 20px 0; }
        .checklist-item { margin: 5px 0; }
        .metadata { color: #888; font-size: 0.9em; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    <div class="metadata">Dibuat: ${new Date(note.createdAt).toLocaleString('id-ID')}</div>
    <div class="metadata">Diperbarui: ${new Date(note.updatedAt).toLocaleString('id-ID')}</div>
    ${note.tags.length > 0 ? `<div class="tags">Tags: ${note.tags.join(', ')}</div>` : ''}
    <div>${note.content}</div>
    ${note.checklist.length > 0 ? `
        <div class="checklist">
            <h2>Checklist</h2>
            ${note.checklist.map(item => `
                <div class="checklist-item">
                    <input type="checkbox" ${item.completed ? 'checked' : ''} disabled>
                    ${item.text}
                </div>
            `).join('')}
        </div>
    ` : ''}
</body>
</html>`;

        return html;
    },

    convertToText(note) {
        let text = `${note.title}\n`;
        text += '='.repeat(note.title.length) + '\n\n';

        if (note.tags.length > 0) {
            text += `Tags: ${note.tags.join(', ')}\n\n`;
        }

        text += note.content.replace(/<[^>]*>/g, '');

        if (note.checklist.length > 0) {
            text += '\n\nChecklist:\n';
            note.checklist.forEach(item => {
                text += `${item.completed ? '[✓]' : '[ ]'} ${item.text}\n`;
            });
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

    setFilter(filterType, value) {
        this.filters[filterType] = value;
    },

    getFilteredNotes() {
        let filtered = [...this.notes];

        // Exclude archived notes unless specifically filtered
        if (this.filters.category !== 'archived' && !this.filters.archived) {
            filtered = filtered.filter(n => !n.isArchived);
        }

        // Category filter
        if (this.filters.category !== 'all') {
            if (this.filters.category === 'archived') {
                filtered = this.notes.filter(n => n.isArchived);
            } else {
                filtered = filtered.filter(n => n.category === this.filters.category);
            }
        }

        // Pinned filter
        if (this.filters.pinned) {
            filtered = filtered.filter(n => n.isPinned);
        }

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(this.filters.search) ||
                n.content.toLowerCase().includes(this.filters.search) ||
                n.tags.some(tag => tag.toLowerCase().includes(this.filters.search))
            );
        }

        // Tags filter
        if (this.filters.tags.length > 0) {
            filtered = filtered.filter(n =>
                this.filters.tags.some(tag => n.tags.includes(tag))
            );
        }

        // Sort notes: pinned first, then by selected field
        filtered.sort((a, b) => {
            // Pinned notes always come first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Then sort by selected field
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
        const notesList = document.getElementById('notes-list');
        if (!notesList) return;

        const filteredNotes = this.getFilteredNotes();

        // Show loading state
        notesList.innerHTML = '<div class="loading h-40 rounded"></div>'.repeat(6);

        // Simulate loading delay for better UX
        setTimeout(() => {
            if (filteredNotes.length === 0) {
                notesList.innerHTML = `
                    <div class="text-center py-8 col-span-full">
                        <i class="fas fa-sticky-note text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Tidak ada catatan ditemukan</p>
                        <button class="mt-4 text-indigo-600 hover:text-indigo-800" onclick="Notes.clearFilters()">
                            Hapus filter
                        </button>
                    </div>
                `;
                return;
            }

            // Set view class
            if (this.filters.view === 'list') {
                notesList.className = 'space-y-4';
            } else {
                notesList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
            }

            notesList.innerHTML = '';

            filteredNotes.forEach(note => {
                const noteEl = this.createNoteElement(note);
                notesList.appendChild(noteEl);
            });

            // Update stats
            this.updateFilterStats(filteredNotes);
        }, 300);
    },

    createNoteElement(note) {
        const noteEl = document.createElement('div');
        noteEl.className = `note-card note-category-${note.category} ${note.isPinned ? 'pinned' : ''}`;
        noteEl.style.backgroundColor = note.color + '20';
        noteEl.style.borderLeftColor = note.color;
        noteEl.dataset.id = note.id;
        noteEl.dataset.noteId = note.id;

        const excerpt = this.getExcerpt(note.content, 100);
        const wordCount = note.wordCount || this.countWords(note.content);
        const readingTime = note.readingTime || Math.ceil(wordCount / 200);

        // Determine if it's a list view
        const isListView = this.filters.view === 'list';

        if (isListView) {
            noteEl.innerHTML = `
                <div class="flex items-start p-4">
                    <div class="flex-shrink-0 mr-4">
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl" style="background-color: ${note.color};">
                            <i class="fas fa-sticky-note"></i>
                        </div>
                    </div>
                    
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">
                                ${this.highlightSearch(note.title)}
                            </h3>
                            <div class="flex items-center space-x-2">
                                ${note.isPinned ? '<i class="fas fa-thumbtack text-yellow-500" title="Disematkan"></i>' : ''}
                                ${note.isArchived ? '<i class="fas fa-archive text-gray-500" title="Diarsipkan"></i>' : ''}
                            </div>
                        </div>

                        <p class="text-gray-600 mb-3 line-clamp-2">
                            ${this.highlightSearch(excerpt)}
                        </p>

                        ${note.checklist.length > 0 ? `
                            <div class="mb-3">
                                <div class="flex items-center text-sm text-gray-500 mb-1">
                                    <i class="fas fa-tasks mr-1"></i>
                                    <span>${note.checklist.filter(item => item.completed).length}/${note.checklist.length} selesai</span>
                                </div>
                                <div class="progress-bar w-32">
                                    <div class="progress-fill bg-green-500" style="width: ${this.getChecklistProgress(note)}%"></div>
                                </div>
                            </div>
                        ` : ''}

                        <div class="flex flex-wrap gap-1 mb-3">
                            ${note.tags.map(tag => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full cursor-pointer hover:bg-gray-200"
                                      onclick="Notes.filterByTag('${tag}')">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>

                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <div class="flex items-center space-x-3">
                                <span><i class="fas fa-folder mr-1"></i>${this.getCategoryLabel(note.category)}</span>
                                <span><i class="fas fa-clock mr-1"></i>${readingTime} menit</span>
                                ${wordCount > 0 ? `<span><i class="fas fa-file-word mr-1"></i>${wordCount} kata</span>` : ''}
                            </div>
                            <span>${this.formatDate(note.updatedAt)}</span>
                        </div>
                    </div>

                    <div class="flex space-x-1 ml-4">
                        <button class="p-2 text-blue-500 hover:text-blue-700" onclick="Notes.openNoteEditor(${note.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="p-2 text-green-500 hover:text-green-700" onclick="Notes.duplicateNote(${note.id})" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="p-2 text-yellow-500 hover:text-yellow-700" onclick="Notes.togglePin(${note.id})" title="Pin">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                        <button class="p-2 text-purple-500 hover:text-purple-700" onclick="Notes.changeNoteColor(${note.id})" title="Color">
                            <i class="fas fa-palette"></i>
                        </button>
                        <button class="p-2 text-indigo-500 hover:text-indigo-700" onclick="Notes.shareNote(${note.id})" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="p-2 text-gray-500 hover:text-gray-700" onclick="Notes.toggleArchive(${note.id})" title="Archive">
                            <i class="fas fa-archive"></i>
                        </button>
                        <button class="p-2 text-red-500 hover:text-red-700" onclick="Notes.deleteNote(${note.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Grid view
            noteEl.innerHTML = `
                <div class="relative">
                    ${note.isPinned ? '<i class="fas fa-thumbtack absolute top-2 right-2 text-yellow-500"></i>' : ''}

                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">
                            ${this.highlightSearch(note.title)}
                        </h3>

                        <p class="text-gray-600 mb-3 line-clamp-3">
                            ${this.highlightSearch(excerpt)}
                        </p>

                        ${note.checklist.length > 0 ? `
                            <div class="mb-3">
                                <div class="flex items-center text-sm text-gray-500 mb-1">
                                    <i class="fas fa-tasks mr-1"></i>
                                    <span>${note.checklist.filter(item => item.completed).length}/${note.checklist.length} selesai</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill bg-green-500" style="width: ${this.getChecklistProgress(note)}%"></div>
                                </div>
                            </div>
                        ` : ''}

                        <div class="flex flex-wrap gap-1 mb-3">
                            ${note.tags.map(tag => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full cursor-pointer hover:bg-gray-200"
                                      onclick="Notes.filterByTag('${tag}')">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>

                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <div class="flex items-center space-x-3">
                                <span><i class="fas fa-folder mr-1"></i>${this.getCategoryLabel(note.category)}</span>
                                <span><i class="fas fa-clock mr-1"></i>${readingTime} menit</span>
                                ${wordCount > 0 ? `<span><i class="fas fa-file-word mr-1"></i>${wordCount} kata</span>` : ''}
                            </div>
                            <span>${this.formatDate(note.updatedAt)}</span>
                        </div>
                    </div>

                    <div class="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div class="flex space-x-1">
                            <button class="p-1 text-blue-500 hover:text-blue-700" onclick="Notes.openNoteEditor(${note.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="p-1 text-green-500 hover:text-green-700" onclick="Notes.duplicateNote(${note.id})" title="Duplicate">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="p-1 text-yellow-500 hover:text-yellow-700" onclick="Notes.togglePin(${note.id})" title="Pin">
                                <i class="fas fa-thumbtack"></i>
                            </button>
                            <button class="p-1 text-purple-500 hover:text-purple-700" onclick="Notes.changeNoteColor(${note.id})" title="Color">
                                <i class="fas fa-palette"></i>
                            </button>
                            <button class="p-1 text-indigo-500 hover:text-indigo-700" onclick="Notes.shareNote(${note.id})" title="Share">
                                <i class="fas fa-share"></i>
                            </button>
                            <button class="p-1 text-gray-500 hover:text-gray-700" onclick="Notes.toggleArchive(${note.id})" title="Archive">
                                <i class="fas fa-archive"></i>
                            </button>
                            <button class="p-1 text-red-500 hover:text-red-700" onclick="Notes.deleteNote(${note.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Add hover effect
        noteEl.addEventListener('mouseenter', () => {
            const hoverActions = noteEl.querySelector('.absolute');
            if (hoverActions) {
                hoverActions.classList.remove('opacity-0');
            }
        });

        noteEl.addEventListener('mouseleave', () => {
            const hoverActions = noteEl.querySelector('.absolute');
            if (hoverActions) {
                hoverActions.classList.add('opacity-0');
            }
        });

        // Add click event to open note
        noteEl.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openNoteEditor(note.id);
            }
        });

        return noteEl;
    },

    createEditorModal(note) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
        modal.dataset.noteId = note.id;
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
                <div class="flex justify-between items-center p-4 border-b">
                    <input type="text" id="editor-note-title" value="${note.title}"
                           class="text-xl font-semibold bg-transparent border-none outline-none flex-grow"
                           placeholder="Judul catatan...">
                    <div class="flex items-center space-x-2">
                        <button class="p-2 text-gray-500 hover:text-gray-700" onclick="Notes.changeNoteColor(${note.id})" title="Color">
                            <i class="fas fa-palette"></i>
                        </button>
                        <button class="p-2 text-gray-500 hover:text-gray-700" onclick="Notes.shareNote(${note.id})" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <div class="relative group">
                            <button class="p-2 text-gray-500 hover:text-gray-700" title="Export">
                                <i class="fas fa-download"></i>
                            </button>
                            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 hidden group-hover:block z-10">
                                <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="Notes.exportNote(${note.id}, 'markdown')">Export Markdown</button>
                                <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="Notes.exportNote(${note.id}, 'html')">Export HTML</button>
                                <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="Notes.exportNote(${note.id}, 'txt')">Export TXT</button>
                                <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="Notes.exportNote(${note.id}, 'pdf')">Export PDF</button>
                            </div>
                        </div>
                        <button class="p-2 text-gray-500 hover:text-gray-700" onclick="Notes.closeEditorModal()" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="flex flex-1 overflow-hidden">
                    <div class="w-64 bg-gray-50 p-4 border-r overflow-y-auto">
                        <div class="space-y-4">
                            <div>
                                <label class="form-label">Kategori</label>
                                <select id="editor-note-category" class="form-input">
                                    <option value="personal" ${note.category === 'personal' ? 'selected' : ''}>Pribadi</option>
                                    <option value="work" ${note.category === 'work' ? 'selected' : ''}>Pekerjaan</option>
                                    <option value="ideas" ${note.category === 'ideas' ? 'selected' : ''}>Ide</option>
                                    <option value="shopping" ${note.category === 'shopping' ? 'selected' : ''}>Belanja</option>
                                    <option value="health" ${note.category === 'health' ? 'selected' : ''}>Kesehatan</option>
                                </select>
                            </div>

                            <div>
                                <label class="form-label">Tags</label>
                                <input type="text" id="editor-note-tags" value="${note.tags.join(', ')}"
                                       class="form-input" placeholder="tag1, tag2, tag3">
                            </div>

                            <div>
                                <label class="form-label">Checklist</label>
                                <div id="editor-checklist" class="space-y-2">
                                    ${note.checklist.map(item => `
                                        <div class="flex items-center space-x-2">
                                            <input type="checkbox" ${item.completed ? 'checked' : ''}
                                                   data-item-id="${item.id}" class="checklist-item">
                                            <input type="text" value="${item.text}"
                                                   data-item-id="${item.id}" class="checklist-text flex-grow form-input text-sm">
                                            <button type="button" class="remove-checklist-item text-red-500 hover:text-red-700" 
                                                    data-item-id="${item.id}">
                                                <i class="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" id="add-checklist-item" class="text-indigo-600 hover:text-indigo-800 text-sm mt-2">
                                    <i class="fas fa-plus mr-1"></i> Tambah Item
                                </button>
                            </div>

                            <div>
                                <label class="form-label">Statistik</label>
                                <div class="text-sm text-gray-600">
                                    <div class="flex justify-between">
                                        <span>Kata:</span>
                                        <span id="editor-word-count">${note.wordCount || this.countWords(note.content)}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Waktu Baca:</span>
                                        <span id="editor-reading-time">${note.readingTime || Math.ceil(this.countWords(note.content) / 200)} menit</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="form-label">Dibuat</label>
                                <p class="text-sm text-gray-500">${new Date(note.createdAt).toLocaleString('id-ID')}</p>
                            </div>

                            <div>
                                <label class="form-label">Diperbarui</label>
                                <p class="text-sm text-gray-500" id="last-updated">${new Date(note.updatedAt).toLocaleString('id-ID')}</p>
                            </div>

                            <div class="pt-4 space-y-2">
                                <button class="w-full btn btn-primary" onclick="Notes.saveNoteFromEditor()">
                                    <i class="fas fa-save mr-1"></i> Simpan
                                </button>
                                <button class="w-full btn btn-ghost" onclick="Notes.togglePin(${note.id})">
                                    <i class="fas fa-thumbtack mr-1"></i> ${note.isPinned ? 'Lepas Sematan' : 'Sematkan'}
                                </button>
                                <button class="w-full btn btn-ghost text-red-600 hover:text-red-700" onclick="Notes.deleteNote(${note.id})">
                                    <i class="fas fa-trash mr-1"></i> Hapus
                                </button>
                            </div>

                            <div>
                                <label class="form-label">Status Auto-Save</label>
                                <p id="auto-save-indicator" class="text-sm text-gray-500 italic">Siap menyimpan...</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 p-4 overflow-y-auto">
                        <div id="note-editor" class="min-h-full">
                            <!-- Rich text editor will be initialized here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEditorModalEventListeners(modal, note);

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

    getExcerpt(content, maxLength) {
        if (!content) return '';

        // Remove HTML tags for excerpt
        const text = content.replace(/<[^>]*>/g, '');

        if (text.length <= maxLength) return text;

        return text.substring(0, maxLength).trim() + '...';
    },

    countWords(content) {
        if (!content) return 0;

        // Remove HTML tags and count words
        const text = content.replace(/<[^>]*>/g, '');
        return text.trim().split(/\s+/).length;
    },

    getChecklistProgress(note) {
        if (note.checklist.length === 0) return 0;

        const completed = note.checklist.filter(item => item.completed).length;
        return Math.round((completed / note.checklist.length) * 100);
    },

    getCategoryLabel(category) {
        const labels = {
            personal: 'Pribadi',
            work: 'Pekerjaan',
            ideas: 'Ide',
            shopping: 'Belanja',
            health: 'Kesehatan'
        };

        return labels[category] || category;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hari ini';
        } else if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays < 7) {
            return `${diffDays} hari lalu`;
        } else if (diffDays < 30) {
            return `${Math.floor(diffDays / 7)} minggu lalu`;
        } else {
            return date.toLocaleDateString('id-ID');
        }
    },

    changeNoteColor(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        // Create color picker modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-80">
                <h3 class="text-lg font-semibold mb-4">Pilih Warna</h3>
                <div class="grid grid-cols-6 gap-2 mb-4">
                    <button class="color-option w-10 h-10 rounded" style="background-color: #ffffff" data-color="#ffffff"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #fef3c7" data-color="#fef3c7"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #fde68a" data-color="#fde68a"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #fcd34d" data-color="#fcd34d"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #fbbf24" data-color="#fbbf24"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #f59e0b" data-color="#f59e0b"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #f87171" data-color="#f87171"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #ef4444" data-color="#ef4444"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #dc2626" data-color="#dc2626"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #b91c1c" data-color="#b91c1c"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #991b1b" data-color="#991b1b"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #7f1d1d" data-color="#7f1d1d"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #ddd6fe" data-color="#ddd6fe"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #c4b5fd" data-color="#c4b5fd"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #a78bfa" data-color="#a78bfa"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #8b5cf6" data-color="#8b5cf6"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #7c3aed" data-color="#7c3aed"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #6d28d9" data-color="#6d28d9"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #bfdbfe" data-color="#bfdbfe"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #93c5fd" data-color="#93c5fd"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #60a5fa" data-color="#60a5fa"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #3b82f6" data-color="#3b82f6"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #2563eb" data-color="#2563eb"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #1d4ed8" data-color="#1d4ed8"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #a7f3d0" data-color="#a7f3d0"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #6ee7b7" data-color="#6ee7b7"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #34d399" data-color="#34d399"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #10b981" data-color="#10b981"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #059669" data-color="#059669"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #047857" data-color="#047857"></button>
                    <button class="color-option w-10 h-10 rounded" style="background-color: #d1fae5" data-color="#d1fae5"></button>
                </div>
                <div class="flex justify-end space-x-2">
                    <button class="btn btn-ghost" onclick="this.closest('.fixed').remove()">
                        Batal
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners to color options
        const colorOptions = modal.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                this.changeColor(id, color);
                modal.remove();
            });
        });

        // Highlight current color
        const currentColorOption = modal.querySelector(`[data-color="${note.color}"]`);
        if (currentColorOption) {
            currentColorOption.classList.add('ring-2', 'ring-indigo-500');
        }
    },

    filterByTag(tag) {
        this.filters.tags = [tag];
        this.render();
    },

    setView(viewType) {
        this.filters.view = viewType;
        this.render();
    },

    updateCategoryButtons(activeBtn) {
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.classList.remove('bg-indigo-200');
        });
        activeBtn.classList.add('bg-indigo-200');
    },

    updateFilterStats(filteredNotes) {
        const statsEl = document.getElementById('filter-stats');
        if (!statsEl) return;

        const total = this.notes.length;
        const archived = this.notes.filter(n => n.isArchived).length;
        const pinned = this.notes.filter(n => n.isPinned).length;

        statsEl.innerHTML = `
            <span class="text-sm text-gray-500">
                Menampilkan ${filteredNotes.length} dari ${total} catatan: ${pinned} disematkan, ${archived} diarsipkan
            </span>
        `;
    },

    clearFilters() {
        this.filters = {
            category: 'all',
            search: '',
            dateRange: 'all',
            tags: [],
            view: 'grid',
            archived: false,
            pinned: false
        };

        // Reset UI
        document.getElementById('search-notes').value = '';
        document.getElementById('sort-notes').value = 'updatedAt-desc';
        document.getElementById('view-toggle').value = 'grid';
        document.getElementById('filter-pinned').checked = false;
        document.getElementById('filter-archived').checked = false;

        this.render();
    },

    saveNotes() {
        try {
            Storage.set('notes', this.notes);
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showNotification('Gagal menyimpan catatan. Data mungkin tidak disimpan secara permanen.', 'error');
        }
    },

    updateStats() {
        const notesCount = document.getElementById('notes-count');
        if (notesCount) {
            notesCount.textContent = this.notes.filter(n => !n.isArchived).length;
        }
    },

    checkAchievements() {
        const data = {
            totalNotes: this.notes.length
        };

        Achievements.checkAchievements(data);
    },

    trackActivity(action, note) {
        const activity = {
            type: 'note',
            action: action,
            noteId: note.id,
            noteTitle: note.title,
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
    attachEditorModalEventListeners(modal, note) {
        const addChecklistBtn = modal.querySelector('#add-checklist-item');

        if (addChecklistBtn) {
            addChecklistBtn.addEventListener('click', () => {
                this.addNewChecklistItem();
            });
        }

        // Add event listeners to existing checklist items
        this.attachChecklistEventListeners(modal);
    },

    attachChecklistEventListeners(modal) {
        const removeBtns = modal.querySelectorAll('.remove-checklist-item');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.flex').remove();
            });
        });

        const checkboxInputs = modal.querySelectorAll('.checklist-item');
        checkboxInputs.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const textInput = modal.querySelector(`[data-item-id="${e.target.dataset.itemId}"]`);
                if (textInput) {
                    textInput.style.textDecoration = e.target.checked ? 'line-through' : 'none';
                }
            });
        });
    },

    addNewChecklistItem() {
        const checklistContainer = document.getElementById('editor-checklist');
        const newItemId = Date.now();

        const checklistItem = document.createElement('div');
        checklistItem.className = 'flex items-center space-x-2';
        checklistItem.innerHTML = `
            <input type="checkbox" data-item-id="${newItemId}" class="checklist-item">
            <input type="text" data-item-id="${newItemId}" class="checklist-text flex-grow form-input text-sm"
                   placeholder="Masukkan item checklist...">
            <button class="remove-checklist-item text-red-500 hover:text-red-700" data-item-id="${newItemId}">
                <i class="fas fa-trash text-xs"></i>
            </button>
        `;

        checklistContainer.appendChild(checklistItem);

        // Add event listeners
        const removeBtn = checklistItem.querySelector('.remove-checklist-item');
        removeBtn.addEventListener('click', (e) => {
            e.target.closest('.flex').remove();
        });

        // Focus on new input
        checklistItem.querySelector('.checklist-text').focus();
    },

    // Bulk operations
    bulkDeleteNotes() {
        if (this.selectedNotes.length === 0) {
            this.showNotification('Pilih catatan untuk dihapus', 'warning');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus ${this.selectedNotes.length} catatan?`)) {
            this.selectedNotes.forEach(id => {
                const noteIndex = this.notes.findIndex(n => n.id === id);
                if (noteIndex !== -1) {
                    this.notes.splice(noteIndex, 1);
                }
            });

            this.saveNotes();
            this.render();
            this.updateStats();
            this.selectedNotes = [];

            this.showNotification(`${this.selectedNotes.length} catatan berhasil dihapus`, 'success');
        }
    },

    bulkArchiveNotes() {
        if (this.selectedNotes.length === 0) {
            this.showNotification('Pilih catatan untuk diarsipkan', 'warning');
            return;
        }

        this.selectedNotes.forEach(id => {
            const note = this.notes.find(n => n.id === id);
            if (note) {
                note.isArchived = true;
                note.updatedAt = new Date().toISOString();
            }
        });

        this.saveNotes();
        this.render();
        this.updateStats();
        this.selectedNotes = [];

        this.showNotification(`${this.selectedNotes.length} catatan berhasil diarsipkan`, 'success');
    },

    bulkPinNotes() {
        if (this.selectedNotes.length === 0) {
            this.showNotification('Pilih catatan untuk disematkan', 'warning');
            return;
        }

        this.selectedNotes.forEach(id => {
            const note = this.notes.find(n => n.id === id);
            if (note) {
                note.isPinned = !note.isPinned;
                note.updatedAt = new Date().toISOString();
            }
        });

        this.saveNotes();
        this.render();
        this.selectedNotes = [];

        this.showNotification(`${this.selectedNotes.length} catatan berhasil ${this.selectedNotes[0].isPinned ? 'disematkan' : 'dilepas sematannya'}`, 'success');
    },

    // Quick capture functionality
    quickCapture(text, type = 'note') {
        if (type === 'note') {
            this.addNote('Catatan Cepat', text, 'personal');
        } else if (type === 'todo') {
            if (typeof Todo !== 'undefined') {
                Todo.addTodo(text);
            }
        } else if (type === 'journal') {
            if (typeof Journal !== 'undefined') {
                Journal.addEntry(text);
            }
        }
    },

    // Template functionality
    applyTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const note = {
            id: Date.now(),
            title: template.name,
            content: template.content,
            category: 'personal',
            tags: [],
            isPinned: false,
            isArchived: false,
            color: '#ffffff',
            attachments: [],
            checklist: [],
            version: 1,
            collaborators: [],
            reminder: null,
            isShared: false,
            sharedWith: [],
            template: templateId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.render();
        this.updateStats();

        this.openNoteEditor(note.id);
    },

    // Version history
    getVersionHistory(noteId) {
        return this.versionHistory[noteId] || [];
    },

    // Search within note content
    searchInNote(noteId, searchTerm) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return [];

        const regex = new RegExp(searchTerm, 'gi');
        const matches = note.content.match(regex);
        return matches || [];
    },

    // Validate note input data
    validateNote(note) {
        if (!note || typeof note !== 'object') {
            return { valid: false, message: 'Catatan data tidak valid' };
        }

        if (!note.title || typeof note.title !== 'string' || note.title.trim().length === 0) {
            return { valid: false, message: 'Judul catatan tidak boleh kosong' };
        }

        if (note.title.length > 100) {
            return { valid: false, message: 'Judul catatan terlalu panjang (maksimal 100 karakter)' };
        }

        if (note.content && typeof note.content !== 'string') {
            return { valid: false, message: 'Konten catatan harus berupa string' };
        }

        if (note.content && note.content.length > 100000) {
            return { valid: false, message: 'Konten catatan terlalu panjang (maksimal 100000 karakter)' };
        }

        if (note.tags && Array.isArray(note.tags)) {
            for (let i = 0; i < note.tags.length; i++) {
                const tag = note.tags[i];
                if (typeof tag !== 'string' || tag.trim().length === 0) {
                    return { valid: false, message: `Tag ke-${i} tidak valid: tag tidak boleh kosong` };
                }
                if (tag.length > 30) {
                    return { valid: false, message: `Tag ke-${i} terlalu panjang (maksimal 30 karakter)` };
                }
            }
        }

        if (note.category && typeof note.category !== 'string') {
            return { valid: false, message: 'Kategori catatan tidak valid' };
        }

        return { valid: true };
    }
};