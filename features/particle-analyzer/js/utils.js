/**
 * utils.js - Utility Helper Functions
 * Aqua Insight - Particle Analyzer
 */

// Global utility functions
const Utils = {
    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    },

    /**
     * Calculate circularity (4π × Area / Perimeter²)
     */
    calculateCircularity(area, perimeter) {
        if (perimeter === 0) return 0;
        return (4 * Math.PI * area) / (perimeter * perimeter);
    },

    /**
     * Get pixel data from ImageData object
     */
    getPixelIndex(x, y, width) {
        return (y * width + x) * 4;
    },

    /**
     * Convert canvas coordinates to image coordinates
     */
    canvasToImage(x, y, scale, offsetX, offsetY) {
        return {
            x: (x - offsetX) / scale,
            y: (y - offsetY) / scale
        };
    },

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Create array of zeros
     */
    createEmptyArray(length) {
        return new Array(length).fill(0);
    },

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Create canvas from image data
     */
    createCanvasFromImageData(imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

// Export for use in other modules
window.Utils = Utils;
