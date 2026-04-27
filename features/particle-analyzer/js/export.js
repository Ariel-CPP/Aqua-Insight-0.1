/**
 * export.js - Data Export Functions (CSV & PNG)
 * Aqua Insight - Particle Analyzer
 */

const Export = {
    /**
     * Export results to CSV
     */
    exportToCSV(data) {
        const { particles, totalParticles, totalArea, imageWidth, imageHeight } = data;
        
        // CSV Header
        const headers = ['No', 'Size (px²)', 'Mean R', 'Mean G', 'Mean B', 'Circularity'];
        
        // Calculate coverage
        const coveragePercent = ((totalArea / (imageWidth * imageHeight)) * 100).toFixed(2);
        
        // Build CSV content
        let csv = 'AQUA INSIGHT - PARTICLE ANALYSIS REPORT\n';
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Image Size: ${imageWidth} x ${imageHeight}\n`;
        csv += `Total Particles: ${totalParticles}\n`;
        csv += `Total Area: ${totalArea} px²\n`;
        csv += `Coverage: ${coveragePercent}%\n\n`;
        
        csv += headers.join(',') + '\n';
        
        // Data rows
        particles.forEach(p => {
            csv += `${p.number},${p.size},${p.meanR.toFixed(2)},${p.meanG.toFixed(2)},${p.meanB.toFixed(2)},${p.circularity.toFixed(3)}\n`;
        });
        
        // Download CSV
        this.downloadFile(csv, 'particle-analysis-report.csv', 'text/csv');
    },

    /**
     * Export canvas to PNG with overlay
     */
    exportToPNG(canvas, particles, imageWidth, imageHeight) {
        // Create a new canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = imageWidth;
        exportCanvas.height = imageHeight;
        const ctx = exportCanvas.getContext('2d');
        
        // Get original image from ZoomPan
        if (ZoomPan.image) {
            ctx.drawImage(ZoomPan.image, 0, 0);
        }
        
        // Draw particle overlay
        this.drawParticleOverlayOnContext(ctx, particles, imageWidth, imageHeight);
        
        // Convert to blob and download
        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'particle-analysis-overlay.png';
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    },

    /**
     * Draw particle overlay on context
     */
    drawParticleOverlayOnContext(ctx, particles, width, height) {
        particles.forEach(particle => {
            const { centroid, number, size } = particle;
            const x = centroid.x;
            const y = centroid.y;
            
            // Calculate radius
            const radius = Math.sqrt(size / Math.PI);
            
            // Draw bounding circle
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw filled circle
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
            ctx.fill();
            
            // Calculate label position
            const labelY = y - radius - 18;
            const labelRadius = 12;
            
            // Draw label background
            ctx.beginPath();
            ctx.arc(x, labelY, labelRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 40, 60, 0.95)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Draw number
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), x, labelY);
        });
    },

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
};

// Export for use in other modules
window.Export = Export;
