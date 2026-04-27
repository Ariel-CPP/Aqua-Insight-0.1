/**
 * ui.js - UI Notification & Loading Management
 * Aqua Insight - Particle Analyzer
 */

const UI = {
    /**
     * Show loading overlay
     */
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const textEl = overlay.querySelector('.loading-text');
            if (textEl) textEl.textContent = message;
            overlay.style.display = 'flex';
        }
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    /**
     * Show notification toast
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existing = document.querySelector('.toast-container');
        if (existing) existing.remove();

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;

        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${this.getToastColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-family: 'Segoe UI', sans-serif;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        if (!document.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    /**
     * Get toast background color
     */
    getToastColor(type) {
        const colors = {
            success: 'linear-gradient(45deg, #2ecc71, #27ae60)',
            error: 'linear-gradient(45deg, #e74c3c, #c0392b)',
            warning: 'linear-gradient(45deg, #f39c12, #e67e22)',
            info: 'linear-gradient(45deg, #3498db, #2980b9)'
        };
        return colors[type] || colors.info;
    },

    /**
     * Update progress bar
     */
    updateProgress(current, total, message = '') {
        const percent = Math.round((current / total) * 100);
        console.log(`[${percent}%] ${message}`);
        
        // Update loading text if needed
        const loadingText = document.querySelector('.loading-text');
        if (loadingText && message) {
            loadingText.textContent = message;
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    /**
     * Update control panel visibility
     */
    toggleSection(sectionId, show) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    },

    /**
     * Enable/disable button
     */
    setButtonState(buttonId, enabled, text = null) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = !enabled;
            if (text) btn.textContent = text;
        }
    }
};

// Export for use in other modules
window.UI = UI;
