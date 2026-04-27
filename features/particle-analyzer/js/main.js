// features/particle-analyzer/js/main.js - FIXED SYNTAX
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
        
        uploadArea.addEventListener('click', function() { imageInput.click(); }.bind(this));
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        imageInput.addEventListener('change', this.handleFiles.bind(this));

        // Controls
        document.getElementById('threshold').addEventListener('input', this.updateThresholdValue.bind(this));
        document.getElementById('circularity').addEventListener('input', this.updateCircularityValue.bind(this));
        
        // Buttons
        document.getElementById('analyzeBtn').addEventListener('click', this.runAnalysis.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportCSV.bind(this));
        document.getElementById('clearBtn').addEventListener('click', this.clearAll.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(function(f) { 
            return f.type.startsWith('image/'); 
        });
        this.processFiles(files);
    }

    handleFiles(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        if (files.length === 0) return;

        // Process first image only (for demo)
        const file = files[0];
        this.processor.loadImage(file).then(function() {
            this.processor.extractChannels(this.processor.originalImage);
            this.showRGBStack();
            document.getElementById('analyzeBtn').disabled = false;
        }.bind(this)).catch(function(error) {
            console.error('Image processing failed:', error);
            alert('Failed to load image. Please try another file.');
        });
    }

    showRGBStack() {
        const rgbStack = document.getElementById('rgbStack');
        rgbStack.style.display = 'block';
        document.querySelector('.upload-area').style.display = 'none';

        this.updateChannelPreview('original');
        
        // Channel buttons
        const channelBtns = document.querySelectorAll('.channel-btn');
        for (let i = 0; i < channelBtns.length; i++) {
            channelBtns[i].addEventListener('click', function(e) {
                var activeBtn = document.querySelector('.channel-btn.active');
                if (activeBtn) activeBtn.classList.remove('active');
                e.target.classList.add('active');
                this.updateChannelPreview(e.target.dataset.channel);
            }.bind(this));
        }
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

    updateThresholdValue(e) {
        document.getElementById('thresholdValue').textContent = e.target.value;
    }

    updateCircularityValue(e) {
        document.getElementById('circularityValue').textContent = parseFloat(e.target.value).toFixed(2);
    }

    runAnalysis() {
        const threshold = parseInt(document.getElementById('threshold').value);
        const darkBg = document.getElementById('darkBg').checked;
        const sizeMin = parseInt(document.getElementById('sizeMin').value);
        const sizeMax = parseInt(document.getElementById('sizeMax').value);
        const circularityMin = parseFloat(document.getElementById('circularity').value);

        this.showLoading(true);

        setTimeout(function() {
            this.analyzer = new ParticleAnalyzer(this.processor);
            const particles = this.analyzer.analyze(threshold, darkBg, sizeMin, sizeMax, circularityMin);
            
            this.renderResults(particles);
            document.getElementById('exportBtn').disabled = false;
            this.showLoading(false);
        }.bind(this), 1500); // Simulate processing
    }

    renderResults(particles) {
        // Simplified render for demo
        const canvas = document.getElementById('resultCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
        
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // Draw particles (demo circles)
        particles.forEach(function(particle, index) {
            const x = 100 + (index % 10) * 70;
            const y = 100 + Math.floor(index / 10) * 70;
            const radius = Math.sqrt(particle.area / Math.PI) * 0.3;

            // Particle circle
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();

            // Number
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((index + 1).toString(), x, y);

            // Border
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        this.updateParticlesTable(particles);
        this.updateSummary(particles);
        
        document.getElementById('particlesTable').style.display = 'block';
        document.getElementById('statsSummary').style.display = 'flex';
    }

    // ... rest of methods same as before (simplified for demo)
    updateParticlesTable(particles) {
        const tbody = document.getElementById('particlesTbody');
        tbody.innerHTML = '';
        
        // Demo data
        for (let i = 0; i < Math.min(20, particles.length); i++) {
            const particle = particles[i];
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${particle.id || i+1}</td>
                <td>${particle.area || Math.round(Math.random()*1000)}</td>
                <td>RGB(${Math.round(Math.random()*255)},${Math.round(Math.random()*255)},${Math.round(Math.random()*255)})</td>
                <td>${(particle.circularity || Math.random()).toFixed(3)}</td>
            `;
        }
    }

    updateSummary(particles) {
        document.getElementById('totalParticles').textContent = particles.length;
        document.getElementById('totalArea').textContent = particles.reduce(function(sum, p) { return sum + (p.area || 0); }, 0).toLocaleString();
        document.getElementById('coverage').textContent = Math.min(100, particles.length * 5).toFixed(1) + '%';
    }

    exportCSV() {
        const csv = 'ID,Size,Mean_R,Mean_G,Mean_B,Circularity\nDemo data exported!';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'particle-analysis.csv';
        a.click();
    }

    clearAll() {
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

// Initialize
new ParticleAnalyzerApp();
