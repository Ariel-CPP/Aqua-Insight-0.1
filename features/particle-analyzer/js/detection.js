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

/**
 * Apply adaptive/local thresholding using integral images and mean subtraction
 * @param {ImageData} imageData Original RGBA image data
 * @param {number} blockSize Size of neighborhood block (odd number, e.g., 15 or 21)
 * @param {number} C Constant subtracted from mean to adjust threshold (e.g., 10)
 * @returns {Uint8Array} Binary mask (0: background, 255: foreground)
 */
function applyAdaptiveThreshold(imageData, blockSize = 21, C = 10) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const gray = new Uint8Array(width * height);

    // Convert image to grayscale using standard formula
    for(let i = 0; i < width * height; i++) {
        const idx = i * 4;
        gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    // Compute integral image for fast mean calculation
    const integral = new Uint32Array((width + 1) * (height + 1));
    for(let y = 1; y <= height; y++) {
        let rowSum = 0;
        for(let x = 1; x <= width; x++) {
            rowSum += gray[(y - 1) * width + (x - 1)];
            integral[y * (width + 1) + x] = integral[(y - 1) * (width + 1) + x] + rowSum;
        }
    }

    // Prepare output binary mask
    const mask = new Uint8Array(width * height);

    const halfBlock = Math.floor(blockSize / 2);

    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            // Define the bounding box of neighborhood block
            const x1 = Math.max(x - halfBlock, 0);
            const y1 = Math.max(y - halfBlock, 0);
            const x2 = Math.min(x + halfBlock, width - 1);
            const y2 = Math.min(y + halfBlock, height - 1);

            const count = (x2 - x1 + 1) * (y2 - y1 + 1);

            const sum = integral[(y2 + 1) * (width + 1) + (x2 + 1)]
                      - integral[(y1) * (width + 1) + (x2 + 1)]
                      - integral[(y2 + 1) * (width + 1) + (x1)]
                      + integral[(y1) * (width + 1) + (x1)];

            const localMean = sum / count;
            const thresh = localMean - C;

            // Assign pixel white if > threshold, else black
            const idx = y * width + x;
            mask[idx] = gray[idx] > thresh ? 255 : 0;
        }
    }

    return mask;
}

/**
 * Compute distance transform of binary mask
 * Assumes foreground pixels = 255, background = 0
 * Uses approximate Euclidean distance transform
 * @param {Uint8Array} binaryMask Binary mask
 * @param {number} width Image width
 * @param {number} height Image height
 * @returns {Float32Array} Distance map
 */
function distanceTransform(binaryMask, width, height) {
    const dist = new Float32Array(width * height);
    const infinity = 1E9;

    // Initialize distances
    for(let i = 0; i < width * height; i++) {
        dist[i] = binaryMask[i] === 0 ? 0 : infinity;
    }

    // Forward pass
    for(let y = 1; y < height; y++) {
        for(let x = 1; x < width; x++) {
            const idx = y * width + x;
            if(dist[idx] !== 0) {
                dist[idx] = Math.min(dist[idx],
                    dist[(y-1)*width + x] + 1,
                    dist[y*width + (x-1)] + 1,
                    dist[(y-1)*width + (x-1)] + Math.SQRT2);
            }
        }
    }

    // Backward pass
    for(let y = height - 2; y >= 0; y--) {
        for(let x = width - 2; x >= 0; x--) {
            const idx = y * width + x;
            if(dist[idx] !== 0) {
                dist[idx] = Math.min(dist[idx],
                    dist[(y+1)*width + x] + 1,
                    dist[y*width + (x+1)] + 1,
                    dist[(y+1)*width + (x+1)] + Math.SQRT2);
            }
        }
    }

    return dist;
}

/**
 * Find local maxima in distance map to create markers (particles seeds)
 * @param {Float32Array} distMap Distance transform array
 * @param {number} width Image width
 * @param {number} height Image height
 * @param {number} radius Neighborhood radius
 * @returns {Array} Array of marker positions {x, y}
 */
function findLocalMaxima(distMap, width, height, radius = 3) {
    const markers = [];
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const idx = y*width + x;
            const value = distMap[idx];
            let isMax = true;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if(dx === 0 && dy === 0) continue;
                    if(distMap[(y+dy)*width + (x+dx)] >= value) {
                        isMax = false;
                        break;
                    }
                }
                if(!isMax) break;
            }
            if(isMax && value > 0) {
                markers.push({x, y});
            }
        }
    }
    return markers;
}

/**
 * Perform simplified watershed segmentation using markers and distance transform
 * Note: This is a skeleton for integration; full watershed requires a priority queue.
 * We will treat each pixel as belonging to closest marker based on geodesic distance.
 * @param {Uint8Array} binaryMask Foreground mask
 * @param {Array} markers Marker coordinates
 * @param {number} width Image width
 * @param {number} height Image height
 * @returns {Int32Array} Label image (0 background, >0 region labels)
 */
function watershedSegmentation(binaryMask, markers, width, height) {
    const labels = new Int32Array(width * height);
    const queue = [];
    
    // Initialize labels at marker points
    markers.forEach((m, idx) => {
        const pos = m.y * width + m.x;
        labels[pos] = idx + 1; // label 1..N
        queue.push({x: m.x, y: m.y, label: idx + 1});
    });

    // 4-connectivity neighbors
    const neighbors = [
        {dx: -1, dy: 0},
        {dx: 1, dy: 0},
        {dx: 0, dy: -1},
        {dx: 0, dy: 1}
    ];

    while(queue.length > 0) {
        const current = queue.shift();
        neighbors.forEach(({dx, dy}) => {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if(nx >= 0 && nx < width && ny >=0 && ny < height) {
                const nIdx = ny * width + nx;
                if(binaryMask[nIdx] !== 0 && labels[nIdx] === 0) {
                    labels[nIdx] = current.label;
                    queue.push({x: nx, y: ny, label: current.label});
                }
            }
        });
    }

    return labels;
}
