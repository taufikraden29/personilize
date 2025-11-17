// LocalStorage management
const Storage = {
    // Initialize storage system
    init() {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                throw new Error('localStorage is not supported in this browser');
            }

            // Initialize default data if needed
            this.initializeDefaultData();

            console.log('Storage system initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing storage system:', error);
            return false;
        }
    },

    // Initialize default data if it doesn't exist
    initializeDefaultData() {
        const defaultData = {
            todos: [],
            notes: [],
            habits: [],
            pomodoro: {
                sessionCount: 0,
                totalMinutes: 0,
                settings: {
                    focusTime: 25,
                    shortBreakTime: 5,
                    longBreakTime: 15,
                    longBreakInterval: 4
                }
            },
            achievements: [],
            settings: {
                userName: '',
                theme: 'light',
                notifications: false
            },
            journal: [],
            goals: [],
            lastUsage: null,
            consecutiveDays: 0,
            dailyQuote: null
        };

        // Set default values if they don't exist
        Object.keys(defaultData).forEach(key => {
            if (this.get(key) === null) {
                this.set(key, defaultData[key]);
            }
        });
    },

    // Get data from localStorage
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error getting data for key "${key}":`, error);
            return null;
        }
    },

    // Set data to localStorage
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error setting data for key "${key}":`, error);

            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.showStorageError('Penyimpanan penuh. Hapus beberapa data atau coba ekspor data Anda.');
            }

            return false;
        }
    },

    // Remove data from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing data for key "${key}":`, error);
            return false;
        }
    },

    // Clear all data from localStorage
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    // Get storage usage information
    getStorageInfo() {
        try {
            let totalSize = 0;
            let dataCount = 0;

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                    dataCount++;
                }
            }

            return {
                totalSize: totalSize,
                totalSizeKB: (totalSize / 1024).toFixed(2),
                dataCount: dataCount,
                quota: 5 * 1024 * 1024, // 5MB typical quota
                quotaPercentage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    },

    // Export all data
    exportData() {
        try {
            const data = this.getAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = `my-personal-app-${new Date().toISOString().slice(0, 10)}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStorageError('Gagal mengekspor data. Coba lagi.');
            return false;
        }
    },

    // Import data
    importData(data) {
        try {
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            // Import each data type if it exists
            const dataTypes = [
                'todos', 'notes', 'habits', 'pomodoro',
                'achievements', 'settings', 'journal', 'goals',
                'lastUsage', 'consecutiveDays', 'dailyQuote'
            ];

            dataTypes.forEach(type => {
                if (data.hasOwnProperty(type)) {
                    this.set(type, data[type]);
                }
            });

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            this.showStorageError('Gagal mengimpor data. Periksa format file.');
            return false;
        }
    },

    // Get all data for export
    getAllData() {
        return {
            todos: this.get('todos'),
            notes: this.get('notes'),
            habits: this.get('habits'),
            pomodoro: this.get('pomodoro'),
            achievements: this.get('achievements'),
            settings: this.get('settings'),
            journal: this.get('journal'),
            goals: this.get('goals'),
            lastUsage: this.get('lastUsage'),
            consecutiveDays: this.get('consecutiveDays'),
            dailyQuote: this.get('dailyQuote'),
            exportDate: new Date().toISOString()
        };
    },

    // Backup data to localStorage with timestamp
    backupData() {
        try {
            const data = this.getAllData();
            const timestamp = new Date().toISOString();
            this.set(`backup_${timestamp}`, data);

            // Keep only the last 5 backups
            this.cleanOldBackups(5);

            return timestamp;
        } catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    },

    // Clean old backups, keeping only the specified number
    cleanOldBackups(keepCount) {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));

            // Sort by timestamp (newest first)
            keys.sort((a, b) => {
                const aTime = new Date(a.substring(7));
                const bTime = new Date(b.substring(7));
                return bTime - aTime;
            });

            // Remove old backups
            if (keys.length > keepCount) {
                for (let i = keepCount; i < keys.length; i++) {
                    this.remove(keys[i]);
                }
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    },

    // Restore from backup
    restoreFromBackup(timestamp) {
        try {
            const backupKey = `backup_${timestamp}`;
            const backupData = this.get(backupKey);

            if (!backupData) {
                throw new Error('Backup not found');
            }

            // Create a backup before restoring
            this.backupData();

            // Restore data
            this.importData(backupData);

            return true;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            this.showStorageError('Gagal memulihkan dari cadangan.');
            return false;
        }
    },

    // Get list of available backups
    getBackupList() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));

            return keys.map(key => {
                const timestamp = key.substring(7);
                return {
                    key: key,
                    timestamp: timestamp,
                    date: new Date(timestamp)
                };
            }).sort((a, b) => b.date - a.date);
        } catch (error) {
            console.error('Error getting backup list:', error);
            return [];
        }
    },

    // Show storage error message
    showStorageError(message) {
        // Try to use the app's notification system if available
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, 'error');
        } else {
            // Fallback to alert
            alert(message);
        }
    }
};