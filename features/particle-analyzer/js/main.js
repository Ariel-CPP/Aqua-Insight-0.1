/**
 * main.js - Main Application Controller
 * Aqua Insight - Particle Analyzer
 */

const App = {
    // State
    images: [],
    currentImageIndex: 0,
    currentImageData: null,
    selectedChannel: 'red',
    analysisResults: null,
    isAnalyzing: false,

    // Settings
    settings: {
        threshold: 128,
        darkBackground: false,
        sizeMin: 10,
        sizeMax: 5000,
        circularityMin: 0.2,
        circularityMax: 1.0
    },

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.initCanvas();
        this.bindSliders();
        
        console.log('✅ Particle Analyzer initialized');
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // File input
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // File upload area click
        const uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', () => imageInput?.click());
        }

        // RGB channel buttons
        document.querySelectorAll('.rgb-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectChannel(e));
        });

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.runAnalysis());
        }

        // Export buttons
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('exportPNG')?.addEventListener('click', () => this.exportPNG());

        // Back to dashboard
        document.getElementById('backToDashboard')?.addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // Dark background checkbox
        document.getElementById('darkBackground')?.addEventListener('change', (e) => {
            this.settings.darkBackground = e.target.checked;
        });
    },

    /**
     * Initialize canvas
     */
    initCanvas() {
        const canvas = document.getElementById('imageCanvas');
        if (canvas) {
            // Set initial size
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            
            // Initialize zoom/pan
            ZoomPan.init(canvas);
            
            // Handle resize
            window.addEventListener('resize', () => {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                if (this.currentImageData) {
                    ZoomPan.fitToView();
                }
            });
        }
    },

    /**
     * Bind all sliders
     */
    bindSliders() {
        // Threshold slider
        const thresholdSlider = document.getElementById('thresholdSlider');
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                this.settings.threshold = parseInt(e.target.value);
                document.getElementById('thresholdValue').textContent = e.target.value;
            });
        }

        // Size min slider
        const sizeMinSlider = document.getElementById('sizeMinSlider');
        if (sizeMinSlider) {
            sizeMinSlider.addEventListener('input', (e) => {
                this.settings.sizeMin = parseInt(e.target.value);
                document.getElementById('sizeMinValue').textContent = e.target.value;
            });
        }

        // Size max slider
        const sizeMaxSlider = document.getElementById('sizeMaxSlider');
        if (sizeMaxSlider) {
            sizeMaxSlider.addEventListener('input', (e) => {
                this.settings.sizeMax = parseInt(e.target.value);
                document.getElementById('sizeMaxValue').textContent = e.target.value;
            });
        }

        // Circularity min slider
        const circMinSlider = document.getElementById('circularityMinSlider');
        if (circMinSlider) {
            circMinSlider.addEventListener('input', (e) => {
                this.settings.circularityMin = parseFloat(e.target.value);
                document.getElementById('circularityMinValue').textContent = parseFloat(e.target.value).toFixed(2);
            });
        }

        // Circularity max slider
        const circMaxSlider = document.getElementById('circularityMaxSlider');
        if (circMaxSlider) {
            circMaxSlider.addEventListener('input', (e) => {
                this.settings.circularityMax = parseFloat(e.target.value);
                document.getElementById('circularityMaxValue').textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
    },

    /**
     * Handle file selection
     */
    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        UI.showLoading('Loading images...');

        this.images = [];
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        for (const file of files) {
            try {
                const imageData = await this.loadImage(file);
                this.images.push({
                    file,
                    imageData,
                    name: file.name
                });

                // Add to file list
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span>📷 ${file.name}</span>
                    <button onclick="App.removeImage('${file.name}')">✕</button>
                `;
                fileList.appendChild(fileItem);
            } catch (err) {
                UI.showError(`Failed to load: ${file.name}`);
            }
        }

        UI.hideLoading();

        if (this.images.length > 0) {
            this.loadCurrentImage();
        }
    },

    /**
     * Load image from file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    // Create canvas to get image data
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    resolve({
                        img,
                        imageData: ctx.getImageData(0, 0, img.width, img.height),
                        width: img.width,
                        height: img.height
                    });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Load current image
     */
    loadCurrentImage() {
        if (this.images.length === 0) return;

        const current = this.images[this.currentImageIndex];
        this.currentImageData = current.imageData;

        // Set image to zoom/pan
        const canvas = document.getElementById('imageCanvas');
        const img = current.imageData.img;
        
        ZoomPan.setImage(img, img.width, img.height);

        // Show controls
        UI.toggleSection('rgbStackSection', true);
        UI.toggleSection('analysisSettings', true);
        UI.setButtonState('analyzeBtn', true, '🔬 Analyze Particles');

        // Calculate and show channel contrast
        this.analyzeChannelContrast();
    },

    /**
     * Analyze channel contrast
     */
    analyzeChannelContrast() {
        if (!this.currentImageData) return;

        const contrast = Detection.calculateContrastRatio(this.currentImageData);
        
        // Auto-select best channel
        this.selectedChannel = contrast.bestChannel;
        
        // Update button states
        document.querySelectorAll('.rgb-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.channel === this.selectedChannel);
        });
    },

    /**
     * Select RGB channel
     */
    selectChannel(e) {
        const channel = e.target.dataset.channel;
        this.selectedChannel = channel;

        // Update button states
        document.querySelectorAll('.rgb-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.channel === channel);
        });
    },

    /**
     * Remove image from list
     */
    removeImage(filename) {
        const idx = this.images.findIndex(img => img.name === filename);
        if (idx > -1) {
            this.images.splice(idx, 1);
            
            // Update file list
            const fileList = document.getElementById('fileList');
            const items = fileList.querySelectorAll('.file-item');
            items[idx]?.remove();

            // Update current index
            if (this.currentImageIndex >= this.images.length) {
                this.currentImageIndex = Math.max(0, this.images.length - 1);
            }

            if (this.images.length > 0) {
                this.loadCurrentImage();
            } else {
                this.clearCanvas();
            }
        }
    },

    /**
     * Clear canvas
     */
    clearCanvas() {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        UI.toggleSection('rgbStackSection', false);
        UI.toggleSection('analysisSettings', false);
        UI.setButtonState('analyzeBtn', false);
    },

    /**
     * Run particle analysis
     */
    async runAnalysis() {
        if (!this.currentImageData || this.isAnalyzing) return;

        this.isAnalyzing = true;
        UI.setButtonState('analyzeBtn', false, '⏳ Analyzing...');

        try {
            const results = await ParticleAnalysis.analyzeParticles(
                this.currentImageData.imageData,
                {
                    channel: this.selectedChannel,
                    threshold: this.settings.threshold,
                    darkBackground: this.settings.darkBackground,
                    sizeMin: this.settings.sizeMin,
                    sizeMax: this.settings.sizeMax,
                    circularityMin: this.settings.circularityMin,
                    circularityMax: this.settings.circularityMax
                }
            );

            this.analysisResults = results;

            // Update summary
            this.updateSummary(results);

            // Render overlay
            ZoomPan.particles = results.particles;
            ZoomPan.renderWithOverlay(results.particles);

            // Show results table
            this.showResultsTable(results);

            // Show results panel
            UI.toggleSection('resultsPanel', true);
            
            UI.hideLoading();
            UI.showSuccess(`Found ${results.totalParticles} particles!`);

        } catch (error) {
            console.error('Analysis error:', error);
            UI.hideLoading();
            UI.showError('Analysis failed. Please try again.');
        }

        this.isAnalyzing = false;
        UI.setButtonState('analyzeBtn', true, '🔬 Analyze Particles');
    },

    /**
     * Update summary section
     */
    updateSummary(results) {
        UI.toggleSection('summarySection', true);

        const coverage = ((results.totalArea / (results.imageWidth * results.imageHeight)) * 100).toFixed(2);

        document.getElementById('totalParticles').textContent = results.totalParticles;
        document.getElementById('totalArea').textContent = Utils.formatNumber(results.totalArea) + ' px²';
        document.getElementById('coveragePercent').textContent = coverage + '%';
    },

    /**
     * Show results table
     */
    showResultsTable(results) {
        const tbody = document.querySelector('#resultsTable tbody');
        tbody.innerHTML = '';

        results.particles.forEach(particle => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>#${particle.number}</strong></td>
                <td>${particle.size}</td>
                <td>${particle.meanR.toFixed(1)}</td>
                <td>${particle.meanG.toFixed(1)}</td>
                <td>${particle.meanB.toFixed(1)}</td>
                <td>${particle.circularity.toFixed(3)}</td>
            `;
            tbody.appendChild(row);
        });
    },

    /**
     * Export to CSV
     */
    exportCSV() {
        if (!this.analysisResults) {
            UI.showError('No analysis results to export');
            return;
        }
        Export.exportToCSV(this.analysisResults);
        UI.showSuccess('CSV exported successfully!');
    },

    /**
     * Export to PNG
     */
    exportPNG() {
        if (!this.analysisResults) {
            UI.showError('No analysis results to export');
            return;
        }
        
        const canvas = document.getElementById('imageCanvas');
        Export.exportToPNG(
            canvas,
            this.analysisResults.particles,
            this.analysisResults.imageWidth,
            this.analysisResults.imageHeight
        );
        UI.showSuccess('PNG exported successfully!');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Extend ZoomPan for export functionality
ZoomPan.drawParticleOverlayOnContext = function(ctx, particles) {
    particles.forEach(particle => {
        const { centroid, number } = particle;
        const x = centroid.x;
        const y = centroid.y;

        // Draw bounding circle
        ctx.beginPath();
        ctx.arc(x, y, Math.sqrt(particle.size / Math.PI) + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw number label
        ctx.fillStyle = 'rgba(0, 212, 255, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ... (previous code continues)

        // Background for number
        const labelRadius = 12;
        ctx.beginPath();
        ctx.arc(x, y - Math.sqrt(particle.size / Math.PI) - 15, labelRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 50, 70, 0.9)';
        ctx.fill();

        // Draw number
        ctx.fillStyle = '#00d4ff';
        ctx.fillText(number.toString(), x, y - Math.sqrt(particle.size / Math.PI) - 15);
    });
};
