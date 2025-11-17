// Enhanced quick capture functionality
const QuickCapture = {
    isModalOpen: false,
    shortcuts: [],
    templates: [],
    recentCaptures: [],

    init() {
        this.loadTemplates();
        this.loadRecentCaptures();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupVoiceCapture();
    },

    loadTemplates() {
        const savedTemplates = Storage.get('quick-capture-templates');
        if (savedTemplates) {
            this.templates = savedTemplates;
        } else {
            this.templates = this.getDefaultTemplates();
            Storage.set('quick-capture-templates', this.templates);
        }
    },

    loadRecentCaptures() {
        const saved = Storage.get('quick-capture-recent');
        if (saved) {
            this.recentCaptures = saved;
        } else {
            this.recentCaptures = [];
            Storage.set('quick-capture-recent', this.recentCaptures);
        }
    },

    getDefaultTemplates() {
        return [
            {
                id: 'quick-task',
                name: 'Tugas Cepat',
                icon: 'fa-tasks',
                type: 'todo',
                template: '[Tugas] - {keterangan}',
                category: 'personal',
                priority: 'medium'
            },
            {
                id: 'quick-note',
                name: 'Catatan Cepat',
                icon: 'fa-sticky-note',
                type: 'note',
                template: '[Judul] - {isi}',
                category: 'ideas'
            },
            {
                id: 'quick-idea',
                name: 'Ide Cepat',
                icon: 'fa-lightbulb',
                type: 'note',
                template: '💡 Ide: {isi}',
                category: 'ideas'
            },
            {
                id: 'quick-meeting',
                name: 'Catatan Meeting',
                icon: 'fa-users',
                type: 'note',
                template: '📅 Meeting - {topik}\n\nPeserta:\n- {peserta}\n\nCatatan:\n{isi}',
                category: 'work'
            },
            {
                id: 'quick-goal',
                name: 'Tujuan Cepat',
                icon: 'fa-bullseye',
                type: 'goal',
                template: '🎯 Tujuan: {judul}\n\nDeadline: {deadline}\n\nDeskripsi: {deskripsi}',
                category: 'personal'
            },
            {
                id: 'quick-journal',
                name: 'Journal Cepat',
                icon: 'fa-book',
                type: 'journal',
                template: '📔 Journal - {tanggal}\n\nMood: {mood}\n\nIsyarat syukur:\n- {syukur 1}\n- {syukur 2}\n- {syukur 3}\n\nRefleksi:\n{refleksi}',
                category: 'personal'
            }
        ];
    },

    setupEventListeners() {
        const quickCaptureBtn = document.getElementById('quick-capture');
        const modal = document.getElementById('quick-capture-modal');
        const closeBtn = document.getElementById('close-quick-capture');
        const saveBtn = document.getElementById('save-quick-capture');
        const textArea = document.getElementById('quick-capture-text');
        const typeSelect = document.getElementById('quick-capture-type');

        if (quickCaptureBtn) {
            quickCaptureBtn.addEventListener('click', () => this.openModal());
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (saveBtn && modal) {
            saveBtn.addEventListener('click', () => this.saveCapture());
        }

        if (textArea && modal) {
            // Auto-resize textarea
            textArea.addEventListener('input', () => {
                textArea.style.height = 'auto';
                textArea.style.height = textArea.scrollHeight + 'px';
            });
        }

        // Template selection
        const templateBtn = document.getElementById('template-selector');
        if (templateBtn) {
            templateBtn.addEventListener('click', () => this.showTemplateSelector());
        }

        // Voice capture button
        const voiceBtn = document.getElementById('voice-capture');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.startVoiceCapture());
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + Q: Open quick capture
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Q') {
                e.preventDefault();
                this.openModal();
            }

            // Ctrl/Cmd + Shift + V: Voice capture
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.startVoiceCapture();
            }

            // Ctrl/Cmd + Shift + T: Show templates
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.showTemplateSelector();
            }
        });
    },

    setupVoiceCapture() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const voiceBtn = document.getElementById('voice-capture');
            if (voiceBtn) {
                voiceBtn.style.display = 'none';
            }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'id-ID';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const textArea = document.getElementById('quick-capture-text');
            if (textArea) {
                textArea.value = transcript;
                textArea.style.height = 'auto';
                textArea.style.height = textArea.scrollHeight + 'px';
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showNotification('Error dalam pengenalan suara', 'error');
        };

        this.recognition = recognition;
    },

    openModal() {
        const modal = document.getElementById('quick-capture-modal');
        if (!modal) return;

        modal.classList.remove('hidden');
        document.getElementById('quick-capture-text').focus();
        this.isModalOpen = true;

        // Add to recent captures
        this.updateRecentCaptures();
    },

    closeModal() {
        const modal = document.getElementById('quick-capture-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        this.isModalOpen = false;
    },

    saveCapture() {
        const text = document.getElementById('quick-capture-text').value.trim();
        const type = document.getElementById('quick-capture-type').value;

        if (!text) {
            this.showNotification('Silakan masukkan teks terlebih dahulu', 'warning');
            return;
        }

        const capture = {
            id: Date.now(),
            text: text,
            type: type,
            timestamp: new Date().toISOString(),
            tags: this.extractTags(text)
        };

        // Save to appropriate module
        switch (type) {
            case 'todo':
                this.saveAsTodo(capture);
                break;
            case 'note':
                this.saveAsNote(capture);
                break;
            case 'journal':
                this.saveAsJournal(capture);
                break;
            case 'goal':
                this.saveAsGoal(capture);
                break;
        }

        // Add to recent captures
        this.addToRecentCaptures(capture);

        // Clear form
        document.getElementById('quick-capture-text').value = '';

        // Close modal
        this.closeModal();

        this.showNotification('Quick capture berhasil disimpan', 'success');
    },

    saveAsTodo(capture) {
        const todo = {
            id: Date.now(),
            text: capture.text,
            completed: false,
            priority: 'medium',
            date: new Date().toISOString().split('T')[0],
            category: 'personal',
            tags: capture.tags,
            createdAt: new Date().toISOString()
        };

        Todo.todos.unshift(todo);
        Todo.saveTodos();
        Todo.render();
        Todo.updateStats();
    },

    saveAsNote(capture) {
        const note = {
            id: Date.now(),
            title: capture.text.substring(0, 50),
            content: capture.text,
            category: 'ideas',
            tags: capture.tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        Notes.notes.unshift(note);
        Notes.saveNotes();
        Notes.render();
        Notes.updateStats();
    },

    saveAsJournal(capture) {
        const today = new Date().toISOString().split('T')[0];
        const entry = {
            date: today,
            content: capture.text,
            mood: 'neutral',
            tags: capture.tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existingIndex = Journal.entries.findIndex(e => e.date === today);
        if (existingIndex !== -1) {
            entry.createdAt = Journal.entries[existingIndex].createdAt;
            Journal.entries[existingIndex] = entry;
        } else {
            Journal.entries.unshift(entry);
        }

        Journal.saveEntries();
        Journal.render();
        Journal.updateStats();
    },

    saveAsGoal(capture) {
        // Extract title from capture text
        const titleMatch = capture.text.match(/^(.+?)(?:\s*[-–—]\s*|$)/);
        const title = titleMatch ? titleMatch[1].trim() : capture.text.substring(0, 50);

        const goal = {
            id: Date.now(),
            title: title,
            description: capture.text,
            category: 'personal',
            priority: 'medium',
            deadline: this.extractDeadline(capture.text),
            progress: 0,
            tags: capture.tags,
            createdAt: new Date().toISOString()
        };

        Goals.goals.unshift(goal);
        Goals.saveGoals();
        Goals.render();
        Goals.updateStats();
    },

    extractTags(text) {
        const tagRegex = /#(\w+)/g;
        const matches = text.match(tagRegex);
        return matches ? matches.map(tag => tag.substring(1)) : [];
    },

    extractDeadline(text) {
        const deadlineRegex = /(?:deadline|batas waktu|tenggat)\s*[:\s]*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s*(?:hari|minggu|bulan|tahun)\s*(?:ke|dari)\s*\d+\s*(?:hari|minggu|bulan|tahun))/i;
        const match = text.match(deadlineRegex);

        if (!match) return null;

        const date = new Date();

        if (match[2]) { // DD/MM/YYYY format
            const [day, month, year] = match[2].split('/');
            date.setDate(parseInt(day));
            date.setMonth(parseInt(month) - 1);
            date.setFullYear(parseInt(year));
        } else if (match[3]) { // Relative date
            const unit = match[4]; // hari, minggu, bulan, tahun
            const number = parseInt(match[5]);

            switch (unit) {
                case 'hari':
                    date.setDate(date.getDate() + number);
                    break;
                case 'minggu':
                    date.setDate(date.getDate() + (number * 7));
                    break;
                case 'bulan':
                    date.setMonth(date.getMonth() + number);
                    break;
                case 'tahun':
                    date.setFullYear(date.getFullYear() + number);
                    break;
            }
        }

        return date.toISOString().split('T')[0];
    },

    showTemplateSelector() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Pilih Template</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this.templates.map(template => `
                        <div class="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 template-card" data-template-id="${template.id}">
                            <div class="flex items-center mb-2">
                                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                    <i class="fas ${template.icon} text-indigo-600"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-gray-800">${template.name}</h3>
                                    <p class="text-sm text-gray-600">${template.type}</p>
                                </div>
                            </div>
                            <div class="text-sm text-gray-600">
                                ${template.template}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="flex justify-end mt-6">
                    <button class="btn btn-ghost" onclick="this.closest('.fixed').remove()">
                        Batal
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.templateId;
                const template = this.templates.find(t => t.id === templateId);
                if (template) {
                    this.applyTemplate(template);
                    modal.remove();
                }
            });
        });
    },

    applyTemplate(template) {
        const textArea = document.getElementById('quick-capture-text');
        const typeSelect = document.getElementById('quick-capture-type');

        if (textArea && typeSelect) {
            textArea.value = template.template;
            typeSelect.value = template.type;

            // Auto-resize
            textArea.style.height = 'auto';
            textArea.style.height = textArea.scrollHeight + 'px';
        }
    },

    startVoiceCapture() {
        if (!this.recognition) {
            this.showNotification('Browser Anda tidak mendukung pengenalan suara', 'error');
            return;
        }

        const modal = document.getElementById('quick-capture-modal');
        const voiceBtn = document.getElementById('voice-capture');

        if (modal && voiceBtn) {
            modal.classList.remove('hidden');

            // Start listening
            this.recognition.start();

            // Update button UI
            voiceBtn.innerHTML = '<i class="fas fa-microphone text-red-500"></i>';
            voiceBtn.classList.add('animate-pulse');

            // Update placeholder
            const textArea = document.getElementById('quick-capture-text');
            if (textArea) {
                textArea.placeholder = 'Mendengarkan suara Anda...';
                textArea.value = '';
            }

            // Show notification
            this.showNotification('Mendengarkan... Bicara untuk mulai', 'info');

            // Stop listening after 10 seconds of silence
            this.silenceTimeout = setTimeout(() => {
                this.recognition.stop();
                voiceBtn.innerHTML = '<i class="fas fa-microphone text-gray-500"></i>';
                voiceBtn.classList.remove('animate-pulse');
                textArea.placeholder = 'Tekan tombol mikrofon untuk mulai lagi';
            }, 10000);

            this.recognition.onend = () => {
                voiceBtn.innerHTML = '<i class="fas fa-microphone text-gray-500"></i>';
                voiceBtn.classList.remove('animate-pulse');
                clearTimeout(this.silenceTimeout);
            };

            this.recognition.onsoundstart = () => {
                clearTimeout(this.silenceTimeout);
            };

            this.recognition.onsoundend = () => {
                this.silenceTimeout = setTimeout(() => {
                    this.recognition.stop();
                    voiceBtn.innerHTML = '<i class="fas fa-microphone text-gray-500"></i>';
                    voiceBtn.classList.remove('animate-pulse');
                }, 1000);
            };
        }
    },

    addToRecentCaptures(capture) {
        this.recentCaptures.unshift(capture);

        // Keep only last 20 captures
        if (this.recentCaptures.length > 20) {
            this.recentCaptures = this.recentCaptures.slice(0, 20);
        }

        Storage.set('quick-capture-recent', this.recentCaptures);
    },

    updateRecentCaptures() {
        const recentContainer = document.getElementById('recent-captures');
        if (!recentContainer) return;

        if (this.recentCaptures.length === 0) {
            recentContainer.innerHTML = `
                <p class="text-center text-gray-500 py-4">Belum ada capture tersimpan</p>
            `;
            return;
        }

        recentContainer.innerHTML = `
            <h3 class="text-lg font-semibold mb-3 text-gray-800">Capture Terbaru</h3>
            <div class="space-y-2">
                ${this.recentCaptures.slice(0, 10).map(capture => `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer recent-capture" data-id="${capture.id}">
                        <div class="flex-grow">
                            <p class="text-sm font-medium text-gray-800">${capture.text.substring(0, 50)}${capture.text.length > 50 ? '...' : ''}</p>
                            <p class="text-xs text-gray-500">${this.formatCaptureTime(capture.timestamp)} • ${capture.type}</p>
                        </div>
                        <button class="text-gray-400 hover:text-gray-600" onclick="QuickCapture.useCapture('${capture.id}')">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        recentContainer.querySelectorAll('.recent-capture').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const captureId = item.dataset.id;
                    this.useCapture(captureId);
                }
            });
        });
    },

    useCapture(captureId) {
        const capture = this.recentCaptures.find(c => c.id === captureId);
        if (!capture) return;

        const textArea = document.getElementById('quick-capture-text');
        const typeSelect = document.getElementById('quick-capture-type');

        if (textArea && typeSelect) {
            textArea.value = capture.text;
            typeSelect.value = capture.type;

            // Auto-resize
            textArea.style.height = 'auto';
            textArea.style.height = textArea.scrollHeight + 'px';
        }

        this.openModal();
    },

    formatCaptureTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) {
            return 'Baru saja';
        } else if (diffMins < 60) {
            return `${diffMins} menit yang lalu`;
        } else if (diffMins < 1440) {
            return `${Math.floor(diffMins / 60)} jam yang lalu`;
        } else {
            return `${Math.floor(diffMins / 1440)} hari yang lalu`;
        }
    },

    showNotification(message, type = 'success') {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, type);
        }
    }
};