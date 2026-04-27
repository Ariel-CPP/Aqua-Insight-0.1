/**
 * Particle Analyzer - Aqua Insight
 * Simple, Fast, No Dependencies
 */

// ==================== STATE ====================
var state = {
    image: null,           // Original HTMLImageElement
    imageData: null,       // Original ImageData
    width: 0,
    height: 0,
    channel: 'red',
    threshold: 128,
    invert: false,
    minSize: 10,
    maxSize: 10000,
    particles: [],
    analyzed: false
};

// ==================== DOM ELEMENTS ====================
var elements = {
    canvas: null,
    ctx: null,
    previewCanvas: null,
    previewCtx: null,
    fileInput: null,
    uploadBox: null,
    analyzeBtn: null,
    exportCsvBtn: null,
    exportPngBtn: null,
    thresholdSlider: null,
    minSizeSlider: null,
    maxSizeSlider: null,
    invertCheck: null,
    channelBtns: null
};

// ==================== INITIALIZATION ====================
function init() {
    // Get elements
    elements.canvas = document.getElementById('mainCanvas');
    elements.ctx = elements.canvas.getContext('2d');
    elements.previewCanvas = document.getElementById('previewCanvas');
    elements.previewCtx = elements.previewCanvas.getContext('2d');
    elements.fileInput = document.getElementById('fileInput');
    elements.uploadBox = document.getElementById('uploadBox');
    elements.analyzeBtn = document.getElementById('analyzeBtn');
    elements.exportCsvBtn = document.getElementById('exportCsvBtn');
    elements.exportPngBtn = document.getElementById('exportPngBtn');
    elements.thresholdSlider = document.getElementById('thresholdSlider');
    elements.minSizeSlider = document.getElementById('minSizeSlider');
    elements.maxSizeSlider = document.getElementById('maxSizeSlider');
    elements.invertCheck = document.getElementById('invertCheck');
    elements.channelBtns = document.querySelectorAll('.channel-btn');

    // Bind events
    bindEvents();
    
    console.log('✅ Particle Analyzer initialized');
}

function bindEvents() {
    // File upload
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.uploadBox.addEventListener('click', function() {
        elements.fileInput.click();
    });
    
    // Drag and drop
    elements.uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        elements.uploadBox.style.background = 'rgba(56, 189, 248, 0.2)';
    });
    
    elements.uploadBox.addEventListener('dragleave', function() {
        elements.uploadBox.style.background = '';
    });
    
    elements.uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        elements.uploadBox.style.background = '';
        if (e.dataTransfer.files.length > 0) {
            elements.fileInput.files = e.dataTransfer.files;
            handleFileUpload();
        }
    });
    
    // Channel buttons
    elements.channelBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            elements.channelBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state.channel = btn.dataset.channel;
            document.getElementById('channelValue').textContent = btn.textContent.replace(/[🔴🟢🔵⚪]/g, '').trim();
            updatePreview();
            if (state.analyzed) runAnalysis();
        });
    });
    
    // Threshold slider
    elements.thresholdSlider.addEventListener('input', function() {
        state.threshold = parseInt(this.value);
        document.getElementById('thresholdValue').textContent = state.threshold;
        updatePreview();
        if (state.analyzed) runAnalysis();
    });
    
    // Invert checkbox
    elements.invertCheck.addEventListener('change', function() {
        state.invert = this.checked;
        updatePreview();
        if (state.analyzed) runAnalysis();
    });
    
    // Size sliders
    elements.minSizeSlider.addEventListener('input', function() {
        state.minSize = parseInt(this.value);
        document.getElementById('minSizeValue').textContent = state.minSize;
        if (state.analyzed) runAnalysis();
    });
    
    elements.maxSizeSlider.addEventListener('input', function() {
        state.maxSize = parseInt(this.value);
        document.getElementById('maxSizeValue').textContent = state.maxSize;
        if (state.analyzed) runAnalysis();
    });
    
    // Analyze button
    elements.analyzeBtn.addEventListener('click', runAnalysis);
    
    // Export buttons
    elements.exportCsvBtn.addEventListener('click', exportCSV);
    elements.exportPngBtn.addEventListener('click', exportPNG);
}

// ==================== FILE HANDLING ====================
function handleFileUpload() {
    var file = elements.fileInput.files[0];
    if (!file) return;
    
    showToast('Loading image...');
    
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            // Store image
            state.image = img;
            state.width = img.width;
            state.height = img.height;
            
            // Set canvas size
            elements.canvas.width = state.width;
            elements.canvas.height = state.height;
            
            // Draw image
            elements.ctx.drawImage(img, 0, 0);
            
            // Get image data
            state.imageData = elements.ctx.getImageData(0, 0, state.width, state.height);
            
            // Setup preview canvas
            elements.previewCanvas.width = state.width;
            elements.previewCanvas.height = state.height;
            
            // Update preview
            updatePreview();
            
            // Enable buttons
            elements.analyzeBtn.disabled = false;
            
            // Reset state
            state.analyzed = false;
            state.particles = [];
            
            showToast('Image loaded! Click Analyze to detect particles.');
        };
        img.onerror = function() {
            showToast('Failed to load image');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== IMAGE PROCESSING ====================
function updatePreview() {
    if (!state.imageData) return;
    
    var channel = state.channel;
    var threshold = state.threshold;
    var invert = state.invert;
    
    var data = state.imageData.data;
    var width = state.width;
    var height = state.height;
    
    // Create output image
    var output = elements.previewCtx.createImageData(width, height);
    var outData = output.data;
    
    // Extract selected channel
    var channelData = new Uint8Array(width * height);
    
    for (var i = 0; i < width * height; i++) {
        var idx = i
