/**
 * Particle Analyzer - Aqua Insight
 * Simple, Fast, No Dependencies
 */

// ==================== STATE ====================
var state = {
    image: null,
    imageData: null,
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
var el = {};

// ==================== INIT ====================
function init() {
    // Get elements
    el.canvas = document.getElementById('mainCanvas');
    el.ctx = el.canvas.getContext('2d');
    el.previewCanvas = document.getElementById('previewCanvas');
    el.previewCtx = el.previewCanvas.getContext('2d');
    el.fileInput = document.getElementById('fileInput');
    el.uploadBox = document.getElementById('uploadBox');
    el.analyzeBtn = document.getElementById('analyzeBtn');
    el.exportCsvBtn = document.getElementById('exportCsvBtn');
    el.exportPngBtn = document.getElementById('exportPngBtn');
    el.thresholdSlider = document.getElementById('thresholdSlider');
    el.minSizeSlider = document.getElementById('minSizeSlider');
    el.maxSizeSlider = document.getElementById('maxSizeSlider');
    el.invertCheck = document.getElementById('invertCheck');

    bindEvents();
    console.log('✅ Particle Analyzer ready');
}

function bindEvents() {
    // File upload
    el.fileInput.addEventListener('change', handleFileUpload);
    el.uploadBox.addEventListener('click', function() {
        el.fileInput.click();
    });
    
    // Drag and drop
    el.uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        el.uploadBox.classList.add('dragover');
    });
    
    el.uploadBox.addEventListener('dragleave', function() {
        el.uploadBox.classList.remove('dragover');
    });
    
    el.uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        el.uploadBox.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            el.fileInput.files = e.dataTransfer.files;
            handleFileUpload();
        }
    });
    
    // Channel buttons
    var channelBtns = document.querySelectorAll('.channel-btn');
    channelBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            channelBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state.channel = btn.dataset.channel;
            document.getElementById('channelValue').textContent = btn.textContent.replace(/[🔴🟢🔵⚪]/g, '').trim();
            updatePreview();
            if (state.analyzed) runAnalysis();
        });
    });
    
    // Threshold slider
    el.thresholdSlider.addEventListener('input', function() {
        state.threshold = parseInt(this.value);
        document.getElementById('thresholdValue').textContent = state.threshold;
        updatePreview();
        if (state.analyzed) runAnalysis();
    });
    
    // Invert checkbox
    el.invertCheck.addEventListener('change', function() {
        state.invert = this.checked;
        updatePreview();
        if (state.analyzed) runAnalysis();
    });
    
       // Size sliders
    el.minSizeSlider.addEventListener('input', function() {
        state.minSize = parseInt(this.value);
        document.getElementById('minSizeValue').textContent = state.minSize;
        if (state.analyzed) runAnalysis();
    });
    
    el.maxSizeSlider.addEventListener('input', function() {
        state.maxSize = parseInt(this.value);
        document.getElementById('maxSizeValue').textContent = state.maxSize;
        if (state.analyzed) runAnalysis();
    });
    
    // Analyze button
    el.analyzeBtn.addEventListener('click', runAnalysis);
    
    // Export buttons
    el.exportCsvBtn.addEventListener('click', exportCSV);
    el.exportPngBtn.addEventListener('click', exportPNG);
}

// ==================== FILE HANDLING ====================
function handleFileUpload() {
    var file = el.fileInput.files[0];
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
            el.canvas.width = state.width;
            el.canvas.height = state.height;
            
            // Draw image
            el.ctx.drawImage(img, 0, 0);
            
            // Get image data
            state.imageData = el.ctx.getImageData(0, 0, state.width, state.height);
            
            // Setup preview canvas
            el.previewCanvas.width = state.width;
            el.previewCanvas.height = state.height;
            
            // Update preview
            updatePreview();
            
            // Enable analyze button
            el.analyzeBtn.disabled = false;
            
            // Reset analysis state
            state.analyzed = false;
            state.particles = [];
            
            // Hide previous results
            document.getElementById('statsPanel').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'none';
            el.exportCsvBtn.disabled = true;
            el.exportPngBtn.disabled = true;
            
            showToast('Image loaded! Click Analyze to detect particles.');
        };
        img.onerror = function() {
            showToast('Failed to load image');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== PREVIEW ====================
function updatePreview() {
    if (!state.imageData) return;
    
    var data = state.imageData.data;
    var width = state.width;
    var height = state.height;
    
    // Create output image
    var output = el.previewCtx.createImageData(width, height);
    var outData = output.data;
    
    // Extract selected channel and apply threshold
    for (var i = 0; i < width * height; i++) {
        var idx = i * 4;
        var value;
        
        // Get channel value
        if (state.channel === 'red') {
            value = data[idx];
        } else if (state.channel === 'green') {
            value = data[idx + 1];
        } else if (state.channel === 'blue') {
            value = data[idx + 2];
        } else {
            // Gray
            value = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        }
        
        // Apply threshold
        if (state.invert) {
            value = value <= state.threshold ? 255 : 0;
        } else {
            value = value >= state.threshold ? 255 : 0;
        }
        
        outData[idx] = value;
        outData[idx + 1] = value;
        outData[idx + 2] = value;
        outData[idx + 3] = 255;
    }
    
    el.previewCtx.putImageData(output, 0, 0);
    
    // Update label
    var labels = {
        'red': 'Red Channel',
        'green': 'Green Channel',
        'blue': 'Blue Channel',
        'gray': 'Grayscale'
    };
    document.getElementById('previewLabel').textContent = labels[state.channel];
}

// ==================== ANALYSIS ====================
function runAnalysis() {
    if (!state.imageData) return;
    
    showToast('Analyzing particles...');
    
    var data = state.imageData.data;
    var width = state.width;
    var height = state.height;
    
    // Step 1: Create binary mask from selected channel
    var binaryMask = new Uint8Array(width * height);
    
    for (var i = 0; i < width * height; i++) {
        var idx = i * 4;
        var value;
        
        if (state.channel === 'red') {
            value = data[idx];
        } else if (state.channel === 'green') {
            value = data[idx + 1];
        } else if (state.channel === 'blue') {
            value = data[idx + 2];
        } else {
            value = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
        }
        
        if (state.invert) {
            binaryMask[i] = value <= state.threshold ? 1 : 0;
        } else {
            binaryMask[i] = value >= state.threshold ? 1 : 0;
        }
    }
    
    // Step 2: Find connected particles
    var visited = new Uint8Array(width * height);
    var particles = [];
    
    for (var i = 0; i < width * height; i++) {
        if (visited[i] === 1 || binaryMask[i] === 0) continue;
        
        var pixelCoords = floodFill(i, binaryMask, visited, width, height);
        
        if (pixelCoords.length >= state.minSize && pixelCoords.length <= state.maxSize) {
            var particle = calculateProperties(pixelCoords, data, width, height);
            particles.push(particle);
        }
    }
    
    // Step 3: Sort by size
    particles.sort(function(a, b) {
        return b.size - a.size;
    });
    
    // Step 4: Assign numbers
    for (var i = 0; i < particles.length; i++) {
        particles[i].number = i + 1;
    }
    
    state.particles = particles;
    state.analyzed = true;
    
    // Update UI
    updateStats();
    drawOverlay();
    updateResultsTable();
    
    el.exportCsvBtn.disabled = false;
    el.exportPngBtn.disabled = false;
    
    showToast('Found ' + particles.length + ' particles!');
}

// ==================== FLOOD FILL ====================
function floodFill(startIdx, binaryMask, visited, width, height) {
    var pixels = [];
    var queue = [startIdx];
    visited[startIdx] = 1;
    
    while (queue.length > 0) {
        var current = queue.shift();
        var x = current % width;
        var y = Math.floor(current / width);
        
        pixels.push({ x: x, y: y, idx: current });
        
        // 4-connectivity
        var neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (var n = 0; n < neighbors.length; n++) {
            var nx = x + neighbors[n][0];
            var ny = y + neighbors[n][1];
            
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

// ==================== CALCULATE PROPERTIES ====================
function calculateProperties(pixels, imageData, width, height) {
    var size = pixels.length;
    
    if (size === 0) {
        return { size: 0, centroid: { x: 0, y: 0 }, perimeter: 0, circularity: 0, meanR: 0, meanG: 0, meanB: 0 };
    }
    
    var data = imageData.data;
    var sumX = 0, sumY = 0;
    var sumR = 0, sumG = 0, sumB = 0;
    
    for (var i = 0; i < size; i++) {
        // ✅ FIX: Use idx * 4 because ImageData stores RGBA (4 bytes per pixel)
        var idx = pixels[i].idx * 4;
        sumX += pixels[i].x;
        sumY += pixels[i].y;
        sumR += data[idx];       // Red
        sumG += data[idx + 1];   // Green
        sumB += data[idx + 2];   // Blue
    }
    
    var centroid = { x: sumX / size, y: sumY / size };
    var perimeter = calculatePerimeter(pixels, width, height);
    var circularity = perimeter > 0 ? Math.min((4 * Math.PI * size) / (perimeter * perimeter), 1) : 0;
    
    return {
        size: size,
        centroid: centroid,
        perimeter: perimeter,
        circularity: circularity,
        meanR: sumR / size,
        meanG: sumG / size,
        meanB: sumB / size
    };
}

function calculatePerimeter(pixels, width, height) {
    if (pixels.length === 0) return 0;
    
    var pixelSet = {};
    for (var i = 0; i < pixels.length; i++) {
        pixelSet[pixels[i].idx] = true;
    }
    
    var count = 0;
    var neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (var i = 0; i < pixels.length; i++) {
        var p = pixels[i];
        
        for (var n = 0; n < neighbors.length; n++) {
            var nx = p.x + neighbors[n][0];
            var ny = p.y + neighbors[n][1];
            var nIdx = ny * width + nx;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || !pixelSet[nIdx]) {
                count++;
            }
        }
    }
    
    return count;
}

// ==================== UPDATE UI ====================
function updateStats() {
    var totalArea = 0;
    for (var i = 0; i < state.particles.length; i++) {
        totalArea += state.particles[i].size;
    }
    
    var coverage = (totalArea / (state.width * state.height) * 100).toFixed(2);
    
    document.getElementById('totalParticles').textContent = state.particles.length;
    document.getElementById('totalArea').textContent = formatNumber(totalArea) + ' px²';
    document.getElementById('coverage').textContent = coverage + '%';
    document.getElementById('statsPanel').style.display = 'block';
}

function updateResultsTable() {
    var tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    var maxRows = 100;
    for (var i = 0; i < Math.min(state.particles.length, maxRows); i++) {
        var p = state.particles[i];
        var tr = document.createElement('tr');
        tr.innerHTML = 
            '<td>#' + p.number + '</td>' +
            '<td>' + p.size + '</td>' +
            '<td>' + p.meanR.toFixed(1) + '</td>' +
            '<td>' + p.meanG.toFixed(1) + '</td>' +
            '<td>' + p.meanB.toFixed(1) + '</td>' +
            '<td>' + p.circularity.toFixed(3) + '</td>';
        tbody.appendChild(tr);
    }
    
    if (state.particles.length > maxRows) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align: center; color: #64748b;">... and ' + (state.particles.length - maxRows) + ' more</td>';
        tbody.appendChild(tr);
    }
    
    document.getElementById('resultsSection').style.display = 'block';
}

// ==================== DRAW OVERLAY ====================
function drawOverlay() {
    if (!state.image) return;
    
    // Redraw original image
    el.ctx.clearRect(0, 0, state.width, state.height);
    el.ctx.drawImage(state.image, 0, 0);
    
    // Draw particles
    for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        var x = p.centroid.x;
        var y = p.centroid.y;
        var radius = Math.sqrt(p.size / Math.PI);
        
        // Circle outline
        el.ctx.beginPath();
        el.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        el.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        el.ctx.lineWidth = 2;
        el.ctx.stroke();
        
        // Circle fill
        el.ctx.beginPath();
        el.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        el.ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        el.ctx.fill();
        
        // Number label
        var labelY = y - radius - 8;
        if (labelY < 12) labelY = y + radius + 12;
        
        el.ctx.beginPath();
        el.ctx.arc(x, labelY, 7, 0, Math.PI * 2);
        el.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        el.ctx.fill();
        el.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        el.ctx.lineWidth = 1;
        el.ctx.stroke();
        
        el.ctx.fillStyle = '#38bdf8';
        el.ctx.font = 'bold 9px Inter, sans-serif';
        el.ctx.textAlign = 'center';
        el.ctx.textBaseline = 'middle';
        el.ctx.fillText(p.number.toString(), x, labelY);
    }
}

// ==================== EXPORT ====================
function exportCSV() {
    if (state.particles.length === 0) return;
    
    var csv = 'AQUA INSIGHT - PARTICLE ANALYSIS\n';
    csv += 'Date,' + new Date().toLocaleString() + '\n';
    csv += 'Image,' + state.width + 'x' + state.height + '\n';
    csv += 'Channel,' + state.channel + '\n';
    csv += 'Threshold,' + state.threshold + '\n';
    csv += 'Total Particles,' + state.particles.length + '\n\n';
    
    csv += 'No,Size,Centroid X,Centroid Y,Mean R,Mean G,Mean B,Circularity\n';
    
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
    
    var exportCanvas = document.createElement('canvas');
    exportCanvas.width = state.width;
    exportCanvas.height = state.height;
    var ctx = exportCanvas.getContext('2d');
    
    ctx.drawImage(state.image, 0, 0);
    
    // Draw overlay
    for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        var x = p.centroid.x;
        var y = p.centroid.y;
        var radius = Math.sqrt(p.size / Math.PI);
        
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fill();
        
        var labelY = y - radius - 8;
        if (labelY < 12) labelY = y + radius + 12;
        
        ctx.beginPath();
        ctx.arc(x, labelY, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.number.toString(), x, labelY);
    }
    
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
