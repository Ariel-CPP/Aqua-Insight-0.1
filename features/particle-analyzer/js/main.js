/**
 * main.js - Main Application Controller
 * Aqua Insight v0.1 - Particle Analyzer
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
        console.log('🚀 Initializing Aqua Insight - Particle Analyzer');
        
        this.bindEvents();
        this.initCanvas();
        this.bindSliders();
        this.bindZoomControls();
        this.bindDragDrop();
        
        console.log('✅ Application initialized');
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

        // Upload area click
        const uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', () => imageInput?.click());
        }

        // RGB channel buttons
        document.querySelectorAll('.rgb-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectChannel(e));
        });

        // Dark background checkbox
        document.getElementById('darkBackground')?.addEventListener('change', (e) => {
            this.settings.darkBackground = e.target.checked;
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
            window.location.href = '../../index.html';
        });

        // File list remove buttons (event delegation)
        document.getElementById('fileList')?.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const filename = e.target.dataset.filename;
                if (filename) this.removeImage(filename);
            }
        });

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.currentImageData) {
                ZoomPan.fitToView();
            }
        }, 200));
    },

    /**
     * Bind zoom controls
     */
    bindZoomControls() {
        document.getElementById('zoomIn')?.addEventListener('click', () => ZoomPan.zoomIn());
        document.getElementById('zoomOut')?.addEventListener('click', () => ZoomPan.zoomOut());
        document.getElementById('zoomFit')?.addEventListener('click', () => ZoomPan.fitToView());
        document.getElementById('zoomReset')?.addEventListener('click', () => ZoomPan.resetZoom());
    },

    /**
     * Bind drag and drop
     */
    bindDragDrop() {
        const uploadArea = document.getElementById('fileUploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const input = document.getElementById('imageInput');
                if (input) {
                    const dt = new DataTransfer();
                    Array.from(files).forEach(f => dt.items.add(f));
                    input.files = dt.files;
                    this.handleFileSelect({ target: input });
                }
            }
        });
    },

    /**
     * Initialize canvas
     */
    initCanvas() {
        const canvas = document.getElementById('imageCanvas');
        if (canvas) {
            // Set canvas size
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            
            // Initialize zoom/pan
            ZoomPan.init(canvas);
        }
    },

    /**
     * Bind all sliders
     */
    bindSliders() {
        // Threshold
        const thresholdSlider = document.getElementById('thresholdSlider');
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                this.settings.threshold = parseInt(e.target.value);
                document.getElementById('thresholdValue').textContent = e.target.value;
            });
        }

        // Size Min
        const sizeMinSlider = document.getElementById('sizeMinSlider');
        if (sizeMinSlider) {
            sizeMinSlider.addEventListener('input', (e) => {
                this.settings.sizeMin = parseInt(e.target.value);
                document.getElementById('sizeMinValue').textContent = e.target.value;
            });
        }

        // Size Max
        const sizeMaxSlider = document.getElementById('sizeMaxSlider');
        if (sizeMaxSlider) {
            sizeMaxSlider.addEventListener('input', (e) => {
                this.settings.sizeMax = parseInt(e.target.value);
                document.getElementById('sizeMaxValue').textContent = e.target.value;
            });
        }

        // Circularity Min
        const circMinSlider = document.getElementById('circularityMinSlider');
        if (circMinSlider) {
            circMinSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.settings.circularityMin = value;
                document.getElementById('circularityMinValue').textContent = value.toFixed(2);
            });
        }
    },

    /**
     * Handle file selection
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        UI.showLoading('Loading images...');

        this.images = [];
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        // Load all images
        let loadedCount = 0;
        const loadPromises = files.map(file => this.loadImage(file));

        Promise.all(loadPromises)
            .then(results => {
                results.forEach((imageData, idx) => {
                    if (imageData) {
                        this.images.push({
                            file: files[idx],
                            imageData: imageData,
                            name: files[idx].name
                        });

                        // Add to file list UI
                        this.addFileItem(files[idx].name);
                        loadedCount++;
                    }
                });

                UI.hideLoading();

                if (this.images.length > 0) {
                    this.currentImageIndex = 0;
                    this.loadCurrentImage();
                    UI.showSuccess(`Loaded ${loadedCount} image(s)`);
                } else {
                    UI.showError('No valid images loaded');
                }
            })
            .catch(err => {
                UI.hideLoading();
                UI.showError('Failed to load images: ' + err.message);
                console.error('Load error:', err);
            });
    },

    /**
     * Load single image file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    // Create canvas to extract image data
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    resolve({
                        img: img,
                        imageData: ctx.getImageData(0, 0, img.width, img.height),
                        width: img.width,
                        height: img.height
                    });
                };

                img.onerror = () => reject(new Error('Failed to decode image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Add file item to list
     */
    addFileItem(filename) {
        const fileList = document.getElementById('fileList');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>📷 ${filename}</span>
            <button data-filename="${filename}">✕</button>
        `;
        fileList.appendChild(fileItem);
    },

    /**
     * Load current image
     */
    loadCurrentImage() {
        if (this.images.length === 0) return;

        const current = this.images[this.currentImageIndex];
        if (!current) return;

        this.currentImageData = current.imageData;

        // Set image to zoom/pan
        ZoomPan.setImage(
            current.imageData.img,
            current.imageData.width,
            current.imageData.height
        );

        // Show control sections
        UI.toggleSection('rgbStackSection', true);
        UI.toggleSection('analysisSettings', true);
        UI.setButtonState('analyzeBtn', true, '🔬 Analyze Particles');

        // Render channel previews
        renderChannelPreviews(this.currentImageData.imageData, this.selectedChannel);

        // Auto-select best channel
        this.analyzeChannelContrast();

        // Hide previous results
        UI.toggleSection('summarySection', false);
        UI.toggleSection('resultsPanel', false);
        UI.toggleSection('exportSection', false);
        ZoomPan.particles = [];
    },

    /**
     * Analyze channel contrast
     */
    analyzeChannelContrast() {
        if (!this.currentImageData) return;

        const rgbChannels = Detection.extractRGBChannels(this.currentImageData.imageData);
        const contrast = Detection.calculateContrastRatio(rgbChannels);

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

        if (this.currentImageData) {
            renderChannelPreviews(this.currentImageData.imageData, channel);
        }
    },

    /**
     * Remove image from list
     */
    removeImage(filename) {
        const idx = this.images.findIndex(img => img.name === filename);
        if (idx > -1) {
            this.images.splice(idx, 1);

            // Remove from file list UI
            const fileList = document.getElementById('fileList');
            const items = fileList.querySelectorAll('.file-item');
            if (items[idx]) items[idx].remove();

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
        ZoomPan.particles = [];
        ZoomPan.drawEmptyCanvas();
        
        this.currentImageData = null;
        
        UI.toggleSection('rgbStackSection', false);
        UI.toggleSection('analysisSettings', false);
        UI.toggleSection('summarySection', false);
        UI.toggleSection('resultsPanel', false);
        UI.toggleSection('exportSection', false);
        UI.toggleSection('channelPreviewSection', false);
        
        UI.setButtonState('analyzeBtn', false);
    },

    /**
     * Run particle analysis
     */
    runAnalysis() {
        if (!this.currentImageData || this.isAnalyzing) return;

        this.isAnalyzing = true;
        UI.setButtonState('analyzeBtn', false, '⏳ Analyzing...');
        UI.showLoading('Analyzing particles...');

        try {
            // Run analysis
            const results = ParticleAnalysis.analyzeParticles(
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

            // Show export section
            UI.toggleSection('exportSection', true);

            UI.hideLoading();
            UI.showSuccess(`Found ${results.totalParticles} particles!`);

        } catch (error) {
            console.error('Analysis error:', error);
            UI.hideLoading();
            UI.showError('Analysis failed: ' + error.message);
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

        document.getElementById('totalParticles').textContent = Utils.formatNumber(results.totalParticles);
        document.getElementById('totalArea').textContent = Utils.formatNumber(results.totalArea) + ' px²';
        document.getElementById('coveragePercent').textContent = coverage + '%';
    },

    /**
     * Show results table
     */
    showResultsTable(results) {
        UI.toggleSection('resultsPanel', true);

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

/**
 * Render channel previews (module-level function)
 */
function renderChannelPreviews(imageData, selectedChannel = 'gray') {
    const width = imageData.width;
    const height = imageData.height;

    // Get canvas contexts
    const fullRgbCanvas = document.getElementById('fullRgbCanvas');
    const grayscaleCanvas = document.getElementById('grayscaleCanvas');
    const redCanvas = document.getElementById('redCanvas');
    const greenCanvas = document.getElementById('greenCanvas');
    const blueCanvas = document.getElementById('blueCanvas');
    const edgeCanvas = document.getElementById('edgeCanvas');

    if (!fullRgbCanvas) return;

    // Set canvas dimensions
    [fullRgbCanvas, grayscaleCanvas, redCanvas, greenCanvas, blueCanvas, edgeCanvas].forEach(canvas => {
        if (canvas) {
            canvas.width = width;
            canvas.height = height;
        }
    });

        // Draw Full RGB
    const ctxFullRgb = fullRgbCanvas.getContext('2d');
    ctxFullRgb.putImageData(imageData, 0, 0);

    // Create grayscale
    const gray = Detection.toGrayscale(imageData);
    const grayImageData = Detection.createGrayscaleImageData(gray, width, height);
    grayscaleCanvas.getContext('2d').putImageData(grayImageData, 0, 0);

    // Extract RGB channels
    const data = imageData.data;
    const redChannel = new Uint8ClampedArray(width * height * 4);
    const greenChannel = new Uint8ClampedArray(width * height * 4);
    const blueChannel = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;

        // Red channel
        redChannel[idx] = data[idx];
        redChannel[idx + 1] = 0;
        redChannel[idx + 2] = 0;
        redChannel[idx + 3] = 255;

        // Green channel
        greenChannel[idx] = 0;
        greenChannel[idx + 1] = data[idx + 1];
        greenChannel[idx + 2] = 0;
        greenChannel[idx + 3] = 255;

        // Blue channel
        blueChannel[idx] = 0;
        blueChannel[idx + 1] = 0;
        blueChannel[idx + 2] = data[idx + 2];
        blueChannel[idx + 3] = 255;
    }

    redCanvas.getContext('2d').putImageData(new ImageData(redChannel, width, height), 0, 0);
    greenCanvas.getContext('2d').putImageData(new ImageData(greenChannel, width, height), 0, 0);
    blueCanvas.getContext('2d').putImageData(new ImageData(blueChannel, width, height), 0, 0);

    // Edge detection based on selected channel
    let edgeSource;
    if (selectedChannel === 'red') {
        edgeSource = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            edgeSource[i] = data[i * 4];
        }
    } else if (selectedChannel === 'green') {
        edgeSource = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            edgeSource[i] = data[i * 4 + 1];
        }
    } else if (selectedChannel === 'blue') {
        edgeSource = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            edgeSource[i] = data[i * 4 + 2];
        }
    } else {
        edgeSource = gray;
    }

    // Apply Sobel edge detection
    const edge = Detection.sobelEdgeDetection(edgeSource, width, height);
    const edgeImageData = Detection.createEdgeImageData(edge, width, height);
    edgeCanvas.getContext('2d').putImageData(edgeImageData, 0, 0);

    // Show channel preview section
    UI.toggleSection('channelPreviewSection', true);
}
