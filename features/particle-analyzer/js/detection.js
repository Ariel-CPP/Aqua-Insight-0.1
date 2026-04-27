/**
 * detection.js - Image Processing & Threshold Detection
 * Aqua Insight - Particle Analyzer
 */

const Detection = {
    /**
     * Extract RGB channels from image
     */
    extractRGBChannels(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        const redChannel = new Uint8Array(width * height);
        const greenChannel = new Uint8Array(width * height);
        const blueChannel = new Uint8Array(width * height);

        for (let i = 0; i < width * height; i++) {
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
        const gray = new Uint8Array(width * height);

        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        }
        return gray;
    },

    /**
     * Create ImageData object from grayscale buffer
     */
    createGrayscaleImageData(gray, width, height) {
        const imageData = new ImageData(width, height);
        for (let i = 0; i < width * height; i++) {
            const v = gray[i];
            imageData.data[i * 4] = v;
            imageData.data[i * 4 + 1] = v;
            imageData.data[i * 4 + 2] = v;
            imageData.data[i * 4 + 3] = 255;
        }
        return imageData;
    },

    /**
     * Edge detection with Sobel operator
     */
    sobelEdgeDetection(gray, width, height) {
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
        const edge = new Uint8Array(width * height);

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

                let g = Math.sqrt(gx * gx + gy * gy);
                edge[y * width + x] = g > 255 ? 255 : g;
            }
        }
        return edge;
    },

    /**
     * Create ImageData from edge Uint8Array
     */
    createEdgeImageData(edge, width, height) {
        const imageData = new ImageData(width, height);
        for (let i = 0; i < width * height; i++) {
            const v = edge[i];
            imageData.data[i * 4] = v;
            imageData.data[i * 4 + 1] = v;
            imageData.data[i * 4 + 2] = v;
            imageData.data[i * 4 + 3] = 255;
        }
        return imageData;
    },

    /**
     * Apply threshold to channel
     */
    applyThreshold(channel, threshold, invert = false) {
        const result = new Uint8Array(channel.length);
        
        for (let i = 0; i < channel.length; i++) {
            if (invert) {
                result[i] = channel[i] <= threshold ? 255 : 0;
            } else {
                result[i] = channel[i] >= threshold ? 255 : 0;
            }
        }
        
        return result;
    },

    /**
     * Create binary mask from threshold
     */
    createBinaryMask(channel, threshold, darkBackground) {
        return this.applyThreshold(channel, threshold, darkBackground);
    },

    /**
     * Calculate histogram for a channel
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
        const results = {
            red: { contrast: 0, stats: null },
            green: { contrast: 0, stats: null },
            blue: { contrast: 0, stats: null }
        };

        for (const channel of ['red', 'green', 'blue']) {
            const stats = this.getChannelStats(rgbChannels[channel + 'Channel']);
            const stdDev = this.calculateStdDev(rgbChannels[channel + 'Channel'], stats.mean);
            
            results[channel] = {
                contrast: stdDev,
                stats: stats,
                stdDev: stdDev
            };
        }

        // Find best channel
        const sorted = Object.entries(results).sort((a, b) => b[1].contrast - a[1].contrast);
        results.bestChannel = sorted[0][0];

        return results;
    }
};

// Export for use in other modules
window.Detection = Detection;
