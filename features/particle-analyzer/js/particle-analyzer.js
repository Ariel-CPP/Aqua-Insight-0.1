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
        var idx = i * 4;
        if (channel === 'red') {
            channelData[i] = data[idx];
        } else if (channel === 'green') {
            channelData[i] = data[idx + 1];
        } else if (channel === 'blue') {
            channelData[i] = data[idx + 2];
        } else {
            // Gray - convert RGB to grayscale
            channelData[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        }
    }
    
    // Apply threshold
    for (var i = 0; i < width * height; i++) {
        var idx = i * 4;
        var value;
        
        if (invert) {
            // Dark background: low values = foreground
            value = channelData[i] <= threshold ? 255 : 0;
        } else {
            // Light background: high values = foreground
            value = channelData[i] >= threshold ? 255 : 0;
        }
        
        outData[idx] = value;
        outData[idx + 1] = value;
        outData[idx + 2] = value;
        outData[idx + 3] = 255;
    }
    
    elements.previewCtx.putImageData(output, 0, 0);
    
    // Update label
    var labels = {
        'red': 'Red Channel',
        'green': 'Green Channel',
        'blue': 'Blue Channel',
        'gray': 'Grayscale'
    };
    document.getElementById('previewLabel').textContent = labels[channel] + ' (Threshold: ' + threshold + ')';
}

// ==================== PARTICLE ANALYSIS ====================
function runAnalysis() {
    if (!state.imageData) return;
    
    showToast('Analyzing particles...');
    
    var data = state.imageData.data;
    var width = state.width;
    var height = state.height;
    var threshold = state.threshold;
    var invert = state.invert;
    var minSize = state.minSize;
    var maxSize = state.maxSize;
    
    // Step 1: Extract selected channel
    var channelData = new Uint8Array(width * height);
    
    for (var i = 0; i < width * height; i++) {
        var idx = i * 4;
        if (state.channel === 'red') {
            channelData[i] = data[idx];
        } else if (state.channel === 'green') {
            channelData[i] = data[idx + 1];
        } else if (state.channel === 'blue') {
            channelData[i] = data[idx + 2];
        } else {
            channelData[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        }
    }
    
    // Step 2: Create binary mask
    var binaryMask = new Uint8Array(width * height);
    
    for (var i = 0; i < width * height; i++) {
        if (invert) {
            binaryMask[i] = channelData[i] <= threshold ? 1 : 0;
        } else {
            binaryMask[i] = channelData[i] >= threshold ? 1 : 0;
        }
    }
    
    // Step 3: Find connected particles using flood fill
    var visited = new Uint8Array(width * height);
    var particles = [];
    
    for (var i = 0; i < width * height; i++) {
        // Skip if already visited or background
        if (visited[i] === 1 || binaryMask[i] === 0) continue;
        
        // Found a new particle - flood fill
        var pixelCoords = floodFill(i, binaryMask, visited, width, height);
        
        if (pixelCoords.length >= minSize && pixelCoords.length <= maxSize) {
            var particle = calculateParticleProperties(pixelCoords, data, width, height);
            particles.push(particle);
        }
    }
    
    // Step 4: Sort by size (largest first)
    particles.sort(function(a, b) {
        return b.size - a.size;
    });
    
    // Step 5: Assign numbers
    for (var i = 0; i < particles.length; i++) {
        particles[i].number = i + 1;
    }
    
    // Store results
    state.particles = particles;
    state.analyzed = true;
    
    // Update UI
    updateStats();
    drawOverlay();
    updateResultsTable();
    
    // Enable export buttons
    elements.exportCsvBtn.disabled = false;
    elements.exportPngBtn.disabled = false;
    
    showToast('Found ' + particles.length + ' particles!');
}

// ==================== FLOOD FILL ====================
function floodFill(startIdx, binaryMask, visited, width, height) {
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
            var nx = x + neighbors[n][0];
            var ny = y + neighbors[n][1];
            
            // Bounds check
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                var nIdx = ny * width + nx;
                if (visited[nIdx] === 0 && binaryMask[nIdx] === 1) {
                    visited[nIdx] = 1;
                    queue.push(nIdx);
                }
            }
        }
        
        // Safety limit
        if (pixels.length > 100000) break;
    }
    
    return pixels;
}

// ==================== CALCULATE PARTICLE PROPERTIES ====================
function calculateParticleProperties(pixels, imageData, width, height) {
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
    
    var data = imageData.data;
    
    // Calculate centroid and mean RGB
    var sumX = 0, sumY = 0;
    var sumR = 0, sumG = 0, sumB = 0;
    
    for (var i = 0; i < size; i++) {
        var pixel = pixels[i];
        sumX += pixel.x;
        sumY += pixel.y;
        sumR += data[pixel.idx];
        sumG += data[pixel.idx + 1];
        sumB += data[pixel.idx + 2];
    }
    
    var centroid = {
        x: sumX / size,
        y: sumY / size
    };
    
    var meanR = sumR / size;
    var meanG = sumG / size;
    var meanB = sumB / size;
    
    // Calculate perimeter
    var perimeter = calculatePerimeter(pixels, width, height);
    
    // Calculate circularity: 4π × Area / Perimeter²
    var circularity = perimeter > 0 ? (4 * Math.PI * size) / (perimeter * perimeter) : 0;
    circularity = Math.min(circularity, 1);
    
    return {
        size: size,
        centroid: centroid,
        perimeter: perimeter,
        circularity: circularity,
        meanR: meanR,
        meanG: meanG,
        meanB: meanB
    };
}

// ==================== CALCULATE PERIMETER ====================
function calculatePerimeter(pixels, width, height) {
    if (pixels.length === 0) return 0;
    
    // Create pixel lookup
    var pixelSet = {};
    for (var i = 0; i < pixels.length; i++) {
        pixelSet[pixels[i].idx] = true;
    }
    
    var boundaryCount = 0;
    var neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (var i = 0; i < pixels.length; i++) {
        var p = pixels[i];
        
        for (var n = 0; n < neighbors.length; n++) {
            var nx = p.x + neighbors[n][0];
            var ny = p.y + neighbors[n][1];
            var nIdx = ny * width + nx;
            
            // If neighbor is outside particle or background
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || !pixelSet[nIdx]) {
                boundaryCount++;
            }
        }
    }
    
    return boundaryCount;
}

// ==================== UPDATE UI ====================
function updateStats() {
    var particles = state.particles;
    var totalArea = 0;
    
    for (var i = 0; i < particles.length; i++) {
        totalArea += particles[i].size;
    }
    
    var coverage = (totalArea / (state.width * state.height) * 100).toFixed(2);
    
    document.getElementById('totalParticles').textContent = particles.length;
    document.getElementById('totalArea').textContent = formatNumber(totalArea) + ' px²';
    document.getElementById('coverage').textContent = coverage + '%';
    document.getElementById('statsPanel').style.display = 'block';
}

function updateResultsTable() {
    var tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    var particles = state.particles;
    var maxRows = 100; // Limit display
    
    for (var i = 0; i < Math.min(particles.length, maxRows); i++) {
        var p = particles[i];
        var row = document.createElement('tr');
        row.innerHTML = 
            '<td>#' + p.number + '</td>' +
            '<td>' + p.size + '</td>' +
            '<td>' + p.meanR.toFixed(1) + '</td>' +
            '<td>' + p.meanG.toFixed(1) + '</td>' +
            '<td>' + p.meanB.toFixed(1) + '</td>' +
            '<td>' + p.circularity.toFixed(3) + '</td>';
        tbody.appendChild(row);
    }
    
    if (particles.length > maxRows) {
        var moreRow = document.createElement('tr');
        moreRow.innerHTML = '<td colspan="6" style="text-align: center; color: #64748b;">... and ' + (particles.length - maxRows) + ' more</td>';
        tbody.appendChild(moreRow);
    }
    
    document.getElementById('tableContainer').style.display = 'block';
}

// ==================== DRAW OVERLAY ====================
function drawOverlay() {
    if (!state.image) return;
    
    var particles = state.particles;
    
    // Clear and redraw original image
    elements.ctx.clearRect(0, 0, state.width, state.height);
    elements.ctx.drawImage(state.image, 0, 0);
    
    // Draw particles
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var x = p.centroid.x;
        var y = p.centroid.y;
        var radius = Math.sqrt(p.size / Math.PI);
        
        // Draw bounding circle
        elements.ctx.beginPath();
        elements.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        elements.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        elements.ctx.lineWidth = 2;
        elements.ctx.stroke();
        
        // Draw filled circle
        elements.ctx.beginPath();
        elements.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        elements.ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        elements.ctx.fill();
        
        // Draw number label
        var labelY = y - radius - 10;
        if (labelY < 15) labelY = y + radius + 15;
        
        elements.ctx.beginPath();
        elements.ctx.arc(x, labelY, 8, 0, Math.PI * 2);
        elements.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        elements.ctx.fill();
        elements.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        elements.ctx.lineWidth = 1;
        elements.ctx.stroke();
        
        elements.ctx.fillStyle = '#38bdf8';
        elements.ctx.font = 'bold 10px Inter, sans-serif';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText(p.number.toString(), x, labelY);
    }
}

// ==================== EXPORT ====================
function exportCSV() {
    if (state.particles.length === 0) return;
    
    var csv = 'AQUA INSIGHT - PARTICLE ANALYSIS REPORT\n';
    csv += 'Generated: ' + new Date().toLocaleString() + '\n';
    csv += 'Image Size: ' + state.width + ' x ' + state.height + '\n';
    csv += 'Channel: ' + state.channel + '\n';
    csv += 'Threshold: ' + state.threshold + '\n';
    csv += 'Total Particles: ' + state.particles.length + '\n\n';
    
    csv += 'No,Size (px²),Centroid X,Centroid Y,Mean R,Mean G,Mean B,Circularity\n';
    
    for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        csv += p.number + ',' + p.size + ',' + 
               p.centroid.x.toFixed(1) + ',' + p.centroid.y.toFixed(1) + ',' +
               p.meanR.toFixed(2) + ',' + p.meanG.toFixed(2) + ',' + p.meanB.toFixed(2) + ',' +
               p.circularity.toFixed(4) + '\n';
    }
    
    downloadFile(csv, 'particle-analysis.csv', 'text/csv');
    showToast('CSV exported!');
}

function exportPNG() {
    if (!state.image) return;
    
    // Create export canvas
    var exportCanvas = document.createElement('canvas');
    exportCanvas.width = state.width;
    exportCanvas.height = state.height;
    var ctx = exportCanvas.getContext('2d');
    
    // Draw original image
    ctx.drawImage(state.image, 0, 0);
    
    // Draw particles overlay
    for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        var x = p.centroid.x;
        var y = p.centroid.y;
        var radius = Math.sqrt(p.size / Math.PI);
        
        // Draw bounding circle
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw filled circle
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fill();
        
        // Draw number label
        var labelY = y - radius - 10;
        if (labelY < 15) labelY = y + radius + 15;
        
        ctx.beginPath();
        ctx.arc(x, labelY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.number.toString(), x, labelY);
    }
    
    // Download
    exportCanvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'particle-analysis.png';
        link.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
    
    showToast('PNG exported!');
}

// ==================== UTILITIES ====================
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== START ====================
document.addEventListener('DOMContentLoaded', init);
    
