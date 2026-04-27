// Particle Analyzer Engine
class ParticleAnalyzer {
    constructor(imageProcessor) {
        this.processor = imageProcessor;
        this.particles = [];
    }

    async analyze(threshold, darkBg, sizeMin, sizeMax, circularityMin) {
        const binaryImageData = this.processor.applyThreshold(
            this.processor.channels.original, 
            threshold, 
            darkBg
        );

        // Put binary image on canvas for contour detection
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = binaryImageData.width;
        canvas.height = binaryImageData.height;
        ctx.putImageData(binaryImageData, 0, 0);

        // Find contours (connected components)
        this.particles = this.findContours(canvas, sizeMin, sizeMax, circularityMin);
        
        return this.particles;
    }

    findContours(canvas, sizeMin, sizeMax, circularityMin) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const particles = [];

        const visited = new Set();
        let particleId = 1;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                if (data[index + 3] === 255 && !visited.has(index / 4)) {
                    const particle = this.floodFill(canvas, x, y, particleId, visited);
                    
                    if (particle.area >= sizeMin && particle.area <= sizeMax) {
                        const circularity = 4 * Math.PI * particle.area / (particle.perimeter * particle.perimeter);
                        
                        if (circularity >= circularityMin) {
                            particle.id = particleId++;
                            particle.circularity = Math.max(0, Math.min(1, circularity));
                            particle.meanRGB = this.calculateMeanRGB(particle.pixels);
                            particles.push(particle);
                        }
                    }
                }
            }
        }

        return particles.sort((a, b) => b.area - a.area);
    }

    floodFill(canvas, startX, startY, id, visited) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const stack = [{x: startX, y: startY}];
        const pixels = [];
        let area = 0;
        let perimeter = 0;

        const directions = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const index = (y * canvas.width + x) * 4;

            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height || 
                data[index] === 0 || visited.has(index / 4)) {
                continue;
            }

            visited.add(index / 4);
            pixels.push({x, y});
            area++;

            // Perimeter estimation
            const neighbors = this.getNeighbors(canvas, x, y);
            const edgePixels = neighbors.filter(n => !pixels.some(p => p.x === n.x && p.y === n.y));
            perimeter += edgePixels.length;

            // Add neighbors to stack
            directions.forEach(([dx, dy]) => {
                stack.push({x: x + dx, y: y + dy});
            });
        }

        return { pixels, area, perimeter };
    }

    getNeighbors(canvas, x, y) {
        const neighbors = [];
        const directions = [[0,1],[1,0],[0,-1],[-1,0]];
        
        directions.forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                neighbors.push({x: nx, y: ny});
            }
        });
        
        return neighbors;
    }

    calculateMeanRGB(pixels) {
        let r = 0, g = 0, b = 0;
        pixels.forEach(({x, y}) => {
            const index = (y * this.processor.originalImage.width + x) * 4;
            const data = this.processor.channels.original.data;
            r += data[index];
            g += data[index + 1];
            b += data[index + 2];
        });
        
        const count = pixels.length;
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    calculateSummary(imageWidth, imageHeight) {
        const totalArea = this.particles.reduce((sum, p) => sum + p.area, 0);
        const coverage = ((totalArea / (imageWidth * imageHeight)) * 100).toFixed(2);
        
        return {
            totalParticles: this.particles.length,
            totalArea,
            coverage: coverage + '%'
        };
    }
}
