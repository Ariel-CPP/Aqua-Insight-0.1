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
    init: function() {
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
    bindEvents: function() {
        var self = this;
        
        // File input
        var imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                self.handleFileSelect(e);
            });
        }

        // Upload area click
        var uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', function() {
                if (imageInput) imageInput.click();
            });
        }

        // RGB channel buttons
        var rgbButtons = document.querySelectorAll('.rgb-btn');
        for (var i = 0; i < rgbButtons.length; i++) {
            rgbButtons[i].addEventListener('click', function(e) {
                self.selectChannel(e);
            });
        }

        // Dark background checkbox
        var darkBg = document.getElementById('darkBackground');
        if (darkBg) {
            darkBg.addEventListener('change', function(e) {
                self.settings.darkBackground = e.target.checked;
            });
        }

        // Analyze button
        var analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', function() {
                self.runAnalysis();
            });
        }

        // Export buttons
        var exportCSV = document.getElementById('exportCSV');
        if (exportCSV) {
            exportCSV.addEventListener('click', function() {
                self.exportCSV();
            });
        }

        var exportPNG = document.getElementById('exportPNG');
        if (exportPNG) {
            exportPNG.addEventListener('click', function() {
                self.exportPNG();
            });
        }

        // Back to dashboard
        var backBtn = document.getElementById('backToDashboard');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.href = '../../index.html';
            });
        }

        // File list remove buttons (event delegation)
        var fileList = document.getElementById('fileList');
        if (fileList) {
            fileList.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON') {
                    var filename = e.target.getAttribute('data-filename');
                    if (filename) self.removeImage(filename);
                }
            });
        }

        // Window resize
        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (self.currentImageData) {
                    ZoomPan.fitToView();
                }
            }, 200);
        });
    },

    /**
     * Bind zoom controls
     */
    bindZoomControls: function() {
        var zoomIn = document.getElementById('zoomIn');
        var zoomOut = document.getElementById('zoomOut');
        var zoomFit = document.getElementById('zoomFit');
        var zoomReset = document.getElementById('zoomReset');

        if (zoomIn) zoomIn.addEventListener('click', function() { ZoomPan.zoomIn(); });
        if (zoomOut) zoomOut.addEventListener('click', function() { ZoomPan.zoomOut(); });
        if (zoomFit) zoomFit.addEventListener('click', function() { ZoomPan.fitToView(); });
        if (zoomReset) zoomReset.addEventListener('click', function() { ZoomPan.resetZoom(); });
    },

    /**
     * Bind drag and drop
     */
    bindDragDrop: function() {
        var self = this;
        var uploadArea = document.getElementById('fileUploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            var files = e.dataTransfer.files;
            if (files.length > 0) {
                var input = document.getElementById('imageInput');
                if (input) {
                    var dt = new DataTransfer();
                    for (var i = 0; i < files.length; i++) {
                        dt.items.add(files[i]);
                    }
                    input.files = dt.files;
                    self.handleFileSelect({ target: input });
                }
            }
        });
    },

    /**
     * Initialize canvas
     */
    initCanvas: function() {
        var canvas = document.getElementById('imageCanvas');
        if (canvas) {
            var container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            ZoomPan.init(canvas);
        }
    },

    /**
     * Bind all sliders
     */
    bindSliders: function() {
        var thresholdSlider = document.getElementById('thresholdSlider');
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', function(e) {
                this.settings.threshold = parseInt(e.target.value, 10);
                var val = document.getElementById('thresholdValue');
                if (val) val.textContent = e.target.value;
            }.bind(this));
        }

        var sizeMinSlider = document.getElementById('sizeMinSlider');
        if (sizeMinSlider) {
            sizeMinSlider.addEventListener('input', function(e) {
                this.settings.sizeMin = parseInt(e.target.value, 10);
                var val = document.getElementById('sizeMinValue');
                if (val) val.textContent = e.target.value;
            }.bind(this));
        }

        var sizeMaxSlider = document.getElementById('sizeMaxSlider');
        if (sizeMaxSlider) {
            sizeMaxSlider.addEventListener('input', function(e) {
                this.settings.sizeMax = parseInt(e.target.value, 10);
                var val = document.getElementById('sizeMaxValue');
                if (val) val.textContent = e.target.value;
            }.bind(this));
        }

        var circMinSlider = document.getElementById('circularityMinSlider');
        if (circMinSlider) {
            circMinSlider.addEventListener('input', function(e) {
                var value = parseInt(e.target.value, 10) / 100;
                this.settings.circularityMin = value;
                var val = document.getElementById('circularityMinValue');
                if (val) val.textContent = value.toFixed(2);
            }.bind(this));
        }
    },

    /**
     * Handle file selection
     */
    handleFileSelect: function(e) {
        var self = this;
        var files = Array.from(e.target.files);
        if (files.length === 0) return;

        UI.showLoading('Loading images...');

        this.images = [];
        var fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = '';

        var loadPromises = [];
        for (var i = 0; i < files.length; i++) {
            loadPromises.push(this.loadImage(files[i]));
        }

        Promise.all(loadPromises).then(function(results) {
            var loadedCount = 0;
            for (var j = 0; j < results.length; j++) {
                if (results[j]) {
                    self.images.push({
                        file: files[j],
                        imageData: results[j],
                        name: files[j].name
                    });
                    self.addFileItem(files[j].name);
                    loadedCount++;
                }
            }

            UI.hideLoading();

            if (self.images.length > 0) {
                self.currentImageIndex = 0;
                self.loadCurrentImage();
                UI.showSuccess('Loaded ' + loadedCount + ' image(s)');
            } else {
                UI.showError('No valid images loaded');
            }
        }).catch(function(err) {
            UI.hideLoading();
            UI.showError('Failed to load images: ' + err.message);
            console.error('Load error:', err);
        });
    },

    /**
     * Load single image file
     */
    loadImage: function(file) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            var reader = new FileReader();

            reader.onload = function(e) {
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    resolve({
                        img: img,
                        imageData: ctx.getImageData(0, 0, img.width, img.height),
                        width: img.width,
                        height: img.height
                    });
                };

                img.onerror = function() {
                    reject(new Error('Failed to decode image'));
                };
                img.src = e.target.result;
            };

            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Add file item to list
     */
    addFileItem: function(filename) {
        var fileList = document.getElementById('fileList');
        if (!fileList) return;
        
        var fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = '<span>📷 ' + filename + '</span><button data-filename="' + filename + '">✕</button>';
        fileList.appendChild(fileItem);
    },

       /**
     * Load current image
     */
    loadCurrentImage: function() {
        if (this.images.length === 0) return;

        var current = this.images[this.currentImageIndex];
        if (!current) return;

        this.currentImageData = current.imageData;

        // Set image to zoom/pan
        ZoomPan.setImage(
            current.imageData.img,
            current.imageData.width,
            current.imageData.height
        );

        // Show control sections
        this.toggleSection('rgbStackSection', true);
        this.toggleSection('analysisSettings', true);
        this.setButtonState('analyzeBtn', true, '🔬 Analyze Particles');

        // Render channel previews
        renderChannelPreviews(this.currentImageData.imageData, this.selectedChannel);

        // Auto-select best channel
        this.analyzeChannelContrast();

        // Hide previous results
        this.toggleSection('summarySection', false);
        this.toggleSection('resultsPanel', false);
        this.toggleSection('exportSection', false);
        ZoomPan.particles = [];
    },

    /**
     * Analyze channel contrast
     */
   analyzeChannelContrast: function() {
    if (!this.currentImageData) return;

    var rgbChannels = Detection.extractRGBChannels(this.currentImageData.imageData);
    var contrast = Detection.calculateContrastRatio(rgbChannels);

    // Auto-select best channel
    this.selectedChannel = contrast.bestChannel;

    // Update button states
    var rgbButtons = document.querySelectorAll('.rgb-btn');
    for (var i = 0; i < rgbButtons.length; i++) {
        var btnChannel = rgbButtons[i].getAttribute('data-channel');
        if (btnChannel === this.selectedChannel) {
            rgbButtons[i].classList.add('active');
        } else {
            rgbButtons[i].classList.remove('active');
        }
    }
},

    /**
     * Select RGB channel
     */
    selectChannel: function(e) {
        var channel = e.target.getAttribute('data-channel');
        this.selectedChannel = channel;

        // Update button states
        var rgbButtons = document.querySelectorAll('.rgb-btn');
        for (var i = 0; i < rgbButtons.length; i++) {
            if (rgbButtons[i].getAttribute('data-channel') === channel) {
                rgbButtons[i].classList.add('active');
            } else {
                rgbButtons[i].classList.remove('active');
            }
        }

        if (this.currentImageData) {
            renderChannelPreviews(this.currentImageData.imageData, channel);
        }
    },

    /**
     * Remove image from list
     */
    removeImage: function(filename) {
        var idx = -1;
        for (var i = 0; i < this.images.length; i++) {
            if (this.images[i].name === filename) {
                idx = i;
                break;
            }
        }

        if (idx > -1) {
            this.images.splice(idx, 1);

            // Remove from file list UI
            var fileList = document.getElementById('fileList');
            var items = fileList.querySelectorAll('.file-item');
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
    clearCanvas: function() {
        ZoomPan.particles = [];
        ZoomPan.drawEmptyCanvas();
        
        this.currentImageData = null;
        
        this.toggleSection('rgbStackSection', false);
        this.toggleSection('analysisSettings', false);
        this.toggleSection('summarySection', false);
        this.toggleSection('resultsPanel', false);
        this.toggleSection('exportSection', false);
        this.toggleSection('channelPreviewSection', false);
        
        this.setButtonState('analyzeBtn', false);
    },

    /**
     * Run particle analysis
     */
    runAnalysis: function() {
        if (!this.currentImageData || this.isAnalyzing) return;

        var self = this;
        this.isAnalyzing = true;
        this.setButtonState('analyzeBtn', false, '⏳ Analyzing...');
        UI.showLoading('Analyzing particles...');

        try {
            // Run analysis
            var results = ParticleAnalysis.analyzeParticles(
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
            this.toggleSection('exportSection', true);

            UI.hideLoading();
            UI.showSuccess('Found ' + results.totalParticles + ' particles!');

        } catch (error) {
            console.error('Analysis error:', error);
            UI.hideLoading();
            UI.showError('Analysis failed: ' + error.message);
        }

        this.isAnalyzing = false;
        this.setButtonState('analyzeBtn', true, '🔬 Analyze Particles');
    },

    /**
     * Update summary section
     */
    updateSummary: function(results) {
        this.toggleSection('summarySection', true);

        var coverage = ((results.totalArea / (results.imageWidth * results.imageHeight)) * 100).toFixed(2);

        var totalParticles = document.getElementById('totalParticles');
        var totalArea = document.getElementById('totalArea');
        var coveragePercent = document.getElementById('coveragePercent');

        if (totalParticles) totalParticles.textContent = Utils.formatNumber(results.totalParticles);
        if (totalArea) totalArea.textContent = Utils.formatNumber(results.totalArea) + ' px²';
        if (coveragePercent) coveragePercent.textContent = coverage + '%';
    },

    /**
     * Show results table
     */
    showResultsTable: function(results) {
        this.toggleSection('resultsPanel', true);

        var tbody = document.querySelector('#resultsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        for (var i = 0; i < results.particles.length; i++) {
            var particle = results.particles[i];
            var row = document.createElement('tr');
            row.innerHTML = '<td><strong>#' + particle.number + '</strong></td>' +
                '<td>' + particle.size + '</td>' +
                '<td>' + particle.meanR.toFixed(1) + '</td>' +
                '<td>' + particle.meanG.toFixed(1) + '</td>' +
                '<td>' + particle.meanB.toFixed(1) + '</td>' +
                '<td>' + particle.circularity.toFixed(3) + '</td>';
            tbody.appendChild(row);
        }
    },

    /**
     * Export to CSV
     */
    exportCSV: function() {
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
    exportPNG: function() {
        if (!this.analysisResults) {
            UI.showError('No analysis results to export');
            return;
        }

        var canvas = document.getElementById('imageCanvas');
        Export.exportToPNG(
            canvas,
            this.analysisResults.particles,
            this.analysisResults.imageWidth,
            this.analysisResults.imageHeight
        );
        UI.showSuccess('PNG exported successfully!');
    },

    /**
     * Toggle section visibility
     */
    toggleSection: function(id, show) {
        var section = document.getElementById(id);
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    },

    /**
     * Set button state
     */
    setButtonState: function(id, enabled, text) {
        var btn = document.getElementById(id);
        if (btn) {
            btn.disabled = !enabled;
            if (text) btn.textContent = text;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

/**
 * Render channel previews (module-level function)
 */
function renderChannelPreviews(imageData, selectedChannel) {
    var width = imageData.width;
    var height = imageData.height;

    // Get canvas elements
    var fullRgbCanvas = document.getElementById('fullRgbCanvas');
    var grayscaleCanvas = document.getElementById('grayscaleCanvas');
    var redCanvas = document.getElementById('redCanvas');
    var greenCanvas = document.getElementById('greenCanvas');
    var blueCanvas = document.getElementById('blueCanvas');
    var edgeCanvas = document.getElementById('edgeCanvas');

    if (!fullRgbCanvas) return;

    // Set canvas dimensions
    var canvases = [fullRgbCanvas, grayscaleCanvas, redCanvas, greenCanvas, blueCanvas, edgeCanvas];
    for (var c = 0; c < canvases.length; c++) {
        if (canvases[c]) {
            canvases[c].width = width;
            canvases[c].height = height;
        }
    }

    // Draw Full RGB
    var ctxFullRgb = fullRgbCanvas.getContext('2d');
    ctxFullRgb.putImageData(imageData, 0, 0);

    // Create grayscale
    var gray = Detection.toGrayscale(imageData);
    var grayImageData = Detection.createGrayscaleImageData(gray, width, height);
    grayscaleCanvas.getContext('2d').putImageData(grayImageData, 0, 0);

    // Extract RGB channels
    var data = imageData.data;
    var redChannel = new Uint8ClampedArray(width * height * 4);
    var greenChannel = new Uint8ClampedArray(width * height * 4);
    var blueChannel = new Uint8ClampedArray(width * height * 4);

    for (var i = 0; i < width * height; i++) {
        var idx = i * 4;

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
    var edgeSource;
    
    if (selectedChannel === 'red') {
        edgeSource = new Uint8Array(width * height);
        for (var j = 0; j < width * height; j++) {
            edgeSource[j] = data[j * 4];
        }
    } else if (selectedChannel === 'green') {
        edgeSource = new Uint8Array(width * height);
        for (var k = 0; k < width * height; k++) {
            edgeSource[k] = data[k * 4 + 1];
        }
    } else if (selectedChannel === 'blue') {
        edgeSource = new Uint8Array(width * height);
        for (var m = 0; m < width * height; m++) {
            edgeSource[m] = data[m * 4 + 2];
        }
    } else {
        edgeSource = gray;
    }

    // Apply Sobel edge detection
    var edge = Detection.sobelEdgeDetection(edgeSource, width, height);
    var edgeImageData = Detection.createEdgeImageData(edge, width, height);
    edgeCanvas.getContext('2d').putImageData(edgeImageData, 0, 0);

    // Show channel preview section
    var previewSection = document.getElementById('channelPreviewSection');
    if (previewSection) {
        previewSection.style.display = 'block';
    }
}
