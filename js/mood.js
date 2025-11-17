// Mood Tracker Manager for Personal Assistant App

class MoodManager {
    constructor() {
        this.moodEntries = Storage.get('mood').entries || [];
        this.selectedMood = null;
        this.init();
    }

    init() {
        // Set up event listeners
        this.setupEventListeners();

        // Render mood tracker
        this.renderMoodTracker();

        // Render mood history
        this.renderMoodHistory();
    }

    setupEventListeners() {
        // Mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selected class from all buttons
                document.querySelectorAll('.mood-btn').forEach(b => {
                    b.classList.remove('mood-selected');
                });

                // Add selected class to clicked button
                btn.classList.add('mood-selected');
                this.selectedMood = btn.getAttribute('data-mood');
            });
        });

        // Save mood button
        document.getElementById('save-mood-btn').addEventListener('click', () => {
            this.saveMoodEntry();
        });
    }

    renderMoodTracker() {
        // Get mood data for the last 7 days
        const last7Days = this.getLast7DaysMoodData();

        const moodChart = document.getElementById('mood-chart');

        if (last7Days.length === 0) {
            moodChart.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-smile text-3xl mb-2"></i>
                    <p>Belum ada data mood</p>
                </div>
            `;
            return;
        }

        moodChart.innerHTML = last7Days.map(day => {
            const height = this.getMoodHeight(day.mood);
            const emoji = this.getMoodEmoji(day.mood);

            return `
                <div class="flex flex-col items-center">
                    <div class="text-xs mb-1">${emoji}</div>
                    <div class="w-8 bg-gradient-to-t from-pink-400 to-pink-600 rounded-t" style="height: ${height}px;"></div>
                    <div class="text-xs mt-1 text-gray-600 dark:text-gray-400">${day.dayLabel}</div>
                </div>
            `;
        }).join('');
    }

    renderMoodHistory() {
        const moodHistory = document.getElementById('mood-history');

        if (this.moodEntries.length === 0) {
            moodHistory.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-smile text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
                    <p class="text-gray-500 dark:text-gray-400">Belum ada catatan mood</p>
                </div>
            `;
            return;
        }

        // Sort entries by date (newest first)
        const sortedEntries = [...this.moodEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

        moodHistory.innerHTML = sortedEntries.slice(0, 10).map(entry => {
            const dateStr = new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const emoji = this.getMoodEmoji(entry.mood);
            const moodLabel = this.getMoodLabel(entry.mood);

            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${emoji}</span>
                            <div>
                                <h4 class="font-medium">${moodLabel}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${dateStr}</p>
                            </div>
                        </div>
                        <button class="delete-mood-btn text-gray-400 hover:text-red-500" data-id="${entry.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ${entry.note ? `<p class="text-gray-600 dark:text-gray-400">${entry.note}</p>` : ''}
                </div>
            `;
        }).join('');

        // Add delete event listeners
        document.querySelectorAll('.delete-mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteMoodEntry(id);
            });
        });
    }

    saveMoodEntry() {
        if (!this.selectedMood) {
            App.showNotification('Silakan pilih mood terlebih dahulu', 'warning');
            return;
        }

        // Check if mood already recorded today
        const today = new Date().toDateString();
        const existingEntry = this.moodEntries.find(entry => {
            return new Date(entry.date).toDateString() === today;
        });

        if (existingEntry) {
            if (!confirm('Anda sudah mencatat mood hari ini. Apakah ingin menggantinya?')) {
                return;
            }

            // Update existing entry
            existingEntry.mood = this.selectedMood;
            existingEntry.note = document.getElementById('mood-note').value;
            existingEntry.updatedAt = new Date().toISOString();
        } else {
            // Create new entry
            const moodEntry = {
                id: this.generateId(),
                mood: this.selectedMood,
                note: document.getElementById('mood-note').value,
                date: new Date().toISOString()
            };

            this.moodEntries.push(moodEntry);
        }

        // Save to storage
        Storage.set('mood', { ...Storage.get('mood'), entries: this.moodEntries });

        // Reset form
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('mood-selected');
        });
        document.getElementById('mood-note').value = '';
        this.selectedMood = null;

        // Update UI
        this.renderMoodTracker();
        this.renderMoodHistory();

        // Show notification
        App.showNotification('Mood berhasil dicatat', 'success');
    }

    deleteMoodEntry(id) {
        if (confirm('Apakah Anda yakin ingin menghapus catatan mood ini?')) {
            this.moodEntries = this.moodEntries.filter(e => e.id !== id);
            Storage.set('mood', { ...Storage.get('mood'), entries: this.moodEntries });
            this.renderMoodTracker();
            this.renderMoodHistory();
            App.showNotification('Catatan mood dihapus', 'info');
        }
    }

    getLast7DaysMoodData() {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dayLabel = date.toLocaleDateString('id-ID', { weekday: 'short' });

            // Find mood entry for this day
            const moodEntry = this.moodEntries.find(entry => {
                return new Date(entry.date).toDateString() === date.toDateString();
            });

            days.push({
                date: date,
                dayLabel: dayLabel,
                mood: moodEntry ? moodEntry.mood : null
            });
        }

        return days;
    }

    getMoodHeight(mood) {
        const heightMap = {
            'very-sad': 40,
            'sad': 60,
            'neutral': 80,
            'happy': 100,
            'very-happy': 120
        };
        return heightMap[mood] || 0;
    }

    getMoodEmoji(mood) {
        const emojiMap = {
            'very-sad': '😢',
            'sad': '😕',
            'neutral': '😐',
            'happy': '😊',
            'very-happy': '😄'
        };
        return emojiMap[mood] || '😐';
    }

    getMoodLabel(mood) {
        const labelMap = {
            'very-sad': 'Sangat Sedih',
            'sad': 'Sedih',
            'neutral': 'Netral',
            'happy': 'Senang',
            'very-happy': 'Sangat Senang'
        };
        return labelMap[mood] || 'Netral';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}