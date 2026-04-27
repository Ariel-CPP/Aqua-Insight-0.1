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
        
        // Draw original image
        ctx.drawImage(canvas, 0, 0);
        
        // Draw particle overlay
        ctx.save();
        // Adjust for any offset/scale if needed
        ZoomPan.drawParticleOverlayOnContext(ctx, particles);
        ctx.restore();
        
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
    },

    /**
     * Generate summary report
     */
    generateSummaryReport(data) {
        const { particles, totalParticles, totalArea, imageWidth, imageHeight } = data;
        
        // Calculate statistics
        const sizes = particles.map(p => p.size);
        const circularities = particles.map(p => p.circularity);
        
        const avgSize = sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
        const minSize = Math.min(...sizes);
        const maxSize = Math.max(...sizes);
        
        const avgCirc = circularities.length > 0 ? circularities.reduce((a, b) => a + b, 0) / circularities.length : 0;
        
        const coveragePercent = ((totalArea / (imageWidth * imageHeight)) * 100).toFixed(2);
        
        return {
            totalParticles,
            totalArea,
            imageArea: imageWidth * imageHeight,
            coveragePercent,
            sizeStats: { avg: avgSize, min: minSize, max: maxSize },
            circularityStats: { avg: avgCirc }
        };
    }
};

// Export for use in other modules
window.Export = Export;
