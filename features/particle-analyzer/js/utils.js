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

/**
 * Perform binary dilation on a binary mask
 * @param {Uint8Array} mask Binary mask (0 or 255)
 * @param {number} width Image width
 * @param {number} height Image height
 * @param {number} radius Radius of dilation kernel (usually 1 or 2)
 * @returns {Uint8Array} Dilated mask
 */
function binaryDilation(mask, width, height, radius = 1) {
    const output = new Uint8Array(width * height);
    const r = radius;

    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            let val = 0;
            for(let dy = -r; dy <= r; dy++) {
                for(let dx = -r; dx <= r; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if(nx >= 0 && nx < width && ny >=0 && ny < height) {
                        if(mask[ny * width + nx] === 255) {
                            val = 255;
                            break;
                        }
                    }
                }
                if(val === 255) break;
            }
            output[y * width + x] = val;
        }
    }
    return output;
}

/**
 * Perform binary erosion on a binary mask
 * @param {Uint8Array} mask Binary mask (0 or 255)
 * @param {number} width Image width
 * @param {number} height Image height
 * @param {number} radius Radius of erosion kernel (usually 1 or 2)
 * @returns {Uint8Array} Eroded mask
 */
function binaryErosion(mask, width, height, radius = 1) {
    const output = new Uint8Array(width * height);
    const r = radius;

    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            let val = 255;
            for(let dy = -r; dy <= r; dy++) {
                for(let dx = -r; dx <= r; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if(nx >= 0 && nx < width && ny >=0 && ny < height) {
                        if(mask[ny * width + nx] === 0) {
                            val = 0;
                            break;
                        }
                    } else {
                        val = 0; // Outside bounds treated as background (0)
                        break;
                    }
                }
                if(val === 0) break;
            }
            output[y * width + x] = val;
        }
    }
    return output;
}

/**
 * Perform morphological opening (erosion followed by dilation)
 */
function morphologicalOpening(mask, width, height, radius = 1) {
    const eroded = binaryErosion(mask, width, height, radius);
    const opened = binaryDilation(eroded, width, height, radius);
    return opened;
}

/**
 * Perform morphological closing (dilation followed by erosion)
 */
function morphologicalClosing(mask, width, height, radius = 1) {
    const dilated = binaryDilation(mask, width, height, radius);
    const closed = binaryErosion(dilated, width, height, radius);
    return closed;
}
