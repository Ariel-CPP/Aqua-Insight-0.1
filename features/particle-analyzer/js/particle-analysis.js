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
     * Find connected particles using flood fill
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
     * Flood fill
