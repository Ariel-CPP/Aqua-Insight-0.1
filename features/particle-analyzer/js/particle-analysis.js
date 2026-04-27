/**
 * particle-analysis.js - Particle Detection & Analysis Engine
 * Aqua Insight - Particle Analyzer
 */

const ParticleAnalysis = {
    /**
     * Detect and analyze particles (synchronous)
     */
    analyzeParticles(imageData, options) {
        const {
            channel,
            threshold,
            darkBackground,
            sizeMin,
            sizeMax,
            circularityMin,
            circularityMax
        } = options;

        const width = imageData.width;
        const height = imageData.height;

        // Extract RGB channels
        const rgbChannels = Detection.extractRGBChannels(imageData);
        const selectedChannel = rgbChannels[channel + 'Channel'];

        // Apply threshold
        const binaryMask = Detection.createBinaryMask(
            selectedChannel,
            threshold,
            darkBackground
        );

        // Find connected components (particles)
        const particles = this.findConnectedParticles(
            binaryMask,
            rgbChannels,
            width,
            height
        );

        // Filter by size and circularity
        const filteredParticles = this.filterParticles(
            particles,
            sizeMin,
            sizeMax,
            circularityMin,
            circularityMax
        );

        // Sort by size (largest first)
        filteredParticles.sort((a, b) => b.size - a.size);

        // Assign numbers
        filteredParticles.forEach((p, idx) => {
            p.number = idx + 1;
        });

        return {
            particles: filteredParticles,
            totalParticles: filteredParticles.length,
            totalArea: filteredParticles.reduce((sum, p) => sum + p.size, 0),
            imageWidth: width,
            imageHeight: height
        };
    },

    /**
     * Find connected particles using flood fill (BFS) - Synchronous
     */
    findConnectedParticles(binaryMask, rgbChannels, width, height) {
        const visited = new Uint8Array(width * height);
        const particles = [];
        const pixelCount = width * height;

        for (let i = 0; i < pixelCount; i++) {
            if (visited[i] === 1 || binaryMask[i] === 0) {
                continue;
            }

            // Found a new particle - flood fill
            const pixelCoords = this.floodFill(i, binaryMask, visited, width, height);
            
            if (pixelCoords.length > 0) {
                const particle = this.calculateParticleProperties(
                    pixelCoords,
                    rgbChannels,
                    width,
                    height
                );
                
                if (particle.size > 0) {
                    particles.push(particle);
                }
            }
        }

        return particles;
    },

    /**
     * Flood fill using BFS (Breadth-First Search)
     */
    floodFill(startIdx, binaryMask, visited, width, height) {
        const pixels = [];
        const queue = [startIdx];
        visited[startIdx] = 1;

        // 4-connectivity untuk stabilitas
        const neighbors = [
            -1, 0,   // left
            1, 0,    // right
            0, -1,   // top
            0, 1     // bottom
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            const x = current % width;
            const y = Math.floor(current / width);

            pixels.push({ x, y, idx: current });

            // Check neighbors
            for (let n = 0; n < neighbors.length; n += 2) {
                const nx = x + neighbors[n];
                const ny = y + neighbors[n + 1];

                // Check bounds
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = ny * width + nx;
                    if (visited[nIdx] === 0 && binaryMask[nIdx] > 0) {
                        visited[nIdx] = 1;
                        queue.push(nIdx);
                    }
                }
            }

            // Safety limit
            if (pixels.length > 100000) break;
        }

        return pixels;
    },

    /**
     * Calculate particle properties
     */
    calculateParticleProperties(pixels, rgbChannels, width, height) {
        const size = pixels.length;

        if (size === 0) {
            return { size: 0, perimeter: 0, circularity: 0, meanR: 0, meanG: 0, meanB: 0 };
        }

        // Calculate centroid
        let sumX = 0, sumY = 0;
        let sumR = 0, sumG = 0, sumB = 0;

        const redChannel = rgbChannels.redChannel;
        const greenChannel = rgbChannels.greenChannel;
        const blueChannel = rgbChannels.blueChannel;

        for (let i = 0; i < size; i++) {
            const pixel = pixels[i];
            sumX += pixel.x;
            sumY += pixel.y;

            sumR += redChannel[pixel.idx];
            sumG += greenChannel[pixel.idx];
            sumB += blueChannel[pixel.idx];
        }

        const centroid = {
            x: sumX / size,
            y: sumY / size
        };

        // Calculate mean RGB
        const meanR = sumR / size;
        const meanG = sumG / size;
        const meanB = sumB / size;

        // Calculate perimeter (edge pixels)
        const perimeter = this.calculatePerimeter(pixels, width, height);

        // Calculate circularity: 4π × Area / Perimeter²
        const circularity = perimeter > 0 ? (4 * Math.PI * size) / (perimeter * perimeter) : 0;

        return {
            size,
            centroid,
            perimeter,
            circularity: Math.min(circularity, 1),
            meanR,
            meanG,
            meanB
        };
    },

    /**
     * Calculate perimeter
     */
    calculatePerimeter(pixels, width, height) {
        if (pixels.length === 0) return 0;

        // Create pixel lookup set
        const pixelSet = new Set();
        for (let i = 0; i < pixels.length; i++) {
            pixelSet.add(pixels[i].idx);
        }

        // Find boundary pixels (4-connectivity)
        let boundaryCount = 0;
        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let i = 0; i < pixels.length; i++) {
            const p = pixels[i];
            
            for (const [dx, dy] of neighbors) {
                const nx = p.x + dx;
                const ny = p.y + dy;

                // If neighbor is outside particle
                if (nx < 0 || nx >= width || ny < 0 || ny >= height || !pixelSet.has(ny * width + nx)) {
                    boundaryCount++;
                    break;
                }
            }
        }

        return boundaryCount;
    },

    /**
     * Filter particles by size and circularity
     */
    filterParticles(particles, sizeMin, sizeMax, circularityMin, circularityMax) {
        return particles.filter(p => {
            const sizeOk = p.size >= sizeMin && p.size <= sizeMax;
            const circOk = p.circularity >= circularityMin && p.circularity <= circularityMax;
            return sizeOk && circOk;
        });
    }
};

// Export for use in other modules
window.ParticleAnalysis = ParticleAnalysis;
