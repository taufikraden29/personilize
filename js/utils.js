// Utility functions for the Growp application
const Utils = {
    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} str - The string to sanitize
     * @returns {string} The sanitized string
     */
    sanitizeHTML(str) {
        if (typeof str !== 'string') {
            return str;
        }
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Sanitize a value for safe display in HTML
     * @param {*} value - The value to sanitize
     * @returns {*} The sanitized value
     */
    sanitizeForDisplay(value) {
        if (typeof value === 'string') {
            return this.sanitizeHTML(value);
        }
        return value;
    },

    /**
     * Escape HTML entities in a string
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     */
    escapeHtml(str) {
        if (typeof str !== 'string') {
            return str;
        }
        
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        
        return str.replace(/[&<>"'\/]/g, function (s) {
            return escapeMap[s];
        });
    },

    /**
     * Strip HTML tags from a string
     * @param {string} str - The string to strip tags from
     * @returns {string} The string without HTML tags
     */
    stripHtmlTags(str) {
        if (typeof str !== 'string') {
            return str;
        }
        
        return str.replace(/<[^>]*>/g, '');
    },

    /**
     * Format text for safe display in HTML content
     * @param {string} text - The text to format
     * @returns {string} The formatted text
     */
    formatForDisplay(text) {
        return this.escapeHtml(text || '');
    }
};