function initProfile() {
    const userNameInput = document.getElementById('userNameInput');
    const themeToggle = document.getElementById('themeToggle');
    const notificationToggle = document.getElementById('notificationToggle');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');

    // Load user profile data
    function loadProfileData() {
        userNameInput.value = App.settings.userName;
        themeToggle.checked = App.settings.theme === 'light';
        notificationToggle.checked = App.settings.notifications;
    }

    // Save profile data
    function saveProfileData() {
        App.settings.userName = userNameInput.value.trim();
        App.settings.theme = themeToggle.checked ? 'light' : 'dark';
        App.settings.notifications = notificationToggle.checked;

        // Apply theme
        if (App.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }

        // Update UI
        document.getElementById('userName').textContent = App.settings.userName;

        // Save to localStorage
        Storage.set('settings', App.settings);

        App.showNotification('Profil berhasil diperbarui', 'success');
    }

    // Change avatar (placeholder function)
    function changeAvatar() {
        App.showNotification('Fitur ganti avatar akan segera hadir', 'info');
    }

    // Event listeners
    saveProfileBtn.addEventListener('click', saveProfileData);
    changeAvatarBtn.addEventListener('click', changeAvatar);

    // Initialize
    loadProfileData();
}