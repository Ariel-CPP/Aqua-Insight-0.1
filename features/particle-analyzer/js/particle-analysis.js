/**
 * particle-analysis.js - Particle Detection & Analysis Engine
 * Aqua Insight - Particle Analyzer
 */

const ParticleAnalysis = {
    /**
     * Detect and analyze particles
     */
    async analyzeParticles(imageData, options) {
        const {
            channel,
            threshold,
            darkBackground,
            sizeMin,
            sizeMax,
            circularityMin,
            circularityMax
        } = options;

        // Show progress
        UI.showLoading('Analyzing particles...');
        UI.updateProgress(10, 100, 'Extracting RGB channels...');

        // Extract RGB channels
        const rgbChannels = Detection.extractRGBChannels(imageData);
        const selectedChannel = rgbChannels[channel + 'Channel'];

        UI.updateProgress(30, 100, 'Applying threshold...');

        // Apply threshold
        const binaryMask = Detection.createBinaryMask(
            selectedChannel,
            threshold,
            darkBackground
        );

        UI.updateProgress(50, 100, 'Finding connected regions...');

        // Find connected components (particles)
        const particles = await this.findConnectedParticles(
            binaryMask,
            rgbChannels,
            imageData.width,
            imageData.height
        );

        UI.updateProgress(70, 100, 'Filtering particles...');

        // Filter by size and circularity
        const filteredParticles = this.filterParticles(
            particles,
            sizeMin,
            sizeMax,
            circularityMin,
            circularityMax
        );

        UI.updateProgress(90, 100, 'Finalizing results...');

        // Sort by size (largest first)
        filteredParticles.sort((a, b) => b.size - a.size);

        // Assign numbers
        filteredParticles.forEach((p, idx) => {
            p.number = idx + 1;
        });

        UI.updateProgress(100, 100, 'Complete!');
        
        return {
            particles: filteredParticles,
            totalParticles: filteredParticles.length,
            totalArea: filteredParticles.reduce((sum, p) => sum + p.size, 0),
            imageWidth: imageData.width,
            imageHeight: imageData.height
        };
    },

    /**
     * Find connected particles using flood fill (BFS)
     */
    async findConnectedParticles(binaryMask, rgbChannels, width, height) {
        const visited = new Uint8Array(width * height);
        const particles = [];
        const pixelCount = width * height;

        // Process in chunks for better performance
        const chunkSize = Math.floor(pixelCount / 100);
        let processed = 0;

        for (let i = 0; i < pixelCount; i++) {
            if (visited[i] === 1 || binaryMask[i] === 0) {
                visited[i] = 1;
                processed++;
                if (processed % chunkSize === 0) {
                    UI.updateProgress(50 + Math.floor((processed / pixelCount) * 20), 100, 'Scanning particles...');
                    await this.yieldToMain();
                }
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

            processed++;
            if (processed % chunkSize === 0) {
                UI.updateProgress(50 + Math.floor((processed / pixelCount) * 20), 100, 'Scanning particles...');
                await this.yieldToMain();
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

        // 8-connectivity (diagonal neighbors included)
        const neighbors = [
            -1, -1,  // top-left
            0, -1,   // top
            1, -1,   // top-right
            -1, 0,   // left
            1, 0,    // right
            -1, 1,   // bottom-left
            0, 1,    // bottom
            1, 1     // bottom-right
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
                const nIdx = ny * width + nx;

                // Check bounds
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (visited[nIdx] === 0 && binaryMask[nIdx] > 0) {
                        visited[nIdx] = 1;
                        queue.push(nIdx);
                    }
                }
            }

            // Safety limit to prevent infinite loops
            if (pixels.length > 50000) break;
        }

        return pixels;
    },

    /**
     * Calculate particle properties
     */
    calculateParticleProperties(pixels, rgbChannels, imageWidth, imageHeight) {
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

        for (const pixel of pixels) {
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
        const perimeter = this.calculatePerimeter(pixels, imageWidth, imageHeight);

        // Calculate circularity: 4π × Area / Perimeter²
        const circularity = perimeter > 0 ? (4 * Math.PI * size) / (perimeter * perimeter) : 0;

        return {
            size,
            centroid,
            perimeter,
            circularity: Math.min(circularity, 1), // Cap at 1
            meanR,
            meanG,
            meanB,
            pixels // Store pixels for overlay
        };
    },

    /**
     * Calculate perimeter using chain code approximation
     */
    calculatePerimeter(pixels, width, height) {
        if (pixels.length === 0) return 0;

        // Create a set for quick lookup
        const pixelSet = new Set(pixels.map(p => p.idx));

        // Find boundary pixels
        const boundaryPixels = pixels.filter(p => {
            const neighbors = [
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 }
            ];

            for (const n of neighbors) {
                const nx = p.x + n.dx;
                const ny = p.y + n.dy;

                // If neighbor is outside the particle (or outside image)
                if (nx < 0 || nx >= width || ny < 0 || ny >= height || !pixelSet.has(ny * width + nx)) {
                    return true; // This is a boundary pixel
                }
            }
            return false;
        });

        // Calculate perimeter using approximation
        // Each boundary pixel contributes approximately 1 to perimeter
        // Corner pixels contribute more
        return boundaryPixels.length;
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
    },

    /**
     * Yield to main thread for UI updates
     */
    yieldToMain() {
        return new Promise(resolve => {
            setTimeout(resolve, 0);
        });
    },

    /**
     * Calculate coverage percentage
     */
    calculateCoverage(particleArea, totalArea) {
        return (particleArea / totalArea) * 100;
    }
};

// Export for use in other modules
window.ParticleAnalysis = ParticleAnalysis;
