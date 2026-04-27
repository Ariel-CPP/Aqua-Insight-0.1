/**
 * particle-analysis.js - Particle Detection & Analysis Engine
 * Aqua Insight v0.1 - Particle Analyzer
 */

var ParticleAnalysis = {
    /**
     * Analyze particles in image
     */
    analyzeParticles: function(imageData, options) {
        var channel = options.channel;
        var threshold = options.threshold;
        var darkBackground = options.darkBackground;
        var sizeMin = options.sizeMin;
        var sizeMax = options.sizeMax;
        var circularityMin = options.circularityMin;
        var circularityMax = options.circularityMax;

        var width = imageData.width;
        var height = imageData.height;

        // 1. Extract RGB channels
        var rgbChannels = Detection.extractRGBChannels(imageData);

        // 2. Get selected channel data
        var selectedChannel;
        
        if (channel === 'gray') {
            // Convert to grayscale for gray channel
            selectedChannel = Detection.toGrayscale(imageData);
        } else {
            // Use RGB channel (red, green, blue)
            selectedChannel = rgbChannels[channel];
        }

        // Check if channel is valid
        if (!selectedChannel) {
            throw new Error('Invalid channel: ' + channel);
        }

        // 3. Create binary mask
        var binaryMask = Detection.createBinaryMask(
            selectedChannel,
            threshold,
            darkBackground
        );

        // 4. Find connected particles
        var particles = this.findConnectedParticles(
            binaryMask,
            rgbChannels,
            width,
            height
        );

        // 5. Filter by size and circularity
        var filteredParticles = this.filterParticles(
            particles,
            sizeMin,
            sizeMax,
            circularityMin,
            circularityMax
        );

        // 6. Sort by size (largest first)
        filteredParticles.sort(function(a, b) {
            return b.size - a.size;
        });

        // 7. Assign numbers
        for (var i = 0; i < filteredParticles.length; i++) {
            filteredParticles[i].number = i + 1;
        }

        return {
            particles: filteredParticles,
            totalParticles: filteredParticles.length,
            totalArea: filteredParticles.reduce(function(sum, p) { return sum + p.size; }, 0),
            imageWidth: width,
            imageHeight: height
        };
    },

    /**
     * Find connected particles using BFS flood fill
     */
    findConnectedParticles: function(binaryMask, rgbChannels, width, height) {
        var visited = new Uint8Array(width * height);
        var particles = [];
        var totalPixels = width * height;

        for (var i = 0; i < totalPixels; i++) {
            if (visited[i] === 1 || binaryMask[i] === 0) {
                continue;
            }

            // Found new particle - flood fill
            var pixelCoords = this.floodFill(i, binaryMask, visited, width, height);

            if (pixelCoords.length > 0) {
                var particle = this.calculateParticleProperties(
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
     * Flood fill using BFS (4-connectivity)
     */
    floodFill: function(startIdx, binaryMask, visited, width, height) {
        var pixels = [];
        var queue = [startIdx];
        visited[startIdx] = 1;

        // 4-connectivity neighbors
        var neighbors = [
            [-1, 0],  // left
            [1, 0],   // right
            [0, -1],  // top
            [0, 1]    // bottom
        ];

        while (queue.length > 0) {
            var current = queue.shift();
            var x = current % width;
            var y = Math.floor(current / width);

            pixels.push({ x: x, y: y, idx: current });

            // Check 4 neighbors
            for (var n = 0; n < neighbors.length; n++) {
                var dx = neighbors[n][0];
                var dy = neighbors[n][1];
                var nx = x + dx;
                var ny = y + dy;

                // Bounds check
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    var nIdx = ny * width + nx;
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
    calculateParticleProperties: function(pixels, rgbChannels, width, height) {
        var size = pixels.length;

        if (size === 0) {
            return {
                size: 0,
                centroid: { x: 0, y: 0 },
                perimeter: 0,
                circularity: 0,
                meanR: 0,
                meanG: 0,
                meanB: 0
            };
        }

        var redChannel = rgbChannels.red;
        var greenChannel = rgbChannels.green;
        var blueChannel = rgbChannels.blue;

        // Calculate centroid and mean RGB
        var sumX = 0, sumY = 0;
        var sumR = 0, sumG = 0, sumB = 0;

        for (var i = 0; i < size; i++) {
            var pixel = pixels[i];
            sumX += pixel.x;
            sumY += pixel.y;
            sumR += redChannel[pixel.idx];
            sumG += greenChannel[pixel.idx];
            sumB += blueChannel[pixel.idx];
        }

        var centroid = {
            x: sumX / size,
            y: sumY / size
        };

        var meanR = sumR / size;
        var meanG = sumG / size;
        var meanB = sumB / size;

        // Calculate perimeter
        var perimeter = this.calculatePerimeter(pixels, width, height);

        // Calculate circularity: 4π × Area / Perimeter²
        var circularity = perimeter > 0
            ? (4 * Math.PI * size) / (perimeter * perimeter)
            : 0;

        return {
            size: size,
            centroid: centroid,
            perimeter: perimeter,
            circularity: Math.min(circularity, 1),
            meanR: meanR,
            meanG: meanG,
            meanB: meanB
        };
    },

    /**
     * Calculate perimeter (boundary pixels)
     */
    calculatePerimeter: function(pixels, width, height) {
        if (pixels.length === 0) return 0;

        // Create pixel lookup set
        var pixelSet = {};
        for (var i = 0; i < pixels.length; i++) {
            pixelSet[pixels[i].idx] = true;
        }

        var boundaryCount = 0;
        var neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (var j = 0; j < pixels.length; j++) {
            var p = pixels[j];

            for (var n = 0; n < neighbors.length; n++) {
                var dx = neighbors[n][0];
                var dy = neighbors[n][1];
                var nx = p.x + dx;
                var ny = p.y + dy;
                var nIdx = ny * width + nx;

                // If neighbor is outside particle or background
                if (nx < 0 || nx >= width || ny < 0 || ny >= height || !pixelSet[nIdx]) {
                    boundaryCount++;
                }
            }
        }

        return boundaryCount;
    },

    /**
     * Filter particles by size and circularity
     */
    filterParticles: function(particles, sizeMin, sizeMax, circularityMin, circularityMax) {
        var filtered = [];
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var sizeOk = p.size >= sizeMin && p.size <= sizeMax;
            var circOk = p.circularity >= circularityMin && p.circularity <= circularityMax;
            if (sizeOk && circOk) {
                filtered.push(p);
            }
        }
        return filtered;
    }
};
