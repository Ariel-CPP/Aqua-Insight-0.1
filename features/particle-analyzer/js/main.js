class ParticleAnalyzerApp {
    constructor() {
        this.processor = new ImageProcessor();
        this.analyzer = null;
        this.currentImageData = null;
        this.resultCanvas = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateControls();
    }

    bindEvents() {
        // Upload
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        
        uploadArea.addEventListener('click', () => imageInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver);
        uploadArea.addEventListener('drop', this.handleDrop);
        imageInput.addEventListener('change', this.handleFiles);

        // Controls
        document.getElementById('threshold').addEventListener('input', this.updateThresholdValue);
        document.getElementById('circularity').addEventListener('input', this.updateCircularityValue);
        
        // Buttons
        document.getElementById('analyzeBtn').addEventListener('click', this.runAnalysis);
        document.getElementById('exportBtn').addEventListener('click', this.exportCSV);
        document.getElementById('clearBtn').addEventListener('click', this.clearAll);
    }

    handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDrop = async (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        await this.processFiles(files);
    }

    handleFiles = async (e) => {
        const files = Array.from(e.target.files);
        await this.processFiles(files);
    }

    async processFiles(files) {
        if (files.length === 0) return;

        // Process first image only (for demo)
        const file = files[0];
        try {
            await this.processor.loadImage(file);
            this.processor.extractChannels(this.processor.originalImage);
            this.showRGBStack();
            document.getElementById('analyzeBtn').disabled = false;
        } catch (error) {
            console.error('Image processing failed:', error);
            alert('Failed to load image. Please try another file.');
        }
    }

    showRGBStack() {
        const rgbStack = document.getElementById('rgbStack');
        rgbStack.style.display = 'block';
        document.querySelector('.upload-area').style.display = 'none';

        this.updateChannelPreview('original');
        
        // Channel buttons
        document.querySelectorAll('.channel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.channel-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.updateChannelPreview(e.target.dataset.channel);
            });
        });
    }

    updateChannelPreview(channel) {
        const canvas = document.getElementById('previewCanvas');
        const ctx = canvas.getContext('2d');
        const imageData = this.processor.getChannelImageData(channel);
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        this.currentImageData = imageData;
    }

    updateThresholdValue = (e) => {
        document.getElementById('thresholdValue').textContent = e.target.value;
    }

    updateCircularityValue = (e) => {
        document.getElementById('circularityValue').textContent = parseFloat(e.target.value).toFixed(2);
    }

    async runAnalysis = async () => {
        const threshold = parseInt(document.getElementById('threshold').value);
        const darkBg = document.getElementById('darkBg').checked;
        const sizeMin = parseInt(document.getElementById('sizeMin').value);
        const sizeMax = parseInt(document.getElementById('sizeMax').value);
        const circularityMin = parseFloat(document.getElementById('circularity').value);

        this.showLoading(true);

        try {
            this.analyzer = new ParticleAnalyzer(this.processor);
            const particles = await this.analyzer.analyze(threshold, darkBg, sizeMin, sizeMax, circularityMin);
            
            this.renderResults(particles);
            document.getElementById('exportBtn').disabled = false;
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Analysis failed. Please check your parameters.');
        } finally {
            this.showLoading(false);
        }
    }

    renderResults(particles) {
        const canvas = document.getElementById('resultCanvas');
        const ctx = canvas.getContext('2d');
        const imgData = this.processor.channels.original;
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        ctx.putImageData(imgData, 0, 0);

        // Draw particles
        particles.forEach(particle => {
            const x = particle.pixels[0].x;
            const y = particle.pixels[0].y;
            
            // Bounding box
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 5, y - 5, 10, 10);
            
            // Number label
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(particle.id.toString(), x, y - 10);
        });

        // Update table
        this.updateParticlesTable(particles);
        this.updateSummary(particles);
        
        document.getElementById('particlesTable').style.display = 'block';
        document.getElementById('statsSummary').style.display = 'flex';
    }

    updateParticlesTable(particles) {
        const tbody = document.getElementById('particlesTbody');
        tbody.innerHTML = '';

        particles.forEach(particle => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${particle.id}</td>
                <td>${particle.area.toLocaleString()}</td>
                <td>RGB(${particle.meanRGB.r},${particle.meanRGB.g},${particle.meanRGB.b})</td>
                <td>${particle.circularity.toFixed(3)}</td>
            `;
        });
    }

    updateSummary(particles) {
        const summary = this.analyzer.calculateSummary(
            this.processor.originalImage.width, 
            this.processor.originalImage.height
        );
        
        document.getElementById('totalParticles').textContent = summary.totalParticles;
        document.getElementById('totalArea').textContent = summary.totalArea.toLocaleString();
        document.getElementById('coverage').textContent = summary.coverage;
    }

    exportCSV = () => {
        if (!this.analyzer || !this.analyzer.particles.length) return;

        let csv = 'ID,Size,Mean_R,Mean_G,Mean_B,Circularity\n';
        this.analyzer.particles.forEach(p => {
            csv += `${p.id},${p.area},${p.meanRGB.r},${p.meanRGB.g},${p.meanRGB.b},${p.circularity.toFixed(4)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `particle-analysis-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearAll = () => {
        document.getElementById('imageInput').value = '';
        document.getElementById('rgbStack').style.display = 'none';
        document.querySelector('.upload-area').style.display = 'block';
        document.getElementById('analyzeBtn').disabled = true;
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('particlesTable').style.display = 'none';
        document.getElementById('statsSummary').style.display = 'none';
        this.processor = new ImageProcessor();
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').classList.toggle('active', show);
    }
}

// Initialize App
new ParticleAnalyzerApp();
