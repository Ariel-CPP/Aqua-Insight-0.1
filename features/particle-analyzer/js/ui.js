/**
 * ui.js - UI Helper Functions
 * Aqua Insight v0.1 - Particle Analyzer
 */

const UI = {
    /**
     * Show loading overlay
     */
    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const textEl = document.getElementById('loadingText');
        if (overlay) {
            overlay.style.display = 'flex';
            if (textEl) textEl.textContent = text;
        }
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast ' + type + ' show';

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    },

    /**
     * Show success toast
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    /**
     * Show error toast
     */
    showError(message) {
        this.showToast(message, 'error');
    },

    /**
     * Toggle section visibility
     */
    toggleSection(id, show) {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    },

    /**
     * Set button state
     */
    setButtonState(id, enabled, text) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = !enabled;
            if (text) btn.textContent = text;
        }
    },

    /**
     * Show/hide element
     */
    setVisible(id, visible) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = visible ? 'block' : 'none';
        }
    }
};

// Export
window.UI = UI;
