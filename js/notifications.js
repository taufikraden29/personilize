// Notification Manager for Personal Assistant App

class NotificationManager {
    constructor() {
        this.notifications = Storage.get('notifications') || [];
        this.init();
    }

    init() {
        // Clean up old notifications
        this.cleanupOldNotifications();

        // Request notification permission if not granted
        this.requestNotificationPermission();
    }

    addNotification(message, type = 'info', title = 'Personal Assistant') {
        const notification = {
            id: this.generateId(),
            title: title,
            message: message,
            type: type,
            timestamp: new Date().toISOString(),
            read: false
        };

        // Add to beginning of array
        this.notifications.unshift(notification);

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        // Save to storage
        Storage.set('notifications', this.notifications);

        // Show browser notification if permission granted
        this.showBrowserNotification(title, message, type);

        // Update badge
        App.updateNotificationBadge();
    }

    showBrowserNotification(title, message, type) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const icon = this.getNotificationIcon(type);

            const notification = new Notification(title, {
                body: message,
                icon: icon,
                badge: '/assets/icons/badge.png',
                tag: 'personal-assistant'
            });

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Click handler
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    getNotificationIcon(type) {
        const iconMap = {
            success: '/assets/icons/success.png',
            error: '/assets/icons/error.png',
            warning: '/assets/icons/warning.png',
            info: '/assets/icons/info.png'
        };

        return iconMap[type] || '/assets/icons/default.png';
    }

    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            Storage.set('notifications', this.notifications);
            App.updateNotificationBadge();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => {
            n.read = true;
        });
        Storage.set('notifications', this.notifications);
        App.updateNotificationBadge();
    }

    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        Storage.set('notifications', this.notifications);
        App.updateNotificationBadge();
    }

    clearAllNotifications() {
        this.notifications = [];
        Storage.set('notifications', this.notifications);
        App.updateNotificationBadge();
    }

    cleanupOldNotifications() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        this.notifications = this.notifications.filter(n => {
            const notificationDate = new Date(n.timestamp);
            return notificationDate > thirtyDaysAgo;
        });

        Storage.set('notifications', this.notifications);
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.addNotification('Notifikasi browser diaktifkan!', 'success');
                }
            });
        }
    }

    renderNotifications() {
        const notificationList = document.getElementById('notification-list');

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-bell-slash text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
                    <p class="text-gray-500 dark:text-gray-400">Tidak ada notifikasi</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = this.notifications.map(notification => {
            const typeColor = this.getTypeColor(notification.type);
            const timeAgo = this.getTimeAgo(new Date(notification.timestamp));
            const isUnread = !notification.read;

            return `
                <div class="notification-item p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''}" data-id="${notification.id}">
                    <div class="flex items-start">
                        <div class="w-8 h-8 rounded-full ${typeColor} flex items-center justify-center text-white mr-3 flex-shrink-0">
                            <i class="fas ${this.getTypeIcon(notification.type)} text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="font-medium text-sm truncate">${notification.title}</h4>
                                <button class="delete-notification-btn text-gray-400 hover:text-red-500 ml-2" data-id="${notification.id}">
                                    <i class="fas fa-times text-xs"></i>
                                </button>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${notification.message}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${timeAgo}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        this.attachNotificationEventListeners();
    }

    attachNotificationEventListeners() {
        // Notification item click
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on delete button
                if (e.target.closest('.delete-notification-btn')) return;

                const id = item.getAttribute('data-id');
                this.markAsRead(id);
                this.renderNotifications();
            });
        });

        // Delete button
        document.querySelectorAll('.delete-notification-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                this.deleteNotification(id);
                this.renderNotifications();
            });
        });
    }

    getTypeColor(type) {
        const colorMap = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        return colorMap[type] || 'bg-gray-500';
    }

    getTypeIcon(type) {
        const iconMap = {
            success: 'fa-check',
            error: 'fa-exclamation',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info'
        };
        return iconMap[type] || 'fa-bell';
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) {
            return Math.floor(interval) + " tahun lalu";
        }

        interval = seconds / 2592000;
        if (interval > 1) {
            return Math.floor(interval) + " bulan lalu";
        }

        interval = seconds / 86400;
        if (interval > 1) {
            return Math.floor(interval) + " hari lalu";
        }

        interval = seconds / 3600;
        if (interval > 1) {
            return Math.floor(interval) + " jam lalu";
        }

        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + " menit lalu";
        }

        return "Baru saja";
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}