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
            redChannel[i] = data[idx];       // R
            greenChannel[i] = data[idx + 1]; // G
            blueChannel[i] = data[idx + 2];   // B
        }

        return { redChannel, greenChannel, blueChannel, width, height };
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
     * Find optimal threshold using Otsu's method
     */
    findOptimalThreshold(channel) {
        const histogram = this.calculateHistogram(channel);
        const total = channel.length;
        
        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }
        
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVariance = 0;
        let threshold = 0;
        
        for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;
            
            wF = total - wB;
            if (wF === 0) break;
            
            sumB += t * histogram[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            
            const variance = wB * wF * (mB - mF) * (mB - mF);
            
            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = t;
            }
        }
        
        return threshold;
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
     * Create binary mask from threshold
     */
    createBinaryMask(channel, threshold, darkBackground) {
        return this.applyThreshold(channel, threshold, darkBackground);
    },

    /**
     * Get pixel contrast (difference from neighbors)
     */
    getContrastAtPixel(x, y, width, height, channel) {
        const idx = y * width + x;
        const center = channel[idx];
        
        let diffSum = 0;
        let count = 0;
        
        // Check 8 neighbors
        const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],          [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const [dx, dy] of neighbors) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const neighborIdx = ny * width + nx;
                diffSum += Math.abs(channel[neighborIdx] - center);
                count++;
            }
        }
        
        return count > 0 ? diffSum / count : 0;
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
    }
};

// Export for use in other modules
window.Detection = Detection;
