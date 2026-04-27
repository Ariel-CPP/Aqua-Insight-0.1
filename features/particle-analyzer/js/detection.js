/**
 * detection.js - Image Processing & Threshold Detection
 * Aqua Insight v0.1 - Particle Analyzer
 */

const Detection = {
    /**
     * Extract RGB channels from ImageData
     * @param {ImageData} imageData
     * @returns {Object} { redChannel, greenChannel, blueChannel, width, height }
     */
    extractRGBChannels(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const len = width * height;

        const redChannel = new Uint8Array(len);
        const greenChannel = new Uint8Array(len);
        const blueChannel = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            const idx = i * 4;
            redChannel[i] = data[idx];
            greenChannel[i] = data[idx + 1];
            blueChannel[i] = data[idx + 2];
        }

        return { redChannel, greenChannel, blueChannel, width, height };
    },

    /**
     * Convert ImageData to Grayscale Uint8Array
     */
    toGrayscale(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const len = width * height;
        const gray = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            const idx = i * 4;
            gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        }

        return gray;
    },

    /**
     * Create ImageData from grayscale buffer
     */
    createGrayscaleImageData(gray, width, height) {
        const imageData = new ImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < width * height; i++) {
            const v = gray[i];
            const idx = i * 4;
            data[idx] = v;
            data[idx + 1] = v;
            data[idx + 2] = v;
            data[idx + 3] = 255;
        }

        return imageData;
    },

    /**
     * Sobel Edge Detection
     */
    sobelEdgeDetection(gray, width, height) {
        const edge = new Uint8Array(width * height);
        const kernelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        const kernelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = gray[(y + ky) * width + (x + kx)];
                        gx += kernelX[ky + 1][kx + 1] * pixel;
                        gy += kernelY[ky + 1][kx + 1] * pixel;
                    }
                }

                const g = Math.sqrt(gx * gx + gy * gy);
                edge[y * width + x] = g > 255 ? 255 : g;
            }
        }

        return edge;
    },

    /**
     * Create ImageData from edge buffer
     */
    createEdgeImageData(edge, width, height) {
        const imageData = new ImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < width * height; i++) {
            const v = edge[i];
            const idx = i * 4;
            data[idx] = v;
            data[idx + 1] = v;
            data[idx + 2] = v;
            data[idx + 3] = 255;
        }

        return imageData;
    },

    /**
     * Apply threshold to channel
     * @param {Uint8Array} channel
     * @param {number} threshold
     * @param {boolean} invert - true for dark background
     */
    applyThreshold(channel, threshold, invert = false) {
        const result = new Uint8Array(channel.length);

        for (let i = 0; i < channel.length; i++) {
            if (invert) {
                // Dark background: low values = foreground
                result[i] = channel[i] <= threshold ? 255 : 0;
            } else {
                // Light background: high values = foreground
                result[i] = channel[i] >= threshold ? 255 : 0;
            }
        }

        return result;
    },

    /**
     * Create binary mask
     */
    createBinaryMask(channel, threshold, darkBackground) {
        return this.applyThreshold(channel, threshold, darkBackground);
    },

    /**
     * Calculate histogram
     */
    calculateHistogram(channel) {
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < channel.length; i++) {
            histogram[channel[i]]++;
        }
        return histogram;
    },

    /**
     * Get channel statistics
     */
    getChannelStats(channel) {
        let min = 255;
        let max = 0;
        let sum = 0;

        for (let i = 0; i < channel.length; i++) {
            if (channel[i] < min) min = channel[i];
            if (channel[i] > max) max = channel[i];
            sum += channel[i];
        }

        return {
            min,
            max,
            mean: sum / channel.length,
            count: channel.length
        };
    },

    /**
     * Calculate standard deviation
     */
    calculateStdDev(channel, mean) {
        let sumSquaredDiff = 0;
        for (let i = 0; i < channel.length; i++) {
            sumSquaredDiff += Math.pow(channel[i] - mean, 2);
        }
        return Math.sqrt(sumSquaredDiff / channel.length);
    },

    /**
     * Calculate contrast ratio for each channel
     */
    calculateContrastRatio(rgbChannels) {
        const results = {};

        for (const channel of ['red', 'green', 'blue']) {
            const channelData = rgbChannels[channel + 'Channel'];
            const stats = this.getChannelStats(channelData);
            const stdDev = this.calculateStdDev(channelData, stats.mean);

            results[channel] = {
                contrast: stdDev,
                stats: stats
            };
        }

        // Find best channel
        const sorted = Object.entries(results).sort((a, b) => b[1].contrast - a[1].contrast);
        results.bestChannel = sorted[0][0];

        return results;
    }
};

// Export
window.Detection = Detection;
